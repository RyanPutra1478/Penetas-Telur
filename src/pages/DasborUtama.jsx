import React, { useState } from 'react';

// Reusable retro section header label
const SectionLabel = ({ children }) => (
  <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
    <div style={{ flex: 1, height: '2px', background: 'linear-gradient(to right, #9A8C78, transparent)' }} />
    <span className="font-label-caps" style={{ color: '#6B5D48', fontSize: '10px' }}>{children}</span>
    <div style={{ flex: 1, height: '2px', background: 'linear-gradient(to left, #9A8C78, transparent)' }} />
  </div>
);

const RackCell = ({ id, status, onClick }) => {
  const isError = status === 'error';
  const isOff = status === 'off';
  const isOk = status === 'ok';

  return (
    <button
      onClick={onClick}
      style={{
        background: isOff
          ? 'linear-gradient(145deg, #DDD5C5 0%, #C4BAA8 100%)'
          : isError
          ? 'linear-gradient(145deg, #F5E8E8 0%, #E8D0D0 100%)'
          : 'linear-gradient(145deg, #E8E0D0 0%, #D0C8B8 100%)',
        boxShadow: isOff
          ? 'inset 2px 2px 5px rgba(0,0,0,0.25), inset -1px -1px 2px rgba(255,255,255,0.4)'
          : `
            inset 2px 2px 0px rgba(255,255,255,0.8),
            inset -2px -2px 0px #9A8C78,
            2px 2px 6px rgba(0,0,0,0.2)
          `,
        border: `2px solid ${isError ? '#CC2200' : isOk ? '#2A8A2A' : '#B8A890'}`,
        borderRadius: '6px',
        padding: '10px 8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        transform: isOff ? 'translateY(1px)' : 'none',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', padding: '0 4px' }}>
        <span className="font-label-caps" style={{ color: isError ? '#CC2200' : isOff ? '#8A8070' : '#4A3E2E', fontSize: '12px' }}>
          R{id}
        </span>
        <span className="font-label-sm" style={{ fontSize: '8px', color: isError ? '#CC2200' : isOff ? '#8A8070' : '#2A8A2A' }}>
          {isError ? 'ERR' : isOff ? 'OFF' : 'ON'}
        </span>
      </div>
      <div className="led-housing" style={{ width: '20px', height: '20px' }}>
        <div
          className={`led ${isError ? 'led-on-red animate-blink' : isOff ? 'led-off-green' : 'led-on-green'}`}
          style={{ width: '11px', height: '11px' }}
        />
      </div>
    </button>
  );
};

const ActuatorBtn = ({ icon, label, active, onClick, activeColor = '#2A8A2A' }) => (
  <button
    onClick={onClick}
    className="btn-raised"
    style={{
      padding: '12px 18px',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      height: '68px',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      border: active ? `2px solid ${activeColor}` : '1px solid var(--border-mid)',
      background: active
        ? 'linear-gradient(160deg, #F5EFE4 0%, #E6DEC8 50%, #D8CEB8 100%)'
        : 'linear-gradient(160deg, #DED6C4 0%, #D0C6B2 100%)',
      boxShadow: active
        ? `
          inset 2px 2px 0px rgba(255,255,255,0.9),
          inset -2px -2px 0px #A09078,
          3px 3px 8px rgba(0,0,0,0.25)
        `
        : `
          inset 3px 3px 6px rgba(0,0,0,0.25),
          inset -1px -1px 0px rgba(255,255,255,0.5),
          1px 1px 2px rgba(0,0,0,0.1)
        `,
      transform: active ? 'none' : 'translate(1px, 1px)',
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '6px',
        background: active ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: active ? 'inset 1px 1px 2px rgba(0,0,0,0.15)' : 'inset 2px 2px 4px rgba(0,0,0,0.3)',
      }}>
        <span
          className="material-symbols-outlined"
          style={{
            fontSize: '22px',
            color: active ? activeColor : '#8A8070',
            transition: 'color 0.15s ease',
          }}
        >
          {icon}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <span className="font-label-caps" style={{ color: active ? '#2C2416' : '#7A6E5D', fontSize: '12px' }}>
          {label}
        </span>
        <span className="font-label-sm" style={{ fontSize: '8px', color: active ? activeColor : '#8A8070', marginTop: '2px' }}>
          {active ? 'AKTIF (ON)' : 'NONAKTIF (OFF)'}
        </span>
      </div>
    </div>
    <div className="led-housing" style={{ width: '24px', height: '24px' }}>
      <div
        className={`led ${active ? 'led-on-green' : 'led-off-green'}`}
        style={{ width: '13px', height: '13px' }}
      />
    </div>
  </button>
);

const DasborUtama = () => {
  // State for actuators (Pemanas, Kipas, Pelembab)
  const [actuators, setActuators] = useState({
    pemanas: true,
    kipas: true,
    pelembab: false,
  });

  // State for 8 racks (ok, off, error)
  const [racks, setRacks] = useState([
    { id: 1, status: 'ok' },
    { id: 2, status: 'ok' },
    { id: 3, status: 'ok' },
    { id: 4, status: 'error' },
    { id: 5, status: 'ok' },
    { id: 6, status: 'ok' },
    { id: 7, status: 'off' },
    { id: 8, status: 'off' },
  ]);

  const toggleActuator = (name) => {
    setActuators((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const toggleRack = (id) => {
    setRacks((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        // Cycle states: ok -> off -> error -> ok (or ok -> off -> ok)
        if (r.status === 'ok') return { ...r, status: 'off' };
        if (r.status === 'off') return { ...r, status: 'ok' };
        if (r.status === 'error') return { ...r, status: 'ok' };
        return { ...r, status: 'ok' };
      })
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', height: '100%' }}>

      {/* Primary Readouts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>

        {/* Temperature Readout */}
        <div className="panel-section" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <span className="font-label-caps" style={{ color: '#6B5D48', fontSize: '10px' }}>SUHU INTERNAL</span>
            <div className="led-housing" style={{ width: '20px', height: '20px' }}>
              <div className={`led ${actuators.pemanas ? 'led-on-green' : 'led-off-green'}`} style={{ width: '12px', height: '12px' }} />
            </div>
          </div>
          <div className="display-recess" style={{ padding: '12px 16px', borderRadius: '6px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <span className="font-readout-lg phosphor-green animate-glow">
              {actuators.pemanas ? '37.5' : '36.8'}
            </span>
            <span className="font-label-caps phosphor-amber" style={{ fontSize: '16px', marginBottom: '6px' }}>°C</span>
          </div>
        </div>

        {/* Humidity Readout */}
        <div className="panel-section" style={{ padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <span className="font-label-caps" style={{ color: '#6B5D48', fontSize: '10px' }}>KELEMBABAN</span>
            <div className="led-housing" style={{ width: '20px', height: '20px' }}>
              <div className={`led ${actuators.pelembab ? 'led-on-green' : 'led-off-green'}`} style={{ width: '12px', height: '12px' }} />
            </div>
          </div>
          <div className="display-recess" style={{ padding: '12px 16px', borderRadius: '6px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <span className="font-readout-lg" style={{ color: '#50C8FF', textShadow: '0 0 8px rgba(80,200,255,0.7), 0 0 20px rgba(80,200,255,0.3)' }}>
              {actuators.pelembab ? '62' : '55'}
            </span>
            <span className="font-label-caps" style={{ fontSize: '16px', marginBottom: '6px', color: '#50C8FF' }}>%</span>
          </div>
        </div>

        {/* Batch Progress */}
        <div className="panel-section" style={{ padding: '16px' }}>
          <span className="font-label-caps" style={{ color: '#6B5D48', fontSize: '10px' }}>BATCH AKTIF — B24-09</span>
          <div className="display-recess" style={{ padding: '12px 16px', marginTop: '10px', borderRadius: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '10px' }}>
              <span className="font-readout-md phosphor-green">Hari 7</span>
              <span className="font-label-caps" style={{ color: '#78A878', fontSize: '14px' }}>/ 21</span>
            </div>
            {/* Progress bar */}
            <div style={{
              height: '10px',
              background: '#0A0A08',
              borderRadius: '2px',
              border: '1px solid #3A3028',
              boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.5)',
              overflow: 'hidden',
            }}>
              <div style={{
                width: '33%', height: '100%',
                background: 'linear-gradient(90deg, #1A8A1A, #39E239)',
                boxShadow: '0 0 6px rgba(57,226,57,0.6)',
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* Actuator Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        <ActuatorBtn
          icon="thermostat"
          label="PEMANAS"
          active={actuators.pemanas}
          activeColor="#CC5500"
          onClick={() => toggleActuator('pemanas')}
        />
        <ActuatorBtn
          icon="mode_fan"
          label="KIPAS"
          active={actuators.kipas}
          activeColor="#2A8A2A"
          onClick={() => toggleActuator('kipas')}
        />
        <ActuatorBtn
          icon="water_drop"
          label="PELEMBAB"
          active={actuators.pelembab}
          activeColor="#0077CC"
          onClick={() => toggleActuator('pelembab')}
        />
      </div>

      {/* Rack Grid */}
      <div className="panel-section" style={{ padding: '14px', flex: 1 }}>
        <SectionLabel>STATUS RAK (8 UNIT) — KLIK UNTUK UBAH STATUS</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
          {racks.map((r) => (
            <RackCell
              key={r.id}
              id={r.id}
              status={r.status}
              onClick={() => toggleRack(r.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DasborUtama;

