#!/usr/bin/env python3
"""
TETASCO CONNECT — PROGRAM PENGUJIAN MOTOR HIDROLIK & LIMIT SWITCH
Fitur Pengujian Lengkap:
1. Deteksi otomatis konflik proses (tetasco-backend.service)
2. Tes Langsung Output NAIK (UP - GPIO 13 / Pin 33) & TURUN (DOWN - GPIO 19 / Pin 35)
3. Tes Kedip (Blink Test) Visual LED Modul Relay
4. Monitor Limit Switch Real-time (Nilai RAW 0/1 & Status Kontak)
5. Tes Osilasi Bolak-Balik Otomatis (Continuous Tilting)
6. Ubah & Simpan Polaritas Output Relay (Active-HIGH vs Active-LOW)
7. Ubah & Simpan Polaritas Limit Switch (Active-LOW GND vs Active-HIGH 3.3V)
"""

import os
import sys
import time
import subprocess
from backend.hardware.hydraulic_controller import (
    hydraulic_controller,
    PIN_HYDRAULIC_UP,
    PIN_HYDRAULIC_DOWN,
    PIN_LIMIT_MAX,
    PIN_LIMIT_MIN
)

def check_backend_service():
    """Mengecek apakah service background tetasco-backend sedang aktif mengunci pin GPIO"""
    try:
        res = subprocess.run(["systemctl", "is-active", "--quiet", "tetasco-backend"], timeout=2)
        return res.returncode == 0
    except Exception:
        return False

def print_header():
    st = hydraulic_controller.get_status()
    backend_desc = st.get("backend", "unknown")
    is_sim = st.get("simulated", False)
    
    out_pol = "Active-HIGH (1 / 3.3V = ON)" if st.get("output_active_high") else "Active-LOW (0 / 0V = ON [Modul Relay Standar])"
    lim_pol = "Active-LOW (Tersambung GND = TERSENTUH)" if not st.get("limit_active_high") else "Active-HIGH (Tersambung 3.3V = TERSENTUH)"

    print("\n" + "=" * 64)
    print("🚜 TETASCO CONNECT — PENGUJIAN HIDROLIK & LIMIT SWITCH")
    print("=" * 64)
    if is_sim:
        print("⚠️  STATUS HARDWARE    : [SIMULASI] (Hardware GPIO TIDAK TERKONEKSI!)")
        if check_backend_service():
            print("🔴 PENYEBAB            : Service 'tetasco-backend' AKTIF di background!")
            print("👉 SOLUSI              : Jalankan: sudo systemctl stop tetasco-backend")
        else:
            err = st.get("hardware_error")
            if err:
                print(f"🔴 ERROR HARDWARE     : {err}")
    else:
        print(f"✅ STATUS HARDWARE    : AKTIF [{backend_desc}]")

    print(f"Output NAIK (UP)      : GPIO {PIN_HYDRAULIC_UP} (Pin Fisik 33)")
    print(f"Output TURUN (DOWN)   : GPIO {PIN_HYDRAULIC_DOWN} (Pin Fisik 35)")
    print(f"Feedback Limit MAX    : GPIO {PIN_LIMIT_MAX} (Pin Fisik 29)")
    print(f"Feedback Limit MIN    : GPIO {PIN_LIMIT_MIN} (Pin Fisik 31)")
    print(f"Polaritas Output Relay: {out_pol}")
    print(f"Polaritas Limit Switch: {lim_pol}")
    print("=" * 64)

def menu():
    print_header()
    print("PILIHAN PENGUJIAN:")
    print("1. Tes Paksa Output NAIK (UP) selama 2.5 detik  --> Cek LED Pin 13 Menyala")
    print("2. Tes Paksa Output TURUN (DOWN) selama 2.5 dtk --> Cek LED Pin 19 Menyala")
    print("3. Tes Kedip (Blink Test) NAIK & TURUN (3x)     --> Tes Visual Bergantian")
    print("4. Monitor Feedback Limit Switch Real-Time      --> Cek Nilai Biner RAW 0/1")
    print("5. Tes Osilasi Bolak-Balik Otomatis             --> Gerak Naik-Turun Terus")
    print("6. Tukar Polaritas Output Relay (Active-HIGH <-> Active-LOW)")
    print("7. Tukar Polaritas Limit Switch (Active-LOW <-> Active-HIGH)")
    print("8. Keluar")
    print("=" * 64)

def run():
    # Peringatan awal jika service aktif
    if check_backend_service():
        print("\n" + "!" * 64)
        print("⚠️  PERINGATAN: Service 'tetasco-backend' sedang AKTIF di background!")
        print("Pin GPIO mungkin sedang terkunci oleh sistem.")
        print("Jika lampu indikator tidak menyala atau limit switch tidak merespon,")
        print("matikan service sementara di terminal:")
        print("   sudo systemctl stop tetasco-backend")
        print("!" * 64 + "\n")
        time.sleep(1.0)

    while True:
        menu()
        try:
            pilihan = input("Masukkan nomor pilihan [1-8]: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nKeluar.")
            hydraulic_controller.cleanup()
            sys.exit(0)

        if pilihan == "1":
            print(f"\n▶️ Mengaktifkan Output NAIK (GPIO {PIN_HYDRAULIC_UP} / Pin 33) selama 2.5 detik...")
            print("💡 Perhatikan lampu LED indikator relay di channel NAIK. Harusnya MENYALA!")
            hydraulic_controller.force_output(up_state=True, down_state=False)
            time.sleep(2.5)
            hydraulic_controller.force_output(up_state=False, down_state=False)
            print("⏹️ Output NAIK (UP) dimatikan (LED harus MATI).\n")
            time.sleep(0.5)

        elif pilihan == "2":
            print(f"\n▶️ Mengaktifkan Output TURUN (GPIO {PIN_HYDRAULIC_DOWN} / Pin 35) selama 2.5 detik...")
            print("💡 Perhatikan lampu LED indikator relay di channel TURUN. Harusnya MENYALA!")
            hydraulic_controller.force_output(up_state=False, down_state=True)
            time.sleep(2.5)
            hydraulic_controller.force_output(up_state=False, down_state=False)
            print("⏹️ Output TURUN (DOWN) dimatikan (LED harus MATI).\n")
            time.sleep(0.5)

        elif pilihan == "3":
            print("\n💡 Memulai Tes Kedip Bergantian (Blink Test)...")
            print("Perhatikan lampu indikator relay di Pin 13 dan 19 bergantian nyala-mati.\n")
            hydraulic_controller.blink_test(cycles=3, delay=1.0)
            print("✅ Tes Kedip Selesai.\n")
            time.sleep(0.5)

        elif pilihan == "4":
            print("\n🔍 Memantau Feedback Limit Switch Real-Time...")
            print("💡 TIP:")
            print(" - Jika saklar disambung ke Ground (Active-LOW):")
            print("   Saat bebas bernilai RAW=1. Saat diklik/ditekan RAW berubah menjadi 0.")
            print("Tekan Ctrl+C untuk kembali ke menu utama.\n")
            try:
                while True:
                    max_act, min_act = hydraulic_controller._read_limits()
                    v_max, v_min, is_hw = hydraulic_controller.get_raw_limits()
                    
                    raw_str_max = f"RAW={v_max}" if is_hw else "SIM"
                    raw_str_min = f"RAW={v_min}" if is_hw else "SIM"

                    status_max = "🔴 TERSENTUH (MAX)" if max_act else "⚪ Terbuka"
                    status_min = "🔵 TERSENTUH (MIN)" if min_act else "⚪ Terbuka"

                    print(f"\rLimit MAX (GPIO {PIN_LIMIT_MAX}): [{raw_str_max}] {status_max:18} | Limit MIN (GPIO {PIN_LIMIT_MIN}): [{raw_str_min}] {status_min:18}", end="", flush=True)
                    time.sleep(0.08)
            except KeyboardInterrupt:
                print("\n\nSelesai pemantauan limit switch.\n")

        elif pilihan == "5":
            print("\n🔄 Memulai Osilasi Bolak-Balik Otomatis...")
            print("Rak akan bergerak NAIK hingga limit MAX, lalu otomatis TURUN hingga limit MIN.")
            print("Tekan Ctrl+C kapan saja untuk menghentikan.\n")
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
                print("\n\n⏹️ Osilasi dihentikan. Seluruh motor & relay dimatikan.\n")

        elif pilihan == "6":
            curr = hydraulic_controller.output_active_high
            new_val = not curr
            hydraulic_controller.set_output_polarity(new_val)
            print(f"\n🔄 Polaritas Output Relay diubah menjadi: {'Active-HIGH (1=ON)' if new_val else 'Active-LOW (0=ON [Modul Relay Standar])'}")
            print("💾 Pengaturan berhasil disimpan secara permanen!\n")
            time.sleep(1.0)

        elif pilihan == "7":
            curr = hydraulic_controller.limit_active_high
            new_val = not curr
            hydraulic_controller.set_limit_polarity(new_val)
            print(f"\n🔄 Polaritas Limit Switch diubah menjadi: {'Active-HIGH (3.3V=Tersentuh)' if new_val else 'Active-LOW (GND=Tersentuh)'}")
            print("💾 Pengaturan berhasil disimpan secara permanen!\n")
            time.sleep(1.0)

        elif pilihan == "8":
            hydraulic_controller.cleanup()
            print("Keluar. Sampai jumpa!")
            sys.exit(0)

        else:
            print("Pilihan tidak valid. Silakan masukkan nomor 1 sampai 8.\n")

if __name__ == '__main__':
    run()
