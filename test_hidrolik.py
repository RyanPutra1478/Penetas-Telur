#!/usr/bin/env python3
"""
TETASCO CONNECT — PROGRAM PENGUJIAN HIDROLIK & LIMIT SWITCH
Pengujian interaktif untuk memverifikasi hardware penggerak hidrolik pembalik rak:
1. Tes Output NAIK (UP)
2. Tes Output TURUN (DOWN)
3. Monitor Status Feedback Limit Switch MAX & MIN secara Real-time
4. Tes Gerakan Osilasi Bolak-Balik Otomatis (Continuous Tilting)
"""

import sys
import time
from backend.hardware.hydraulic_controller import (
    hydraulic_controller,
    PIN_HYDRAULIC_UP,
    PIN_HYDRAULIC_DOWN,
    PIN_LIMIT_MAX,
    PIN_LIMIT_MIN,
    OUTPUT_ACTIVE_HIGH,
    LIMIT_ACTIVE_HIGH
)

def print_header():
    print("==========================================================")
    print("🚜 TETASCO CONNECT — PENGUJIAN MOTOR HIDROLIK & LIMIT SWITCH")
    print("==========================================================")
    print(f"Output NAIK (UP)     : GPIO {PIN_HYDRAULIC_UP} (Active {'HIGH' if OUTPUT_ACTIVE_HIGH else 'LOW'})")
    print(f"Output TURUN (DOWN)  : GPIO {PIN_HYDRAULIC_DOWN} (Active {'HIGH' if OUTPUT_ACTIVE_HIGH else 'LOW'})")
    print(f"Feedback Limit MAX   : GPIO {PIN_LIMIT_MAX} (Active {'HIGH' if LIMIT_ACTIVE_HIGH else 'LOW/GND'})")
    print(f"Feedback Limit MIN   : GPIO {PIN_LIMIT_MIN} (Active {'HIGH' if LIMIT_ACTIVE_HIGH else 'LOW/GND'})")
    print("==========================================================")

def menu():
    print_header()
    print("Pilih menu pengujian:")
    print("1. Tes Output NAIK (UP) selama 2 detik")
    print("2. Tes Output TURUN (DOWN) selama 2 detik")
    print("3. Monitor Feedback Limit Switch secara Real-Time (Sentuh saklar dengan tangan)")
    print("4. Tes Osilasi Bolak-Balik Otomatis (Gerak bolak-balik hingga ditekan Ctrl+C)")
    print("5. Keluar")
    print("==========================================================")

def run():
    while True:
        menu()
        try:
            pilihan = input("Masukkan nomor pilihan [1-5]: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nKeluar.")
            hydraulic_controller.cleanup()
            sys.exit(0)

        if pilihan == "1":
            print("\n▶️ Menyalakan Output NAIK (UP) selama 2 detik...")
            hydraulic_controller.move_up()
            time.sleep(2.0)
            hydraulic_controller.stop()
            print("⏹️ Output NAIK (UP) dimatikan.\n")

        elif pilihan == "2":
            print("\n▶️ Menyalakan Output TURUN (DOWN) selama 2 detik...")
            hydraulic_controller.move_down()
            time.sleep(2.0)
            hydraulic_controller.stop()
            print("⏹️ Output TURUN (DOWN) dimatikan.\n")

        elif pilihan == "3":
            print("\n🔍 Memantau Limit Switch Real-Time (Tekan Ctrl+C untuk kembali ke menu)...")
            print("Silakan tekan Limit Switch MAX dan MIN pada mekanik hidrolik:\n")
            try:
                while True:
                    max_act, min_act = hydraulic_controller._read_limits()
                    status_max = "🔴 TERSENTUH (MAX ANGLE)" if max_act else "⚪ Terbuka"
                    status_min = "🔵 TERSENTUH (MIN ANGLE)" if min_act else "⚪ Terbuka"
                    print(f"\rLimit MAX (GPIO {PIN_LIMIT_MAX}): {status_max:28} | Limit MIN (GPIO {PIN_LIMIT_MIN}): {status_min:28}", end="", flush=True)
                    time.sleep(0.1)
            except KeyboardInterrupt:
                print("\n\nSelesai pemantauan limit switch.\n")

        elif pilihan == "4":
            print("\n🔄 Memulai Osilasi Bolak-Balik Otomatis (Tekan Ctrl+C untuk menghentikan)...")
            print("Rak akan bergerak bolak-balik antara Limit MAX dan Limit MIN secara terus-menerus.\n")
            hydraulic_controller.start_oscillation()
            try:
                while True:
                    st = hydraulic_controller.get_status()
                    arah = st.get("state")
                    pos = st.get("position_percent", 50)
                    l_max = "🔴 MAX" if st.get("limit_max") else "      "
                    l_min = "🔵 MIN" if st.get("limit_min") else "      "
                    print(f"\rStatus Gerak: {arah:6} | {l_min} [Posisi: {pos:4.1f}%] {l_max}", end="", flush=True)
                    time.sleep(0.1)
            except KeyboardInterrupt:
                hydraulic_controller.stop_oscillation()
                print("\n\n⏹️ Osilasi dihentikan. Seluruh motor dimatikan.\n")

        elif pilihan == "5":
            hydraulic_controller.cleanup()
            print("Keluar. Sampai jumpa!")
            sys.exit(0)

        else:
            print("Pilihan tidak valid. Silakan pilih 1-5.\n")

if __name__ == '__main__':
    run()
