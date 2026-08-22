import React from 'react';

const alarms = [
  { severity: 'KRITIS',    time: '14:02:15', id: 'ERR-T09', msg: 'Temperatur Rak A melebihi ambang batas (39.5°C).', barColor: '#CC2200', tagBg: '#CC2200', tagText: '#FFF' },
  { severity: 'PERINGATAN',time: '13:45:00', id: 'WRN-M02', msg: 'Torsi Motor Penggerak B tinggi. Cek pelumasan.',    barColor: '#C87020', tagBg: '#E89030', tagText: '#FFF' },
  { severity: 'INFO',      time: '10:15:33', id: 'INF-C01', msg: 'Sinkronisasi Cloud tertunda (Telah dipulihkan).',  barColor: '#8A8070', tagBg: '#C4BAA8', tagText: '#4A3E2E' },
];

const health = [
  { icon: 'sensors',                title: 'Jaringan Sensor',   detail: '48/48 Aktif | Latensi 12ms',       status: 'OPTIMAL',    led: 'led-on-green',  statusColor: '#2A8A2A' },
  { icon: 'precision_manufacturing',title: 'Aktuator & Motor',  detail: 'Motor B Torsi Tinggi | Beban 85%', status: 'PERINGATAN', led: 'led-on-amber',  statusColor: '#C87020' },
  { icon: 'cloud_sync',             title: 'Koneksi Cloud',     detail: 'Sinkronisasi Terakhir: 2 mnt lalu',status: 'STABIL',     led: 'led-on-green',  statusColor: '#2A8A2A' },
];

const StatusSistem = () => (
  <div style={{ display: 'flex', gap: '12px', height: '100%' }}>
    {/* Left: Alarm Log */}
    <div className="panel-section" style={{ flex: 1, padding: '16px', display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <div className="led-housing" style={{ width: '20px', height: '20px' }}>
          <div className="led led-on-red animate-blink" style={{ width: '12px', height: '12px' }} />
        </div>
        <span className="font-headline" style={{ color: '#CC2200', textTransform: 'uppercase', fontSize: '16px' }}>ALARM AKTIF</span>
      </div>

      <div className="etched-line" style={{ marginBottom: '12px' }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {alarms.map((a, i) => (
          <div key={i} style={{
            borderLeft: `4px solid ${a.barColor}`,
            paddingLeft: '12px',
            paddingBottom: '12px',
            borderBottom: i < alarms.length-1 ? `1px solid #C8C0B0` : 'none',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ background: a.tagBg, color: a.tagText, padding: '2px 8px', borderRadius: '4px', fontFamily: "'JetBrains Mono'", fontSize: '9px', fontWeight: 700, letterSpacing: '0.1em' }}>{a.severity}</span>
                <span className="font-label-sm" style={{ color: '#6B5D48', fontSize: '9px' }}>{a.time}</span>
              </div>
              <span className="font-label-sm" style={{ color: '#8A8070', fontSize: '9px' }}>ID: {a.id}</span>
            </div>
            <p className="font-label-sm" style={{ color: '#4A3E2E', fontSize: '11px', fontFamily: 'Inter', fontWeight: 400, letterSpacing: 0, textTransform: 'none', marginBottom: '8px', lineHeight: '1.4' }}>{a.msg}</p>
            <button className="btn-raised" style={{ padding: '6px 12px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '6px', float: 'right' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '14px', color: '#6B5D48' }}>check</span>
              <span className="font-label-sm" style={{ color: '#4A3E2E', fontSize: '9px' }}>KONFIRMASI</span>
            </button>
            <div style={{ clear: 'both' }} />
          </div>
        ))}
      </div>
    </div>

    {/* Right: Health Panel */}
    <div className="panel-section" style={{ width: '40%', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#6B5D48' }}>health_and_safety</span>
        <span className="font-headline" style={{ color: '#2C2416', textTransform: 'uppercase', fontSize: '14px' }}>KESEHATAN SISTEM</span>
      </div>

      <div className="etched-line" />

      {health.map((h, i) => (
        <div key={i} style={{
          background: 'linear-gradient(145deg, #EDE7D8 0%, #D8D0C0 100%)',
          boxShadow: 'inset 1px 1px 0px rgba(255,255,255,0.9), inset -1px -1px 0px #9A8C78, 2px 2px 5px rgba(0,0,0,0.15)',
          border: '1px solid #B8A890',
          borderRadius: '8px',
          padding: '10px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{ width: '40px', height: '40px', background: '#2C2416', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.5)', flexShrink: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#E8D898' }}>{h.icon}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'Inter', fontSize: '14px', fontWeight: 600, color: '#2C2416', marginBottom: '2px' }}>{h.title}</div>
            <div className="font-label-sm" style={{ color: '#6B5D48', fontSize: '9px' }}>{h.detail}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <div className="led-housing" style={{ width: '18px', height: '18px' }}>
              <div className={`led ${h.led}`} style={{ width: '10px', height: '10px' }} />
            </div>
            <span className="font-label-sm" style={{ color: h.statusColor, fontSize: '8px' }}>{h.status}</span>
          </div>
        </div>
      ))}

      <div className="etched-line" />

      {/* CPU bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span className="font-label-sm" style={{ color: '#6B5D48', fontSize: '9px' }}>BEBAN CPU SISTEM</span>
          <span className="font-label-caps" style={{ color: '#2A8A2A', fontSize: '9px' }}>42%</span>
        </div>
        <div style={{ height: '10px', background: '#1A1A14', borderRadius: '3px', border: '1px solid #3A3028', boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
          <div style={{ width: '42%', height: '100%', background: 'linear-gradient(90deg, #1A8A1A, #39E239)', boxShadow: '0 0 6px rgba(57,226,57,0.5)' }} />
        </div>
      </div>
    </div>
  </div>
);

export default StatusSistem;
