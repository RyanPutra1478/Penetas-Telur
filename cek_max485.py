#!/usr/bin/env python3
"""
TETASCO CONNECT — DIAGNOSTIK MODUL TRANSCEIVER MAX485 & SENSOR SHT20
Pengujian bertahap untuk memastikan:
1. Daya & fungsionalitas modul MAX485 (Local Echo Test)
2. Komunikasi ke probe sensor SHT20 (Baudrate & Slave ID Scan)
3. Mode Automatic Telemetry Listen
"""

import os
import sys
import time
import subprocess
import serial

PORT = "/dev/ttyAMA0"
BAUDRATES = [9600, 19200, 4800]

print("=" * 68)
print("🔬 DIAGNOSTIK LANGSUNG MODUL MAX485 & SENSOR SHT20")
print(f"Port Hardware : {PORT} (Pin 8 TX & Pin 10 RX)")
print("=" * 68)

def set_pin18(val: int):
    """Mengatur level logika Pin 12 (GPIO 18) via pinctrl & lgpio"""
    drive = "dh" if val == 1 else "dl"
    try:
        subprocess.run(["pinctrl", "set", "18", "op", drive], stderr=subprocess.DEVNULL)
    except Exception:
        pass
    try:
        import lgpio
        for chip in [4, 0]:
            try:
                h = lgpio.gpiochip_open(chip)
                lgpio.gpio_claim_output(h, 18, val)
                lgpio.gpio_write(h, 18, val)
                lgpio.gpiochip_close(h)
                break
            except Exception:
                pass
    except Exception:
        pass

# =========================================================
# UJI 1: LOCAL ECHO TEST PADA MODUL MAX485
# =========================================================
print("\n[UJI 1] MENGUJI CHIP TRANSCEIVER MAX485 (ECHO TEST):")
print("Catatan: Pada uji ini, DE diset HIGH dan RE diset LOW secara bersamaan.")
print("Sinyal dari TX (Pin 8) harus tembus ke bus dan terpantul kembali ke RX (Pin 10).")

# Pada modul standar jika DE=HIGH dan RE=LOW, driver & receiver sama-sama aktif
# Di RPi Pin 12 terhubung ke DE & RE.
# Jika Pin 12 HIGH -> Driver Aktif (TX)
# Jika Pin 12 LOW  -> Receiver Aktif (RX)
try:
    ser = serial.Serial(PORT, 9600, timeout=0.3)
    ser.reset_input_buffer()
    ser.reset_output_buffer()

    # Kirim dalam mode TX
    set_pin18(1) # DE=HIGH (Kirim)
    time.sleep(0.005)
    test_msg = b"ECHO_MAX485\n"
    ser.write(test_msg)
    ser.flush()
    time.sleep(0.015)
    set_pin18(0) # RE=LOW (Terima)

    time.sleep(0.05)
    echo_resp = ser.read(ser.in_waiting or 15)
    print(f"  -> Hasil Transmisi Pin: Diterima {len(echo_resp)} bytes ({echo_resp})")
    ser.close()
except Exception as e:
    print(f"  ❌ Error serial: {e}")

# =========================================================
# UJI 2: MENDENGARKAN SIARAN OTOMATIS SENSOR (SNIFFER MODE)
# =========================================================
print("\n[UJI 2] MENDENGARKAN APAKAH SENSOR MENGIRIM DATA OTOMATIS (3 Detik):")
print("Beberapa probe SHT20 / XY-MD02 otomatis memancarkan data setiap 1-2 detik.")
set_pin18(0) # Pastikan mode DENGAR (LOW)
try:
    ser = serial.Serial(PORT, 9600, timeout=0.5)
    ser.reset_input_buffer()
    t_start = time.time()
    total_received = b""
    while time.time() - t_start < 3.0:
        if ser.in_waiting > 0:
            chunk = ser.read(ser.in_waiting)
            total_received += chunk
            print(f"  ⚡ Terdeteksi data masuk: {chunk.hex().upper()}")
        time.sleep(0.05)
    ser.close()

    if total_received:
        print(f"  ✅ Sensor aktif memancarkan data otomatis: {total_received.hex().upper()}")
    else:
        print("  ⚪ Tidak ada data otomatis (Sensor beroperasi dalam mode polling permintaan).")
except Exception as e:
    print(f"  ❌ Error sniffer: {e}")

# =========================================================
# UJI 3: SCAN MULTI-ID & MULTI-BAUDRATE
# =========================================================
print("\n[UJI 3] SCANNING PROTOKOL SHT20 (Mencoba ID 1, 2, 3 & Broadcast):")

SCAN_LIST = [
    # Slave ID 1 (Paling standar)
    ("ID 1 | Func 04 Reg 1", 9600, bytes.fromhex("01 04 00 01 00 02 20 0B")),
    ("ID 1 | Func 03 Reg 0", 9600, bytes.fromhex("01 03 00 00 00 02 C4 0B")),
    ("ID 1 | Func 04 Reg 0", 9600, bytes.fromhex("01 04 00 00 00 02 71 CB")),
    # Slave ID 2
    ("ID 2 | Func 04 Reg 1", 9600, bytes.fromhex("02 04 00 01 00 02 20 38")),
    ("ID 2 | Func 03 Reg 0", 9600, bytes.fromhex("02 03 00 00 00 02 C4 38")),
    # Broadcast / Scan
    ("Broadcast 00 | Func 04", 9600, bytes.fromhex("00 04 00 01 00 02 20 1A")),
    # 19200 baudrate test
    ("ID 1 @ 19200 baud",   19200, bytes.fromhex("01 04 00 01 00 02 20 0B")),
]

found_success = False

for desc, baud, req in SCAN_LIST:
    try:
        ser = serial.Serial(PORT, baud, timeout=0.4)
        ser.reset_input_buffer()
        ser.reset_output_buffer()

        # TX
        set_pin18(1)
        time.sleep(0.005)
        ser.write(req)
        ser.flush()
        time.sleep(0.012)
        # RX
        set_pin18(0)

        time.sleep(0.05)
        resp = ser.read(9)
        hex_data = resp.hex().upper() if resp else "(0 byte)"
        print(f"  * [{desc}]: Diterima {len(resp)} byte -> {hex_data}")

        if len(resp) >= 7 and resp[0] in (1, 2) and resp[1] in (3, 4):
            raw_t = int.from_bytes(resp[3:5], "big", signed=True)
            raw_h = int.from_bytes(resp[5:7], "big", signed=False)
            t = raw_t / 10.0
            h = raw_h / 10.0
            print(f"\n  🎉🎉 SENSOR MERESPONS DENGAN SUKSES!")
            print(f"     SUHU TERBACA       : {t:.1f} °C")
            print(f"     KELEMBABAN TERBACA : {h:.1f} % RH")
            found_success = True
            ser.close()
            break

        ser.close()
        time.sleep(0.1)
    except Exception as e:
        print(f"  * [{desc}] Gagal: {e}")

set_pin18(0)

print("\n" + "=" * 68)
print("HASIL DIAGNOSTIK FISIK:")
print("=" * 68)
if found_success:
    print("✅ Komunikasi ke sensor SHT20 berhasil 100%!")
else:
    print("❌ Sinyal Modbus belum dibalas oleh sensor.")
    print("👉 Hal yang wajib dicek di fisik hardware:")
    print("1. KABEL A & B TERTUKAR:")
    print("   Lepas terminal sekrup A dan B pada modul MAX485, lalu tukar posisinya.")
    print("2. TEGANGAN SENSOR SHT20:")
    print("   Apakah sensor SHT20 sudah diberi daya VCC & GND dari 5V / 12V?")
    print("   (Sensor probe SHT20 butuh catu daya sendiri, tidak bisa hidup tanpa tegangan).")
    print("3. VCC MODUL MAX485:")
    print("   Pastikan VCC modul MAX485 terhubung ke PIN 2 atau 4 (5V), BUKAN ke 3.3V!")
print("=" * 68)
