import os
import sys
import time
import signal
import threading
import logging
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from hardware.gpio_controller import gpio_controller
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
    "auto": True,
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
            heater_on = current_actuators.get('heater', False)
            fan_on = current_actuators.get('fan', False)
            humid_on = current_actuators.get('humidifier', False)

            # Baca sensor terkini
            reading = sensor_manager.read(heater_on, fan_on, humid_on)
            temp = reading["temperature"]
            hum = reading["humidity"]

            # Jika mode AUTO aktif, kendalikan relay secara otomatis
            if control_state["auto"]:
                target_t = control_state["target_temp"]
                target_h = control_state["target_hum"]

                # 1. Kontrol Suhu:
                if temp < (target_t - 0.2):
                    if not heater_on:
                        gpio_controller.set_actuator('heater', True)
                    if fan_on:
                        gpio_controller.set_actuator('fan', False)
                elif temp >= target_t:
                    if heater_on:
                        gpio_controller.set_actuator('heater', False)
                    # Jika suhu berlebih, nyalakan kipas pembuang panas
                    if temp > (target_t + 0.3) and not fan_on:
                        gpio_controller.set_actuator('fan', True)
                    elif temp <= target_t and fan_on:
                        gpio_controller.set_actuator('fan', False)

                # 2. Kontrol Kelembaban:
                if hum < (target_h - 2.0):
                    if not humid_on:
                        gpio_controller.set_actuator('humidifier', True)
                elif hum >= target_h:
                    if humid_on:
                        gpio_controller.set_actuator('humidifier', False)

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
            return send_from_directory(DIST_DIR, "index.html")
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
