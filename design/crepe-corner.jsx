const { React } = window;

const egp = (n) => `${n} ج.م`;

const CCLogo = ({ size = 64, style }) => (
  <div style={{
    position: 'relative', width: size, height: size, borderRadius: '50%', 
    overflow: 'hidden', backgroundColor: 'var(--cc-yellow)', 
    display: 'flex', alignItems: 'center', justifyContent: 'center', 
    flexDirection: 'column', ...style
  }}>
    <div style={{
      position: 'absolute', inset: 0,
      background: 'repeating-conic-gradient(from 0deg, var(--cc-ink) 0 15deg, transparent 15deg 30deg)',
      WebkitMaskImage: 'radial-gradient(circle, transparent 60%, black 61%)',
      maskImage: 'radial-gradient(circle, transparent 60%, black 61%)'
    }} />
    <div style={{ zIndex: 1, textAlign: 'center', lineHeight: 1.05, fontFamily: 'Rubik, sans-serif', fontWeight: 900, fontStyle: 'italic', fontSize: size * 0.22 }}>
      <div style={{ color: 'var(--cc-red)', transform: 'translateX(-2px)' }}>Crepe</div>
      <div style={{ color: 'var(--cc-ink)', transform: 'translateX(2px)' }}>CoRner</div>
    </div>
  </div>
);

const CCRibbon = ({ children, style }) => (
  <div style={{
    background: 'var(--cc-red)',
    color: 'white',
    fontWeight: 'bold',
    padding: '4px 16px',
    clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
    display: 'inline-block',
    fontSize: '14px',
    ...style
  }}>
    {children}
  </div>
);

const TAG_CONFIG = {
  hot: { icon: '🌶', text: 'حار', bg: 'var(--cc-hot)', color: 'white' },
  popular: { icon: '⭐', text: 'الأكثر طلباً', bg: 'var(--cc-yellow)', color: 'var(--cc-ink)' },
  signature: { icon: '✦', text: 'سيجنتشر', bg: 'var(--cc-ink)', color: 'var(--cc-yellow)' },
  family: { icon: '👨‍👩‍👧', text: 'عيلة', bg: 'var(--cc-green)', color: 'white' }
};

const CCTag = ({ type, style }) => {
  const config = TAG_CONFIG[type];
  if (!config) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      background: config.bg, color: config.color,
      padding: '2px 8px', borderRadius: '12px', fontSize: '10px', fontWeight: 'bold',
      ...style
    }}>
      <span>{config.icon}</span>
      <span>{config.text}</span>
    </span>
  );
};

const CCRow = ({ item, onClickAdd }) => (
  <div style={{ display: 'flex', gap: '12px', padding: '12px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', marginBottom: '12px' }}>
    <div style={{ width: '76px', height: '76px', borderRadius: '8px', overflow: 'hidden', flexShrink: 0, position: 'relative' }}>
      <img src={item.img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
      <div>
        <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '4px', color: 'var(--cc-ink)' }}>{item.name}</div>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {item.tags?.map(t => <CCTag key={t} type={t} />)}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div className="price-text" style={{ color: 'var(--cc-red)', fontSize: '16px' }}>
          {item.price} <span className="price-currency">ج.م</span>
        </div>
        <button onClick={onClickAdd} style={{
          width: '32px', height: '32px', backgroundColor: 'var(--cc-ink)', color: 'white',
          border: 'none', borderRadius: '8px', fontSize: '20px', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', paddingBottom: '2px',
          transition: 'transform 0.1s',
        }}
        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
        >+</button>
      </div>
    </div>
  </div>
);

Object.assign(window, { egp, CCLogo, CCRibbon, CCTag, CCRow });
