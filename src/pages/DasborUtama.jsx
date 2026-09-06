import React, { useState } from 'react';

/* ================================================
   Slider Toggle — Ramah Layar Sentuh 7 Inci & Bolder
   ================================================ */
const SliderToggle = ({ value, onChange, labelOff = 'MATI', labelOn = 'AKTIF', disabled = false }) => {
  const W = 58, H = 30, THUMB = 22, INSET = (H - THUMB) / 2;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
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
          background: value ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.35)',
          boxShadow: value
            ? 'inset 0 1px 3px rgba(0,0,0,0.1), 0 0 0 2.5px rgba(255,255,255,0.85)'
            : 'inset 0 1px 4px rgba(0,0,0,0.45)',
          transition: 'all 0.25s cubic-bezier(0.34,1.3,0.64,1)',
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
          boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
          transition: 'left 0.25s cubic-bezier(0.34,1.3,0.64,1)',
        }} />
      </button>
      <span style={{
        fontSize: 15, fontWeight: 900, letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: value ? '#FFFFFF' : 'rgba(255,255,255,0.75)',
        fontFamily: "'JetBrains Mono', monospace",
        transition: 'color 0.25s',
      }}>
        {value ? labelOn : labelOff}
      </span>
    </div>
  );
};

/* ================================================
   Control Card — Font Sangat Besar & Padat
   ================================================ */
const ControlCard = ({ icon, label, sublabel, gradient, colorOn, children }) => (
  <div style={{
    background: gradient,
    borderRadius: 18,
    padding: '12px 18px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: `0 5px 16px ${colorOn}35`,
    boxSizing: 'border-box',
    height: '100%',
  }}>
    {/* Background Icon — di tengah kanan */}
    <span
      className="material-symbols-rounded"
      style={{
        position: 'absolute',
        right: 6,
        top: '50%',
        transform: 'translateY(-50%)',
        fontSize: 92,
        color: 'rgba(255,255,255,0.16)',
        pointerEvents: 'none',
        lineHeight: 1,
        userSelect: 'none',
      }}
    >
      {icon}
    </span>

    {/* Header info — font 26px sangat besar & jelas */}
    <div style={{ position: 'relative', zIndex: 1 }}>
      <div style={{ fontSize: 26, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em', lineHeight: 1.1 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.88)', marginTop: 2 }}>
        {sublabel}
      </div>
    </div>

    {/* Slider Section — di bawah kiri */}
    <div style={{ position: 'relative', zIndex: 1 }}>
      {children}
    </div>
  </div>
);

/* ================================================
   DASBOR UTAMA — Angka di Tengah Vertikal & Font Besar
   ================================================ */
const DasborUtama = () => {
  const [pemanas,  setPemanas]  = useState(true);
  const [kipas,    setKipas]    = useState(true);
  const [pelembab, setPelembab] = useState(false);
  const [rakGerak, setRakGerak] = useState(false);

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      height: '100%',
      boxSizing: 'border-box',
    }}>

      {/* ===== 3 SENSOR CARDS (50% TINGGI) ===== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.15fr 1.15fr 1.6fr',
        gap: 10,
        flex: 1,                    /* 50% tinggi layar seimbang */
        minHeight: 0,
      }}>

        {/* SUHU INTERNAL */}
        <div style={{
          background: 'linear-gradient(145deg, #FFFDF9 0%, #FFEDD5 100%)',
          borderRadius: 20,
          padding: '14px 18px',
          border: '2px solid #FED7AA',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 6px 16px rgba(249,115,22,0.12)',
        }}>
          {/* Background Icon — tepat di tengah kanan */}
          <span className="material-symbols-rounded" style={{
            position: 'absolute',
            right: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 115,
            color: 'rgba(249,115,22,0.13)',
            pointerEvents: 'none',
            lineHeight: 1,
            userSelect: 'none',
          }}>
            thermometer
          </span>

          {/* 1. Atas: Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#C2410C', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Suhu Internal
            </span>
            <span style={{
              fontSize: 12, fontWeight: 800,
              background: '#FFEDD5', color: '#EA580C',
              padding: '3px 10px', borderRadius: 999,
              fontFamily: "'JetBrains Mono', monospace",
              border: '1.5px solid #FED7AA',
            }}>
              TARGET 37.8°C
            </span>
          </div>

          {/* 2. Tengah Vertikal: Nilai Besar */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, position: 'relative', zIndex: 1, my: 'auto' }}>
            <span style={{
              fontSize: 66,
              fontWeight: 900,
              color: '#EA580C',
              lineHeight: 0.95,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '-0.03em',
            }}>
              {pemanas ? '37.5' : '36.2'}
            </span>
            <span style={{ fontSize: 28, fontWeight: 900, color: '#FB923C' }}>°C</span>
          </div>

          {/* 3. Bawah: Status Pill */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: pemanas ? 'rgba(34,197,94,0.18)' : 'rgba(148,163,184,0.2)',
              padding: '5px 14px', borderRadius: 999,
            }}>
              <div style={{
                width: 9, height: 9, borderRadius: '50%',
                background: pemanas ? '#22C55E' : '#94A3B8',
                boxShadow: pemanas ? '0 0 8px #22C55E' : 'none',
              }} />
              <span style={{
                fontSize: 13, fontWeight: 800,
                color: pemanas ? '#15803D' : '#475569',
              }}>
                {pemanas ? 'Pemanas Aktif · Menghangatkan' : 'Pemanas Siaga · Suhu Stabil'}
              </span>
            </div>
          </div>
        </div>

        {/* KELEMBABAN */}
        <div style={{
          background: 'linear-gradient(145deg, #F8FAFF 0%, #DBEAFE 100%)',
          borderRadius: 20,
          padding: '14px 18px',
          border: '2px solid #BFDBFE',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 6px 16px rgba(59,130,246,0.12)',
        }}>
          {/* Background Icon — tepat di tengah kanan */}
          <span className="material-symbols-rounded" style={{
            position: 'absolute',
            right: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 115,
            color: 'rgba(59,130,246,0.13)',
            pointerEvents: 'none',
            lineHeight: 1,
            userSelect: 'none',
          }}>
            water_drop
          </span>

          {/* 1. Atas: Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#1D4ED8', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Kelembaban
            </span>
            <span style={{
              fontSize: 12, fontWeight: 800,
              background: '#DBEAFE', color: '#2563EB',
              padding: '3px 10px', borderRadius: 999,
              fontFamily: "'JetBrains Mono', monospace",
              border: '1.5px solid #BFDBFE',
            }}>
              TARGET 60%
            </span>
          </div>

          {/* 2. Tengah Vertikal: Nilai Besar */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, position: 'relative', zIndex: 1, my: 'auto' }}>
            <span style={{
              fontSize: 66,
              fontWeight: 900,
              color: '#2563EB',
              lineHeight: 0.95,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '-0.03em',
            }}>
              {pelembab ? '65' : '55'}
            </span>
            <span style={{ fontSize: 28, fontWeight: 900, color: '#60A5FA' }}>% RH</span>
          </div>

          {/* 3. Bawah: Status Pill */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: pelembab ? 'rgba(34,197,94,0.18)' : 'rgba(148,163,184,0.2)',
              padding: '5px 14px', borderRadius: 999,
            }}>
              <div style={{
                width: 9, height: 9, borderRadius: '50%',
                background: pelembab ? '#22C55E' : '#94A3B8',
                boxShadow: pelembab ? '0 0 8px #22C55E' : 'none',
              }} />
              <span style={{
                fontSize: 13, fontWeight: 800,
                color: pelembab ? '#15803D' : '#475569',
              }}>
                {pelembab ? 'Pelembab Aktif · Spray ON' : 'Pelembab Siaga · Stabil'}
              </span>
            </div>
          </div>
        </div>

        {/* BATCH AKTIF */}
        <div style={{
          background: 'linear-gradient(140deg, #22C55E 0%, #16A34A 60%, #15803D 100%)',
          borderRadius: 20,
          padding: '14px 20px',
          boxShadow: '0 8px 24px rgba(34,197,94,0.34)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          {/* Background Icon — tepat di tengah kanan */}
          <span className="material-symbols-rounded" style={{
            position: 'absolute',
            right: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 125,
            color: 'rgba(255,255,255,0.16)',
            pointerEvents: 'none',
            lineHeight: 1,
            userSelect: 'none',
          }}>
            egg
          </span>

          {/* 1. Atas: Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 900, color: 'rgba(255,255,255,0.92)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                Batch Aktif
              </span>
              <span style={{
                fontSize: 11, fontWeight: 800,
                background: 'rgba(255,255,255,0.25)', color: '#FFFFFF',
                padding: '3px 10px', borderRadius: 999,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.06em',
              }}>
                #24-09
              </span>
            </div>
            <span style={{
              fontSize: 12, fontWeight: 800,
              color: '#FFFFFF', background: 'rgba(0,0,0,0.24)',
              padding: '3px 10px', borderRadius: 999,
            }}>
              Ayam Kampung
            </span>
          </div>

          {/* 2. Tengah Vertikal: Nilai Besar */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, position: 'relative', zIndex: 1, my: 'auto' }}>
            <span style={{
              fontSize: 64,
              fontWeight: 900,
              color: '#FFFFFF',
              lineHeight: 0.95,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '-0.03em',
            }}>
              Hari 7
            </span>
            <span style={{ fontSize: 26, fontWeight: 900, color: 'rgba(255,255,255,0.78)' }}>
              / 21 Hari
            </span>
          </div>

          {/* 3. Bawah: Progress Bar */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#FFFFFF' }}>
                33.3% Selesai
              </span>
              <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(255,255,255,0.9)', fontFamily: "'JetBrains Mono', monospace" }}>
                14 Hari Tersisa
              </span>
            </div>
            <div style={{
              height: 10,
              background: 'rgba(0,0,0,0.25)',
              borderRadius: 999,
              overflow: 'hidden',
              padding: 1.5,
            }}>
              <div style={{
                width: '33.3%',
                height: '100%',
                background: '#FFFFFF',
                borderRadius: 999,
                boxShadow: '0 0 10px rgba(255,255,255,0.9)',
                transition: 'width 0.4s ease',
              }} />
            </div>
          </div>
        </div>

      </div>

      {/* ===== 4 CONTROL CARDS (50% TINGGI) — FONT SANGAT BESAR & PADAT ===== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: 10,
        flex: 1,                    /* 50% tinggi layar seimbang */
        minHeight: 0,
      }}>

        {/* PEMANAS */}
        <ControlCard
          icon="local_fire_department"
          label="Pemanas"
          sublabel="Elemen pemanas · Target 37.8°C"
          gradient="linear-gradient(135deg, #F97316 0%, #EF4444 100%)"
          colorOn="#EF4444"
        >
          <SliderToggle value={pemanas} onChange={setPemanas} labelOff="MATI" labelOn="AKTIF" />
        </ControlCard>

        {/* SIRKULASI KIPAS */}
        <ControlCard
          icon="mode_fan"
          label="Sirkulasi Kipas"
          sublabel="Exhaust & sirkulasi udara · 2400 RPM"
          gradient="linear-gradient(135deg, #38BDF8 0%, #3B82F6 100%)"
          colorOn="#3B82F6"
        >
          <SliderToggle value={kipas} onChange={setKipas} labelOff="MATI" labelOn="AKTIF" />
        </ControlCard>

        {/* PELEMBAB UDARA */}
        <ControlCard
          icon="water_drop"
          label="Pelembab Udara"
          sublabel="Ultrasonic humidifier · Target 60%"
          gradient="linear-gradient(135deg, #34D399 0%, #14B8A6 100%)"
          colorOn="#14B8A6"
        >
          <SliderToggle value={pelembab} onChange={setPelembab} labelOff="MATI" labelOn="AKTIF" />
        </ControlCard>

        {/* PEMBALIK RAK — slider konsisten di kiri */}
        <ControlCard
          icon="view_carousel"
          label="Pembalik Rak"
          sublabel="Sistem tilt kemiringan · Semua rak"
          gradient="linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)"
          colorOn="#8B5CF6"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <SliderToggle
              value={rakGerak}
              onChange={setRakGerak}
              labelOff="DIAM"
              labelOn="BERGERAK"
            />
            <span
              className="material-symbols-rounded"
              style={{
                fontSize: 20,
                color: rakGerak ? '#FFFFFF' : 'rgba(255,255,255,0.45)',
                animation: rakGerak ? 'spin-slow 2.5s linear infinite' : 'none',
                marginLeft: 2,
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
