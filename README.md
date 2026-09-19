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

## 🔌 Pemetaan Pin GPIO Hardware

### A. Modul Relay 5-Channel (Active-HIGH)
| Aktuator | Pin BCM | Pin Fisik Board | Modul Relay | Logika | Catatan |
|---|---|---|---|---|---|
| **Lampu Pemanas 1** | **GPIO 22** | Pin 15 | IN1 | Active-HIGH | Pemanas Utama (Stage 1) |
| **Lampu Pemanas 2** | **GPIO 26** | Pin 37 | IN2 | Active-HIGH | Pemanas Cepat (Stage 2 / Boost) |
| **Kipas Sirkulasi** | **GPIO 4** | Pin 7 | IN3 | Active-HIGH | Sirkulasi & Exhaust Suhu Berlebih |
| **Mist Maker / Pelembab** | **GPIO 17** | Pin 11 | IN4 | Active-HIGH | Pengatur Kelembaban Udara |
| **Lampu UV Sterilisasi** | **GPIO 27** | Pin 13 | IN5 | Active-HIGH | Sterilisasi Ruang Mesin Penetas |

### B. Kontroler Motor Hidrolik (Custom PCB Matrix Driver)
| Fungsi / Komponen | Pin BCM | Pin Fisik Board | Tipe Sinyal | Deskripsi |
|---|---|---|---|---|
| **Perintah NAIK (UP)** | **GPIO 13** | Pin 33 | Output | Sinyal HIGH ke Custom PCB Driver untuk memutar motor hidrolik naik |
| **Perintah TURUN (DOWN)**| **GPIO 19** | Pin 35 | Output | Sinyal HIGH ke Custom PCB Driver untuk memutar motor hidrolik turun |
| **Sensor LIMIT MAX** | **GPIO 5** | Pin 29 | Input | Limit Switch Batas Atas (`pull_up=False`) — Auto Cut-Off UP |
| **Sensor LIMIT MIN** | **GPIO 6** | Pin 31 | Input | Limit Switch Batas Bawah (`pull_up=False`) — Auto Cut-Off DOWN |

> **Safety Interlock Hardware:** Sistem secara otomatis mencegah sinyal UP dan DOWN aktif bersamaan dengan proteksi jeda waktu (*dead-time delay*). Limit switch terus diawasi secara real-time pada loop background (< 50ms) untuk menghentikan motor seketika saat mencapai batas fisik.

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
| `POST` | `/api/actuators/<name>` | Menghidupkan/mematikan aktuator (`lamp_1`, `lamp_2`, `fan`, `mist_maker`, `uv_light`, `motor`). |
| `POST` | `/api/emergency-stop` | Mematikan seluruh relay secara instan (Emergency). |
| `GET/POST` | `/api/control/mode` | Mengambil atau mengubah target suhu, kelembaban, dan profil spesies. |
| `POST` | `/api/system/exit-kiosk` | Menutup browser Chromium kiosk di Raspberry Pi untuk keluar ke desktop OS (Tombol F11). |
| `POST` | `/api/system/shutdown` | Mematikan daya Raspberry Pi secara aman (`sudo poweroff`). |

---

## 📁 Struktur Proyek & Pengelompokan Kategori

Seluruh berkas proyek telah dikelompokkan secara rapi berdasarkan kategori fungsinya:

```text
Penetas-Telur/
│
├── ⚙️ [KATEGORI 1: HARDWARE & BACKEND]
│   └── backend/
│       ├── app.py                     # Entry point Flask server, REST API, & smart control loop
│       ├── requirements.txt           # Dependensi Python (flask, flask-cors, gpiozero, rpi-lgpio)
│       ├── hardware/
│       │   ├── gpio_controller.py     # Kontroler 6 Relay: Lampu 1, Lampu 2, Kipas, Pelembab, UV, Motor
│       │   └── hydraulic_controller.py# Kontroler Motor Hidrolik & Limit Switch Proteksi
│       └── sensors/
│           └── dht_sensor.py          # Driver sensor DHT11/DHT22 dengan fallback simulator otomatis
│
├── 🎨 [KATEGORI 2: TAMPILAN & FRONTEND HMI]
│   ├── src/
│   │   ├── api/
│   │   │   └── tetascoApi.js          # Jembatan komunikasi Frontend ke Backend API
│   │   ├── components/
│   │   │   ├── TopAppBar.jsx          # Header status sistem, brand Batik, & tombol KELUAR (F11)
│   │   │   ├── BottomNavBar.jsx       # Navigasi bawah 5 tab ergonomis (HOME, KONTROL, BATCH, KAMERA, PROFIL)
│   │   │   ├── Layout.jsx             # Shell layout pembungkus tampilan
│   │   │   └── AnimalIcons.jsx        # Ikon vektor unggas (Ayam, Bebek, Puyuh, Kalkun, Angsa, Kustom)
│   │   ├── pages/
│   │   │   ├── DasborUtama.jsx        # Dasbor utama: 3 panel sensor + 6 slider kontrol aktuator
│   │   │   ├── KontrolLingkungan.jsx  # Pengaturan Suhu Target & Kelembaban Target per unggas
│   │   │   ├── PemantauanBatch.jsx    # Grafik riwayat telemetri suhu & kelembaban
│   │   │   ├── KameraLangsung.jsx     # Live stream kamera & kontrol PTZ
│   │   │   └── ProfilSistem.jsx       # Profil peternak mandiri, nama farm, kontak, & kapasitas
│   │   ├── App.jsx                    # Root router & listener global tombol F11 untuk tutup kiosk
│   │   ├── index.css                  # Design System Batik Nusantara, tipografi 7" touch, & color tokens
│   │   └── main.jsx                   # React DOM render entry point
│   ├── dist/                          # Bundle produksi React HMI (langsung disajikan offline oleh Flask)
│   ├── index.html                     # HTML Template induk
│   ├── vite.config.js                 # Konfigurasi bundler Vite
│   └── package.json                   # Dependensi frontend React
│
├── 🐧 [KATEGORI 3: SISTEM & DEPLOYMENT RASPBERRY PI]
│   └── scripts/
│       ├── setup_raspberry_pi.sh      # Skrip instalasi otomatis 1-klik untuk Raspberry Pi baru
│       ├── start_tetasco.sh           # Skrip startup utama (menjalankan backend + Chromium kiosk)
│       ├── tetasco-backend.service    # Konfigurasi background daemon systemd
│       └── tetasco-kiosk.desktop      # Autostart autologin session Chromium kiosk mode
│
└── 📐 [KATEGORI 4: DESAIN FISIK & 3D CAD]
    └── cad/
        ├── 3d_model_lemari.blend      # File 3D Blender konstruksi lemari mesin penetas
        └── 3d_model_lemari.blend1     # Backup model 3D CAD
```

---

## 📜 Lisensi & Pengembang

Dikembangkan oleh **[Ryan Putra](https://github.com/RyanPutra1478)**.  
Repositori Resmi: [https://github.com/RyanPutra1478/Penetas-Telur](https://github.com/RyanPutra1478/Penetas-Telur)
