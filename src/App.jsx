import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import Layout from './components/Layout';
import DasborUtama from './pages/DasborUtama';
import KontrolLingkungan from './pages/KontrolLingkungan';

import PemantauanBatch from './pages/PemantauanBatch';
import KontrolRak from './pages/KontrolRak';
import KameraLangsung from './pages/KameraLangsung';
import StatusSistem from './pages/StatusSistem';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DasborUtama />} />
          <Route path="control" element={<KontrolLingkungan />} />

          <Route path="batch" element={<PemantauanBatch />} />
          <Route path="rack" element={<KontrolRak />} />
          <Route path="camera" element={<KameraLangsung />} />
          <Route path="settings" element={<StatusSistem />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
