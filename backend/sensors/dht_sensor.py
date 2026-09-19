import logging
import random
import time
from .sht20_sensor import sht20_sensor
from .dht11_driver import dht11_driver, DHT_PIN

logger = logging.getLogger("SensorManager")

# Pin default DHT sensor (GPIO 6 / Pin Fisik 31)
DEFAULT_DHT_PIN = DHT_PIN

class SensorManager:
    """
    Manager sensor Suhu & Kelembaban multi-protokol:
    1. DHT11 GPIO 6 (Pin Fisik 31) - Prioritas Utama Saat Ini Sesuai Permintaan User
    2. SHT20 RS485 Modbus RTU (Alternatif Industri)
    3. Simulasi Fisik Dinamis Real-Time (Fallback Otomatis jika hardware belum terhubung)
    """
    def __init__(self, dht_pin=DEFAULT_DHT_PIN):
        self.dht_pin = dht_pin
        self.is_hardware_active = False
        self.active_sensor_type = "DHT11_GPIO"
        self.dht_device = None

        # State internal untuk pembacaan stabil & simulasi dinamis
        self.simulated_temp = 37.6
        self.simulated_hum = 55.4
        self.last_read_time = time.time()
        self.cached_reading = {
            "temperature": 37.6,
            "humidity": 55.4,
            "status": "simulated"
        }

        self._init_sensor()

    def _init_sensor(self):
        self.active_sensor_type = "DHT11_GPIO"
        logger.info("Sensor DHT11 pada GPIO %d siap sebagai sensor utama.", self.dht_pin)

    def read(self, heater_on: bool = False, fan_on: bool = False, humidifier_on: bool = False) -> dict:
        """
        Membaca suhu & kelembaban dari sensor hardware fisik (DHT11 / SHT20)
        atau menghitung simulasi dinamika termal inkubator jika hardware belum terpasang.
        """
        now = time.time()
        dt = max(0.1, min(2.0, now - self.last_read_time))
        self.last_read_time = now

        # 1. Prioritas Utama: Baca dari DHT11 pada GPIO 6
        t_dht, h_dht, ok_dht = dht11_driver.read()
        if ok_dht and t_dht is not None and h_dht is not None:
            self.is_hardware_active = True
            self.active_sensor_type = "DHT11_GPIO"
            self.cached_reading = {
                "temperature": t_dht,
                "humidity": h_dht,
                "sensor": "DHT11_GPIO",
                "is_hardware": True,
                "status": "hardware_ok",
                "error": None
            }
            return self.cached_reading

        # 2. Alternatif: Coba baca dari SHT20 RS485 Modbus RTU
        t_sht, h_sht, ok_sht = sht20_sensor.read()
        if ok_sht and t_sht is not None and h_sht is not None:
            self.is_hardware_active = True
            self.active_sensor_type = "SHT20_RS485"
            self.cached_reading = {
                "temperature": t_sht,
                "humidity": h_sht,
                "sensor": "SHT20_RS485",
                "is_hardware": True,
                "status": "hardware_ok",
                "error": None
            }
            return self.cached_reading

        # 3. Fallback: Simulasi Dinamis Fisik Inkubator
        self.is_hardware_active = False
        self.active_sensor_type = "simulated"

        if heater_on and not fan_on:
            self.simulated_temp += 0.08 * dt
        elif fan_on:
            self.simulated_temp -= 0.06 * dt
        else:
            target_ambient = 36.8
            self.simulated_temp += (target_ambient - self.simulated_temp) * 0.02 * dt

        if humidifier_on:
            self.simulated_hum += 0.25 * dt
        elif fan_on:
            self.simulated_hum -= 0.15 * dt
        else:
            self.simulated_hum -= 0.03 * dt

        t_jitter = random.uniform(-0.04, 0.04)
        h_jitter = random.uniform(-0.1, 0.1)

        temp_final = round(max(25.0, min(45.0, self.simulated_temp + t_jitter)), 1)
        hum_final = round(max(20.0, min(95.0, self.simulated_hum + h_jitter)), 1)

        self.cached_reading = {
            "temperature": temp_final,
            "humidity": hum_final,
            "sensor": "simulated",
            "is_hardware": False,
            "status": "simulated",
            "error": sht20_sensor.last_error
        }
        return self.cached_reading

sensor_manager = SensorManager()
