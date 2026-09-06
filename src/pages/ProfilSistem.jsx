import React, { useState } from 'react';

/* ---- Inline editable field ---- */
const EditField = ({ label, value, onChange, icon, color, bg, border, unit = '' }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  return (
    <div style={{
      background: bg,
      border: `1.5px solid ${border}`,
      borderRadius: 11,
      padding: '5px 10px',
      display: 'flex',
      alignItems: 'center',
      gap: 9,
    }}>
      <div style={{
        width: 28, height: 28, borderRadius: 7,
        background: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span className="material-symbols-rounded" style={{ fontSize: 17, color }}>{icon}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: '#64748B', letterSpacing: '0.06em', textTransform: 'uppercase', lineHeight: 1 }}>{label}</div>
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={() => { onChange(draft); setEditing(false); }}
            onKeyDown={e => { if (e.key === 'Enter') { onChange(draft); setEditing(false); } if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
            style={{
              width: '100%', border: 'none', outline: 'none',
              background: 'transparent',
              fontSize: 14, fontWeight: 800, color: '#0F172A',
              fontFamily: 'Inter, sans-serif', padding: 0, marginTop: 1,
            }}
          />
        ) : (
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginTop: 1 }}>{value}{unit}</div>
        )}
      </div>
      <button onClick={() => { setDraft(value); setEditing(!editing); }} style={{
        width: 26, height: 26, borderRadius: 7, border: 'none', cursor: 'pointer',
        background: editing ? color + '22' : '#FFFFFF',
        border: `1px solid ${border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span className="material-symbols-rounded" style={{ fontSize: 14, color: editing ? color : '#64748B' }}>
          {editing ? 'check' : 'edit'}
        </span>
      </button>
    </div>
  );
};

/* ---- Health Card with telemetry progress bar ---- */
const HealthCard = ({ icon, title, value, detail, percent, status, color, bg, border }) => (
  <div style={{
    background: bg,
    border: `1.5px solid ${border}`,
    borderRadius: 11,
    padding: '7px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span className="material-symbols-rounded" style={{ fontSize: 18, color }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>{title}</span>
      </div>
      <span style={{
        padding: '2px 7px', borderRadius: 999,
        background: color + '22', color,
        fontSize: 9, fontWeight: 900,
        fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}>{status}</span>
    </div>

    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <span style={{ fontSize: 11, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: '#64748B' }}>{detail}</span>
      </div>
      <div style={{ height: 5, background: 'rgba(0,0,0,0.07)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ width: `${percent}%`, height: '100%', background: color, borderRadius: 999 }} />
      </div>
    </div>
  </div>
);

/* ---- Rich Alarm Card ---- */
const AlarmCard = ({ level, time, id, msg, action, color, bg, border }) => (
  <div style={{
    background: bg,
    border: `1.5px solid ${border}`,
    borderLeft: `4px solid ${color}`,
    borderRadius: 10,
    padding: '5px 10px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
        <span style={{
          padding: '2px 7px', borderRadius: 999,
          background: color, color: '#FFF',
          fontSize: 9, fontWeight: 900, letterSpacing: '0.08em',
          fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase',
        }}>{level}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', fontFamily: "'JetBrains Mono', monospace" }}>{time}</span>
        <span style={{ fontSize: 10, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace" }}>{id}</span>
      </div>
      <button style={{
        padding: '2px 8px', borderRadius: 5,
        border: `1px solid ${color}40`,
        background: '#FFFFFF', color,
        fontSize: 9, fontWeight: 800, cursor: 'pointer',
        fontFamily: "'JetBrains Mono', monospace",
      }}>
        {action}
      </button>
    </div>
    <p style={{ fontSize: 11, color: '#1E293B', fontWeight: 600, lineHeight: 1.3, margin: 0 }}>{msg}</p>
  </div>
);

/* ================================================
   PROFIL SISTEM — Konten Berada di Atas (Top-Aligned)
   ================================================ */
const ProfilSistem = () => {
  const [namaPeternak,  setNamaPeternak]  = useState('Ahmad Fauzi');
  const [namaFarm,      setNamaFarm]      = useState('Farm Sejahtera');
  const [noHP,          setNoHP]          = useState('0812-3456-7890');
  const [lokasi,        setLokasi]        = useState('Bandung, Jawa Barat');
  const [kapasitas,     setKapasitas]     = useState('1200');

  const health = [
    { icon: 'sensors',                 title: 'Jaringan Sensor',  value: '48/48 Sensor', detail: 'Latensi 12ms',        percent: 100, status: 'OPTIMAL',    color: '#22C55E', bg: '#F0FDF4', border: '#BBF7D0' },
    { icon: 'precision_manufacturing', title: 'Aktuator & Motor', value: 'Beban 85%',    detail: 'Motor B Torsi Tinggi', percent: 85,  status: 'PERINGATAN', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
    { icon: 'cloud_sync',              title: 'Koneksi Cloud',    value: 'Sinyal 98%',   detail: 'Sinkron 2 mnt lalu',   percent: 98,  status: 'STABIL',     color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
    { icon: 'memory',                  title: 'CPU & MCU',        value: 'Beban 42%',    detail: 'Temp Core 48°C',       percent: 42,  status: 'NORMAL',     color: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE' },
  ];

  const alarms = [
    { level: 'KRITIS',    time: '14:02:15', id: 'ERR-T09', msg: 'Temperatur Rak A melebihi ambang batas (39.5°C). Sistem pemanas dinonaktifkan darurat.', action: 'RESET SENSOR', color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
    { level: 'PERINGATAN',time: '13:45:00', id: 'WRN-M02', msg: 'Torsi Motor Penggerak B tinggi (85%). Disarankan periksa pelumasan mekanisme rak tilt.', action: 'CEK MOTOR',   color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  ];

  return (
    <div style={{ display: 'flex', gap: 10, height: '100%', boxSizing: 'border-box', alignItems: 'flex-start' }}>

      {/* ===== LEFT: Farmer Profile Card (Semua konten di atas rapat) ===== */}
      <div style={{
        width: 350,
        background: '#FFFFFF',
        borderRadius: 18,
        border: '2px solid #E2E8F0',
        padding: '10px 12px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',   /* Rapat di atas, bukan di bawah/tengah */
        gap: 6,                         /* Jarak rapat konsisten antar baris */
        boxShadow: '0 4px 14px rgba(0,0,0,0.05)',
        flexShrink: 0,
        boxSizing: 'border-box',
      }}>

        {/* Profile Card Header */}
        <div style={{
          background: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',
          borderRadius: 14,
          padding: '9px 12px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          boxShadow: '0 3px 10px rgba(139,92,246,0.35)',
        }}>
          {/* Avatar */}
          <div style={{
            width: 44, height: 44, borderRadius: '50%',
            background: 'rgba(255,255,255,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid rgba(255,255,255,0.45)',
            flexShrink: 0,
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 26, color: '#FFF' }}>person</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF', lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {namaPeternak}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>
              {namaFarm}
            </div>
            <div style={{ display: 'flex', gap: 5, marginTop: 3 }}>
              <span style={{ fontSize: 9, fontWeight: 900, color: '#FFF', background: 'rgba(255,255,255,0.22)', padding: '1px 7px', borderRadius: 999, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em' }}>
                PETERNAK
              </span>
              <span style={{ fontSize: 9, fontWeight: 900, color: '#FFF', background: 'rgba(255,255,255,0.22)', padding: '1px 7px', borderRadius: 999, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em' }}>
                {kapasitas} TELUR
              </span>
            </div>
          </div>
        </div>

        {/* 5 Editable fields — Tepat di bawah header, rapat & teratur */}
        <EditField label="Nama Peternak"  value={namaPeternak}  onChange={setNamaPeternak}  icon="person"        color="#8B5CF6" bg="#F5F3FF" border="#DDD6FE" />
        <EditField label="Nama Farm"      value={namaFarm}      onChange={setNamaFarm}      icon="agriculture"   color="#22C55E" bg="#F0FDF4" border="#BBF7D0" />
        <EditField label="No. Telepon"    value={noHP}          onChange={setNoHP}          icon="phone"         color="#3B82F6" bg="#EFF6FF" border="#BFDBFE" />
        <EditField label="Lokasi"         value={lokasi}        onChange={setLokasi}        icon="location_on"   color="#EF4444" bg="#FEF2F2" border="#FECACA" />
        <EditField label="Kapasitas Maks" value={kapasitas}     onChange={setKapasitas}     icon="egg"           color="#F59E0B" bg="#FFFBEB" border="#FDE68A" unit=" telur" />
      </div>

      {/* ===== RIGHT: System Health & Alarms (Semua konten di atas rapat) ===== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0, justifyContent: 'flex-start' }}>

        {/* Panel 1: Kesehatan Sistem */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 18,
          border: '2px solid #E2E8F0',
          padding: '9px 14px',
          boxShadow: '0 3px 10px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 7,
                background: 'linear-gradient(135deg, #6EE7B7, #22C55E)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(34,197,94,0.3)',
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 17, color: '#FFF' }}>health_and_safety</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 900, color: '#0F172A' }}>Kesehatan Subsistem</span>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B' }}>4/4 Modul Terpantau</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {health.map((h, i) => <HealthCard key={i} {...h} />)}
          </div>
        </div>

        {/* Panel 2: Alarm & Peringatan Aktif (Rapat di atas) */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 18,
          border: '2px solid #E2E8F0',
          padding: '9px 14px',
          boxShadow: '0 3px 10px rgba(0,0,0,0.04)',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          justifyContent: 'flex-start',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{
                width: 26, height: 26, borderRadius: 7,
                background: 'linear-gradient(135deg, #FCA5A5, #EF4444)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(239,68,68,0.3)',
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 17, color: '#FFF' }}>notifications_active</span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 900, color: '#0F172A' }}>Log Alarm & Peringatan ({alarms.length})</span>
            </div>
            <button style={{
              padding: '3px 10px', borderRadius: 7,
              border: '1px solid #E2E8F0', background: '#F8FAFC',
              fontSize: 10, fontWeight: 800, color: '#64748B', cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              MUTE BUZZER
            </button>
          </div>

          {/* Alarm Cards list — tepat di bawah header, rapat */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {alarms.map((a, i) => <AlarmCard key={i} {...a} />)}
          </div>

          {/* Security assurance pill — langsung di bawah daftar alarm */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '5px 10px', background: '#F8FAFC', borderRadius: 8,
            border: '1px solid #F1F5F9', marginTop: 1,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E' }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: '#475569' }}>Fail-safe proteksi otomatis aktif</span>
            </div>
            <span style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', fontFamily: "'JetBrains Mono', monospace" }}>DIAGNOSTIK: NORMAL</span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default ProfilSistem;
