import React, { useState } from 'react';
import { triggerCloudSync, setCloudConfig } from '../api/tetascoApi';

export default function CloudModal({ isOpen, onClose, cloudStatus, onRefresh }) {
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState(null);

  if (!isOpen) return null;

  const isOnline = cloudStatus?.is_online;
  const tetascoId = cloudStatus?.tetasco_id || 1;
  const lastSync = cloudStatus?.last_sync_time || 'Belum ada data';
  const syncStatus = cloudStatus?.last_sync_status || 'Menunggu koneksi';
  const totalRecords = cloudStatus?.total_synced_records || 0;

  const handleSyncNow = async () => {
    setSyncing(true);
    setMessage(null);
    try {
      const res = await triggerCloudSync();
      if (res?.is_online) {
        setMessage({ type: 'success', text: '✅ Sinkronisasi cloud berhasil!' });
      } else {
        setMessage({ type: 'error', text: '⚠️ Tidak dapat terhubung ke tetasco.my.id. Perangkat berada di Mode Offline.' });
      }
      if (onRefresh) onRefresh();
    } catch (e) {
      setMessage({ type: 'error', text: 'Gagal memicu sinkronisasi.' });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(5px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: 16,
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: 20,
        width: '100%',
        maxWidth: 520,
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
        overflow: 'hidden',
        border: '1px solid #E2E8F0',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 22px',
          background: isOnline ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)' : 'linear-gradient(135deg, #475569 0%, #64748B 100%)',
          color: '#FFFFFF',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-rounded" style={{ fontSize: 26 }}>
              {isOnline ? 'cloud_done' : 'cloud_off'}
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800 }}>
                {isOnline ? 'Tetasco Cloud: Mode Online' : 'Tetasco: Mode Offline'}
              </h3>
              <p style={{ margin: 0, fontSize: 12, opacity: 0.9 }}>
                {isOnline ? 'Tersinkronisasi dengan tetasco.my.id' : 'Operasional Lokal Mandiri (Tanpa Internet)'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '50%',
              width: 32,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              cursor: 'pointer',
            }}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 20 }}>close</span>
          </button>
        </div>

        {/* Content Body */}
        <div style={{ padding: '22px' }}>
          {/* Status Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 16px',
            borderRadius: 14,
            background: isOnline ? '#ECFDF5' : '#F1F5F9',
            border: isOnline ? '1.5px solid #A7F3D0' : '1.5px solid #E2E8F0',
            marginBottom: 18,
          }}>
            <div style={{
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: isOnline ? '#10B981' : '#94A3B8',
              boxShadow: isOnline ? '0 0 10px #10B981' : 'none',
              flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: isOnline ? '#065F46' : '#334155' }}>
                {isOnline ? 'Perangkat Terhubung ke Cloud' : 'Perangkat Berjalan Offline'}
              </div>
              <div style={{ fontSize: 12, color: isOnline ? '#047857' : '#64748B', marginTop: 2 }}>
                {isOnline
                  ? 'Data suhu & kelembaban dikirim otomatis ke database cloud.'
                  : 'Jika Wi-Fi terhubung, sistem otomatis beralih ke Mode Online.'}
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
            <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>TETASCO UNIT ID</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>ID: #{tetascoId}</div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Target: tetasco.my.id</div>
            </div>
            <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>RECORD TERSINKRON</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginTop: 4 }}>{totalRecords} Paket</div>
              <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>Terkirim ke PostgreSQL</div>
            </div>
          </div>

          {/* Info Details List */}
          <div style={{
            background: '#FAFAFA',
            border: '1px solid #EAEAEA',
            borderRadius: 12,
            padding: '12px 16px',
            fontSize: 12,
            color: '#475569',
            marginBottom: 18,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span>Server Cloud</span>
              <strong style={{ color: '#0F172A' }}>https://tetasco.my.id</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #F1F5F9' }}>
              <span>Waktu Sinkron Terakhir</span>
              <strong style={{ color: '#0F172A' }}>{lastSync}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
              <span>Status Terakhir</span>
              <strong style={{ color: isOnline ? '#059669' : '#64748B' }}>{syncStatus}</strong>
            </div>
          </div>

          {message && (
            <div style={{
              padding: '10px 14px',
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 16,
              background: message.type === 'success' ? '#ECFDF5' : '#FEF2F2',
              color: message.type === 'success' ? '#065F46' : '#991B1B',
              border: message.type === 'success' ? '1px solid #A7F3D0' : '1px solid #FECACA',
            }}>
              {message.text}
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              onClick={handleSyncNow}
              disabled={syncing}
              style={{
                background: '#4F46E5',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 10,
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: syncing ? 'not-allowed' : 'pointer',
                opacity: syncing ? 0.7 : 1,
              }}
            >
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>sync</span>
              {syncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}
            </button>
            <button
              onClick={onClose}
              style={{
                background: '#E2E8F0',
                color: '#334155',
                border: 'none',
                borderRadius: 10,
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
