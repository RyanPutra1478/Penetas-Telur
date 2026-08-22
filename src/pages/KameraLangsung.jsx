import React from 'react';

const KameraLangsung = () => (
  <div style={{ display: 'flex', gap: '10px', height: '100%' }}>
    {/* Camera Grid */}
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {/* Status bar */}
      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#2C2416', padding: '4px 12px', borderRadius: '4px', boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.5)' }}>
          <div className="led led-on-green animate-blink" style={{ width: '8px', height: '8px' }} />
          <span className="font-label-sm" style={{ color: '#39E239', fontSize: '8px' }}>LIVE FEED</span>
        </div>
        <div className="panel-section" style={{ padding: '4px 12px' }}>
          <span className="font-label-sm" style={{ color: '#6B5D48', fontSize: '8px' }}>CAM 1: INCUBATOR CORE</span>
        </div>
      </div>

      {/* 3x2 Camera Grid */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gridTemplateRows: '1fr 1fr 1fr', gap: '6px' }}>
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className="display-recess" style={{ borderRadius: '6px', position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{
              position: 'absolute', inset: 0,
              background: `radial-gradient(circle at ${25+i*12}% ${35+i*8}%, rgba(57,226,57,0.06), transparent 55%)`,
            }} />
            <span className="material-symbols-outlined" style={{ fontSize: '32px', color: 'rgba(57,226,57,0.15)' }}>videocam</span>
            {i === 1 && (
              <div style={{ position: 'absolute', top: '6px', right: '6px', display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.7)', padding: '2px 6px', borderRadius: '3px' }}>
                <div className="led led-on-red animate-blink" style={{ width: '5px', height: '5px' }} />
                <span className="font-label-sm" style={{ color: '#FF3B30', fontSize: '7px' }}>LIVE</span>
              </div>
            )}
            <div style={{ position: 'absolute', bottom: '4px', left: '6px' }}>
              <span className="font-label-sm" style={{ fontSize: '7px', color: 'rgba(57,226,57,0.4)' }}>CAM {i}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom info strip */}
      <div style={{ display: 'flex', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ background: '#1A1A14', padding: '4px 10px', borderRadius: '4px', border: '1px solid #3A3028' }}>
          <span className="font-label-sm" style={{ fontSize: '8px', color: 'rgba(57,226,57,0.6)' }}>
            TEMP: <span style={{ color: '#39E239' }}>37.5°C</span>{'  '}HUM: <span style={{ color: '#39E239' }}>55%</span>
          </span>
        </div>
        <div style={{ background: '#1A1A14', padding: '4px 10px', borderRadius: '4px', border: '1px solid #3A3028' }}>
          <span className="font-label-sm" style={{ fontSize: '8px', color: 'rgba(57,226,57,0.6)' }}>
            ZOOM: 1.0x{'  '}PTZ: 0, 45
          </span>
        </div>
      </div>
    </div>

    {/* PTZ Control */}
    <div className="panel-section" style={{ width: '200px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <span className="font-headline" style={{ color: '#2C2416', fontSize: '16px', textTransform: 'uppercase' }}>PTZ CONTROL</span>

      {/* D-Pad */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
        {[
          [null, 'arrow_upward', null],
          ['arrow_back', 'RST', 'arrow_forward'],
          [null, 'arrow_downward', null],
        ].map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: '6px' }}>
            {row.map((cell, ci) => cell ? (
              <button key={ci} className="btn-raised" style={{ width: '44px', height: '44px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {cell === 'RST'
                  ? <span className="font-label-sm" style={{ fontSize: '9px', color: '#4A3E2E' }}>RST</span>
                  : <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#4A3E2E' }}>{cell}</span>
                }
              </button>
            ) : <div key={ci} style={{ width: '44px' }} />)}
          </div>
        ))}
      </div>

      <div className="etched-line" />

      {/* Zoom */}
      <div>
        <span className="font-label-caps" style={{ color: '#6B5D48', fontSize: '9px', display: 'block', marginBottom: '8px' }}>ZOOM</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          {['zoom_out','zoom_in'].map(ic => (
            <button key={ic} className="btn-raised" style={{ flex: 1, height: '44px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#4A3E2E' }}>{ic}</span>
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Capture / Record */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {[
          { ic: 'photo_camera', lbl: 'CAPTURE', color: '#4A3E2E' },
          { ic: 'radio_button_checked', lbl: 'RECORD', color: '#CC2200' },
        ].map(({ic, lbl, color}) => (
          <button key={lbl} className="btn-raised" style={{ flex: 1, height: '52px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <span className="material-symbols-outlined" style={{ fontSize: '18px', color }}>{ic}</span>
            <span className="font-label-sm" style={{ fontSize: '7px', color }}>{lbl}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default KameraLangsung;
