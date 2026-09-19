"""
TETASCO CONNECT — DRIVER SENSOR DHT11 (GPIO 6 / PIN FISIK 31)
Mendukung multi-metode pembacaan untuk kompatibilitas Raspberry Pi 5 & 4:
1. lgpio Pulse Counter (Native Linux C library, tanpa dependensi eksternal)
2. adafruit-circuitpython-dht (Jika terpasang)
3. Linux Kernel IIO Driver (/sys/bus/iio/devices)
"""

import os
import time
import glob
import logging

logger = logging.getLogger("DHT11Driver")

DHT_PIN = 6  # GPIO 6 (Pin Fisik 31)

class DHT11Driver:
    def __init__(self, pin=DHT_PIN):
        self.pin = pin
        self.last_temp = None
        self.last_hum = None
        self.last_read_time = 0
        self.last_error = None
        self.adafruit_device = None
        self.has_adafruit = False

        self._init_adafruit()

    def _init_adafruit(self):
        try:
            import board
            import adafruit_dht
            pin_obj = getattr(board, f"D{self.pin}", None)
            if pin_obj:
                self.adafruit_device = adafruit_dht.DHT11(pin_obj, use_pulseio=False)
                self.has_adafruit = True
                logger.info("DHT11 adafruit_dht berhasil diinisialisasi pada GPIO %d", self.pin)
        except Exception as e:
            self.has_adafruit = False
            logger.debug("adafruit_dht tidak aktif: %s (akan menggunakan lgpio native)", e)

    def _read_iio(self):
        """Membaca DHT11 jika kernel driver IIO aktif (dtoverlay=dht11)"""
        try:
            for dev in glob.glob("/sys/bus/iio/devices/iio:device*"):
                name_file = os.path.join(dev, "name")
                if os.path.exists(name_file):
                    with open(name_file, "r") as f:
                        if "dht11" in f.read().lower():
                            t_file = os.path.join(dev, "in_temp_input")
                            h_file = os.path.join(dev, "in_humidityrelative_input")
                            if os.path.exists(t_file) and os.path.exists(h_file):
                                with open(t_file, "r") as tf, open(h_file, "r") as hf:
                                    t = float(tf.read().strip()) / 1000.0
                                    h = float(hf.read().strip()) / 1000.0
                                    return t, h, True
        except Exception:
            pass
        return None, None, False

    def _read_adafruit(self):
        """Membaca DHT11 via library adafruit_dht"""
        if not self.has_adafruit or not self.adafruit_device:
            return None, None, False
        try:
            t = self.adafruit_device.temperature
            h = self.adafruit_device.humidity
            if t is not None and h is not None:
                return float(t), float(h), True
        except Exception as e:
            logger.debug("Adafruit DHT11 read error: %s", e)
        return None, None, False

    def _read_lgpio(self):
        """
        Membaca DHT11 secara langsung menggunakan lgpio (Native RPi 5 & 4).
        Protokol DHT11:
        1. Host kirim start: LOW selama ~20ms, lalu lepaskan ke HIGH (input pull-up)
        2. DHT11 merespon: 80us LOW, 80us HIGH
        3. DHT11 kirim 40 bit data:
           - Tiap bit diawali 50us LOW
           - Bit '0' = 26-28us HIGH
           - Bit '1' = ~70us HIGH
        """
        try:
            import lgpio
        except ImportError:
            return None, None, False

        # Tentukan chip (Pi 5 = chip 4, Pi 4/3 = chip 0)
        chip_id = None
        for c in [4, 0]:
            try:
                h = lgpio.gpiochip_open(c)
                lgpio.gpiochip_close(h)
                chip_id = c
                break
            except Exception:
                continue

        if chip_id is None:
            return None, None, False

        # Coba hingga 3 kali pembacaan
        for _ in range(3):
            try:
                h = lgpio.gpiochip_open(chip_id)

                # Bebaskan pin jika sebelumnya ter-claim
                try:
                    lgpio.gpio_free(h, self.pin)
                except Exception:
                    pass

                # 1. Kirim start signal (LOW minimal 18-20 ms)
                lgpio.gpio_claim_output(h, self.pin, 0)
                time.sleep(0.020)

                # 2. Lepaskan pin ke INPUT dengan PULL-UP internal
                lgpio.gpio_free(h, self.pin)
                lgpio.gpio_claim_input(h, self.pin, lgpio.SET_PULL_UP)

                # 3. Tangkap transisi pulsa DHT11
                pulses = []
                last_val = lgpio.gpio_read(h, self.pin)
                start_ns = time.perf_counter_ns()
                timeout_ns = 12_000_000  # 12 ms batas maksimum pembacaan 40 bit

                while (time.perf_counter_ns() - start_ns) < timeout_ns:
                    val = lgpio.gpio_read(h, self.pin)
                    if val != last_val:
                        t = time.perf_counter_ns()
                        pulses.append((last_val, t))
                        last_val = val
                        if len(pulses) >= 84:
                            break

                lgpio.gpio_free(h, self.pin)
                lgpio.gpiochip_close(h)

                # 4. Analisis pulsa
                # Hitung durasi saat level HIGH
                high_durations = []
                for i in range(len(pulses) - 1):
                    lvl, t1 = pulses[i]
                    _, t2 = pulses[i + 1]
                    dur_us = (t2 - t1) / 1000.0
                    if lvl == 1:
                        high_durations.append(dur_us)

                # DHT11 memiliki 1 respon HIGH di awal (~80us) + 40 bit data HIGH
                if len(high_durations) >= 40:
                    data_bits = high_durations[-40:]
                    bits = [1 if dur > 48.0 else 0 for dur in data_bits]

                    # Konversi 40 bit menjadi 5 byte
                    bytes_data = []
                    for b in range(5):
                        val = 0
                        for bit_i in range(8):
                            val = (val << 1) | bits[b * 8 + bit_i]
                        bytes_data.append(val)

                    hum_int, hum_dec, temp_int, temp_dec, chk = bytes_data
                    if ((hum_int + hum_dec + temp_int + temp_dec) & 0xFF) == chk:
                        temp = float(temp_int) + float(temp_dec) * 0.1
                        hum = float(hum_int) + float(hum_dec) * 0.1
                        if 0.0 <= hum <= 100.0 and 0.0 <= temp <= 65.0:
                            return round(temp, 1), round(hum, 1), True

            except Exception as e:
                try:
                    lgpio.gpiochip_close(h)
                except Exception:
                    pass
            time.sleep(0.15)

        return None, None, False

    def read(self):
        """
        Membaca suhu & kelembaban dari DHT11.
        Mencoba metode Kernel IIO -> Adafruit -> lgpio.
        Mengembalikan tuple: (temperature, humidity, is_ok)
        """
        # Coba IIO kernel
        t, h, ok = self._read_iio()
        if ok:
            self.last_temp = t
            self.last_hum = h
            self.last_read_time = time.time()
            self.last_error = None
            return t, h, True

        # Coba Adafruit
        t, h, ok = self._read_adafruit()
        if ok:
            self.last_temp = t
            self.last_hum = h
            self.last_read_time = time.time()
            self.last_error = None
            return t, h, True

        # Coba Native lgpio
        t, h, ok = self._read_lgpio()
        if ok:
            self.last_temp = t
            self.last_hum = h
            self.last_read_time = time.time()
            self.last_error = None
            return t, h, True

        self.last_error = f"DHT11 pada GPIO {self.pin} tidak merespons (cek kabel data & VCC)"
        return None, None, False

dht11_driver = DHT11Driver(pin=DHT_PIN)
