# 🥚 OVO-INCUBATOR-PRO — Smart Egg Incubator HMI

> **Industrial Skeuomorphic-Retro Touch Interface** untuk Sistem Inkubator Penetas Telur Pintar berbasis React.js dan Vite, dioptimalkan untuk layar sentuh 7 inci (1024×600) seperti Raspberry Pi Touch Display.

---

## 📸 Preview Tampilan

Antarmuka dirancang dengan gaya **Skeuomorphic-Retro** yang terinspirasi dari instrumen kontrol industri klasik:
- **Base Warna:** Warm Ivory/Cream (`#E8E0D0`) dengan efek bevel fisik (highlight atas, shadow bawah).
- **Display Well:** Panel recessed hitam bergaya CRT/LCD dengan scanlines dan pendaran phosphor hijau (`#39E239`) & cyan (`#50C8FF`).
- **Indikator LED:** Housing LED recessed dengan efek glow luminositas tinggi untuk status aktif, peringatan, dan error.
- **Interaktivitas Tactile:** Tombol terangkat (*raised bevel*), flip toggle switch, dan tombol kontrol yang responsif saat ditekan (*depressed state*).

---

## ✨ Fitur Utama

1. **🏠 Dasbor Utama (Home):**
   - Readout real-time suhu internal (°C) dan kelembaban (% RH).
   - Indikator progres inkubasi batch aktif (Hari X / 21).
   - Tombol kontrol aktuator interaktif: **Pemanas (Heater)**, **Kipas (Fan)**, dan **Pelembab (Humidifier)**.
   - Panel status 8 modul rak inkubator dengan toggle interaktif (ON / OFF / Reset Error).
   - Status bar atas dengan indikator Cloud Sync, Network Link, dan Emergency Stop.

2. **🎛️ Kontrol Lingkungan & Profil Inkubasi (Control):**
   - Integrasi langsung dengan profil spesies telur: **Ayam** (21 hari), **Bebek** (28 hari), **Puyuh** (18 hari), **Kalkun** (28 hari), **Angsa** (30 hari), dan **Kustom**.
   - Saklar mode operasi: **Otomatis (Auto)** vs **Manual**.
   - Penyesuaian target suhu dan kelembaban secara presisi (terkunci otomatis saat mode preset, dapat diubah saat mode manual/kustom).

3. **📊 Pemantauan Batch (Batch Monitoring):**
   - Grafik telemetri suhu dan kelembaban real-time dengan filter rentang waktu (1H, 6H, 24H).
   - Pembacaan sensor multi-zona.

4. **🔄 Kontrol Rak (Rack Tilt System):**
   - Monitoring sudut kemiringan (*tilt angle*) untuk 8 unit rak individual (+45°, 0°, -45°).
   - Kontrol pembalik telur otomatis dan tombol override manual per rak.

5. **📹 Kamera Pemantau (Camera Live Feed):**
   - Multi-cam grid monitoring (6 sudut kamera) untuk memantau kondisi ruang inkubasi secara langsung.
   - Kontrol PTZ (Pan, Tilt, Zoom) dengan D-pad beveled dan tombol Capture / Record.

6. **⚙️ Status Sistem & Alarm (Settings):**
   - Log alarm aktif berdasarkan level keparahan (*Kritis*, *Peringatan*, *Info*) dilengkapi tombol konfirmasi.
   - Indikator kesehatan subsistem: Jaringan Sensor, Aktuator & Motor, serta Koneksi Cloud.
   - Bar pemantau beban CPU sistem.

---

## 🛠️ Tech Stack

- **Framework:** React 19 / Vite
- **Routing:** React Router DOM (HashRouter untuk kompatibilitas stand-alone & file-based embedded)
- **Styling:** Vanilla CSS (Industrial Skeuomorphic Design System)
- **Typography:** JetBrains Mono & Inter
- **Icons:** Material Symbols Outlined

---

## 🚀 Panduan Setup & Instalasi

### 1. Prasyarat
Pastikan komputer / Raspberry Pi Anda sudah terinstal:
- **Node.js** (versi 18 ke atas disarankan)
- **npm** atau **yarn** / **pnpm**
- **Git**

Cek versi Node.js dan npm:
```bash
node -v
npm -v
```

---

### 2. Kloning Repositori
```bash
git clone https://github.com/RyanPutra1478/Penetas-Telur.git
cd Penetas-Telur
```

---

### 3. Instal Dependensi
```bash
npm install
```

---

### 4. Menjalankan di Mode Development
Jalankan dev server lokal:
```bash
npm run dev
```
Buka browser di: **`http://localhost:5173`**

Untuk mengakses dari perangkat lain di jaringan lokal yang sama (misal dari Raspberry Pi atau tablet):
```bash
npm run dev -- --host
```

---

### 5. Build untuk Produksi
Untuk meng-compile file siap deploy:
```bash
npm run build
```
Hasil build akan tersimpan di folder `dist/`.

Uji coba hasil build lokal:
```bash
npm run preview
```

---

### 6. Menjalankan di Raspberry Pi (Kiosk Mode)
Jika ingin menjalankan antarmuka ini pada Raspberry Pi OS dengan Chromium Kiosk Mode otomatis:
```bash
chromium-browser --noerrdialogs --disable-infobars --kiosk http://localhost:5173
```

---

## 📁 Struktur Direktori

```text
Penetas-Telur/
├── public/                 # File aset statis
├── src/
│   ├── components/         # Komponen UI modular
│   │   ├── BottomNavBar.jsx  # Control strip navigasi bawah
│   │   ├── Layout.jsx        # Layout shell utama
│   │   └── TopAppBar.jsx     # Header plat merek & status atas
│   ├── pages/              # Halaman HMI
│   │   ├── DasborUtama.jsx       # Dasbor Utama (Home)
│   │   ├── KontrolLingkungan.jsx # Kontrol & Profil Inkubasi
│   │   ├── PemantauanBatch.jsx   # Telemetri & Grafik
│   │   ├── KontrolRak.jsx        # Kontrol Tilt Rak
│   │   ├── KameraLangsung.jsx    # Live Camera & PTZ
│   │   └── StatusSistem.jsx      # Alarm & Status Sistem
│   ├── App.jsx             # Konfigurasi router & halaman
│   ├── index.css           # Sistem desain skeuomorphic-retro CSS
│   └── main.jsx            # Entry point aplikasi
├── index.html              # HTML Shell
├── package.json            # Daftar dependensi & scripts
├── vite.config.js          # Konfigurasi Vite bundler
└── README.md               # Dokumentasi proyek
```

---

## 📜 Lisensi

Proyek ini dibuat untuk keperluan monitoring dan kontrol inkubator telur industri.
Dikembangkan oleh **[Ryan Putra](https://github.com/RyanPutra1478)**.
