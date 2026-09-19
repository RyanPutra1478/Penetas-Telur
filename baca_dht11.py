#!/usr/bin/env python3
"""
TETASCO CONNECT — PROGRAM PEMBACA SENSOR DHT11 (GPIO 6 / PIN FISIK 31)
Jalankan program ini langsung di terminal:
python3 baca_dht11.py
"""

import sys
import time
from backend.sensors.dht11_driver import dht11_driver, DHT_PIN

print("==========================================================")
print("🌡️  TETASCO CONNECT — TESTER SENSOR DHT11")
print("==========================================================")
print(f"Pin DATA       : GPIO {DHT_PIN} (Pin Fisik 31)")
print("Pin VCC        : 3.3V atau 5V (Pin Fisik 1 atau 2/4)")
print("Pin GND        : Ground (Pin Fisik 6, 9, 30, atau 39)")
print("==========================================================")
print("Membaca data sensor secara real-time (tekan Ctrl+C untuk keluar)...\n")

pembacaan_sukses = 0
pembacaan_gagal = 0

try:
    while True:
        temp, hum, ok = dht11_driver.read()
        if ok:
            pembacaan_sukses += 1
            print(f"✅ [DHT11 REAL] Suhu: {temp:.1f} °C  |  Kelembaban: {hum:.1f} % RH  (Sukses: {pembacaan_sukses})")
        else:
            pembacaan_gagal += 1
            print(f"⏳ Menunggu respon DHT11 pada GPIO {DHT_PIN}... (Cek kabel DATA di Pin 31)")
        
        # DHT11 membutuhkan jeda minimal 1-2 detik antar pembacaan
        time.sleep(2.0)

except KeyboardInterrupt:
    print("\n\nDihentikan oleh pengguna.")
    print(f"Statistik: Berhasil={pembacaan_sukses}, Gagal={pembacaan_gagal}")
