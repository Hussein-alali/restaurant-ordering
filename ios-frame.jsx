const { React } = window;

const IOSDevice = ({ children, style, label }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
    {label && <div style={{ color: 'var(--cc-muted)', fontFamily: 'Cairo, sans-serif', fontWeight: 'bold' }}>{label}</div>}
    <div style={{
      width: '402px', height: '874px', backgroundColor: '#000', borderRadius: '54px',
      position: 'relative', padding: '14px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
      flexShrink: 0,
      ...style
    }}>
      {/* Outer band highlight */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: '54px',
        boxShadow: 'inset 0 0 4px rgba(255,255,255,0.2)', pointerEvents: 'none'
      }} />

      {/* Inner screen wrapper */}
      <div style={{
        width: '100%', height: '100%', backgroundColor: 'var(--cc-bg)', borderRadius: '40px',
        overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column'
      }}>
        {/* Dynamic Island */}
        <div style={{
          position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)',
          width: '120px', height: '32px', backgroundColor: '#000',
          borderRadius: '16px', zIndex: 1000
        }} />
        
        {/* Content wrapper */}
        <div className="ios-content-scroll" style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
          {children}
        </div>

        {/* Home indicator */}
        <div style={{
          position: 'absolute', bottom: '8px', left: '50%', transform: 'translateX(-50%)',
          width: '134px', height: '5px', backgroundColor: 'var(--cc-ink)',
          borderRadius: '100px', zIndex: 1000
        }} />
      </div>
    </div>
  </div>
);

Object.assign(window, { IOSDevice });
