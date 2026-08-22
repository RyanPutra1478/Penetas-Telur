import React, { useState } from 'react';

const PemantauanBatch = () => {
  const [timeRange, setTimeRange] = useState('6H');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="led-housing" style={{ width: '18px', height: '18px' }}>
            <div className="led led-on-green" style={{ width: '10px', height: '10px' }} />
          </div>
          <span className="font-headline" style={{ color: '#2C2416', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            BATCH MONITORING
          </span>
        </div>
        <div style={{ display: 'flex', gap: '0' }}>
          {['1H','6H','24H'].map((r, i) => (
            <button key={r} onClick={() => setTimeRange(r)} style={{
              padding: '6px 14px',
              cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em',
              transition: 'all 0.08s',
              borderRadius: i===0 ? '6px 0 0 6px' : i===2 ? '0 6px 6px 0' : '0',
              ...(timeRange === r ? {
                background: 'linear-gradient(160deg, #C4BAA8 0%, #D8D0C0 100%)',
                boxShadow: 'inset 3px 3px 6px rgba(0,0,0,0.3)',
                border: '2px solid #C87020',
                color: '#C87020',
                zIndex: 1,
              } : {
                background: 'linear-gradient(160deg, #EDE7D8 0%, #D4CCC0 100%)',
                boxShadow: 'inset 1px 1px 0px rgba(255,255,255,0.9), inset -1px -1px 0px #9A8C78, 2px 2px 4px rgba(0,0,0,0.2)',
                border: '1px solid #B8A890',
                color: '#6B5D48',
              }),
            }}>{r}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', flex: 1, minHeight: 0 }}>
        {/* Left Sensor Panels */}
        <div style={{ width: '200px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Temp */}
          <div className="panel-section" style={{ flex: 1, padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="font-label-sm" style={{ color: '#6B5D48' }}>TEMP / ZONE A</span>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#CC5500' }}>thermostat</span>
            </div>
            <div className="display-recess" style={{ padding: '14px 10px', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span className="font-readout-md phosphor-green">37.5°</span>
              <span className="font-label-sm" style={{ color: '#78A878', marginTop: '6px', fontSize: '8px' }}>TARGET: 37.8°</span>
            </div>
          </div>
          {/* Humidity */}
          <div className="panel-section" style={{ flex: 1, padding: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="font-label-sm" style={{ color: '#6B5D48' }}>HUM / ZONE A</span>
              <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#0066CC' }}>water_drop</span>
            </div>
            <div className="display-recess" style={{ padding: '14px 10px', borderRadius: '6px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <span className="font-readout-md" style={{ color: '#50C8FF', textShadow: '0 0 8px rgba(80,200,255,0.7)' }}>65.2%</span>
              <span className="font-label-sm" style={{ color: '#5090A8', marginTop: '6px', fontSize: '8px' }}>TARGET: 65.0%</span>
            </div>
          </div>
        </div>

        {/* Chart Panel */}
        <div className="panel-section" style={{ flex: 1, padding: '14px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span className="font-label-caps" style={{ color: '#6B5D48', fontSize: '10px' }}>
              REAL-TIME TELEMETRY — {timeRange} WINDOW
            </span>
            <div style={{ display: 'flex', gap: '12px' }}>
              {[['#39E239','TEMP'],['#50C8FF','HUM']].map(([c,l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '16px', height: '3px', background: c, borderRadius: '2px', boxShadow: `0 0 4px ${c}` }} />
                  <span className="font-label-sm" style={{ color: '#6B5D48' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="display-recess" style={{ flex: 1, borderRadius: '6px', position: 'relative', overflow: 'hidden' }}>
            {/* Grid */}
            <svg width="100%" height="100%" viewBox="0 0 600 280" preserveAspectRatio="none">
              {[0,1,2,3].map(i => (
                <line key={`h${i}`} x1="40" y1={i*70+10} x2="590" y2={i*70+10}
                  stroke="rgba(57,226,57,0.1)" strokeWidth="1" />
              ))}
              {[0,1,2,3,4].map(i => (
                <line key={`v${i}`} x1={40+i*137} y1="10" x2={40+i*137} y2="270"
                  stroke="rgba(57,226,57,0.1)" strokeWidth="1" />
              ))}
              {/* Temp trace */}
              <path d="M40,180 C100,165 150,130 200,110 C250,90 300,120 360,80 C410,50 460,70 510,55 C545,65 570,90 590,140"
                fill="none" stroke="#39E239" strokeWidth="2.5"
                style={{ filter: 'drop-shadow(0 0 4px rgba(57,226,57,0.8))' }} />
              {/* Hum trace */}
              <path d="M40,200 C100,210 150,185 200,198 C250,180 300,188 360,165 C410,175 460,150 510,130 C545,115 570,122 590,112"
                fill="none" stroke="#50C8FF" strokeWidth="2.5"
                style={{ filter: 'drop-shadow(0 0 4px rgba(80,200,255,0.8))' }} />
              {/* Glow area temp */}
              <path d="M40,180 C100,165 150,130 200,110 C250,90 300,120 360,80 C410,50 460,70 510,55 C545,65 570,90 590,140 L590,280 L40,280 Z"
                fill="rgba(57,226,57,0.04)" />
            </svg>
            {/* Y labels */}
            <div style={{ position: 'absolute', top: '8px', left: '4px', height: 'calc(100% - 16px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              {['100','75','50','25'].map(v => (
                <span key={v} className="font-label-sm" style={{ fontSize: '8px', color: 'rgba(57,226,57,0.5)' }}>{v}</span>
              ))}
            </div>
            {/* X labels */}
            <div style={{ position: 'absolute', bottom: '4px', left: '40px', right: '8px', display: 'flex', justifyContent: 'space-between' }}>
              {['-6H','-4H','-2H','NOW'].map(v => (
                <span key={v} className="font-label-sm" style={{ fontSize: '7px', color: 'rgba(57,226,57,0.5)' }}>{v}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PemantauanBatch;
