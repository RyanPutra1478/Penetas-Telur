import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getWifiStatus, getCloudStatus, getControlMode } from '../api/tetascoApi';
import WifiModal from './WifiModal';
import CloudModal from './CloudModal';

const TopAppBar = () => {
  const navigate = useNavigate();
  const [wifiModalOpen, setWifiModalOpen] = useState(false);
  const [cloudModalOpen, setCloudModalOpen] = useState(false);
  const [wifiStatus, setWifiStatus] = useState({ connected: true, ssid: null });
  const [cloudStatus, setCloudStatus] = useState({ is_online: false, mode: 'offline', cloud_url: 'https://tetasco.my.id' });
  const [deviceStatus, setDeviceStatus] = useState('STANDBY');
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));

  // Ambil status Wi-Fi, Cloud, dan Status Perangkat saat komponen dimuat
  useEffect(() => {
    let isMounted = true;
    const checkStatus = async () => {
      try {
        const [wStatus, cStatus, ctrl] = await Promise.all([
          getWifiStatus(),
          getCloudStatus(),
          getControlMode(),
        ]);
        if (isMounted) {
          if (wStatus) setWifiStatus(wStatus);
          if (cStatus) setCloudStatus(cStatus);
          if (ctrl && ctrl.device_status) setDeviceStatus(ctrl.device_status);
        }
      } catch (e) {
        // Safe failover
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 4000); // Poll status setiap 4 detik

    // Event listener untuk update status fullscreen saat berubah
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    return () => {
      isMounted = false;
      clearInterval(interval);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Fungsi toggle Maximize / Minimize
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  };

  return (
    <>
      <header style={{
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        padding: '0 20px',
        height: 68,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        zIndex: 20,
        position: 'relative',
      }}>
        {/* Brand: Tetasco Logo & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44,
            borderRadius: 13,
            background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #D97706 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(124,58,237,0.35)',
            flexShrink: 0,
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div className="batik-overlay-white" style={{ position: 'absolute', inset: 0, opacity: 0.3 }} />
            <span className="material-symbols-rounded" style={{ fontSize: 25, color: '#FFF', position: 'relative', zIndex: 1 }}>egg_alt</span>
          </div>
          <div>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              Tetasco
            </span>
          </div>
        </div>

        {/* Action Buttons: Status Perangkat, Network, Cloud Sync, & Tombol Maximize/Minimize */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {/* Tombol Status Perangkat (SIAGA / AKTIF) */}
          <button
            onClick={() => navigate('/control')}
            title={deviceStatus === 'RUNNING' ? 'Status: AKTIF (Inkubasi Berjalan) — Klik untuk Buka Kontrol' : 'Status: SIAGA (Standby) — Klik untuk Pilih Telur & Mulai'}
            style={{
              height: 36,
              padding: '0 12px',
              borderRadius: 999,
              border: deviceStatus === 'RUNNING' ? '1.5px solid #86EFAC' : '1.5px solid #FCD34D',
              display: 'flex', alignItems: 'center', gap: 6,
              background: deviceStatus === 'RUNNING' ? '#F0FDF4' : '#FFFBEB',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: deviceStatus === 'RUNNING' ? '0 0 0 1.5px rgba(34,197,94,0.2)' : '0 0 0 1.5px rgba(245,158,11,0.2)',
            }}
          >
            <span className="material-symbols-rounded" style={{
              fontSize: 18,
              color: deviceStatus === 'RUNNING' ? '#16A34A' : '#D97706',
              transition: 'color 0.2s',
            }}>
              {deviceStatus === 'RUNNING' ? 'play_circle' : 'pause_circle'}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 900, letterSpacing: '0.05em',
              color: deviceStatus === 'RUNNING' ? '#15803D' : '#B45309',
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: 'uppercase',
            }}>
              {deviceStatus === 'RUNNING' ? 'AKTIF' : 'SIAGA'}
            </span>
          </button>

          {/* Tombol Dual-Mode Cloud Sync (Online / Offline) */}
          <button
            onClick={() => setCloudModalOpen(true)}
            title="Status Cloud Sync (tetasco.my.id) — Klik untuk detail & pengaturan"
            style={{
              height: 36,
              padding: '0 13px',
              borderRadius: 999,
              border: cloudStatus.is_online ? '1.5px solid #A7F3D0' : '1.5px solid #E2E8F0',
              display: 'flex', alignItems: 'center', gap: 6,
              background: cloudStatus.is_online ? '#ECFDF5' : '#F8FAFC',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: cloudStatus.is_online ? '0 0 0 1.5px rgba(16,185,129,0.2)' : 'none',
            }}
          >
            <span className="material-symbols-rounded" style={{
              fontSize: 18,
              color: cloudStatus.is_online ? '#059669' : '#94A3B8',
              transition: 'color 0.2s',
            }}>
              {cloudStatus.is_online ? 'cloud_done' : 'cloud_off'}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 900, letterSpacing: '0.05em',
              color: cloudStatus.is_online ? '#065F46' : '#64748B',
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: 'uppercase',
            }}>
              {cloudStatus.is_online ? 'ONLINE' : 'OFFLINE'}
            </span>
          </button>

          {/* Tombol Network / Wi-Fi Service */}
          <button
            onClick={() => setWifiModalOpen(true)}
            title="Buka Pengaturan Wi-Fi"
            style={{
              height: 36,
              padding: '0 14px',
              borderRadius: 999,
              border: wifiStatus.connected ? '1.5px solid #BFDBFE' : '1.5px solid #E2E8F0',
              display: 'flex', alignItems: 'center', gap: 7,
              background: wifiStatus.connected ? '#EFF6FF' : '#F1F5F9',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: wifiStatus.connected ? '0 0 0 1.5px rgba(59,130,246,0.25)' : 'none',
            }}
          >
            <span className="material-symbols-rounded" style={{
              fontSize: 18,
              color: wifiStatus.connected ? '#2563EB' : '#94A3B8',
              transition: 'color 0.2s',
            }}>
              {wifiStatus.connected ? 'wifi' : 'wifi_off'}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: '0.05em',
              color: wifiStatus.connected ? '#1E40AF' : '#64748B',
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: 'uppercase',
            }}>
              {wifiStatus.connected && wifiStatus.ssid ? wifiStatus.ssid : 'NETWORK'}
            </span>
          </button>

          <div style={{ width: 1, height: 22, background: '#E2E8F0', margin: '0 2px' }} />

          {/* Tombol Maximize / Minimize (Toggle Layar Penuh untuk VNC) */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? "Kecilkan Layar / Mode Jendela (Minimize)" : "Perbesar ke Layar Penuh (Maximize)"}
            style={{
              height: 36,
              padding: '0 13px',
              borderRadius: 999,
              border: isFullscreen ? '1.5px solid #CBD5E1' : '1.5px solid #BFDBFE',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: isFullscreen ? '#F8FAFC' : '#EFF6FF',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}
          >
            <span
              className="material-symbols-rounded"
              style={{ fontSize: 18, color: isFullscreen ? '#475569' : '#2563EB' }}
            >
              {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
            </span>
            <span style={{
              fontSize: 9.5,
              fontWeight: 900,
              letterSpacing: '0.05em',
              color: isFullscreen ? '#334155' : '#1D4ED8',
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: 'uppercase',
            }}>
              {isFullscreen ? 'KECILKAN' : 'PERBESAR'}
            </span>
          </button>
        </div>

        <div className="batik-ribbon-strip" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} />
      </header>

      {/* Popup Layanan Wi-Fi */}
      <WifiModal
        isOpen={wifiModalOpen}
        onClose={() => setWifiModalOpen(false)}
        onStatusChange={(isConnected) => {
          setWifiStatus(prev => ({ ...prev, connected: isConnected }));
        }}
      />

      {/* Popup Layanan Cloud Sync & Dual-Mode */}
      <CloudModal
        isOpen={cloudModalOpen}
        onClose={() => setCloudModalOpen(false)}
        cloudStatus={cloudStatus}
        onRefresh={() => {
          getCloudStatus().then(st => st && setCloudStatus(st));
        }}
      />
    </>
  );
};

export default TopAppBar;
