import time
import threading
import platform
import logging

logger = logging.getLogger("HydraulicController")

# =========================================================
# KONFIGURASI GPIO MOTOR HIDROLIK & LIMIT SWITCH
# Output GPIO 13 & 19 memberikan sinyal ke Custom PCB Driver
# Input GPIO 5 & 6 membaca Button / Limit Switch (pull_up=False)
# =========================================================
PIN_HYDRAULIC_UP   = 13  # Output UP (naik)
PIN_HYDRAULIC_DOWN = 19  # Output DOWN (turun)
PIN_LIMIT_MAX      = 5   # Input Limit MAX (Batas Atas / Button 1)
PIN_LIMIT_MIN      = 6   # Input Limit MIN (Batas Bawah / Button 2)

DEAD_TIME_DELAY = 0.08   # Jeda proteksi interlock (80ms) sebelum ganti arah

class HydraulicController:
    """
    Sistem Kontrol Motor Penggerak Hidrolik dengan:
    1. Interlock Safety (UP dan DOWN tidak boleh ON bersamaan)
    2. Auto-Cutoff Limit Switch (MAX & MIN)
    3. State Machine non-blocking (IDLE, UP, DOWN, STOP)
    4. Mode Operasi: MANUAL & AUTO (Pembalik telur bolak-balik)
    """
    def __init__(self):
        self.is_simulated = False
        self.lock = threading.Lock()
        self.state = "IDLE"           # "IDLE", "UP", "DOWN", "STOP"
        self.mode = "MANUAL"          # "MANUAL", "AUTO"
        
        # State Limit Switch
        self.limit_max = False
        self.limit_min = False
        
        # Posisi simulasi (0.0 = MIN, 100.0 = MAX)
        self.sim_position = 50.0

        # Auto tilt settings
        self.auto_interval_minutes = 120  # Pembalikan telur setiap 2 jam
        self.last_tilt_time = time.time()
        self.auto_target_direction = "UP"

        self.dev_up = None
        self.dev_down = None
        self.btn_limit_max = None
        self.btn_limit_min = None

        self._running = True
        self._init_hardware()

        # Mulai background supervisor thread untuk pemantauan limit real-time
        self.worker_thread = threading.Thread(target=self._monitor_loop, daemon=True)
        self.worker_thread.start()

    def _init_hardware(self):
        if platform.system().lower() != "linux":
            logger.info("OS Non-Linux (%s). Motor Hidrolik berjalan dalam mode SIMULASI.", platform.system())
            self.is_simulated = True
            return

        try:
            from gpiozero import DigitalOutputDevice, Button
            
            # Inisialisasi Output ke Custom PCB Driver (Active HIGH, default OFF)
            self.dev_up = DigitalOutputDevice(PIN_HYDRAULIC_UP, active_high=True, initial_value=False)
            self.dev_down = DigitalOutputDevice(PIN_HYDRAULIC_DOWN, active_high=True, initial_value=False)

            # Inisialisasi Limit Switch / Push Button (pull_up=False sesuai wiring hardware)
            self.btn_limit_max = Button(PIN_LIMIT_MAX, pull_up=False)
            self.btn_limit_min = Button(PIN_LIMIT_MIN, pull_up=False)

            logger.info("Hardware Hidrolik Siap: UP(GPIO%d), DOWN(GPIO%d), LIMIT_MAX(GPIO%d), LIMIT_MIN(GPIO%d)",
                        PIN_HYDRAULIC_UP, PIN_HYDRAULIC_DOWN, PIN_LIMIT_MAX, PIN_LIMIT_MIN)
        except Exception as e:
            logger.warning("Gagal inisialisasi hardware Hidrolik: %s. Menggunakan mode SIMULASI.", e)
            self.is_simulated = True

    def _read_limits(self):
        """Membaca status terkini limit switch"""
        if not self.is_simulated and self.btn_limit_max and self.btn_limit_min:
            try:
                self.limit_max = bool(self.btn_limit_max.is_pressed)
                self.limit_min = bool(self.btn_limit_min.is_pressed)
            except Exception:
                pass
        else:
            # Pada mode simulasi, batas dicapai saat posisi <= 0 atau >= 100
            self.limit_min = (self.sim_position <= 0.5)
            self.limit_max = (self.sim_position >= 99.5)

        return self.limit_max, self.limit_min

    def _hw_set_outputs(self, up_state: bool, down_state: bool):
        """Menulis sinyal fisik ke Custom PCB Driver dengan interlock safety"""
        # Proteksi mutlak: UP dan DOWN tidak boleh ON bersamaan
        if up_state and down_state:
            logger.error("SAFETY VIOLATION: UP dan DOWN tidak boleh aktif bersamaan! Mematikan keduanya.")
            up_state = False
            down_state = False

        if not self.is_simulated and self.dev_up and self.dev_down:
            try:
                # Jika berpindah arah, matikan yang aktif terlebih dahulu
                if up_state and self.dev_down.value:
                    self.dev_down.off()
                    time.sleep(DEAD_TIME_DELAY)
                elif down_state and self.dev_up.value:
                    self.dev_up.off()
                    time.sleep(DEAD_TIME_DELAY)

                if up_state:
                    self.dev_down.off()
                    self.dev_up.on()
                elif down_state:
                    self.dev_up.off()
                    self.dev_down.on()
                else:
                    self.dev_up.off()
                    self.dev_down.off()
            except Exception as e:
                logger.error("Error penulisan GPIO hidrolik: %s", e)
        else:
            # Mode Simulasi
            pass

    def move_up(self) -> dict:
        """Perintah manual: Gerakkan aktuator naik (UP)"""
        with self.lock:
            self._read_limits()
            if self.limit_max:
                logger.warning("Tidak dapat bergerak UP: Limit MAX sudah aktif!")
                self.stop()
                return self.get_status()

            self.state = "UP"
            self._hw_set_outputs(up_state=True, down_state=False)
            logger.info("Hidrolik: Bergerak NAIK (UP)")
            return self.get_status()

    def move_down(self) -> dict:
        """Perintah manual: Gerakkan aktuator turun (DOWN)"""
        with self.lock:
            self._read_limits()
            if self.limit_min:
                logger.warning("Tidak dapat bergerak DOWN: Limit MIN sudah aktif!")
                self.stop()
                return self.get_status()

            self.state = "DOWN"
            self._hw_set_outputs(up_state=False, down_state=True)
            logger.info("Hidrolik: Bergerak TURUN (DOWN)")
            return self.get_status()

    def stop(self) -> dict:
        """Perintah: Hentikan seluruh gerakan aktuator (STOP/IDLE)"""
        with self.lock:
            self.state = "IDLE"
            self._hw_set_outputs(up_state=False, down_state=False)
            logger.info("Hidrolik: BERHENTI (STOP/IDLE)")
            return self.get_status()

    def set_mode(self, mode: str, interval_minutes: int = None) -> dict:
        """Mengatur mode operasi: MANUAL atau AUTO"""
        with self.lock:
            mode_upper = mode.upper()
            if mode_upper in ["MANUAL", "AUTO"]:
                self.mode = mode_upper
            if interval_minutes is not None and interval_minutes > 0:
                self.auto_interval_minutes = int(interval_minutes)
            logger.info("Mode Hidrolik diubah ke: %s (Interval: %s mnt)", self.mode, self.auto_interval_minutes)
            return self.get_status()

    def _monitor_loop(self):
        """Loop pengawasan real-time limit switch & auto tilting cycle"""
        step_dt = 0.05
        while self._running:
            try:
                with self.lock:
                    max_act, min_act = self._read_limits()

                    # Update posisi virtual simulasi jika di non-Linux
                    if self.is_simulated:
                        if self.state == "UP":
                            self.sim_position = min(100.0, self.sim_position + 15.0 * step_dt)
                        elif self.state == "DOWN":
                            self.sim_position = max(0.0, self.sim_position - 15.0 * step_dt)
                        max_act, min_act = self._read_limits()

                    # 1. CEK SAFETY CUTOFF
                    if self.state == "UP" and max_act:
                        logger.info("[SAFETY] Limit MAX tercapai! Menghentikan motor UP.")
                        self._hw_set_outputs(False, False)
                        if self.mode == "AUTO":
                            # Pada mode auto, tunggu jadwal berikutnya atau ganti target arah
                            self.state = "IDLE"
                            self.auto_target_direction = "DOWN"
                            self.last_tilt_time = time.time()
                        else:
                            self.state = "IDLE"

                    elif self.state == "DOWN" and min_act:
                        logger.info("[SAFETY] Limit MIN tercapai! Menghentikan motor DOWN.")
                        self._hw_set_outputs(False, False)
                        if self.mode == "AUTO":
                            self.state = "IDLE"
                            self.auto_target_direction = "UP"
                            self.last_tilt_time = time.time()
                        else:
                            self.state = "IDLE"

                    # 2. LOGIKA MODE AUTO
                    if self.mode == "AUTO" and self.state == "IDLE":
                        now = time.time()
                        elapsed_minutes = (now - self.last_tilt_time) / 60.0
                        if elapsed_minutes >= self.auto_interval_minutes:
                            logger.info("[AUTO TILT] Waktunya membalik telur. Memulai gerakan ke arah %s", self.auto_target_direction)
                            if self.auto_target_direction == "UP" and not max_act:
                                self.state = "UP"
                                self._hw_set_outputs(True, False)
                            elif self.auto_target_direction == "DOWN" and not min_act:
                                self.state = "DOWN"
                                self._hw_set_outputs(False, True)
                            else:
                                # Jika sudah di posisi tujuan, balikkan target
                                self.auto_target_direction = "DOWN" if self.auto_target_direction == "UP" else "UP"
                                self.last_tilt_time = now

            except Exception as e:
                logger.error("Error pada loop monitor hidrolik: %s", e)

            time.sleep(step_dt)

    def get_status(self) -> dict:
        """Mengembalikan status menyeluruh sistem hidrolik untuk API & UI"""
        return {
            "state": self.state,                    # "IDLE", "UP", "DOWN", "STOP"
            "mode": self.mode,                      # "MANUAL", "AUTO"
            "limit_max": bool(self.limit_max),      # True jika batas atas tersentuh
            "limit_min": bool(self.limit_min),      # True jika batas bawah tersentuh
            "auto_interval_minutes": self.auto_interval_minutes,
            "next_tilt_seconds": max(0, int((self.auto_interval_minutes * 60) - (time.time() - self.last_tilt_time))) if self.mode == "AUTO" else 0,
            "simulated": self.is_simulated,
            "position_percent": round(self.sim_position, 1) if self.is_simulated else (100 if self.limit_max else (0 if self.limit_min else 50))
        }

    def cleanup(self):
        """Mematikan seluruh output saat shutdown"""
        self._running = False
        self._hw_set_outputs(False, False)
        if self.dev_up:
            try: self.dev_up.close()
            except Exception: pass
        if self.dev_down:
            try: self.dev_down.close()
            except Exception: pass

# Singleton instance
hydraulic_controller = HydraulicController()
