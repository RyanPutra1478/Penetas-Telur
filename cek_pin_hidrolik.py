#!/usr/bin/env python3
"""
TETASCO CONNECT — DIAGNOSTIK PIN FISIK RASPBERRY PI 5 (GPIO 5, 6, 13, 19)
Skrip ini membaca dan menulis langsung ke register SoC Raspberry Pi via pinctrl & lgpio,
sehingga dapat mendeteksi tegangan kabel jumper dan saklar fisik tanpa terpengaruh lock/simulasi.
"""

import os
import sys
import time
import subprocess
from datetime import datetime

PINS = {
    5:  {"name": "Limit Switch MAX (Atas)",  "phys": 29, "type": "INPUT"},
    6:  {"name": "Limit Switch MIN (Bawah)", "phys": 31, "type": "INPUT"},
    13: {"name": "Relay NAIK (UP)",          "phys": 33, "type": "OUTPUT"},
    19: {"name": "Relay TURUN (DOWN)",       "phys": 35, "type": "OUTPUT"},
}

def get_pinctrl_status(pin: int):
    """Membaca status detail dari pinctrl (Pi 5 Bookworm)"""
    try:
        out = subprocess.check_output(["pinctrl", "get", str(pin)], stderr=subprocess.DEVNULL, text=True).strip()
        # Contoh: " 6: ip    pu | hi // GPIO6 = input"
        level = "UNKNOWN"
        func = "UNKNOWN"
        pull = "UNKNOWN"
        if "|" in out:
            parts = out.split("|")
            left = parts[0].strip().split()
            right = parts[1].strip()
            if len(left) >= 2: func = left[1]
            if len(left) >= 3: pull = left[2]
            level = 1 if ("hi" in right.lower() or "1" in right) else 0
        return {"raw_text": out, "level": level, "func": func, "pull": pull}
    except Exception:
        pass

    # Fallback raspi-gpio
    try:
        out = subprocess.check_output(f"raspi-gpio get {pin}", shell=True, stderr=subprocess.DEVNULL, text=True).strip()
        level = 1 if "level=1" in out else (0 if "level=0" in out else "UNKNOWN")
        return {"raw_text": out, "level": level, "func": "gpio", "pull": "none"}
    except Exception:
        return {"raw_text": "Error/Unavailable", "level": "UNKNOWN", "func": "?", "pull": "?"}

def check_dtoverlays():
    """Mengecek apakah ada overlay kernel seperti dht11 yang membajak pin GPIO 6"""
    try:
        out = subprocess.check_output(["dtoverlay", "-l"], stderr=subprocess.DEVNULL, text=True).strip()
        return out
    except Exception:
        return ""

def check_process_locks():
    """Mengecek proses Python yang sedang memegang GPIO"""
    try:
        curr = os.getpid()
        out = subprocess.check_output(["pgrep", "-a", "python"], stderr=subprocess.DEVNULL, text=True).strip()
        lines = [l for l in out.splitlines() if str(curr) not in l and "backend/app.py" in l]
        return lines
    except Exception:
        return []

def main():
    print("=" * 68)
    print("⚡ TETASCO CONNECT — DIAGNOSTIK PIN FISIK (RASPBERRY PI 5)")
    print("=" * 68)

    # 1. Cek Kernel Overlay Konflik
    overlays = check_dtoverlays()
    print("[1] PEMERIKSAAN KERNEL OVERLAY (dtoverlay):")
    if "dht11" in overlays.lower():
        print("  ⚠️ PERINGATAN KERAS: Driver dht11 terdeteksi masih terpasang di kernel!")
        print(f"     Daftar overlay aktif:\n{overlays}")
        print("     Jika dht11 dipasang ke GPIO 6, pin 6 AKAN TERKUNCI OLEH KERNEL!")
        print("     👉 Untuk menghapusnya jalankan: sudo dtoverlay -r dht11")
    else:
        print("  ✅ Tidak ada overlay dht11 yang mengunci GPIO.")

    # 2. Cek Proses Background
    locks = check_process_locks()
    print("\n[2] PEMERIKSAAN PROSES PENGUNCI GPIO:")
    if locks:
        print(f"  ⚠️ Ditemukan {len(locks)} proses backend berjalan:")
        for l in locks:
            print(f"     -> {l}")
        print("     👉 Untuk mematikan jalankan: pkill -9 -f 'backend/app.py'")
    else:
        print("  ✅ Tidak ada proses backend app.py yang berjalan di background.")

    # 3. Snapshot Status Listrik Seluruh Pin Hidrolik
    print("\n[3] STATUS LISTRIK PIN SAAT INI (LANGSUNG DARI REGISTER SOC):")
    for pin, info in PINS.items():
        st = get_pinctrl_status(pin)
        lvl = st['level']
        lvl_str = "HIGH (3.3V)" if lvl == 1 else ("LOW (0V / GND)" if lvl == 0 else "UNKNOWN")
        print(f"  * GPIO {pin:2d} (Pin Fisik {info['phys']:2d}) [{info['name']:24s}]: {lvl_str:15s} | Register: {st['raw_text']}")

    print("\n" + "=" * 68)
    print("PILIHAN DIAGNOSTIK:")
    print("1. Monitor Real-Time Tegangan GPIO 5 & 6 (Lihat perubahan kabel/saklar)")
    print("2. Uji Nyala Relay NAIK (Pin 13) selama 3 detik")
    print("3. Uji Nyala Relay TURUN (Pin 19) selama 3 detik")
    print("4. Bersihkan / Lepas Driver DHT11 dari Kernel (sudo dtoverlay -r dht11)")
    print("5. Matikan Proses Backend Pengunci (pkill -9 -f backend/app.py)")
    print("6. Keluar")
    print("=" * 68)

    while True:
        try:
            pilih = input("\nPilih opsi [1-6]: ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nKeluar.")
            sys.exit(0)

        if pilih == "1":
            print("\n🔍 Memulai Pemantauan Real-Time (GPIO 5 & GPIO 6)...")
            print("💡 Hubungkan kabel ke Pin 31 (GPIO 6):")
            print("   - Sentuhkan ke 3.3V (Pin 1) --> Level harus berubah menjadi HIGH (1)")
            print("   - Sentuhkan ke GND  (Pin 30/34/39) --> Level harus berubah menjadi LOW (0)")
            print("Tekan Ctrl+C untuk berhenti.\n")

            last_5 = None
            last_6 = None
            spinners = ["|", "/", "-", "\\"]
            idx = 0
            start_t = time.time()

            try:
                while True:
                    s5 = get_pinctrl_status(5)['level']
                    s6 = get_pinctrl_status(6)['level']
                    now_s = datetime.now().strftime("%H:%M:%S.%f")[:-4]
                    spin = spinners[idx % 4]
                    idx += 1

                    # Log perubahan saat kawat disentuhkan
                    if last_5 is not None and s5 != last_5:
                        print(f"\n⚡ [{now_s}] PIN 5 BERUBAH: {last_5} -> {s5} ({'3.3V HIGH' if s5 == 1 else '0V LOW'})")
                    if last_6 is not None and s6 != last_6:
                        print(f"\n⚡ [{now_s}] PIN 6 BERUBAH: {last_6} -> {s6} ({'3.3V HIGH' if s6 == 1 else '0V LOW'})")

                    last_5 = s5
                    last_6 = s6

                    str_5 = "HIGH (1)" if s5 == 1 else ("LOW  (0)" if s5 == 0 else "???")
                    str_6 = "HIGH (1)" if s6 == 1 else ("LOW  (0)" if s6 == 0 else "???")
                    dur = time.time() - start_t

                    print(f"\r[{spin} {dur:4.1f}s] GPIO 5 (Pin 29): [{str_5}] | GPIO 6 (Pin 31): [{str_6}] ", end="", flush=True)
                    time.sleep(0.1)
            except KeyboardInterrupt:
                print("\n\nSelesai pemantauan.\n")

        elif pilih == "2":
            print("\n⚡ Menyalakan Relay NAIK (Pin 13) langsung via pinctrl...")
            subprocess.run(["pinctrl", "set", "13", "op", "dh"])
            print("   --> Pin 13 diset HIGH (3.3V). Periksa LED Relay!")
            time.sleep(3.0)
            subprocess.run(["pinctrl", "set", "13", "op", "dl"])
            print("   --> Pin 13 dimatikan (LOW).\n")

        elif pilih == "3":
            print("\n⚡ Menyalakan Relay TURUN (Pin 19) langsung via pinctrl...")
            subprocess.run(["pinctrl", "set", "19", "op", "dh"])
            print("   --> Pin 19 diset HIGH (3.3V). Periksa LED Relay!")
            time.sleep(3.0)
            subprocess.run(["pinctrl", "set", "19", "op", "dl"])
            print("   --> Pin 19 dimatikan (LOW).\n")

        elif pilih == "4":
            print("\n🧹 Mencoba melepas driver overlay dht11...")
            subprocess.run(["sudo", "dtoverlay", "-r", "dht11"])
            print("✅ Selesai. Cek overlay:")
            print(check_dtoverlays() or "Tidak ada overlay dht11.")

        elif pilih == "5":
            print("\n🛑 Mematikan proses backend...")
            subprocess.run(["pkill", "-9", "-f", "backend/app.py"])
            time.sleep(1.0)
            print("✅ Proses backend telah dimatikan.")

        elif pilih == "6":
            print("Keluar. Sampai jumpa!")
            sys.exit(0)

if __name__ == '__main__':
    main()
