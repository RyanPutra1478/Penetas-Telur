import React from 'react';
import { Outlet } from 'react-router-dom';
import TopAppBar from './TopAppBar';
import BottomNavBar from './BottomNavBar';

const Layout = () => {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      overflow: 'hidden',
      background: 'linear-gradient(145deg, #DDD5C5 0%, #CCC4B4 100%)',
    }}>
      <TopAppBar />
      <main style={{
        flex: 1,
        overflow: 'auto',
        padding: 'var(--panel-margin)',
        paddingBottom: '88px',
      }}>
        <Outlet />
      </main>
      <BottomNavBar />
    </div>
  );
};

export default Layout;
