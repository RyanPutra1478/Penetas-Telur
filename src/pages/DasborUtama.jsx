import React, { useState } from 'react';

/* ================================================
   Slider — selalu di bawah-kiri, konsisten
   ================================================ */
const SliderToggle = ({ value, onChange, labelOff = 'OFF', labelOn = 'ON', disabled = false }) => {
  const W = 60, H = 32, THUMB = 24, INSET = (H - THUMB) / 2;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      opacity: disabled ? 0.4 : 1,
      pointerEvents: disabled ? 'none' : 'auto',
    }}>
      <button
        onClick={e => { e.stopPropagation(); onChange(!value); }}
        style={{
          position: 'relative',
          width: W, height: H,
          borderRadius: 999,
          border: 'none', cursor: 'pointer',
          background: value ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.28)',
          boxShadow: value
            ? 'inset 0 1px 3px rgba(0,0,0,0.1), 0 0 0 2px rgba(255,255,255,0.5)'
            : 'inset 0 1px 4px rgba(0,0,0,0.35)',
          transition: 'all 0.3s cubic-bezier(0.34,1.3,0.64,1)',
          flexShrink: 0, padding: 0,
        }}
      >
        <div style={{
          position: 'absolute',
          top: INSET,
          left: value ? W - THUMB - INSET : INSET,
          width: THUMB, height: THUMB,
          borderRadius: '50%',
          background: '#FFFFFF',
          boxShadow: '0 2px 8px rgba(0,0,0,0.35)',
          transition: 'left 0.3s cubic-bezier(0.34,1.3,0.64,1)',
        }} />
      </button>
      <span style={{
        fontSize: 13, fontWeight: 800, letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: value ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.45)',
        fontFamily: "'JetBrains Mono', monospace",
        transition: 'color 0.25s',
      }}>
        {value ? labelOn : labelOff}
      </span>
    </div>
  );
};

/* ================================================
   Control Card — icon besar di kanan, slider kiri
   ================================================ */
const ControlCard = ({ icon, label, sublabel, gradient, colorOn, children }) => (
  <div style={{
    background: gradient,
    borderRadius: 22,
    padding: '16px 20px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',   /* top: label, bottom: slider */
    position: 'relative',
    overflow: 'hidden',
    flex: 1,
    boxShadow: `0 8px 24px ${colorOn}40, 0 4px 10px ${colorOn}18`,
  }}>
    {/* ICON — sebesar tinggi kartu, semi-transparan, di kanan */}
    <span
      className="material-symbols-rounded"
      style={{
        position: 'absolute',
        right: -10,
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: 130,           /* icon sangat besar */
        color: 'rgba(255,255,255,0.12)',
        pointerEvents: 'none',
        lineHeight: 1,
        userSelect: 'none',
      }}
    >
      {icon}
    </span>

    {/* Label section — atas */}
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ fontSize: 20, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
        {label}
      </div>
      <div style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.68)', marginTop: 4 }}>
        {sublabel}
      </div>
    </div>

    {/* Slider section — bawah kiri (selalu) */}
    <div style={{ position: 'relative', zIndex: 1 }}>
      {children}
    </div>
  </div>
);

/* ================================================
   DASBOR UTAMA
   ================================================ */
const DasborUtama = () => {
  const [pemanas,  setPemanas]  = useState(true);
  const [kipas,    setKipas]    = useState(true);
  const [pelembab, setPelembab] = useState(false);
  const [rakGerak, setRakGerak] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>

      {/* ===== SENSOR CARDS — Batch lebih dominan ===== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1.55fr',   /* Batch lebih lebar */
        gap: 10,
        flexShrink: 0,
      }}>

        {/* Suhu */}
        <div style={{
          background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
          borderRadius: 18, padding: '14px 16px',
          border: '1.5px solid #FED7AA',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Big background icon */}
          <span className="material-symbols-rounded" style={{
            position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)',
            fontSize: 96, color: 'rgba(249,115,22,0.12)', pointerEvents: 'none', lineHeight: 1,
          }}>thermometer</span>

          <div style={{ position: 'relative' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#C2410C', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Suhu Internal</span>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, marginTop: 4 }}>
              <span style={{ fontSize: 44, fontWeight: 900, color: '#EA580C', lineHeight: 1, fontFamily: "'JetBrains Mono', monospace" }}>
                {pemanas ? '37.5' : '36.2'}
              </span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#FB923C', marginBottom: 5 }}>°C</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: pemanas ? '#22C55E' : '#94A3B8', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: pemanas ? '#166534' : '#64748B', fontWeight: 600 }}>
                {pemanas ? 'Pemanas aktif' : 'Pemanas mati'}
              </span>
            </div>
          </div>
        </div>

        {/* Kelembaban */}
        <div style={{
          background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
          borderRadius: 18, padding: '14px 16px',
          border: '1.5px solid #BFDBFE',
          position: 'relative', overflow: 'hidden',
        }}>
          <span className="material-symbols-rounded" style={{
            position: 'absolute', right: -8, top: '50%', transform: 'translateY(-50%)',
            fontSize: 96, color: 'rgba(59,130,246,0.12)', pointerEvents: 'none', lineHeight: 1,
          }}>water_drop</span>

          <div style={{ position: 'relative' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#1D4ED8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Kelembaban</span>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, marginTop: 4 }}>
              <span style={{ fontSize: 44, fontWeight: 900, color: '#2563EB', lineHeight: 1, fontFamily: "'JetBrains Mono', monospace" }}>
                {pelembab ? '65' : '55'}
              </span>
              <span style={{ fontSize: 18, fontWeight: 700, color: '#60A5FA', marginBottom: 5 }}>%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: pelembab ? '#22C55E' : '#94A3B8', flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: pelembab ? '#166534' : '#64748B', fontWeight: 600 }}>
                {pelembab ? 'Pelembab aktif' : 'Pelembab mati'}
              </span>
            </div>
          </div>
        </div>

        {/* BATCH — lebih dominan, icon setinggi panel */}
        <div style={{
          background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
          borderRadius: 18, padding: '14px 20px',
          boxShadow: '0 8px 24px rgba(34,197,94,0.35)',
          position: 'relative', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        }}>
          {/* Icon setinggi panel */}
          <span className="material-symbols-rounded" style={{
            position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)',
            fontSize: 130, color: 'rgba(255,255,255,0.15)', pointerEvents: 'none', lineHeight: 1,
          }}>egg</span>

          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Batch Aktif</span>
              <span style={{ fontSize: 9, fontWeight: 800, background: 'rgba(255,255,255,0.2)', color: '#FFF', padding: '2px 8px', borderRadius: 999, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em' }}>B24-09</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 48, fontWeight: 900, color: '#FFFFFF', lineHeight: 1, fontFamily: "'JetBrains Mono', monospace" }}>Hari 7</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>/21</span>
            </div>
          </div>

          <div style={{ position: 'relative' }}>
            <div style={{ height: 10, background: 'rgba(255,255,255,0.25)', borderRadius: 999, overflow: 'hidden', marginBottom: 5 }}>
              <div style={{ width: '33%', height: '100%', background: '#FFFFFF', borderRadius: 999, boxShadow: '0 0 8px rgba(255,255,255,0.6)' }} />
            </div>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)', fontWeight: 700 }}>33% selesai · Ayam · 21 hari</span>
          </div>
        </div>
      </div>

      {/* ===== 4 CONTROL CARDS ===== */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, flex: 1, minHeight: 0 }}>

        {/* PEMANAS */}
        <ControlCard
          icon="local_fire_department"
          label="Pemanas"
          sublabel="Heater element · Target 37.8°C"
          gradient="linear-gradient(135deg, #F97316 0%, #EF4444 100%)"
          colorOn="#EF4444"
        >
          <SliderToggle value={pemanas} onChange={setPemanas} labelOff="MATI" labelOn="AKTIF" />
        </ControlCard>

        {/* KIPAS */}
        <ControlCard
          icon="mode_fan"
          label="Sirkulasi Kipas"
          sublabel="Fan circulation · 2400 RPM"
          gradient="linear-gradient(135deg, #38BDF8 0%, #3B82F6 100%)"
          colorOn="#3B82F6"
        >
          <SliderToggle value={kipas} onChange={setKipas} labelOff="MATI" labelOn="AKTIF" />
        </ControlCard>

        {/* PELEMBAB */}
        <ControlCard
          icon="water_drop"
          label="Pelembab Udara"
          sublabel="Humidifier · Target 65%"
          gradient="linear-gradient(135deg, #34D399 0%, #14B8A6 100%)"
          colorOn="#14B8A6"
        >
          <SliderToggle value={pelembab} onChange={setPelembab} labelOff="MATI" labelOn="AKTIF" />
        </ControlCard>

        {/* PEMBALIK RAK — slider KIRI, konsisten */}
        <ControlCard
          icon="view_carousel"
          label="Pembalik Rak"
          sublabel="Tilt system · Semua rak"
          gradient="linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)"
          colorOn="#8B5CF6"
        >
          {/* Sama persis dengan kartu lain: slider kiri + label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SliderToggle
              value={rakGerak}
              onChange={setRakGerak}
              labelOff="DIAM"
              labelOn="BERGERAK"
            />
            {/* Icon kecil berputar saat aktif */}
            <span
              className="material-symbols-rounded"
              style={{
                fontSize: 18,
                color: rakGerak ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)',
                animation: rakGerak ? 'spin-slow 2.5s linear infinite' : 'none',
                marginLeft: 4,
              }}
            >
              rotate_90_degrees_ccw
            </span>
          </div>
        </ControlCard>

      </div>
    </div>
  );
};

export default DasborUtama;
