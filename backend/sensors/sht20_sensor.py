"""
TETASCO CONNECT — SHT20 / XY-MD02 RS485 MODBUS RTU DRIVER
Menggunakan MAX485 TTL Half-Duplex via GPIO UART (/dev/ttyAMA0 / /dev/serial0)
dengan kontrol arah pin DE/RE pada GPIO 18 (Physical Pin 12).
Dilengkapi timing delay hardware RS485 presisi tinggi dan logging diagnostik lengkap.
"""

import os
import time
import logging

logger = logging.getLogger("SHT20Sensor")

DEFAULT_PORTS = ["/dev/ttyAMA0", "/dev/serial0", "/dev/ttyS0", "/dev/ttyUSB0"]
BAUDRATE = 9600
DE_RE_GPIO = 18    # Physical Pin 12 pada Raspberry Pi (disambung ke DE + RE)

# Frame Request Modbus RTU untuk XY-MD02 SHT20:
# 01 04 00 01 00 02 20 0B (Slave 1, Function 4, Reg 1, Qty 2)
MODBUS_REQUEST = bytes.fromhex("01 04 00 01 00 02 20 0B")

class SHT20RS485:
    def __init__(self, port=None, de_re_pin=DE_RE_GPIO, baudrate=BAUDRATE):
        self.port = port
        self.de_re_pin = de_re_pin
        self.baudrate = baudrate
        self.ser = None
        self.gpio_handle = None
        self.has_lgpio = False
        self.is_connected = False
        self.last_error = "Belum diinisialisasi"
        self.last_temp = None
        self.last_hum = None
        self.last_success_time = 0

        self._init_hardware()

    def _find_available_port(self):
        if self.port and os.path.exists(self.port):
            return self.port
        for p in DEFAULT_PORTS:
            if os.path.exists(p):
                return p
        return None

    def _init_hardware(self):
        # 1. Inisialisasi lgpio untuk kontrol pin DE/RE (GPIO 18 / Pin 12)
        try:
            import lgpio
            # Coba buka gpiochip 0 (RPi 4/3) atau chip 4 (RPi 5)
            for chip_num in [0, 4]:
                try:
                    self.gpio_handle = lgpio.gpiochip_open(chip_num)
                    lgpio.gpio_claim_output(self.gpio_handle, self.de_re_pin, 0) # Default: Receive (LOW)
                    self.has_lgpio = True
                    logger.info("Pin DE/RE MAX485 siap pada GPIO %d (chip %d).", self.de_re_pin, chip_num)
                    break
                except Exception:
                    continue
        except ImportError:
            self.has_lgpio = False
            self.last_error = "Library lgpio tidak ditemukan (khusus Linux RPi)"
        except Exception as e:
            self.has_lgpio = False
            self.last_error = f"Gagal init lgpio: {e}"
            logger.warning("Gagal inisialisasi lgpio GPIO 18: %s", e)

        # 2. Inisialisasi Serial Port UART
        target_port = self._find_available_port()
        if not target_port:
            self.last_error = f"Port serial tidak ditemukan ({', '.join(DEFAULT_PORTS)})"
            self.is_connected = False
            return

        try:
            import serial
            self.port = target_port
            if self.ser and self.ser.is_open:
                try:
                    self.ser.close()
                except Exception:
                    pass

            self.ser = serial.Serial(
                port=self.port,
                baudrate=self.baudrate,
                bytesize=serial.EIGHTBITS,
                parity=serial.PARITY_NONE,
                stopbits=serial.STOPBITS_ONE,
                timeout=1.0
            )
            self.ser.reset_input_buffer()
            self.ser.reset_output_buffer()
            self.is_connected = True
            self.last_error = None
            logger.info("Serial port RS485 terbuka pada %s @ %d baud.", self.port, self.baudrate)
        except Exception as e:
            self.last_error = f"Gagal buka serial {target_port}: {e}"
            logger.warning("Gagal membuka serial port %s: %s", target_port, e)
            self.is_connected = False

    def _set_tx_mode(self):
        """Set MAX485 ke mode Transmit (HIGH)"""
        if self.has_lgpio and self.gpio_handle is not None:
            import lgpio
            lgpio.gpio_write(self.gpio_handle, self.de_re_pin, 1)

    def _set_rx_mode(self):
        """Set MAX485 ke mode Receive (LOW)"""
        if self.has_lgpio and self.gpio_handle is not None:
            import lgpio
            lgpio.gpio_write(self.gpio_handle, self.de_re_pin, 0)

    def read(self):
        """
        Mengirim request Modbus RTU ke sensor SHT20 / XY-MD02,
        membaca respons 9 bytes, dan mengekstrak nilai Suhu & Kelembaban.
        Mengembalikan tuple: (temperature, humidity, is_ok)
        """
        if not self.is_connected or not self.ser or not self.ser.is_open:
            self._init_hardware()
            if not self.is_connected or not self.ser:
                return None, None, False

        try:
            self.ser.reset_input_buffer()
            self.ser.reset_output_buffer()

            # 1. TRANSMIT MODE: Set DE/RE HIGH
            self._set_tx_mode()
            time.sleep(0.002) # Jeda kecil stabilisasi pin DE

            # Kirim Modbus request: 01 04 00 01 00 02 20 0B
            self.ser.write(MODBUS_REQUEST)
            self.ser.flush()

            # PENTING: Tunggu transmisi byte terakhir selesai keluar dari UART FIFO (9600 baud = ~1ms per char)
            time.sleep(0.012)

            # 2. RECEIVE MODE: Set DE/RE LOW
            self._set_rx_mode()

            # 3. BACA RESPONSE (9 Bytes)
            response = self.ser.read(9)

            if len(response) < 9:
                self.last_error = f"Timeout baca SHT20 (Hanya terima {len(response)}/9 bytes)"
                logger.debug("SHT20 read timeout. Received bytes: %s", response.hex() if response else "KOSONG")
                return None, None, False

            slave_id = response[0]
            func_code = response[1]
            byte_count = response[2]

            # Validasi respon Modbus
            if slave_id != 1 or func_code != 4 or byte_count != 4:
                self.last_error = f"Respon Modbus salah (ID={slave_id}, Func={func_code})"
                logger.debug("Respon Modbus invalid: %s", response.hex())
                return None, None, False

            # Ekstraksi Suhu (Signed 16-bit integer, dibagi 10.0)
            raw_temp = int.from_bytes(response[3:5], byteorder="big", signed=True)
            temperature = round(raw_temp / 10.0, 1)

            # Ekstraksi Kelembaban (Unsigned 16-bit integer, dibagi 10.0)
            raw_hum = int.from_bytes(response[5:7], byteorder="big", signed=False)
            humidity = round(raw_hum / 10.0, 1)

            # Verifikasi batas fisik wajar inkubator (-10 s.d 80 C)
            if -10.0 <= temperature <= 80.0 and 0.0 <= humidity <= 100.0:
                self.last_temp = temperature
                self.last_hum = humidity
                self.last_success_time = time.time()
                self.last_error = None
                return temperature, humidity, True

            self.last_error = f"Nilai di luar batas wajar: T={temperature}, H={humidity}"
            return None, None, False

        except Exception as e:
            self.last_error = f"Exception RS485: {e}"
            logger.debug("Exception baca SHT20 RS485: %s", e)
            self._set_rx_mode()
            return None, None, False

    def close(self):
        """Membersihkan resource serial dan GPIO saat sistem dimatikan"""
        self._set_rx_mode()
        if self.ser and self.ser.is_open:
            self.ser.close()
        if self.has_lgpio and self.gpio_handle is not None:
            import lgpio
            try:
                lgpio.gpiochip_close(self.gpio_handle)
            except Exception:
                pass

sht20_sensor = SHT20RS485()
