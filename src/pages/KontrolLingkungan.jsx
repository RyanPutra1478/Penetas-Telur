import React, { useState, useEffect } from 'react';
import { IconAyam, IconBebek, IconPuyuh, IconKalkun, IconAngsa, IconKustom } from '../components/AnimalIcons';
import { getControlMode, setControlMode, getActuators } from '../api/tetascoApi';

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
  const [heaterActive, setHeaterActive] = useState(true);

  const p = profiles[selected];
  const isKustom = p.name === 'KUSTOM';
  const canAdjust = isKustom || !isAuto;

  // Baca setpoint dari backend saat halaman dimuat
  useEffect(() => {
    let isMounted = true;
    const fetchMode = async () => {
      const mode = await getControlMode();
      const acts = await getActuators();
      if (!isMounted) return;
      if (mode) {
        if (mode.auto !== undefined) setIsAuto(mode.auto);
        if (mode.target_temp !== undefined) setTemp(mode.target_temp);
        if (mode.target_hum !== undefined) setHum(mode.target_hum);
        if (mode.profile) {
          const idx = profiles.findIndex(pr => pr.name.toUpperCase() === mode.profile.toUpperCase());
          if (idx !== -1) setSelected(idx);
        }
      }
      if (acts && acts.heater !== undefined) {
        setHeaterActive(acts.heater);
      }
    };
    fetchMode();
    const timer = setInterval(fetchMode, 2000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  const selectProfile = (idx) => {
    setSelected(idx);
    const chosen = profiles[idx];
    setTemp(chosen.temp);
    setHum(chosen.hum);
    setControlMode({
      auto: isAuto,
      target_temp: chosen.temp,
      target_hum: chosen.hum,
      profile: chosen.name
    });
  };

  const handleToggleAuto = () => {
    const nextAuto = !isAuto;
    setIsAuto(nextAuto);
    setControlMode({
      auto: nextAuto,
      target_temp: temp,
      target_hum: hum,
      profile: p.name
    });
  };

  const adjustTemp = (newTemp) => {
    const rounded = +(Math.max(20, Math.min(45, newTemp))).toFixed(1);
    setTemp(rounded);
    setControlMode({ target_temp: rounded });
  };

  const adjustHum = (newHum) => {
    const clamped = Math.max(0, Math.min(100, newHum));
    setHum(clamped);
    setControlMode({ target_hum: clamped });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%', boxSizing: 'border-box' }}>

      {/* Profile Row */}
      <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
        {profiles.map((pr, i) => {
          const active = selected === i;
          const AnimalIcon = pr.icon;
          return (
            <button key={pr.name} onClick={() => selectProfile(i)} style={{
              flex: 1,
              padding: '10px 6px',
              borderRadius: 16,
              border: `2px solid ${active ? pr.color : pr.border}`,
              background: active ? pr.bg : '#FFFFFF',
              cursor: 'pointer',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              boxShadow: active ? `0 4px 14px ${pr.color}35` : '0 1px 4px rgba(0,0,0,0.05)',
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
        borderRadius: 14,
        padding: '9px 18px',
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
      <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0 }}>

        {/* Temperature */}
        <div
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
            borderRadius: 22, border: '2px solid #FED7AA',
            padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(249,115,22,0.10)',
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
            {[['−', () => adjustTemp(temp - 0.1)], ['+', () => adjustTemp(temp + 0.1)]].map(([lbl, fn]) => (
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
            width: 148,
            background: '#FFFFFF',
            borderRadius: 22,
            border: '2px solid #E2E8F0',
            padding: '16px 12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            alignItems: 'center',
            boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
            boxSizing: 'border-box',
            position: 'relative', overflow: 'hidden',
          }}
        >
          <div className="batik-overlay batik-overlay-neutral" />
          <span style={{ fontSize: 12, fontWeight: 900, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase', position: 'relative', zIndex: 1 }}>Mode Operasi</span>
          
          {/* Vertical Toggle */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, my: 'auto', position: 'relative', zIndex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: isAuto ? '#6366F1' : '#CBD5E1', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em' }}>AUTO</span>
            <button onClick={handleToggleAuto} style={{
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
            background: heaterActive ? '#FFF7ED' : '#F1F5F9',
            borderRadius: 999,
            border: `1px solid ${heaterActive ? '#FED7AA' : '#E2E8F0'}`,
            padding: '5px 12px',
            display: 'flex', alignItems: 'center', gap: 5,
            position: 'relative', zIndex: 1,
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 18, color: heaterActive ? '#EA580C' : '#94A3B8' }}>local_fire_department</span>
            <span style={{ fontSize: 11, fontWeight: 900, color: heaterActive ? '#EA580C' : '#64748B', fontFamily: "'JetBrains Mono', monospace" }}>
              {heaterActive ? 'HEATER ON' : 'HEATER OFF'}
            </span>
          </div>
        </div>

        {/* Humidity */}
        <div
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
            borderRadius: 22, border: '2px solid #BFDBFE',
            padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(59,130,246,0.10)',
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
            {[['−', () => adjustHum(hum - 1)], ['+', () => adjustHum(hum + 1)]].map(([lbl, fn]) => (
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
