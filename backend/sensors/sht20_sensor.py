"""
TETASCO CONNECT — SHT20 / XY-MD02 RS485 MODBUS RTU DRIVER
Port: /dev/serial0 @ 9600 baud | DE+RE: GPIO 18 (Pin Fisik 12) via lgpio
"""

import os
import time
import logging

logger = logging.getLogger("SHT20Sensor")

# Port serial default di Raspberry Pi user adalah /dev/serial0
SERIAL_PORT = "/dev/serial0"
BAUDRATE = 9600
DE_RE_GPIO = 18    # Physical Pin 12 -> DE + RE

# Modbus Request XY-MD02:
# Slave ID: 1, Function: 04 (Read Input Registers), Start Reg: 0001, Quantity: 0002, CRC: 20 0B
REQUEST = bytes.fromhex("01 04 00 01 00 02 20 0B")

class SHT20RS485:
    def __init__(self):
        self.ser = None
        self.gpio = None
        self.port = SERIAL_PORT
        self.is_connected = False
        self.last_error = "Belum inisialisasi"
        self.last_temp = None
        self.last_hum = None
        self.last_success_time = 0

        self._init_sensor()

    def _init_sensor(self):
        # 1. Buka lgpio chip (coba chip 0 untuk RPi 4/3, chip 4 untuk RPi 5)
        try:
            import lgpio
            if self.gpio is None:
                for chip_id in [0, 4]:
                    try:
                        h = lgpio.gpiochip_open(chip_id)
                        # Coba bebaskan pin terlebih dahulu jika sebelumnya ter-claim
                        try:
                            lgpio.gpio_free(h, DE_RE_GPIO)
                        except Exception:
                            pass
                        lgpio.gpio_claim_output(h, DE_RE_GPIO, 0) # Default: LOW (Receive)
                        self.gpio = h
                        logger.info("lgpio chip %d DE+RE GPIO %d siap.", chip_id, DE_RE_GPIO)
                        break
                    except Exception as e:
                        logger.debug("Chip %d gagal: %s", chip_id, e)
                        continue

            if self.gpio is None:
                self.last_error = "GPIO 18 busy atau tidak dapat dibuka"
                logger.warning("Tidak dapat mengontrol GPIO 18 (mungkin sedang dipakai proses lain).")
                return
        except ImportError:
            self.last_error = "Library lgpio tidak terinstall"
            logger.warning("Library lgpio belum terpasang.")
            return
        except Exception as e:
            self.last_error = f"Error lgpio: {e}"
            logger.warning("Gagal setup lgpio: %s", e)
            return

        # 2. Buka serial port (/dev/serial0 utama, fallback ke /dev/ttyAMA0 / /dev/ttyUSB0)
        try:
            import serial
            port_to_use = self.port
            if not os.path.exists(port_to_use):
                for alt in ["/dev/serial0", "/dev/ttyAMA0", "/dev/ttyAMA10", "/dev/ttyS0", "/dev/ttyUSB0"]:
                    if os.path.exists(alt):
                        port_to_use = alt
                        self.port = alt
                        break

            if not os.path.exists(port_to_use):
                self.last_error = "Port serial /dev/serial0 tidak ditemukan"
                self.is_connected = False
                return

            if self.ser and self.ser.is_open:
                try:
                    self.ser.close()
                except Exception:
                    pass

            self.ser = serial.Serial(
                port=port_to_use,
                baudrate=BAUDRATE,
                bytesize=serial.EIGHTBITS,
                parity=serial.PARITY_NONE,
                stopbits=serial.STOPBITS_ONE,
                timeout=1.0
            )
            self.ser.reset_input_buffer()
            self.ser.reset_output_buffer()
            self.is_connected = True
            self.last_error = None
            logger.info("Serial %s berhasil dibuka @ %d baud.", port_to_use, BAUDRATE)
        except Exception as e:
            self.last_error = f"Gagal buka serial {self.port}: {e}"
            logger.warning("Gagal buka serial port %s: %s", self.port, e)
            self.is_connected = False

    def read(self):
        """
        Mengirim request Modbus dan membaca respon 9 bytes.
        Mengembalikan tuple: (temperature, humidity, is_ok)
        """
        if not self.is_connected or not self.ser or not self.ser.is_open or self.gpio is None:
            self._init_sensor()
            if not self.is_connected or not self.ser or self.gpio is None:
                return None, None, False

        try:
            import lgpio

            self.ser.reset_input_buffer()
            self.ser.reset_output_buffer()

            # 1. MODE TRANSMIT (HIGH)
            lgpio.gpio_write(self.gpio, DE_RE_GPIO, 1)

            # Kirim request Modbus
            self.ser.write(REQUEST)
            self.ser.flush()

            # 2. LANGSUNG MODE RECEIVE (LOW)
            lgpio.gpio_write(self.gpio, DE_RE_GPIO, 0)

            # 3. BACA RESPONSE (9 Bytes)
            response = self.ser.read(9)

            if len(response) < 9:
                self.last_error = f"Respon kurang dari 9 bytes (diterima: {len(response)} byte)"
                return None, None, False

            slave_id = response[0]
            function_code = response[1]
            byte_count = response[2]

            if slave_id != 1 or function_code != 4 or byte_count != 4:
                self.last_error = f"Validasi gagal: ID={slave_id}, Func={function_code}, Count={byte_count}"
                return None, None, False

            # Suhu: signed 16-bit
            temperature_raw = int.from_bytes(response[3:5], byteorder="big", signed=True)
            temperature = round(temperature_raw / 10.0, 1)

            # Kelembaban: unsigned 16-bit
            humidity_raw = int.from_bytes(response[5:7], byteorder="big", signed=False)
            humidity = round(humidity_raw / 10.0, 1)

            self.last_temp = temperature
            self.last_hum = humidity
            self.last_success_time = time.time()
            self.last_error = None
            logger.info("[SHT20 HARDWARE REAL] Suhu: %.1f °C | Kelembaban: %.1f %%RH", temperature, humidity)

            return temperature, humidity, True

        except Exception as e:
            self.last_error = f"Exception saat read: {e}"
            logger.debug("Exception baca SHT20: %s", e)
            try:
                import lgpio
                if self.gpio is not None:
                    lgpio.gpio_write(self.gpio, DE_RE_GPIO, 0)
            except Exception:
                pass
            return None, None, False

    def close(self):
        try:
            import lgpio
            if self.gpio is not None:
                lgpio.gpio_write(self.gpio, DE_RE_GPIO, 0)
                lgpio.gpio_free(self.gpio, DE_RE_GPIO)
                lgpio.gpiochip_close(self.gpio)
        except Exception:
            pass
        if self.ser and self.ser.is_open:
            try:
                self.ser.close()
            except Exception:
                pass

sht20_sensor = SHT20RS485()
