import logging
import random
import time
from .sht20_sensor import sht20_sensor

logger = logging.getLogger("SensorManager")

# Pin default DHT sensor (jika menggunakan DHT11/DHT22 via GPIO)
DEFAULT_DHT_PIN = 17

class SensorManager:
    """
    Manager sensor Suhu & Kelembaban multi-protokol:
    1. SHT20 RS485 Modbus RTU (Prioritas Utama - Akurasi Tinggi Industri)
    2. DHT11 / DHT22 GPIO (Alternatif)
    3. Simulasi Fisik Dinamis Real-Time (Fallback Otomatis jika hardware belum terhubung)
    """
    def __init__(self, dht_pin=DEFAULT_DHT_PIN):
        self.dht_pin = dht_pin
        self.is_hardware_active = False
        self.active_sensor_type = "simulated"
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
        # 1. Cek SHT20 RS485
        if sht20_sensor.is_connected:
            self.is_hardware_active = True
            self.active_sensor_type = "SHT20_RS485"
            logger.info("Sensor SHT20 RS485 aktif sebagai sensor utama.")
            return

        # 2. Cek DHT11/22 GPIO
        try:
            import board
            import adafruit_dht
            pin = getattr(board, f"D{self.dht_pin}", None)
            if pin:
                self.dht_device = adafruit_dht.DHT11(pin)
                self.is_hardware_active = True
                self.active_sensor_type = "DHT11_GPIO"
                logger.info("Sensor DHT11 hardware berhasil dihubungkan pada GPIO %d", self.dht_pin)
                return
        except Exception:
            pass

        self.is_hardware_active = False
        self.active_sensor_type = "simulated"
        logger.info("Hardware sensor fisik belum terhubung. Mengaktifkan simulasi dinamis real-time.")

    def read(self, heater_on: bool = False, fan_on: bool = False, humidifier_on: bool = False) -> dict:
        """
        Membaca suhu & kelembaban dari sensor hardware fisik (SHT20 / DHT)
        atau menghitung simulasi dinamika termal inkubator jika hardware belum terpasang.
        """
        now = time.time()
        dt = max(0.1, min(2.0, now - self.last_read_time))
        self.last_read_time = now

        # 1. Coba baca dari SHT20 RS485 Modbus RTU
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

        # 2. Coba baca dari DHT11/22 jika ada
        if self.dht_device:
            try:
                t = self.dht_device.temperature
                h = self.dht_device.humidity
                if t is not None and h is not None:
                    self.is_hardware_active = True
                    self.active_sensor_type = "DHT11_GPIO"
                    self.cached_reading = {
                        "temperature": round(float(t), 1),
                        "humidity": round(float(h), 1),
                        "sensor": "DHT11_GPIO",
                        "status": "hardware_ok"
                    }
                    return self.cached_reading
            except Exception as e:
                logger.debug("Retry baca DHT: %s", e)

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
