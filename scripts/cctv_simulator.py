"""
CCTV Simulator untuk Pengujian Kamera Penetas Telur Tetasco
Menjalankan HTTP MJPEG stream (port 8080) dari Webcam Laptop
atau dummy frame telur jika webcam tidak tersedia.
"""

import cv2
import time
import numpy as np
from flask import Flask, Response

app = Flask(__name__)

# Coba buka webcam default (indeks 0)
cap = cv2.VideoCapture(0)
use_webcam = cap.isOpened()

if use_webcam:
    print("✅ Webcam laptop terdeteksi! Menggunakan feed webcam.")
else:
    print("⚠️ Webcam tidak terdeteksi. Menggunakan simulasi grafis rak telur.")

def generate_dummy_frame(angle_offset):
    """Membuat frame simulasi rak inkubator dengan telur"""
    img = np.zeros((480, 640, 3), dtype=np.uint8)
    img[:] = (20, 25, 35) # Dark incubator ambient

    # Header OSD
    cv2.putText(img, "TETASCO CCTV SIMULATOR - RAK ZONA A", (20, 35),
                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 120), 2)
    timestamp = time.strftime("%Y-%m-%d %H:%M:%S")
    cv2.putText(img, timestamp, (20, 65),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)

    # Grid Rak Telur
    center_x, center_y = 320, 260
    tilt = int(15 * np.sin(angle_offset))
    
    # Gambar nampan rak
    cv2.rectangle(img, (120, 150 + tilt), (520, 370 + tilt), (60, 70, 90), 3)
    
    # Gambar baris telur
    for row in range(3):
        for col in range(5):
            ex = 170 + col * 75
            ey = 190 + row * 65 + tilt
            cv2.ellipse(img, (ex, ey), (22, 28), 0, 0, 360, (180, 215, 240), -1)
            cv2.ellipse(img, (ex, ey), (22, 28), 0, 0, 360, (130, 160, 180), 2)

    # Info status
    cv2.putText(img, f"TILT MOTOR: {tilt:+03d} deg", (20, 430),
                cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 200, 255), 2)
    cv2.putText(img, "STATUS: SIMULATED CCTV FEED", (20, 460),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (100, 255, 100), 1)

    _, jpeg = cv2.imencode('.jpg', img)
    return jpeg.tobytes()

def gen_frames():
    angle = 0.0
    while True:
        if use_webcam:
            success, frame = cap.read()
            if not success:
                # Fallback dummy jika webcam terputus
                frame_bytes = generate_dummy_frame(angle)
            else:
                # Tambahkan OSD watermark di webcam
                ts = time.strftime("%Y-%m-%d %H:%M:%S")
                cv2.putText(frame, f"TETASCO CAM-01 [LIVE] | {ts}", (15, 30),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                _, jpeg = cv2.imencode('.jpg', frame)
                frame_bytes = jpeg.tobytes()
        else:
            angle += 0.05
            frame_bytes = generate_dummy_frame(angle)
            time.sleep(0.04)

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame_bytes + b'\r\n')

@app.route('/')
def index():
    return """
    <html>
      <head><title>Tetasco CCTV Simulator</title></head>
      <body style="background:#111;color:#fff;text-align:center;font-family:sans-serif;">
        <h2>🎥 Tetasco CCTV Simulator Feed</h2>
        <p>Stream URL: <code>/video_feed</code></p>
        <img src="/video_feed" style="border:2px solid #00ff88;border-radius:8px;max-width:90%;"/>
      </body>
    </html>
    """

@app.route('/video_feed')
def video_feed():
    """MJPEG Stream endpoint standar yang kompatibel dengan browser & dashboard"""
    return Response(gen_frames(),
                    mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == '__main__':
    print("=========================================================")
    print("🎥 CCTV SIMULATOR AKTIF!")
    print("Akses lokal: http://127.0.0.1:8080/video_feed")
    print("Akses jaringan LAN (dari Raspberry Pi): http://192.168.1.44:8080/video_feed")
    print("=========================================================")
    app.run(host='0.0.0.0', port=8080, threaded=True)
