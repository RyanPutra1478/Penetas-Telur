#!/bin/bash
# ==============================================================================
# TETASCO CONNECT — SKRIP INSTALASI OTOMATIS RASPBERRY PI 4
# Setup Lingkungan Standalone: GPIO, Backend, Build React, & Auto-Kiosk
# ==============================================================================

set -e

echo "=========================================================="
echo "🥚 MEMULAI SETUP OTOMATIS TETASCO CONNECT DI RASPBERRY PI"
echo "=========================================================="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
CURRENT_USER=$(whoami)

echo "Pengguna saat ini: $CURRENT_USER"
echo "Direktori Proyek: $PROJECT_DIR"

# 1. Update paket sistem & install dependensi penting
echo ""
echo "[1/6] Menginstal dependensi sistem (Python, Chromium, Unclutter)..."
sudo apt-get update -y
sudo apt-get install -y python3 python3-pip python3-venv python3-gpiozero python3-rpi.gpio unclutter chromium-browser curl

# Cek Node.js & npm (hanya jika bundle dist belum ada)
if [ ! -d "$PROJECT_DIR/dist" ] && ! command -v npm >/dev/null 2>&1; then
    echo "Menginstal Node.js & npm..."
    sudo apt-get install -y nodejs npm
fi

# 2. Memberikan izin GPIO untuk pengguna saat ini
echo ""
echo "[2/6] Memverifikasi izin akses GPIO..."
sudo usermod -a -G gpio,dialout "$CURRENT_USER" || true

# 3. Setup Python Backend Dependencies
echo ""
echo "[3/6] Menginstal library Python backend..."
cd "$PROJECT_DIR"
python3 -m pip install -r backend/requirements.txt --break-system-packages || python3 -m pip install -r backend/requirements.txt

# 4. Verifikasi Bundle Frontend React HMI untuk Produksi Offline
echo ""
echo "[4/6] Memeriksa bundle React HMI produksi..."
cd "$PROJECT_DIR"
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    echo "✅ Bundle produksi dist/ sudah tersedia dan siap disajikan langsung oleh backend!"
elif [ -f "package.json" ]; then
    echo "Membangun (build) React HMI produksi..."
    if ! command -v npm >/dev/null 2>&1; then
        sudo apt-get install -y nodejs npm
    fi
    if [ ! -d "node_modules" ]; then
        npm install
    fi
    npm run build
    echo "Build selesai! Asset produksi tersimpan di direktori dist/"
else
    echo "⚠️ Folder dist/ belum ditemukan. Pastikan bundle dist/ telah disertakan."
fi

# 5. Konfigurasi Izin Eksekusi Skrip
echo ""
echo "[5/6] Mengatur izin eksekusi skrip..."
chmod +x "$PROJECT_DIR/scripts/start_tetasco.sh"
chmod +x "$PROJECT_DIR/scripts/setup_raspberry_pi.sh"

# 6. Konfigurasi Autostart Kiosk Display
echo ""
echo "[6/6] Mengonfigurasi Autostart Kiosk Touchscreen..."
AUTOSTART_DIR="/home/$CURRENT_USER/.config/autostart"
mkdir -p "$AUTOSTART_DIR"

# Perbarui path di file desktop autostart agar sesuai user saat ini
sed -i "s|/home/pi/Penetas-Telur|$PROJECT_DIR|g" "$PROJECT_DIR/scripts/tetasco-kiosk.desktop"
cp "$PROJECT_DIR/scripts/tetasco-kiosk.desktop" "$AUTOSTART_DIR/tetasco.desktop"

echo ""
echo "=========================================================="
echo "✅ INSTALASI SELESAI DENGAN SUKSES!"
echo "=========================================================="
echo "Semua komponen Tetasco Connect siap dijalankan di Raspberry Pi."
echo ""
echo "Pilihan untuk menjalankan:"
echo "1. Uji langsung sekarang:"
echo "   bash $PROJECT_DIR/scripts/start_tetasco.sh"
echo ""
echo "2. Atau cukup REBOOT Raspberry Pi:"
echo "   sudo reboot"
echo "   (Sistem akan langsung membuka HMI Kiosk di layar 7 inci secara otomatis tanpa internet!)"
echo "=========================================================="
