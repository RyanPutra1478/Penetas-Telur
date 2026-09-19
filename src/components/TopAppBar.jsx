import React, { useState } from 'react';
import { exitKiosk } from '../api/tetascoApi';

const TopAppBar = () => {
  const [cloud,   setCloud]   = useState(true);
  const [network, setNetwork] = useState(true);
  const [alarm,   setAlarm]   = useState(false);

  const statusItems = [
    { key:'cloud',   icon:'cloud_sync',            label:'Cloud',   on: cloud,   set: setCloud,   colorOn:'#22C55E', bgOn:'#DCFCE7', textOn:'#166534' },
    { key:'network', icon:'wifi',                   label:'Network', on: network, set: setNetwork, colorOn:'#3B82F6', bgOn:'#DBEAFE', textOn:'#1E40AF' },
    { key:'alarm',   icon:'notifications_active',   label:'Alarm',   on: alarm,   set: setAlarm,   colorOn:'#EF4444', bgOn:'#FEE2E2', textOn:'#991B1B' },
  ];

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
      {/* Brand: Tetasco with Indonesian Batik Heritage Accent */}
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
          {/* Subtle Kawung Batik watermark on logo */}
          <div className="batik-overlay-white" style={{ position: 'absolute', inset: 0, opacity: 0.3 }} />
          <span className="material-symbols-rounded" style={{ fontSize: 25, color: '#FFF', position: 'relative', zIndex: 1 }}>egg_alt</span>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 15, fontWeight: 900, color: '#0F172A', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              Tetasco
            </span>
            <span style={{
              fontSize: 8, fontWeight: 900,
              background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
              color: '#B45309',
              border: '1px solid #FCD34D',
              padding: '1.5px 5px', borderRadius: 5,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.08em',
              display: 'inline-flex', alignItems: 'center', gap: 3,
            }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#D97706' }} />
              BATIK ID
            </span>
          </div>
          <div style={{ fontSize: 8.5, fontWeight: 700, color: '#64748B', letterSpacing: '0.04em', textTransform: 'uppercase', marginTop: 2 }}>
            Smart Incubator HMI · Nusantara v1.0
          </div>
        </div>
      </div>

      {/* Status Buttons & Exit Button */}
      <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
        {statusItems.map(item => (
          <button key={item.key} onClick={() => item.set(!item.on)} style={{
            height: 32,
            padding: '0 11px',
            borderRadius: 999,
            border: 'none',
            display: 'flex', alignItems: 'center', gap: 5,
            background: item.on ? item.bgOn : '#F1F5F9',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: item.on ? `0 0 0 1.5px ${item.colorOn}40` : 'none',
          }}>
            <span className="material-symbols-rounded" style={{
              fontSize: 15,
              color: item.on ? item.colorOn : '#94A3B8',
              transition: 'color 0.2s',
            }}>{item.icon}</span>
            <span style={{
              fontSize: 8.5, fontWeight: 800, letterSpacing: '0.05em',
              color: item.on ? item.textOn : '#94A3B8',
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: 'uppercase',
            }}>{item.label}</span>
          </button>
        ))}

        <div style={{ width: 1, height: 20, background: '#E2E8F0', margin: '0 2px' }} />

        {/* Tombol Tutup Tampilan Kiosk (F11) */}
        <button
          onClick={handleExitApp}
          title="Tutup Tampilan HMI (F11)"
          style={{
            height: 32,
            padding: '0 10px',
            borderRadius: 999,
            border: '1.5px solid #FECACA',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            background: '#FEF2F2',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 4px rgba(239,68,68,0.12)',
          }}
        >
          <span
            className="material-symbols-rounded"
            style={{ fontSize: 15, color: '#EF4444' }}
          >
            power_settings_new
          </span>
          <span style={{
            fontSize: 8.5,
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
  );
};

export default TopAppBar;
