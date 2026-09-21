import os
import sys
import time
import signal
import threading
import logging
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from hardware.gpio_controller import gpio_controller
from hardware.hydraulic_controller import hydraulic_controller
from hardware.wifi_manager import wifi_manager
from hardware.cloud_sync import cloud_sync
from hardware.profile_manager import profile_manager
from sensors.dht_sensor import sensor_manager

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s: %(message)s')
logger = logging.getLogger("TetascoBackend")

# Path ke direktori build frontend (dist)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DIST_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "dist"))

app = Flask(__name__, static_folder=os.path.join(DIST_DIR, "assets"), static_url_path="/assets")
CORS(app)

# State Kontrol Cerdas (Smart Controller State)
control_state = {
    "device_status": "STANDBY",         # Default SIAGA saat fresh boot (aktuator aman mati)
    "auto": False,                      # Default MANUAL agar relay tidak menyala-mati sendiri
    "target_temp": 37.8,
    "target_hum": 55.0,
    "profile": None,                    # Saat SIAGA tidak ada pilihan profil yang aktif
    "current_day": 0,
    "total_days": 21,
    "incubation_start_time": None,
    "rack_timer_interval_minutes": 120, # Putar rak setiap 2 jam
    "rack_rotation_duration_seconds": 15,
    "last_rack_rotation": time.time(),
}

# -------------------------------------------------------------
# Background Thread: Kontrol Otomatis Suhu, Kelembaban, & Rak
# -------------------------------------------------------------
stop_event = threading.Event()

def smart_control_loop():
    logger.info("Thread Kontrol Cerdas Tetasco Connect aktif.")
    while not stop_event.is_set():
        try:
            current_actuators = gpio_controller.get_all_actuators()
            lamp_1_on = current_actuators.get('lamp_1', False)
            lamp_2_on = current_actuators.get('lamp_2', False)
            fan_on = current_actuators.get('fan', False)
            mist_on = current_actuators.get('mist_maker', False)

            # Baca sensor terkini
            reading = sensor_manager.read(lamp_1_on or lamp_2_on, fan_on, mist_on)
            temp = reading["temperature"]
            hum = reading["humidity"]

            # Kontrol otomatis HANYA berjalan jika status perangkat RUNNING, mode AUTO aktif, DAN sensor fisik terhubung
            if control_state.get("device_status") == "RUNNING" and control_state["auto"] and sensor_manager.is_hardware_active:
                target_t = control_state["target_temp"]
                target_h = control_state["target_hum"]

                # 1. Kontrol Suhu Presisi 2-Tahap (Dual Stage Lamps):
                if temp < (target_t - 0.4):
                    # Suhu drop cukup jauh: aktifkan kedua lampu pemanas
                    if not lamp_1_on:
                        gpio_controller.set_actuator('lamp_1', True)
                    if not lamp_2_on:
                        gpio_controller.set_actuator('lamp_2', True)
                    if fan_on:
                        gpio_controller.set_actuator('fan', False)
                elif temp < target_t:
                    # Suhu mendekati target: cukup 1 lampu pemanas aktif
                    if not lamp_1_on:
                        gpio_controller.set_actuator('lamp_1', True)
                    if lamp_2_on:
                        gpio_controller.set_actuator('lamp_2', False)
                    if fan_on:
                        gpio_controller.set_actuator('fan', False)
                elif temp >= target_t:
                    # Target tercapai: matikan kedua lampu
                    if lamp_1_on:
                        gpio_controller.set_actuator('lamp_1', False)
                    if lamp_2_on:
                        gpio_controller.set_actuator('lamp_2', False)

                    # Jika suhu berlebih (overheat), nyalakan kipas sirkulasi pembuang panas
                    if temp > (target_t + 0.3) and not fan_on:
                        gpio_controller.set_actuator('fan', True)
                    elif temp <= target_t and fan_on:
                        gpio_controller.set_actuator('fan', False)

                # 2. Kontrol Kelembaban (Mist Maker):
                if hum < (target_h - 2.0):
                    if not mist_on:
                        gpio_controller.set_actuator('mist_maker', True)
                elif hum >= target_h:
                    if mist_on:
                        gpio_controller.set_actuator('mist_maker', False)

        except Exception as e:
            logger.error("Error pada loop kontrol cerdas: %s", e)

        time.sleep(1.0)

# -------------------------------------------------------------
# REST API Endpoints
# -------------------------------------------------------------

@app.route('/api/health', methods=['GET'])
def get_health():
    """Cek status kesehatan sistem backend & hardware"""
    return jsonify({
        "status": "ok",
        "app": "Tetasco Connect Backend",
        "version": "1.1.0",
        "simulated": gpio_controller.is_simulated,
        "sensor_mode": "hardware" if sensor_manager.is_hardware_active else "simulated",
        "cloud_mode": cloud_sync.mode,
        "cloud_online": cloud_sync.is_online,
        "uptime": round(time.time() - start_time, 1)
    })

@app.route('/api/sensor', methods=['GET'])
@app.route('/api/sensors', methods=['GET'])
def get_sensor():
    """Mendapatkan data telemetri suhu & kelembaban real-time"""
    acts = gpio_controller.get_all_actuators()
    reading = sensor_manager.read(acts.get('heater', False), acts.get('fan', False), acts.get('humidifier', False))
    return jsonify({
        "temperature": reading["temperature"],
        "humidity": reading["humidity"],
        "target_temp": control_state["target_temp"],
        "target_hum": control_state["target_hum"],
        "unit_temp": "°C",
        "unit_hum": "% RH",
        "is_hardware": reading.get("is_hardware", False),
        "sensor": reading.get("sensor", "simulated"),
        "error": reading.get("error"),
        "status": reading["status"]
    })

@app.route('/api/debug/sensor', methods=['GET'])
def debug_sensor():
    """Endpoint diagnostik mendalam untuk sensor SHT20 RS485"""
    from sensors.sht20_sensor import sht20_sensor
    return jsonify({
        "port": sht20_sensor.port,
        "is_connected": sht20_sensor.is_connected,
        "has_lgpio": sht20_sensor.has_lgpio,
        "de_re_pin": sht20_sensor.de_re_pin,
        "last_error": sht20_sensor.last_error,
        "last_temp": sht20_sensor.last_temp,
        "last_hum": sht20_sensor.last_hum,
        "last_success_time": sht20_sensor.last_success_time,
        "sensor_manager_mode": sensor_manager.active_sensor_type
    })

@app.route('/api/actuators', methods=['GET'])
def get_actuators():
    """Mendapatkan status seluruh aktuator (kompatibel untuk HMI LCD & Mobile Android)"""
    acts = gpio_controller.get_all_actuators()
    resp = dict(acts)
    resp["success"] = True
    resp["actuators"] = {
        "heater": acts.get("heater", False) or acts.get("lamp_1", False) or acts.get("lamp_2", False),
        "fan": acts.get("fan", False),
        "humidifier": acts.get("humidifier", False) or acts.get("mist_maker", False),
        "aux": acts.get("motor", False) or acts.get("uv_light", False)
    }
    return jsonify(resp)

@app.route('/api/actuators/<name>', methods=['POST'])
def set_actuator(name):
    """Mengubah status relay/aktuator tertentu"""
    data = request.get_json(silent=True) or {}
    if "state" not in data:
        return jsonify({"error": "Field 'state' (boolean) wajib disertakan"}), 400

    try:
        new_state = gpio_controller.set_actuator(name, bool(data["state"]))
        return jsonify({
            "name": name,
            "state": new_state,
            "all": gpio_controller.get_all_actuators()
        })
    except ValueError as e:
        return jsonify({"error": str(e)}), 404

@app.route('/api/emergency-stop', methods=['POST'])
def emergency_stop():
    """Mematikan semua aktuator secara darurat"""
    control_state["auto"] = False
    states = gpio_controller.emergency_stop()
    return jsonify({
        "message": "Seluruh aktuator dimatikan (Emergency Stop)",
        "auto": False,
        "actuators": states
    })

@app.route('/api/control/mode', methods=['GET', 'POST'])
def handle_control_mode():
    """Mengambil atau mengatur mode Auto/Manual, target suhu & kelembaban, serta status operasional perangkat"""
    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        if "device_status" in data:
            new_status = str(data["device_status"]).upper()
            if new_status in ("STANDBY", "RUNNING"):
                control_state["device_status"] = new_status
                if new_status == "STANDBY":
                    control_state["auto"] = False
                    control_state["profile"] = None
                    control_state["current_day"] = 0
                    control_state["incubation_start_time"] = None
                    gpio_controller.turn_off_all()
                    logger.info("Mesin beralih ke Mode SIAGA (STANDBY). Seluruh relay dimatikan & pilihan profil dinonaktifkan.")
                elif new_status == "RUNNING":
                    control_state["auto"] = True
                    if not control_state.get("incubation_start_time"):
                        control_state["incubation_start_time"] = time.time()
                    if control_state.get("current_day", 0) == 0:
                        control_state["current_day"] = 1
                    logger.info("Mesin beralih ke Mode AKTIF (RUNNING). Kontrol otomatis dimulai.")

        if "auto" in data:
            control_state["auto"] = bool(data["auto"])
        if "target_temp" in data:
            control_state["target_temp"] = round(float(data["target_temp"]), 1)
        if "target_hum" in data:
            control_state["target_hum"] = round(float(data["target_hum"]), 1)
        if "profile" in data:
            val = data["profile"]
            control_state["profile"] = str(val).upper() if val else None
        if "total_days" in data:
            control_state["total_days"] = max(1, int(data["total_days"]))
        if "current_day" in data:
            control_state["current_day"] = max(1, int(data["current_day"]))
            # Jika diset manual, sesuaikan incubation_start_time
            if control_state.get("device_status") == "RUNNING":
                days_offset = (control_state["current_day"] - 1) * 86400
                control_state["incubation_start_time"] = time.time() - days_offset

        logger.info("Pengaturan kontrol diperbarui: %s", control_state)

    # Hitung progres hari secara otomatis jika mesin sedang berjalan (RUNNING)
    if control_state.get("device_status") == "RUNNING" and control_state.get("incubation_start_time"):
        elapsed_days = int((time.time() - control_state["incubation_start_time"]) / 86400) + 1
        control_state["current_day"] = min(control_state.get("total_days", 21), max(1, elapsed_days))

    return jsonify(control_state)

# -------------------------------------------------------------
# Endpoints Kontrol Motor Hidrolik & Limit Switch
# -------------------------------------------------------------

@app.route('/api/hydraulic/status', methods=['GET'])
def get_hydraulic_status():
    """Mengambil status real-time motor hidrolik, sensor limit MAX/MIN, dan mode"""
    return jsonify(hydraulic_controller.get_status())

@app.route('/api/hydraulic/command', methods=['POST'])
def handle_hydraulic_command():
    """Mengirim perintah gerakan hidrolik: up, down, stop"""
    data = request.get_json(silent=True) or {}
    action = str(data.get("action", "")).lower()

    if action == "up":
        res = hydraulic_controller.move_up()
    elif action == "down":
        res = hydraulic_controller.move_down()
    elif action == "stop":
        res = hydraulic_controller.stop()
    else:
        return jsonify({"error": "Action harus 'up', 'down', atau 'stop'"}), 400

    return jsonify({"status": "ok", "action": action, "hydraulic": res})

@app.route('/api/hydraulic/mode', methods=['POST'])
def handle_hydraulic_mode():
    """Mengatur mode hidrolik (MANUAL / AUTO) dan interval auto-tilt (menit)"""
    data = request.get_json(silent=True) or {}
    mode = data.get("mode", "MANUAL")
    interval = data.get("interval_minutes", None)

    res = hydraulic_controller.set_mode(mode, interval)
    return jsonify({"status": "ok", "hydraulic": res})

@app.route('/api/hydraulic/polarity', methods=['GET', 'POST'])
def handle_hydraulic_polarity():
    """Membaca atau mengubah polaritas output relay dan limit switch"""
    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        if "output_active_high" in data:
            hydraulic_controller.set_output_polarity(bool(data["output_active_high"]))
        if "limit_active_high" in data:
            hydraulic_controller.set_limit_polarity(bool(data["limit_active_high"]))
    return jsonify({
        "output_active_high": hydraulic_controller.output_active_high,
        "limit_active_high": hydraulic_controller.limit_active_high,
        "backend": hydraulic_controller.hardware_backend
    })

@app.route('/api/hydraulic/test-output', methods=['POST'])
def handle_hydraulic_test_output():
    """Menguji pin output UP, DOWN, atau BLINK secara langsung"""
    data = request.get_json(silent=True) or {}
    action = str(data.get("action", "")).lower()
    duration = float(data.get("duration", 2.0))

    if action == "up":
        hydraulic_controller.force_output(True, False)
        return jsonify({"status": "ok", "action": "up", "message": f"Output UP (Pin 13) aktif"})
    elif action == "down":
        hydraulic_controller.force_output(False, True)
        return jsonify({"status": "ok", "action": "down", "message": f"Output DOWN (Pin 19) aktif"})
    elif action == "blink":
        # Jalankan di background thread agar tidak memblokir HTTP request
        threading.Thread(target=hydraulic_controller.blink_test, args=(3, 1.0), daemon=True).start()
        return jsonify({"status": "ok", "action": "blink", "message": "Blink test dimulai (3 siklus)"})
    elif action == "stop":
        hydraulic_controller.force_output(False, False)
        return jsonify({"status": "ok", "action": "stop", "message": "Seluruh output dimatikan"})
    else:
        return jsonify({"error": "Action harus 'up', 'down', 'blink', atau 'stop'"}), 400

@app.route('/api/system/exit-kiosk', methods=['POST'])
def exit_kiosk():
    """Menutup browser Chromium kiosk dan kembali ke desktop Raspberry Pi OS"""
    logger.info("Permintaan keluar dari Kiosk Mode diterima.")
    try:
        import subprocess
        subprocess.Popen(["pkill", "-f", "chromium"])
        return jsonify({"status": "ok", "message": "Menutup Chromium Kiosk..."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/system/reboot', methods=['POST'])
def reboot_system():
    """Mulai ulang Raspberry Pi"""
    logger.warning("Permintaan reboot sistem diterima.")
    try:
        import subprocess
        subprocess.Popen(["sudo", "reboot"])
        return jsonify({"status": "ok", "message": "Sistem sedang reboot..."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/system/shutdown', methods=['POST'])
def shutdown_system():
    """Matikan daya Raspberry Pi dengan aman"""
    logger.warning("Permintaan shutdown sistem diterima.")
    try:
        import subprocess
        subprocess.Popen(["sudo", "poweroff"])
        return jsonify({"status": "ok", "message": "Sistem sedang dimatikan..."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/system/exit-kiosk', methods=['POST'])
def exit_kiosk_system():
    """Tutup tampilan Chromium kiosk di Raspberry Pi untuk keluar ke desktop OS"""
    logger.info("Permintaan keluar dari mode kiosk (exit-kiosk) diterima.")
    try:
        import subprocess
        # Tutup proses browser Chromium
        subprocess.Popen(["killall", "chromium-browser"])
        subprocess.Popen(["killall", "chromium"])
        return jsonify({"status": "ok", "message": "Mode Kiosk ditutup, kembali ke desktop OS."})
    except Exception as e:
        logger.error("Gagal menutup browser kiosk: %s", e)
        return jsonify({"error": str(e)}), 500

# -------------------------------------------------------------
# Cloud Sync & Dual-Mode Endpoints (tetasco.my.id)
# -------------------------------------------------------------

@app.route('/api/cloud/status', methods=['GET'])
def get_cloud_status():
    """Mendapatkan status koneksi cloud, mode saat ini, dan status sinkronisasi"""
    return jsonify(cloud_sync.get_status())

@app.route('/api/cloud/sync', methods=['POST'])
def trigger_cloud_sync():
    """Memicu sinkronisasi manual ke server cloud seketika"""
    res = cloud_sync.sync_now()
    return jsonify(res)

@app.route('/api/cloud/config', methods=['POST'])
def set_cloud_config():
    """Memperbarui konfigurasi sinkronisasi cloud"""
    data = request.get_json(silent=True) or {}
    res = cloud_sync.update_config(data)
    return jsonify(res)

# -------------------------------------------------------------
# Farmer & Cabinet Profile Endpoints (1 Lemari = 1 Akun)
# -------------------------------------------------------------

@app.route('/api/profile', methods=['GET'])
def get_farmer_profile():
    """Mendapatkan profil peternak dan identitas lemari inkubator"""
    return jsonify(profile_manager.get_profile())

@app.route('/api/profile', methods=['POST'])
def update_farmer_profile():
    """Memperbarui profil peternak secara persisten"""
    data = request.get_json(silent=True) or {}
    res = profile_manager.update_profile(data)
    return jsonify(res)

# -------------------------------------------------------------
# Wi-Fi & Network Endpoints
# -------------------------------------------------------------

@app.route('/api/wifi/status', methods=['GET'])
def get_wifi_status_endpoint():
    """Mendapatkan status koneksi Wi-Fi saat ini"""
    return jsonify(wifi_manager.get_status())

@app.route('/api/wifi/scan', methods=['GET'])
def scan_wifi_endpoint():
    """Memindai daftar jaringan Wi-Fi di sekitar"""
    return jsonify(wifi_manager.scan_networks())

@app.route('/api/wifi/connect', methods=['POST'])
def connect_wifi_endpoint():
    """Menghubungkan ke jaringan Wi-Fi"""
    data = request.get_json(silent=True) or {}
    ssid = data.get("ssid")
    password = data.get("password")
    if not ssid:
        return jsonify({"success": False, "message": "SSID wajib diisi"}), 400
    res = wifi_manager.connect(ssid, password)
    return jsonify(res), (200 if res.get("success") else 400)

@app.route('/api/wifi/disconnect', methods=['POST'])
def disconnect_wifi_endpoint():
    """Memutus sambungan Wi-Fi"""
    res = wifi_manager.disconnect()
    return jsonify(res)

# -------------------------------------------------------------
# Static Web Server (Production Build HMI)
# -------------------------------------------------------------

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    """Menyajikan aplikasi React HMI statis dari folder dist jika ada"""
    if os.path.exists(DIST_DIR):
        file_path = os.path.join(DIST_DIR, path)
        if path != "" and os.path.exists(file_path):
            return send_from_directory(DIST_DIR, path)
        else:
            response = send_from_directory(DIST_DIR, "index.html")
            response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
            return response
    return jsonify({
        "message": "Backend Tetasco Connect berjalan. Folder 'dist' belum dibangun. Jalankan 'npm run build' untuk mengaktifkan UI lokal.",
        "api_docs": "/api/health, /api/sensor, /api/actuators"
    }), 200

def handle_exit(signum, frame):
    logger.info("Sinyal penghentian diterima (%s). Mematikan sistem...", signum)
    stop_event.set()
    cloud_sync.stop()
    gpio_controller.cleanup()
    sys.exit(0)

if __name__ == '__main__':
    start_time = time.time()
    signal.signal(signal.SIGINT, handle_exit)
    signal.signal(signal.SIGTERM, handle_exit)

    # 1. Jalankan loop kontrol cerdas di background
    control_thread = threading.Thread(target=smart_control_loop, daemon=True)
    control_thread.start()

    # 2. Jalankan background worker sinkronisasi cloud tetasco.my.id (Dual-Mode)
    cloud_sync.start(sensor_manager, gpio_controller)

    logger.info("==================================================")
    logger.info("🥚 TETASCO CONNECT — BACKEND GPIO & SENSOR SERVER")
    logger.info("Port: 5001 | Host: 0.0.0.0 (Localhost & Network)")
    logger.info("Akses HMI lokal: http://127.0.0.1:5001")
    logger.info("Cloud Base URL : %s (Unit ID: %d)", cloud_sync.config.get('cloud_base_url'), cloud_sync.config.get('tetasco_id'))
    logger.info("==================================================")

    # Jalankan Flask Server di port 5001
    app.run(host='0.0.0.0', port=5001, debug=False, use_reloader=False)
