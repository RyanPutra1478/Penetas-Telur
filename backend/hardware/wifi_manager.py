"""
TETASCO CONNECT — NETWORK & WI-FI MANAGER
Mengelola pencarian (scan), pemantauan status, dan penyambungan Wi-Fi
di Raspberry Pi OS menggunakan NetworkManager (nmcli) dengan fallback simulasi.
"""

import subprocess
import shutil
import logging
import socket
import re

logger = logging.getLogger("TetascoWifi")

class WifiManager:
    def __init__(self):
        self.nmcli_available = shutil.which("nmcli") is not None
        # State simulasi jika berjalan di Windows / mesin dev tanpa nmcli
        self.simulated_connected = True
        self.simulated_ssid = "Tetasco-SmartFarm"
        self.simulated_ip = "192.168.1.105"

    def _get_local_ip(self):
        """Mendapatkan alamat IP lokal Raspberry Pi"""
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception:
            return "127.0.0.1"

    def get_status(self):
        """Mendapatkan status koneksi Wi-Fi saat ini"""
        if not self.nmcli_available:
            return {
                "connected": self.simulated_connected,
                "ssid": self.simulated_ssid if self.simulated_connected else None,
                "ip": self.simulated_ip if self.simulated_connected else None,
                "signal": 88 if self.simulated_connected else 0,
                "mode": "simulated"
            }

        try:
            # Jalankan nmcli untuk melihat jaringan yang aktif
            cmd = ["nmcli", "-t", "-f", "IN-USE,SSID,SIGNAL,SECURITY", "dev", "wifi"]
            result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=5)
            
            connected_ssid = None
            signal = 0
            
            if result.returncode == 0:
                for line in result.stdout.strip().splitlines():
                    # Format: *:SSID:SIGNAL:SECURITY
                    parts = line.split(":")
                    if len(parts) >= 3 and parts[0] == "*":
                        connected_ssid = parts[1]
                        try:
                            signal = int(parts[2])
                        except ValueError:
                            signal = 75
                        break

            local_ip = self._get_local_ip()
            return {
                "connected": bool(connected_ssid),
                "ssid": connected_ssid,
                "ip": local_ip if connected_ssid else None,
                "signal": signal,
                "mode": "hardware"
            }
        except Exception as e:
            logger.warning("Gagal membaca status WiFi via nmcli: %s", e)
            return {
                "connected": False,
                "ssid": None,
                "ip": self._get_local_ip(),
                "signal": 0,
                "mode": "hardware",
                "error": str(e)
            }

    def scan_networks(self):
        """Memindai daftar jaringan Wi-Fi yang terjangkau"""
        if not self.nmcli_available:
            # Mock Wi-Fi list untuk testing & simulasi
            return [
                {"ssid": "Tetasco-SmartFarm", "signal": 92, "security": "WPA2", "connected": self.simulated_connected},
                {"ssid": "Kandang-Broiler-01", "signal": 78, "security": "WPA2", "connected": False},
                {"ssid": "Lab-Inkubasi-5G", "signal": 65, "security": "WPA2/WPA3", "connected": False},
                {"ssid": "Hotspot-Teknisi", "signal": 50, "security": "WPA2", "connected": False},
                {"ssid": "Free-Guest-WiFi", "signal": 42, "security": "OPEN", "connected": False},
            ]

        try:
            # Trigger rescan (opsional, non-blocking / abaikan error jika sibuk)
            try:
                subprocess.run(["nmcli", "dev", "wifi", "rescan"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=4)
            except Exception:
                pass

            # Ambil daftar wifi
            cmd = ["nmcli", "-t", "-f", "IN-USE,SSID,SIGNAL,SECURITY", "dev", "wifi", "list"]
            result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=8)
            
            networks = {}
            if result.returncode == 0:
                for line in result.stdout.strip().splitlines():
                    # Format: *:SSID:SIGNAL:SECURITY
                    # Perhatikan kemungkinan SSID memiliki titik dua, jadi split dengan hati-hati atau regex
                    parts = line.split(":")
                    if len(parts) >= 4:
                        in_use = (parts[0] == "*")
                        ssid = parts[1].strip()
                        if not ssid or ssid == "--":
                            continue
                        try:
                            signal = int(parts[2])
                        except ValueError:
                            signal = 50
                        security = parts[3].strip() if parts[3].strip() else "OPEN"

                        # Simpan yang sinyalnya tertinggi jika ada duplikat SSID (mesh / multi-AP)
                        if ssid not in networks or signal > networks[ssid]["signal"] or in_use:
                            networks[ssid] = {
                                "ssid": ssid,
                                "signal": signal,
                                "security": security,
                                "connected": in_use
                            }

            # Urutkan dari sinyal terkuat
            network_list = sorted(networks.values(), key=lambda x: (not x["connected"], -x["signal"]))
            return network_list
        except Exception as e:
            logger.error("Gagal scan WiFi via nmcli: %s", e)
            return []

    def connect(self, ssid, password=None):
        """Menghubungkan Raspberry Pi ke access point Wi-Fi tertentu"""
        if not ssid:
            return {"success": False, "message": "Nama SSID wajib diisi."}

        if not self.nmcli_available:
            self.simulated_connected = True
            self.simulated_ssid = ssid
            return {
                "success": True,
                "message": f"Berhasil terhubung ke '{ssid}' (Simulasi).",
                "ssid": ssid,
                "ip": self.simulated_ip
            }

        try:
            logger.info("Menghubungkan ke Wi-Fi SSID: %s", ssid)
            cmd = ["sudo", "nmcli", "dev", "wifi", "connect", ssid]
            if password:
                cmd.extend(["password", str(password)])

            result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=20)
            output = result.stdout + " " + result.stderr

            if result.returncode == 0 or "successfully activated" in output.lower():
                return {
                    "success": True,
                    "message": f"Berhasil terhubung ke jaringan '{ssid}'.",
                    "ssid": ssid,
                    "ip": self._get_local_ip()
                }
            else:
                logger.warning("Gagal koneksi WiFi: %s", output)
                return {
                    "success": False,
                    "message": output.strip() or "Gagal menghubungkan ke jaringan Wi-Fi."
                }
        except subprocess.TimeoutExpired:
            return {"success": False, "message": "Koneksi timeout. Pastikan password benar dan sinyal memadai."}
        except Exception as e:
            logger.error("Exception saat menghubungkan WiFi: %s", e)
            return {"success": False, "message": str(e)}

    def disconnect(self):
        """Memutus koneksi Wi-Fi saat ini"""
        if not self.nmcli_available:
            self.simulated_connected = False
            self.simulated_ssid = None
            return {"success": True, "message": "Wi-Fi diputus (Simulasi)."}

        try:
            # Cari nama interface wifi (biasanya wlan0)
            subprocess.run(["sudo", "nmcli", "dev", "disconnect", "wlan0"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=5)
            return {"success": True, "message": "Koneksi Wi-Fi berhasil diputus."}
        except Exception as e:
            logger.error("Gagal memutus WiFi: %s", e)
            return {"success": False, "message": str(e)}

wifi_manager = WifiManager()
