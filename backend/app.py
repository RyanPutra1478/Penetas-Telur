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
    "auto": False,                      # Default MANUAL agar relay tidak menyala-mati sendiri
    "target_temp": 37.8,
    "target_hum": 55.0,
    "profile": "AYAM",
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

            # Kontrol otomatis HANYA berjalan jika mode AUTO aktif DAN sensor fisik benar-benar terhubung
            if control_state["auto"] and sensor_manager.is_hardware_active:
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
        "version": "1.0.0",
        "simulated": gpio_controller.is_simulated,
        "sensor_mode": "hardware" if sensor_manager.is_hardware_active else "simulated",
        "uptime": round(time.time() - start_time, 1)
    })

@app.route('/api/sensor', methods=['GET'])
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
        "status": reading["status"]
    })

@app.route('/api/actuators', methods=['GET'])
def get_actuators():
    """Mendapatkan status seluruh aktuator (heater, fan, humidifier, motor)"""
    return jsonify(gpio_controller.get_all_actuators())

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
    """Mengambil atau mengatur mode Auto/Manual, target suhu & target kelembaban"""
    if request.method == 'POST':
        data = request.get_json(silent=True) or {}
        if "auto" in data:
            control_state["auto"] = bool(data["auto"])
        if "target_temp" in data:
            control_state["target_temp"] = round(float(data["target_temp"]), 1)
        if "target_hum" in data:
            control_state["target_hum"] = round(float(data["target_hum"]), 1)
        if "profile" in data:
            control_state["profile"] = str(data["profile"]).upper()

        logger.info("Pengaturan kontrol diperbarui: %s", control_state)

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
    gpio_controller.cleanup()
    sys.exit(0)

if __name__ == '__main__':
    start_time = time.time()
    signal.signal(signal.SIGINT, handle_exit)
    signal.signal(signal.SIGTERM, handle_exit)

    # Jalankan loop kontrol cerdas di background
    control_thread = threading.Thread(target=smart_control_loop, daemon=True)
    control_thread.start()

    logger.info("==================================================")
    logger.info("🥚 TETASCO CONNECT — BACKEND GPIO & SENSOR SERVER")
    logger.info("Port: 5001 | Host: 0.0.0.0 (Localhost & Network)")
    logger.info("Akses HMI lokal: http://127.0.0.1:5001")
    logger.info("==================================================")

    # Jalankan Flask Server di port 5001
    app.run(host='0.0.0.0', port=5001, debug=False, use_reloader=False)
