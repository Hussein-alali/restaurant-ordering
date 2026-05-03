import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import logoSrc from '/logo.png'
import headerBg from '/branch-header-bg.png'
import bodyBg from '/branch-body-bg.png'

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

  useEffect(() => {
    fetch('/api/branches')
      .then(r => r.ok ? r.json() : [])
      .then(data => { setBranches(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const selectBranch = (branch) => {
    dispatch({ type: 'SET_BRANCH', payload: { id: branch.id, name: branch.name, phone: branch.phone, address: branch.address } })
    navigate('/')
  }

  return (
    <div dir="rtl" style={{
      ...ar,
      minHeight: '100vh',
      backgroundImage: `url(${bodyBg})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    }}>
      {/* Header */}
      <div style={{
        backgroundImage: `url(${headerBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        padding: '54px 18px 28px',
        textAlign: 'center',
      }}>
        <img src={logoSrc} alt="Crepe Corner" style={{ width: 72, height: 72, borderRadius: 36, objectFit: 'cover', marginBottom: 12 }} />
        <div style={{ ...disp, color: C.yellow, fontWeight: 800, fontSize: 22, fontStyle: 'italic', marginBottom: 4 }}>
          Crepe Corner
        </div>
        <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
          اختار الفرع الأقرب ليك
        </div>
      </div>

      <div style={{ padding: '24px 18px', maxWidth: 480, margin: '0 auto' }}>
        <div style={{ ...disp, fontSize: 20, fontWeight: 900, color: C.ink, marginBottom: 6 }}>
          اختار فرعك
        </div>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>
          المنتجات المعروضة هتكون بتاعت الفرع اللي هتختاره
        </p>

        {loading && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: C.muted, fontSize: 14 }}>
            جاري التحميل…
          </div>
        )}

        {!loading && !branches.length && (
          <div style={{
            background: 'rgba(255,255,255,0.92)', border: `1px solid ${C.rule}`, borderRadius: 14,
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
              onClick={() => {
                dispatch({ type: 'SET_BRANCH', payload: null })
                navigate('/')
              }}
              style={{
                background: C.red, color: '#fff', border: 'none', borderRadius: 12,
                padding: '12px 24px', fontSize: 14, fontWeight: 800, cursor: 'pointer',
              }}
            >
              تصفح القائمة ←
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {branches.map(branch => (
            <button
              key={branch.id}
              onClick={() => selectBranch(branch)}
              style={{
                background: 'rgba(255,255,255,0.92)',
                border: `1.5px solid ${C.rule}`,
                borderRadius: 16,
                padding: '18px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                cursor: 'pointer',
                textAlign: 'right',
                transition: 'border-color .15s, box-shadow .15s',
                width: '100%',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = C.red; e.currentTarget.style.boxShadow = '0 4px 16px rgba(168,22,12,.14)' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = C.rule; e.currentTarget.style.boxShadow = 'none' }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 14, background: C.red,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, flexShrink: 0,
              }}>
                🏪
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ ...disp, fontSize: 16, fontWeight: 900, color: C.ink }}>{branch.name}</div>
                {branch.address && (
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>📍 {branch.address}</div>
                )}
                {branch.phone && (
                  <div style={{ fontSize: 12, color: C.body, marginTop: 2 }}>📞 {branch.phone}</div>
                )}
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
                <path d="M10 4l-4 4 4 4" stroke={C.muted} strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
