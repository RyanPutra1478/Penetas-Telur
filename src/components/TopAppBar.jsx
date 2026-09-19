import React, { useState, useEffect } from 'react';
import { getWifiStatus, exitKiosk } from '../api/tetascoApi';
import WifiModal from './WifiModal';

const TopAppBar = () => {
  const [wifiModalOpen, setWifiModalOpen] = useState(false);
  const [wifiStatus, setWifiStatus] = useState({ connected: true, ssid: null });

  // Ambil status Wi-Fi saat komponen dimuat
  useEffect(() => {
    let isMounted = true;
    const checkWifi = async () => {
      const status = await getWifiStatus();
      if (isMounted && status) {
        setWifiStatus(status);
      }
    };

    checkWifi();
    const interval = setInterval(checkWifi, 10000); // Poll status setiap 10 detik
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleExitApp = () => {
    if (window.confirm('Tutup tampilan HMI dan kembali ke Desktop Raspberry Pi? (F11)')) {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      exitKiosk();
      window.close();
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

        {/* Action Buttons: Network & Tombol Keluar (Debugging) */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
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

          {/* Tombol Keluar UI untuk Debugging */}
          <button
            onClick={handleExitApp}
            title="Tutup Tampilan HMI untuk Debugging (F11)"
            style={{
              height: 36,
              padding: '0 12px',
              borderRadius: 999,
              border: '1.5px solid #FECACA',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: '#FEF2F2',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: '0 1px 4px rgba(239,68,68,0.12)',
            }}
          >
            <span
              className="material-symbols-rounded"
              style={{ fontSize: 16, color: '#EF4444' }}
            >
              power_settings_new
            </span>
            <span style={{
              fontSize: 9.5,
              fontWeight: 900,
              letterSpacing: '0.05em',
              color: '#DC2626',
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: 'uppercase',
            }}>
              KELUAR (F11)
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
    </>
  );
};

export default TopAppBar;
