import React, { useState } from 'react';

const PemantauanBatch = () => {
  const [range, setRange] = useState('6H');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, height: '100%', boxSizing: 'border-box' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, #4ADE80, #22C55E)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(34,197,94,0.38)',
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 28, color: '#FFF' }}>monitoring</span>
          </div>
          <div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', lineHeight: 1.1 }}>Pemantauan Batch</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#64748B', marginTop: 2 }}>Real-time telemetry · B24-09</div>
          </div>
        </div>
        {/* Time range pills */}
        <div style={{ display: 'flex', gap: 8 }}>
          {['1H','6H','24H'].map(r => (
            <button key={r} onClick={() => setRange(r)} style={{
              padding: '8px 20px', borderRadius: 999,
              border: 'none', cursor: 'pointer',
              background: range === r ? '#22C55E' : '#FFFFFF',
              color: range === r ? '#FFF' : '#475569',
              fontWeight: 900, fontSize: 13,
              fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '0.06em',
              boxShadow: range === r ? '0 4px 12px rgba(34,197,94,0.35)' : '0 1px 4px rgba(0,0,0,0.06)',
              border: range === r ? 'none' : '1.5px solid #E2E8F0',
              transition: 'all 0.2s ease',
            }}>{r}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0 }}>

        {/* Sensor Panels */}
        <div style={{ width: 210, display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
          {/* Temp */}
          <div style={{
            flex: 1, background: 'linear-gradient(135deg, #FFF7ED, #FFEDD5)',
            borderRadius: 20, border: '2px solid #FED7AA', padding: '16px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(249,115,22,0.12)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#C2410C', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Suhu / Zona A</span>
              <span className="material-symbols-rounded" style={{ fontSize: 24, color: '#EA580C' }}>thermometer</span>
            </div>
            <div style={{ my: 'auto' }}>
              <span style={{ fontSize: 52, fontWeight: 900, color: '#EA580C', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1, letterSpacing: '-0.02em' }}>37.5°</span>
            </div>
            <div>
              <div style={{ padding: '6px 12px', background: '#FEF3C7', borderRadius: 999, display: 'inline-block', border: '1px solid #FDE68A' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#92400E', fontFamily: "'JetBrains Mono', monospace" }}>TARGET: 37.8°C</span>
              </div>
            </div>
          </div>
          {/* Humidity */}
          <div style={{
            flex: 1, background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
            borderRadius: 20, border: '2px solid #BFDBFE', padding: '16px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(59,130,246,0.12)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: '#1D4ED8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Hum / Zona A</span>
              <span className="material-symbols-rounded" style={{ fontSize: 24, color: '#3B82F6' }}>water_drop</span>
            </div>
            <div style={{ my: 'auto' }}>
              <span style={{ fontSize: 52, fontWeight: 900, color: '#2563EB', fontFamily: "'JetBrains Mono', monospace", lineHeight: 1, letterSpacing: '-0.02em' }}>65.2%</span>
            </div>
            <div>
              <div style={{ padding: '6px 12px', background: '#DBEAFE', borderRadius: 999, display: 'inline-block', border: '1px solid #BFDBFE' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#1E40AF', fontFamily: "'JetBrains Mono', monospace" }}>TARGET: 65.0%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div style={{
          flex: 1, background: '#FFFFFF', borderRadius: 20,
          border: '2px solid #E2E8F0', padding: '16px',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 15, fontWeight: 900, color: '#0F172A' }}>Grafik Telemetri · Rentang {range}</span>
            <div style={{ display: 'flex', gap: 16 }}>
              {[['#EA580C','Suhu (°C)'],['#2563EB','Kelembaban (%)']].map(([c,l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{ width: 22, height: 4, background: c, borderRadius: 2 }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: '#475569' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, position: 'relative', background: '#F8FAFC', borderRadius: 14, overflow: 'hidden', border: '1.5px solid #E2E8F0' }}>
            <svg width="100%" height="100%" viewBox="0 0 600 240" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }}>
              {/* Grid lines */}
              {[0,1,2,3].map(i => (
                <line key={`h${i}`} x1="45" y1={i*60+20} x2="590" y2={i*60+20} stroke="#E2E8F0" strokeWidth="1" />
              ))}
              {[1,2,3,4].map(i => (
                <line key={`v${i}`} x1={45+i*135} y1="20" x2={45+i*135} y2="220" stroke="#E2E8F0" strokeWidth="1" />
              ))}
              {/* Temp area fill */}
              <path d="M45,180 C100,155 160,120 220,100 C280,80 340,110 400,70 C450,45 510,60 560,50 L560,220 L45,220 Z"
                fill="rgba(249,115,22,0.1)" />
              {/* Temp line */}
              <path d="M45,180 C100,155 160,120 220,100 C280,80 340,110 400,70 C450,45 510,60 560,50"
                fill="none" stroke="#EA580C" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 2px 5px rgba(234,88,12,0.35))' }} />
              {/* Humidity area fill */}
              <path d="M45,190 C100,195 160,175 220,185 C280,168 340,178 400,158 C450,168 510,145 560,130 L560,220 L45,220 Z"
                fill="rgba(37,99,235,0.1)" />
              {/* Humidity line */}
              <path d="M45,190 C100,195 160,175 220,185 C280,168 340,178 400,158 C450,168 510,145 560,130"
                fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                style={{ filter: 'drop-shadow(0 2px 5px rgba(37,99,235,0.35))' }} />
            </svg>
            {/* Y axis labels */}
            <div style={{ position: 'absolute', top: 16, left: 10, height: 'calc(100% - 34px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              {['100','75','50','25'].map(v => (
                <span key={v} style={{ fontSize: 11, fontWeight: 800, color: '#64748B', fontFamily: "'JetBrains Mono', monospace" }}>{v}</span>
              ))}
            </div>
            {/* X axis labels */}
            <div style={{ position: 'absolute', bottom: 6, left: 45, right: 12, display: 'flex', justifyContent: 'space-between' }}>
              {['-6H','-4H','-2H','NOW'].map(v => (
                <span key={v} style={{ fontSize: 11, fontWeight: 800, color: '#64748B', fontFamily: "'JetBrains Mono', monospace" }}>{v}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PemantauanBatch;
