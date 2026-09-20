"""
TETASCO CONNECT — SHT20 / XY-MD02 RS485 MODBUS RTU DRIVER
Port: /dev/serial0 @ 9600 baud | DE+RE: GPIO 18 (Pin Fisik 12) via lgpio
"""

import os
import time
import logging
import subprocess

logger = logging.getLogger("SHT20Sensor")

# Port serial terkonfirmasi di hardware Raspberry Pi header Pin 8 & 10 adalah /dev/ttyAMA0
SERIAL_PORT = "/dev/ttyAMA0"
BAUDRATE = 9600
DE_RE_GPIO = 18    # Physical Pin 12 -> DE + RE

# Modbus Request XY-MD02:
# 1. Slave ID 1, Func 04 (Read Input Registers), Reg 0001, Qty 0002 -> 01 04 00 01 00 02 20 0B
# 2. Slave ID 1, Func 04 (Read Input Registers), Reg 0000, Qty 0002 -> 01 04 00 00 00 02 71 CB
# 3. Slave ID 1, Func 03 (Read Holding Registers), Reg 0001, Qty 0002 -> 01 03 00 01 00 02 95 CB
# 4. Slave ID 1, Func 03 (Read Holding Registers), Reg 0000, Qty 0002 -> 01 03 00 00 00 02 C4 0B
MODBUS_COMMANDS = [
    ("Func 04 (Reg 1)", bytes.fromhex("01 04 00 01 00 02 20 0B")),
    ("Func 04 (Reg 0)", bytes.fromhex("01 04 00 00 00 02 71 CB")),
    ("Func 03 (Reg 1)", bytes.fromhex("01 03 00 01 00 02 95 CB")),
    ("Func 03 (Reg 0)", bytes.fromhex("01 03 00 00 00 02 C4 0B")),
]
REQUEST = MODBUS_COMMANDS[0][1]

def get_candidate_ports():
    """
    Mengembalikan daftar port serial prioritas.
    /dev/ttyAMA0 adalah port terkonfirmasi untuk Pin 8 (TX) & Pin 10 (RX).
    """
    candidates = []
    if os.path.exists("/dev/ttyAMA0"):
        candidates.append("/dev/ttyAMA0")
    if os.path.exists("/dev/serial0"):
        candidates.append("/dev/serial0")
    if os.path.exists("/dev/ttyUSB0"):
        candidates.append("/dev/ttyUSB0")
    if os.path.exists("/dev/ttyAMA10"):
        candidates.append("/dev/ttyAMA10")
    if os.path.exists("/dev/ttyS0"):
        candidates.append("/dev/ttyS0")
    return candidates

class SHT20RS485:
    def __init__(self):
        self.ser = None
        self.gpio = None
        self.port = None
        self.active_cmd_index = 0
        self.is_connected = False
        self.consecutive_fails = 0
        self.last_error = "Belum inisialisasi"
        self.last_temp = None
        self.last_hum = None
        self.last_success_time = 0

        self._init_sensor()

    def _init_sensor(self):
        # 1. Buka lgpio chip (chip 0 untuk RPi 4/3, chip 4 untuk RPi 5)
        try:
            import lgpio
            if self.gpio is None:
                for chip_id in [4, 0]: # Coba chip 4 dulu (RPi 5), lalu chip 0 (RPi 4/3)
                    try:
                        h = lgpio.gpiochip_open(chip_id)
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

        # 2. Buka serial port
        try:
            import serial
            candidates = get_candidate_ports()
            if not candidates:
                self.last_error = "Tidak ada port serial UART yang tersedia"
                self.is_connected = False
                return

            # Pilih port pertama dari kandidat jika belum diset atau port sebelumnya gagal
            if not self.port or self.port not in candidates:
                self.port = candidates[0]

            if self.ser and self.ser.is_open:
                try:
                    self.ser.close()
                except Exception:
                    pass

            self.ser = serial.Serial(
                port=self.port,
                baudrate=BAUDRATE,
                bytesize=serial.EIGHTBITS,
                parity=serial.PARITY_NONE,
                stopbits=serial.STOPBITS_ONE,
                timeout=0.6
            )
            self.ser.reset_input_buffer()
            self.ser.reset_output_buffer()
            self.is_connected = True
            self.last_error = None
            logger.info("Serial %s berhasil dibuka @ %d baud.", self.port, BAUDRATE)
        except Exception as e:
            self.last_error = f"Gagal buka serial {self.port}: {e}"
            logger.warning("Gagal buka serial port %s: %s", self.port, e)
            self.is_connected = False

    def _switch_port_or_cmd(self):
        """Auto failover port atau perintah Modbus jika terus gagal"""
        candidates = get_candidate_ports()
        if len(candidates) > 1:
            try:
                curr_idx = candidates.index(self.port) if self.port in candidates else 0
                next_port = candidates[(curr_idx + 1) % len(candidates)]
                logger.info("Mencoba ganti port serial dari %s ke %s", self.port, next_port)
                self.port = next_port
                self._init_sensor()
            except Exception:
                pass

        # Switch juga variasi perintah Modbus
        self.active_cmd_index = (self.active_cmd_index + 1) % len(MODBUS_COMMANDS)

    def read(self):
        """
        Mengirim request Modbus dan membaca respon 9 bytes.
        Dilengkapi timing presisi half-duplex MAX485.
        Mengembalikan tuple: (temperature, humidity, is_ok)
        """
        if not self.is_connected or not self.ser or not self.ser.is_open or self.gpio is None:
            self._init_sensor()
            if not self.is_connected or not self.ser or self.gpio is None:
                return None, None, False

        try:
            import lgpio

            cmd_name, cmd_bytes = MODBUS_COMMANDS[self.active_cmd_index]

            self.ser.reset_input_buffer()
            self.ser.reset_output_buffer()

            # 1. MODE TRANSMIT (HIGH)
            if self.gpio is not None:
                try: lgpio.gpio_write(self.gpio, DE_RE_GPIO, 1)
                except Exception: pass
            try: subprocess.run(["pinctrl", "set", "18", "op", "dh"], stderr=subprocess.DEVNULL)
            except Exception: pass
            time.sleep(0.005) # Waktu setup driver MAX485 sebelum pengiriman

            # Kirim request Modbus
            self.ser.write(cmd_bytes)
            self.ser.flush()

            # TAHAN TRANSMIT: Tunggu seluruh 8 bytes fisik tuntas keluar kabel (8 bytes @ 9600 = ~8.3ms)
            time.sleep(0.012)

            # 2. KEMBALI KE MODE RECEIVE (LOW)
            if self.gpio is not None:
                try: lgpio.gpio_write(self.gpio, DE_RE_GPIO, 0)
                except Exception: pass
            try: subprocess.run(["pinctrl", "set", "18", "op", "dl"], stderr=subprocess.DEVNULL)
            except Exception: pass

            # 3. BACA RESPONSE (9 Bytes)
            response = self.ser.read(9)

            if len(response) < 9:
                self.consecutive_fails += 1
                self.last_error = f"Respon kurang dari 9 bytes (diterima: {len(response)} byte pada {self.port})"
                
                # Jika sudah 4x gagal beruntun, coba port/command alternatif
                if self.consecutive_fails >= 4:
                    self._switch_port_or_cmd()
                    self.consecutive_fails = 0

                return None, None, False

            slave_id = response[0]
            function_code = response[1]
            byte_count = response[2]

            # Validasi respon Modbus (Slave 1, Function 3 atau 4, byte count 4)
            if slave_id != 1 or (function_code not in (3, 4)) or byte_count != 4:
                self.last_error = f"Validasi gagal: ID={slave_id}, Func={function_code}, Count={byte_count}"
                self.consecutive_fails += 1
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
            self.consecutive_fails = 0
            logger.info("[SHT20 HARDWARE REAL] Suhu: %.1f °C | Kelembaban: %.1f %%RH (via %s)", temperature, humidity, self.port)

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

if __name__ == '__main__':
    import sys
    print("==========================================================")
    print("🥚 TETASCO CONNECT — SHT20 / XY-MD02 RS485 TESTER")
    candidates = get_candidate_ports()
    print(f"Port Terdeteksi: {candidates}")
    if os.path.exists("/dev/serial0") and os.path.islink("/dev/serial0"):
        print(f"Symlink serial0: /dev/serial0 -> {os.path.realpath('/dev/serial0')}")
    if os.path.exists("/dev/ttyAMA10"):
        print("💡 Raspberry Pi 5 terdeteksi (/dev/ttyAMA10 aktif untuk Pin 8 & 10)")
    print(f"Port Aktif    : {sht20_sensor.port}")
    print(f"Baudrate      : {BAUDRATE}")
    print(f"DE/RE Pin     : GPIO {DE_RE_GPIO} (Pin Fisik 12)")
    print(f"Status Buka   : {'TERHUBUNG' if sht20_sensor.is_connected else 'GAGAL (' + str(sht20_sensor.last_error) + ')'}")
    print("==========================================================")

    if not sht20_sensor.is_connected:
        print(f"❌ Tidak dapat membuka hardware: {sht20_sensor.last_error}")
        sys.exit(1)

    print("Membaca sensor secara real-time (tekan Ctrl+C untuk keluar)...\n")
    try:
        while True:
            temp, hum, ok = sht20_sensor.read()
            cmd_name, _ = MODBUS_COMMANDS[sht20_sensor.active_cmd_index]
            if ok:
                print(f"✅ [SHT20 FISIK] Port: {sht20_sensor.port} | Suhu: {temp:.1f} °C  |  Kelembaban: {hum:.1f} % RH")
            else:
                print(f"❌ Gagal baca ({cmd_name} di {sht20_sensor.port}): {sht20_sensor.last_error}")
            time.sleep(1.0)
    except KeyboardInterrupt:
        print("\nDihentikan.")
    finally:
        sht20_sensor.close()


