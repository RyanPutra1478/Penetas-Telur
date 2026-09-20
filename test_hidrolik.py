#!/usr/bin/env python3
"""
TETASCO CONNECT — PROGRAM PENGUJIAN HIDROLIK & LIMIT SWITCH
Pengujian interaktif untuk memverifikasi hardware penggerak hidrolik pembalik rak:
1. Tes Output NAIK (UP)
2. Tes Output TURUN (DOWN)
3. Monitor Status Feedback Limit Switch MAX & MIN secara Real-time (Dilengkapi Nilai Biner RAW)
4. Tes Gerakan Osilasi Bolak-Balik Otomatis (Continuous Tilting)
5. Ubah Polaritas Saklar (Active-LOW GND vs Active-HIGH 3.3V)
"""

import sys
import time
from backend.hardware.hydraulic_controller import (
    hydraulic_controller,
    PIN_HYDRAULIC_UP,
    PIN_HYDRAULIC_DOWN,
    PIN_LIMIT_MAX,
    PIN_LIMIT_MIN,
    OUTPUT_ACTIVE_HIGH
)

def print_header():
    pol_str = "Active-HIGH (3.3V)" if hydraulic_controller.limit_active_high else "Active-LOW (GND / Standar Pull-Up)"
    print("==========================================================")
    print("🚜 TETASCO CONNECT — PENGUJIAN MOTOR HIDROLIK & LIMIT SWITCH")
    print("==========================================================")
    print(f"Output NAIK (UP)     : GPIO {PIN_HYDRAULIC_UP} (Pin Fisik 33)")
    print(f"Output TURUN (DOWN)  : GPIO {PIN_HYDRAULIC_DOWN} (Pin Fisik 35)")
    print(f"Feedback Limit MAX   : GPIO {PIN_LIMIT_MAX} (Pin Fisik 29)")
    print(f"Feedback Limit MIN   : GPIO {PIN_LIMIT_MIN} (Pin Fisik 31)")
    print(f"Polaritas Saklar     : {pol_str}")
    print("==========================================================")

def menu():
    print_header()
    print("Pilih menu pengujian:")
    print("1. Tes Output NAIK (UP) selama 2 detik")
    print("2. Tes Output TURUN (DOWN) selama 2 detik")
    print("3. Monitor Feedback Limit Switch Real-Time (Lihat Nilai RAW 0/1)")
    print("4. Tes Osilasi Bolak-Balik Otomatis (Gerak bolak-balik hingga ditekan Ctrl+C)")
    print("5. Ganti Polaritas Saklar (Active-LOW <-> Active-HIGH)")
    print("6. Keluar")
    print("==========================================================")

def run():
    while True:
        menu()
        try:
            pilihan = input("Masukkan nomor pilihan [1-6]: ").strip()
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
            print("\n🔍 Memantau Limit Switch Real-Time...")
            print("💡 TIP: Jika saklar disambung ke Ground, saat diklik RAW akan berubah dari 1 menjadi 0.")
            print("Tekan Ctrl+C untuk kembali ke menu.\n")
            try:
                while True:
                    max_act, min_act = hydraulic_controller._read_limits()
                    v_max, v_min, is_hw = hydraulic_controller.get_raw_limits()
                    
                    raw_str_max = f"RAW={v_max}" if is_hw else "SIM"
                    raw_str_min = f"RAW={v_min}" if is_hw else "SIM"

                    status_max = "🔴 TERSENTUH (MAX)" if max_act else "⚪ Terbuka"
                    status_min = "🔵 TERSENTUH (MIN)" if min_act else "⚪ Terbuka"

                    print(f"\rLimit MAX (GPIO {PIN_LIMIT_MAX}): [{raw_str_max}] {status_max:18} | Limit MIN (GPIO {PIN_LIMIT_MIN}): [{raw_str_min}] {status_min:18}", end="", flush=True)
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
            new_pol = not hydraulic_controller.limit_active_high
            hydraulic_controller.set_limit_polarity(new_pol)
            pol_desc = "Active-HIGH (Tersentuh = 3.3V/1)" if new_pol else "Active-LOW (Tersentuh = GND/0 / Standar Pull-Up)"
            print(f"\n🔄 Polaritas Limit Switch berhasil diubah menjadi: {pol_desc}\n")

        elif pilihan == "6":
            hydraulic_controller.cleanup()
            print("Keluar. Sampai jumpa!")
            sys.exit(0)

        else:
            print("Pilihan tidak valid. Silakan pilih 1-6.\n")

if __name__ == '__main__':
    run()
