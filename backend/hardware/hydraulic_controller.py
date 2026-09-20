import os
import json
import time
import threading
import platform
import logging
import subprocess

logger = logging.getLogger("HydraulicController")

# =========================================================
# KONFIGURASI GPIO MOTOR HIDROLIK & LIMIT SWITCH FEEDBACK
# =========================================================
# Output GPIO untuk mengontrol selenoid / relay motor hidrolik
PIN_HYDRAULIC_UP   = int(os.getenv("PIN_HYDRAULIC_UP", 13))   # Output UP (naik)
PIN_HYDRAULIC_DOWN = int(os.getenv("PIN_HYDRAULIC_DOWN", 19)) # Output DOWN (turun)

# Input GPIO membaca feedback Limit Switch (Hardware Angle Sensor)
PIN_LIMIT_MAX      = int(os.getenv("PIN_LIMIT_MAX", 5))       # Feedback Limit MAX (Batas Atas / Max Angle)
PIN_LIMIT_MIN      = int(os.getenv("PIN_LIMIT_MIN", 6))       # Feedback Limit MIN (Batas Bawah / Min Angle)

DEAD_TIME_DELAY = 0.15     # Jeda proteksi interlock (150ms) saat pergantian arah
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "hydraulic_config.json")

def read_hardware_pin(pin: int):
    """
    Membaca level biner fisik (0 atau 1) langsung dari register SoC.
    Bekerja langsung di level kernel meskipun pin sedang dipakai proses lain.
    """
    if platform.system().lower() != "linux":
        return None
    # 1. Coba pinctrl (Raspberry Pi OS Bookworm / Pi 5)
    try:
        out = subprocess.check_output(["pinctrl", "get", str(pin)], stderr=subprocess.DEVNULL, text=True).strip()
        if "|" in out:
            after = out.split("|")[1].lower()
            if "hi" in after or "1" in after:
                return 1
            elif "lo" in after or "0" in after:
                return 0
    except Exception:
        pass
    # 2. Coba raspi-gpio
    try:
        out = subprocess.check_output(f"raspi-gpio get {pin}", shell=True, stderr=subprocess.DEVNULL, text=True).strip()
        if "level=1" in out:
            return 1
        elif "level=0" in out:
            return 0
    except Exception:
        pass
    # 3. Coba gpioget
    try:
        out = subprocess.check_output(f"gpioget 4 {pin} 2>/dev/null || gpioget 0 {pin} 2>/dev/null", shell=True, text=True).strip()
        if out in ("0", "1"):
            return int(out)
    except Exception:
        pass
    return None

def write_hardware_pin(pin: int, val: int) -> bool:
    """
    Menulis level biner fisik (0 atau 1) langsung ke register GPIO.
    Fail-safe mutlak jika library userspace terkunci.
    """
    if platform.system().lower() != "linux":
        return False
    drive = "dh" if val == 1 else "dl"
    try:
        subprocess.run(["pinctrl", "set", str(pin), "op", drive], check=True, stderr=subprocess.DEVNULL)
        return True
    except Exception:
        pass
    try:
        subprocess.run(["raspi-gpio", "set", str(pin), "op", drive], check=True, stderr=subprocess.DEVNULL)
        return True
    except Exception:
        pass
    try:
        subprocess.run(f"gpioset 4 {pin}={val} 2>/dev/null || gpioset 0 {pin}={val} 2>/dev/null", shell=True)
        return True
    except Exception:
        pass
    return False

def load_config():
    """Membaca konfigurasi polaritas yang tersimpan atau menggunakan default"""
    cfg = {
        "output_active_high": True,  # True: 3.3V=ON, False: 0V=ON (Active-LOW)
        "limit_active_high": False   # True: 3.3V=Tersentuh, False: GND=Tersentuh
    }
    if os.path.exists(CONFIG_PATH):
        try:
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                if "output_active_high" in data:
                    cfg["output_active_high"] = bool(data["output_active_high"])
                if "limit_active_high" in data:
                    cfg["limit_active_high"] = bool(data["limit_active_high"])
        except Exception as e:
            logger.warning("Gagal membaca %s: %s", CONFIG_PATH, e)
    return cfg

def save_config(cfg):
    """Menyimpan konfigurasi polaritas agar persisten saat reboot"""
    try:
        with open(CONFIG_PATH, "w", encoding="utf-8") as f:
            json.dump(cfg, f, indent=2)
    except Exception as e:
        logger.warning("Gagal menyimpan %s: %s", CONFIG_PATH, e)

saved_cfg = load_config()
OUTPUT_ACTIVE_HIGH = saved_cfg["output_active_high"]
LIMIT_ACTIVE_HIGH  = saved_cfg["limit_active_high"]

class HydraulicController:
    """
    Sistem Kontrol Motor Penggerak Hidrolik Pembalik Rak Telur:
    1. Interlock Safety: UP dan DOWN tidak boleh aktif bersamaan.
    2. Continuous Tilting (Osilasi Bolak-Balik): Saat slider dinyalakan,
       rak bergerak bolak-balik antara LIMIT MIN dan LIMIT MAX terus menerus
       hingga slider dimatikan.
    3. Hardware Limit Feedback: Berhenti dan berbalik arah otomatis saat limit tersentuh.
    4. Dual Hardware Backend: Mendukung lgpio (Pi 5 chip 4) dan gpiozero.
    """
    def __init__(self):
        self.is_simulated = False
        self.lock = threading.Lock()
        self.state = "IDLE"           # "IDLE", "UP", "DOWN", "STOP"
        self.is_oscillating = False   # True saat slider Penggerak Rak menyala
        self.target_direction = "UP"  # "UP" atau "DOWN"
        
        cfg = load_config()
        self.limit_active_high = cfg["limit_active_high"]   # False = Active-LOW (GND), True = Active-HIGH
        self.output_active_high = cfg["output_active_high"] # True = Active-HIGH (3.3V=ON), False = Active-LOW (0V=ON)
        
        # State Limit Switch
        self.limit_max = False
        self.limit_min = False
        self.raw_max = None
        self.raw_min = None
        
        # Posisi simulasi (0.0 = MIN, 100.0 = MAX)
        self.sim_position = 50.0

        self.gpio_handle = None
        self.chip_id = None
        self.dev_up = None
        self.dev_down = None
        self.btn_limit_max = None
        self.btn_limit_min = None
        self.hardware_backend = "none"
        self.hardware_error = None

        self._running = True
        self._init_hardware()

        # Background supervisor thread untuk pemantauan limit real-time & osilasi
        self.worker_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.worker_thread.start()

    def _init_hardware(self):
        if platform.system().lower() != "linux":
            logger.info("OS Non-Linux (%s). Motor Hidrolik berjalan dalam mode SIMULASI.", platform.system())
            self.is_simulated = True
            self.hardware_backend = "simulated"
            return

        # 1. Coba inisialisasi via lgpio (Native Linux / Raspberry Pi 5 & 4)
        try:
            import lgpio
            for c in [4, 0]:
                try:
                    h = lgpio.gpiochip_open(c)
                    # Output UP & DOWN
                    for p in [PIN_HYDRAULIC_UP, PIN_HYDRAULIC_DOWN]:
                        try: lgpio.gpio_free(h, p)
                        except Exception: pass
                        init_val = 0 if self.output_active_high else 1
                        lgpio.gpio_claim_output(h, p, init_val)
                    
                    # Input Limit MAX & MIN (Pull-UP untuk Active-LOW ke GND)
                    pull = lgpio.SET_PULL_DOWN if self.limit_active_high else lgpio.SET_PULL_UP
                    for p in [PIN_LIMIT_MAX, PIN_LIMIT_MIN]:
                        try: lgpio.gpio_free(h, p)
                        except Exception: pass
                        lgpio.gpio_claim_input(h, p, pull)

                    self.gpio_handle = h
                    self.chip_id = c
                    self.hardware_backend = f"lgpio (chip {c})"
                    logger.info("Hardware Hidrolik Siap via lgpio (chip %d): UP=GPIO%d, DOWN=GPIO%d, MAX=GPIO%d, MIN=GPIO%d (Output: %s, Limit: %s)",
                                c, PIN_HYDRAULIC_UP, PIN_HYDRAULIC_DOWN, PIN_LIMIT_MAX, PIN_LIMIT_MIN,
                                "Active-HIGH (3.3V=ON)" if self.output_active_high else "Active-LOW (0V=ON)",
                                "Active-HIGH (3.3V)" if self.limit_active_high else "Active-LOW (GND)")
                    return
                except Exception as ex_chip:
                    self.hardware_error = str(ex_chip)
                    continue
        except ImportError:
            pass

        # 2. Fallback via gpiozero
        try:
            from gpiozero import DigitalOutputDevice, Button
            self.dev_up = DigitalOutputDevice(PIN_HYDRAULIC_UP, active_high=self.output_active_high, initial_value=False)
            self.dev_down = DigitalOutputDevice(PIN_HYDRAULIC_DOWN, active_high=self.output_active_high, initial_value=False)
            self.btn_limit_max = Button(PIN_LIMIT_MAX, pull_up=not self.limit_active_high)
            self.btn_limit_min = Button(PIN_LIMIT_MIN, pull_up=not self.limit_active_high)
            self.hardware_backend = "gpiozero"
            logger.info("Hardware Hidrolik Siap via gpiozero: UP=GPIO%d, DOWN=GPIO%d, MAX=GPIO%d, MIN=GPIO%d",
                        PIN_HYDRAULIC_UP, PIN_HYDRAULIC_DOWN, PIN_LIMIT_MAX, PIN_LIMIT_MIN)
        except Exception as e:
            logger.warning("Gagal inisialisasi hardware Hidrolik: %s. Menggunakan mode SIMULASI.", e)
            self.is_simulated = True
            self.hardware_backend = "simulated"
            if not self.hardware_error:
                self.hardware_error = str(e)

    def reinit_hardware(self) -> bool:
        """Mematikan handle lama dan mencoba klaim pin hardware ulang jika proses pengunci sudah dimatikan"""
        with self.lock:
            if self.gpio_handle is not None:
                try:
                    import lgpio
                    lgpio.gpiochip_close(self.gpio_handle)
                except Exception:
                    pass
                self.gpio_handle = None
            if self.dev_up:
                try: self.dev_up.close()
                except Exception: pass
                self.dev_up = None
            if self.dev_down:
                try: self.dev_down.close()
                except Exception: pass
                self.dev_down = None
            self.is_simulated = False
            self.hardware_backend = "none"
            self.hardware_error = None
            self._init_hardware()
            return not self.is_simulated

    def set_output_polarity(self, active_high: bool):
        """Mengubah polaritas output (True: 3.3V/HIGH = ON, False: 0V/LOW = ON) dan menyimpannya"""
        with self.lock:
            self.output_active_high = bool(active_high)
            save_config({
                "output_active_high": self.output_active_high,
                "limit_active_high": self.limit_active_high
            })
            self._hw_set_outputs(False, False)
            logger.info("Polaritas Output Hidrolik diubah & disimpan: %s", "Active-HIGH (3.3V=ON)" if self.output_active_high else "Active-LOW (0V=ON)")

    def set_limit_polarity(self, active_high: bool):
        """Mengubah polaritas pembacaan limit switch (Active-LOW GND vs Active-HIGH 3.3V) dan menyimpannya"""
        with self.lock:
            self.limit_active_high = bool(active_high)
            save_config({
                "output_active_high": self.output_active_high,
                "limit_active_high": self.limit_active_high
            })
            if not self.is_simulated and self.gpio_handle is not None:
                try:
                    import lgpio
                    pull = lgpio.SET_PULL_DOWN if self.limit_active_high else lgpio.SET_PULL_UP
                    for p in [PIN_LIMIT_MAX, PIN_LIMIT_MIN]:
                        try: lgpio.gpio_free(self.gpio_handle, p)
                        except Exception: pass
                        lgpio.gpio_claim_input(self.gpio_handle, p, pull)
                except Exception:
                    pass
            logger.info("Polaritas Limit Switch diubah & disimpan: %s", "Active-HIGH (3.3V)" if self.limit_active_high else "Active-LOW (GND)")

    def get_raw_limits(self):
        """Mendapatkan nilai tegangan biner mentah (0 atau 1) dari Pin 5 & 6"""
        # 1. Coba via lgpio
        if self.gpio_handle is not None:
            try:
                import lgpio
                v_max = lgpio.gpio_read(self.gpio_handle, PIN_LIMIT_MAX)
                v_min = lgpio.gpio_read(self.gpio_handle, PIN_LIMIT_MIN)
                return v_max, v_min, True
            except Exception:
                pass

        # 2. Coba baca via register SoC langsung (pinctrl / raspi-gpio / gpioget)
        v_max = read_hardware_pin(PIN_LIMIT_MAX)
        v_min = read_hardware_pin(PIN_LIMIT_MIN)
        if v_max is not None and v_min is not None:
            return v_max, v_min, True

        return None, None, False

    def _read_limits(self):
        """Membaca status terkini limit switch feedback hardware"""
        v_max, v_min, is_hw = self.get_raw_limits()
        if is_hw and v_max is not None and v_min is not None:
            self.raw_max = v_max
            self.raw_min = v_min
            # Active-LOW (Default): tersentuh jika 0 (GND)
            # Active-HIGH: tersentuh jika 1 (3.3V)
            self.limit_max = bool(v_max == 1 if self.limit_active_high else v_max == 0)
            self.limit_min = bool(v_min == 1 if self.limit_active_high else v_min == 0)
            return self.limit_max, self.limit_min

        # Baca via gpiozero jika tersedia
        if self.btn_limit_max and self.btn_limit_min:
            try:
                self.limit_max = bool(self.btn_limit_max.is_pressed)
                self.limit_min = bool(self.btn_limit_min.is_pressed)
                return self.limit_max, self.limit_min
            except Exception:
                pass

        # Pada mode simulasi (hanya jika register fisik sama sekali tidak terbaca)
        self.limit_min = (self.sim_position <= 1.0)
        self.limit_max = (self.sim_position >= 99.0)
        return self.limit_max, self.limit_min

    def _hw_set_outputs(self, up_state: bool, down_state: bool):
        """Menulis sinyal fisik ke output aktuator dengan interlock safety"""
        # Interlock safety: UP dan DOWN tidak boleh ON bersamaan
        if up_state and down_state:
            logger.error("SAFETY VIOLATION: UP dan DOWN tidak boleh aktif bersamaan! Mematikan keduanya.")
            up_state = False
            down_state = False

        val_active = 1 if self.output_active_high else 0
        val_inactive = 0 if self.output_active_high else 1

        # 1. Tulis via lgpio jika handle tersedia
        if self.gpio_handle is not None:
            try:
                import lgpio
                if up_state:
                    lgpio.gpio_write(self.gpio_handle, PIN_HYDRAULIC_DOWN, val_inactive)
                    time.sleep(DEAD_TIME_DELAY)
                    lgpio.gpio_write(self.gpio_handle, PIN_HYDRAULIC_UP, val_active)
                elif down_state:
                    lgpio.gpio_write(self.gpio_handle, PIN_HYDRAULIC_UP, val_inactive)
                    time.sleep(DEAD_TIME_DELAY)
                    lgpio.gpio_write(self.gpio_handle, PIN_HYDRAULIC_DOWN, val_active)
                else:
                    lgpio.gpio_write(self.gpio_handle, PIN_HYDRAULIC_UP, val_inactive)
                    lgpio.gpio_write(self.gpio_handle, PIN_HYDRAULIC_DOWN, val_inactive)
                return
            except Exception as e:
                logger.error("Error penulisan lgpio hidrolik: %s", e)

        # 2. Tulis via gpiozero jika ada
        if self.dev_up and self.dev_down:
            try:
                if up_state:
                    self.dev_down.off()
                    time.sleep(DEAD_TIME_DELAY)
                    self.dev_up.on()
                elif down_state:
                    self.dev_up.off()
                    time.sleep(DEAD_TIME_DELAY)
                    self.dev_down.on()
                else:
                    self.dev_up.off()
                    self.dev_down.off()
                return
            except Exception as e:
                logger.error("Error penulisan gpiozero hidrolik: %s", e)

        # 3. Fallback register SoC langsung (pinctrl / raspi-gpio)
        if up_state:
            write_hardware_pin(PIN_HYDRAULIC_DOWN, val_inactive)
            time.sleep(DEAD_TIME_DELAY)
            write_hardware_pin(PIN_HYDRAULIC_UP, val_active)
        elif down_state:
            write_hardware_pin(PIN_HYDRAULIC_UP, val_inactive)
            time.sleep(DEAD_TIME_DELAY)
            write_hardware_pin(PIN_HYDRAULIC_DOWN, val_active)
        else:
            write_hardware_pin(PIN_HYDRAULIC_UP, val_inactive)
            write_hardware_pin(PIN_HYDRAULIC_DOWN, val_inactive)

    def start_oscillation(self) -> dict:
        """
        Diaktifkan saat slider 'Penggerak Rak' dinyalakan (ON).
        Menggerakkan hidrolik bolak-balik antara LIMIT MIN dan LIMIT MAX
        secara otomatis dan terus-menerus hingga slider dimatikan.
        """
        with self.lock:
            self.is_oscillating = True
            max_act, min_act = self._read_limits()

            # Tentukan arah awal berdasarkan limit switch
            if max_act and not min_act:
                self.target_direction = "DOWN"
                self.state = "DOWN"
                self._hw_set_outputs(up_state=False, down_state=True)
            elif min_act and not max_act:
                self.target_direction = "UP"
                self.state = "UP"
                self._hw_set_outputs(up_state=True, down_state=False)
            else:
                # Jika berada di antara batas, gerakkan ke arah target sebelumnya
                self.state = self.target_direction
                if self.target_direction == "UP":
                    self._hw_set_outputs(up_state=True, down_state=False)
                else:
                    self._hw_set_outputs(up_state=False, down_state=True)

            logger.info("Penggerak Rak DINYALAKAN: Bergerak %s (Osilasi Bolak-Balik Aktif)", self.state)
            return self.get_status()

    def stop_oscillation(self) -> dict:
        """
        Dipanggil saat slider 'Penggerak Rak' dimatikan (OFF).
        Segera mematikan seluruh sinyal hidrolik (STOP).
        """
        with self.lock:
            self.is_oscillating = False
            self.state = "IDLE"
            self._hw_set_outputs(up_state=False, down_state=False)
            logger.info("Penggerak Rak DIMATIKAN: Seluruh Sinyal Hidrolik Berhenti (STOP)")
            return self.get_status()

    def move_up(self) -> dict:
        """Perintah manual: Gerakkan hidrolik naik (UP)"""
        with self.lock:
            self._read_limits()
            if self.limit_max:
                logger.warning("Tidak dapat bergerak UP: Limit MAX sudah aktif!")
                self.stop()
                return self.get_status()

            self.state = "UP"
            self.target_direction = "UP"
            self._hw_set_outputs(up_state=True, down_state=False)
            logger.info("Hidrolik: Bergerak NAIK (UP)")
            return self.get_status()

    def move_down(self) -> dict:
        """Perintah manual: Gerakkan hidrolik turun (DOWN)"""
        with self.lock:
            self._read_limits()
            if self.limit_min:
                logger.warning("Tidak dapat bergerak DOWN: Limit MIN sudah aktif!")
                self.stop()
                return self.get_status()

            self.state = "DOWN"
            self.target_direction = "DOWN"
            self._hw_set_outputs(up_state=False, down_state=True)
            logger.info("Hidrolik: Bergerak TURUN (DOWN)")
            return self.get_status()

    def stop(self) -> dict:
        """Perintah: Hentikan seluruh gerakan hidrolik"""
        return self.stop_oscillation()

    def _monitor_loop(self):
        """Loop pengawasan real-time limit switch & osilasi bolak-balik hidrolik"""
        step_dt = 0.05
        while self._running:
            try:
                with self.lock:
                    max_act, min_act = self._read_limits()

                    # Update posisi virtual simulasi jika mode simulasi
                    if self.is_simulated:
                        if self.state == "UP":
                            self.sim_position = min(100.0, self.sim_position + 15.0 * step_dt)
                        elif self.state == "DOWN":
                            self.sim_position = max(0.0, self.sim_position - 15.0 * step_dt)
                        max_act, min_act = self._read_limits()

                    # 1. KONTROL OSILASI BOLAK-BALIK KETIKA SLIDER PENGGERAK RAK AKTIF
                    if self.is_oscillating:
                        if self.state == "UP" and max_act:
                            logger.info("[LIMIT MAX TERCAPAI] Sudut maksimum tersentuh! Membalik arah ke TURUN (DOWN)...")
                            self._hw_set_outputs(False, False)
                            time.sleep(DEAD_TIME_DELAY)
                            self.target_direction = "DOWN"
                            self.state = "DOWN"
                            self._hw_set_outputs(False, True)

                        elif self.state == "DOWN" and min_act:
                            logger.info("[LIMIT MIN TERCAPAI] Sudut minimum tersentuh! Membalik arah ke NAIK (UP)...")
                            self._hw_set_outputs(False, False)
                            time.sleep(DEAD_TIME_DELAY)
                            self.target_direction = "UP"
                            self.state = "UP"
                            self._hw_set_outputs(True, False)

                        elif self.state == "IDLE":
                            # Jika dalam status IDLE saat osilasi masih aktif, lanjutkan gerakan
                            if max_act and not min_act:
                                self.state = "DOWN"
                                self._hw_set_outputs(False, True)
                            elif min_act and not max_act:
                                self.state = "UP"
                                self._hw_set_outputs(True, False)
                            else:
                                self.state = self.target_direction
                                if self.target_direction == "UP":
                                    self._hw_set_outputs(True, False)
                                else:
                                    self._hw_set_outputs(False, True)

                    else:
                        # JIKA SLIDER OFF / MANUAL:
                        # Safety Cutoff agar tidak menabrak batas jika digerakkan manual
                        if self.state == "UP" and max_act:
                            logger.info("[SAFETY] Limit MAX tercapai! Menghentikan motor UP.")
                            self._hw_set_outputs(False, False)
                            self.state = "IDLE"
                        elif self.state == "DOWN" and min_act:
                            logger.info("[SAFETY] Limit MIN tercapai! Menghentikan motor DOWN.")
                            self._hw_set_outputs(False, False)
                            self.state = "IDLE"

            except Exception as e:
                logger.error("Error pada loop monitor hidrolik: %s", e)

            time.sleep(step_dt)

    def force_output(self, up_state: bool, down_state: bool):
        """
        Pengujian langsung pin fisik tanpa terhalang limit switch (tetap ada interlock safety).
        Sangat berguna untuk memverifikasi apakah lampu LED indikator di relay menyala.
        """
        with self.lock:
            if up_state:
                self.state = "UP"
                self.target_direction = "UP"
                self._hw_set_outputs(True, False)
            elif down_state:
                self.state = "DOWN"
                self.target_direction = "DOWN"
                self._hw_set_outputs(False, True)
            else:
                self.state = "IDLE"
                self._hw_set_outputs(False, False)

    def blink_test(self, cycles: int = 3, delay: float = 1.0):
        """
        Tes kedip bergantian antara UP (Pin 13) dan DOWN (Pin 19)
        untuk menguji lampu indikator relay secara visual.
        """
        logger.info("Memulai Blink Test (%d siklus, jeda %.1fs)...", cycles, delay)
        for i in range(cycles):
            logger.info("Blink [%d/%d]: NAIK (Pin %d) ON", i+1, cycles, PIN_HYDRAULIC_UP)
            self.force_output(up_state=True, down_state=False)
            time.sleep(delay)

            self.force_output(up_state=False, down_state=False)
            time.sleep(0.3)

            logger.info("Blink [%d/%d]: TURUN (Pin %d) ON", i+1, cycles, PIN_HYDRAULIC_DOWN)
            self.force_output(up_state=False, down_state=True)
            time.sleep(delay)

            self.force_output(up_state=False, down_state=False)
            time.sleep(0.3)
        logger.info("Blink Test Selesai. Seluruh output OFF.")

    def get_status(self) -> dict:
        """Mengembalikan status menyeluruh sistem hidrolik untuk API & UI"""
        return {
            "state": self.state,                        # "IDLE", "UP", "DOWN", "STOP"
            "is_oscillating": bool(self.is_oscillating),# True jika slider Penggerak Rak sedang aktif
            "target_direction": self.target_direction,  # Arah tujuan gerakan saat ini
            "limit_max": bool(self.limit_max),          # True jika batas atas tersentuh
            "limit_min": bool(self.limit_min),          # True jika batas bawah tersentuh
            "raw_max": self.raw_max,
            "raw_min": self.raw_min,
            "output_active_high": self.output_active_high,
            "limit_active_high": self.limit_active_high,
            "backend": self.hardware_backend,
            "hardware_error": self.hardware_error,
            "simulated": self.is_simulated,
            "position_percent": round(self.sim_position, 1) if self.is_simulated else (100 if self.limit_max else (0 if self.limit_min else 50))
        }

    def cleanup(self):
        """Mematikan seluruh output saat shutdown"""
        self._running = False
        self._hw_set_outputs(False, False)
        if self.gpio_handle is not None:
            try:
                import lgpio
                lgpio.gpiochip_close(self.gpio_handle)
            except Exception: pass
        if self.dev_up:
            try: self.dev_up.close()
            except Exception: pass
        if self.dev_down:
            try: self.dev_down.close()
            except Exception: pass

# Singleton instance
hydraulic_controller = HydraulicController()
