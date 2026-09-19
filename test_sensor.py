#!/usr/bin/env python3
"""
TETASCO CONNECT — DIAGNOSTIK SENSOR SHT20 / XY-MD02 RS485
Jalankan script ini untuk mengetahui letak kendala pembacaan sensor secara presisi:
python3 test_sensor.py
"""

import os
import sys
import time

print("==========================================================")
print("🔍 DIAGNOSTIK HARDWARE SENSOR SHT20 (XY-MD02 RS485)")
print("==========================================================")

# 1. Cek User & Izin
import getpass
user = getpass.getuser()
print(f"[1/6] User sistem: {user}")

# 2. Cek Port Serial
SERIAL_PORT = "/dev/ttyAMA0"
print(f"[2/6] Memeriksa ketersediaan port serial:")
for p in ["/dev/ttyAMA0", "/dev/serial0", "/dev/ttyS0", "/dev/ttyUSB0"]:
    exists = os.path.exists(p)
    perm = "Dapat diakses" if exists and os.access(p, os.R_OK | os.W_OK) else "Tidak berizin / Tidak ada"
    print(f"  - {p:16} : {'ADA (' + perm + ')' if exists else 'TIDAK DITEMUKAN'}")

if not os.path.exists(SERIAL_PORT):
    if os.path.exists("/dev/serial0"):
        SERIAL_PORT = "/dev/serial0"
        print(f"  -> Menggunakan alternatif: {SERIAL_PORT}")

# 3. Cek Library lgpio & Serial
print(f"[3/6] Memeriksa library Python:")
try:
    import serial
    print("  - pyserial          : OK (Terpasang)")
except ImportError:
    print("  - pyserial          : GAGAL (Belum terpasang. Jalankan: pip install pyserial)")
    sys.exit(1)

try:
    import lgpio
    print("  - lgpio             : OK (Terpasang)")
except ImportError:
    print("  - lgpio             : GAGAL (Belum terpasang. Jalankan: pip install rpi-lgpio)")
    sys.exit(1)

# 4. Inisialisasi lgpio chip & Pin DE/RE (GPIO 18)
print(f"[4/6] Menginisialisasi Pin DE/RE (GPIO 18 / Pin 12):")
gpio_chip = None
for chip_num in [0, 4, 1]:
    try:
        h = lgpio.gpiochip_open(chip_num)
        lgpio.gpio_claim_output(h, 18, 0)
        gpio_chip = h
        print(f"  -> Berhasil membuka /dev/gpiochip{chip_num} untuk GPIO 18.")
        break
    except Exception as e:
        print(f"  -> Coba chip {chip_num} gagal: {e}")

if gpio_chip is None:
    print("  ❌ FATAL: Tidak dapat mengontrol GPIO 18. Pastikan user masuk ke grup 'gpio'!")
    sys.exit(1)

# 5. Buka Serial Port
print(f"[5/6] Membuka port serial {SERIAL_PORT} @ 9600 baud:")
try:
    ser = serial.Serial(
        port=SERIAL_PORT,
        baudrate=9600,
        bytesize=serial.EIGHTBITS,
        parity=serial.PARITY_NONE,
        stopbits=serial.STOPBITS_ONE,
        timeout=1.0
    )
    ser.reset_input_buffer()
    ser.reset_output_buffer()
    print("  -> Port serial berhasil dibuka.")
except Exception as e:
    print(f"  ❌ FATAL Gagal membuka {SERIAL_PORT}: {e}")
    print("     (Jika error 'Device or resource busy', berarti port sedang dikunci proses lain!)")
    sys.exit(1)

# 6. Kirim Request Modbus RTU
REQUEST = bytes.fromhex("01 04 00 01 00 02 20 0B")
print(f"[6/6] Mengirim Modbus Request: {REQUEST.hex().upper()}")

print("\n--- MENCOBA 3 KALI PEMBACAAN ---")
for attempt in range(1, 4):
    print(f"\n[Percobaan #{attempt}]")
    ser.reset_input_buffer()
    ser.reset_output_buffer()

    # Transmit
    lgpio.gpio_write(gpio_chip, 18, 1)
    ser.write(REQUEST)
    ser.flush()

    # Receive
    lgpio.gpio_write(gpio_chip, 18, 0)

    # Baca
    response = ser.read(9)
    print(f"  Panjang respon: {len(response)} bytes")

    if len(response) == 9:
        raw_t = int.from_bytes(response[3:5], byteorder="big", signed=True)
        raw_h = int.from_bytes(response[5:7], byteorder="big", signed=False)
        temp = raw_t / 10.0
        hum = raw_h / 10.0
        print(f"  ✅ BERHASIL BACA SHT20!")
        print(f"     Suhu Real       : {temp:.1f} °C")
        print(f"     Kelembaban Real : {hum:.1f} % RH")
        print(f"     Hex Respon      : {response.hex().upper()}")
    elif len(response) > 0:
        print(f"  ⚠️ Respon parsial/tidak lengkap: {response.hex().upper()} ({len(response)}/9 bytes)")
    else:
        print("  ❌ Tidak ada respon dari sensor (0 bytes / Timeout).")
        print("     Periksa kabel A & B, atau pastikan kabel VCC & GND sensor mendapat daya!")

    time.sleep(1)

# Cleanup
lgpio.gpio_write(gpio_chip, 18, 0)
ser.close()
lgpio.gpiochip_close(gpio_chip)

print("\n==========================================================")
print("Selesai.")
