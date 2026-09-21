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

/**
 * Mendapatkan status motor hidrolik, sensor limit MAX & MIN, dan mode operasi
 */
export async function getHydraulicStatus() {
  try {
    const res = await fetch(`${API_BASE}/hydraulic/status`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[TetascoAPI] Gagal membaca status hidrolik:', err.message);
    return null;
  }
}

/**
 * Mengirim perintah manual gerakan hidrolik ('up', 'down', 'stop')
 * @param {'up'|'down'|'stop'} action 
 */
export async function setHydraulicCommand(action) {
  try {
    const res = await fetch(`${API_BASE}/hydraulic/command`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn(`[TetascoAPI] Gagal kirim perintah hidrolik ${action}:`, err.message);
    return null;
  }
}

/**
 * Mengatur mode hidrolik ('MANUAL' atau 'AUTO') serta interval putar telur (menit)
 * @param {'MANUAL'|'AUTO'} mode 
 * @param {number} [intervalMinutes] 
 */
export async function setHydraulicMode(mode, intervalMinutes) {
  try {
    const res = await fetch(`${API_BASE}/hydraulic/mode`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, interval_minutes: intervalMinutes }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[TetascoAPI] Gagal mengatur mode hidrolik:', err.message);
    return null;
  }
}

/**
 * Mendapatkan status Wi-Fi terkini
 */
export async function getWifiStatus() {
  try {
    const res = await fetch(`${API_BASE}/wifi/status`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[TetascoAPI] Gagal membaca status Wi-Fi:', err.message);
    return { connected: false, ssid: null, ip: null, signal: 0 };
  }
}

/**
 * Memindai jaringan Wi-Fi di sekitar
 */
export async function scanWifi() {
  try {
    const res = await fetch(`${API_BASE}/wifi/scan`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[TetascoAPI] Gagal memindai Wi-Fi:', err.message);
    return [];
  }
}

/**
 * Menghubungkan ke jaringan Wi-Fi
 * @param {string} ssid 
 * @param {string} [password] 
 */
export async function connectWifi(ssid, password) {
  try {
    const res = await fetch(`${API_BASE}/wifi/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ssid, password: password || '' }),
    });
    return await res.json();
  } catch (err) {
    console.warn('[TetascoAPI] Gagal menghubungkan ke Wi-Fi:', err.message);
    return { success: false, message: err.message };
  }
}

/**
 * Memutuskan sambungan Wi-Fi
 */
export async function disconnectWifi() {
  try {
    const res = await fetch(`${API_BASE}/wifi/disconnect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return await res.json();
  } catch (err) {
    console.warn('[TetascoAPI] Gagal memutus Wi-Fi:', err.message);
    return { success: false, message: err.message };
  }
}

/**
 * Mendapatkan status Cloud Sync (Dual-Mode: Online/Offline)
 */
export async function getCloudStatus() {
  try {
    const res = await fetch(`${API_BASE}/cloud/status`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return { is_online: false, mode: 'offline', cloud_url: 'https://tetasco.my.id', last_sync_status: 'Offline (Lokal)' };
  }
}

/**
 * Memicu sinkronisasi cloud manual seketika
 */
export async function triggerCloudSync() {
  try {
    const res = await fetch(`${API_BASE}/cloud/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    return await res.json();
  } catch (err) {
    return { is_online: false, mode: 'offline', last_error: err.message };
  }
}

/**
 * Memperbarui konfigurasi cloud (ID perangkat, interval)
 */
export async function setCloudConfig(config) {
  try {
    const res = await fetch(`${API_BASE}/cloud/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return await res.json();
  } catch (err) {
    return null;
  }
}

/**
 * Mendapatkan profil peternak dan lemari inkubator
 */
export async function getFarmerProfile() {
  try {
    const res = await fetch(`${API_BASE}/profile`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[TetascoAPI] Gagal membaca profil peternak:', err.message);
    return null;
  }
}

/**
 * Memperbarui profil peternak dan lemari inkubator secara persisten
 * @param {Object} data 
 */
export async function updateFarmerProfile(data) {
  try {
    const res = await fetch(`${API_BASE}/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn('[TetascoAPI] Gagal memperbarui profil:', err.message);
    return null;
  }
}



