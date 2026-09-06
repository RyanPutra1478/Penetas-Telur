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
      boxShadow: '0 2px 10px rgba(0,0,0,0.07)',
      padding: '0 20px',
      height: 84,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
      zIndex: 20,
    }}>
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 52, height: 52,
          borderRadius: 15,
          background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 6px 16px rgba(139,92,246,0.4)',
          flexShrink: 0,
        }}>
          <span className="material-symbols-rounded" style={{ fontSize: 28, color: '#FFF' }}>egg_alt</span>
        </div>
        <div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            OVO-INCUBATOR
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>
            Smart HMI · v1.0
          </div>
        </div>
      </div>

      {/* Status Buttons */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {statusItems.map(item => (
          <button key={item.key} onClick={() => item.set(!item.on)} style={{
            height: 42,
            padding: '0 18px',
            borderRadius: 999,
            border: 'none',
            display: 'flex', alignItems: 'center', gap: 8,
            background: item.on ? item.bgOn : '#F1F5F9',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: item.on ? `0 0 0 2px ${item.colorOn}40` : 'none',
          }}>
            <span className="material-symbols-rounded" style={{
              fontSize: 20,
              color: item.on ? item.colorOn : '#94A3B8',
              transition: 'color 0.2s',
            }}>{item.icon}</span>
            <span style={{
              fontSize: 12, fontWeight: 700, letterSpacing: '0.06em',
              color: item.on ? item.textOn : '#94A3B8',
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: 'uppercase',
            }}>{item.label}</span>
          </button>
        ))}
      </div>
    </header>
  );
};

export default TopAppBar;
