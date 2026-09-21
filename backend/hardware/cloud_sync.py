"""
TETASCO CONNECT — CLOUD SYNC & DUAL-MODE MANAGER
Mengelola integrasi antara Raspberry Pi (Lokal) dengan Cloud Server (https://tetasco.my.id):
- Mode Offline Otomatis: Saat tidak ada koneksi Wi-Fi/Internet, operasional berjalan 100% lokal.
- Mode Online Otomatis: Saat terhubung Wi-Fi, otomatis sinkronisasi telemetri sensor ke PostgreSQL
  dan menyinkronkan status aktuator/kontrol perangkat dari cloud.
"""

import os
import json
import time
import threading
import logging
import urllib.request
import urllib.error
from datetime import datetime
from .profile_manager import profile_manager

logger = logging.getLogger("CloudSync")

CONFIG_FILE = os.path.join(os.path.dirname(__file__), "cloud_config.json")

DEFAULT_CONFIG = {
    "cloud_base_url": "https://tetasco.my.id",
    "tetasco_id": 1,
    "sync_interval_seconds": 15,
    "sync_devices_from_cloud": False  # Jika True, relay lokal mengikuti saklar di cloud
}

class CloudSyncManager:
    def __init__(self):
        self.config = self._load_config()
        self.is_online = False
        self.mode = "offline"  # "online" atau "offline"
        self.last_sync_time = None
        self.last_sync_status = "Belum sinkron"
        self.last_error = None
        self.cloud_device_info = None
        self.total_synced_records = 0

        self._running = False
        self._thread = None
        self._lock = threading.Lock()

        # Dependensi modul eksternal (di-inject saat start di app.py)
        self.sensor_manager = None
        self.gpio_controller = None

    def _load_config(self) -> dict:
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, "r") as f:
                    cfg = json.load(f)
                    res = dict(DEFAULT_CONFIG)
                    res.update(cfg)
                    return res
            except Exception as e:
                logger.warning("Gagal membaca cloud_config.json: %s", e)
        return dict(DEFAULT_CONFIG)

    def _save_config(self):
        try:
            with open(CONFIG_FILE, "w") as f:
                json.dump(self.config, f, indent=2)
        except Exception as e:
            logger.error("Gagal menyimpan cloud_config.json: %s", e)

    def update_config(self, new_cfg: dict) -> dict:
        with self._lock:
            for k in ["cloud_base_url", "tetasco_id", "sync_interval_seconds", "sync_devices_from_cloud"]:
                if k in new_cfg:
                    self.config[k] = new_cfg[k]
            self._save_config()
            return self.get_status()

    def start(self, sensor_mgr=None, gpio_ctrl=None):
        """Memulai background sync worker"""
        self.sensor_manager = sensor_mgr
        self.gpio_controller = gpio_ctrl
        if not self._running:
            self._running = True
            self._thread = threading.Thread(target=self._worker_loop, daemon=True, name="CloudSyncWorker")
            self._thread.start()
            logger.info("CloudSyncWorker dimulai (Target: %s, Unit ID: %d, Interval: %ds)",
                        self.config["cloud_base_url"], self.config["tetasco_id"], self.config["sync_interval_seconds"])

    def stop(self):
        self._running = False
        if self._thread:
            self._thread.join(timeout=2.0)

    def check_cloud_health(self) -> bool:
        """Memeriksa apakah server cloud tetasco.my.id dapat dijangkau dan sehat"""
        url = f"{self.config['cloud_base_url']}/api/health"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Tetasco-RPi-Client/1.0"}, method="GET")
            with urllib.request.urlopen(req, timeout=4) as resp:
                if resp.getcode() == 200:
                    data = json.loads(resp.read().decode('utf-8'))
                    return data.get("status") == "ok"
        except Exception as e:
            self.last_error = f"Koneksi cloud gagal: {e}"
            return False
        return False

    def push_sensor_data(self, temp: float, hum: float) -> bool:
        """Mengirimkan telemetri suhu & kelembaban ke endpoint PostgreSQL cloud"""
        tetasco_id = self.config["tetasco_id"]
        url = f"{self.config['cloud_base_url']}/api/tetasco/{tetasco_id}/sensors/history"
        payload = json.dumps({
            "temperature": round(float(temp), 1),
            "humidity": round(float(hum), 1)
        }).encode("utf-8")

        headers = {
            "Content-Type": "application/json",
            "User-Agent": "Tetasco-RPi-Client/1.0"
        }

        try:
            req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=5) as resp:
                if resp.getcode() == 200:
                    res_json = json.loads(resp.read().decode('utf-8'))
                    if res_json.get("success"):
                        self.total_synced_records += 1
                        self.last_sync_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                        self.last_sync_status = "Sukses tersinkronisasi"
                        self.last_error = None
                        logger.info("☁️ [CLOUD SYNC BERHASIL] ID %d -> Suhu: %.1f °C, Hum: %.1f %%",
                                    tetasco_id, temp, hum)
                        return True
        except Exception as e:
            self.last_error = f"Gagal push data sensor: {e}"
            self.last_sync_status = f"Gagal kirim: {e}"
            logger.warning("Gagal mengirim telemetri ke cloud: %s", e)
        return False

    def fetch_cloud_account_info(self) -> dict:
        """Mengambil data akun peternak & identitas lemari dari Cloud Server"""
        tetasco_id = self.config["tetasco_id"]
        url = f"{self.config['cloud_base_url']}/api/tetasco/{tetasco_id}"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Tetasco-RPi-Client/1.0"}, method="GET")
            with urllib.request.urlopen(req, timeout=4) as resp:
                if resp.getcode() == 200:
                    data = json.loads(resp.read().decode('utf-8'))
                    profile_manager.sync_from_cloud(data)
                    return data
        except Exception:
            pass
        return None

    def fetch_cloud_device_states(self) -> dict:
        """Mengambil status perangkat yang diatur dari Cloud Dashboard"""
        tetasco_id = self.config["tetasco_id"]
        url = f"{self.config['cloud_base_url']}/api/tetasco/{tetasco_id}/devices"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Tetasco-RPi-Client/1.0"}, method="GET")
            with urllib.request.urlopen(req, timeout=4) as resp:
                if resp.getcode() == 200:
                    data = json.loads(resp.read().decode('utf-8'))
                    self.cloud_device_info = data.get("devices", {})
                    return self.cloud_device_info
        except Exception:
            pass
        return None

    def push_device_state(self, device_name: str, state: bool):
        """Mengirimkan status aktuator lokal ke endpoint cloud server jika sedang Online"""
        if not self.is_online:
            return

        tetasco_id = self.config["tetasco_id"]
        action = "on" if state else "off"

        # Mapping nama aktuator lokal ke endpoint perangkat di cloud server
        mapping = {
            "fan": f"/api/tetasco/{tetasco_id}/devices/fan/{action}",
            "heater": f"/api/tetasco/{tetasco_id}/devices/heater-1/{action}",
            "lamp_1": f"/api/tetasco/{tetasco_id}/devices/heater-1/{action}",
            "heater_1": f"/api/tetasco/{tetasco_id}/devices/heater-1/{action}",
            "humidifier": f"/api/tetasco/{tetasco_id}/devices/humidifier/{action}",
            "mist_maker": f"/api/tetasco/{tetasco_id}/devices/humidifier/{action}",
            "motor": f"/api/tetasco/{tetasco_id}/devices/motor/{action}",
            "aux": f"/api/tetasco/{tetasco_id}/devices/motor/{action}",
        }

        endpoint = mapping.get(device_name)
        if not endpoint:
            return

        url = f"{self.config['cloud_base_url']}{endpoint}"

        def _async_push():
            try:
                req = urllib.request.Request(
                    url,
                    data=b"",
                    headers={"User-Agent": "Tetasco-RPi-Client/1.0"},
                    method="POST"
                )
                with urllib.request.urlopen(req, timeout=4) as resp:
                    if resp.getcode() == 200:
                        logger.info("☁️ [DEVICE SYNC] Status aktuator %s -> %s terkirim ke cloud", device_name, action)
            except Exception as e:
                logger.warning("Gagal mengirim status aktuator %s ke cloud: %s", device_name, e)

        threading.Thread(target=_async_push, daemon=True, name=f"PushDevice-{device_name}").start()

    def sync_now(self) -> dict:
        """Memicu sinkronisasi manual saat ini juga"""
        is_healthy = self.check_cloud_health()
        if not is_healthy:
            self.is_online = False
            self.mode = "offline"
            return self.get_status()

        self.is_online = True
        self.mode = "online"

        # Sinkronkan data akun peternak
        self.fetch_cloud_account_info()

        # Ambil data sensor terkini
        t, h = 27.0, 50.0
        if self.sensor_manager:
            cached = getattr(self.sensor_manager, "cached_reading", {})
            t = cached.get("temperature", 27.0)
            h = cached.get("humidity", 50.0)

        self.push_sensor_data(t, h)
        self.fetch_cloud_device_states()
        return self.get_status()

    def _worker_loop(self):
        """Loop latar belakang berkala untuk deteksi Wi-Fi & sinkronisasi otomatis"""
        time.sleep(3) # Tunggu inisialisasi awal sistem
        while self._running:
            try:
                # 1. Cek kesehatan koneksi ke Cloud Server
                is_cloud_ok = self.check_cloud_health()

                if is_cloud_ok:
                    if not self.is_online:
                        logger.info("🌐 [KONEKSI PULIH] Terhubung ke Wi-Fi / Internet. Beralih ke MODE ONLINE.")
                        # Ambil info akun peternak & lemari saat koneksi pulih
                        self.fetch_cloud_account_info()

                    self.is_online = True
                    self.mode = "online"

                    # 2. Push data sensor terkini ke database PostgreSQL cloud
                    if self.sensor_manager:
                        cached = getattr(self.sensor_manager, "cached_reading", {})
                        t = cached.get("temperature")
                        h = cached.get("humidity")
                        if t is not None and h is not None:
                            self.push_sensor_data(t, h)

                    # 3. Sinkronkan status saklar perangkat dari cloud jika diaktifkan
                    if self.config.get("sync_devices_from_cloud") and self.gpio_controller:
                        devs = self.fetch_cloud_device_states()
                        if devs:
                            # Sinkronkan status ke relay lokal
                            if "fan" in devs:
                                self.gpio_controller.set_actuator("fan", devs["fan"])
                            if "heater_1" in devs:
                                self.gpio_controller.set_actuator("lamp_1", devs["heater_1"])
                            if "humidifier" in devs:
                                self.gpio_controller.set_actuator("mist_maker", devs["humidifier"])
                else:
                    if self.is_online:
                        logger.info("⚪ [KONEKSI TERPUTUS] Tidak ada internet/Wi-Fi. Otomatis beralih ke MODE OFFLINE (Lokal Mandiri).")
                    self.is_online = False
                    self.mode = "offline"

            except Exception as e:
                logger.error("Error pada CloudSyncWorker: %s", e)
                self.is_online = False
                self.mode = "offline"

            interval = max(5, self.config.get("sync_interval_seconds", 15))
            time.sleep(interval)

    def get_status(self) -> dict:
        """Mengembalikan status konektivitas cloud untuk HMI LCD"""
        return {
            "is_online": self.is_online,
            "mode": self.mode,
            "cloud_url": self.config["cloud_base_url"],
            "tetasco_id": self.config["tetasco_id"],
            "sync_interval_seconds": self.config["sync_interval_seconds"],
            "sync_devices_from_cloud": self.config.get("sync_devices_from_cloud", False),
            "last_sync_time": self.last_sync_time,
            "last_sync_status": self.last_sync_status,
            "total_synced_records": self.total_synced_records,
            "last_error": self.last_error
        }

# Singleton instance
cloud_sync = CloudSyncManager()
