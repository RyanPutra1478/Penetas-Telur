import React, { useState } from 'react';

const KameraLangsung = () => {
  const [ptzMode, setPtzMode] = useState('pan');

  return (
    <div style={{ display: 'flex', gap: 14, height: '100%' }}>

      {/* ===== SINGLE CAMERA FEED ===== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Camera header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 13,
              background: 'linear-gradient(135deg, #34D399, #14B8A6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(20,184,166,0.35)',
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 24, color: '#FFF' }}>videocam</span>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>Kamera Langsung</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8' }}>CAM-01 · Live Feed · 1080p</div>
            </div>
          </div>
          {/* LIVE badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#FEE2E2', padding: '7px 16px', borderRadius: 999 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 0 3px rgba(239,68,68,0.25)' }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: '#DC2626', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em' }}>LIVE</span>
          </div>
        </div>

        {/* Camera viewport — full height */}
        <div style={{
          flex: 1,
          background: '#0A0F1E',
          borderRadius: 20,
          position: 'relative',
          overflow: 'hidden',
          border: '2px solid #EF4444',
          boxShadow: '0 0 24px rgba(239,68,68,0.2), 0 8px 24px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Subtle green tinted light simulation */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 35% 40%, rgba(34,197,94,0.05), transparent 55%), radial-gradient(ellipse at 75% 65%, rgba(20,184,166,0.04), transparent 50%)',
          }} />
          {/* Scanline overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)',
            pointerEvents: 'none',
          }} />

          {/* Camera icon placeholder */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, zIndex: 1 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 72, color: 'rgba(148,163,184,0.15)' }}>videocam</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'rgba(148,163,184,0.3)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.12em' }}>NO SIGNAL</span>
          </div>

          {/* OSD Overlays */}
          {/* Top-left: Cam ID + timestamp */}
          <div style={{ position: 'absolute', top: 14, left: 16, display: 'flex', gap: 10 }}>
            <div style={{ background: 'rgba(0,0,0,0.6)', padding: '5px 12px', borderRadius: 8, backdropFilter: 'blur(4px)' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#4ADE80', fontFamily: "'JetBrains Mono', monospace" }}>CAM-01 · ZONA A</span>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.6)', padding: '5px 12px', borderRadius: 8, backdropFilter: 'blur(4px)' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', fontFamily: "'JetBrains Mono', monospace" }}>20:25:35</span>
            </div>
          </div>

          {/* Top-right: REC indicator */}
          <div style={{ position: 'absolute', top: 14, right: 16, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.85)', padding: '5px 12px', borderRadius: 8 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#FFF' }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: '#FFF', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em' }}>REC</span>
          </div>

          {/* Bottom info bar */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
            padding: '20px 16px 12px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          }}>
            <div style={{ display: 'flex', gap: 10 }}>
              {[['T:', '37.5°C', '#FCA5A5'], ['H:', '55%', '#93C5FD'], ['TILT:', '+45°', '#A5F3FC']].map(([l, v, c]) => (
                <div key={l} style={{ background: 'rgba(0,0,0,0.5)', padding: '4px 10px', borderRadius: 6, backdropFilter: 'blur(4px)' }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.5)', fontFamily: "'JetBrains Mono', monospace" }}>{l} </span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: c, fontFamily: "'JetBrains Mono', monospace" }}>{v}</span>
                </div>
              ))}
            </div>
            <span style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', fontFamily: "'JetBrains Mono', monospace" }}>1920×1080 · 30fps</span>
          </div>
        </div>
      </div>

      {/* ===== PTZ CONTROL PANEL — WIDER ===== */}
      <div style={{
        width: 260,
        background: '#FFFFFF',
        borderRadius: 20,
        border: '1.5px solid #E2E8F0',
        padding: '20px 18px',
        display: 'flex', flexDirection: 'column', gap: 16,
        boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
        flexShrink: 0,
      }}>

        {/* Panel header */}
        <div>
          <div style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>PTZ Control</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Pan · Tilt · Zoom</div>
        </div>

        {/* Mode selector */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[['pan', 'open_with', 'Pan/Tilt'], ['zoom', 'zoom_in', 'Zoom']].map(([m, ic, lbl]) => (
            <button key={m} onClick={() => setPtzMode(m)} style={{
              flex: 1, padding: '8px 6px', borderRadius: 10,
              border: `2px solid ${ptzMode === m ? '#14B8A6' : '#E2E8F0'}`,
              background: ptzMode === m ? '#F0FDFA' : '#F8FAFC',
              cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              transition: 'all 0.2s',
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 20, color: ptzMode === m ? '#14B8A6' : '#94A3B8' }}>{ic}</span>
              <span style={{ fontSize: 10, fontWeight: 700, color: ptzMode === m ? '#14B8A6' : '#94A3B8', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em' }}>{lbl}</span>
            </button>
          ))}
        </div>

        <div style={{ height: 1, background: '#F1F5F9' }} />

        {/* D-Pad */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 12 }}>Arah</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            {[
              [null, 'arrow_upward', null],
              ['arrow_back', 'adjust', 'arrow_forward'],
              [null, 'arrow_downward', null],
            ].map((row, ri) => (
              <div key={ri} style={{ display: 'flex', gap: 6 }}>
                {row.map((cell, ci) => cell ? (
                  <button key={ci} style={{
                    width: 60, height: 60, borderRadius: 14,
                    border: '1.5px solid #E2E8F0',
                    background: cell === 'adjust' ? 'linear-gradient(135deg, #F0FDFA, #CCFBF1)' : '#F8FAFC',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
                    transition: 'all 0.15s',
                  }}>
                    <span className="material-symbols-rounded" style={{ fontSize: 26, color: cell === 'adjust' ? '#14B8A6' : '#374151' }}>{cell}</span>
                  </button>
                ) : <div key={ci} style={{ width: 60 }} />)}
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: '#F1F5F9' }} />

        {/* Zoom Slider */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Zoom</div>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#14B8A6', fontFamily: "'JetBrains Mono', monospace" }}>1.0×</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {[['zoom_out', 'OUT'], ['zoom_in', 'IN']].map(([ic, lbl]) => (
              <button key={ic} style={{
                flex: 1, height: 52, borderRadius: 12,
                border: '1.5px solid #E2E8F0', background: '#F8FAFC',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 22, color: '#374151' }}>{ic}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: '#94A3B8', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em' }}>{lbl}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Capture / Record */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{
            flex: 1, height: 56, borderRadius: 14, border: '1.5px solid #BFDBFE', cursor: 'pointer',
            background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
            boxShadow: '0 2px 8px rgba(37,99,235,0.12)',
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 22, color: '#2563EB' }}>photo_camera</span>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#2563EB', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.07em' }}>CAPTURE</span>
          </button>
          <button style={{
            flex: 1, height: 56, borderRadius: 14, border: '1.5px solid #FECACA', cursor: 'pointer',
            background: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
            boxShadow: '0 2px 8px rgba(239,68,68,0.12)',
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 22, color: '#DC2626' }}>radio_button_checked</span>
            <span style={{ fontSize: 9, fontWeight: 800, color: '#DC2626', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.07em' }}>RECORD</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default KameraLangsung;
