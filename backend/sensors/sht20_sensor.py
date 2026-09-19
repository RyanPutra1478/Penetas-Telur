"""
TETASCO CONNECT — SHT20 / XY-MD02 RS485 MODBUS RTU DRIVER
Implementasi 1-ke-1 dengan script testing hardware yang telah berhasil.
Port: /dev/ttyAMA0 @ 9600 baud | DE+RE: GPIO 18 (Pin Fisik 12) via lgpio
"""

import os
import time
import logging

logger = logging.getLogger("SHT20Sensor")

SERIAL_PORT = "/dev/ttyAMA0"
BAUDRATE = 9600
DE_RE_GPIO = 18    # Physical Pin 12 -> DE + RE

# Modbus Request XY-MD02:
# Slave ID: 1, Function: 04 (Read Input Registers), Start Reg: 0001, Quantity: 0002, CRC: 20 0B
REQUEST = bytes.fromhex("01 04 00 01 00 02 20 0B")

class SHT20RS485:
    def __init__(self):
        self.ser = None
        self.gpio = None
        self.is_connected = False
        self.last_error = "Belum inisialisasi"
        self.last_temp = None
        self.last_hum = None
        self.last_success_time = 0

        self._init_sensor()

    def _init_sensor(self):
        # 1. Buka lgpio chip 0
        try:
            import lgpio
            if self.gpio is None:
                # Coba chip 0 (RPi 4/3), fallback chip 4 (RPi 5)
                for chip_id in [0, 4]:
                    try:
                        self.gpio = lgpio.gpiochip_open(chip_id)
                        lgpio.gpio_claim_output(self.gpio, DE_RE_GPIO, 0)
                        logger.info("lgpio chip %d DE+RE GPIO %d siap.", chip_id, DE_RE_GPIO)
                        break
                    except Exception:
                        continue
        except ImportError:
            self.last_error = "Library lgpio tidak terinstall"
            logger.warning("Library lgpio belum terpasang.")
            return
        except Exception as e:
            self.last_error = f"Error lgpio: {e}"
            logger.warning("Gagal setup lgpio: %s", e)
            return

        # 2. Buka serial port
        try:
            import serial
            port_to_use = SERIAL_PORT
            if not os.path.exists(port_to_use):
                for alt in ["/dev/serial0", "/dev/ttyS0", "/dev/ttyUSB0"]:
                    if os.path.exists(alt):
                        port_to_use = alt
                        break

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
            self.last_error = f"Gagal buka serial {SERIAL_PORT}: {e}"
            logger.warning("Gagal buka serial port %s: %s", SERIAL_PORT, e)
            self.is_connected = False

    def read(self):
        """
        Mengirim request Modbus dan membaca respon 9 bytes persis seperti script testing user.
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

            # 2. LANGSUNG MODE RECEIVE (LOW) - TANPA DELAY TIDUR
            lgpio.gpio_write(self.gpio, DE_RE_GPIO, 0)

            # 3. BACA RESPONSE (9 Bytes)
            response = self.ser.read(9)

            if len(response) < 9:
                self.last_error = f"Response tidak lengkap (diterima {len(response)}/9 byte: {response.hex()})"
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

sht20_sensor = SHT20RS485()
