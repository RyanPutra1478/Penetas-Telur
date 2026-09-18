import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Layout from './components/Layout';
import DasborUtama from './pages/DasborUtama';
import KontrolLingkungan from './pages/KontrolLingkungan';
import KontrolRak from './pages/KontrolRak';
import PemantauanBatch from './pages/PemantauanBatch';
import KameraLangsung from './pages/KameraLangsung';
import ProfilSistem from './pages/ProfilSistem';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DasborUtama />} />
          <Route path="control" element={<KontrolLingkungan />} />
          <Route path="rack" element={<KontrolRak />} />
          <Route path="batch" element={<PemantauanBatch />} />
          <Route path="camera" element={<KameraLangsung />} />
          <Route path="profil" element={<ProfilSistem />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
