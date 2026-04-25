import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart, calculateTotal } from '../context/CartContext'
import menuData, { CATS } from '../data/menu'

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
  green:      '#1f7a3f',
  hot:        '#e63a1c',
}

const ar = { fontFamily: '"Cairo", "Noto Naskh Arabic", system-ui, sans-serif' }
const disp = { fontFamily: '"Rubik", "Cairo", system-ui, sans-serif' }
const egp = (n) => `${n} ج.م`

function CCLogo({ size = 48 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size / 2,
      background: C.yellow, position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: `inset 0 0 0 3px ${C.ink}`, flexShrink: 0,
    }}>
      <div style={{ textAlign: 'center', lineHeight: 0.85, position: 'relative' }}>
        <div style={{ ...disp, fontSize: size * 0.16, fontWeight: 800, color: C.red, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -0.5 }}>Crepe</div>
        <div style={{ ...disp, fontSize: size * 0.18, fontWeight: 900, color: C.ink, fontStyle: 'italic', textTransform: 'uppercase', letterSpacing: -0.5, marginTop: 2 }}>CoRner</div>
      </div>
    </div>
  )
}

function Tag({ tag }) {
  if (tag === 'hot')       return <span style={{ ...ar, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: '#fde2dc', color: C.hot }}>🌶 حار</span>
  if (tag === 'popular')   return <span style={{ ...ar, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: C.yellowSoft, color: C.redDeep }}>⭐ الأكثر طلباً</span>
  if (tag === 'signature') return <span style={{ ...ar, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: C.ink, color: C.yellow }}>✦ سيجنتشر</span>
  if (tag === 'family')    return <span style={{ ...ar, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: '#e6f4ec', color: C.green }}>👨‍👩‍👧 عيلة</span>
  return null
}

function MenuRow({ item, onAdd }) {
  return (
    <div style={{
      background: C.card, borderRadius: 14, padding: 10,
      border: `1px solid ${C.rule}`,
      display: 'flex', gap: 12, alignItems: 'center',
    }}>
      <div style={{
        width: 76, height: 76, flexShrink: 0, borderRadius: 11,
        backgroundImage: `url(${item.image})`, backgroundSize: 'cover', backgroundPosition: 'center',
        background: item.image ? undefined : C.rule,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4, flexWrap: 'wrap' }}>
          {item.tags.map(t => <Tag key={t} tag={t} />)}
        </div>
        <div style={{ ...ar, fontSize: 15, fontWeight: 800, color: C.ink, lineHeight: 1.25 }}>
          {item.name}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <div style={{ ...disp, fontSize: 17, fontWeight: 800, color: C.red, fontStyle: 'italic' }}>
            {egp(item.price)}
          </div>
          <button
            onClick={() => onAdd(item)}
            style={{
              width: 34, height: 34, borderRadius: 10, background: C.ink, color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: 'none', cursor: 'pointer', flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14"><path d="M7 2v10M2 7h10" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" /></svg>
          </button>
        </div>
      </div>
    </div>
  )
}

function MenuPage() {
  const { state, dispatch } = useCart()
  const [activeCat, setActiveCat] = useState(CATS[0].id)
  const navigate = useNavigate()

  const cartCount = state.items.reduce((s, i) => s + i.quantity, 0)
  const total = calculateTotal(state.items)

  const items = menuData.filter(m => m.cat === activeCat)
  const cat = CATS.find(c => c.id === activeCat)

  const serviceOptions = [
    { key: 'توصيل',        sub: '٣٠ د' },
    { key: 'استلام',       sub: '١٥ د' },
    { key: 'داخل المحل',   sub: 'QR'   },
  ]

  const addToCart = item => dispatch({ type: 'ADD_ITEM', payload: item })

  return (
    <div dir="rtl" style={{ background: C.bg, minHeight: '100vh', ...ar }}>
      {/* Red header */}
      <div style={{
        background: `linear-gradient(180deg, ${C.redDark} 0%, ${C.red} 100%)`,
        padding: '54px 18px 18px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `radial-gradient(circle at 20% 30%, rgba(244,181,40,0.08) 0%, transparent 50%), radial-gradient(circle at 80% 70%, rgba(255,255,255,0.05) 0%, transparent 40%)`,
          pointerEvents: 'none',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          <CCLogo size={48} />
          <div style={{ flex: 1 }}>
            <div style={{ ...disp, color: C.yellow, fontWeight: 800, fontSize: 18, letterSpacing: -0.3, fontStyle: 'italic' }}>
              Crepe Corner
            </div>
            <div style={{ color: '#fff', fontSize: 11, opacity: 0.85, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>📍</span> كفر صقر · شارع المستشفى · 01044438830
            </div>
          </div>
          <div style={{
            width: 38, height: 38, borderRadius: 19, background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="#fff" strokeWidth="1.6" />
              <path d="M11 11l3 3" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Service toggle */}
        <div style={{
          marginTop: 14, background: 'rgba(0,0,0,0.25)', borderRadius: 12, padding: 4,
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2,
        }}>
          {serviceOptions.map(({ key, sub }) => {
            const active = state.serviceType === key
            return (
              <button
                key={key}
                onClick={() => dispatch({ type: 'SET_SERVICE_TYPE', payload: key })}
                style={{
                  padding: '8px 6px', borderRadius: 9, textAlign: 'center',
                  background: active ? C.yellow : 'transparent',
                  border: 'none', cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, color: active ? C.ink : '#fff' }}>{key}</div>
                <div style={{ fontSize: 9, color: active ? C.redDeep : 'rgba(255,255,255,0.7)', marginTop: 1, fontWeight: 600 }}>{sub}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Hero offer */}
      <div style={{ padding: '14px 18px 0' }}>
        <div style={{
          background: C.ink, borderRadius: 14, padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 12, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            width: 60, height: 60, borderRadius: 12, flexShrink: 0,
            background: `url(https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&q=80) center/cover`,
            border: `2px solid ${C.yellow}`,
          }} />
          <div style={{ flex: 1, color: '#fff' }}>
            <div style={{ fontSize: 11, color: C.yellow, fontWeight: 700 }}>عرض اليوم</div>
            <div style={{ fontSize: 15, fontWeight: 800, marginTop: 2, lineHeight: 1.3 }}>كريب كورنر + بطاطس</div>
            <div style={{ fontSize: 11, color: '#d8c4a8', marginTop: 2 }}>وفّر ٢٥ ج.م</div>
          </div>
          <div style={{ ...disp, fontSize: 22, fontWeight: 900, color: C.yellow, fontStyle: 'italic', flexShrink: 0 }}>
            ١٧٥<span style={{ fontSize: 11, marginRight: 2 }}>ج.م</span>
          </div>
        </div>
      </div>

      {/* Category strip */}
      <div style={{
        padding: '14px 0 6px', position: 'sticky', top: 0, zIndex: 5,
        background: C.bg,
      }}>
        <div style={{ display: 'flex', gap: 8, padding: '0 18px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
          {CATS.map(c => (
            <button
              key={c.id}
              onClick={() => setActiveCat(c.id)}
              style={{
                padding: '9px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
                background: c.id === activeCat ? C.red : C.card,
                color: c.id === activeCat ? '#fff' : C.ink,
                border: c.id === activeCat ? 'none' : `1px solid ${C.rule}`,
                boxShadow: c.id === activeCat ? '0 4px 10px rgba(168,22,12,0.3)' : 'none',
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              {c.ar}
            </button>
          ))}
        </div>
      </div>

      {/* Section header */}
      <div style={{
        padding: '14px 18px 12px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{
          display: 'inline-block', background: C.red, color: '#fff',
          padding: '10px 22px 10px 28px',
          ...ar, fontWeight: 800, fontSize: 18,
          clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
        }}>
          {cat?.ar}
        </div>
        <div style={{ fontSize: 11, color: C.body, fontWeight: 600 }}>
          {items.length} صنف
        </div>
      </div>

      {/* Items */}
      <div style={{ padding: '0 18px', paddingBottom: cartCount > 0 ? 120 : 32, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {items.map(item => <MenuRow key={item.id} item={item} onAdd={addToCart} />)}
      </div>

      {/* Floating cart bar */}
      {cartCount > 0 && (
        <div style={{
          position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 50,
          padding: '0 16px 24px',
        }}>
          <button
            onClick={() => navigate('/cart')}
            style={{
              width: '100%', maxWidth: 600, margin: '0 auto', display: 'flex',
              background: C.red, borderRadius: 16, padding: '12px 16px',
              alignItems: 'center', justifyContent: 'space-between',
              boxShadow: '0 12px 28px rgba(168,22,12,0.4)',
              color: '#fff', border: 'none', cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 10, background: C.yellow,
                color: C.redDeep, fontSize: 14, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{cartCount}</div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 14, fontWeight: 800 }}>عرض السلة</div>
                <div style={{ fontSize: 11, color: '#fde6a8', marginTop: 1 }}>{egp(total)} · {state.serviceType}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, fontWeight: 800 }}>← متابعة الطلب</div>
          </button>
        </div>
      )}
    </div>
  )
}

export default MenuPage
