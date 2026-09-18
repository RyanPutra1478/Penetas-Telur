import React, { useState, useEffect } from 'react';
import { getHydraulicStatus, setHydraulicCommand, setHydraulicMode } from '../api/tetascoApi';

const KontrolRak = () => {
  const [hydraulic, setHydraulic] = useState({
    state: 'IDLE',
    mode: 'MANUAL',
    limit_max: false,
    limit_min: false,
    auto_interval_minutes: 120,
    next_tilt_seconds: 0,
    position_percent: 50,
  });

  const [loadingAction, setLoadingAction] = useState(false);

  // Poll status hidrolik setiap 800ms
  useEffect(() => {
    let isMounted = true;
    const fetchStatus = async () => {
      const data = await getHydraulicStatus();
      if (isMounted && data) {
        setHydraulic(data);
      }
    };

    fetchStatus();
    const timer = setInterval(fetchStatus, 800);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  const handleCommand = async (act) => {
    setLoadingAction(true);
    await setHydraulicCommand(act);
    const updated = await getHydraulicStatus();
    if (updated) setHydraulic(updated);
    setLoadingAction(false);
  };

  const handleToggleMode = async () => {
    const nextMode = hydraulic.mode === 'AUTO' ? 'MANUAL' : 'AUTO';
    await setHydraulicMode(nextMode, hydraulic.auto_interval_minutes);
    const updated = await getHydraulicStatus();
    if (updated) setHydraulic(updated);
  };

  const handleIntervalChange = async (minutes) => {
    await setHydraulicMode(hydraulic.mode, minutes);
    const updated = await getHydraulicStatus();
    if (updated) setHydraulic(updated);
  };

  const isUp = hydraulic.state === 'UP';
  const isDown = hydraulic.state === 'DOWN';
  const isMoving = isUp || isDown;

  // Format detik ke format mm:ss atau hh:mm
  const formatCountdown = (secs) => {
    if (!secs || secs <= 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%', boxSizing: 'border-box' }}>

      {/* 1. Header & Quick Status Bar */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 18,
        border: '1.5px solid #E2E8F0',
        padding: '12px 18px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 13,
            background: 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(109,40,217,0.3)',
          }}>
            <span className={`material-symbols-rounded ${isMoving ? 'animate-spin-slow' : ''}`} style={{ fontSize: 26, color: '#FFF' }}>
              settings_input_component
            </span>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.01em' }}>
                Kontrol Motor Hidrolik Pembalik Telur
              </span>
              <span style={{
                fontSize: 10, fontWeight: 900,
                padding: '2px 8px', borderRadius: 6,
                background: isMoving ? '#FEE2E2' : '#F1F5F9',
                color: isMoving ? '#DC2626' : '#64748B',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {isMoving ? `GERAK ${hydraulic.state}` : 'STANDBY'}
              </span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: '#64748B', marginTop: 2 }}>
              Custom PCB Driver Interface (GPIO 13 UP · GPIO 19 DOWN)
            </div>
          </div>
        </div>

        {/* Mode Selector Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Mode:
          </span>
          <button
            onClick={handleToggleMode}
            style={{
              padding: '6px 14px',
              borderRadius: 999,
              border: `1.5px solid ${hydraulic.mode === 'AUTO' ? '#8B5CF6' : '#CBD5E1'}`,
              background: hydraulic.mode === 'AUTO' ? '#F5F3FF' : '#F8FAFC',
              color: hydraulic.mode === 'AUTO' ? '#7C3AED' : '#475569',
              fontWeight: 900,
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: hydraulic.mode === 'AUTO' ? '0 2px 8px rgba(124,58,237,0.2)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
              {hydraulic.mode === 'AUTO' ? 'autorenew' : 'pan_tool'}
            </span>
            {hydraulic.mode === 'AUTO' ? 'AUTO TILT' : 'MANUAL'}
          </button>
        </div>
      </div>

      {/* 2. Main Work Area: 2 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.95fr', gap: 12, flex: 1, minHeight: 0 }}>

        {/* Kolom Kiri: Tombol Gerak Hidrolik & Visualisasi Tilting */}
        <div style={{
          background: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)',
          borderRadius: 20,
          border: '2px solid #E9D5FF',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 4px 14px rgba(139,92,246,0.08)',
        }}>
          <div className="batik-overlay batik-overlay-purple" />

          {/* Header Card */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: '#6D28D9', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Arah Gerakan & Posisi Rak
            </span>
            <span style={{
              fontSize: 11, fontWeight: 800,
              color: '#7C3AED', background: '#FFFFFF',
              padding: '3px 10px', borderRadius: 999,
              border: '1px solid #DDD6FE',
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              INTERLOCK ACTIVE
            </span>
          </div>

          {/* Visual Tilting Arm & Percentage */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 12,
            my: 'auto',
            position: 'relative',
            zIndex: 1,
          }}>
            {/* Visual Tilt Graphic */}
            <div style={{
              width: 180,
              height: 22,
              background: '#8B5CF6',
              borderRadius: 8,
              transform: `rotate(${((hydraulic.position_percent - 50) * 0.9).toFixed(1)}deg)`,
              transition: 'transform 0.3s cubic-bezier(0.34,1.3,0.64,1)',
              boxShadow: '0 4px 12px rgba(109,40,217,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 8px',
              border: '2px solid #FFFFFF',
            }}>
              <span style={{ fontSize: 10, fontWeight: 900, color: '#FFF' }}>MIN</span>
              <span style={{ fontSize: 10, fontWeight: 900, color: '#FFF' }}>MAX</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{
                fontSize: 44,
                fontWeight: 900,
                color: '#6D28D9',
                fontFamily: "'JetBrains Mono', monospace",
                lineHeight: 1,
              }}>
                {hydraulic.position_percent}%
              </span>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#8B5CF6' }}>Kemiringan Sudut</span>
            </div>
          </div>

          {/* Tombol Kontrol NAIK / STOP / TURUN */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 10,
            position: 'relative',
            zIndex: 1,
          }}>
            {/* Tombol NAIK */}
            <button
              onClick={() => handleCommand('up')}
              disabled={hydraulic.limit_max || isUp || loadingAction}
              style={{
                height: 54,
                borderRadius: 14,
                border: 'none',
                background: isUp ? '#22C55E' : (hydraulic.limit_max ? '#E2E8F0' : '#8B5CF6'),
                color: hydraulic.limit_max ? '#94A3B8' : '#FFFFFF',
                cursor: (hydraulic.limit_max || isUp) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: 14,
                fontWeight: 900,
                fontFamily: "'JetBrains Mono', monospace",
                boxShadow: (hydraulic.limit_max || isUp) ? 'none' : '0 4px 12px rgba(139,92,246,0.35)',
                transition: 'all 0.15s ease',
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 22 }}>arrow_upward</span>
              NAIK
            </button>

            {/* Tombol STOP */}
            <button
              onClick={() => handleCommand('stop')}
              style={{
                height: 54,
                borderRadius: 14,
                border: 'none',
                background: '#EF4444',
                color: '#FFFFFF',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: 14,
                fontWeight: 900,
                fontFamily: "'JetBrains Mono', monospace",
                boxShadow: '0 4px 12px rgba(239,68,68,0.35)',
                transition: 'all 0.15s ease',
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 22 }}>stop_circle</span>
              STOP
            </button>

            {/* Tombol TURUN */}
            <button
              onClick={() => handleCommand('down')}
              disabled={hydraulic.limit_min || isDown || loadingAction}
              style={{
                height: 54,
                borderRadius: 14,
                border: 'none',
                background: isDown ? '#22C55E' : (hydraulic.limit_min ? '#E2E8F0' : '#8B5CF6'),
                color: hydraulic.limit_min ? '#94A3B8' : '#FFFFFF',
                cursor: (hydraulic.limit_min || isDown) ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                fontSize: 14,
                fontWeight: 900,
                fontFamily: "'JetBrains Mono', monospace",
                boxShadow: (hydraulic.limit_min || isDown) ? 'none' : '0 4px 12px rgba(139,92,246,0.35)',
                transition: 'all 0.15s ease',
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 22 }}>arrow_downward</span>
              TURUN
            </button>
          </div>
        </div>

        {/* Kolom Kanan: Limit Switch Status & Auto-Tilt Schedule */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Limit Switch Cards */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 18,
            border: '1.5px solid #E2E8F0',
            padding: '14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            <span style={{ fontSize: 11.5, fontWeight: 900, color: '#475569', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              Sensor Batas Mekanis (Safety Limit)
            </span>

            {/* Limit MAX Card */}
            <div style={{
              background: hydraulic.limit_max ? '#FEF2F2' : '#F8FAFC',
              border: `1.5px solid ${hydraulic.limit_max ? '#FCA5A5' : '#E2E8F0'}`,
              borderRadius: 12,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: hydraulic.limit_max ? '#EF4444' : '#94A3B8',
                  boxShadow: hydraulic.limit_max ? '0 0 10px #EF4444' : 'none',
                }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>LIMIT MAX (Batas Atas)</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#64748B' }}>GPIO 5 · Auto Cut-off UP</div>
                </div>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 900,
                color: hydraulic.limit_max ? '#DC2626' : '#64748B',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {hydraulic.limit_max ? 'TERSENTUH (CUT)' : 'BEBAS'}
              </span>
            </div>

            {/* Limit MIN Card */}
            <div style={{
              background: hydraulic.limit_min ? '#FEF2F2' : '#F8FAFC',
              border: `1.5px solid ${hydraulic.limit_min ? '#FCA5A5' : '#E2E8F0'}`,
              borderRadius: 12,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: hydraulic.limit_min ? '#EF4444' : '#94A3B8',
                  boxShadow: hydraulic.limit_min ? '0 0 10px #EF4444' : 'none',
                }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>LIMIT MIN (Batas Bawah)</div>
                  <div style={{ fontSize: 10, fontWeight: 600, color: '#64748B' }}>GPIO 6 · Auto Cut-off DOWN</div>
                </div>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 900,
                color: hydraulic.limit_min ? '#DC2626' : '#64748B',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {hydraulic.limit_min ? 'TERSENTUH (CUT)' : 'BEBAS'}
              </span>
            </div>
          </div>

          {/* Auto Tilt Settings */}
          <div style={{
            background: '#FFFFFF',
            borderRadius: 18,
            border: '1.5px solid #E2E8F0',
            padding: '14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 11.5, fontWeight: 900, color: '#475569', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Interval Pembalik Otomatis
                </span>
                {hydraulic.mode === 'AUTO' && (
                  <span style={{
                    fontSize: 11, fontWeight: 900,
                    color: '#7C3AED', fontFamily: "'JetBrains Mono', monospace",
                  }}>
                    Tilt: {formatCountdown(hydraulic.next_tilt_seconds)}
                  </span>
                )}
              </div>

              {/* Interval Buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                {[60, 120, 180].map((mins) => {
                  const active = hydraulic.auto_interval_minutes === mins;
                  return (
                    <button
                      key={mins}
                      onClick={() => handleIntervalChange(mins)}
                      style={{
                        flex: 1,
                        padding: '10px 6px',
                        borderRadius: 12,
                        border: `1.5px solid ${active ? '#8B5CF6' : '#E2E8F0'}`,
                        background: active ? '#F5F3FF' : '#F8FAFC',
                        color: active ? '#6D28D9' : '#64748B',
                        fontSize: 12,
                        fontWeight: 900,
                        fontFamily: "'JetBrains Mono', monospace",
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {mins / 60} Jam
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{
              background: '#F8FAFC',
              borderRadius: 10,
              padding: '8px 12px',
              fontSize: 10.5,
              fontWeight: 600,
              color: '#64748B',
              lineHeight: 1.4,
              border: '1px solid #E2E8F0',
            }}>
              💡 Motor bergerak bolak-balik antara LIMIT MIN dan MAX setiap interval untuk mencegah kuning telur menempel pada cangkang.
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default KontrolRak;
