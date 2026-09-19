import React, { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Layout from './components/Layout';
import DasborUtama from './pages/DasborUtama';
import KontrolLingkungan from './pages/KontrolLingkungan';
import PemantauanBatch from './pages/PemantauanBatch';
import KameraLangsung from './pages/KameraLangsung';
import ProfilSistem from './pages/ProfilSistem';
import { exitKiosk } from './api/tetascoApi';

function App() {
  // Fitur keluar/tutup tampilan dengan tombol keyboard F11
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F11') {
        e.preventDefault();
        // 1. Keluar dari mode fullscreen browser jika aktif
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        // 2. Kirim perintah tutup kiosk ke backend Raspberry Pi
        exitKiosk();
        // 3. Coba tutup window browser
        window.close();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DasborUtama />} />
          <Route path="control" element={<KontrolLingkungan />} />
          <Route path="batch" element={<PemantauanBatch />} />
          <Route path="camera" element={<KameraLangsung />} />
          <Route path="profil" element={<ProfilSistem />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
