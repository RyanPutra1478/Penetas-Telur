import React from 'react';

const alarms = [
  { level: 'KRITIS',    time: '14:02:15', id: 'ERR-T09', msg: 'Temperatur Rak A melebihi ambang batas (39.5°C).', color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' },
  { level: 'PERINGATAN',time: '13:45:00', id: 'WRN-M02', msg: 'Torsi Motor Penggerak B tinggi. Cek pelumasan.',    color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  { level: 'INFO',      time: '10:15:33', id: 'INF-C01', msg: 'Sinkronisasi Cloud tertunda (Telah dipulihkan).',  color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
];

const health = [
  { icon: 'sensors',                 title: 'Jaringan Sensor',  detail: '48/48 Aktif · Latensi 12ms',          status: 'OPTIMAL',    color: '#22C55E', bg: '#F0FDF4', border: '#BBF7D0' },
  { icon: 'precision_manufacturing', title: 'Aktuator & Motor', detail: 'Motor B Torsi Tinggi · Beban 85%',    status: 'PERINGATAN', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' },
  { icon: 'cloud_sync',              title: 'Koneksi Cloud',    detail: 'Sinkronisasi Terakhir: 2 mnt lalu',   status: 'STABIL',     color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE' },
];

const StatusSistem = () => (
  <div style={{ display: 'flex', gap: 12, height: '100%' }}>

    {/* Alarm Log */}
    <div style={{ flex: 1, background: '#FFFFFF', borderRadius: 18, border: '1.5px solid #E2E8F0', padding: '16px', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexShrink: 0 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 13,
          background: 'linear-gradient(135deg, #FCA5A5, #EF4444)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(239,68,68,0.35)',
        }}>
          <span className="material-symbols-rounded" style={{ fontSize: 24, color: '#FFF' }}>notifications_active</span>
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>Alarm Aktif</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8' }}>3 alarm terdaftar</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {alarms.map((a, i) => (
          <div key={i} style={{
            background: a.bg,
            border: `1.5px solid ${a.border}`,
            borderRadius: 14,
            padding: '12px 14px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{
                  padding: '2px 10px', borderRadius: 999,
                  background: a.color, color: '#FFF',
                  fontSize: 9, fontWeight: 800, letterSpacing: '0.08em',
                  fontFamily: "'JetBrains Mono', monospace",
                  textTransform: 'uppercase',
                }}>{a.level}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', fontFamily: "'JetBrains Mono', monospace" }}>{a.time}</span>
              </div>
              <span style={{ fontSize: 9, fontWeight: 700, color: a.color, fontFamily: "'JetBrains Mono', monospace" }}>{a.id}</span>
            </div>
            <p style={{ fontSize: 13, color: '#374151', fontWeight: 500, lineHeight: 1.4, marginBottom: 10 }}>{a.msg}</p>
            <button style={{
              padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
              background: a.color + '14', color: a.color, fontSize: 11, fontWeight: 700,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.06em',
              float: 'right',
            }}>✓ KONFIRMASI</button>
            <div style={{ clear: 'both' }} />
          </div>
        ))}
      </div>
    </div>

    {/* Health Panel */}
    <div style={{ width: '42%', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ background: '#FFFFFF', borderRadius: 18, border: '1.5px solid #E2E8F0', padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 2 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 13,
            background: 'linear-gradient(135deg, #6EE7B7, #22C55E)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(34,197,94,0.3)',
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 24, color: '#FFF' }}>health_and_safety</span>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>Kesehatan Sistem</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8' }}>3 subsistem dipantau</div>
          </div>
        </div>

        {health.map((h, i) => (
          <div key={i} style={{
            background: h.bg,
            border: `1.5px solid ${h.border}`,
            borderRadius: 14,
            padding: '12px 14px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: h.color + '18',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 22, color: h.color }}>{h.icon}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 2 }}>{h.title}</div>
              <div style={{ fontSize: 10, fontWeight: 500, color: '#64748B' }}>{h.detail}</div>
            </div>
            <span style={{
              padding: '3px 10px', borderRadius: 999,
              background: h.color + '18', color: h.color,
              fontSize: 9, fontWeight: 800,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.06em', textTransform: 'uppercase', flexShrink: 0,
            }}>{h.status}</span>
          </div>
        ))}
      </div>

      {/* CPU bar card */}
      <div style={{ background: '#FFFFFF', borderRadius: 18, border: '1.5px solid #E2E8F0', padding: '14px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#6366F1' }}>memory</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Beban CPU Sistem</span>
          </div>
          <span style={{ fontSize: 16, fontWeight: 900, color: '#22C55E', fontFamily: "'JetBrains Mono', monospace" }}>42%</span>
        </div>
        <div style={{ height: 10, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ width: '42%', height: '100%', background: 'linear-gradient(90deg, #4ADE80, #22C55E)', borderRadius: 999 }} />
        </div>
      </div>
    </div>
  </div>
);

export default StatusSistem;
