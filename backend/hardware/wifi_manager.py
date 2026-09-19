"""
TETASCO CONNECT — NETWORK & WI-FI MANAGER (ROBUST MULTI-BACKEND)
Mendukung Raspberry Pi OS versi modern (NetworkManager / nmcli)
serta versi standar (wpa_supplicant / iwlist / iwgetid / raspi-config),
dengan fallback otomatis simulasi di Windows/development.
"""

import os
import re
import socket
import shutil
import logging
import subprocess

logger = logging.getLogger("TetascoWifi")

class WifiManager:
    def __init__(self):
        self.is_linux = os.name != 'nt' and hasattr(os, 'uname')
        self.simulated_connected = True
        self.simulated_ssid = "Tetasco-SmartFarm"
        self.simulated_ip = "192.168.1.105"

    def _get_wireless_interface(self):
        """Mencari nama interface Wi-Fi di Raspberry Pi (wlan0, wlan1, dll)"""
        if not self.is_linux:
            return "wlan0"
        
        # Cek interface di /sys/class/net/
        sys_net = "/sys/class/net"
        if os.path.exists(sys_net):
            for iface in os.listdir(sys_net):
                if os.path.exists(os.path.join(sys_net, iface, "wireless")):
                    return iface
                if iface.startswith("wlan") or iface.startswith("wifi"):
                    return iface

        return "wlan0"

    def _get_local_ip(self):
        """Mendapatkan IP lokal aktif"""
        # Coba koneksi UDP ke DNS publik tanpa kirim paket
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            if ip and not ip.startswith("127."):
                return ip
        except Exception:
            pass

        # Coba baca via command hostname -I di Linux
        if self.is_linux:
            try:
                res = subprocess.run(["hostname", "-I"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=2)
                if res.returncode == 0:
                    ips = res.stdout.strip().split()
                    if ips:
                        return ips[0]
            except Exception:
                pass

        return "127.0.0.1"

    def _get_current_ssid(self):
        """Mendeteksi SSID Wi-Fi yang sedang terhubung menggunakan berbagai cara"""
        if not self.is_linux:
            return self.simulated_ssid if self.simulated_connected else None

        iface = self._get_wireless_interface()

        # Cara 1: iwgetid (sangat cepat & handal di semua distro Linux/Raspbian)
        try:
            res = subprocess.run(["iwgetid", "-r"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=2)
            if res.returncode == 0 and res.stdout.strip():
                return res.stdout.strip()
        except Exception:
            pass

        # Cara 2: iwconfig
        try:
            res = subprocess.run(["iwconfig", iface], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=2)
            if res.returncode == 0:
                match = re.search(r'ESSID:"([^"]+)"', res.stdout)
                if match and match.group(1) and match.group(1) != "off/any":
                    return match.group(1)
        except Exception:
            pass

        # Cara 3: nmcli (jika NetworkManager aktif)
        try:
            res = subprocess.run(["nmcli", "-t", "-f", "IN-USE,SSID", "dev", "wifi"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=3)
            if res.returncode == 0:
                for line in res.stdout.splitlines():
                    if line.startswith("*:"):
                        ssid = line.split(":", 1)[1].strip()
                        if ssid:
                            return ssid
        except Exception:
            pass

        # Cara 4: wpa_cli status
        try:
            res = subprocess.run(["wpa_cli", "-i", iface, "status"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=2)
            if res.returncode == 0:
                for line in res.stdout.splitlines():
                    if line.startswith("ssid="):
                        return line.split("=", 1)[1].strip()
        except Exception:
            pass

        return None

    def _get_signal_strength(self, iface):
        """Membaca kekuatan sinyal Wi-Fi dari /proc/net/wireless atau iwconfig"""
        if not self.is_linux:
            return 85

        try:
            if os.path.exists("/proc/net/wireless"):
                with open("/proc/net/wireless", "r") as f:
                    lines = f.readlines()
                    for line in lines[2:]:
                        parts = line.split()
                        if len(parts) >= 3:
                            # Link quality (misal 56.)
                            qual = parts[2].replace('.', '')
                            try:
                                val = int(qual)
                                # Biasanya bernilai 0 - 70 di wireless extensions
                                return min(100, int((val / 70.0) * 100))
                            except ValueError:
                                pass
        except Exception:
            pass

        return 75

    def get_status(self):
        """Mengambil status koneksi Wi-Fi & Jaringan saat ini"""
        if not self.is_linux:
            return {
                "connected": self.simulated_connected,
                "ssid": self.simulated_ssid if self.simulated_connected else None,
                "ip": self.simulated_ip if self.simulated_connected else None,
                "signal": 88 if self.simulated_connected else 0,
                "mode": "simulated"
            }

        iface = self._get_wireless_interface()
        current_ssid = self._get_current_ssid()
        local_ip = self._get_local_ip()
        has_network = bool(local_ip and not local_ip.startswith("127."))
        signal = self._get_signal_strength(iface) if current_ssid else 0

        # Jika ada koneksi IP tetapi SSID Wi-Fi tidak terdeteksi (misal via Ethernet LAN)
        if not current_ssid and has_network:
            # Cek apakah ethernet eth0 / end0 memiliki IP
            current_ssid = "Kabel LAN (Ethernet)"
            signal = 100

        is_connected = bool(current_ssid or has_network)

        return {
            "connected": is_connected,
            "ssid": current_ssid if is_connected else None,
            "ip": local_ip if is_connected else None,
            "signal": signal if is_connected else 0,
            "interface": iface,
            "mode": "hardware"
        }

    def _scan_via_nmcli(self):
        """Memindai menggunakan nmcli (NetworkManager)"""
        networks = {}
        try:
            cmd = ["nmcli", "-t", "-f", "IN-USE,SSID,SIGNAL,SECURITY", "dev", "wifi", "list"]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=8)
            if res.returncode == 0 and res.stdout.strip():
                for line in res.stdout.strip().splitlines():
                    # Format: *:SSID:SIGNAL:SECURITY
                    # Gunakan regex agar toleran jika nama SSID memuat karakter titik dua
                    match = re.match(r'^([\* ]?):(.*):(\d+):(.*)$', line)
                    if match:
                        in_use = (match.group(1).strip() == "*")
                        ssid = match.group(2).strip().replace(r'\:', ':')
                        try:
                            signal = int(match.group(3))
                        except ValueError:
                            signal = 50
                        security = match.group(4).strip() or "OPEN"

                        if ssid and ssid != "--":
                            if ssid not in networks or signal > networks[ssid]["signal"] or in_use:
                                networks[ssid] = {
                                    "ssid": ssid,
                                    "signal": signal,
                                    "security": security,
                                    "connected": in_use
                                }
        except Exception as e:
            logger.debug("Scan nmcli error: %s", e)
        return list(networks.values())

    def _scan_via_iwlist(self, iface):
        """Memindai menggunakan iwlist wlan0 scan (kompatibel universal di semua Linux)"""
        networks = {}
        try:
            cmd = ["sudo", "iwlist", iface, "scan"]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=10)
            if res.returncode == 0 and res.stdout:
                # Pisahkan per Cell
                cells = res.stdout.split("Cell ")
                for cell in cells[1:]:
                    # Ambil ESSID
                    ssid_match = re.search(r'ESSID:"([^"]+)"', cell)
                    if not ssid_match:
                        continue
                    ssid = ssid_match.group(1).strip()
                    if not ssid:
                        continue

                    # Ambil Signal Quality
                    signal = 60
                    qual_match = re.search(r'Quality=(\d+)/(\d+)', cell)
                    if qual_match:
                        try:
                            num = int(qual_match.group(1))
                            den = int(qual_match.group(2))
                            signal = min(100, int((num / den) * 100))
                        except Exception:
                            pass
                    else:
                        sig_match = re.search(r'Signal level=(-?\d+)', cell)
                        if sig_match:
                            try:
                                dbm = int(sig_match.group(1))
                                # Konversi dBm (-100 s.d -50) ke persen (0-100%)
                                signal = max(0, min(100, 2 * (dbm + 100)))
                            except Exception:
                                pass

                    # Ambil Security
                    security = "OPEN"
                    if "WPA2" in cell:
                        security = "WPA2"
                    elif "WPA" in cell:
                        security = "WPA"
                    elif "Encryption key:on" in cell:
                        security = "WEP"

                    if ssid not in networks or signal > networks[ssid]["signal"]:
                        networks[ssid] = {
                            "ssid": ssid,
                            "signal": signal,
                            "security": security,
                            "connected": False
                        }
        except Exception as e:
            logger.debug("Scan iwlist error: %s", e)
        return list(networks.values())

    def _scan_via_wpa_cli(self, iface):
        """Memindai menggunakan wpa_cli (kompatibel dengan wpa_supplicant)"""
        networks = {}
        try:
            subprocess.run(["sudo", "wpa_cli", "-i", iface, "scan"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=4)
            res = subprocess.run(["sudo", "wpa_cli", "-i", iface, "scan_results"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=4)
            if res.returncode == 0 and res.stdout:
                lines = res.stdout.strip().splitlines()
                # Baris pertama biasanya header: bssid / frequency / signal level / flags / ssid
                for line in lines[1:]:
                    parts = line.split("\t")
                    if len(parts) >= 5:
                        signal_dbm = parts[2].strip()
                        flags = parts[3].strip()
                        ssid = parts[4].strip()
                        if not ssid:
                            continue

                        try:
                            dbm = int(signal_dbm)
                            signal = max(0, min(100, 2 * (dbm + 100)))
                        except ValueError:
                            signal = 55

                        security = "OPEN"
                        if "WPA2" in flags:
                            security = "WPA2"
                        elif "WPA" in flags:
                            security = "WPA"

                        if ssid not in networks or signal > networks[ssid]["signal"]:
                            networks[ssid] = {
                                "ssid": ssid,
                                "signal": signal,
                                "security": security,
                                "connected": False
                            }
        except Exception as e:
            logger.debug("Scan wpa_cli error: %s", e)
        return list(networks.values())

    def scan_networks(self):
        """Memindai jaringan Wi-Fi sekitar dengan fallback bertingkat"""
        if not self.is_linux:
            return [
                {"ssid": "Tetasco-SmartFarm", "signal": 92, "security": "WPA2", "connected": self.simulated_connected},
                {"ssid": "Kandang-Broiler-01", "signal": 78, "security": "WPA2", "connected": False},
                {"ssid": "Lab-Inkubasi-5G", "signal": 65, "security": "WPA2/WPA3", "connected": False},
                {"ssid": "Hotspot-Teknisi", "signal": 50, "security": "WPA2", "connected": False},
                {"ssid": "Free-Guest-WiFi", "signal": 42, "security": "OPEN", "connected": False},
            ]

        iface = self._get_wireless_interface()
        current_ssid = self._get_current_ssid()

        # 1. Coba nmcli
        net_list = self._scan_via_nmcli()

        # 2. Jika nmcli tidak menghasilkan apa-apa, coba iwlist
        if not net_list:
            net_list = self._scan_via_iwlist(iface)

        # 3. Jika masih kosong, coba wpa_cli
        if not net_list:
            net_list = self._scan_via_wpa_cli(iface)

        # Ubah list ke map untuk menandai status connected
        net_map = {n["ssid"]: n for n in net_list}

        # Pastikan SSID yang sedang terhubung selalu ADA dalam daftar
        if current_ssid and current_ssid != "Kabel LAN (Ethernet)":
            if current_ssid in net_map:
                net_map[current_ssid]["connected"] = True
            else:
                net_map[current_ssid] = {
                    "ssid": current_ssid,
                    "signal": self._get_signal_strength(iface),
                    "security": "WPA2",
                    "connected": True
                }

        # Urutkan: jaringan yang sedang terhubung paling atas, disusul sinyal terkuat
        result = sorted(net_map.values(), key=lambda x: (not x.get("connected", False), -x.get("signal", 0)))
        return result

    def connect(self, ssid, password=None):
        """Menghubungkan ke Wi-Fi dengan nmcli, raspi-config, atau wpa_cli"""
        if not ssid:
            return {"success": False, "message": "Nama SSID wajib diisi."}

        if not self.is_linux:
            self.simulated_connected = True
            self.simulated_ssid = ssid
            return {
                "success": True,
                "message": f"Berhasil terhubung ke '{ssid}' (Simulasi).",
                "ssid": ssid,
                "ip": self.simulated_ip
            }

        logger.info("Menghubungkan ke Wi-Fi '%s'...", ssid)

        # Percobaan 1: Menggunakan nmcli jika NetworkManager tersedia
        try:
            cmd = ["sudo", "nmcli", "dev", "wifi", "connect", ssid]
            if password:
                cmd.extend(["password", str(password)])
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=25)
            out = res.stdout + " " + res.stderr
            if res.returncode == 0 or "successfully activated" in out.lower():
                return {
                    "success": True,
                    "message": f"Berhasil terhubung ke jaringan '{ssid}'.",
                    "ssid": ssid,
                    "ip": self._get_local_ip()
                }
        except Exception as e:
            logger.warning("Koneksi via nmcli gagal: %s", e)

        # Percobaan 2: Menggunakan raspi-config bawaan resmi Raspberry Pi OS
        try:
            pass_arg = str(password) if password else ""
            cmd = ["sudo", "raspi-config", "nonint", "do_wifi_ssid_passphrase", ssid, pass_arg]
            res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=20)
            if res.returncode == 0:
                # Reload Wi-Fi interface
                iface = self._get_wireless_interface()
                subprocess.run(["sudo", "wpa_cli", "-i", iface, "reconfigure"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=5)
                return {
                    "success": True,
                    "message": f"Kredensial Wi-Fi '{ssid}' berhasil diterapkan ke Raspberry Pi.",
                    "ssid": ssid,
                    "ip": self._get_local_ip()
                }
        except Exception as e:
            logger.warning("Koneksi via raspi-config gagal: %s", e)

        # Percobaan 3: Konfigurasi via wpa_cli
        try:
            iface = self._get_wireless_interface()
            # Buat network baru
            add_res = subprocess.run(["sudo", "wpa_cli", "-i", iface, "add_network"], stdout=subprocess.PIPE, text=True, timeout=5)
            net_id = add_res.stdout.strip()
            if net_id.isdigit():
                subprocess.run(["sudo", "wpa_cli", "-i", iface, "set_network", net_id, "ssid", f'"{ssid}"'], timeout=5)
                if password:
                    subprocess.run(["sudo", "wpa_cli", "-i", iface, "set_network", net_id, "psk", f'"{password}"'], timeout=5)
                else:
                    subprocess.run(["sudo", "wpa_cli", "-i", iface, "set_network", net_id, "key_mgmt", "NONE"], timeout=5)
                subprocess.run(["sudo", "wpa_cli", "-i", iface, "enable_network", net_id], timeout=5)
                subprocess.run(["sudo", "wpa_cli", "-i", iface, "select_network", net_id], timeout=5)
                subprocess.run(["sudo", "wpa_cli", "-i", iface, "save_config"], timeout=5)
                return {
                    "success": True,
                    "message": f"Konfigurasi wpa_supplicant untuk '{ssid}' berhasil disimpan.",
                    "ssid": ssid,
                    "ip": self._get_local_ip()
                }
        except Exception as e:
            logger.error("Koneksi via wpa_cli gagal: %s", e)

        return {"success": False, "message": "Gagal menyambungkan ke Wi-Fi. Pastikan nama SSID & password benar."}

    def disconnect(self):
        """Memutus koneksi Wi-Fi saat ini"""
        if not self.is_linux:
            self.simulated_connected = False
            self.simulated_ssid = None
            return {"success": True, "message": "Wi-Fi diputus (Simulasi)."}

        iface = self._get_wireless_interface()
        try:
            # 1. Coba nmcli
            subprocess.run(["sudo", "nmcli", "dev", "disconnect", iface], stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=5)
            # 2. Coba wpa_cli disconnect
            subprocess.run(["sudo", "wpa_cli", "-i", iface, "disconnect"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=5)
            return {"success": True, "message": "Koneksi Wi-Fi berhasil diputus."}
        except Exception as e:
            logger.error("Gagal memutus WiFi: %s", e)
            return {"success": False, "message": str(e)}

wifi_manager = WifiManager()
