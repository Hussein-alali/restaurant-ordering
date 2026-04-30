const { React } = window;

const DesignCanvas = ({ children }) => (
  <div style={{
    minHeight: '100vh',
    padding: '60px',
    display: 'flex',
    flexDirection: 'column',
    gap: '80px',
    overflowX: 'auto',
    backgroundColor: '#1a1a1a'
  }}>
    {children}
  </div>
);

const CanvasSection = ({ title, children }) => (
  <div>
    <h2 style={{ 
      color: 'white', marginBottom: '32px', fontFamily: 'Cairo, sans-serif',
      borderBottom: '2px solid #333', paddingBottom: '16px', display: 'inline-block'
    }}>
      {title}
    </h2>
    <div style={{ display: 'flex', gap: '48px', alignItems: 'flex-start' }}>
      {children}
    </div>
  </div>
);

Object.assign(window, { DesignCanvas, CanvasSection });
