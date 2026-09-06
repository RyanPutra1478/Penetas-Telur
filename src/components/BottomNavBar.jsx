import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { icon: 'home',      label: 'HOME',    path: '/',        color: '#6366F1', bg: '#EEF2FF' },
  { icon: 'tune',      label: 'KONTROL', path: '/control', color: '#F97316', bg: '#FFF7ED' },
  { icon: 'layers',    label: 'BATCH',   path: '/batch',   color: '#22C55E', bg: '#F0FDF4' },
  { icon: 'videocam',  label: 'KAMERA',  path: '/camera',  color: '#14B8A6', bg: '#F0FDFA' },
  { icon: 'person',    label: 'PROFIL',  path: '/profil',  color: '#8B5CF6', bg: '#F5F3FF' },
];

const BottomNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const path = location.pathname;

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      background: '#FFFFFF',
      borderTop: '1px solid #E2E8F0',
      boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
      zIndex: 50,
      padding: '6px 16px 4px',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      height: 68,
    }}>
      {navItems.map((item) => {
        const isActive = path === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              flex: 1,
              height: 56,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              borderRadius: 14,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: isActive ? item.bg : 'transparent',
            }}
          >
            <span
              className="material-symbols-rounded"
              style={{
                fontSize: 24,
                color: isActive ? item.color : '#94A3B8',
                transition: 'color 0.2s',
              }}
            >
              {item.icon}
            </span>
            <span style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.06em',
              color: isActive ? item.color : '#94A3B8',
              fontFamily: "'JetBrains Mono', monospace",
              textTransform: 'uppercase',
              transition: 'color 0.2s',
            }}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNavBar;
