import React from 'react';

const profiles = [
  { name: 'AYAM', durasi: '21 HARI', temp: '37.8°C', hum: '55%', hasImage: true },
  { name: 'BEBEK', durasi: '28 HARI', temp: '37.5°C', hum: '60%', hasImage: true },
  { name: 'PUYUH', durasi: '18 HARI', temp: '37.7°C', hum: '50%', hasImage: true },
  { name: 'KALKUN', durasi: '28 HARI', temp: '37.5°C', hum: '55%', hasImage: true },
  { name: 'ANGSA', durasi: '30 HARI', temp: '37.6°C', hum: '65%', hasImage: true },
  { name: 'KUSTOM', durasi: 'TENTUKAN MANUAL', temp: '--.-°C', hum: '--%', hasImage: false },
];

const ProfilInkubasi = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gutter)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="font-headline-md" style={{ color: 'var(--on-surface)', textTransform: 'uppercase' }}>
          PILIH PROFIL INKUBASI
        </h1>
        <div className="panel-recessed" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="led led-active" style={{ width: '10px', height: '10px' }}></div>
          <span className="font-label-caps" style={{ color: 'var(--tertiary)' }}>SYSTEM READY</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--gutter)' }}>
        {profiles.map((profile, idx) => (
          <button key={idx} className="panel-recessed" style={{
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            cursor: 'pointer',
            border: profile.name === 'KUSTOM' ? '2px dashed var(--outline-variant)' : '1px solid var(--outline-variant)',
            borderRadius: '4px',
            textAlign: 'center',
            transition: 'border-color 0.2s',
          }}>
            {/* Image placeholder */}
            <div style={{
              width: '120px',
              height: '90px',
              backgroundColor: 'var(--surface-container-lowest)',
              borderRadius: '4px',
              marginBottom: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0px 2px 4px rgba(0,0,0,0.6)',
              border: '1px solid var(--outline-variant)',
            }}>
              {profile.hasImage ? (
                <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--on-surface-variant)', opacity: 0.5 }}>egg</span>
              ) : (
                <span className="material-symbols-outlined" style={{ fontSize: '40px', color: 'var(--on-surface-variant)' }}>tune</span>
              )}
            </div>

            <span className="font-headline-md" style={{ color: 'var(--on-surface)', marginBottom: '4px' }}>{profile.name}</span>
            <span className="font-label-caps" style={{ color: 'var(--on-surface-variant)', marginBottom: '12px' }}>DURASI: {profile.durasi}</span>

            <div style={{ display: 'flex', gap: '24px' }}>
              <div style={{ textAlign: 'center' }}>
                <div className="font-label-caps" style={{ color: 'var(--on-surface-variant)', marginBottom: '4px' }}>TEMP</div>
                <div className="font-body-sm" style={{ color: 'var(--on-surface)', fontWeight: 600 }}>{profile.temp}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="font-label-caps" style={{ color: 'var(--on-surface-variant)', marginBottom: '4px' }}>HUM</div>
                <div className="font-body-sm" style={{ color: 'var(--on-surface)', fontWeight: 600 }}>{profile.hum}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProfilInkubasi;
