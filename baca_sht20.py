#!/usr/bin/env python3
"""
TETASCO CONNECT — PEMANTAUAN REAL-TIME SENSOR SHT20 RS485
Membaca suhu & kelembaban dari probe SHT20 / XY-MD02 secara terus menerus setiap detik.
Port: /dev/ttyAMA0 @ 9600 baud | DE/RE: GPIO 18 (Pin Fisik 12)
"""

import os
import sys
import time
import subprocess
from datetime import datetime
import serial

PORT = "/dev/ttyAMA0"
BAUDRATE = 9600
REQ_CMD = bytes.fromhex("01 04 00 01 00 02 20 0B") # ID 1 | Func 04 Reg 0001 (Suhu & Hum)

# Persistent lgpio handle untuk switching instan
_lgpio_handle = None
_lgpio_mod = None
try:
    import lgpio
    _lgpio_mod = lgpio
    for chip in [4, 0]:
        try:
            h = lgpio.gpiochip_open(chip)
            try: lgpio.gpio_free(h, 18)
            except Exception: pass
            lgpio.gpio_claim_output(h, 18, 0)
            _lgpio_handle = h
            break
        except Exception: pass
except Exception: pass

def set_dere(val: int):
    """Mengontrol arah transceiver MAX485 (1=Kirim/TX, 0=Terima/RX) secara instan"""
    if _lgpio_handle is not None and _lgpio_mod is not None:
        try:
            _lgpio_mod.gpio_write(_lgpio_handle, 18, val)
            return
        except Exception: pass
    drive = "dh" if val == 1 else "dl"
    try: subprocess.run(["pinctrl", "set", "18", "op", drive], stderr=subprocess.DEVNULL)
    except Exception: pass

def main():
    print("=" * 68)
    print("🌡️  TETASCO CONNECT — PEMANTAUAN REAL-TIME SENSOR SHT20")
    print("=" * 68)
    print(f"Port Serial   : {PORT} (Pin 8 TX & Pin 10 RX)")
    print(f"Baudrate      : {BAUDRATE} bps (8N1)")
    print("Pin DE/RE     : GPIO 18 (Pin Fisik 12)")
    print("Interval Baca : Setiap 1.0 Detik")
    print("Tekan Ctrl+C kapan saja untuk berhenti.")
    print("=" * 68)

    # Inisialisasi default DE/RE ke Receive (LOW)
    set_dere(0)

    try:
        ser = serial.Serial(
            port=PORT,
            baudrate=BAUDRATE,
            bytesize=serial.EIGHTBITS,
            parity=serial.PARITY_NONE,
            stopbits=serial.STOPBITS_ONE,
            timeout=0.6
        )
        ser.reset_input_buffer()
        ser.reset_output_buffer()
        print(f"✅ Port {PORT} berhasil dibuka. Memulai pembacaan...\n")
    except Exception as e:
        print(f"❌ GAGAL MEMBUKA PORT {PORT}: {e}")
        print("💡 Jika port sibuk, matikan backend pengunci dengan: pkill -9 -f 'backend/app.py'")
        sys.exit(1)

    count = 0
    success_count = 0

    try:
        while True:
            count += 1
            t_now = datetime.now().strftime("%H:%M:%S")

            ser.reset_input_buffer()
            ser.reset_output_buffer()

            # 1. Masuk mode KIRIM (TX)
            set_dere(1)
            time.sleep(0.002)

            # 2. Kirim request Modbus
            ser.write(REQ_CMD)
            ser.flush()

            # 3. Tahan sejenak untuk bit stop terakhir (~1.5ms) lalu langsung dengar
            time.sleep(15.0 / BAUDRATE)

            # 4. Masuk mode TERIMA (RX)
            set_dere(0)

            # 5. Baca respon 9 bytes (Langsung return seketika 9 bytes tiba tanpa nunggu timeout)
            resp = ser.read(9)

            if len(resp) == 9 and resp[0] == 1 and resp[1] == 4:
                raw_t = int.from_bytes(resp[3:5], "big", signed=True)
                raw_h = int.from_bytes(resp[5:7], "big", signed=False)
                temp = raw_t / 10.0
                hum = raw_h / 10.0
                success_count += 1

                # Visual status bar
                bar_t = "█" * int(min(temp, 45) / 3)
                print(f"[{t_now} | #{count:03d}]  🌡️  Suhu: {temp:5.1f} °C  |  💧 Kelembaban: {hum:5.1f} % RH   [OK #{success_count}]")
            elif len(resp) > 0:
                print(f"[{t_now} | #{count:03d}]  ⚠️ Data parsial: {len(resp)} byte ({resp.hex().upper()})")
            else:
                print(f"[{t_now} | #{count:03d}]  ⚪ Timeout: 0 byte diterima (Sensor tidak merespon)")

            time.sleep(1.0)

    except KeyboardInterrupt:
        print("\n\nPemantauan dihentikan oleh pengguna.")
    finally:
        set_dere(0)
        if ser and ser.is_open:
            ser.close()
        print(f"Statistik: {success_count}/{count} pembacaan berhasil. Sampai jumpa!\n")

if __name__ == '__main__':
    main()
