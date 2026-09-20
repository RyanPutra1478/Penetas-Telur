import os
import platform
import logging
from .hydraulic_controller import hydraulic_controller

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] %(levelname)s %(name)s: %(message)s')
logger = logging.getLogger("GPIOController")

# =========================================================
# PEMETAAN 5-CHANNEL RELAY (ACTIVE-HIGH)
# Channel 1: Lampu Pemanas 1
# Channel 2: Lampu Pemanas 2
# Channel 3: Kipas Sirkulasi
# Channel 4: Mist Maker / Pelembab Udara
# Channel 5: Lampu UV Sterilisasi
# =========================================================
PIN_CONFIG = {
    'lamp_1':     {'pin': 22, 'active_high': True, 'label': 'Lampu Pemanas 1 (Relay IN1)'},
    'lamp_2':     {'pin': 26, 'active_high': True, 'label': 'Lampu Pemanas 2 (Relay IN2)'},
    'fan':        {'pin': 4,  'active_high': True, 'label': 'Kipas Sirkulasi (Relay IN3)'},
    'mist_maker': {'pin': 17, 'active_high': True, 'label': 'Mist Maker Pelembab (Relay IN4)'},
    'uv_light':   {'pin': 27, 'active_high': True, 'label': 'Lampu UV Sterilisasi (Relay IN5)'},
}

class GPIOController:
    """
    Controller GPIO 5-Channel Relay untuk Raspberry Pi 4 dengan fallback simulasi otomatis
    jika dijalankan pada OS non-Linux / mesin pengembang.
    """
    def __init__(self):
        self.is_simulated = False
        self.devices = {}
        self.states = {name: False for name in PIN_CONFIG}
        self._init_hardware()

    def _init_hardware(self):
        if platform.system().lower() != "linux":
            logger.info("Sistem bukan Linux (Deteksi: %s). Mengaktifkan mode SIMULASI GPIO 5-Channel.", platform.system())
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
            logger.info("GPIO 5-Channel Hardware berhasil diinisialisasi via gpiozero (RPi 4)")
        except Exception as e:
            logger.warning("Gagal inisialisasi gpiozero hardware: %s. Beralih ke SIMULASI GPIO.", e)
            self.is_simulated = True

    def set_actuator(self, name: str, state: bool) -> bool:
        """Mengatur status on/off sebuah aktuator relay"""
        b_state = bool(state)

        # Dukungan alias backward compatibility
        if name == 'heater':
            self.set_actuator('lamp_1', b_state)
            self.set_actuator('lamp_2', b_state)
            return b_state
        elif name == 'humidifier':
            return self.set_actuator('mist_maker', b_state)
        elif name in ('motor', 'aux'):
            # Mengaktifkan/mematikan osilasi bolak-balik penggerak rak hidrolik
            if b_state:
                hydraulic_controller.start_oscillation()
            else:
                hydraulic_controller.stop_oscillation()
            return b_state

        if name not in PIN_CONFIG:
            raise ValueError(f"Aktuator tidak dikenal: {name}")

        self.states[name] = b_state
        cfg = PIN_CONFIG[name]

        if not self.is_simulated and name in self.devices:
            dev = self.devices[name]
            if b_state:
                dev.on()
            else:
                dev.off()
            logger.info("[HARDWARE] %s (GPIO %d) -> %s", cfg['label'], cfg['pin'], 'ON' if b_state else 'OFF')
        else:
            logger.info("[SIMULASI] %s (GPIO %d) -> %s", cfg['label'], cfg['pin'], 'ON' if b_state else 'OFF')

        return self.states[name]

    def get_actuator(self, name: str) -> bool:
        """Mendapatkan status terkini sebuah aktuator"""
        if name == 'heater':
            return self.states.get('lamp_1', False) or self.states.get('lamp_2', False)
        elif name == 'humidifier':
            return self.states.get('mist_maker', False)
        elif name in ('motor', 'aux'):
            return hydraulic_controller.is_oscillating
        return self.states.get(name, False)

    def get_all_actuators(self) -> dict:
        """Mendapatkan status seluruh aktuator (termasuk alias untuk UI)"""
        res = dict(self.states)
        # Tambahkan alias kemudahan integrasi UI
        res['heater'] = res.get('lamp_1', False) or res.get('lamp_2', False)
        res['humidifier'] = res.get('mist_maker', False)
        res['motor'] = hydraulic_controller.is_oscillating
        res['hydraulic_state'] = hydraulic_controller.state
        res['limit_max'] = hydraulic_controller.limit_max
        res['limit_min'] = hydraulic_controller.limit_min
        return res

    def emergency_stop(self) -> dict:
        """Matikan seluruh relay dan motor hidrolik secara seketika demi keselamatan"""
        logger.warning("EMERGENCY STOP DIPICU! Mematikan semua aktuator & hidrolik.")
        for name in PIN_CONFIG:
            self.set_actuator(name, False)
        hydraulic_controller.stop()
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
        hydraulic_controller.cleanup()

# Singleton controller
gpio_controller = GPIOController()
