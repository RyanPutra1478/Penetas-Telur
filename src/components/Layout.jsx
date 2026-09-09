import React from 'react';
import { Outlet } from 'react-router-dom';
import TopAppBar from './TopAppBar';
import BottomNavBar from './BottomNavBar';

const Layout = () => (
  <div
    style={{
      background: '#F1F5F9',
      display: 'flex',
      flexDirection: 'column',
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}
  >
    <TopAppBar />
    <main style={{
      flex: 1,
      minHeight: 0,
      overflow: 'hidden',
      padding: '8px 14px',
      boxSizing: 'border-box',
    }}>
      <Outlet />
    </main>
    <BottomNavBar />
  </div>
);

export default Layout;
