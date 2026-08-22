import React, { useState } from 'react';

const profiles = [
  { name: 'AYAM',   durasi: '21 HARI', temp: 37.8, hum: 55, icon: 'egg' },
  { name: 'BEBEK',  durasi: '28 HARI', temp: 37.5, hum: 60, icon: 'egg' },
  { name: 'PUYUH',  durasi: '18 HARI', temp: 37.7, hum: 50, icon: 'egg' },
  { name: 'KALKUN', durasi: '28 HARI', temp: 37.5, hum: 55, icon: 'egg' },
  { name: 'ANGSA',  durasi: '30 HARI', temp: 37.6, hum: 65, icon: 'egg' },
  { name: 'KUSTOM', durasi: 'MANUAL',  temp: 37.5, hum: 55, icon: 'tune' },
];

const KontrolLingkungan = () => {
  const [selectedProfile, setSelectedProfile] = useState(0);
  const [temp, setTemp] = useState(profiles[0].temp);
  const [hum, setHum]   = useState(profiles[0].hum);
  const [isAuto, setIsAuto] = useState(true);
  const isKustom = profiles[selectedProfile].name === 'KUSTOM';
  const canAdjust = isKustom || !isAuto;

  const selectProfile = (idx) => {
    setSelectedProfile(idx);
    setTemp(profiles[idx].temp);
    setHum(profiles[idx].hum);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>

      {/* Profile Selector Row */}
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        {profiles.map((p, idx) => {
          const isActive = selectedProfile === idx;
          return (
            <button
              key={p.name}
              onClick={() => selectProfile(idx)}
              style={{
                flex: 1,
                padding: '8px 4px 10px',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '4px',
                cursor: 'pointer',
                transition: 'all 0.08s ease',
                position: 'relative',
                ...(isActive ? {
                  background: 'linear-gradient(160deg, #C4BAA8 0%, #D8D0C0 100%)',
                  boxShadow: `
                    inset 3px 3px 6px rgba(0,0,0,0.3),
                    inset -1px -1px 0px rgba(255,255,255,0.5)
                  `,
                  border: '2px solid #C87020',
                } : {
                  background: 'linear-gradient(160deg, #EDE7D8 0%, #D4CCC0 100%)',
                  boxShadow: `
                    inset 1px 1px 0px rgba(255,255,255,0.9),
                    inset -1px -1px 0px #9A8C78,
                    2px 2px 5px rgba(0,0,0,0.2)
                  `,
                  border: `1px ${p.name === 'KUSTOM' ? 'dashed' : 'solid'} #B8A890`,
                }),
              }}
            >
              <span className="material-symbols-outlined" style={{
                fontSize: '16px',
                color: isActive ? '#C87020' : '#6B5D48',
              }}>{p.icon}</span>
              <span className="font-label-sm" style={{ color: isActive ? '#C87020' : '#6B5D48', fontSize: '8px' }}>{p.name}</span>
              {isActive && (
                <div style={{
                  position: 'absolute', bottom: '5px',
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: 'radial-gradient(circle at 35% 35%, #8FFF8F, #39E239)',
                  boxShadow: '0 0 6px rgba(57,226,57,0.9)',
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Active Profile Info Strip */}
      <div style={{
        background: 'linear-gradient(145deg, #2C2416 0%, #3C3020 100%)',
        border: '1px solid #1A1410',
        borderRadius: '6px',
        padding: '6px 14px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: 'inset 1px 1px 0px rgba(255,255,255,0.05), inset -1px -1px 0px rgba(0,0,0,0.3), 2px 2px 4px rgba(0,0,0,0.3)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="led led-on-green" style={{ width: '8px', height: '8px' }} />
          <span className="font-label-caps" style={{ color: '#E8D898', fontSize: '9px' }}>
            PROFIL: {profiles[selectedProfile].name} &nbsp;|&nbsp; {profiles[selectedProfile].durasi}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <span className="font-label-caps" style={{ color: '#78A878', fontSize: '9px' }}>
            T: {temp.toFixed(1)}°C &nbsp; H: {hum}%
          </span>
        </div>
      </div>

      {/* Main Control Area */}
      <div style={{ display: 'flex', gap: '10px', flex: 1, minHeight: 0 }}>

        {/* Temperature Panel */}
        <div className="panel-section" style={{ flex: 1, padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="font-label-caps" style={{ color: '#6B5D48', fontSize: '10px' }}>SUHU TARGET</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="font-label-caps" style={{ color: '#2A8A2A', fontSize: '9px' }}>AKTIF</span>
              <div className="led-housing" style={{ width: '18px', height: '18px' }}>
                <div className="led led-on-green" style={{ width: '10px', height: '10px' }} />
              </div>
            </div>
          </div>

          <div className="display-recess" style={{ flex: 1, borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <span className="font-readout-lg phosphor-green animate-glow">{temp.toFixed(1)}°</span>
            <span className="font-label-caps" style={{ color: '#78A878', fontSize: '10px' }}>CELSIUS</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-control" disabled={!canAdjust}
              onClick={() => setTemp(t => Math.max(20, +(t-0.1).toFixed(1)))}
              style={{ flex: 1, height: '52px', borderRadius: '8px', fontSize: '26px', fontWeight: 700, color: '#4A3E2E' }}>
              −
            </button>
            <button className="btn-control" disabled={!canAdjust}
              onClick={() => setTemp(t => Math.min(45, +(t+0.1).toFixed(1)))}
              style={{ flex: 1, height: '52px', borderRadius: '8px', fontSize: '26px', fontWeight: 700, color: '#4A3E2E' }}>
              +
            </button>
          </div>
        </div>

        {/* Center: Mode Toggle + Heater */}
        <div style={{ width: '18%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div className="panel-section" style={{ flex: 1, padding: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <span className="font-label-caps" style={{ color: '#6B5D48', fontSize: '10px', marginBottom: '12px' }}>MODE</span>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <span className="font-label-sm" style={{ color: isAuto ? '#2A8A2A' : '#8A8070', fontSize: '8px' }}>OTOMATIS</span>
              <button className="toggle-track" onClick={() => setIsAuto(!isAuto)}
                style={{ width: '40px', height: '80px', cursor: 'pointer' }}>
                <div className="toggle-handle" style={{
                  width: '32px', height: '32px', left: '3px', top: '3px',
                  transform: isAuto ? 'translateY(0)' : 'translateY(40px)',
                }} />
              </button>
              <span className="font-label-sm" style={{ color: !isAuto ? '#CC2200' : '#8A8070', fontSize: '8px' }}>MANUAL</span>
            </div>
          </div>

          {/* Heater indicator */}
          <div className="panel-section" style={{ padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', height: '72px' }}>
            <span className="font-label-sm" style={{ color: '#6B5D48', fontSize: '8px' }}>HEATER</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#CC3300' }}>local_fire_department</span>
              <span className="font-label-caps" style={{ color: '#CC3300', fontSize: '11px' }}>ON</span>
            </div>
          </div>
        </div>

        {/* Humidity Panel */}
        <div className="panel-section" style={{ flex: 1, padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="font-label-caps" style={{ color: '#6B5D48', fontSize: '10px' }}>KELEMBABAN TARGET</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="font-label-caps" style={{ color: '#2A8A2A', fontSize: '9px' }}>AKTIF</span>
              <div className="led-housing" style={{ width: '18px', height: '18px' }}>
                <div className="led led-on-green" style={{ width: '10px', height: '10px' }} />
              </div>
            </div>
          </div>

          <div className="display-recess" style={{ flex: 1, borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <span className="font-readout-lg" style={{ color: '#50C8FF', textShadow: '0 0 8px rgba(80,200,255,0.7), 0 0 20px rgba(80,200,255,0.3)' }}>{hum}%</span>
            <span className="font-label-caps" style={{ color: '#5090A8', fontSize: '10px' }}>RELATIVE HUMIDITY</span>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-control" disabled={!canAdjust}
              onClick={() => setHum(h => Math.max(0, h-1))}
              style={{ flex: 1, height: '52px', borderRadius: '8px', fontSize: '26px', fontWeight: 700, color: '#4A3E2E' }}>
              −
            </button>
            <button className="btn-control" disabled={!canAdjust}
              onClick={() => setHum(h => Math.min(100, h+1))}
              style={{ flex: 1, height: '52px', borderRadius: '8px', fontSize: '26px', fontWeight: 700, color: '#4A3E2E' }}>
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KontrolLingkungan;
