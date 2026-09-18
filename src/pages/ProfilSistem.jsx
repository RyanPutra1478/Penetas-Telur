import React, { useState } from 'react';

/* ---- Inline editable field with comfortable touch targets ---- */
const EditField = ({ label, value, onChange, icon, color, bg, border, unit = '' }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  return (
    <div style={{
      background: bg,
      border: `1.5px solid ${border}`,
      borderRadius: 12,
      padding: '8px 12px',
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      boxSizing: 'border-box',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 8,
        background: color + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <span className="material-symbols-rounded" style={{ fontSize: 18, color }}>{icon}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 9, fontWeight: 800, color: '#64748B', letterSpacing: '0.05em', textTransform: 'uppercase', lineHeight: 1.1 }}>
          {label}
        </div>
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={() => { onChange(draft); setEditing(false); }}
            onKeyDown={e => {
              if (e.key === 'Enter') { onChange(draft); setEditing(false); }
              if (e.key === 'Escape') { setDraft(value); setEditing(false); }
            }}
            style={{
              width: '100%', border: 'none', outline: 'none',
              background: 'transparent',
              fontSize: 13, fontWeight: 900, color: '#0F172A',
              fontFamily: 'Inter, sans-serif', padding: 0, marginTop: 1,
            }}
          />
        ) : (
          <div style={{
            fontSize: 13, fontWeight: 900, color: '#0F172A', marginTop: 1,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
          }}>
            {value}{unit}
          </div>
        )}
      </div>
      <button
        onClick={() => { setDraft(value); setEditing(!editing); }}
        style={{
          width: 28, height: 28, borderRadius: 7, cursor: 'pointer',
          background: editing ? color + '22' : '#FFFFFF',
          border: `1px solid ${border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <span className="material-symbols-rounded" style={{ fontSize: 15, color: editing ? color : '#64748B' }}>
          {editing ? 'check' : 'edit'}
        </span>
      </button>
    </div>
  );
};

/* ================================================
   PROFIL SISTEM — Fokus Panel Profil Peternak Saja
   ================================================ */
const ProfilSistem = () => {
  const [namaPeternak, setNamaPeternak] = useState('Ahmad Fauzi');
  const [namaFarm,     setNamaFarm]     = useState('Farm Sejahtera');
  const [noHP,         setNoHP]         = useState('0812-3456-7890');
  const [lokasi,       setLokasi]       = useState('Bandung, Jawa Barat');
  const [kapasitas,    setKapasitas]    = useState('1200');

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'stretch',
      height: '100%',
      boxSizing: 'border-box',
    }}>
      {/* Kartu Profil Utama — Terpusat & Proporsional */}
      <div style={{
        width: '100%',
        maxWidth: 680,
        background: '#FFFFFF',
        borderRadius: 18,
        border: '2px solid #E2E8F0',
        padding: '14px 18px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}>
        <div className="batik-overlay batik-overlay-neutral" />

        {/* 1. Header Banner Profil */}
        <div
          style={{
            background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 60%, #A855F7 100%)',
            borderRadius: 14,
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            boxShadow: '0 4px 14px rgba(99,102,241,0.3)',
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
            zIndex: 1,
          }}
        >
          <div className="batik-overlay batik-overlay-white" />

          {/* Avatar Icon */}
          <div style={{
            width: 48, height: 48, borderRadius: '50%',
            background: 'rgba(255,255,255,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid rgba(255,255,255,0.5)',
            flexShrink: 0,
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 28, color: '#FFF' }}>
              person
            </span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 17, fontWeight: 900, color: '#FFF',
              lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {namaPeternak}
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.92)', marginTop: 2 }}>
              {namaFarm}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              <span style={{
                fontSize: 8.5, fontWeight: 900, color: '#FFF',
                background: 'rgba(255,255,255,0.22)', padding: '2px 8px', borderRadius: 999,
                fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em'
              }}>
                PETERNAK MANDIRI
              </span>
              <span style={{
                fontSize: 8.5, fontWeight: 900, color: '#FFF',
                background: 'rgba(255,255,255,0.22)', padding: '2px 8px', borderRadius: 999,
                fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em'
              }}>
                {kapasitas} BUTIR TELUR
              </span>
            </div>
          </div>
        </div>

        {/* 2. Grid Informasi Profil (5 Field Tersusun Rapi) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          position: 'relative',
          zIndex: 1,
          my: 'auto',
        }}>
          <EditField
            label="Nama Peternak"
            value={namaPeternak}
            onChange={setNamaPeternak}
            icon="person"
            color="#8B5CF6"
            bg="#F5F3FF"
            border="#DDD6FE"
          />
          <EditField
            label="Nama Usaha / Farm"
            value={namaFarm}
            onChange={setNamaFarm}
            icon="agriculture"
            color="#22C55E"
            bg="#F0FDF4"
            border="#BBF7D0"
          />
          <EditField
            label="No. WhatsApp / Kontak"
            value={noHP}
            onChange={setNoHP}
            icon="phone"
            color="#3B82F6"
            bg="#EFF6FF"
            border="#BFDBFE"
          />
          <EditField
            label="Lokasi Kandang"
            value={lokasi}
            onChange={setLokasi}
            icon="location_on"
            color="#EF4444"
            bg="#FEF2F2"
            border="#FECACA"
          />
          <div style={{ gridColumn: 'span 2' }}>
            <EditField
              label="Kapasitas Maksimal Rak Telur"
              value={kapasitas}
              onChange={setKapasitas}
              icon="egg"
              color="#F59E0B"
              bg="#FFFBEB"
              border="#FDE68A"
              unit=" butir telur"
            />
          </div>
        </div>

        {/* 3. Footer Status & Info Perangkat */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          background: '#F8FAFC',
          borderRadius: 11,
          border: '1.5px solid #F1F5F9',
          position: 'relative',
          zIndex: 1,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{
              width: 7, height: 7, borderRadius: '50%',
              background: '#22C55E', boxShadow: '0 0 6px rgba(34,197,94,0.6)'
            }} />
            <span style={{ fontSize: 10.5, fontWeight: 700, color: '#334155' }}>
              Data tersimpan otomatis di penyimpanan lokal
            </span>
          </div>
          <span style={{
            fontSize: 9.5, fontWeight: 800, color: '#64748B',
            fontFamily: "'JetBrains Mono', monospace"
          }}>
            TETASCO HMI · PI 4
          </span>
        </div>

      </div>
    </div>
  );
};

export default ProfilSistem;
