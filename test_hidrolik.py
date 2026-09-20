#!/usr/bin/env python3
"""
TETASCO CONNECT — PROGRAM PENGUJIAN MOTOR HIDROLIK & LIMIT SWITCH
Fitur Pengujian Lengkap:
1. Deteksi otomatis & pembebasan pin GPIO dari backend background (pkill)
2. Tes Langsung Output NAIK (UP - GPIO 13) & TURUN (DOWN - GPIO 19)
3. Tes Kedip (Blink Test) Visual LED Modul Relay
4. Monitor Limit Switch Real-time dengan Deteksi Klik Perubahan & Heartbeat Spinner
5. Tes Osilasi Bolak-Balik Otomatis (Continuous Tilting)
6. Ubah & Simpan Polaritas Output Relay (Active-HIGH vs Active-LOW)
7. Ubah & Simpan Polaritas Limit Switch (Active-LOW GND vs Active-HIGH 3.3V)
"""

import os
import sys
import time
import subprocess
from datetime import datetime
from backend.hardware.hydraulic_controller import (
    hydraulic_controller,
    PIN_HYDRAULIC_UP,
    PIN_HYDRAULIC_DOWN,
    PIN_LIMIT_MAX,
    PIN_LIMIT_MIN
)

def find_backend_pids():
    """Mencari PID proses backend Python yang sedang berjalan dan mengunci GPIO"""
    try:
        current_pid = os.getpid()
        cmd = ["pgrep", "-f", "backend/app.py"]
        out = subprocess.check_output(cmd, stderr=subprocess.DEVNULL).decode().strip().split()
        pids = [int(p) for p in out if int(p) != current_pid]
        return pids
    except Exception:
        return []

def kill_backend():
    """Menghentikan proses backend untuk membebaskan pin GPIO"""
    print("\n⏳ Mematikan proses backend Tetasco untuk membebaskan pin GPIO...")
    subprocess.run(["pkill", "-9", "-f", "backend/app.py"], stderr=subprocess.DEVNULL)
    subprocess.run(["pkill", "-9", "-f", "python3.*backend/app.py"], stderr=subprocess.DEVNULL)
    try:
        subprocess.run(["sudo", "systemctl", "stop", "tetasco-backend"], stderr=subprocess.DEVNULL)
    except Exception:
        pass
    time.sleep(1.2)
    success = hydraulic_controller.reinit_hardware()
    if success:
        print("✅ SUKSES: Pin GPIO berhasil dibebaskan dan diklaim oleh pengujian hardware!")
    else:
        err = hydraulic_controller.hardware_error or "Unknown error"
        print(f"⚠️ Masih belum bisa klaim hardware: {err}")
    return success

def start_backend():
    """Menjalankan kembali backend Tetasco di background saat keluar pengujian"""
    print("\n🚀 Menjalankan kembali backend Tetasco di background...")
    subprocess.Popen(
        ["nohup", "python3", "backend/app.py"],
        stdout=open("/tmp/tetasco_backend.log", "a"),
        stderr=subprocess.STDOUT,
        preexec_fn=os.setpgrp
    )
    time.sleep(1.0)
    print("✅ Backend Tetasco telah dimulai kembali.")

def print_header():
    st = hydraulic_controller.get_status()
    backend_desc = st.get("backend", "unknown")
    is_sim = st.get("simulated", False)
    backend_pids = find_backend_pids()
    
    out_pol = "Active-HIGH (1 / 3.3V = ON)" if st.get("output_active_high") else "Active-LOW (0 / 0V = ON [Modul Relay Standar])"
    lim_pol = "Active-LOW (GND = TERSENTUH)" if not st.get("limit_active_high") else "Active-HIGH (3.3V = TERSENTUH)"

    print("\n" + "=" * 66)
    print("🚜 TETASCO CONNECT — PENGUJIAN HIDROLIK & LIMIT SWITCH")
    print("=" * 66)
    if is_sim:
        print("🔴 STATUS HARDWARE    : [SIMULASI] ⚠️ PIN GPIO SEDANG TERKUNCI!")
        if backend_pids:
            print(f"🔴 PENYEBAB            : Backend Tetasco aktif di background (PID: {backend_pids})")
            print("👉 SOLUSI              : Pilih Menu 0 untuk mematikan backend dan membebaskan pin")
        else:
            err = st.get("hardware_error")
            if err:
                print(f"🔴 ERROR HARDWARE     : {err}")
    else:
        print(f"✅ STATUS HARDWARE    : AKTIF FISIK [{backend_desc}]")

    print(f"Output NAIK (UP)      : GPIO {PIN_HYDRAULIC_UP} (Pin Fisik 33)")
    print(f"Output TURUN (DOWN)   : GPIO {PIN_HYDRAULIC_DOWN} (Pin Fisik 35)")
    print(f"Feedback Limit MAX    : GPIO {PIN_LIMIT_MAX} (Pin Fisik 29)")
    print(f"Feedback Limit MIN    : GPIO {PIN_LIMIT_MIN} (Pin Fisik 31)")
    print(f"Polaritas Output Relay: {out_pol}")
    print(f"Polaritas Limit Switch: {lim_pol}")
    print("=" * 66)

def menu():
    print_header()
    print("PILIHAN PENGUJIAN:")
    print("0. 🛑 Hentikan Backend Background (BEBASKAN PIN GPIO AGAR HARDWARE AKTIF)")
    print("1. ⚡ Tes Paksa Output NAIK (UP) selama 2.5 dtk  --> Cek LED Pin 13 Menyala")
    print("2. ⚡ Tes Paksa Output TURUN (DOWN) selama 2.5 dtk--> Cek LED Pin 19 Menyala")
    print("3. 💡 Tes Kedip (Blink Test) NAIK & TURUN (3x)   --> Tes Visual Bergantian")
    print("4. 🔍 Monitor Feedback Limit Switch Real-Time    --> Deteksi Klik RAW 0/1")
    print("5. 🔄 Tes Osilasi Bolak-Balik Otomatis           --> Gerak Naik-Turun Terus")
    print("6. ⚙️  Tukar Polaritas Output Relay (Active-HIGH <-> Active-LOW)")
    print("7. ⚙️  Tukar Polaritas Limit Switch (Active-LOW <-> Active-HIGH)")
    print("8. 🚪 Keluar Saja (Tanpa Start Backend)")
    print("9. 🚀 Keluar & Nyalakan Kembali Backend Tetasco")
    print("=" * 66)

def run():
    # Cek apakah backend mengunci pin di awal
    pids = find_backend_pids()
    if pids:
        print("\n" + "!" * 66)
        print(f"⚠️  DITEMUKAN PROSES BACKEND BERJALAN (PID: {pids}) MENGUNCI GPIO!")
        print("Hardware tidak akan merespon selama backend ini berjalan.")
        try:
            jawab = input("Matikan proses backend sekarang agar hardware fisik aktif? [Y/n]: ").strip().lower()
        except (KeyboardInterrupt, EOFError):
            jawab = "n"
        if jawab in ("", "y", "ya", "yes"):
            kill_backend()
        print("!" * 66 + "\n")

    while True:
        menu()
        try:
            pilihan = input("Masukkan nomor pilihan [0-9]: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nKeluar.")
            hydraulic_controller.cleanup()
            sys.exit(0)

        if pilihan == "0":
            kill_backend()
            time.sleep(1.0)

        elif pilihan == "1":
            st = hydraulic_controller.get_status()
            if st.get("simulated"):
                print("\n⚠️ PERINGATAN: Masih dalam mode SIMULASI! Sinyal fisik tidak keluar.")
                print("Jalankan Menu 0 terlebih dahulu untuk mematikan proses backend pengunci.")
            print(f"\n▶️ Mengaktifkan Output NAIK (GPIO {PIN_HYDRAULIC_UP} / Pin 33) selama 2.5 detik...")
            print("💡 Perhatikan lampu LED indikator relay di channel NAIK. Harusnya MENYALA!")
            hydraulic_controller.force_output(up_state=True, down_state=False)
            time.sleep(2.5)
            hydraulic_controller.force_output(up_state=False, down_state=False)
            print("⏹️ Output NAIK (UP) dimatikan (LED harus MATI).\n")
            time.sleep(0.5)

        elif pilihan == "2":
            st = hydraulic_controller.get_status()
            if st.get("simulated"):
                print("\n⚠️ PERINGATAN: Masih dalam mode SIMULASI! Sinyal fisik tidak keluar.")
                print("Jalankan Menu 0 terlebih dahulu untuk mematikan proses backend pengunci.")
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
            st = hydraulic_controller.get_status()
            if st.get("simulated"):
                print("\n" + "!" * 66)
                print("⚠️  PERINGATAN: Program sedang berjalan dalam MODE SIMULASI!")
                print("Saklar fisik TIDAK AKAN TERBACA karena pin GPIO terkunci oleh backend.")
                print("Silakan keluar dari menu ini (Ctrl+C) lalu tekan Menu 0 untuk mematikan backend.")
                print("!" * 66 + "\n")

            print("\n🔍 Memantau Feedback Limit Switch Real-Time...")
            print("💡 TIP PENGUJIAN SAKLAR:")
            print(" - Jika saklar disambung ke Ground (Active-LOW):")
            print("   * Saat BEBAS   : RAW=1  (⚪ Terbuka)")
            print("   * Saat DIKLIK  : RAW=0  (🔴 TERSENTUH)")
            print("Tekan Ctrl+C untuk kembali ke menu utama.\n")

            spin_chars = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
            spin_idx = 0
            start_t = time.time()
            last_max = None
            last_min = None
            tick = 0

            try:
                while True:
                    max_act, min_act = hydraulic_controller._read_limits()
                    v_max, v_min, is_hw = hydraulic_controller.get_raw_limits()
                    
                    elapsed = time.time() - start_t
                    spin = spin_chars[spin_idx % len(spin_chars)]
                    spin_idx += 1
                    tick += 1

                    # Log baris baru saat terjadi perubahan klik fisik!
                    if last_max is not None and v_max != last_max:
                        t_str = datetime.now().strftime("%H:%M:%S.%f")[:-4]
                        act_str = "🔴 TERSENTUH" if max_act else "⚪ TERBUKA"
                        print(f"\n✨ [{t_str}] PERUBAHAN LIMIT MAX (Pin 5) -> RAW={v_max} ({act_str})")
                    if last_min is not None and v_min != last_min:
                        t_str = datetime.now().strftime("%H:%M:%S.%f")[:-4]
                        act_str = "🔵 TERSENTUH" if min_act else "⚪ TERBUKA"
                        print(f"\n✨ [{t_str}] PERUBAHAN LIMIT MIN (Pin 6) -> RAW={v_min} ({act_str})")

                    last_max = v_max
                    last_min = v_min

                    raw_str_max = f"RAW={v_max}" if is_hw else "SIM"
                    raw_str_min = f"RAW={v_min}" if is_hw else "SIM"

                    status_max = "🔴 TERSENTUH (MAX)" if max_act else "⚪ Terbuka"
                    status_min = "🔵 TERSENTUH (MIN)" if min_act else "⚪ Terbuka"

                    print(f"\r[{spin} Detik: {elapsed:4.1f}s | #{tick}] MAX (Pin 5): [{raw_str_max}] {status_max:18} | MIN (Pin 6): [{raw_str_min}] {status_min:18}", end="", flush=True)
                    time.sleep(0.1)
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
            print("Keluar tanpa menjalankan backend. Sampai jumpa!")
            sys.exit(0)

        elif pilihan == "9":
            hydraulic_controller.cleanup()
            start_backend()
            print("Keluar. Sampai jumpa!")
            sys.exit(0)

        else:
            print("Pilihan tidak valid. Silakan masukkan nomor 0 sampai 9.\n")

if __name__ == '__main__':
    run()
