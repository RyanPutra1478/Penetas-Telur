import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const navItems = [
  { icon: 'home', label: 'HOME', path: '/' },
  { icon: 'tune', label: 'CONTROL', path: '/control' },
  { icon: 'layers', label: 'BATCH', path: '/batch' },
  { icon: 'grid_view', label: 'RACK', path: '/rack' },
  { icon: 'videocam', label: 'CAMERA', path: '/camera' },
  { icon: 'settings', label: 'SETTINGS', path: '/settings' },
];

const BottomNavBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav style={{
      background: 'linear-gradient(180deg, #C8C0B0 0%, #D8D0C0 100%)',
      borderTop: '3px solid #A89880',
      boxShadow: `
        inset 0px 2px 0px #F0EAE0,
        0px -4px 10px rgba(0,0,0,0.2)
      `,
      position: 'fixed',
      bottom: 0, left: 0,
      width: '100%',
      zIndex: 50,
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '6px 12px',
      height: '72px',
      gap: '8px',
    }}>
      {/* Seam line at top of nav */}
      <div style={{
        position: 'absolute',
        top: '3px', left: 0, right: 0,
        height: '1px',
        background: 'rgba(255,255,255,0.5)',
      }} />

      {navItems.map((item) => {
        const isActive = currentPath === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              flex: 1,
              maxWidth: '120px',
              height: '52px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              borderRadius: '6px',
              cursor: 'pointer',
              transition: 'all 0.08s ease',
              // Active: recessed / pressed in
              ...(isActive ? {
                background: 'linear-gradient(160deg, #C4BAA8 0%, #D8D0C0 100%)',
                boxShadow: `
                  inset 3px 3px 6px rgba(0,0,0,0.3),
                  inset -1px -1px 0px rgba(255,255,255,0.5)
                `,
                border: '2px solid #C87020',
                color: '#C87020',
              } : {
                background: 'linear-gradient(160deg, #EDE7D8 0%, #D4CCC0 100%)',
                boxShadow: `
                  inset 1px 1px 0px rgba(255,255,255,0.8),
                  inset -1px -1px 0px #9A8C78,
                  2px 2px 4px rgba(0,0,0,0.2)
                `,
                border: '1px solid #B8A890',
                color: '#6B5D48',
              }),
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: '18px',
                fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              {item.icon}
            </span>
            <span className="font-label-sm" style={{ fontSize: '8px' }}>
              {item.label}
            </span>
            {/* Active indicator LED */}
            {isActive && (
              <div style={{
                position: 'absolute',
                bottom: '4px',
                width: '6px', height: '6px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #8FFF8F, #39E239)',
                boxShadow: '0 0 6px rgba(57,226,57,0.8)',
              }} />
            )}
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNavBar;
