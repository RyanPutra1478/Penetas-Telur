import React, { useState } from 'react';

const TopAppBar = () => {
  const [activeIcons, setActiveIcons] = useState({
    cloud: true,
    network: true,
    emergency: false,
  });

  const toggleIcon = (key) => {
    setActiveIcons((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const icons = [
    { key: 'cloud', icon: 'cloud_done', color: '#39E239', offColor: '#8A8070', title: 'Cloud Sync' },
    { key: 'network', icon: 'settings_ethernet', color: '#FF9500', offColor: '#8A8070', title: 'Network Link' },
    { key: 'emergency', icon: 'emergency', color: '#CC2200', offColor: '#8A8070', title: 'Emergency Stop' },
  ];

  return (
    <header style={{
      background: 'linear-gradient(180deg, #EDE7D8 0%, #D8D0C0 100%)',
      boxShadow: `
        inset 0px -3px 0px #A89880,
        inset 0px 2px 0px #F5F0E8,
        0px 4px 8px rgba(0,0,0,0.25)
      `,
      borderBottom: '2px solid #9A8C78',
      width: '100%',
      padding: '0 20px',
      height: '48px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexShrink: 0,
      zIndex: 20,
    }}>
      {/* Brand Plate */}
      <div style={{
        background: 'linear-gradient(135deg, #2C2416 0%, #4A3E2E 100%)',
        padding: '4px 16px',
        borderRadius: '4px',
        boxShadow: `
          inset 1px 1px 0px rgba(255,255,255,0.1),
          inset -1px -1px 0px rgba(0,0,0,0.4),
          2px 2px 4px rgba(0,0,0,0.4)
        `,
        border: '1px solid #1A1410',
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: '13px',
          fontWeight: 700,
          letterSpacing: '0.12em',
          color: '#E8D898',
          textShadow: '0 0 8px rgba(232,216,152,0.5)',
        }}>
          OVO-INCUBATOR-PRO
        </span>
      </div>

      {/* Status Icons */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        {icons.map((item) => {
          const isActive = activeIcons[item.key];
          return (
            <button
              key={item.key}
              title={item.title}
              onClick={() => toggleIcon(item.key)}
              style={{
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: isActive
                  ? 'linear-gradient(160deg, #F0EAE0 0%, #D8D0C0 100%)'
                  : 'linear-gradient(160deg, #D4CCC0 0%, #C4BAA8 100%)',
                boxShadow: isActive
                  ? `
                    inset 1px 1px 0px rgba(255,255,255,0.8),
                    inset -1px -1px 0px #9A8C78,
                    2px 2px 4px rgba(0,0,0,0.25)
                  `
                  : 'inset 2px 2px 4px rgba(0,0,0,0.3)',
                border: `1px solid ${isActive ? '#B8A890' : '#9A8C78'}`,
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.1s ease',
                transform: isActive ? 'none' : 'translate(1px, 1px)',
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: '18px',
                  color: isActive ? item.color : item.offColor,
                  filter: isActive ? `drop-shadow(0 0 3px ${item.color})` : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {item.icon}
              </span>
            </button>
          );
        })}
      </div>
    </header>
  );
};

export default TopAppBar;

