/**
 * TETASCO CONNECT — API CLIENT
 * Klien komunikasi lokal antara React HMI dan Python Backend (localhost:5001)
 * Berjalan offline tanpa memerlukan koneksi internet.
 */

const API_BASE = '/api';

/**
 * Memeriksa status kesehatan backend & GPIO controller
 */
export async function getHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[TetascoAPI] Gagal membaca health status:', err.message);
    return { status: 'offline', simulated: true };
  }
}

/**
 * Mendapatkan data telemetri sensor suhu & kelembaban real-time
 */
export async function getSensorData() {
  try {
    const res = await fetch(`${API_BASE}/sensor`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[TetascoAPI] Gagal membaca sensor:', err.message);
    return null;
  }
}

/**
 * Mendapatkan status seluruh relay aktuator
 */
export async function getActuators() {
  try {
    const res = await fetch(`${API_BASE}/actuators`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[TetascoAPI] Gagal membaca status aktuator:', err.message);
    return null;
  }
}

/**
 * Mengubah status sebuah aktuator (heater, fan, humidifier, motor)
 * @param {'heater'|'fan'|'humidifier'|'motor'} name 
 * @param {boolean} state 
 */
export async function setActuator(name, state) {
  try {
    const res = await fetch(`${API_BASE}/actuators/${name}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state: Boolean(state) }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[TetascoAPI] Gagal mengubah aktuator ${name}:`, err.message);
    return null;
  }
}

/**
 * Menghentikan semua aktuator secara darurat (Emergency Stop)
 */
export async function emergencyStop() {
  try {
    const res = await fetch(`${API_BASE}/emergency-stop`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[TetascoAPI] Gagal memicu emergency stop:', err.message);
    return null;
  }
}

/**
 * Mengambil pengaturan mode kontrol otomatis saat ini
 */
export async function getControlMode() {
  try {
    const res = await fetch(`${API_BASE}/control/mode`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[TetascoAPI] Gagal mengambil control mode:', err.message);
    return null;
  }
}

/**
 * Mengatur parameter kontrol cerdas (Auto/Manual, target suhu, target kelembaban, profil)
 * @param {{ auto?: boolean, target_temp?: number, target_hum?: number, profile?: string }} config 
 */
export async function setControlMode(config) {
  try {
    const res = await fetch(`${API_BASE}/control/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[TetascoAPI] Gagal menyimpan control mode:', err.message);
    return null;
  }
}

/**
 * Menutup Chromium Kiosk dan kembali ke desktop OS
 */
export async function exitKiosk() {
  try {
    const res = await fetch(`${API_BASE}/system/exit-kiosk`, { method: 'POST' });
    return await res.json();
  } catch (err) {
    console.warn('[TetascoAPI] Gagal keluar dari kiosk:', err.message);
    return null;
  }
}

/**
 * Restart Raspberry Pi
 */
export async function rebootSystem() {
  try {
    const res = await fetch(`${API_BASE}/system/reboot`, { method: 'POST' });
    return await res.json();
  } catch (err) {
    console.warn('[TetascoAPI] Gagal reboot sistem:', err.message);
    return null;
  }
}

/**
 * Shutdown Raspberry Pi
 */
export async function shutdownSystem() {
  try {
    const res = await fetch(`${API_BASE}/system/shutdown`, { method: 'POST' });
    return await res.json();
  } catch (err) {
    console.warn('[TetascoAPI] Gagal shutdown sistem:', err.message);
    return null;
  }
}
