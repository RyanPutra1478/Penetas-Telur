#!/usr/bin/env python3
"""
TETASCO CONNECT — DIAGNOSTIK MULTI-PORT SERIAL & HARDWARE RS485
Mencoba semua port serial (/dev/ttyAMA0, /dev/serial0, /dev/ttyS0, /dev/ttyUSB0)
secara langsung untuk menemukan port yang merespons sensor SHT20 XY-MD02.
"""

import os
import sys
import time
import glob
import subprocess

print("==========================================================")
print("🔍 DIAGNOSTIK MENDALAM HARDWARE SENSOR SHT20 RS485")
print("==========================================================")

# 1. Cek Device Node di Sistem Linux
print("[1/4] Daftar node port serial di sistem (/dev):")
try:
    cmd_out = subprocess.check_output("ls -la /dev/serial* /dev/ttyAMA* /dev/ttyS* 2>/dev/null || true", shell=True, text=True)
    print(cmd_out if cmd_out.strip() else "  (Tidak ada node /dev/serial* atau /dev/ttyAMA* ditemukan)")
except Exception as e:
    print(f"  Error ls: {e}")

# 2. Inisialisasi lgpio untuk Pin DE/RE (GPIO 18 / Pin 12)
print("\n[2/4] Menginisialisasi Pin DE/RE (GPIO 18 / Pin 12):")
import lgpio

gpio_chip = None
for chip_id in [0, 4]:
    try:
        h = lgpio.gpiochip_open(chip_id)
        try:
            lgpio.gpio_free(h, 18)
        except Exception:
            pass
        lgpio.gpio_claim_output(h, 18, 0)
        gpio_chip = h
        print(f"  ✅ lgpio chip {chip_id} berhasil dibuka untuk GPIO 18.")
        break
    except Exception as e:
        print(f"  - Chip {chip_id} gagal: {e}")

if gpio_chip is None:
    print("  ❌ FATAL: Tidak dapat mengontrol GPIO 18. Matikan proses yang bentrok: sudo pkill -9 -f python3")
    sys.exit(1)

import serial

# 3. Kumpulkan semua kandidat port serial (Prioritas RPi 5: /dev/ttyAMA10)
CANDIDATE_PORTS = []
if os.path.exists("/dev/ttyAMA10"):
    CANDIDATE_PORTS.append("/dev/ttyAMA10")
for default_p in ["/dev/serial0", "/dev/ttyAMA0", "/dev/ttyUSB0", "/dev/ttyS0"]:
    if os.path.exists(default_p) and default_p not in CANDIDATE_PORTS:
        CANDIDATE_PORTS.append(default_p)

# Tambahkan port lain yang mungkin ada
for p in glob.glob("/dev/ttyAMA*") + glob.glob("/dev/ttyS*") + glob.glob("/dev/serial*") + glob.glob("/dev/ttyUSB*"):
    if p not in CANDIDATE_PORTS:
        CANDIDATE_PORTS.append(p)

MODBUS_COMMANDS = [
    ("Func 04 Reg 1 (Suhu/Hum Reg 1)", bytes.fromhex("01 04 00 01 00 02 20 0B")),
    ("Func 04 Reg 0 (Suhu/Hum Reg 0)", bytes.fromhex("01 04 00 00 00 02 71 CB")),
    ("Func 03 Reg 1 (Holding Reg 1)",   bytes.fromhex("01 03 00 01 00 02 95 CB")),
    ("Func 03 Reg 0 (Holding Reg 0)",   bytes.fromhex("01 03 00 00 00 02 C4 0B")),
]

print(f"\n[3/4] Kandidat Port: {CANDIDATE_PORTS}")
print("Menguji pengiriman data Modbus dengan timing half-duplex MAX485...")

sukses_port = None

for port in CANDIDATE_PORTS:
    print(f"\n--- Menguji Port: {port} ---")
    ser = None
    try:
        ser = serial.Serial(
            port=port,
            baudrate=9600,
            bytesize=serial.EIGHTBITS,
            parity=serial.PARITY_NONE,
            stopbits=serial.STOPBITS_ONE,
            timeout=0.8
        )
        ser.reset_input_buffer()
        ser.reset_output_buffer()
        print(f"  ✅ Port {port} berhasil dibuka @ 9600 baud.")
    except Exception as e:
        print(f"  ❌ Gagal buka {port}: {e}")
        continue

    for cmd_desc, req in MODBUS_COMMANDS:
        ser.reset_input_buffer()
        ser.reset_output_buffer()

        # 1. TX Mode (HIGH)
        lgpio.gpio_write(gpio_chip, 18, 1)
        time.sleep(0.003) # Setup MAX485 driver

        ser.write(req)
        ser.flush()

        # 2. TAHAN TRANSMIT: 8 bytes @ 9600 baud = 8.3ms.
        # Sangat krusial agar CRC 2 bytes tidak terpotong sebelum DE=LOW!
        time.sleep(0.012)

        # 3. RX Mode (LOW)
        lgpio.gpio_write(gpio_chip, 18, 0)

        # 4. Baca respons
        resp = ser.read(9)
        hex_resp = resp.hex().upper() if resp else '(KOSONG)'
        print(f"  [{cmd_desc}] Diterima: {len(resp)} byte -> {hex_resp}")

        if len(resp) == 9 and resp[0] == 1 and (resp[1] in (3, 4)):
            t = int.from_bytes(resp[3:5], "big", signed=True) / 10.0
            h = int.from_bytes(resp[5:7], "big", signed=False) / 10.0
            print(f"\n  🎉🎉 BERHASIL DI PORT {port} dengan {cmd_desc}!")
            print(f"     SUHU REAL       : {t:.1f} °C")
            print(f"     KELEMBABAN REAL : {h:.1f} % RH")
            sukses_port = port
            break
        time.sleep(0.2)

    ser.close()
    if sukses_port:
        break

# Cleanup
lgpio.gpio_write(gpio_chip, 18, 0)
lgpio.gpio_free(gpio_chip, 18)
lgpio.gpiochip_close(gpio_chip)

print("\n==========================================================")
if sukses_port:
    print(f"✅ KESIMPULAN: Port yang benar adalah '{sukses_port}'!")
else:
    print("❌ KESIMPULAN: Semua port mengembalikan 0 bytes (sensor tidak merespons).")
    print("   Pemeriksaan Fisik yang Wajib Dilakukan:")
    print("   1. Tukar kabel A dan B pada modul MAX485 (Terminal A ke B, Terminal B ke A).")
    print("   2. Cek apakah LED pada modul MAX485 / sensor SHT20 menyala.")
    print("   3. Pastikan pin DI ke Pin 8 (GPIO 14) dan pin RO ke Pin 10 (GPIO 15).")
    print("   4. Pastikan VCC sensor SHT20 terhubung ke 5V (bukan 3.3V).")
print("==========================================================")
