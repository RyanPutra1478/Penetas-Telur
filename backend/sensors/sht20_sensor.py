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
                logger.info("DE/RE Pin 18 akan dikendalikan via fail-safe pinctrl hardware.")
        except ImportError:
            logger.info("Library lgpio tidak terpasang, menggunakan pinctrl hardware.")
        except Exception as e:
            logger.info("Fallback pinctrl untuk DE/RE: %s", e)

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
        """Auto failover variasi perintah Modbus jika pembacaan gagal"""
        self.port = "/dev/ttyAMA0"
        self.active_cmd_index = (self.active_cmd_index + 1) % len(MODBUS_COMMANDS)

    def read(self):
        """
        Mengirim request Modbus dan membaca respon 9 bytes.
        Dilengkapi timing presisi half-duplex MAX485.
        Mengembalikan tuple: (temperature, humidity, is_ok)
        """
        if not self.is_connected or not self.ser or not self.ser.is_open:
            self._init_sensor()
            if not self.is_connected or not self.ser:
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
            else:
                try: subprocess.run(["pinctrl", "set", "18", "op", "dh"], stderr=subprocess.DEVNULL)
                except Exception: pass
            time.sleep(0.002)

            # Kirim request Modbus
            self.ser.write(cmd_bytes)
            self.ser.flush()

            # 2. KEMBALI KE MODE RECEIVE (LOW) SECARA INSTAN
            if self.gpio is not None:
                try: lgpio.gpio_write(self.gpio, DE_RE_GPIO, 0)
                except Exception: pass
            else:
                try: subprocess.run(["pinctrl", "set", "18", "op", "dl"], stderr=subprocess.DEVNULL)
                except Exception: pass

            # 3. BACA RESPONSE
            response = self.ser.read(9)

            if len(response) < 8:
                self.consecutive_fails += 1
                self.last_error = f"Respon kurang dari 8 bytes (diterima: {len(response)} byte pada {self.port})"
                if self.consecutive_fails >= 4:
                    self._switch_port_or_cmd()
                    self.consecutive_fails = 0
                return None, None, False

            # Format 1: Normal 9 bytes (01 04 04 T_H T_L H_H H_L CRC_L CRC_H)
            if len(response) >= 9 and response[0] == 1 and (response[1] in (3, 4)):
                raw_t = int.from_bytes(response[3:5], byteorder="big", signed=True)
                raw_h = int.from_bytes(response[5:7], byteorder="big", signed=False)
            # Format 2: Toleransi 8 bytes jika Slave ID terpotong transisi bus (04 04 T_H T_L H_H H_L CRC_L CRC_H)
            elif len(response) >= 8 and (response[0] in (3, 4)) and response[1] == 4:
                raw_t = int.from_bytes(response[2:4], byteorder="big", signed=True)
                raw_h = int.from_bytes(response[4:6], byteorder="big", signed=False)
            else:
                self.last_error = f"Format respon tidak dikenali: {response.hex().upper()}"
                self.consecutive_fails += 1
                return None, None, False

            temperature = round(raw_t / 10.0, 1)
            humidity = round(raw_h / 10.0, 1)

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


