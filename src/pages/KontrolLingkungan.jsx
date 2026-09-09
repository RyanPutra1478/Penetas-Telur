import React, { useState } from 'react';
import { IconAyam, IconBebek, IconPuyuh, IconKalkun, IconAngsa, IconKustom } from '../components/AnimalIcons';

const profiles = [
  { name: 'AYAM',   durasi: '21 hr', temp: 37.8, hum: 55, color: '#F97316', bg: '#FFF7ED', border: '#FED7AA', icon: IconAyam },
  { name: 'BEBEK',  durasi: '28 hr', temp: 37.5, hum: 60, color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE', icon: IconBebek },
  { name: 'PUYUH',  durasi: '18 hr', temp: 37.7, hum: 50, color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE', icon: IconPuyuh },
  { name: 'KALKUN', durasi: '28 hr', temp: 37.5, hum: 55, color: '#14B8A6', bg: '#F0FDFA', border: '#99F6E4', icon: IconKalkun },
  { name: 'ANGSA',  durasi: '30 hr', temp: 37.6, hum: 65, color: '#EC4899', bg: '#FDF2F8', border: '#FBCFE8', icon: IconAngsa },
  { name: 'KUSTOM', durasi: 'Manual', temp: 37.5, hum: 55, color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0', icon: IconKustom },
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%', boxSizing: 'border-box' }}>

      {/* Profile Row */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {profiles.map((pr, i) => {
          const active = selected === i;
          const AnimalIcon = pr.icon;
          return (
            <button key={pr.name} onClick={() => selectProfile(i)} style={{
              flex: 1,
              padding: '8px 6px',
              borderRadius: 14,
              border: `2px solid ${active ? pr.color : pr.border}`,
              background: active ? pr.bg : '#FFFFFF',
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              boxShadow: active ? `0 4px 14px ${pr.color}35` : '0 1px 4px rgba(0,0,0,0.06)',
              transition: 'all 0.2s ease',
            }}>
              <AnimalIcon size={26} color={active ? pr.color : '#94A3B8'} />
              <span style={{ fontSize: 13, fontWeight: 900, color: active ? pr.color : '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase', fontFamily: "'JetBrains Mono', monospace" }}>{pr.name}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: active ? pr.color : '#94A3B8' }}>{pr.durasi}</span>
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
          {React.createElement(p.icon, { size: 20, color: p.color })}
          <span style={{ fontSize: 13, fontWeight: 900, color: p.color, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em' }}>
            PROFIL AKTIF: {p.name} · {p.durasi}
          </span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 800, color: p.color, fontFamily: "'JetBrains Mono', monospace" }}>
          Target: {temp.toFixed(1)}°C · {hum}% RH
        </span>
      </div>

      {/* Main Controls — 3 Equal Height Columns */}
      <div style={{ display: 'flex', gap: 10, flex: 1, minHeight: 0 }}>

        {/* Temperature */}
        <div
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
            borderRadius: 20, border: '2px solid #FED7AA',
            padding: '14px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            boxShadow: '0 6px 16px rgba(249,115,22,0.12)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          <div className="batik-overlay batik-overlay-warm" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#C2410C', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Suhu Target</span>
            <span className="material-symbols-rounded" style={{ fontSize: 24, color: '#EA580C' }}>device_thermostat</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 5, my: 'auto', position: 'relative', zIndex: 1 }}>
            <span style={{ fontSize: 68, fontWeight: 900, color: '#EA580C', lineHeight: 1, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.03em' }}>{temp.toFixed(1)}</span>
            <span style={{ fontSize: 26, fontWeight: 900, color: '#FB923C' }}>°C</span>
          </div>
          <div style={{ display: 'flex', gap: 8, position: 'relative', zIndex: 1 }}>
            {[['−', () => setTemp(t => Math.max(20, +(t-0.1).toFixed(1)))], ['+', () => setTemp(t => Math.min(45, +(t+0.1).toFixed(1)))]].map(([lbl, fn]) => (
              <button key={lbl} onClick={fn} disabled={!canAdjust} style={{
                flex: 1, height: 48, borderRadius: 12, fontSize: 28, fontWeight: 900,
                border: 'none', cursor: canAdjust ? 'pointer' : 'not-allowed',
                background: canAdjust ? '#FFEDD5' : '#F1F5F9',
                color: canAdjust ? '#EA580C' : '#CBD5E1',
                boxShadow: canAdjust ? '0 2px 8px rgba(234,88,12,0.22)' : 'none',
                transition: 'all 0.15s',
              }}>{lbl}</button>
            ))}
          </div>
        </div>

        {/* Mode — Integrated Single Card */}
        <div
          style={{
            width: 145,
            background: '#FFFFFF',
            borderRadius: 20,
            border: '2px solid #E2E8F0',
            padding: '14px 12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
            boxSizing: 'border-box',
            position: 'relative', overflow: 'hidden',
          }}
        >
          <div className="batik-overlay batik-overlay-neutral" />
          <span style={{ fontSize: 12, fontWeight: 900, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase', position: 'relative', zIndex: 1 }}>Mode Operasi</span>
          
          {/* Vertical Toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, my: 'auto', position: 'relative', zIndex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: isAuto ? '#6366F1' : '#CBD5E1', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em' }}>AUTO</span>
            <button onClick={() => setIsAuto(!isAuto)} style={{
              width: 42, height: 78, borderRadius: 999,
              background: isAuto ? '#EEF2FF' : '#FEE2E2',
              border: `2px solid ${isAuto ? '#818CF8' : '#FCA5A5'}`,
              cursor: 'pointer', position: 'relative',
              transition: 'all 0.3s ease',
            }}>
              <div style={{
                position: 'absolute', left: '50%', transform: 'translateX(-50%)',
                top: isAuto ? 4 : 'auto', bottom: isAuto ? 'auto' : 4,
                width: 28, height: 28, borderRadius: '50%',
                background: isAuto ? '#6366F1' : '#EF4444',
                boxShadow: '0 3px 8px rgba(0,0,0,0.3)',
                transition: 'all 0.3s cubic-bezier(0.34,1.3,0.64,1)',
              }} />
            </button>
            <span style={{ fontSize: 13, fontWeight: 900, color: !isAuto ? '#EF4444' : '#CBD5E1', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em' }}>MANUAL</span>
          </div>

          {/* Integrated Heater Status Pill */}
          <div style={{
            background: '#FFF7ED', borderRadius: 999, border: '1px solid #FED7AA',
            padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 5,
            position: 'relative', zIndex: 1,
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#EA580C' }}>local_fire_department</span>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#EA580C', fontFamily: "'JetBrains Mono', monospace" }}>HEATER ON</span>
          </div>
        </div>

        {/* Humidity */}
        <div
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
            borderRadius: 20, border: '2px solid #BFDBFE',
            padding: '14px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            boxShadow: '0 6px 16px rgba(59,130,246,0.12)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          <div className="batik-overlay batik-overlay-blue" />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#1D4ED8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Kelembaban Target</span>
            <span className="material-symbols-rounded" style={{ fontSize: 24, color: '#3B82F6' }}>water_drop</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 5, my: 'auto' }}>
            <span style={{ fontSize: 68, fontWeight: 900, color: '#2563EB', lineHeight: 1, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '-0.03em' }}>{hum}</span>
            <span style={{ fontSize: 26, fontWeight: 900, color: '#60A5FA' }}>% RH</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['−', () => setHum(h => Math.max(0, h-1))], ['+', () => setHum(h => Math.min(100, h+1))]].map(([lbl, fn]) => (
              <button key={lbl} onClick={fn} disabled={!canAdjust} style={{
                flex: 1, height: 48, borderRadius: 12, fontSize: 28, fontWeight: 900,
                border: 'none', cursor: canAdjust ? 'pointer' : 'not-allowed',
                background: canAdjust ? '#DBEAFE' : '#F1F5F9',
                color: canAdjust ? '#2563EB' : '#CBD5E1',
                boxShadow: canAdjust ? '0 2px 8px rgba(37,99,235,0.22)' : 'none',
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
