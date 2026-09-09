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
      background: '#FFFFFF',
      borderTop: '1px solid #E2E8F0',
      boxShadow: '0 -3px 12px rgba(0,0,0,0.05)',
      zIndex: 50,
      padding: '0 16px',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      height: 62,
      flexShrink: 0,
      position: 'relative',
    }}>
      <div className="batik-ribbon-strip" style={{ position: 'absolute', top: 0, left: 0, right: 0 }} />
      {navItems.map((item) => {
        const isActive = path === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              flex: 1,
              maxWidth: 120,
              height: 50,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              borderRadius: 14,
              border: isActive ? `1.5px solid ${item.color}40` : '1.5px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              background: isActive ? item.bg : 'transparent',
              boxShadow: isActive ? `0 2px 8px ${item.color}20` : 'none',
            }}
          >
            <span
              className="material-symbols-rounded"
              style={{
                fontSize: 24,
                color: isActive ? item.color : '#94A3B8',
                transition: 'all 0.2s',
                fontWeight: isActive ? 700 : 500,
              }}
            >
              {item.icon}
            </span>
            <span style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: '0.06em',
              color: isActive ? item.color : '#64748B',
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
