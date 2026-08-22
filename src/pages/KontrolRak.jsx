import React from 'react';

const racks = [
  { id:'01', angle:'+45', status:'ok' },{ id:'02', angle:'+45', status:'ok' },
  { id:'03', angle:'+45', status:'ok' },{ id:'04', angle:'00', status:'off' },
  { id:'05', angle:'-45', status:'ok' },{ id:'06', angle:'-45', status:'ok' },
  { id:'07', angle:'ERR', status:'error' },{ id:'08', angle:'-45', status:'ok' },
];

const KontrolRak = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
      <div>
        <span className="font-headline" style={{ color: '#2C2416', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TILT CONTROL SYSTEM</span>
        <div className="font-label-sm" style={{ color: '#6B5D48', marginTop: '2px' }}>SYS_ID: RCK-GRP-01 // MANUAL OVERRIDE ENGAGED</div>
      </div>
      <button className="btn-raised" style={{ padding: '10px 18px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="material-symbols-outlined" style={{ fontSize: '18px', color: '#6B5D48' }}>sync</span>
        <span className="font-label-caps" style={{ color: '#2C2416', fontSize: '10px' }}>BALIK SEMUA RAK</span>
      </button>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', flex: 1 }}>
      {racks.map(rack => {
        const isErr = rack.status === 'error';
        const isOff = rack.status === 'off';
        return (
          <div key={rack.id} style={{
            background: 'linear-gradient(145deg, #E8E0D0 0%, #D0C8B8 100%)',
            boxShadow: `inset 2px 2px 0px rgba(255,255,255,0.8), inset -2px -2px 0px #9A8C78, 3px 3px 8px rgba(0,0,0,0.2)`,
            border: `2px solid ${isErr ? '#CC2200' : '#B8A890'}`,
            borderRadius: '8px',
            padding: '12px',
            display: 'flex', flexDirection: 'column', gap: '8px',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="font-label-caps" style={{ color: isErr ? '#CC2200' : '#4A3E2E', fontSize: '10px' }}>RACK {rack.id}</span>
              <div className="led-housing" style={{ width: '18px', height: '18px' }}>
                <div className={`led ${isErr ? 'led-on-red' : isOff ? 'led-off-green' : 'led-on-green'}`} style={{ width: '10px', height: '10px' }} />
              </div>
            </div>

            {/* Angle Display */}
            <div className="display-recess" style={{ borderRadius: '6px', padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
              <span className="font-label-sm" style={{ color: 'rgba(57,226,57,0.5)', marginBottom: '4px', fontSize: '7px' }}>ANGLE DEG</span>
              <span className={`font-readout-sm ${isErr ? 'phosphor-red' : isOff ? '' : 'phosphor-green'}`}
                style={isOff ? { color: '#404030' } : {}}>
                {rack.angle}°
              </span>
            </div>

            {/* Controls */}
            {!isErr && (
              <div style={{ display: 'flex', gap: '6px' }}>
                {['arrow_upward','remove','arrow_downward'].map(ic => (
                  <button key={ic} className="btn-raised" style={{ flex: 1, height: '36px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '16px', color: '#6B5D48' }}>{ic}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

export default KontrolRak;
