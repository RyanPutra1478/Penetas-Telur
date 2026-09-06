# 🥚 OVO-INCUBATOR-PRO — Smart Egg Incubator HMI

> **Modern Colorful Touchscreen Interface** untuk Sistem Inkubator Penetas Telur Pintar berbasis React 19 & Vite, dirancang khusus dan dioptimalkan untuk layar sentuh 7 inci (1024×600) seperti Raspberry Pi Touch Display.

---

## ✨ Tampilan & Desain Baru (Colorful & Vibrant)

Antarmuka telah dirombak total menggunakan gaya modern, bersih, cerah, dan penuh warna (*vibrant color-coded system*):
- **Identitas Warna per Aktuator & Parameter:**
  - 🟠 **Pemanas (Heater):** Gradien oranye-merah menyala dengan slider toggle kontras tinggi.
  - 🔵 **Sirkulasi Kipas (Fan):** Gradien biru cerah.
  - 🟢 **Pelembab Udara (Humidifier):** Gradien emerald-teal segar.
  - 🟣 **Pembalik Rak (Tilt System):** Gradien ungu cerah dengan animasi putar real-time saat bergerak.
  - 🌿 **Batch Aktif:** Panel hijau dominan dengan progress bar dinamis dan ikon grafis besar.
- **Konsistensi Layout Tactile:**
  - Seluruh tombol slider diposisikan seragam di sudut kiri bawah kartu.
  - Indikator status teks kontras (`AKTIF` / `MATI`, `BERGERAK` / `DIAM`).
  - Top Bar tinggi (84px) dengan tombol status Cloud Sync, Network Link, dan Alarm.
  - Bottom Navigation Bar dengan 5 menu utama yang ergonomis untuk navigasi jempol pada layar sentuh.

---

## 🧭 Menu & Fitur Utama

1. **🏠 Dasbor Utama (Home):**
   - Telemetri cepat: Suhu Internal (°C), Kelembaban (% RH), dan Kartu Batch Aktif yang mendominasi.
   - 4 Kontrol Aktuator Utama berbasis Slider Toggle: **Pemanas**, **Sirkulasi Kipas**, **Pelembab Udara**, dan **Pembalik Rak** (kontrol 1 tombol untuk seluruh rak).

2. **🎛️ Kontrol Lingkungan & Preset Spesies (Kontrol):**
   - Preset profil telur terintegrasi: **Ayam** (21 hari), **Bebek** (28 hari), **Puyuh** (18 hari), **Kalkun** (28 hari), **Angsa** (30 hari), serta mode **Kustom**.
   - Saklar mode operasi **Otomatis (Auto)** vs **Manual**.
   - Penyetelan target suhu (°C) dan kelembaban (% RH) dengan tombol plus/minus presisi tinggi.

3. **📊 Pemantauan Batch (Batch):**
   - Grafik telemetri suhu dan kelembaban interaktif.
   - Filter rentang waktu: 1 Jam, 6 Jam, dan 24 Jam.
   - Status pemantauan zona inkubator.

4. **📹 Kamera Langsung (Kamera):**
   - Single camera live viewport (1080p feed) dengan badge live dan OSD telemetri real-time.
   - Panel kontrol navigasi PTZ (Pan, Tilt, Zoom) yang diperlebar: D-pad arah, kontrol zoom in/out, tombol Capture foto, dan Record video.

5. **👤 Profil Peternak & Kesehatan Sistem (Profil):**
   - Informasi profil peternak interaktif (Nama Peternak, Nama Farm, Nomor Telepon, Lokasi, Kapasitas Telur) yang dapat diedit langsung.
   - Pemantauan kesehatan subsistem: Jaringan Sensor, Aktuator & Motor, Koneksi Cloud, dan CPU/MCU load.
   - Log alarm aktif dengan severity badge (*Kritis*, *Peringatan*).

---

## 🛠️ Tech Stack

- **Framework:** React 19 / Vite 6
- **Routing:** React Router DOM (HashRouter untuk kompatibilitas stand-alone & file-based embedded)
- **Styling:** Modern Vanilla CSS + Glassmorphism accents
- **Typography:** JetBrains Mono & Inter
- **Icons:** Google Material Symbols Rounded

---

## 🚀 Panduan Setup & Instalasi

### 1. Prasyarat Sistem
Pastikan telah menginstal:
- **Node.js** (v18.x atau yang lebih baru)
- **npm** (atau pnpm / yarn)
- **Git**

Verifikasi instalasi di terminal:
```bash
node -v
npm -v
git -v
```

---

### 2. Kloning Repositori
```bash
git clone https://github.com/RyanPutra1478/Penetas-Telur.git
cd Penetas-Telur
```

---

### 3. Instalasi Dependensi
```bash
npm install
```

---

### 4. Menjalankan di Mode Development
Jalankan development server:
```bash
npm run dev
```
Buka browser di alamat:
```
http://localhost:5173
```
> **Catatan untuk Windows PowerShell:** Jika menemui kendala script execution policy, gunakan `npm.cmd run dev`.

Untuk membuka akses bagi perangkat lain di jaringan lokal yang sama (misal Raspberry Pi atau tablet):
```bash
npm run dev -- --host
```

---

### 5. Kompilasi Produksi (Production Build)
Untuk membuat file bundle produksi:
```bash
npm run build
```
Hasil build siap saji akan dibuat di folder `dist/`.

Uji pratinjau hasil build secara lokal:
```bash
npm run preview
```

---

### 6. Menjalankan Kiosk Mode di Raspberry Pi (Layar 7 Inci)
Untuk menjalankan otomatis dalam mode Kiosk layar penuh pada Raspberry Pi OS:
```bash
chromium-browser --noerrdialogs --disable-infobars --kiosk http://localhost:5173
```

---

## 📁 Struktur Direktori

```text
Penetas-Telur/
├── public/                     # Aset statis (ikon, gambar)
├── src/
│   ├── components/             # Komponen UI
│   │   ├── BottomNavBar.jsx    # Navigasi bawah 5 tab (Home, Kontrol, Batch, Kamera, Profil)
│   │   ├── Layout.jsx          # Wrapper layout utama
│   │   └── TopAppBar.jsx       # Header 84px dengan status Cloud, Network, Alarm
│   ├── pages/                  # Halaman aplikasi
│   │   ├── DasborUtama.jsx     # Dasbor kontrol utama & 4 slider aktuator
│   │   ├── KontrolLingkungan.jsx # Kontrol suhu, kelembaban & profil spesies
│   │   ├── PemantauanBatch.jsx # Grafik telemetri & monitoring batch
│   │   ├── KameraLangsung.jsx  # Single camera feed & kontrol navigasi PTZ
│   │   └── ProfilSistem.jsx    # Profil peternak & kesehatan sistem / alarm
│   ├── App.jsx                 # Routing & konfigurasi halaman
│   ├── index.css               # Desain sistem CSS modern & colorful
│   └── main.jsx                # Entry point aplikasi
├── index.html                  # HTML template
├── package.json                # Dependensi & konfigurasi skrip
├── vite.config.js              # Konfigurasi bundler Vite
└── README.md                   # Dokumentasi proyek & setup
```

---

## 📜 Pengembang

Dikembangkan oleh **[Ryan Putra](https://github.com/RyanPutra1478)**.  
Repositori Resmi: [https://github.com/RyanPutra1478/Penetas-Telur](https://github.com/RyanPutra1478/Penetas-Telur)
