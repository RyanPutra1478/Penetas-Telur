# 🥚 TETASCO CONNECT — Smart Egg Incubator HMI & Local Controller

> **Modern Touchscreen Interface & Local Hardware Controller** untuk Sistem Mesin Penetas Telur Pintar berbasis **React 19**, **Python Flask**, dan **GPIO Raspberry Pi 4**, dioptimalkan khusus untuk layar sentuh 7 inci (1024×600) dan berjalan **100% OFFLINE TANPA INTERNET**.

---

## 🏛️ Arsitektur Sistem Standalone (Offline)

```text
┌─────────────────────────────────────────────────────────┐
│                 RASPBERRY PI 4 STANDALONE               │
│                                                         │
│   ┌─────────────────────────────────────────────────┐   │
│   │   LCD TOUCHSCREEN 7 INCI (1024 × 600)           │   │
│   │   Chromium Kiosk Mode                           │   │
│   └────────────────────────┬────────────────────────┘   │
│                            │                            │
│                            ▼                            │
│   ┌─────────────────────────────────────────────────┐   │
│   │   React 19 HMI (Tetasco Connect)                │   │
│   │   http://127.0.0.1:5001                         │   │
│   └────────────────────────┬────────────────────────┘   │
│                            │ REST API (localhost)       │
│                            ▼                            │
│   ┌─────────────────────────────────────────────────┐   │
│   │   Python Flask Backend & Smart Controller Loop  │   │
│   │   (app.py - Port 5001)                          │   │
│   └────────────────────────┬────────────────────────┘   │
│                            │ gpiozero                   │
│                            ▼                            │
│   ┌─────────────────────────────────────────────────┐   │
│   │   GPIO Controller (Broadcom Pin BCM)            │   │
│   └──────┬─────────────┬─────────────┬───────────┬──┘   │
└──────────┼─────────────┼─────────────┼───────────┼──────┘
           ▼             ▼             ▼           ▼
       [GPIO 22]     [GPIO 26]     [GPIO 4]    [GPIO 13]
       Relay IN1     Relay IN2     Relay IN3   Relay IN4
        PEMANAS        KIPAS       PELEMBAB      MOTOR
       (Active LOW) (Active HIGH) (Active HIGH)(Active HIGH)
```

- **Zero External Network Needed:** Tidak membutuhkan Wi-Fi, router, maupun koneksi internet. Seluruh komunikasi berlangsung di dalam `localhost` (127.0.0.1).
- **Single Production Server:** Backend Python menyajikan file statis React (`dist/`) sekaligus melayani REST API GPIO di port 5001.

---

## 🔌 Pemetaan Pin GPIO Hardware (Relay 4 Channel)

| Aktuator | Pin BCM | Pin Fisik Board | Modul Relay | Konfigurasi Logika |
|---|---|---|---|---|
| **Pemanas (Heater)** | GPIO 22 | Pin 15 | IN1 | **Active LOW** (`active_high=False`) |
| **Kipas (Circulation Fan)** | GPIO 26 | Pin 37 | IN2 | **Active HIGH** (`active_high=True`) |
| **Pelembab (Humidifier)** | GPIO 4 | Pin 7 | IN3 | **Active HIGH** (`active_high=True`) |
| **Pembalik Rak (Motor)** | GPIO 13 | Pin 33 | IN4 | **Active HIGH** (`active_high=True`) |

> *Catatan Sensor:* Sensor DHT11/DHT22 terhubung ke pin GPIO (default GPIO 17 / Pin 11) dan didukung simulasi pintar dinamis saat berjalan di laptop/komputer pengembang.

---

## 🚀 Panduan Setup di Raspberry Pi 4

### OPSI A: Setup Otomatis 1 Perintah (Sangat Disarankan)

Buka terminal di Raspberry Pi dan jalankan:
```bash
cd ~/Penetas-Telur
bash scripts/setup_raspberry_pi.sh
```
Skrip ini akan secara otomatis:
1. Menginstal seluruh paket sistem (Python, Chromium, Unclutter, Node.js, dll.).
2. Menginstal library Python backend (`gpiozero`, `rpi-lgpio`, `flask`, dll.).
3. Mengompilasi frontend React HMI (`npm run build`).
4. Mengonfigurasi autostart Kiosk Mode layar 7 inci saat Raspberry Pi menyala.

Setelah instalasi selesai, cukup reboot:
```bash
sudo reboot
```
Raspberry Pi akan langsung menyala, membuka HMI Tetasco Connect layar penuh (fullscreen), dan siap digunakan.

---

### OPSI B: Setup Manual Langkah demi Langkah

#### 1. Kloning Repositori
```bash
git clone https://github.com/RyanPutra1478/Penetas-Telur.git
cd Penetas-Telur
```

#### 2. Install Dependensi Sistem & Python
```bash
sudo apt-get update
sudo apt-get install -y python3 python3-pip python3-gpiozero python3-rpi.gpio chromium-browser unclutter curl
pip install -r backend/requirements.txt --break-system-packages
```

#### 3. Build React Frontend untuk Mode Offline
```bash
npm install
npm run build
```

#### 4. Uji Coba Menjalankan
Jalankan skrip startup:
```bash
chmod +x scripts/start_tetasco.sh
./scripts/start_tetasco.sh
```

#### 5. Memasang Autostart Kiosk Saat Booting
Salin konfigurasi autostart ke desktop session:
```bash
mkdir -p ~/.config/autostart
cp scripts/tetasco-kiosk.desktop ~/.config/autostart/tetasco.desktop
```

---

## 📡 Dokumentasi Endpoint REST API (Localhost:5001)

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/health` | Status kesehatan backend & mode GPIO (hardware / simulated). |
| `GET` | `/api/sensor` | Data suhu (°C) dan kelembaban (% RH) terkini. |
| `GET` | `/api/actuators` | Status hidup/mati seluruh relay saat ini. |
| `POST` | `/api/actuators/<name>` | Menghidupkan/mematikan aktuator (`heater`, `fan`, `humidifier`, `motor`). Payload: `{"state": true}`. |
| `POST` | `/api/emergency-stop` | Mematikan seluruh relay secara instan (Emergency). |
| `GET/POST` | `/api/control/mode` | Mengambil atau mengubah mode Auto/Manual, target suhu, target kelembaban, dan profil spesies. |

---

## 📁 Struktur Direktori

```text
Penetas-Telur/
├── backend/
│   ├── app.py                     # Entry point Flask server, REST API & static server
│   ├── requirements.txt           # Dependensi Python (flask, gpiozero, rpi-lgpio)
│   ├── hardware/
│   │   └── gpio_controller.py     # Kontroler GPIO 22, 26, 4, 13 + fallback simulasi
│   └── sensors/
│       └── dht_sensor.py          # Driver sensor DHT & simulasi responsif
├── dist/                          # Hasil kompilasi produksi React (siap saji offline)
├── scripts/
│   ├── setup_raspberry_pi.sh      # Skrip instalasi otomatis Raspberry Pi
│   ├── start_tetasco.sh           # Skrip startup backend + Chromium kiosk
│   ├── tetasco-backend.service    # Systemd service untuk background daemon
│   └── tetasco-kiosk.desktop      # Konfigurasi autostart layar sentuh
├── src/
│   ├── api/
│   │   └── tetascoApi.js          # Klien komunikasi lokal React ke Flask
│   ├── components/
│   │   ├── BottomNavBar.jsx       # Navigasi bawah 5 tab ergonomis
│   │   ├── Layout.jsx             # Shell layout HMI
│   │   └── TopAppBar.jsx          # Header status sistem & brand
│   ├── pages/
│   │   ├── DasborUtama.jsx        # Telemetri suhu/RH & 4 slider aktuator
│   │   ├── KontrolLingkungan.jsx  # Kontrol target, mode Auto/Manual, & profil
│   │   ├── PemantauanBatch.jsx    # Grafik riwayat inkubasi
│   │   ├── KameraLangsung.jsx     # Live camera feed & kontrol PTZ
│   │   └── StatusSistem.jsx       # Log alarm & kesehatan sistem
│   ├── App.jsx                    # Router
│   ├── index.css                  # Desain sistem Batik Nusantara & Color Tokens
│   └── main.jsx                   # React root
├── package.json
├── vite.config.js                 # Proxy localhost:5001 untuk mode dev
└── README.md
```

---

## 📜 Lisensi & Pengembang

Dikembangkan oleh **[Ryan Putra](https://github.com/RyanPutra1478)**.  
Repositori Resmi: [https://github.com/RyanPutra1478/Penetas-Telur](https://github.com/RyanPutra1478/Penetas-Telur)
