import os
import platform
import logging

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s %(name)s: %(message)s')
logger = logging.getLogger("GPIOController")

# Mapping Pin BCM Hardware
PIN_CONFIG = {
    'heater': {'pin': 22, 'active_high': False, 'label': 'Pemanas (Relay IN1)'},
    'fan': {'pin': 26, 'active_high': True, 'label': 'Kipas Sirkulasi (Relay IN2)'},
    'humidifier': {'pin': 4, 'active_high': True, 'label': 'Pelembab Udara (Relay IN3)'},
    'motor': {'pin': 13, 'active_high': True, 'label': 'Motor Pembalik Rak (Relay IN4)'},
}

class GPIOController:
    """
    Controller GPIO untuk Raspberry Pi 4 dengan fallback simulasi otomatis
    jika dijalankan pada OS non-Linux / mesin pengembang.
    """
    def __init__(self):
        self.is_simulated = False
        self.devices = {}
        self.states = {name: False for name in PIN_CONFIG}
        self._init_hardware()

    def _init_hardware(self):
        # Deteksi apakah berjalan pada Raspberry Pi / Linux dengan gpiozero
        if platform.system().lower() != "linux":
            logger.info("Sistem bukan Linux (Deteksi: %s). Mengaktifkan mode SIMULASI GPIO.", platform.system())
            self.is_simulated = True
            return

        try:
            from gpiozero import DigitalOutputDevice
            for name, cfg in PIN_CONFIG.items():
                dev = DigitalOutputDevice(
                    pin=cfg['pin'],
                    active_high=cfg['active_high'],
                    initial_value=False
                )
                self.devices[name] = dev
            logger.info("GPIO Hardware berhasil diinisialisasi via gpiozero (RPi 4)")
        except Exception as e:
            logger.warning("Gagal inisialisasi gpiozero hardware: %s. Beralih ke SIMULASI GPIO.", e)
            self.is_simulated = True

    def set_actuator(self, name: str, state: bool) -> bool:
        """Mengatur status on/off sebuah aktuator (heater, fan, humidifier, motor)"""
        if name not in PIN_CONFIG:
            raise ValueError(f"Aktuator tidak dikenal: {name}")

        self.states[name] = bool(state)
        cfg = PIN_CONFIG[name]

        if not self.is_simulated and name in self.devices:
            dev = self.devices[name]
            if state:
                dev.on()
            else:
                dev.off()
            logger.info("[HARDWARE] %s (GPIO %d) -> %s", cfg['label'], cfg['pin'], 'ON' if state else 'OFF')
        else:
            logger.info("[SIMULASI] %s (GPIO %d) -> %s", cfg['label'], cfg['pin'], 'ON' if state else 'OFF')

        return self.states[name]

    def get_actuator(self, name: str) -> bool:
        """Mendapatkan status terkini sebuah aktuator"""
        return self.states.get(name, False)

    def get_all_actuators(self) -> dict:
        """Mendapatkan status seluruh aktuator"""
        return dict(self.states)

    def emergency_stop(self) -> dict:
        """Matikan seluruh relay/aktuator secara seketika demi keselamatan"""
        logger.warning("EMERGENCY STOP DIPICU! Mematikan semua aktuator.")
        for name in PIN_CONFIG:
            self.set_actuator(name, False)
        return self.get_all_actuators()

    def cleanup(self):
        """Membersihkan resource GPIO saat aplikasi ditutup"""
        logger.info("Membersihkan resource GPIO...")
        for name, dev in self.devices.items():
            try:
                dev.off()
                dev.close()
            except Exception:
                pass
        self.devices.clear()

# Singleton controller
gpio_controller = GPIOController()
