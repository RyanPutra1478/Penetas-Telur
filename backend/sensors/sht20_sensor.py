"""
TETASCO CONNECT — SHT20 RS485 MODBUS RTU SENSOR DRIVER
Membaca suhu & kelembaban presisi tinggi dari sensor SHT20 via RS485:
- Mode A: Dongle USB to RS485 (/dev/ttyUSB0) -> Auto Direction Control (Tanpa pin DE/RE)
- Mode B: Modul MAX485 TTL via GPIO UART (/dev/serial0) -> Didukung pin kontrol arah DE/RE (Default: GPIO 18)
"""

import os
import glob
import time
import logging

logger = logging.getLogger("SHT20Sensor")

# Pin GPIO untuk kendali arah MAX485 (DE & RE digabung jadi satu kabel)
# Hanya digunakan jika memakai jalur GPIO UART (/dev/serial0), BUKAN untuk USB.
DEFAULT_DE_RE_PIN = 18

class SHT20RS485:
    """
    Driver Modbus RTU untuk Sensor Suhu & Kelembaban SHT20 RS485.
    Spesifikasi default:
      - Baudrate: 9600
      - Data bits: 8, Stop bits: 1, Parity: None
      - Slave Address: 1 (0x01)
      - Function Code: 0x04 (Read Input Registers) atau 0x03 (Read Holding Registers)
      - Register 0x0001: Suhu (Value / 10.0 °C)
      - Register 0x0002: Kelembaban (Value / 10.0 % RH)
    """
    def __init__(self, port=None, slave_address=1, baudrate=9600, de_re_pin=DEFAULT_DE_RE_PIN):
        self.port = port
        self.slave_address = slave_address
        self.baudrate = baudrate
        self.de_re_pin = de_re_pin
        self.de_re_device = None
        self.instrument = None
        self.is_connected = False

        self._init_connection()

    def _find_serial_port(self):
        """Mendeteksi otomatis port serial USB-RS485 di Raspberry Pi / Linux / Windows"""
        if self.port:
            return self.port

        # 1. Cari port USB converter di Linux / Raspberry Pi (Prioritas Utama)
        usb_ports = sorted(glob.glob("/dev/ttyUSB*") + glob.glob("/dev/ttyACM*") + glob.glob("/dev/serial/by-id/*"))
        if usb_ports:
            return usb_ports[0]

        # 2. Cari port serial GPIO Raspberry Pi jika pakai modul TTL MAX485
        if os.path.exists("/dev/serial0"):
            return "/dev/serial0"
        if os.path.exists("/dev/ttyAMA0"):
            return "/dev/ttyAMA0"
        if os.path.exists("/dev/ttyS0"):
            return "/dev/ttyS0"

        return None

    def _init_de_re_pin(self):
        """Inisialisasi pin kontrol arah GPIO (DE/RE) jika menggunakan UART TTL"""
        if self.port and not "ttyUSB" in self.port and not "ttyACM" in self.port:
            try:
                from gpiozero import DigitalOutputDevice
                self.de_re_device = DigitalOutputDevice(self.de_re_pin, active_high=True, initial_value=False)
                logger.info("Pin kontrol arah MAX485 (DE & RE) aktif pada GPIO %d", self.de_re_pin)
            except Exception as e:
                logger.debug("Tidak dapat menginisialisasi pin DE/RE GPIO %d: %s", self.de_re_pin, e)
                self.de_re_device = None

    def _set_mode_transmit(self):
        """DE=HIGH, RE=HIGH (Siap Kirim Request Modbus)"""
        if self.de_re_device:
            self.de_re_device.on()
            time.sleep(0.003)

    def _set_mode_receive(self):
        """DE=LOW, RE=LOW (Siap Menerima Balasan dari Sensor)"""
        if self.de_re_device:
            time.sleep(0.003)
            self.de_re_device.off()

    def _init_connection(self):
        detected_port = self._find_serial_port()
        if not detected_port:
            logger.info("Modul RS485 belum terdeteksi pada port USB/Serial. Menunggu koneksi...")
            self.is_connected = False
            return

        try:
            import minimalmodbus
            import serial

            self.port = detected_port
            self._init_de_re_pin()

            inst = minimalmodbus.Instrument(self.port, self.slave_address)
            inst.serial.baudrate = self.baudrate
            inst.serial.bytesize = 8
            inst.serial.parity = serial.PARITY_NONE
            inst.serial.stopbits = 1
            inst.serial.timeout = 0.6
            inst.mode = minimalmodbus.MODE_RTU
            inst.clear_buffers_before_each_transaction = True
            inst.close_port_after_each_call = False

            # Tes baca register suhu untuk memverifikasi sensor hidup
            self._set_mode_transmit()
            try:
                # Coba function code 4 (Read Input Register)
                t = inst.read_register(1, numberOfDecimals=1, functioncode=4, signed=True)
            except Exception:
                # Coba function code 3 (Read Holding Register)
                t = inst.read_register(1, numberOfDecimals=1, functioncode=3, signed=True)
            finally:
                self._set_mode_receive()

            self.instrument = inst
            self.is_connected = True
            logger.info("Sensor SHT20 RS485 Modbus BERHASIL terhubung pada port %s (Suhu awal: %.1f °C)", self.port, t)
        except ImportError:
            logger.warning("Library 'minimalmodbus' atau 'pyserial' belum terinstall. Jalankan: pip install minimalmodbus pyserial")
            self.is_connected = False
        except Exception as e:
            logger.info("Port %s ditemukan tetapi sensor SHT20 belum merespons (%s).", detected_port, e)
            self.is_connected = False

    def read(self):
        """
        Membaca suhu (°C) dan kelembaban (% RH) dari SHT20.
        Mengembalikan tuple: (temperature, humidity, status_ok)
        """
        if not self.is_connected or not self.instrument:
            # Coba hubungkan ulang jika port baru saja dicolok
            self._init_connection()
            if not self.is_connected:
                return None, None, False

        try:
            self._set_mode_transmit()
            try:
                temp = self.instrument.read_register(1, numberOfDecimals=1, functioncode=4, signed=True)
                hum = self.instrument.read_register(2, numberOfDecimals=1, functioncode=4, signed=False)
            except Exception:
                temp = self.instrument.read_register(1, numberOfDecimals=1, functioncode=3, signed=True)
                hum = self.instrument.read_register(2, numberOfDecimals=1, functioncode=3, signed=False)
            finally:
                self._set_mode_receive()

            # Validasi batas logis suhu & kelembaban telur
            if -20.0 <= temp <= 80.0 and 0.0 <= hum <= 100.0:
                return round(temp, 1), round(hum, 1), True
            else:
                logger.warning("Nilai sensor di luar batas wajar: T=%.1f H=%.1f", temp, hum)
                return None, None, False
        except Exception as e:
            logger.debug("Gagal membaca SHT20 RS485: %s", e)
            return None, None, False

sht20_sensor = SHT20RS485()
