import os
import time
import threading
import platform
import logging

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

# Logika Polaritas Aktif
OUTPUT_ACTIVE_HIGH = True  # True: HIGH = Nyala, False: LOW = Nyala (Relay Active-LOW)
LIMIT_ACTIVE_HIGH  = True  # True: HIGH saat tertekan, False: LOW saat tertekan (Active-LOW / GND)

DEAD_TIME_DELAY = 0.15     # Jeda proteksi interlock (150ms) saat pergantian arah

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
        
        # State Limit Switch
        self.limit_max = False
        self.limit_min = False
        
        # Posisi simulasi (0.0 = MIN, 100.0 = MAX)
        self.sim_position = 50.0

        self.gpio_handle = None
        self.chip_id = None
        self.dev_up = None
        self.dev_down = None
        self.btn_limit_max = None
        self.btn_limit_min = None

        self._running = True
        self._init_hardware()

        # Background supervisor thread untuk pemantauan limit real-time & osilasi
        self.worker_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.worker_thread.start()

    def _init_hardware(self):
        if platform.system().lower() != "linux":
            logger.info("OS Non-Linux (%s). Motor Hidrolik berjalan dalam mode SIMULASI.", platform.system())
            self.is_simulated = True
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
                        lgpio.gpio_claim_output(h, p, 0 if OUTPUT_ACTIVE_HIGH else 1)
                    
                    # Input Limit MAX & MIN
                    pull = lgpio.SET_PULL_DOWN if LIMIT_ACTIVE_HIGH else lgpio.SET_PULL_UP
                    for p in [PIN_LIMIT_MAX, PIN_LIMIT_MIN]:
                        try: lgpio.gpio_free(h, p)
                        except Exception: pass
                        lgpio.gpio_claim_input(h, p, pull)

                    self.gpio_handle = h
                    self.chip_id = c
                    logger.info("Hardware Hidrolik Siap via lgpio (chip %d): UP=GPIO%d, DOWN=GPIO%d, MAX=GPIO%d, MIN=GPIO%d",
                                c, PIN_HYDRAULIC_UP, PIN_HYDRAULIC_DOWN, PIN_LIMIT_MAX, PIN_LIMIT_MIN)
                    return
                except Exception:
                    continue
        except ImportError:
            pass

        # 2. Fallback via gpiozero
        try:
            from gpiozero import DigitalOutputDevice, Button
            self.dev_up = DigitalOutputDevice(PIN_HYDRAULIC_UP, active_high=OUTPUT_ACTIVE_HIGH, initial_value=False)
            self.dev_down = DigitalOutputDevice(PIN_HYDRAULIC_DOWN, active_high=OUTPUT_ACTIVE_HIGH, initial_value=False)
            self.btn_limit_max = Button(PIN_LIMIT_MAX, pull_up=not LIMIT_ACTIVE_HIGH)
            self.btn_limit_min = Button(PIN_LIMIT_MIN, pull_up=not LIMIT_ACTIVE_HIGH)
            logger.info("Hardware Hidrolik Siap via gpiozero: UP=GPIO%d, DOWN=GPIO%d, MAX=GPIO%d, MIN=GPIO%d",
                        PIN_HYDRAULIC_UP, PIN_HYDRAULIC_DOWN, PIN_LIMIT_MAX, PIN_LIMIT_MIN)
        except Exception as e:
            logger.warning("Gagal inisialisasi hardware Hidrolik: %s. Menggunakan mode SIMULASI.", e)
            self.is_simulated = True

    def _read_limits(self):
        """Membaca status terkini limit switch feedback hardware"""
        if not self.is_simulated:
            # Baca via lgpio jika tersedia
            if self.gpio_handle is not None:
                try:
                    import lgpio
                    val_max = lgpio.gpio_read(self.gpio_handle, PIN_LIMIT_MAX)
                    val_min = lgpio.gpio_read(self.gpio_handle, PIN_LIMIT_MIN)
                    self.limit_max = bool(val_max == 1 if LIMIT_ACTIVE_HIGH else val_max == 0)
                    self.limit_min = bool(val_min == 1 if LIMIT_ACTIVE_HIGH else val_min == 0)
                    return self.limit_max, self.limit_min
                except Exception:
                    pass

            # Baca via gpiozero
            if self.btn_limit_max and self.btn_limit_min:
                try:
                    self.limit_max = bool(self.btn_limit_max.is_pressed)
                    self.limit_min = bool(self.btn_limit_min.is_pressed)
                    return self.limit_max, self.limit_min
                except Exception:
                    pass

        # Pada mode simulasi
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

        if not self.is_simulated:
            # Tulis via lgpio
            if self.gpio_handle is not None:
                try:
                    import lgpio
                    # Jika ganti arah, matikan yang sedang menyala terlebih dahulu
                    val_up = 1 if (up_state if OUTPUT_ACTIVE_HIGH else not up_state) else 0
                    val_down = 1 if (down_state if OUTPUT_ACTIVE_HIGH else not down_state) else 0

                    if up_state:
                        lgpio.gpio_write(self.gpio_handle, PIN_HYDRAULIC_DOWN, 0 if OUTPUT_ACTIVE_HIGH else 1)
                        time.sleep(DEAD_TIME_DELAY)
                        lgpio.gpio_write(self.gpio_handle, PIN_HYDRAULIC_UP, 1 if OUTPUT_ACTIVE_HIGH else 0)
                    elif down_state:
                        lgpio.gpio_write(self.gpio_handle, PIN_HYDRAULIC_UP, 0 if OUTPUT_ACTIVE_HIGH else 1)
                        time.sleep(DEAD_TIME_DELAY)
                        lgpio.gpio_write(self.gpio_handle, PIN_HYDRAULIC_DOWN, 1 if OUTPUT_ACTIVE_HIGH else 0)
                    else:
                        lgpio.gpio_write(self.gpio_handle, PIN_HYDRAULIC_UP, 0 if OUTPUT_ACTIVE_HIGH else 1)
                        lgpio.gpio_write(self.gpio_handle, PIN_HYDRAULIC_DOWN, 0 if OUTPUT_ACTIVE_HIGH else 1)
                    return
                except Exception as e:
                    logger.error("Error penulisan lgpio hidrolik: %s", e)

            # Tulis via gpiozero
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
                except Exception as e:
                    logger.error("Error penulisan gpiozero hidrolik: %s", e)

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

    def get_status(self) -> dict:
        """Mengembalikan status menyeluruh sistem hidrolik untuk API & UI"""
        return {
            "state": self.state,                        # "IDLE", "UP", "DOWN", "STOP"
            "is_oscillating": bool(self.is_oscillating),# True jika slider Penggerak Rak sedang aktif
            "target_direction": self.target_direction,  # Arah tujuan gerakan saat ini
            "limit_max": bool(self.limit_max),          # True jika batas atas tersentuh
            "limit_min": bool(self.limit_min),          # True jika batas bawah tersentuh
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
