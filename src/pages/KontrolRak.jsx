import React, { useState } from 'react';

const racks = [
  { id:'01', angle:'+45°', color:'#22C55E', bg:'#F0FDF4', border:'#BBF7D0' },
  { id:'02', angle:'+45°', color:'#22C55E', bg:'#F0FDF4', border:'#BBF7D0' },
  { id:'03', angle:'+45°', color:'#22C55E', bg:'#F0FDF4', border:'#BBF7D0' },
  { id:'04', angle:'  0°', color:'#94A3B8', bg:'#F8FAFC', border:'#E2E8F0' },
  { id:'05', angle:'-45°', color:'#3B82F6', bg:'#EFF6FF', border:'#BFDBFE' },
  { id:'06', angle:'-45°', color:'#3B82F6', bg:'#EFF6FF', border:'#BFDBFE' },
  { id:'07', angle:'ERR!', color:'#EF4444', bg:'#FEF2F2', border:'#FECACA', err: true },
  { id:'08', angle:'-45°', color:'#3B82F6', bg:'#EFF6FF', border:'#BFDBFE' },
];

const KontrolRak = () => {
  const [rackAngles, setRackAngles] = useState(racks.map(r => r.angle));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 13,
            background: 'linear-gradient(135deg, #A78BFA, #8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(139,92,246,0.35)',
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 24, color: '#FFF' }}>view_carousel</span>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>Kontrol Rak</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8' }}>Tilt system · 8 unit</div>
          </div>
        </div>
        <button style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #A78BFA, #8B5CF6)',
          color: '#FFF', fontSize: 13, fontWeight: 700,
          boxShadow: '0 4px 12px rgba(139,92,246,0.35)',
        }}>
          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>sync</span>
          Balik Semua Rak
        </button>
      </div>

      {/* Rack Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, flex: 1 }}>
        {racks.map((r, idx) => (
          <div key={r.id} style={{
            background: r.bg,
            border: `2px solid ${r.border}`,
            borderRadius: 18,
            padding: '14px',
            display: 'flex', flexDirection: 'column', gap: 10,
            boxShadow: `0 2px 8px ${r.color}18`,
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.err ? '#EF4444' : r.color }} />
                <span style={{ fontSize: 12, fontWeight: 800, color: r.color, fontFamily: "'JetBrains Mono', monospace" }}>RAK {r.id}</span>
              </div>
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 999,
                background: r.err ? '#FEE2E2' : r.color + '18',
                color: r.err ? '#DC2626' : r.color,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.06em',
              }}>
                {r.err ? 'ERROR' : 'ONLINE'}
              </span>
            </div>

            {/* Angle Display */}
            <div style={{
              flex: 1, background: '#FFFFFF', borderRadius: 12,
              border: `1.5px solid ${r.border}`,
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '10px',
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 28, color: r.color, marginBottom: 4 }}>
                {r.err ? 'error' : 'rotate_90_degrees_ccw'}
              </span>
              <span style={{ fontSize: 28, fontWeight: 900, color: r.color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
                {r.angle}
              </span>
            </div>

            {/* Controls */}
            {!r.err && (
              <div style={{ display: 'flex', gap: 5 }}>
                {[['arrow_upward','up'],['remove','mid'],['arrow_downward','dn']].map(([ic, k]) => (
                  <button key={k} style={{
                    flex: 1, height: 36, borderRadius: 10, border: `1.5px solid ${r.border}`,
                    background: '#FFFFFF', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 16, color: r.color }}>{ic}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default KontrolRak;
