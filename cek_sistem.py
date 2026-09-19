#!/usr/bin/env python3
"""
TETASCO CONNECT — DIAGNOSTIK MENYELURUH HARDWARE & SISTEM RASPBERRY PI
Script ini mendeteksi:
1. Model Raspberry Pi & OS
2. Status Hardware Pin GPIO 14 & 15 (apakah aktif sebagai UART atau hanya input biasa)
3. Status config.txt (/boot/firmware/config.txt)
4. Status serial console di cmdline.txt
5. Port serial aktif
6. Pengujian Modbus SHT20 dengan berbagai konfigurasi pin DE/RE
"""

import os
import sys
import time
import subprocess
import glob

print("==========================================================")
print("🔍 TETASCO CONNECT — DIAGNOSTIK LENGKAP SISTEM & HARDWARE")
print("==========================================================")

# 1. Deteksi Model Raspberry Pi
model = "Unknown"
for p in ["/proc/device-tree/model", "/sys/firmware/devicetree/base/model"]:
    if os.path.exists(p):
        try:
            with open(p, "r") as f:
                model = f.read().strip('\x00').strip()
            break
        except Exception:
            pass
print(f"\n[1] Hardware Model: {model}")

# 2. Cek Status Multiplexing Pin GPIO 14 & 15 (Pin Fisik 8 & 10)
print("\n[2] Status Fungsi Pin Fisik 8 & 10 (GPIO 14 & 15):")
pinctrl_out = ""
for cmd in ["pinctrl get 14,15 2>/dev/null", "raspi-gpio get 14,15 2>/dev/null"]:
    try:
        res = subprocess.check_output(cmd, shell=True, text=True).strip()
        if res:
            pinctrl_out = res
            print(f"  {cmd.split()[0]} output:\n  " + res.replace("\n", "\n  "))
            break
    except Exception:
        pass

if not pinctrl_out:
    print("  (Tidak dapat mengecek pinctrl / raspi-gpio)")
else:
    if "a4" in pinctrl_out.lower() or "alt0" in pinctrl_out.lower() or "txd" in pinctrl_out.lower():
        print("  ✅ Pin 14 & 15 sudah terkonfigurasi sebagai UART Hardware!")
    else:
        print("  ⚠️ PERINGATAN: Pin 14 & 15 BELUM terkonfigurasi sebagai UART!")
        print("     Pin masih dalam mode GPIO biasa. Perlu diaktifkan di /boot/firmware/config.txt.")

# 3. Cek Serial Console di /proc/cmdline
print("\n[3] Status Serial Console (Kernel cmdline):")
try:
    with open("/proc/cmdline", "r") as f:
        cmdline = f.read()
    print(f"  cmdline: {cmdline.strip()[:100]}...")
    if "console=serial0" in cmdline or "console=ttyAMA" in cmdline:
        print("  ⚠️ PERINGATAN: Serial Console aktif di cmdline.txt!")
        print("     Linux sedang menggunakan port ini untuk login prompt.")
        print("     Jalankan: sudo raspi-config -> Interface Options -> Serial Port -> Login Shell: NO")
    else:
        print("  ✅ Serial console tidak membajak port UART.")
except Exception as e:
    print(f"  Error: {e}")

# 4. Cek config.txt
print("\n[4] Pengaturan UART di config.txt:")
config_path = "/boot/firmware/config.txt" if os.path.exists("/boot/firmware/config.txt") else "/boot/config.txt"
if os.path.exists(config_path):
    print(f"  File: {config_path}")
    try:
        with open(config_path, "r") as f:
            cfg_lines = f.readlines()
        uart_configs = [line.strip() for line in cfg_lines if any(k in line.lower() for k in ["uart", "serial", "dtoverlay=uart", "dtparam=uart"]) and not line.strip().startswith("#")]
        if uart_configs:
            for l in uart_configs:
                print(f"    - {l}")
        else:
            print("  ⚠️ PERINGATAN: Tidak ada konfigurasi 'enable_uart=1' atau 'dtparam=uart0=on' aktif!")
    except Exception as e:
        print(f"  Error baca config: {e}")
else:
    print(f"  {config_path} tidak ditemukan.")

# 5. Daftar Port Serial
print("\n[5] Node Port Serial di /dev:")
for p in sorted(glob.glob("/dev/serial*") + glob.glob("/dev/ttyAMA*") + glob.glob("/dev/ttyS*") + glob.glob("/dev/ttyUSB*")):
    real = os.path.realpath(p)
    print(f"  - {p:16} -> {real}")

# 6. Pengujian Sinyal RS485 & DE/RE
print("\n[6] Menjalankan Pengujian Pengiriman Modbus:")

# Setup GPIO 18 untuk DE/RE
import lgpio
gpio_chip = None
for chip in [4, 0]:
    try:
        h = lgpio.gpiochip_open(chip)
        try:
            lgpio.gpio_free(h, 18)
        except Exception:
            pass
        lgpio.gpio_claim_output(h, 18, 0)
        gpio_chip = h
        print(f"  ✅ GPIO 18 DE/RE di-handle oleh gpiochip{chip}")
        break
    except Exception:
        continue

if gpio_chip is None:
    print("  ❌ Tidak dapat membuka GPIO 18")
    sys.exit(1)

import serial

test_ports = []
for p in ["/dev/ttyAMA10", "/dev/serial0", "/dev/ttyAMA0"]:
    if os.path.exists(p) and p not in test_ports:
        test_ports.append(p)

REQ_04 = bytes.fromhex("01 04 00 01 00 02 20 0B")

for port in test_ports:
    print(f"\n--- Menguji Port: {port} ---")
    try:
        ser = serial.Serial(port, 9600, timeout=0.8)
    except Exception as e:
        print(f"  Gagal buka {port}: {e}")
        continue

    # Tes 1: Normal half-duplex (GPIO 18 HIGH saat TX, LOW saat RX)
    ser.reset_input_buffer()
    ser.reset_output_buffer()
    lgpio.gpio_write(gpio_chip, 18, 1)
    time.sleep(0.003)
    ser.write(REQ_04)
    ser.flush()
    time.sleep(0.012)
    lgpio.gpio_write(gpio_chip, 18, 0)
    resp = ser.read(9)
    print(f"  [DE/RE Normal] Respons: {len(resp)} byte -> {resp.hex().upper() if resp else '(KOSONG)'}")

    # Tes 2: DE/RE Tetap LOW (Siapa tahu modul tipe auto-flow/HW-0519)
    ser.reset_input_buffer()
    ser.reset_output_buffer()
    lgpio.gpio_write(gpio_chip, 18, 0)
    ser.write(REQ_04)
    ser.flush()
    time.sleep(0.015)
    resp2 = ser.read(9)
    print(f"  [DE/RE Tetap LOW] Respons: {len(resp2)} byte -> {resp2.hex().upper() if resp2 else '(KOSONG)'}")

    ser.close()

lgpio.gpio_write(gpio_chip, 18, 0)
lgpio.gpio_free(gpio_chip, 18)
lgpio.gpiochip_close(gpio_chip)

print("\n==========================================================")
print("Selesai. Silakan kirimkan hasil output di atas.")
print("==========================================================")
