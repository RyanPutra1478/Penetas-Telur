"""
TETASCO CONNECT — SHT20 / XY-MD02 RS485 MODBUS RTU DRIVER
Menggunakan MAX485 TTL Half-Duplex via GPIO UART (/dev/ttyAMA0 / /dev/serial0)
dengan kontrol arah pin DE/RE pada GPIO 18 (Physical Pin 12).
Terbukti sukses dan kompatibel penuh dengan Raspberry Pi OS Bookworm (lgpio).
"""

import os
import time
import logging

logger = logging.getLogger("SHT20Sensor")

# ==========================================
# KONFIGURASI DEFAULT HARDWARE RASPBERRY PI
# ==========================================
DEFAULT_PORTS = ["/dev/ttyAMA0", "/dev/serial0", "/dev/ttyS0", "/dev/ttyUSB0"]
BAUDRATE = 9600
DE_RE_GPIO = 18    # Physical Pin 12 pada Raspberry Pi (disambung ke DE + RE)

# Frame Request Modbus RTU untuk XY-MD02 SHT20:
# Slave ID: 01, Func: 04 (Read Input Reg), Reg: 0001, Qty: 0002, CRC: 20 0B
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
            self.gpio_handle = lgpio.gpiochip_open(0)
            lgpio.gpio_claim_output(self.gpio_handle, self.de_re_pin, 0) # Default: Receive (LOW)
            self.has_lgpio = True
            logger.info("Pin DE/RE MAX485 berhasil diinisialisasi pada GPIO %d (Pin 12) via lgpio.", self.de_re_pin)
        except Exception as e:
            self.has_lgpio = False
            logger.info("lgpio tidak aktif (mode non-Linux/simulasi): %s", e)

        # 2. Inisialisasi Serial Port UART
        target_port = self._find_available_port()
        if not target_port:
            logger.info("Port serial RS485 (%s) belum ditemukan.", ", ".join(DEFAULT_PORTS))
            self.is_connected = False
            return

        try:
            import serial
            self.port = target_port
            self.ser = serial.Serial(
                port=self.port,
                baudrate=self.baudrate,
                bytesize=serial.EIGHTBITS,
                parity=serial.PARITY_NONE,
                stopbits=serial.STOPBITS_ONE,
                timeout=0.8
            )
            self.ser.reset_input_buffer()
            self.ser.reset_output_buffer()
            self.is_connected = True
            logger.info("Serial port UART RS485 berhasil dibuka pada %s @ %d baud.", self.port, self.baudrate)
        except Exception as e:
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
        # Coba buka serial jika sebelumnya belum terbuka
        if not self.is_connected or not self.ser or not self.ser.is_open:
            self._init_hardware()
            if not self.is_connected or not self.ser:
                return None, None, False

        try:
            self.ser.reset_input_buffer()
            self.ser.reset_output_buffer()

            # 1. TRANSMIT MODE: Kirim frame request Modbus
            self._set_tx_mode()
            self.ser.write(MODBUS_REQUEST)
            self.ser.flush()

            # 2. RECEIVE MODE: Langsung kembalikan ke mode terima
            self._set_rx_mode()

            # 3. BACA RESPONSE (9 Bytes)
            # Response format: [SlaveID, Func, ByteCount, TempHi, TempLo, HumHi, HumLo, CrcLo, CrcHi]
            response = self.ser.read(9)

            if len(response) < 9:
                return None, None, False

            slave_id = response[0]
            func_code = response[1]
            byte_count = response[2]

            # Validasi respon Modbus
            if slave_id != 1 or func_code != 4 or byte_count != 4:
                logger.debug("Respon Modbus tidak valid: ID=%s, Func=%s, Count=%s", slave_id, func_code, byte_count)
                return None, None, False

            # Ekstraksi Suhu (Signed 16-bit integer, dibagi 10.0)
            raw_temp = int.from_bytes(response[3:5], byteorder="big", signed=True)
            temperature = round(raw_temp / 10.0, 1)

            # Ekstraksi Kelembaban (Unsigned 16-bit integer, dibagi 10.0)
            raw_hum = int.from_bytes(response[5:7], byteorder="big", signed=False)
            humidity = round(raw_hum / 10.0, 1)

            # Verifikasi batas fisik wajar inkubator
            if -10.0 <= temperature <= 80.0 and 0.0 <= humidity <= 100.0:
                return temperature, humidity, True

            return None, None, False

        except Exception as e:
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
            lgpio.gpiochip_close(self.gpio_handle)

sht20_sensor = SHT20RS485()
