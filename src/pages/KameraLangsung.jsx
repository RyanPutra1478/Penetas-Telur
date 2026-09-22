import React, { useState, useEffect } from 'react';
import { getSensorData, getHydraulicStatus, getCameraConfig, updateCameraConfig } from '../api/tetascoApi';

const KameraLangsung = () => {
  const [ptzMode, setPtzMode] = useState('pan');
  const [streamActive, setStreamActive] = useState(true);
  const [streamKey, setStreamKey] = useState(Date.now());
  const [temp, setTemp] = useState('37.5');
  const [hum, setHum] = useState('55.0');
  const [tilt, setTilt] = useState('0°');
  const [showConfig, setShowConfig] = useState(false);
  const [cameraUrl, setCameraUrl] = useState('http://192.168.1.44:8080/video_feed');
  const [savingConfig, setSavingConfig] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString('id-ID'));

  // Ambil config kamera dari backend
  useEffect(() => {
    getCameraConfig().then(cfg => {
      if (cfg && cfg.camera_url) {
        setCameraUrl(cfg.camera_url);
      }
    });
  }, []);

  // Update sensor data dan jam secara periodik
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString('id-ID'));
      getSensorData().then(data => {
        if (data && data.sensors) {
          if (data.sensors.temperature != null) setTemp(data.sensors.temperature.toFixed(1));
          if (data.sensors.humidity != null) setHum(data.sensors.humidity.toFixed(1));
        }
      });
      getHydraulicStatus().then(st => {
        if (st && st.position_percent != null) {
          const angle = Math.round((st.position_percent - 50) * 0.9);
          setTilt(`${angle > 0 ? '+' : ''}${angle}°`);
        }
      });
    }, 2000);
    return () => clearInterval(timer);
  }, []);

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSavingConfig(true);
    await updateCameraConfig({ camera_url: cameraUrl });
    setSavingConfig(false);
    setShowConfig(false);
    // Reload stream feed
    setStreamActive(true);
    setStreamKey(Date.now());
  };

  return (
    <div style={{ display: 'flex', gap: 10, height: '100%', boxSizing: 'border-box' }}>

      {/* ===== SINGLE CAMERA FEED ===== */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>

        {/* Camera header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'linear-gradient(135deg, #34D399, #14B8A6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(20,184,166,0.35)',
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 22, color: '#FFF' }}>videocam</span>
            </div>
            <div>
              <div style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', lineHeight: 1.1 }}>Kamera Langsung</div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#64748B', marginTop: 2 }}>
                CAM-01 · {streamActive ? 'Live Stream Aktif' : 'Terputus'} · MJPEG
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Tombol Pengaturan IP CCTV */}
            <button
              onClick={() => setShowConfig(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                background: '#F1F5F9', border: '1.5px solid #CBD5E1',
                padding: '5px 10px', borderRadius: 8, cursor: 'pointer',
                fontSize: 11, fontWeight: 800, color: '#334155'
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#475569' }}>settings_ethernet</span>
              IP CCTV
            </button>

            {/* LIVE badge */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: streamActive ? '#FEE2E2' : '#F1F5F9',
              padding: '4px 12px', borderRadius: 999,
              border: `1.5px solid ${streamActive ? '#FECACA' : '#E2E8F0'}`
            }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%',
                background: streamActive ? '#EF4444' : '#94A3B8',
                boxShadow: streamActive ? '0 0 0 3px rgba(239,68,68,0.25)' : 'none'
              }} />
              <span style={{
                fontSize: 11, fontWeight: 900,
                color: streamActive ? '#DC2626' : '#64748B',
                fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em'
              }}>
                {streamActive ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>
          </div>
        </div>

        {/* Camera viewport — full height */}
        <div style={{
          flex: 1,
          background: '#0A0F1E',
          borderRadius: 18,
          position: 'relative',
          overflow: 'hidden',
          border: `2px solid ${streamActive ? '#10B981' : '#EF4444'}`,
          boxShadow: '0 0 24px rgba(16,185,129,0.15), 0 8px 24px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Subtle green tinted light simulation */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at 35% 40%, rgba(34,197,94,0.05), transparent 55%), radial-gradient(ellipse at 75% 65%, rgba(20,184,166,0.04), transparent 50%)',
            pointerEvents: 'none',
          }} />
          {/* Scanline overlay */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: 'repeating-linear-gradient(transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)',
            pointerEvents: 'none', zIndex: 2,
          }} />

          {/* REAL VIDEO FEED IMAGE */}
          {streamActive ? (
            <img
              key={streamKey}
              src={`/api/camera/stream?t=${streamKey}`}
              alt="Live CCTV"
              onError={() => setStreamActive(false)}
              onLoad={() => setStreamActive(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                position: 'absolute',
                inset: 0,
                zIndex: 1,
              }}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, zIndex: 3 }}>
              <div style={{
                width: 60, height: 60, borderRadius: '50%', background: 'rgba(239,68,68,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 32, color: '#EF4444' }}>videocam_off</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: '#F8FAFC' }}>Feed Kamera Terputus</div>
                <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 3 }}>
                  Target: <span style={{ fontFamily: "'JetBrains Mono', monospace", color: '#38BDF8' }}>{cameraUrl}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                <button
                  onClick={() => { setStreamActive(true); setStreamKey(Date.now()); }}
                  style={{
                    background: '#10B981', color: '#FFF', border: 'none', borderRadius: 8,
                    padding: '7px 14px', fontSize: 11, fontWeight: 800, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 5
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 16 }}>refresh</span>
                  Coba Sambung
                </button>
                <button
                  onClick={() => setShowConfig(true)}
                  style={{
                    background: '#334155', color: '#F8FAFC', border: '1px solid #475569', borderRadius: 8,
                    padding: '7px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Ubah IP / URL
                </button>
              </div>
            </div>
          )}

          {/* OSD Overlays (Always on top) */}
          {/* Top-left: Cam ID + timestamp */}
          <div style={{ position: 'absolute', top: 10, left: 12, display: 'flex', gap: 6, zIndex: 4 }}>
            <div style={{ background: 'rgba(0,0,0,0.7)', padding: '4px 9px', borderRadius: 6, backdropFilter: 'blur(4px)' }}>
              <span style={{ fontSize: 10.5, fontWeight: 900, color: '#4ADE80', fontFamily: "'JetBrains Mono', monospace" }}>CAM-01 · LEMARI PENETAS</span>
            </div>
            <div style={{ background: 'rgba(0,0,0,0.7)', padding: '4px 9px', borderRadius: 6, backdropFilter: 'blur(4px)' }}>
              <span style={{ fontSize: 10.5, fontWeight: 800, color: 'rgba(255,255,255,0.85)', fontFamily: "'JetBrains Mono', monospace" }}>{currentTime}</span>
            </div>
          </div>

          {/* Top-right: REC indicator */}
          <div style={{ position: 'absolute', top: 10, right: 12, display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(239,68,68,0.9)', padding: '4px 9px', borderRadius: 6, zIndex: 4 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#FFF' }} />
            <span style={{ fontSize: 10, fontWeight: 900, color: '#FFF', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em' }}>REC</span>
          </div>

          {/* Bottom info bar */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 4,
            background: 'linear-gradient(transparent, rgba(0,0,0,0.85))',
            padding: '14px 12px 10px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {[['T:', `${temp}°C`, '#FCA5A5'], ['H:', `${hum}%`, '#93C5FD'], ['TILT:', tilt, '#A5F3FC']].map(([l, v, c]) => (
                <div key={l} style={{ background: 'rgba(0,0,0,0.65)', padding: '3px 8px', borderRadius: 6, backdropFilter: 'blur(4px)' }}>
                  <span style={{ fontSize: 9.5, fontWeight: 700, color: 'rgba(255,255,255,0.65)', fontFamily: "'JetBrains Mono', monospace" }}>{l} </span>
                  <span style={{ fontSize: 10.5, fontWeight: 900, color: c, fontFamily: "'JetBrains Mono', monospace" }}>{v}</span>
                </div>
              ))}
            </div>
            <span style={{ fontSize: 9.5, fontWeight: 800, color: 'rgba(255,255,255,0.45)', fontFamily: "'JetBrains Mono', monospace" }}>MJPEG · 30fps · H.264</span>
          </div>
        </div>
      </div>

      {/* ===== PTZ CONTROL PANEL ===== */}
      <div
        style={{
          width: 240,
          background: '#FFFFFF',
          borderRadius: 18,
          border: '2px solid #E2E8F0',
          padding: '12px 14px',
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
          <div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', lineHeight: 1.1 }}>PTZ Control</div>
          <div style={{ fontSize: 9.5, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 2 }}>Pan · Tilt · Zoom</div>
        </div>

        {/* Mode selector */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[['pan', 'open_with', 'Pan/Tilt'], ['zoom', 'zoom_in', 'Zoom']].map(([m, ic, lbl]) => (
            <button key={m} onClick={() => setPtzMode(m)} style={{
              flex: 1, padding: '6px 5px', borderRadius: 9,
              border: `2px solid ${ptzMode === m ? '#14B8A6' : '#E2E8F0'}`,
              background: ptzMode === m ? '#F0FDFA' : '#F8FAFC',
              cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              boxShadow: ptzMode === m ? '0 2px 8px rgba(20,184,166,0.2)' : 'none',
              transition: 'all 0.2s',
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: ptzMode === m ? '#14B8A6' : '#94A3B8' }}>{ic}</span>
              <span style={{ fontSize: 9.5, fontWeight: 800, color: ptzMode === m ? '#14B8A6' : '#64748B', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em' }}>{lbl}</span>
            </button>
          ))}
        </div>

        {/* D-Pad */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          {[
            [null, 'arrow_upward', null],
            ['arrow_back', 'adjust', 'arrow_forward'],
            [null, 'arrow_downward', null],
          ].map((row, ri) => (
            <div key={ri} style={{ display: 'flex', gap: 4 }}>
              {row.map((cell, ci) => cell ? (
                <button key={ci} style={{
                  width: 48, height: 38, borderRadius: 9,
                  border: '1.5px solid #E2E8F0',
                  background: cell === 'adjust' ? 'linear-gradient(135deg, #F0FDFA, #CCFBF1)' : '#F8FAFC',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.06)',
                  transition: 'all 0.15s',
                }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 20, color: cell === 'adjust' ? '#14B8A6' : '#1E293B' }}>{cell}</span>
                </button>
              ) : <div key={ci} style={{ width: 48 }} />)}
            </div>
          ))}
        </div>

        {/* Zoom Controls */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#64748B', letterSpacing: '0.07em', textTransform: 'uppercase' }}>Zoom</span>
            <span style={{ fontSize: 12, fontWeight: 900, color: '#14B8A6', fontFamily: "'JetBrains Mono', monospace" }}>1.0×</span>
          </div>
          <div style={{ display: 'flex', gap: 5 }}>
            {[['zoom_out', 'OUT'], ['zoom_in', 'IN']].map(([ic, lbl]) => (
              <button key={ic} style={{
                flex: 1, height: 34, borderRadius: 9,
                border: '1.5px solid #E2E8F0', background: '#F8FAFC',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                cursor: 'pointer', transition: 'all 0.15s',
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#374151' }}>{ic}</span>
                <span style={{ fontSize: 9.5, fontWeight: 800, color: '#475569', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em' }}>{lbl}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Capture / Record */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={{
            flex: 1, height: 38, borderRadius: 10, border: '1.5px solid #BFDBFE', cursor: 'pointer',
            background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            boxShadow: '0 2px 6px rgba(37,99,235,0.15)',
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 17, color: '#2563EB' }}>photo_camera</span>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#2563EB', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.07em' }}>FOTO</span>
          </button>
          <button style={{
            flex: 1, height: 38, borderRadius: 10, border: '1.5px solid #FECACA', cursor: 'pointer',
            background: 'linear-gradient(135deg, #FEF2F2, #FEE2E2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
            boxShadow: '0 2px 6px rgba(239,68,68,0.15)',
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 17, color: '#DC2626' }}>radio_button_checked</span>
            <span style={{ fontSize: 10, fontWeight: 900, color: '#DC2626', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.07em' }}>REKAM</span>
          </button>
        </div>
      </div>

      {/* ===== MODAL PENGATURAN CCTV IP ===== */}
      {showConfig && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
          backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: '#FFF', borderRadius: 16, width: 440, padding: 22,
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)', border: '1.5px solid #E2E8F0'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="material-symbols-rounded" style={{ fontSize: 24, color: '#10B981' }}>videocam</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#0F172A' }}>Konfigurasi CCTV Lemari</span>
              </div>
              <button
                onClick={() => setShowConfig(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>

            <p style={{ fontSize: 12, color: '#64748B', lineHeight: 1.5, margin: '0 0 14px 0' }}>
              Masukkan alamat URL Stream MJPEG / HTTP CCTV lokal Anda atau gunakan preset simulasi:
            </p>

            {/* Presets */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
              <button
                type="button"
                onClick={() => setCameraUrl('http://192.168.1.44:8080/video_feed')}
                style={{
                  flex: 1, padding: '6px 8px', borderRadius: 8, fontSize: 10.5, fontWeight: 800,
                  background: cameraUrl.includes('192.168.1.44:8080') ? '#ECFDF5' : '#F1F5F9',
                  border: `1.5px solid ${cameraUrl.includes('192.168.1.44:8080') ? '#10B981' : '#CBD5E1'}`,
                  color: cameraUrl.includes('192.168.1.44:8080') ? '#065F46' : '#334155',
                  cursor: 'pointer'
                }}
              >
                💻 Laptop Simulator
              </button>
              <button
                type="button"
                onClick={() => setCameraUrl('http://192.168.1.50:8090/video.mjpg')}
                style={{
                  flex: 1, padding: '6px 8px', borderRadius: 8, fontSize: 10.5, fontWeight: 800,
                  background: cameraUrl.includes(':8090') ? '#ECFDF5' : '#F1F5F9',
                  border: `1.5px solid ${cameraUrl.includes(':8090') ? '#10B981' : '#CBD5E1'}`,
                  color: cameraUrl.includes(':8090') ? '#065F46' : '#334155',
                  cursor: 'pointer'
                }}
              >
                📹 Xihancam (Star Eye)
              </button>
            </div>

            <form onSubmit={handleSaveConfig}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800, color: '#334155', marginBottom: 6 }}>
                URL Stream Kamera (MJPEG / HTTP):
              </label>
              <input
                type="text"
                value={cameraUrl}
                onChange={(e) => setCameraUrl(e.target.value)}
                placeholder="http://192.168.1.xxx:8080/video_feed"
                style={{
                  width: '100%', boxSizing: 'border-box', padding: '10px 12px',
                  borderRadius: 8, border: '1.5px solid #CBD5E1',
                  fontSize: 12.5, fontFamily: "'JetBrains Mono', monospace",
                  marginBottom: 16, outline: 'none'
                }}
              />

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setShowConfig(false)}
                  style={{
                    padding: '8px 14px', borderRadius: 8, border: '1px solid #CBD5E1',
                    background: '#F8FAFC', color: '#475569', fontSize: 12, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingConfig}
                  style={{
                    padding: '8px 16px', borderRadius: 8, border: 'none',
                    background: '#10B981', color: '#FFF', fontSize: 12, fontWeight: 800, cursor: 'pointer'
                  }}
                >
                  {savingConfig ? 'Menyimpan...' : 'Simpan & Terapkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KameraLangsung;
