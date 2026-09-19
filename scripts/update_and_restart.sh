#!/bin/bash
# ==============================================================================
# TETASCO CONNECT — SCRIPT UPDATE OTOMATIS & RESTART BACKEND
# Menjalankan git pull, cek dependensi, dan restart backend dalam 1 perintah.
# Penggunaan: ./scripts/update_and_restart.sh
# ==============================================================================

set -e

# Dapatkan direktori proyek
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo "=========================================================="
echo "🔄 MEMULAI UPDATE TETASCO CONNECT..."
echo "Direktori: $PROJECT_DIR"
echo "=========================================================="

# 1. Bersihkan perubahan lokal otomatis dan sinkronkan dengan branch remote
echo "[1/4] Mengambil pembaruan terbaru dari GitHub..."
git fetch origin
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "release")
git checkout -- . 2>/dev/null || true
git reset --hard "origin/$CURRENT_BRANCH" 2>/dev/null || git pull --rebase || git pull

# 2. Periksa & pasang dependensi python jika ada pembaruan
echo "[2/4] Memeriksa dependensi Python (requirements.txt)..."
if [ -f "backend/requirements.txt" ]; then
    pip3 install -r backend/requirements.txt --break-system-packages >/dev/null 2>&1 || pip install -r backend/requirements.txt >/dev/null 2>&1 || true
fi

# 3. Restart Backend Server
echo "[3/4] Me-restart Backend Tetasco..."

# Cek apakah menggunakan systemd service
if systemctl is-active --quiet tetasco-backend 2>/dev/null; then
    echo " -> Me-restart via systemd (tetasco-backend.service)..."
    sudo systemctl restart tetasco-backend
else
    # Jika dijalankan manual, matikan proses lama dan jalankan ulang
    echo " -> Me-restart proses Python manual..."
    pkill -f "python3.*backend/app.py" 2>/dev/null || true
    sleep 1
    nohup python3 backend/app.py > /tmp/tetasco_backend.log 2>&1 &
fi

# 4. Verifikasi apakah backend sudah kembali online
echo "[4/4] Memverifikasi status kesehatan backend..."
sleep 2

ONLINE=false
for i in {1..10}; do
    if curl -s http://127.0.0.1:5001/api/health >/dev/null 2>&1; then
        ONLINE=true
        break
    fi
    sleep 1
done

echo "=========================================================="
if [ "$ONLINE" = true ]; then
    echo "✅ SUKSES! Backend Tetasco telah diperbarui & aktif kembali."
    echo "📡 Silakan refresh browser HMI untuk melihat perubahan."
else
    echo "⚠️ Backend belum merespons dalam 10 detik. Cek log di /tmp/tetasco_backend.log"
fi
echo "=========================================================="
