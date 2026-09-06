import React, { useState } from 'react';

/* ---- Inline editable field ---- */
const EditField = ({ label, value, onChange, icon, color, bg, border, unit = '' }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  return (
    <div style={{
      background: bg,
      border: `1.5px solid ${border}`,
      borderRadius: 12,
      padding: '7px 12px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span className="material-symbols-rounded" style={{ fontSize: 19, color }}>{icon}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: '#64748B', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 1 }}>{label}</div>
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
              fontSize: 15, fontWeight: 800, color: '#0F172A',
              fontFamily: 'Inter, sans-serif',
            }}
          />
        ) : (
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{value}{unit}</div>
        )}
      </div>
      <button onClick={() => { setDraft(value); setEditing(!editing); }} style={{
        width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
        background: editing ? color + '18' : '#F1F5F9',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span className="material-symbols-rounded" style={{ fontSize: 16, color: editing ? color : '#64748B' }}>
          {editing ? 'check' : 'edit'}
        </span>
      </button>
    </div>
  );
};

/* ---- Health card (Compact 2x2 style) ---- */
const HealthCard = ({ icon, title, detail, status, color, bg, border }) => (
  <div style={{
    background: bg, border: `1.5px solid ${border}`, borderRadius: 12,
    padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 8,
  }}>
    <div style={{
      width: 32, height: 32, borderRadius: 8,
      background: color + '18',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <span className="material-symbols-rounded" style={{ fontSize: 18, color }}>{icon}</span>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A', lineHeight: 1.1 }}>{title}</div>
      <div style={{ fontSize: 10, fontWeight: 600, color: '#64748B', marginTop: 1 }}>{detail}</div>
    </div>
    <span style={{
      padding: '2px 8px', borderRadius: 999,
      background: color + '22', color,
      fontSize: 9, fontWeight: 900,
      fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em',
      textTransform: 'uppercase', flexShrink: 0,
    }}>{status}</span>
  </div>
);

/* ---- Alarm row ---- */
const AlarmRow = ({ level, time, id, msg, color, bg, border }) => (
  <div style={{
    background: bg, border: `1.5px solid ${border}`, borderRadius: 12,
    padding: '7px 12px',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
      <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
        <span style={{
          padding: '2px 8px', borderRadius: 999,
          background: color, color: '#FFF',
          fontSize: 9, fontWeight: 900, letterSpacing: '0.08em',
          fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase',
        }}>{level}</span>
        <span style={{ fontSize: 11, fontWeight: 700, color: '#64748B', fontFamily: "'JetBrains Mono', monospace" }}>{time}</span>
      </div>
      <span style={{ fontSize: 10, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace" }}>{id}</span>
    </div>
    <p style={{ fontSize: 12, color: '#1E293B', fontWeight: 600, lineHeight: 1.3, margin: 0 }}>{msg}</p>
  </div>
);

/* ================================================
   PROFIL SISTEM — Tipografi Bolder & Padat
   ================================================ */
const ProfilSistem = () => {
  const [namaPeternak,  setNamaPeternak]  = useState('Ahmad Fauzi');
  const [namaFarm,      setNamaFarm]      = useState('Farm Sejahtera');
  const [noHP,          setNoHP]          = useState('0812-3456-7890');
  const [lokasi,        setLokasi]        = useState('Bandung, Jawa Barat');
  const [kapasitas,     setKapasitas]     = useState('1200');

  const health = [
    { icon: 'sensors',                 title: 'Jaringan Sensor',  detail: '48/48 Aktif · 12ms',        status: 'OPTIMAL',    color: '#22C55E', bg: '#F0FDF4', border: '#BBF7D0' },
    { icon: 'precision_manufacturing', title: 'Aktuator & Motor', detail: 'Motor B · Beban 85%',       status: 'PERINGATAN', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
    { icon: 'cloud_sync',              title: 'Koneksi Cloud',    detail: 'Sinkron 2 mnt lalu',        status: 'STABIL',     color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
    { icon: 'memory',                  title: 'CPU Sistem',       detail: 'Load 42% · Temp 48°C',      status: 'NORMAL',     color: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE' },
  ];

  const alarms = [
    { level: 'KRITIS',    time: '14:02:15', id: 'ERR-T09', msg: 'Temperatur Rak A melebihi ambang batas (39.5°C).', color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
    { level: 'PERINGATAN',time: '13:45:00', id: 'WRN-M02', msg: 'Torsi Motor Penggerak B tinggi. Cek pelumasan.',    color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  ];

  return (
    <div style={{ display: 'flex', gap: 10, height: '100%', boxSizing: 'border-box' }}>

      {/* ===== LEFT: Farmer Profile ===== */}
      <div style={{ width: '42%', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>

        {/* Profile card header */}
        <div style={{
          background: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',
          borderRadius: 18, padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: 12,
          boxShadow: '0 6px 18px rgba(139,92,246,0.35)',
          position: 'relative', overflow: 'hidden', flexShrink: 0,
        }}>
          {/* Avatar */}
          <div style={{
            width: 50, height: 50, borderRadius: '50%',
            background: 'rgba(255,255,255,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2.5px solid rgba(255,255,255,0.45)',
            flexShrink: 0,
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 30, color: '#FFF' }}>person</span>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF', lineHeight: 1.1 }}>{namaPeternak}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginTop: 2 }}>{namaFarm}</div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <span style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.95)', background: 'rgba(255,255,255,0.22)', padding: '2px 8px', borderRadius: 999, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em' }}>
                PETERNAK
              </span>
              <span style={{ fontSize: 10, fontWeight: 900, color: 'rgba(255,255,255,0.95)', background: 'rgba(255,255,255,0.22)', padding: '2px 8px', borderRadius: 999, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em' }}>
                {kapasitas} TELUR
              </span>
            </div>
          </div>
        </div>

        {/* Editable fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, justifyContent: 'space-between' }}>
          <EditField label="Nama Peternak"  value={namaPeternak}  onChange={setNamaPeternak}  icon="person"        color="#8B5CF6" bg="#F5F3FF" border="#DDD6FE" />
          <EditField label="Nama Farm"      value={namaFarm}      onChange={setNamaFarm}      icon="agriculture"   color="#22C55E" bg="#F0FDF4" border="#BBF7D0" />
          <EditField label="No. Telepon"    value={noHP}          onChange={setNoHP}          icon="phone"         color="#3B82F6" bg="#EFF6FF" border="#BFDBFE" />
          <EditField label="Lokasi"         value={lokasi}        onChange={setLokasi}        icon="location_on"   color="#EF4444" bg="#FEF2F2" border="#FECACA" />
          <EditField label="Kapasitas Maks" value={kapasitas}     onChange={setKapasitas}     icon="egg"           color="#F59E0B" bg="#FFFBEB" border="#FDE68A" unit=" telur" />
        </div>
      </div>

      {/* ===== RIGHT: System Health (2x2 Grid) + Alarms ===== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'space-between' }}>

        {/* System Health — 2x2 Grid Layout */}
        <div style={{ background: '#FFFFFF', borderRadius: 18, border: '2px solid #E2E8F0', padding: '10px 14px', boxShadow: '0 3px 10px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg, #6EE7B7, #22C55E)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(34,197,94,0.3)',
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#FFF' }}>health_and_safety</span>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A' }}>Kesehatan Sistem</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {health.map((h, i) => <HealthCard key={i} {...h} />)}
          </div>
        </div>

        {/* Alarm Log */}
        <div style={{ background: '#FFFFFF', borderRadius: 18, border: '2px solid #E2E8F0', padding: '10px 14px', flex: 1, display: 'flex', flexDirection: 'column', boxShadow: '0 3px 10px rgba(0,0,0,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg, #FCA5A5, #EF4444)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(239,68,68,0.3)',
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#FFF' }}>notifications_active</span>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A' }}>Alarm Aktif ({alarms.length})</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, justifyContent: 'center' }}>
            {alarms.map((a, i) => <AlarmRow key={i} {...a} />)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilSistem;
