#!/bin/bash
# ==============================================================================
# TETASCO CONNECT — SCRIPT STARTUP UTAMA RASPBERRY PI 4
# Menjalankan Backend Flask GPIO & Chromium Kiosk Mode (Offline 100%)
# ==============================================================================

# Dapatkan path absolut proyek
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR" || exit 1

echo "=========================================================="
echo "🥚 MEMULAI TETASCO CONNECT (MODE STANDALONE OFFLINE)"
echo "Direktori Proyek: $PROJECT_DIR"
echo "=========================================================="

# Matikan screen saver dan powersave layar LCD 7"
xset s off 2>/dev/null
xset -dpms 2>/dev/null
xset s noblank 2>/dev/null

# Sembunyikan kursor mouse saat tidak disentuh (unclutter)
if command -v unclutter >/dev/null 2>&1; then
    unclutter -idle 1 -root &
fi

# 1. Pastikan virtual environment atau python backend aktif
if [ -d "$PROJECT_DIR/venv" ]; then
    source "$PROJECT_DIR/venv/bin/activate"
fi

# 2. Cek apakah backend sudah berjalan, jika belum jalankan di background
if ! curl -s http://127.0.0.1:5001/api/health >/dev/null 2>&1; then
    echo "[1/2] Menyalakan Backend Flask GPIO pada port 5001..."
    python3 "$PROJECT_DIR/backend/app.py" > /tmp/tetasco_backend.log 2>&1 &
    BACKEND_PID=$!
    echo "Backend PID: $BACKEND_PID"

    # Tunggu hingga backend merespons (maksimal 15 detik)
    for i in {1..15}; do
        if curl -s http://127.0.0.1:5001/api/health >/dev/null 2>&1; then
            echo "Backend siap dan online!"
            break
        fi
        sleep 1
    done
else
    echo "[1/2] Backend sudah berjalan sebelumnya."
fi

# 3. Jalankan Chromium dalam Mode Kiosk Fullscreen Layar Sentuh 7 Inci (1024x600)
echo "[2/2] Membuka HMI Tetasco Connect di Layar Touchscreen..."
CHROMIUM_BIN="chromium-browser"
if ! command -v chromium-browser >/dev/null 2>&1; then
    CHROMIUM_BIN="chromium"
fi

# Reset status crash agar tidak muncul popup "Restore pages"
sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' ~/.config/chromium/Default/Preferences 2>/dev/null || true
sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' ~/.config/chromium/Default/Preferences 2>/dev/null || true
sed -i 's/"exit_type":"Crashed"/"exit_type":"Normal"/' ~/.config/chromium/"Profile 1"/Preferences 2>/dev/null || true
sed -i 's/"exited_cleanly":false/"exited_cleanly":true/' ~/.config/chromium/"Profile 1"/Preferences 2>/dev/null || true

$CHROMIUM_BIN \
    --kiosk \
    --start-fullscreen \
    --password-store=basic \
    --noerrdialogs \
    --disable-infobars \
    --no-first-run \
    --fast \
    --fast-start \
    --disable-translate \
    --disable-pinch \
    --overscroll-history-navigation=0 \
    --touch-events=enabled \
    --check-for-update-interval=31536000 \
    --window-size=1024,600 \
    --window-position=0,0 \
    http://127.0.0.1:5001

