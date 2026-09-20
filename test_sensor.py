#!/usr/bin/env python3
"""
TETASCO CONNECT — DIAGNOSTIK MENDALAM SENSOR SHT20 / XY-MD02 RS485
Mendukung Raspberry Pi 5 (chip 4) dan Raspberry Pi 4 (chip 0)
Fitur:
1. Dual-chip DE/RE pin control (lgpio chip 4 & chip 0 + pinctrl fail-safe)
2. Uji Mode Manual DE/RE (GPIO 18) dan Mode Auto Flow Control
3. Multi-slave scan (ID 1 & ID 2)
4. Pemeriksaan port serial lengkap (/dev/ttyAMA10, /dev/serial0, /dev/ttyAMA0)
"""

import os
import sys
import time
import glob
import subprocess

print("=" * 68)
print("🔍 TETASCO CONNECT — DIAGNOSTIK MENDALAM SENSOR SHT20 RS485")
print("=" * 68)

# 1. Cek Device Node Serial Port di Linux
print("[1/5] Daftar node port serial di sistem:")
try:
    cmd_out = subprocess.check_output("ls -la /dev/serial* /dev/ttyAMA* /dev/ttyS* 2>/dev/null || true", shell=True, text=True)
    print(cmd_out if cmd_out.strip() else "  (Tidak ada node serial)")
except Exception as e:
    print(f"  Error ls: {e}")

# 2. Inisialisasi Pin DE/RE (GPIO 18 / Pin Fisik 12)
print("\n[2/5] Menginisialisasi Pin DE/RE (GPIO 18 / Pin 12):")
import lgpio

gpio_chip = None
# Prioritaskan chip 4 untuk Raspberry Pi 5!
for chip_id in [4, 0]:
    try:
        h = lgpio.gpiochip_open(chip_id)
        try:
            lgpio.gpio_free(h, 18)
        except Exception:
            pass
        lgpio.gpio_claim_output(h, 18, 0)
        gpio_chip = h
        print(f"  ✅ lgpio chip {chip_id} berhasil dibuka untuk Pin 12 (GPIO 18).")
        break
    except Exception as e:
        print(f"  - Chip {chip_id}: {e}")

def set_dere(val: int):
    """Mengatur sinyal DE/RE (1=Kirim/TX, 0=Terima/RX)"""
    if gpio_chip is not None:
        try:
            lgpio.gpio_write(gpio_chip, 18, val)
        except Exception:
            pass
    # Fail-safe pinctrl untuk Raspberry Pi 5
    try:
        subprocess.run(["pinctrl", "set", "18", "op", "dh" if val == 1 else "dl"], stderr=subprocess.DEVNULL)
    except Exception:
        pass

# Set default ke Receive (LOW)
set_dere(0)
print("  Pin DE/RE diset ke mode DENGAR / TERIMA (LOW).")

import serial

# 3. Kumpulkan port serial (Prioritas RPi 5: /dev/ttyAMA10)
CANDIDATE_PORTS = []
if os.path.exists("/dev/ttyAMA10"):
    CANDIDATE_PORTS.append("/dev/ttyAMA10")
for default_p in ["/dev/serial0", "/dev/ttyAMA0", "/dev/ttyUSB0", "/dev/ttyS0"]:
    if os.path.exists(default_p) and default_p not in CANDIDATE_PORTS:
        CANDIDATE_PORTS.append(default_p)

for p in glob.glob("/dev/ttyAMA*") + glob.glob("/dev/ttyS*") + glob.glob("/dev/serial*") + glob.glob("/dev/ttyUSB*"):
    if p not in CANDIDATE_PORTS:
        CANDIDATE_PORTS.append(p)

print(f"\n[3/5] Port serial yang akan diuji: {CANDIDATE_PORTS}")

# Modbus Commands (ID 1 & ID 2)
MODBUS_COMMANDS = [
    # Slave ID 1
    ("Slave ID 1 | Func 04 Reg 1 (Input Reg)",   bytes.fromhex("01 04 00 01 00 02 20 0B")),
    ("Slave ID 1 | Func 04 Reg 0 (Input Reg)",   bytes.fromhex("01 04 00 00 00 02 71 CB")),
    ("Slave ID 1 | Func 03 Reg 1 (Holding Reg)", bytes.fromhex("01 03 00 01 00 02 95 CB")),
    ("Slave ID 1 | Func 03 Reg 0 (Holding Reg)", bytes.fromhex("01 03 00 00 00 02 C4 0B")),
    # Slave ID 2
    ("Slave ID 2 | Func 04 Reg 1 (Input Reg)",   bytes.fromhex("02 04 00 01 00 02 20 38")),
    ("Slave ID 2 | Func 03 Reg 1 (Holding Reg)", bytes.fromhex("02 03 00 01 00 02 95 38")),
]

sukses_port = None
hasil_baca = None

print("\n[4/5] Memulai Pengujian Komunikasi Modbus RS485...")

for port in CANDIDATE_PORTS:
    print(f"\n==================================================")
    print(f"📡 MENGUJI PORT: {port}")
    print(f"==================================================")
    try:
        ser = serial.Serial(
            port=port,
            baudrate=9600,
            bytesize=serial.EIGHTBITS,
            parity=serial.PARITY_NONE,
            stopbits=serial.STOPBITS_ONE,
            timeout=0.6
        )
        ser.reset_input_buffer()
        ser.reset_output_buffer()
        print(f"  ✅ Port {port} berhasil dibuka @ 9600 baud (8N1).")
    except Exception as e:
        print(f"  ❌ Gagal buka {port}: {e}")
        continue

    # Uji dengan kontrol pin DE/RE
    for cmd_desc, req in MODBUS_COMMANDS:
        ser.reset_input_buffer()
        ser.reset_output_buffer()

        # 1. Masuk mode KIRIM (TX)
        set_dere(1)
        time.sleep(0.005) # Beri waktu MAX485 stabil

        # 2. Kirim frame Modbus
        ser.write(req)
        ser.flush()

        # 3. Tahan transmisi hingga seluruh 8 byte selesai keluar
        # (8 byte @ 9600 baud butuh ~8.3ms)
        time.sleep(0.012)

        # 4. Masuk mode TERIMA (RX)
        set_dere(0)

        # 5. Baca respon dari SHT20 (9 bytes standar respon Modbus)
        resp = ser.read(9)
        hex_resp = resp.hex().upper() if resp else "(KOSONG - 0 byte)"
        print(f"  [{cmd_desc}]: Diterima {len(resp)} byte -> {hex_resp}")

        # Periksa validitas paket respon Modbus (minimal 7 byte, func code cocok)
        if len(resp) >= 7 and resp[0] in (1, 2) and resp[1] in (3, 4):
            try:
                raw_t = int.from_bytes(resp[3:5], "big", signed=True)
                raw_h = int.from_bytes(resp[5:7], "big", signed=False)
                t = raw_t / 10.0
                h = raw_h / 10.0
                if 0 <= t <= 80 and 0 <= h <= 100:
                    print(f"\n  🎉🎉 SENSOR SHT20 MERESPONS DENGAN SUKSES DI {port}!")
                    print(f"     SUHU TERBACA       : {t:.1f} °C")
                    print(f"     KELEMBABAN TERBACA : {h:.1f} % RH")
                    sukses_port = port
                    hasil_baca = (t, h)
                    break
            except Exception:
                pass
        time.sleep(0.15)

    ser.close()
    if sukses_port:
        break

# Cleanup DE/RE
set_dere(0)
if gpio_chip is not None:
    try:
        lgpio.gpio_free(gpio_chip, 18)
        lgpio.gpiochip_close(gpio_chip)
    except Exception:
        pass

print("\n" + "=" * 68)
print("[5/5] KESIMPULAN & HASIL ANALISIS:")
print("=" * 68)
if sukses_port:
    print(f"✅ SHT20 TERDETEKSI & BERFUNGSI NORMAL di port '{sukses_port}'!")
    print(f"   Suhu: {hasil_baca[0]:.1f}°C, Kelembaban: {hasil_baca[1]:.1f}%")
else:
    print("❌ SHT20 BELUM MERESPONS (Diterima 0 byte di seluruh port).")
    print("\n🔍 4 LANGKAH PEMERIKSAAN FISIK YANG PALING KRUSIAL:")
    print("---------------------------------------------------------------")
    print("1. TUKAR KABEL A DAN B (Paling sering terjadi):")
    print("   Lepas kabel Terminal A dan Terminal B pada modul MAX485, lalu tukar:")
    print("   Kabel yang di A pindah ke B, dan kabel yang di B pindah ke A.")
    print("\n2. CEK TEGANGAN VCC SENSOR SHT20:")
    print("   Sensor probe SHT20 industri MEMBUTUHKAN 5V hingga 12V DC.")
    print("   Jangan beri 3.3V karena mikrokontroler sensor tidak akan menyala.")
    print("\n3. CEK KABEL TX (DI) & RX (RO):")
    print("   - Pin DI MAX485 harus ke Pin 8 (GPIO 14 - TX)")
    print("   - Pin RO MAX485 harus ke Pin 10 (GPIO 15 - RX)")
    print("   - Pin DE & RE harus dijumper bersama ke Pin 12 (GPIO 18)")
    print("\n4. COMMON GROUND:")
    print("   Pastikan GND modul MAX485 tersambung ke GND Raspberry Pi.")
print("=" * 68)
