import React, { useState } from 'react';

/* Reusable colored section card */
const SectionCard = ({ title, color, bg, border, icon, children, style = {} }) => (
  <div style={{
    background: bg,
    borderRadius: 18,
    border: `1.5px solid ${border}`,
    padding: '14px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    ...style,
  }}>
    {title && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
        {icon && <span className="material-symbols-rounded" style={{ fontSize: 20, color }}>{icon}</span>}
        <span style={{ fontSize: 12, fontWeight: 700, color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{title}</span>
      </div>
    )}
    {children}
  </div>
);

const profiles = [
  { name: 'AYAM',   durasi: '21 hr', temp: 37.8, hum: 55, color: '#F97316', bg: '#FFF7ED', border: '#FED7AA', icon: 'egg' },
  { name: 'BEBEK',  durasi: '28 hr', temp: 37.5, hum: 60, color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE', icon: 'egg' },
  { name: 'PUYUH',  durasi: '18 hr', temp: 37.7, hum: 50, color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE', icon: 'egg' },
  { name: 'KALKUN', durasi: '28 hr', temp: 37.5, hum: 55, color: '#14B8A6', bg: '#F0FDFA', border: '#99F6E4', icon: 'egg' },
  { name: 'ANGSA',  durasi: '30 hr', temp: 37.6, hum: 65, color: '#EC4899', bg: '#FDF2F8', border: '#FBCFE8', icon: 'egg' },
  { name: 'KUSTOM', durasi: 'Manual', temp: 37.5, hum: 55, color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0', icon: 'tune' },
];

const KontrolLingkungan = () => {
  const [selected, setSelected] = useState(0);
  const [temp, setTemp] = useState(profiles[0].temp);
  const [hum,  setHum]  = useState(profiles[0].hum);
  const [isAuto, setIsAuto] = useState(true);

  const p = profiles[selected];
  const isKustom = p.name === 'KUSTOM';
  const canAdjust = isKustom || !isAuto;

  const selectProfile = (idx) => {
    setSelected(idx);
    setTemp(profiles[idx].temp);
    setHum(profiles[idx].hum);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>

      {/* Profile Row */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {profiles.map((pr, i) => {
          const active = selected === i;
          return (
            <button key={pr.name} onClick={() => selectProfile(i)} style={{
              flex: 1,
              padding: '10px 6px',
              borderRadius: 14,
              border: `2px solid ${active ? pr.color : pr.border}`,
              background: active ? pr.bg : '#FFFFFF',
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              boxShadow: active ? `0 4px 12px ${pr.color}30` : '0 1px 4px rgba(0,0,0,0.06)',
              transition: 'all 0.2s ease',
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 22, color: active ? pr.color : '#94A3B8' }}>{pr.icon}</span>
              <span style={{ fontSize: 10, fontWeight: 800, color: active ? pr.color : '#94A3B8', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>{pr.name}</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: active ? pr.color : '#CBD5E1' }}>{pr.durasi}</span>
            </button>
          );
        })}
      </div>

      {/* Active Profile Info Bar */}
      <div style={{
        background: `linear-gradient(135deg, ${p.color}18 0%, ${p.color}08 100%)`,
        border: `1.5px solid ${p.color}40`,
        borderRadius: 12,
        padding: '8px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: p.color, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em' }}>
            PROFIL: {p.name} · {p.durasi}
          </span>
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, color: p.color, fontFamily: "'JetBrains Mono', monospace" }}>
          Target: {temp.toFixed(1)}°C · {hum}% RH
        </span>
      </div>

      {/* Main Controls */}
      <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0 }}>

        {/* Temperature */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
          borderRadius: 18, border: '1.5px solid #FED7AA',
          padding: '16px', display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#C2410C', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Suhu Target</span>
            <span className="material-symbols-rounded" style={{ fontSize: 22, color: '#EA580C' }}>device_thermostat</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <span style={{ fontSize: 64, fontWeight: 900, color: '#EA580C', lineHeight: 1, fontFamily: "'JetBrains Mono', monospace" }}>{temp.toFixed(1)}</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#FB923C' }}>°C</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['−', () => setTemp(t => Math.max(20, +(t-0.1).toFixed(1)))], ['+', () => setTemp(t => Math.min(45, +(t+0.1).toFixed(1)))]].map(([lbl, fn]) => (
              <button key={lbl} onClick={fn} disabled={!canAdjust} style={{
                flex: 1, height: 52, borderRadius: 12, fontSize: 26, fontWeight: 800,
                border: 'none', cursor: canAdjust ? 'pointer' : 'not-allowed',
                background: canAdjust ? '#FFEDD5' : '#F1F5F9',
                color: canAdjust ? '#EA580C' : '#CBD5E1',
                boxShadow: canAdjust ? '0 2px 8px rgba(234,88,12,0.2)' : 'none',
                transition: 'all 0.15s',
              }}>{lbl}</button>
            ))}
          </div>
        </div>

        {/* Mode */}
        <div style={{ width: 130, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{
            flex: 1, background: '#FFFFFF', borderRadius: 18,
            border: '1.5px solid #E2E8F0', padding: '14px 12px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Mode</span>
            {/* Vertical flip toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: isAuto ? '#6366F1' : '#CBD5E1', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em' }}>AUTO</span>
              <button onClick={() => setIsAuto(!isAuto)} style={{
                width: 38, height: 80, borderRadius: 999,
                background: isAuto ? '#EEF2FF' : '#FEE2E2',
                border: `2px solid ${isAuto ? '#818CF8' : '#FCA5A5'}`,
                cursor: 'pointer', position: 'relative',
                transition: 'all 0.3s ease',
              }}>
                <div style={{
                  position: 'absolute', left: '50%', transform: 'translateX(-50%)',
                  top: isAuto ? 4 : 'auto', bottom: isAuto ? 'auto' : 4,
                  width: 26, height: 26, borderRadius: '50%',
                  background: isAuto ? '#6366F1' : '#EF4444',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                  transition: 'all 0.3s cubic-bezier(0.34,1.3,0.64,1)',
                }} />
              </button>
              <span style={{ fontSize: 11, fontWeight: 700, color: !isAuto ? '#EF4444' : '#CBD5E1', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em' }}>MANUAL</span>
            </div>
          </div>
          {/* Heater status */}
          <div style={{
            background: '#FFF7ED', borderRadius: 14, border: '1.5px solid #FED7AA',
            padding: '10px 12px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0,
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 22, color: '#EA580C' }}>local_fire_department</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#EA580C', fontFamily: "'JetBrains Mono', monospace" }}>HEATER ON</span>
          </div>
        </div>

        {/* Humidity */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
          borderRadius: 18, border: '1.5px solid #BFDBFE',
          padding: '16px', display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#1D4ED8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Kelembaban Target</span>
            <span className="material-symbols-rounded" style={{ fontSize: 22, color: '#3B82F6' }}>water_drop</span>
          </div>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
            <span style={{ fontSize: 64, fontWeight: 900, color: '#2563EB', lineHeight: 1, fontFamily: "'JetBrains Mono', monospace" }}>{hum}</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: '#60A5FA' }}>% RH</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['−', () => setHum(h => Math.max(0, h-1))], ['+', () => setHum(h => Math.min(100, h+1))]].map(([lbl, fn]) => (
              <button key={lbl} onClick={fn} disabled={!canAdjust} style={{
                flex: 1, height: 52, borderRadius: 12, fontSize: 26, fontWeight: 800,
                border: 'none', cursor: canAdjust ? 'pointer' : 'not-allowed',
                background: canAdjust ? '#DBEAFE' : '#F1F5F9',
                color: canAdjust ? '#2563EB' : '#CBD5E1',
                boxShadow: canAdjust ? '0 2px 8px rgba(37,99,235,0.2)' : 'none',
                transition: 'all 0.15s',
              }}>{lbl}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KontrolLingkungan;
