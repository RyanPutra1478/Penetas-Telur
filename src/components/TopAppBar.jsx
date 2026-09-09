import React, { useState } from 'react';

const TopAppBar = () => {
  const [cloud,   setCloud]   = useState(true);
  const [network, setNetwork] = useState(true);
  const [alarm,   setAlarm]   = useState(false);

  const statusItems = [
    { key:'cloud',   icon:'cloud_sync',            label:'Cloud',   on: cloud,   set: setCloud,   colorOn:'#22C55E', bgOn:'#DCFCE7', textOn:'#166534' },
    { key:'network', icon:'wifi',                   label:'Network', on: network, set: setNetwork, colorOn:'#3B82F6', bgOn:'#DBEAFE', textOn:'#1E40AF' },
    { key:'alarm',   icon:'notifications_active',   label:'Alarm',   on: alarm,   set: setAlarm,   colorOn:'#EF4444', bgOn:'#FEE2E2', textOn:'#991B1B' },
  ];

  return (
    <header style={{
      background: '#FFFFFF',
      borderBottom: '1px solid #E2E8F0',
      boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      padding: '0 18px',
      height: 56,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
      zIndex: 20,
      position: 'relative',
    }}>
      {/* Brand: Tetasco with Indonesian Batik Heritage Accent */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 38, height: 38,
          borderRadius: 11,
          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #D97706 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 3px 10px rgba(124,58,237,0.32)',
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Subtle Kawung Batik watermark on logo */}
          <div className="batik-overlay-white" style={{ position: 'absolute', inset: 0, opacity: 0.3 }} />
          <span className="material-symbols-rounded" style={{ fontSize: 22, color: '#FFF', position: 'relative', zIndex: 1 }}>egg_alt</span>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              Tetasco
            </span>
            <span style={{
              fontSize: 9, fontWeight: 900,
              background: 'linear-gradient(135deg, #FEF3C7, #FDE68A)',
              color: '#B45309',
              border: '1px solid #FCD34D',
              padding: '1.5px 6px', borderRadius: 5,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.08em',
              display: 'inline-flex', alignItems: 'center', gap: 3,
            }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#D97706' }} />
              BATIK ID
            </span>
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', letterSpacing: '0.05em', textTransform: 'uppercase', marginTop: 1 }}>
            Smart Incubator HMI · Nusantara v1.0
          </div>
        </div>
      </div>

      {/* Status Buttons */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {statusItems.map(item => (
          <button key={item.key} onClick={() => item.set(!item.on)} style={{
            height: 32,
            padding: '0 13px',
            borderRadius: 999,
            border: 'none',
            display: 'flex', alignItems: 'center', gap: 6,
            background: item.on ? item.bgOn : '#F1F5F9',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: item.on ? `0 0 0 1.5px ${item.colorOn}40` : 'none',
          }}>
            <span className="material-symbols-rounded" style={{
              fontSize: 16,
              color: item.on ? item.colorOn : '#94A3B8',
              transition: 'color 0.2s',
            }}>{item.icon}</span>
            <span style={{
              fontSize: 10.5, fontWeight: 800, letterSpacing: '0.05em',
              color: item.on ? item.textOn : '#94A3B8',
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: 'uppercase',
            }}>{item.label}</span>
          </button>
        ))}
      </div>
      <div className="batik-ribbon-strip" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }} />
    </header>
  );
};

export default TopAppBar;
