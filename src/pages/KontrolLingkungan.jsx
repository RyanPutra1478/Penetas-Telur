import React, { useState, useEffect } from 'react';
import { IconAyam, IconBebek, IconPuyuh, IconKalkun, IconAngsa, IconKustom } from '../components/AnimalIcons';
import { getControlMode, setControlMode, getActuators } from '../api/tetascoApi';

const profiles = [
  { name: 'AYAM',   durasi: '21 hr', days: 21, temp: 37.8, hum: 55, color: '#F97316', bg: '#FFF7ED', border: '#FED7AA', icon: IconAyam, desc: 'Ayam Kampung, Ras, Petelur, & Broiler' },
  { name: 'BEBEK',  durasi: '28 hr', days: 28, temp: 37.5, hum: 60, color: '#3B82F6', bg: '#EFF6FF', border: '#BFDBFE', icon: IconBebek, desc: 'Bebek Petelur, Alabio, & Manila / Entok' },
  { name: 'PUYUH',  durasi: '18 hr', days: 18, temp: 37.7, hum: 50, color: '#8B5CF6', bg: '#F5F3FF', border: '#DDD6FE', icon: IconPuyuh, desc: 'Burung Puyuh Petelur & Pedaging' },
  { name: 'KALKUN', durasi: '28 hr', days: 28, temp: 37.5, hum: 55, color: '#14B8A6', bg: '#F0FDFA', border: '#99F6E4', icon: IconKalkun, desc: 'Ayam Kalkun Hias & Konsumsi' },
  { name: 'ANGSA',  durasi: '30 hr', days: 30, temp: 37.6, hum: 65, color: '#EC4899', bg: '#FDF2F8', border: '#FBCFE8', icon: IconAngsa, desc: 'Angsa / Goose Penetasan Basah' },
  { name: 'KUSTOM', durasi: 'Manual', days: 21, temp: 37.5, hum: 55, color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0', icon: IconKustom, desc: 'Pengaturan Bebas Suhu & Kelembaban' },
];

const KontrolLingkungan = () => {
  const [selected, setSelected] = useState(null); // null saat SIAGA: tidak ada pilihan yang aktif
  const [temp, setTemp] = useState(37.8);
  const [hum,  setHum]  = useState(55.0);
  const [currentDay, setCurrentDay] = useState(0);
  const [totalDays, setTotalDays] = useState(21);
  const [heaterActive, setHeaterActive] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState('STANDBY'); // 'STANDBY' atau 'RUNNING'

  // Modal Verifikasi State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingProfileIdx, setPendingProfileIdx] = useState(null);
  const [showPauseModal, setShowPauseModal] = useState(false);

  const p = selected !== null ? profiles[selected] : profiles[0];
  const isKustom = selected !== null && p.name === 'KUSTOM';
  const canAdjust = isKustom && deviceStatus === 'RUNNING';

  // Baca setpoint dari backend saat halaman dimuat
  useEffect(() => {
    let isMounted = true;
    const fetchMode = async () => {
      try {
        const mode = await getControlMode();
        const acts = await getActuators();
        if (!isMounted) return;
        if (mode) {
          if (mode.device_status) {
            setDeviceStatus(mode.device_status);
            if (mode.device_status === 'STANDBY') {
              setSelected(null);
            }
          }
          if (mode.target_temp !== undefined) setTemp(mode.target_temp);
          if (mode.target_hum !== undefined) setHum(mode.target_hum);
          if (mode.current_day !== undefined) setCurrentDay(mode.current_day);
          if (mode.total_days !== undefined) setTotalDays(mode.total_days);
          if (mode.device_status === 'RUNNING' && mode.profile) {
            const idx = profiles.findIndex(pr => pr.name.toUpperCase() === mode.profile.toUpperCase());
            if (idx !== -1) setSelected(idx);
          }
        }
        if (acts && (acts.lamp_1 !== undefined || acts.heater !== undefined)) {
          setHeaterActive(Boolean(acts.lamp_1 || acts.lamp_2 || acts.heater));
        }
      } catch (err) {
        // Safe failover
      }
    };
    fetchMode();
    const timer = setInterval(fetchMode, 1500);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  // Saat tombol profil telur diklik: buka Pop-Up Verifikasi
  const handleProfileClick = (idx) => {
    setPendingProfileIdx(idx);
    setShowConfirmModal(true);
  };

  // Konfirmasi Verifikasi Profil & Pengaktifan Mesin
  const confirmProfileSwitch = async () => {
    if (pendingProfileIdx === null) return;
    const chosen = profiles[pendingProfileIdx];
    setSelected(pendingProfileIdx);
    setTemp(chosen.temp);
    setHum(chosen.hum);
    setTotalDays(chosen.days);
    setCurrentDay(1); // Mulai dari hari ke-1
    setDeviceStatus('RUNNING'); // Otomatis aktifkan mesin saat profil diverifikasi
    setShowConfirmModal(false);

    await setControlMode({
      device_status: 'RUNNING',
      auto: true,
      target_temp: chosen.temp,
      target_hum: chosen.hum,
      profile: chosen.name,
      current_day: 1,
      total_days: chosen.days,
    });
  };

  // Ubah status mesin ke STANDBY (Jeda)
  const confirmPauseToStandby = async () => {
    setDeviceStatus('STANDBY');
    setSelected(null); // Saat siaga, tidak ada pilihan yang aktif
    setCurrentDay(0);
    setShowPauseModal(false);
    await setControlMode({
      device_status: 'STANDBY',
      auto: false,
    });
  };

  const adjustTemp = (newTemp) => {
    const rounded = +(Math.max(20, Math.min(45, newTemp))).toFixed(1);
    setTemp(rounded);
    setControlMode({ target_temp: rounded, profile: 'KUSTOM' });
  };

  const adjustHum = (newHum) => {
    const clamped = Math.max(0, Math.min(100, newHum));
    setHum(clamped);
    setControlMode({ target_hum: clamped, profile: 'KUSTOM' });
  };

  const pendingP = pendingProfileIdx !== null ? profiles[pendingProfileIdx] : null;
  const progressPercent = totalDays > 0 ? Math.min(100, Math.round((currentDay / totalDays) * 100)) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%', boxSizing: 'border-box' }}>

      {/* Row 1: Profile Selection Buttons (Dalam mode SIAGA, SEMUA tombol dalam status netral/nonaktif) */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        {profiles.map((pr, i) => {
          const active = deviceStatus === 'RUNNING' && selected === i;
          const AnimalIcon = pr.icon;
          return (
            <button
              key={pr.name}
              onClick={() => handleProfileClick(i)}
              style={{
                flex: 1,
                padding: '9px 4px',
                borderRadius: 14,
                border: `2px solid ${active ? pr.color : '#E2E8F0'}`,
                background: active ? pr.bg : '#FFFFFF',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                boxShadow: active ? `0 4px 14px ${pr.color}35` : '0 1px 4px rgba(0,0,0,0.04)',
                transition: 'all 0.2s ease',
              }}
            >
              <AnimalIcon size={22} color={active ? pr.color : '#94A3B8'} />
              <span style={{
                fontSize: 11, fontWeight: 900,
                color: active ? pr.color : '#64748B',
                letterSpacing: '0.06em', textTransform: 'uppercase',
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {pr.name}
              </span>
              <span style={{ fontSize: 9.5, fontWeight: 700, color: active ? pr.color : '#94A3B8' }}>
                {pr.durasi}
              </span>
            </button>
          );
        })}
      </div>

      {/* Row 2: Progres Hari Penetasan Otomatis (Tanpa tombol +/- & tanpa fase berlebih) */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 14,
        border: '1.5px solid #E2E8F0',
        padding: '12px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 20, color: deviceStatus === 'RUNNING' ? '#4F46E5' : '#94A3B8' }}>
              hourglass_top
            </span>
            <span style={{ fontSize: 12, fontWeight: 900, color: '#1E293B', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              Progres Penetasan
            </span>
            <span style={{
              fontSize: 11, fontWeight: 900,
              color: deviceStatus === 'RUNNING' ? '#4F46E5' : '#64748B',
              background: deviceStatus === 'RUNNING' ? '#EEF2FF' : '#F1F5F9',
              padding: '2px 9px', borderRadius: 999,
              fontFamily: "'JetBrains Mono', monospace",
            }}>
              {deviceStatus === 'RUNNING'
                ? `Hari ke-${currentDay} dari ${totalDays} Hari (${progressPercent}%)`
                : 'Mesin Siaga · Belum Ada Telur Dipilih'}
            </span>
          </div>

          {/* Action Jeda ke Siaga jika sedang berjalan */}
          {deviceStatus === 'RUNNING' && (
            <button
              onClick={() => setShowPauseModal(true)}
              style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 8,
                padding: '3px 10px',
                fontSize: 10,
                fontWeight: 800,
                color: '#DC2626',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 14 }}>pause</span>
              JEDA KE SIAGA
            </button>
          )}
        </div>

        {/* Automatic Visual Progress Bar */}
        <div style={{
          width: '100%',
          height: 9,
          background: '#F1F5F9',
          borderRadius: 999,
          overflow: 'hidden',
        }}>
          <div style={{
            width: deviceStatus === 'RUNNING' ? `${progressPercent}%` : '0%',
            height: '100%',
            background: 'linear-gradient(90deg, #4F46E5 0%, #7C3AED 100%)',
            borderRadius: 999,
            transition: 'width 0.4s ease',
          }} />
        </div>
      </div>

      {/* Row 3: Main Setpoint Controls (Suhu & Kelembaban) */}
      <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0 }}>

        {/* 1. SUHU TARGET */}
        <div
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)',
            borderRadius: 18, border: '2px solid #FED7AA',
            padding: '14px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(249,115,22,0.10)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          <div className="batik-overlay batik-overlay-warm" />

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: '#FFEDD5', border: '1.5px solid #FED7AA',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#EA580C' }}>device_thermostat</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 900, color: '#C2410C', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Suhu Target
              </span>
            </div>

            {/* Heater Status Indicator */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: heaterActive ? '#FFF7ED' : 'rgba(255,255,255,0.7)',
              borderRadius: 999,
              border: `1.5px solid ${heaterActive ? '#FED7AA' : '#E2E8F0'}`,
              padding: '3px 10px',
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 16, color: heaterActive ? '#EA580C' : '#94A3B8' }}>
                local_fire_department
              </span>
              <span style={{ fontSize: 9.5, fontWeight: 900, color: heaterActive ? '#EA580C' : '#64748B', fontFamily: "'JetBrains Mono', monospace" }}>
                {heaterActive ? 'PEMANAS AKTIF' : 'PEMANAS SIAGA'}
              </span>
            </div>
          </div>

          {/* Big Number Display */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6, my: 'auto', position: 'relative', zIndex: 1 }}>
            <span style={{
              fontSize: 52, fontWeight: 900, color: '#EA580C',
              lineHeight: 1, fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '-0.03em',
            }}>
              {temp.toFixed(1)}
            </span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#FB923C' }}>°C</span>
          </div>

          {/* Plus / Minus Buttons */}
          <div style={{ display: 'flex', gap: 10, position: 'relative', zIndex: 1 }}>
            {[['−', () => adjustTemp(temp - 0.1)], ['+', () => adjustTemp(temp + 0.1)]].map(([lbl, fn]) => (
              <button
                key={lbl}
                onClick={fn}
                disabled={!canAdjust}
                style={{
                  flex: 1, height: 44, borderRadius: 12, fontSize: 22, fontWeight: 900,
                  border: 'none',
                  cursor: canAdjust ? 'pointer' : 'not-allowed',
                  background: canAdjust ? '#FFEDD5' : '#F1F5F9',
                  color: canAdjust ? '#EA580C' : '#CBD5E1',
                  boxShadow: canAdjust ? '0 2px 8px rgba(234,88,12,0.22)' : 'none',
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        {/* 2. KELEMBABAN TARGET */}
        <div
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)',
            borderRadius: 18, border: '2px solid #BFDBFE',
            padding: '14px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(59,130,246,0.10)',
            position: 'relative', overflow: 'hidden',
          }}
        >
          <div className="batik-overlay batik-overlay-blue" />

          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: '#DBEAFE', border: '1.5px solid #BFDBFE',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span className="material-symbols-rounded" style={{ fontSize: 18, color: '#2563EB' }}>water_drop</span>
              </div>
              <span style={{ fontSize: 12, fontWeight: 900, color: '#1D4ED8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Kelembaban Target
              </span>
            </div>

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              background: 'rgba(255,255,255,0.7)',
              borderRadius: 999,
              border: '1.5px solid #BFDBFE',
              padding: '3px 10px',
            }}>
              <span style={{ fontSize: 9.5, fontWeight: 800, color: '#1D4ED8', fontFamily: "'JetBrains Mono', monospace" }}>
                KABIN KELEMBABAN
              </span>
            </div>
          </div>

          {/* Big Number Display */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 6, my: 'auto', position: 'relative', zIndex: 1 }}>
            <span style={{
              fontSize: 52, fontWeight: 900, color: '#2563EB',
              lineHeight: 1, fontFamily: "'JetBrains Mono', monospace",
              letterSpacing: '-0.03em',
            }}>
              {hum}
            </span>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#60A5FA' }}>% RH</span>
          </div>

          {/* Plus / Minus Buttons */}
          <div style={{ display: 'flex', gap: 10, position: 'relative', zIndex: 1 }}>
            {[['−', () => adjustHum(hum - 1)], ['+', () => adjustHum(hum + 1)]].map(([lbl, fn]) => (
              <button
                key={lbl}
                onClick={fn}
                disabled={!canAdjust}
                style={{
                  flex: 1, height: 44, borderRadius: 12, fontSize: 22, fontWeight: 900,
                  border: 'none',
                  cursor: canAdjust ? 'pointer' : 'not-allowed',
                  background: canAdjust ? '#DBEAFE' : '#F1F5F9',
                  color: canAdjust ? '#2563EB' : '#CBD5E1',
                  boxShadow: canAdjust ? '0 2px 8px rgba(37,99,235,0.22)' : 'none',
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* ========================================================
          POP-UP MODAL VERIFIKASI JENIS TELUR & AKTIVASI MESIN
          ======================================================== */}
      {showConfirmModal && pendingP && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{
            background: '#FFFFFF',
            borderRadius: 20,
            maxWidth: 500, width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            border: '2px solid #E2E8F0',
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* Modal Header */}
            <div style={{
              background: `linear-gradient(135deg, ${pendingP.color} 0%, #1E293B 100%)`,
              padding: '16px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              color: '#FFFFFF',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {React.createElement(pendingP.icon, { size: 28, color: '#FFFFFF' })}
                <div>
                  <div style={{ fontSize: 15, fontWeight: 900, letterSpacing: '0.02em' }}>
                    {deviceStatus === 'STANDBY' ? 'VERIFIKASI & MULAI PENETASAN' : 'KONFIRMASI GANTI PROFIL TELUR'}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)' }}>
                    {pendingP.desc}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none', borderRadius: '50%',
                  width: 28, height: 28,
                  color: '#FFFFFF', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Parameter Details */}
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ fontSize: 12, color: '#334155', fontWeight: 600, lineHeight: 1.4 }}>
                {deviceStatus === 'STANDBY' ? (
                  <span>
                    Anda akan memulai penetasan untuk telur <strong>{pendingP.name}</strong>. Mesin akan aktif dan kontrol suhu serta kelembaban mulai bekerja.
                  </span>
                ) : (
                  <span>
                    Anda akan mengubah jenis telur menjadi <strong>{pendingP.name}</strong>. Target lingkungan akan disesuaikan.
                  </span>
                )}
              </div>

              {/* Parameter Cards Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                <div style={{
                  background: '#FFF7ED', border: '1.5px solid #FED7AA',
                  borderRadius: 12, padding: '10px 8px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 9.5, fontWeight: 800, color: '#C2410C' }}>SUHU TARGET</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#EA580C', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
                    {pendingP.temp.toFixed(1)}°C
                  </div>
                </div>

                <div style={{
                  background: '#EFF6FF', border: '1.5px solid #BFDBFE',
                  borderRadius: 12, padding: '10px 8px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 9.5, fontWeight: 800, color: '#1D4ED8' }}>KELEMBABAN</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#2563EB', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
                    {pendingP.hum}% RH
                  </div>
                </div>

                <div style={{
                  background: '#F5F3FF', border: '1.5px solid #DDD6FE',
                  borderRadius: 12, padding: '10px 8px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 9.5, fontWeight: 800, color: '#6D28D9' }}>DURASI SIKLUS</div>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#7C3AED', fontFamily: "'JetBrains Mono', monospace", marginTop: 2 }}>
                    {pendingP.days} Hari
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{
              background: '#F8FAFC',
              borderTop: '1px solid #E2E8F0',
              padding: '12px 20px',
              display: 'flex', justifyContent: 'flex-end', gap: 10,
            }}>
              <button
                onClick={() => setShowConfirmModal(false)}
                style={{
                  padding: '8px 16px', borderRadius: 10,
                  border: '1.5px solid #CBD5E1', background: '#FFFFFF',
                  color: '#475569', fontWeight: 800, fontSize: 11,
                  cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                BATAL
              </button>
              <button
                onClick={confirmProfileSwitch}
                style={{
                  padding: '8px 18px', borderRadius: 10,
                  border: 'none',
                  background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                  color: '#FFFFFF', fontWeight: 900, fontSize: 11,
                  cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
                  boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <span className="material-symbols-rounded" style={{ fontSize: 16 }}>check_circle</span>
                {deviceStatus === 'STANDBY' ? 'VERIFIKASI & MULAI' : 'YA, GANTI TELUR'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          POP-UP MODAL KONFIRMASI JEDA KE SIAGA
          ======================================================== */}
      {showPauseModal && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 20,
        }}>
          <div style={{
            background: '#FFFFFF', borderRadius: 20,
            maxWidth: 440, width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            border: '2px solid #E2E8F0', overflow: 'hidden',
          }}>
            <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span className="material-symbols-rounded" style={{ fontSize: 22, color: '#DC2626' }}>
                    pause_circle
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: '#0F172A' }}>
                    JEDA KE MODE SIAGA?
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>
                    Seluruh pemanas dan sirkulasi akan dinonaktifkan.
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: '#475569', lineHeight: 1.4 }}>
                Mesin akan kembali ke mode siaga dan pilihan jenis telur akan dinonaktifkan sampai Anda memverifikasi jenis telur baru.
              </div>
            </div>

            <div style={{
              background: '#F8FAFC', borderTop: '1px solid #E2E8F0',
              padding: '12px 20px', display: 'flex', justifyContent: 'flex-end', gap: 10,
            }}>
              <button
                onClick={() => setShowPauseModal(false)}
                style={{
                  padding: '8px 14px', borderRadius: 10,
                  border: '1.5px solid #CBD5E1', background: '#FFFFFF',
                  color: '#475569', fontWeight: 800, fontSize: 11,
                  cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                BATAL
              </button>
              <button
                onClick={confirmPauseToStandby}
                style={{
                  padding: '8px 16px', borderRadius: 10, border: 'none',
                  background: '#DC2626', color: '#FFFFFF',
                  fontWeight: 900, fontSize: 11, cursor: 'pointer',
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                YA, JEDA KE SIAGA
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default KontrolLingkungan;
