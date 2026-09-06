import React, { useState } from 'react';

/* ---- Inline editable field ---- */
const EditField = ({ label, value, onChange, icon, color, bg, border, unit = '' }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  return (
    <div style={{
      background: bg,
      border: `1.5px solid ${border}`,
      borderRadius: 14,
      padding: '12px 14px',
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      <div style={{
        width: 40, height: 40, borderRadius: 11,
        background: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span className="material-symbols-rounded" style={{ fontSize: 20, color }}>{icon}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 3 }}>{label}</div>
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
              fontSize: 15, fontWeight: 700, color: '#0F172A',
              fontFamily: 'Inter, sans-serif',
            }}
          />
        ) : (
          <div style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{value}{unit}</div>
        )}
      </div>
      <button onClick={() => { setDraft(value); setEditing(!editing); }} style={{
        width: 34, height: 34, borderRadius: 9, border: 'none', cursor: 'pointer',
        background: editing ? color + '18' : '#F1F5F9',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span className="material-symbols-rounded" style={{ fontSize: 16, color: editing ? color : '#94A3B8' }}>
          {editing ? 'check' : 'edit'}
        </span>
      </button>
    </div>
  );
};

/* ---- Health card ---- */
const HealthCard = ({ icon, title, detail, status, color, bg, border }) => (
  <div style={{
    background: bg, border: `1.5px solid ${border}`, borderRadius: 14,
    padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
  }}>
    <div style={{
      width: 42, height: 42, borderRadius: 12,
      background: color + '18',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <span className="material-symbols-rounded" style={{ fontSize: 22, color }}>{icon}</span>
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>{title}</div>
      <div style={{ fontSize: 10, fontWeight: 500, color: '#64748B' }}>{detail}</div>
    </div>
    <span style={{
      padding: '3px 12px', borderRadius: 999,
      background: color + '18', color,
      fontSize: 9, fontWeight: 800,
      fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em',
      textTransform: 'uppercase', flexShrink: 0,
    }}>{status}</span>
  </div>
);

/* ---- Alarm row ---- */
const AlarmRow = ({ level, time, id, msg, color, bg, border }) => (
  <div style={{
    background: bg, border: `1.5px solid ${border}`, borderRadius: 12,
    padding: '10px 14px',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span style={{
          padding: '2px 10px', borderRadius: 999,
          background: color, color: '#FFF',
          fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
          fontFamily: "'JetBrains Mono', monospace", textTransform: 'uppercase',
        }}>{level}</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', fontFamily: "'JetBrains Mono', monospace" }}>{time}</span>
      </div>
      <span style={{ fontSize: 9, fontWeight: 700, color, fontFamily: "'JetBrains Mono', monospace" }}>{id}</span>
    </div>
    <p style={{ fontSize: 12, color: '#374151', fontWeight: 500, lineHeight: 1.4, margin: 0 }}>{msg}</p>
  </div>
);

/* ================================================
   PROFIL SISTEM — Farmer profile + system health
   ================================================ */
const ProfilSistem = () => {
  const [namaPeternak,  setNamaPeternak]  = useState('Ahmad Fauzi');
  const [namaFarm,      setNamaFarm]      = useState('Farm Sejahtera');
  const [noHP,          setNoHP]          = useState('0812-3456-7890');
  const [lokasi,        setLokasi]        = useState('Bandung, Jawa Barat');
  const [kapasitas,     setKapasitas]     = useState('1200');

  const health = [
    { icon: 'sensors',                 title: 'Jaringan Sensor',  detail: '48/48 Aktif · Latensi 12ms',       status: 'OPTIMAL',    color: '#22C55E', bg: '#F0FDF4', border: '#BBF7D0' },
    { icon: 'precision_manufacturing', title: 'Aktuator & Motor', detail: 'Motor B Torsi Tinggi · Beban 85%', status: 'PERINGATAN', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
    { icon: 'cloud_sync',              title: 'Koneksi Cloud',    detail: 'Sinkronisasi 2 mnt lalu',           status: 'STABIL',     color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
    { icon: 'memory',                  title: 'CPU Sistem',       detail: 'Load 42% · Temp MCU 48°C',         status: 'NORMAL',     color: '#6366F1', bg: '#EEF2FF', border: '#C7D2FE' },
  ];

  const alarms = [
    { level: 'KRITIS',    time: '14:02:15', id: 'ERR-T09', msg: 'Temperatur Rak A melebihi ambang batas (39.5°C).', color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
    { level: 'PERINGATAN',time: '13:45:00', id: 'WRN-M02', msg: 'Torsi Motor Penggerak B tinggi. Cek pelumasan.',    color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  ];

  return (
    <div style={{ display: 'flex', gap: 14, height: '100%' }}>

      {/* ===== LEFT: Farmer Profile ===== */}
      <div style={{ width: '42%', display: 'flex', flexDirection: 'column', gap: 12, flexShrink: 0 }}>

        {/* Profile card header */}
        <div style={{
          background: 'linear-gradient(135deg, #A78BFA 0%, #8B5CF6 100%)',
          borderRadius: 20, padding: '18px 20px',
          display: 'flex', alignItems: 'center', gap: 16,
          boxShadow: '0 8px 24px rgba(139,92,246,0.35)',
          position: 'relative', overflow: 'hidden', flexShrink: 0,
        }}>
          {/* Blob */}
          <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', pointerEvents: 'none' }} />
          {/* Avatar */}
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(255,255,255,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '3px solid rgba(255,255,255,0.4)',
            flexShrink: 0,
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 36, color: '#FFF' }}>person</span>
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF', lineHeight: 1.1 }}>{namaPeternak}</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginTop: 3 }}>{namaFarm}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.18)', padding: '3px 10px', borderRadius: 999, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em' }}>
                PETERNAK
              </span>
              <span style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.18)', padding: '3px 10px', borderRadius: 999, fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em' }}>
                {kapasitas} TELUR
              </span>
            </div>
          </div>
        </div>

        {/* Editable fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, overflow: 'auto' }}>
          <EditField label="Nama Peternak"  value={namaPeternak}  onChange={setNamaPeternak}  icon="person"        color="#8B5CF6" bg="#F5F3FF" border="#DDD6FE" />
          <EditField label="Nama Farm"      value={namaFarm}      onChange={setNamaFarm}      icon="agriculture"   color="#22C55E" bg="#F0FDF4" border="#BBF7D0" />
          <EditField label="No. Telepon"    value={noHP}          onChange={setNoHP}          icon="phone"         color="#3B82F6" bg="#EFF6FF" border="#BFDBFE" />
          <EditField label="Lokasi"         value={lokasi}        onChange={setLokasi}        icon="location_on"   color="#EF4444" bg="#FEF2F2" border="#FECACA" />
          <EditField label="Kapasitas Maks" value={kapasitas}     onChange={setKapasitas}     icon="egg"           color="#F59E0B" bg="#FFFBEB" border="#FDE68A" unit=" telur" />
        </div>
      </div>

      {/* ===== RIGHT: System Health + Alarms ===== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, overflow: 'auto' }}>

        {/* System Health */}
        <div style={{ background: '#FFFFFF', borderRadius: 20, border: '1.5px solid #E2E8F0', padding: '16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 11,
              background: 'linear-gradient(135deg, #6EE7B7, #22C55E)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 3px 8px rgba(34,197,94,0.3)',
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 22, color: '#FFF' }}>health_and_safety</span>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>Kesehatan Sistem</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8' }}>4 subsistem terpantau</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {health.map((h, i) => <HealthCard key={i} {...h} />)}
          </div>
        </div>

        {/* Alarm Log */}
        <div style={{ background: '#FFFFFF', borderRadius: 20, border: '1.5px solid #E2E8F0', padding: '16px', flex: 1, minHeight: 0, overflow: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 11,
              background: 'linear-gradient(135deg, #FCA5A5, #EF4444)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 3px 8px rgba(239,68,68,0.3)',
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 22, color: '#FFF' }}>notifications_active</span>
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>Alarm Aktif</div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8' }}>{alarms.length} alarm terdaftar</div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {alarms.map((a, i) => <AlarmRow key={i} {...a} />)}
            {alarms.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: '#94A3B8', fontSize: 13, fontWeight: 600 }}>
                Tidak ada alarm aktif ✓
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilSistem;
