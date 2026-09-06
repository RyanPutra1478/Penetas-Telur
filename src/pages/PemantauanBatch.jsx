import React, { useState } from 'react';

const PemantauanBatch = () => {
  const [range, setRange] = useState('6H');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 13,
            background: 'linear-gradient(135deg, #4ADE80, #22C55E)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(34,197,94,0.35)',
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 24, color: '#FFF' }}>monitoring</span>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>Pemantauan Batch</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8' }}>Real-time telemetry · B24-09</div>
          </div>
        </div>
        {/* Time range pills */}
        <div style={{ display: 'flex', gap: 6 }}>
          {['1H','6H','24H'].map(r => (
            <button key={r} onClick={() => setRange(r)} style={{
              padding: '6px 18px', borderRadius: 999,
              border: 'none', cursor: 'pointer',
              background: range === r ? '#22C55E' : '#F1F5F9',
              color: range === r ? '#FFF' : '#64748B',
              fontWeight: 700, fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.06em',
              boxShadow: range === r ? '0 4px 10px rgba(34,197,94,0.35)' : 'none',
              transition: 'all 0.2s ease',
            }}>{r}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0 }}>

        {/* Sensor Panels */}
        <div style={{ width: 180, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Temp */}
          <div style={{
            flex: 1, background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)',
            borderRadius: 18, border: '1.5px solid #FED7AA', padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#C2410C', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Suhu / Zone A</span>
              <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#EA580C' }}>thermometer</span>
            </div>
            <span style={{ fontSize: 40, fontWeight: 900, color: '#EA580C', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>37.5°</span>
            <div style={{ marginTop: 8, padding: '5px 10px', background: '#FEF3C7', borderRadius: 8, display: 'inline-block' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#92400E', fontFamily: "'JetBrains Mono', monospace" }}>TARGET: 37.8°C</span>
            </div>
          </div>
          {/* Humidity */}
          <div style={{
            flex: 1, background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
            borderRadius: 18, border: '1.5px solid #BFDBFE', padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#1D4ED8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Hum / Zone A</span>
              <span className="material-symbols-rounded" style={{ fontSize: 20, color: '#3B82F6' }}>water_drop</span>
            </div>
            <span style={{ fontSize: 40, fontWeight: 900, color: '#2563EB', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>65.2%</span>
            <div style={{ marginTop: 8, padding: '5px 10px', background: '#DBEAFE', borderRadius: 8, display: 'inline-block' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#1E40AF', fontFamily: "'JetBrains Mono', monospace" }}>TARGET: 65.0%</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div style={{
          flex: 1, background: '#FFFFFF', borderRadius: 18,
          border: '1.5px solid #E2E8F0', padding: '16px',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>Grafik Telemetri · Rentang {range}</span>
            <div style={{ display: 'flex', gap: 14 }}>
              {[['#EA580C','Suhu'],['#2563EB','Kelembaban']].map(([c,l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 20, height: 3, background: c, borderRadius: 2 }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#64748B' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, position: 'relative', background: '#F8FAFC', borderRadius: 12, overflow: 'hidden', border: '1px solid #E2E8F0' }}>
            <svg width="100%" height="100%" viewBox="0 0 600 240" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
              {/* Grid lines */}
              {[0,1,2,3].map(i => (
                <line key={`h${i}`} x1="40" y1={i*60+20} x2="590" y2={i*60+20} stroke="#E2E8F0" strokeWidth="1" />
              ))}
              {[1,2,3,4].map(i => (
                <line key={`v${i}`} x1={40+i*137} y1="20" x2={40+i*137} y2="220" stroke="#E2E8F0" strokeWidth="1" />
              ))}
              {/* Temp area fill */}
              <path d="M40,180 C100,155 160,120 220,100 C280,80 340,110 400,70 C450,45 510,60 560,50 L560,220 L40,220 Z"
                fill="rgba(249,115,22,0.08)" />
              {/* Temp line */}
              <path d="M40,180 C100,155 160,120 220,100 C280,80 340,110 400,70 C450,45 510,60 560,50"
                fill="none" stroke="#EA580C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(234,88,12,0.3))' }} />
              {/* Humidity area fill */}
              <path d="M40,190 C100,195 160,175 220,185 C280,168 340,178 400,158 C450,168 510,145 560,130 L560,220 L40,220 Z"
                fill="rgba(37,99,235,0.08)" />
              {/* Humidity line */}
              <path d="M40,190 C100,195 160,175 220,185 C280,168 340,178 400,158 C450,168 510,145 560,130"
                fill="none" stroke="#2563EB" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 2px 4px rgba(37,99,235,0.3))' }} />
            </svg>
            {/* Y axis labels */}
            <div style={{ position: 'absolute', top: 16, left: 8, height: 'calc(100% - 32px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              {['100','75','50','25'].map(v => (
                <span key={v} style={{ fontSize: 9, fontWeight: 600, color: '#94A3B8', fontFamily: "'JetBrains Mono', monospace" }}>{v}</span>
              ))}
            </div>
            {/* X axis labels */}
            <div style={{ position: 'absolute', bottom: 6, left: 40, right: 8, display: 'flex', justifyContent: 'space-between' }}>
              {['-6H','-4H','-2H','NOW'].map(v => (
                <span key={v} style={{ fontSize: 9, fontWeight: 600, color: '#94A3B8', fontFamily: "'JetBrains Mono', monospace" }}>{v}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PemantauanBatch;
