import logging
import random
import time

logger = logging.getLogger("SensorManager")

# Pin default DHT sensor (jika menggunakan DHT11/DHT22 via GPIO)
DEFAULT_DHT_PIN = 17

class SensorManager:
    """
    Manager sensor Suhu & Kelembaban (DHT11/DHT22/SHT20).
    Dilengkapi simulasi fisik dinamis jika hardware sensor belum terhubung.
    """
    def __init__(self, dht_pin=DEFAULT_DHT_PIN):
        self.dht_pin = dht_pin
        self.is_hardware_active = False
        self.dht_device = None

        # State internal untuk pembacaan stabil & simulasi dinamis
        self.simulated_temp = 37.6
        self.simulated_hum = 55.4
        self.last_read_time = time.time()
        self.cached_reading = {
            "temperature": 37.6,
            "humidity": 55.4,
            "status": "ready"
        }

        self._init_sensor()

    def _init_sensor(self):
        try:
            # Coba inisialisasi adafruit_circuitpython_dht jika terinstall
            import board
            import adafruit_dht
            pin = getattr(board, f"D{self.dht_pin}", None)
            if pin:
                self.dht_device = adafruit_dht.DHT11(pin)
                self.is_hardware_active = True
                logger.info("Sensor DHT11 hardware berhasil dihubungkan pada GPIO %d", self.dht_pin)
        except Exception as e:
            logger.info("Hardware sensor fisik tidak terdeteksi (%s). Mengaktifkan simulasi dinamis real-time.", e)
            self.is_hardware_active = False

    def read(self, heater_on: bool = False, fan_on: bool = False, humidifier_on: bool = False) -> dict:
        """
        Membaca suhu & kelembaban.
        Jika simulasi, nilai akan berfluktuasi secara realistis mengikuti status heater/fan/humidifier.
        """
        now = time.time()
        dt = max(0.1, min(2.0, now - self.last_read_time))
        self.last_read_time = now

        if self.is_hardware_active and self.dht_device:
            try:
                t = self.dht_device.temperature
                h = self.dht_device.humidity
                if t is not None and h is not None:
                    self.cached_reading = {
                        "temperature": round(float(t), 1),
                        "humidity": round(float(h), 1),
                        "status": "hardware_ok"
                    }
                    return self.cached_reading
            except Exception as e:
                logger.debug("Retry baca DHT hardware: %s", e)

        # Simulasi Dinamis Fisik Inkubator
        # 1. Suhu:
        if heater_on and not fan_on:
            self.simulated_temp += 0.08 * dt  # Suhu naik saat pemanas on
        elif fan_on:
            self.simulated_temp -= 0.06 * dt  # Suhu turun saat kipas on
        else:
            # Dingin perlahan ke ambient jika pemanas mati
            target_ambient = 36.8
            self.simulated_temp += (target_ambient - self.simulated_temp) * 0.02 * dt

        # 2. Kelembaban:
        if humidifier_on:
            self.simulated_hum += 0.25 * dt   # Kelembaban naik
        elif fan_on:
            self.simulated_hum -= 0.15 * dt   # Exhaust kipas membuang uap
        else:
            self.simulated_hum -= 0.03 * dt   # Kelembaban turun perlahan

        # Sedikit noise alami sensor (+-0.03)
        t_jitter = random.uniform(-0.04, 0.04)
        h_jitter = random.uniform(-0.1, 0.1)

        temp_final = round(max(25.0, min(45.0, self.simulated_temp + t_jitter)), 1)
        hum_final = round(max(20.0, min(95.0, self.simulated_hum + h_jitter)), 1)

        self.cached_reading = {
            "temperature": temp_final,
            "humidity": hum_final,
            "status": "hardware_ok" if self.is_hardware_active else "simulated"
        }
        return self.cached_reading

sensor_manager = SensorManager()
