import logging
import random
import time
from .sht20_sensor import sht20_sensor
from .dht11_driver import dht11_driver, DHT_PIN

logger = logging.getLogger("SensorManager")

# Pin default DHT sensor (GPIO 23 / Pin Fisik 16)
DEFAULT_DHT_PIN = DHT_PIN

class SensorManager:
    """
    Manager sensor Suhu & Kelembaban:
    1. SHT20 RS485 Modbus RTU (Sensor Industri Terkalibrasi)
    2. DHT11 GPIO 23 (Alternatif Sensor Fisik)
    Tanpa injeksi data simulasi fiktif yang fluktuatif.
    """
    def __init__(self, dht_pin=DEFAULT_DHT_PIN):
        self.dht_pin = dht_pin
        self.is_hardware_active = False
        self.active_sensor_type = "SHT20_RS485"
        self.dht_device = None

        self.last_read_time = time.time()
        self.cached_reading = {
            "temperature": 37.5,
            "humidity": 55.0,
            "sensor": "SHT20_RS485",
            "is_hardware": False,
            "status": "waiting_sensor",
            "error": None
        }

        self._init_sensor()

    def _init_sensor(self):
        self.active_sensor_type = "SHT20_RS485"
        logger.info("SensorManager diinisialisasi (SHT20 RS485 & DHT11 GPIO %d).", self.dht_pin)

    def read(self, heater_on: bool = False, fan_on: bool = False, humidifier_on: bool = False) -> dict:
        """
        Membaca suhu & kelembaban murni dari sensor fisik (SHT20 / DHT11).
        """
        now = time.time()
        self.last_read_time = now

        # 1. Prioritas Utama: Baca dari SHT20 RS485 Modbus RTU (Sensor Industri)
        t_sht, h_sht, ok_sht = sht20_sensor.read()
        if ok_sht and t_sht is not None and h_sht is not None:
            self.is_hardware_active = True
            self.active_sensor_type = "SHT20_RS485"
            self.cached_reading = {
                "temperature": round(float(t_sht), 1),
                "humidity": round(float(h_sht), 1),
                "sensor": "SHT20_RS485",
                "is_hardware": True,
                "status": "hardware_ok",
                "error": None
            }
            return self.cached_reading

        # 1b. Tahan nilai terakhir hardware jika baru saja berhasil
        if self.is_hardware_active and (now - sht20_sensor.last_success_time) < 15.0:
            return self.cached_reading

        # 2. Alternatif: Baca dari DHT11 pada GPIO 23
        t_dht, h_dht, ok_dht = dht11_driver.read()
        if ok_dht and t_dht is not None and h_dht is not None:
            self.is_hardware_active = True
            self.active_sensor_type = "DHT11_GPIO"
            self.cached_reading = {
                "temperature": round(float(t_dht), 1),
                "humidity": round(float(h_dht), 1),
                "sensor": "DHT11_GPIO",
                "is_hardware": True,
                "status": "hardware_ok",
                "error": None
            }
            return self.cached_reading

        # 3. Jika sensor fisik belum terbaca, kembalikan nilai cache terakhir secara stabil
        self.is_hardware_active = False
        self.cached_reading["is_hardware"] = False
        self.cached_reading["status"] = "sensor_offline"
        self.cached_reading["error"] = sht20_sensor.last_error or "Sensor belum merespon"
        return self.cached_reading

sensor_manager = SensorManager()
