import React from 'react';
import { Outlet } from 'react-router-dom';
import TopAppBar from './TopAppBar';
import BottomNavBar from './BottomNavBar';

const Layout = () => (
  <div style={{
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    background: '#F0F4FF',
  }}>
    <TopAppBar />
    <main style={{
      flex: 1,
      overflow: 'auto',
      padding: '12px 14px',
      paddingBottom: 82,
    }}>
      <Outlet />
    </main>
    <BottomNavBar />
  </div>
);

export default Layout;
