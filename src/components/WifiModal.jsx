import React, { useState, useEffect } from 'react';
import { getWifiStatus, scanWifi, connectWifi, disconnectWifi } from '../api/tetascoApi';

const WifiModal = ({ isOpen, onClose, onStatusChange }) => {
  const [currentStatus, setCurrentStatus] = useState({ connected: false, ssid: null, ip: null, signal: 0 });
  const [networks, setNetworks] = useState([]);
  const [loadingScan, setLoadingScan] = useState(false);
  const [connectingSsid, setConnectingSsid] = useState(null);
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  // Load status dan lakukan scan awal ketika modal dibuka
  useEffect(() => {
    if (isOpen) {
      loadStatus();
      handleScan();
    } else {
      setSelectedNetwork(null);
      setPassword('');
      setFeedback(null);
    }
  }, [isOpen]);

  const showMsg = (message, type = 'info') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 4500);
  };

  const loadStatus = async () => {
    const st = await getWifiStatus();
    if (st) {
      setCurrentStatus(st);
      if (onStatusChange) onStatusChange(st.connected);
    }
  };

  const handleScan = async () => {
    setLoadingScan(true);
    try {
      const list = await scanWifi();
      setNetworks(list || []);
    } catch (err) {
      showMsg('Gagal memindai jaringan Wi-Fi.', 'error');
    } finally {
      setLoadingScan(false);
    }
  };

  const handleSelectNetwork = (net) => {
    if (net.connected) return;
    setSelectedNetwork(net);
    setPassword('');
  };

  const handleConnect = async (e) => {
    e?.preventDefault();
    if (!selectedNetwork) return;

    setConnectingSsid(selectedNetwork.ssid);
    showMsg(`Menghubungkan ke ${selectedNetwork.ssid}...`, 'info');

    try {
      const res = await connectWifi(selectedNetwork.ssid, password);
      if (res && res.success) {
        showMsg(res.message || `Berhasil terhubung ke ${selectedNetwork.ssid}!`, 'success');
        setSelectedNetwork(null);
        setPassword('');
        await loadStatus();
        await handleScan();
      } else {
        showMsg(res?.message || 'Gagal terhubung. Periksa kata sandi.', 'error');
      }
    } catch (err) {
      showMsg('Terjadi kesalahan jaringan.', 'error');
    } finally {
      setConnectingSsid(null);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm(`Putuskan sambungan dari Wi-Fi "${currentStatus.ssid}"?`)) return;
    try {
      const res = await disconnectWifi();
      if (res && res.success) {
        showMsg('Koneksi Wi-Fi berhasil diputus.', 'success');
        await loadStatus();
        await handleScan();
      } else {
        showMsg(res?.message || 'Gagal memutus Wi-Fi.', 'error');
      }
    } catch (err) {
      showMsg('Kesalahan sistem.', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: 16,
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 20,
        width: '100%',
        maxWidth: 480,
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)',
        overflow: 'hidden',
        border: '1px solid #E2E8F0',
      }}>
        {/* Header Modal */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#F8FAFC',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: '#EFF6FF',
              color: '#3B82F6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <span className="material-symbols-rounded" style={{ fontSize: 20 }}>wifi</span>
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.2 }}>
                Pengaturan Wi-Fi
              </h3>
              <p style={{ fontSize: 10.5, color: '#64748B', margin: 0, marginTop: 2 }}>
                Koneksi Jaringan Lokal & Internet Incubator
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: 'none',
              background: '#E2E8F0',
              color: '#475569',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 18 }}>close</span>
          </button>
        </div>

        {/* Notifikasi Status / Pesan */}
        {feedback && (
          <div style={{
            padding: '8px 16px',
            fontSize: 11,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: feedback.type === 'error' ? '#FEE2E2' : feedback.type === 'success' ? '#DCFCE7' : '#DBEAFE',
            color: feedback.type === 'error' ? '#991B1B' : feedback.type === 'success' ? '#166534' : '#1E40AF',
            borderBottom: '1px solid #E2E8F0',
          }}>
            <span className="material-symbols-rounded" style={{ fontSize: 16 }}>
              {feedback.type === 'error' ? 'error' : feedback.type === 'success' ? 'check_circle' : 'info'}
            </span>
            <span style={{ flex: 1 }}>{feedback.message}</span>
          </div>
        )}

        {/* Konten Utama */}
        <div style={{ padding: 18, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Status Koneksi Saat Ini */}
          <div style={{
            background: currentStatus.connected ? 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)' : '#F8FAFC',
            border: `1.5px solid ${currentStatus.connected ? '#86EFAC' : '#E2E8F0'}`,
            borderRadius: 14,
            padding: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="material-symbols-rounded" style={{
                  fontSize: 22,
                  color: currentStatus.connected ? '#16A34A' : '#94A3B8'
                }}>
                  {currentStatus.connected ? 'wifi' : 'wifi_off'}
                </span>
                <div>
                  <div style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: currentStatus.connected ? '#15803D' : '#64748B' }}>
                    {currentStatus.connected ? 'Terhubung' : 'Terputus'}
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', marginTop: 1 }}>
                    {currentStatus.ssid || 'Tidak ada koneksi'}
                  </div>
                  {currentStatus.ip && (
                    <div style={{ fontSize: 10, color: '#475569', marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>
                      IP: {currentStatus.ip}
                    </div>
                  )}
                </div>
              </div>

              {currentStatus.connected && (
                <button
                  onClick={handleDisconnect}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1px solid #FCA5A5',
                    background: '#FEF2F2',
                    color: '#DC2626',
                    fontSize: 10.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <span className="material-symbols-rounded" style={{ fontSize: 14 }}>link_off</span>
                  Putuskan
                </button>
              )}
            </div>
          </div>

          {/* Form Input Password bila ada jaringan yang dipilih */}
          {selectedNetwork && (
            <div style={{
              background: '#EFF6FF',
              border: '1.5px solid #93C5FD',
              borderRadius: 14,
              padding: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#1E40AF' }}>
                  Sambungkan ke: {selectedNetwork.ssid}
                </span>
                <button
                  onClick={() => setSelectedNetwork(null)}
                  style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', fontSize: 11 }}
                >
                  Batal
                </button>
              </div>

              <form onSubmit={handleConnect}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {selectedNetwork.security !== 'OPEN' ? (
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Masukkan Kata Sandi Wi-Fi..."
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoFocus
                        style={{
                          width: '100%',
                          padding: '10px 40px 10px 12px',
                          borderRadius: 8,
                          border: '1.5px solid #CBD5E1',
                          fontSize: 12,
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{
                          position: 'absolute',
                          right: 8,
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#64748B',
                          cursor: 'pointer',
                        }}
                      >
                        <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                          {showPassword ? 'visibility_off' : 'visibility'}
                        </span>
                      </button>
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: '#166534', fontStyle: 'italic' }}>
                      Jaringan ini terbuka (tanpa kata sandi).
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <button
                      type="submit"
                      disabled={connectingSsid === selectedNetwork.ssid}
                      style={{
                        flex: 1,
                        padding: '9px',
                        borderRadius: 8,
                        border: 'none',
                        background: '#3B82F6',
                        color: '#FFF',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        opacity: connectingSsid === selectedNetwork.ssid ? 0.7 : 1,
                      }}
                    >
                      {connectingSsid === selectedNetwork.ssid ? (
                        <>
                          <span className="material-symbols-rounded" style={{ fontSize: 16, animation: 'spin 1s infinite linear' }}>
                            sync
                          </span>
                          Menyambungkan...
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-rounded" style={{ fontSize: 16 }}>login</span>
                          Sambungkan
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Daftar Jaringan Terdeteksi */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Jaringan Sekitar ({networks.length})
              </span>
              <button
                onClick={handleScan}
                disabled={loadingScan}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#3B82F6',
                  fontSize: 11,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                <span
                  className="material-symbols-rounded"
                  style={{ fontSize: 15, animation: loadingScan ? 'spin 1s infinite linear' : 'none' }}
                >
                  refresh
                </span>
                {loadingScan ? 'Memindai...' : 'Pindai Ulang'}
              </button>
            </div>

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              maxHeight: 220,
              overflowY: 'auto',
            }}>
              {networks.length === 0 && !loadingScan && (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#94A3B8', fontSize: 11 }}>
                  Tidak ada jaringan yang terdeteksi. Tekan Pindai Ulang.
                </div>
              )}

              {networks.map((net) => {
                const isCurrent = currentStatus.connected && currentStatus.ssid === net.ssid;
                const isProtected = net.security && net.security !== 'OPEN';

                return (
                  <div
                    key={net.ssid}
                    onClick={() => handleSelectNetwork(net)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: 10,
                      background: isCurrent ? '#F0FDF4' : '#F8FAFC',
                      border: `1px solid ${isCurrent ? '#86EFAC' : '#E2E8F0'}`,
                      cursor: isCurrent ? 'default' : 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span className="material-symbols-rounded" style={{
                        fontSize: 18,
                        color: isCurrent ? '#16A34A' : net.signal > 60 ? '#3B82F6' : '#64748B'
                      }}>
                        {net.signal > 70 ? 'signal_wifi_4_bar' : net.signal > 40 ? 'network_wifi_3_bar' : 'network_wifi_1_bar'}
                      </span>
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>
                          {net.ssid}
                        </div>
                        <div style={{ fontSize: 9.5, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6, marginTop: 1 }}>
                          <span>Sinyal: {net.signal}%</span>
                          {isProtected ? (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <span className="material-symbols-rounded" style={{ fontSize: 10 }}>lock</span>
                              {net.security}
                            </span>
                          ) : (
                            <span style={{ color: '#16A34A', fontWeight: 600 }}>Terbuka</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      {isCurrent ? (
                        <span style={{
                          fontSize: 9,
                          fontWeight: 800,
                          background: '#DCFCE7',
                          color: '#166534',
                          padding: '3px 8px',
                          borderRadius: 6,
                          textTransform: 'uppercase',
                        }}>
                          Aktif
                        </span>
                      ) : (
                        <span className="material-symbols-rounded" style={{ fontSize: 16, color: '#94A3B8' }}>
                          chevron_right
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer info */}
        <div style={{
          padding: '10px 18px',
          borderTop: '1px solid #E2E8F0',
          background: '#F8FAFC',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 9.5, color: '#94A3B8', fontFamily: "'JetBrains Mono', monospace" }}>
            NetworkManager (nmcli) · Tetasco
          </span>
          <button
            onClick={onClose}
            style={{
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#334155',
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

export default WifiModal;
