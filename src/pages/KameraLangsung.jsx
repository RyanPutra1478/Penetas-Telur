import React, { useState } from 'react';

const KameraLangsung = () => {
  const [ptzMode, setPtzMode] = useState('pan');

  return (
    <div style={{ display: 'flex', gap: 10, height: '100%', boxSizing: 'border-box' }}>

      {/* ===== SINGLE CAMERA FEED ===== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Camera header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12,
              background: 'linear-gradient(135deg, #34D399, #14B8A6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(20,184,166,0.35)',
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 24, color: '#FFF' }}>videocam</span>
            </div>
            <div>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#0F172A', lineHeight: 1.1 }}>Kamera Langsung</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginTop: 2 }}>CAM-01 · Live Feed · 1080p</div>
            </div>
          </div>
          {/* LIVE badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#FEE2E2', padding: '6px 16px', borderRadius: 999, border: '1.5px solid #FECACA' }}>
            <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 0 3px rgba(239,68,68,0.25)' }} />
            <span style={{ fontSize: 13, fontWeight: 900, color: '#DC2626', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em' }}>LIVE</span>
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
            <span className="material-symbols-rounded" style={{ fontSize: 72, color: 'rgba(148,163,184,0.2)' }}>videocam</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'rgba(148,163,184,0.4)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.12em' }}>FEED AKTIF · 1080P</span>
          </div>

          {/* OSD Overlays */}
          {/* Top-left: Cam ID + timestamp */}
          <div style={{ position: 'absolute', top: 12, left: 14, display: 'flex', gap: 8 }}>
            <div style={{ background: 'rgba(0,0,0,0.65)', padding: '5px 12px', borderRadius: 8, backdropFilter: 'blur(4px)' }}>
              <span style={{ fontSize: 12, fontWeight: 900, color: '#4ADE80', fontFamily: "'JetBrains Mono', monospace" }}>CAM-01 · ZONA A</span>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.65)', padding: '5px 12px', borderRadius: 8, backdropFilter: 'blur(4px)' }}>
              <span style={{ fontSize: 12, fontWeight: 800, color: 'rgba(255,255,255,0.85)', fontFamily: "'JetBrains Mono', monospace" }}>20:25:35</span>
            </div>
          </div>

          {/* Top-right: REC indicator */}
          <div style={{ position: 'absolute', top: 12, right: 14, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.9)', padding: '5px 12px', borderRadius: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFF' }} />
            <span style={{ fontSize: 11, fontWeight: 900, color: '#FFF', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em' }}>REC</span>
          </div>

          {/* Bottom info bar */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
            padding: '16px 14px 12px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          }}>
            <div style={{ display: 'flex', gap: 8 }}>
              {[['T:', '37.5°C', '#FCA5A5'], ['H:', '55%', '#93C5FD'], ['TILT:', '+45°', '#A5F3FC']].map(([l, v, c]) => (
                <div key={l} style={{ background: 'rgba(0,0,0,0.55)', padding: '4px 10px', borderRadius: 7, backdropFilter: 'blur(4px)' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.65)', fontFamily: "'JetBrains Mono', monospace" }}>{l} </span>
                  <span style={{ fontSize: 12, fontWeight: 900, color: c, fontFamily: "'JetBrains Mono', monospace" }}>{v}</span>
                </div>
              ))}
            </div>
            <span style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.45)', fontFamily: "'JetBrains Mono', monospace" }}>1920×1080 · 30fps</span>
          </div>
        </div>
      </div>

      {/* ===== PTZ CONTROL PANEL — COMPACT & BOLD ===== */}
      <div
        style={{
          width: 260,
          background: '#FFFFFF',
          borderRadius: 20,
          border: '2px solid #E2E8F0',
          padding: '12px 16px',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
          flexShrink: 0,
          boxSizing: 'border-box',
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div className="batik-overlay batik-overlay-neutral" />

        {/* Panel header */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', lineHeight: 1.1 }}>PTZ Control</div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 2 }}>Pan · Tilt · Zoom</div>
        </div>

        {/* Mode selector */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[['pan', 'open_with', 'Pan/Tilt'], ['zoom', 'zoom_in', 'Zoom']].map(([m, ic, lbl]) => (
            <button key={m} onClick={() => setPtzMode(m)} style={{
              flex: 1, padding: '7px 6px', borderRadius: 10,
              border: `2px solid ${ptzMode === m ? '#14B8A6' : '#E2E8F0'}`,
              background: ptzMode === m ? '#F0FDFA' : '#F8FAFC',
              cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              boxShadow: ptzMode === m ? '0 2px 8px rgba(20,184,166,0.2)' : 'none',
              transition: 'all 0.2s',
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 20, color: ptzMode === m ? '#14B8A6' : '#94A3B8' }}>{ic}</span>
              <span style={{ fontSize: 11, fontWeight: 800, color: ptzMode === m ? '#14B8A6' : '#64748B', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em' }}>{lbl}</span>
            </button>
          ))}
        </div>

        {/* D-Pad */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
          {[
            [null, 'arrow_upward', null],
            ['arrow_back', 'adjust', 'arrow_forward'],
            [null, 'arrow_downward', null],
          ].map((row, ri) => (
            <div key={ri} style={{ display: 'flex', gap: 5 }}>
              {row.map((cell, ci) => cell ? (
                <button key={ci} style={{
                  width: 54, height: 42, borderRadius: 10,
                  border: '1.5px solid #E2E8F0',
                  background: cell === 'adjust' ? 'linear-gradient(135deg, #F0FDFA, #CCFBF1)' : '#F8FAFC',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.06)',
                  transition: 'all 0.15s',
                }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 22, color: cell === 'adjust' ? '#14B8A6' : '#1E293B' }}>{cell}</span>
                </button>
              ) : <div key={ci} style={{ width: 54 }} />)}
            </div>
          ))}
        </div>

        {/* Zoom Controls */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: '#64748B', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Zoom</span>
            <span style={{ fontSize: 14, fontWeight: 900, color: '#14B8A6', fontFamily: "'JetBrains Mono', monospace" }}>1.0×</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[['zoom_out', 'OUT'], ['zoom_in', 'IN']].map(([ic, lbl]) => (
              <button key={ic} style={{
                flex: 1, height: 38, borderRadius: 10,
                border: '1.5px solid #E2E8F0', background: '#F8FAFC',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#374151' }}>{ic}</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#475569', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em' }}>{lbl}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Capture / Record */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={{
            flex: 1, height: 42, borderRadius: 11, border: '1.5px solid #BFDBFE', cursor: 'pointer',
            background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            boxShadow: '0 2px 6px rgba(37,99,235,0.15)',
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#2563EB' }}>photo_camera</span>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#2563EB', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.07em' }}>FOTO</span>
          </button>
          <button style={{
            flex: 1, height: 42, borderRadius: 11, border: '1.5px solid #FECACA', cursor: 'pointer',
            background: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            boxShadow: '0 2px 6px rgba(239,68,68,0.15)',
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 19, color: '#DC2626' }}>radio_button_checked</span>
            <span style={{ fontSize: 11, fontWeight: 900, color: '#DC2626', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.07em' }}>REKAM</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default KameraLangsung;
