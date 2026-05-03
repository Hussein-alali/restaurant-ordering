import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import logoSrc from '/logo.png'
import bgLogoSrc from '/background-logo.png'

const C = {
  red:        '#a8160c',
  redDeep:    '#7a0d05',
  redDark:    '#5a0902',
  yellow:     '#f4b528',
  yellowSoft: '#fde6a8',
  bg:         '#f5ece0',
  card:       '#ffffff',
  ink:        '#1a0e08',
  body:       '#5b4636',
  muted:      '#9a8674',
  rule:       '#ead8bf',
}

const ar   = { fontFamily: '"Cairo", "Noto Naskh Arabic", system-ui, sans-serif' }
const disp = { fontFamily: '"Rubik", "Cairo", system-ui, sans-serif' }

export default function BranchSelectorPage() {
  const { dispatch } = useCart()
  const navigate = useNavigate()
  const [branches, setBranches] = useState([])
  const [loading, setLoading]   = useState(true)
  const [siteName, setSiteName] = useState('Crepe Corner')
  const [tagline, setTagline]   = useState('اختار الفرع الأقرب ليك')

  useEffect(() => {
    fetch('/api/branches')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setBranches(data); setLoading(false) })
      .catch(() => setLoading(false))
    fetch('/api/settings')
      .then(r => r.ok ? r.json() : {})
      .then(s => {
        if (s.restaurant_name) setSiteName(s.restaurant_name)
        if (s.tagline) setTagline(s.tagline)
      })
      .catch(() => {})
  }, [])

  const selectBranch = (branch) => {
    dispatch({ type: 'SET_BRANCH', payload: { id: branch.id, name: branch.name, phone: branch.phone, address: branch.address } })
    navigate('/')
  }

  return (
    <div dir="rtl" style={{ background: C.bg, minHeight: '100vh', ...ar }}>
      {/* Header — identical to MenuPage */}
      <div style={{
        background: `linear-gradient(180deg, ${C.redDark} 0%, ${C.red} 100%)`,
        padding: '54px 18px 18px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Background watermark */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <img src={bgLogoSrc} alt="" style={{
            position: 'absolute', left: -20, top: '50%', transform: 'translateY(-50%)',
            width: 240, height: 240, objectFit: 'contain', opacity: 0.12,
          }} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          <img src={logoSrc} alt="Crepe Corner" style={{ width: 64, height: 64, borderRadius: 32, objectFit: 'cover', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ ...disp, color: C.yellow, fontWeight: 800, fontSize: 18, letterSpacing: -0.3, fontStyle: 'italic' }}>
              {siteName}
            </div>
            <div style={{ color: '#fff', fontSize: 11, opacity: 0.85, marginTop: 2 }}>
              {tagline}
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '20px 18px', maxWidth: 480, margin: '0 auto' }}>
        {/* Section header — same ribbon style as MenuPage */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{
            display: 'inline-block', background: C.red, color: '#fff',
            padding: '10px 22px 10px 28px',
            ...ar, fontWeight: 800, fontSize: 18,
            clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
          }}>
            الفروع
          </div>
          {!loading && branches.length > 0 && (
            <div style={{ fontSize: 11, color: C.body, fontWeight: 600 }}>{branches.length} فرع</div>
          )}
        </div>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: C.muted, fontSize: 14 }}>
            جاري التحميل…
          </div>
        )}

        {!loading && !branches.length && (
          <div style={{
            background: C.card, border: `1px solid ${C.rule}`, borderRadius: 14,
            padding: '24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🏪</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.ink, marginBottom: 8 }}>
              لا توجد فروع حالياً
            </div>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 16 }}>
              يمكنك تصفح القائمة الكاملة
            </p>
            <button
              onClick={() => { dispatch({ type: 'SET_BRANCH', payload: null }); navigate('/') }}
              style={{
                background: C.red, color: '#fff', border: 'none', borderRadius: 12,
                padding: '12px 24px', fontSize: 14, fontWeight: 800, cursor: 'pointer',
              }}
            >
              تصفح القائمة ←
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {branches.map(branch => (
            <div
              key={branch.id}
              onClick={() => selectBranch(branch)}
              style={{
                background: C.card, borderRadius: 14, padding: 10,
                border: `1px solid ${C.rule}`,
                display: 'flex', gap: 12, alignItems: 'center',
                cursor: 'pointer',
              }}
            >
              <div style={{
                width: 76, height: 76, flexShrink: 0, borderRadius: 11,
                background: `linear-gradient(135deg, ${C.redDark} 0%, ${C.red} 100%)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32,
              }}>
                🏪
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...ar, fontSize: 15, fontWeight: 800, color: C.ink, lineHeight: 1.25 }}>
                  {branch.name}
                </div>
                {branch.address && (
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>📍 {branch.address}</div>
                )}
                {branch.phone && (
                  <div style={{ fontSize: 12, color: C.body, marginTop: 2 }}>📞 {branch.phone}</div>
                )}
              </div>
              <div style={{ flexShrink: 0 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10, background: C.ink, color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: 'none',
                }}>
                  <svg width="14" height="14" viewBox="0 0 14 14">
                    <path d="M9 4L5 7l4 3" stroke="#fff" strokeWidth="1.9" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
