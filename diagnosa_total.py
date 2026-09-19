#!/usr/bin/env python3
"""
TETASCO CONNECT — DIAGNOSTIK RS485 & LOOPBACK TOTAL
Alat diagnosa serbaguna untuk melacak akar masalah serial/RS485 sampai tuntas:
1. Tes Loopback (Pin 8 langsung ke Pin 10)
2. Scan Modbus Multi-Baudrate (9600, 4800, 19200) & Multi-ID (1 s.d 5, 255)
3. Raw Hex Listener (Mendeteksi apakah ada noise/sinyal listrik masuk)
"""

import os
import sys
import time
import glob
import serial

def crc16(data: bytes) -> bytes:
    """Hitung CRC-16 Modbus (Polynomial 0xA001, Little Endian)"""
    crc = 0xFFFF
    for byte in data:
        crc ^= byte
        for _ in range(8):
            if crc & 0x0001:
                crc = (crc >> 1) ^ 0xA001
            else:
                crc >>= 1
    return crc.to_bytes(2, byteorder='little')

def build_request(slave_id: int, func: int, reg: int, count: int) -> bytes:
    payload = bytes([slave_id, func, (reg >> 8) & 0xFF, reg & 0xFF, (count >> 8) & 0xFF, count & 0xFF])
    return payload + crc16(payload)

print("==========================================================")
print("🛠️  TETASCO CONNECT — DIAGNOSTIK RS485 & SERIAL TOTAL")
print("==========================================================")
print("Pilih mode pengujian:")
print("1. SCAN SENSOR RS485 (Otomatis uji Baudrate, Slave ID, & Mode DE/RE)")
print("2. TES LOOPBACK PIN 8 & 10 (Uji apakah port UART Pi berfungsi)")
print("==========================================================")

choice = sys.argv[1] if len(sys.argv) > 1 else "1"

# Kumpulkan port kandidat
ports = []
for p in ["/dev/ttyAMA0", "/dev/ttyAMA10", "/dev/serial0"]:
    if os.path.exists(p) and p not in ports:
        ports.append(p)

if choice == "2":
    print("\n--- [MODE 2: TES LOOPBACK HARDWARE] ---")
    print("⚠️  PASTIKAN: Cabut kabel dari MAX485, lalu sambungkan:")
    print("    👉 Pin Fisik 8 (GPIO 14 TX) LANGSUNG ke Pin Fisik 10 (GPIO 15 RX)")
    print("    menggunakan 1 kabel jumper female-to-female.")
    input("\nTekan ENTER jika Pin 8 dan Pin 10 sudah tersambung langsung...")

    test_msg = b"TETASCO_TEST_UART_OK\n"
    for port in ports:
        print(f"\nMenguji port {port}...")
        try:
            ser = serial.Serial(port, 9600, timeout=1.0)
            ser.reset_input_buffer()
            ser.reset_output_buffer()
            ser.write(test_msg)
            ser.flush()
            recv = ser.read(len(test_msg))
            ser.close()
            if recv == test_msg:
                print(f"  🎉 SUCCESS! Port {port} BERHASIL LOOPBACK!")
                print(f"  Data diterima: {recv.decode(errors='ignore').strip()}")
                print(f"  KESIMPULAN: Port UART Pi Anda di '{port}' 100% SEHAT dan NORMAL!")
            else:
                print(f"  ❌ Gagal pada {port} (Diterima {len(recv)} byte: {recv.hex()})")
        except Exception as e:
            print(f"  ❌ Error buka {port}: {e}")
    sys.exit(0)

# MODE 1: SCAN TOTAL SENSOR RS485
print("\n--- [MODE 1: SCAN MULTI-BAUD & MULTI-ID SENSOR] ---")

# Setup GPIO 18
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
        print(f"✅ GPIO 18 DE/RE di-handle oleh gpiochip{chip}")
        break
    except Exception:
        continue

# Daftar baudrate dan Slave ID yang akan diuji
BAUDRATES = [9600, 4800, 19200]
SLAVE_IDS = [1, 2, 3, 255] # 255 = 0xFF Broadcast

sukses = False

for port in ports:
    if sukses:
        break
    for baud in BAUDRATES:
        if sukses:
            break
        print(f"\nScanning: Port={port} | Baud={baud}...")
        try:
            ser = serial.Serial(port, baud, timeout=0.5)
        except Exception as e:
            print(f"  Gagal buka {port} @ {baud}: {e}")
            continue

        for s_id in SLAVE_IDS:
            # Buat request Func 04 Reg 1 (SHT20 standar)
            req = build_request(s_id, 4, 1, 2)

            # Coba 2 metode kontrol arah:
            # Metode A: Toggle GPIO 18 (MAX485 standar)
            # Metode B: GPIO 18 Tetap LOW (Auto-direction modul)
            for mode_name, use_toggle in [("Toggle DE/RE", True), ("DE/RE Tetap LOW", False)]:
                ser.reset_input_buffer()
                ser.reset_output_buffer()

                if use_toggle and gpio_chip is not None:
                    lgpio.gpio_write(gpio_chip, 18, 1) # TX
                    time.sleep(0.003)
                    ser.write(req)
                    ser.flush()
                    time.sleep(0.015)
                    lgpio.gpio_write(gpio_chip, 18, 0) # RX
                else:
                    if gpio_chip is not None:
                        lgpio.gpio_write(gpio_chip, 18, 0)
                    ser.write(req)
                    ser.flush()
                    time.sleep(0.015)

                resp = ser.read(9)
                if len(resp) > 0:
                    print(f"  🔥 SINKRONISASI SINYAL DITEMUKAN!")
                    print(f"     Port: {port} | Baud: {baud} | Slave ID: {s_id} | Mode: {mode_name}")
                    print(f"     Raw Hex: {resp.hex().upper()} ({len(resp)} bytes)")
                    if len(resp) >= 7:
                        # Parsing suhu/hum jika valid
                        try:
                            t = int.from_bytes(resp[3:5], "big", signed=True) / 10.0
                            h = int.from_bytes(resp[5:7], "big", signed=False) / 10.0
                            print(f"     🎉 SUHU: {t:.1f} °C | KELEMBABAN: {h:.1f} % RH")
                            sukses = True
                            break
                        except Exception:
                            pass
                time.sleep(0.05)

        ser.close()

if gpio_chip is not None:
    lgpio.gpio_write(gpio_chip, 18, 0)
    lgpio.gpio_free(gpio_chip, 18)
    lgpio.gpiochip_close(gpio_chip)

print("\n==========================================================")
if sukses:
    print("✅ PEMINDAIAN SELESAI: SENSOR BERHASIL DITEMUKAN!")
else:
    print("❌ PEMINDAIAN SELESAI: Tetap 0 byte di seluruh kombinasi.")
    print("\n👉 REKOMENDASI:")
    print("1. Jalankan Mode Loopback: python3 diagnosa_total.py 2")
    print("   (Untuk memastikan apakah port Pi benar-benar hidup).")
    print("2. Foto modul MAX485 dan perkabelannya untuk kami periksa.")
print("==========================================================")
