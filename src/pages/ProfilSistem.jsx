import React, { useState, useEffect } from 'react';
import { getFarmerProfile, updateFarmerProfile } from '../api/tetascoApi';

/* ---- Inline editable field with comfortable touch targets ---- */
const EditField = ({ label, value, onChange, icon, color, bg, border, unit = '' }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value || '');

  useEffect(() => {
    setDraft(value || '');
  }, [value]);

  const handleSave = () => {
    onChange(draft);
    setEditing(false);
  };

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
            onBlur={handleSave}
            onKeyDown={e => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') { setDraft(value || ''); setEditing(false); }
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
            {value || '-'}{unit}
          </div>
        )}
      </div>
      <button
        onClick={() => {
          if (editing) {
            handleSave();
          } else {
            setDraft(value || '');
            setEditing(true);
          }
        }}
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
   PROFIL SISTEM — 1 Lemari Mewakili 1 Akun Peternak
   ================================================ */
const ProfilSistem = () => {
  const [profile, setProfile] = useState({
    tetasco_id: 1,
    nama_lemari: 'Tetasco 01 (Lemari Utama)',
    nama_peternak: 'Peternak Tetasco',
    email: 'admin@tetasco.local',
    no_hp: '0812-3456-7890',
    nama_farm: 'Farm Berkah Sejahtera',
    lokasi: 'Indonesia',
    kapasitas: '1200 Butir',
  });

  const [saving, setSaving] = useState(false);

  // Ambil profil dari backend & cloud saat mount
  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      const data = await getFarmerProfile();
      if (isMounted && data) {
        setProfile(data);
      }
    };
    fetchProfile();
    return () => { isMounted = false; };
  }, []);

  const handleUpdateField = async (field, value) => {
    const updated = { ...profile, [field]: value };
    setProfile(updated);
    setSaving(true);
    await updateFarmerProfile({ [field]: value });
    setTimeout(() => setSaving(false), 800);
  };

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

        {/* 1. Header Banner Profil: 1 Lemari = 1 Akun Peternak */}
        <div
          style={{
            background: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 50%, #8B5CF6 100%)',
            borderRadius: 14,
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            boxShadow: '0 4px 14px rgba(79,70,229,0.3)',
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
            zIndex: 1,
          }}
        >
          <div className="batik-overlay batik-overlay-white" />

          {/* Avatar Icon */}
          <div style={{
            width: 50, height: 50, borderRadius: '50%',
            background: 'rgba(255,255,255,0.22)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid rgba(255,255,255,0.5)',
            flexShrink: 0,
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 30, color: '#FFF' }}>
              person
            </span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 17, fontWeight: 900, color: '#FFF',
              lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {profile.nama_peternak || 'Peternak Tetasco'}
            </div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.92)', marginTop: 2 }}>
              {profile.nama_lemari || 'Tetasco 01'} · {profile.nama_farm || 'Peternakan Lokal'}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
              <span style={{
                fontSize: 8.5, fontWeight: 900, color: '#FFF',
                background: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: 999,
                fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em'
              }}>
                LEMARI #{profile.tetasco_id || 1}
              </span>
              <span style={{
                fontSize: 8.5, fontWeight: 900, color: '#FFF',
                background: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: 999,
                fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em'
              }}>
                1 LEMARI · 1 AKUN
              </span>
              <span style={{
                fontSize: 8.5, fontWeight: 900, color: '#FEF08A',
                background: 'rgba(0,0,0,0.25)', padding: '2px 8px', borderRadius: 999,
                fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em'
              }}>
                {profile.email || 'peternak@tetasco.local'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Grid Informasi Profil (Tersusun Rapi) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10,
          position: 'relative',
          zIndex: 1,
          my: 'auto',
        }}>
          <EditField
            label="Nama Peternak (Pemilik Akun)"
            value={profile.nama_peternak}
            onChange={val => handleUpdateField('nama_peternak', val)}
            icon="person"
            color="#6366F1"
            bg="#EEF2FF"
            border="#C7D2FE"
          />
          <EditField
            label="Nama Lemari Inkubator"
            value={profile.nama_lemari}
            onChange={val => handleUpdateField('nama_lemari', val)}
            icon="meeting_room"
            color="#8B5CF6"
            bg="#F5F3FF"
            border="#DDD6FE"
          />
          <EditField
            label="Nama Usaha / Peternakan"
            value={profile.nama_farm}
            onChange={val => handleUpdateField('nama_farm', val)}
            icon="agriculture"
            color="#059669"
            bg="#ECFDF5"
            border="#A7F3D0"
          />
          <EditField
            label="No. WhatsApp / Kontak"
            value={profile.no_hp}
            onChange={val => handleUpdateField('no_hp', val)}
            icon="phone"
            color="#2563EB"
            bg="#EFF6FF"
            border="#BFDBFE"
          />
          <EditField
            label="Lokasi Kandang / Farm"
            value={profile.lokasi}
            onChange={val => handleUpdateField('lokasi', val)}
            icon="location_on"
            color="#DC2626"
            bg="#FEF2F2"
            border="#FECACA"
          />
          <EditField
            label="Kapasitas Lemari Telur"
            value={profile.kapasitas}
            onChange={val => handleUpdateField('kapasitas', val)}
            icon="egg"
            color="#D97706"
            bg="#FFFBEB"
            border="#FDE68A"
            unit=""
          />
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
              background: saving ? '#F59E0B' : '#10B981',
              boxShadow: saving ? '0 0 6px #F59E0B' : '0 0 6px #10B981'
            }} />
            <span style={{ fontSize: 10.5, fontWeight: 700, color: '#334155' }}>
              {saving ? 'Menyimpan perubahan profil...' : '1 Lemari mewakili 1 Akun Peternak (Tersimpan Lokal & Cloud)'}
            </span>
          </div>
          <span style={{
            fontSize: 9.5, fontWeight: 800, color: '#64748B',
            fontFamily: "'JetBrains Mono', monospace"
          }}>
            TETASCO ID #{profile.tetasco_id || 1}
          </span>
        </div>

      </div>
    </div>
  );
};

export default ProfilSistem;
