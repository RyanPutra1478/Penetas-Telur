#!/usr/bin/env python3
"""
TETASCO CONNECT — PROGRAM PEMBACA SENSOR DHT11 (GPIO 6 / PIN FISIK 31)
Jalankan program ini langsung di terminal:
python3 baca_dht11.py
"""

import os
import sys
import time
import glob
import subprocess

print("==========================================================")
print("🌡️  TETASCO CONNECT — DIAGNOSTIK & PEMBACA DHT11 (GPIO 23)")
print("==========================================================")
print("Pin DATA       : GPIO 23 (Pin Fisik 16)")
print("Pin VCC        : 3.3V atau 5V (Pin Fisik 1 atau 2/4)")
print("Pin GND        : Ground (Pin Fisik 6, 9, 14, 20, 25, 30, atau 39)")
print("==========================================================")

# 1. Cek & Aktifkan Kernel Driver (Cara paling akurat di Raspberry Pi)
print("[1] Memeriksa driver kernel Linux (dtoverlay dht11)...")
has_iio = False
for dev in glob.glob("/sys/bus/iio/devices/iio:device*"):
    name_file = os.path.join(dev, "name")
    if os.path.exists(name_file):
        try:
            with open(name_file, "r") as f:
                if "dht11" in f.read().lower():
                    has_iio = True
                    print(f"  ✅ Kernel driver IIO dht11 aktif di {dev}")
                    break
        except Exception:
            pass

if not has_iio:
    print("  -> Mencoba memuat driver kernel: sudo dtoverlay dht11 gpiopin=23")
    try:
        res = subprocess.run(["sudo", "dtoverlay", "dht11", "gpiopin=23"], capture_output=True, text=True)
        time.sleep(0.8)
        for dev in glob.glob("/sys/bus/iio/devices/iio:device*"):
            name_file = os.path.join(dev, "name")
            if os.path.exists(name_file):
                with open(name_file, "r") as f:
                    if "dht11" in f.read().lower():
                        has_iio = True
                        print(f"  ✅ Berhasil memuat kernel driver IIO di {dev}")
                        break
    except Exception as e:
        print(f"  Gagal memuat overlay: {e}")

# 2. Cek Tegangan Pin GPIO 23 saat Idle
print("\n[2] Memeriksa tegangan listrik pin GPIO 23 saat diam (Idle):")
try:
    pctrl = subprocess.check_output("pinctrl get 23 2>/dev/null || raspi-gpio get 23 2>/dev/null", shell=True, text=True).strip()
    print(f"  Status Pin 23: {pctrl}")
    if "lo" in pctrl.lower() and "hi" not in pctrl.lower():
        print("  ⚠️ PERINGATAN: Pin 23 bertegangan LOW (0V) saat diam!")
        print("     Kabel DATA harus bertegangan HIGH (3.3V/5V) saat tidak mengirim data.")
        print("     Kemungkinan:")
        print("     a. Pin VCC dan DATA tertukar pada modul DHT11.")
        print("     b. Modul DHT11 belum mendapatkan kabel VCC/Ground.")
        print("     c. Modul butuh resistor pull-up 4.7k-10k ohm antara VCC dan DATA.")
    else:
        print("  ✅ Pin 23 bertegangan HIGH (Pull-up normal).")
except Exception:
    print("  (Tidak dapat mengecek pinctrl)")

# 3. Mulai loop pembacaan
print("\n[3] Membaca data suhu & kelembaban (tekan Ctrl+C untuk keluar)...\n")

from backend.sensors.dht11_driver import dht11_driver

sukses = 0
gagal = 0

try:
    while True:
        t, h, ok = dht11_driver.read()
        if ok:
            sukses += 1
            print(f"✅ [DHT11 SUKSES] Suhu: {t:.1f} °C  |  Kelembaban: {h:.1f} % RH  (Total: {sukses})")
        else:
            gagal += 1
            print(f"⏳ [{gagal}] Menunggu respon DHT11... (Pastikan pin DATA di Pin 31 dan VCC tersambung)")

        time.sleep(2.0)

except KeyboardInterrupt:
    print(f"\nSelesai. Sukses={sukses}, Gagal={gagal}")
