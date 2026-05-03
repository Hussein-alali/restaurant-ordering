import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart, calculateTotal } from '../context/CartContext'
import menuData, { CATS, ADDONS, ADDON_CATS } from '../data/menu'
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
  green:      '#1f7a3f',
  hot:        '#e63a1c',
}

const ar = { fontFamily: '"Cairo", "Noto Naskh Arabic", system-ui, sans-serif' }
const disp = { fontFamily: '"Rubik", "Cairo", system-ui, sans-serif' }
const arNum = (n) => n.toLocaleString('ar-EG')
const egp = (n) => `${arNum(n)} ج.م`

function CCLogo({ size = 48 }) {
  return (
    <img
      src={logoSrc}
      alt="Crepe Corner"
      style={{ width: size, height: size, borderRadius: size / 2, objectFit: 'cover', flexShrink: 0 }}
    />
  )
}

function WhatsAppButton({ phone }) {
  return (
    <a
      href={`https://wa.me/${phone}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        width: 38, height: 38, borderRadius: 19, background: '#25D366',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        textDecoration: 'none',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="#fff">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </a>
  )
}

function Tag({ tag }) {
  if (tag === 'hot')       return <span style={{ ...ar, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: '#fde2dc', color: C.hot }}>🌶 حار</span>
  if (tag === 'popular')   return <span style={{ ...ar, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: C.yellowSoft, color: C.redDeep }}>⭐ الأكثر طلباً</span>
  if (tag === 'signature') return <span style={{ ...ar, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: C.ink, color: C.yellow }}>✦ سيجنتشر</span>
  if (tag === 'family')    return <span style={{ ...ar, fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 999, background: '#e6f4ec', color: C.green }}>👨‍👩‍👧 عيلة</span>
  return null
}

function MenuRow({ item, onAdd, onOpen }) {
  return (
    <div
      onClick={onOpen}
      style={{
        background: C.card, borderRadius: 14, padding: 10,
        border: `1px solid ${C.rule}`,
        display: 'flex', gap: 12, alignItems: 'center',
        cursor: 'pointer',
      }}
    >
      <div style={{
        width: 76, height: 76, flexShrink: 0, borderRadius: 11,
        ...(item.image
          ? { backgroundImage: `url(${item.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { background: C.rule }),
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4, flexWrap: 'wrap' }}>
          {item.tags.map(t => <Tag key={t} tag={t} />)}
        </div>
        <div style={{ ...ar, fontSize: 15, fontWeight: 800, color: C.ink, lineHeight: 1.25 }}>
          {item.name}
        </div>
        {item.description && (
          <div style={{ fontSize: 12, color: C.body, marginTop: 3, lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
            {item.description}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
          <div style={{ ...disp, fontSize: 17, fontWeight: 800, color: C.red, fontStyle: 'italic' }}>
            {egp(item.price)}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onAdd(item) }}
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

const STEPS = [
  { key: 'pending',    label: 'استُلم الطلب',  desc: 'المطبخ شايف طلبك',       icon: '📋' },
  { key: 'preparing',  label: 'جاري التحضير',  desc: 'بيتجهز دلوقتي',          icon: '👨‍🍳' },
  { key: 'on_the_way', label: 'في الطريق',      desc: 'المندوب اتحرك ناحيتك',   icon: '🛵' },
  { key: 'delivered',  label: 'وصل الطلب',     desc: 'بالهنا والشفا 🎉',        icon: '✅' },
]
const STEP_IDX = { pending: 0, preparing: 1, on_the_way: 2, delivered: 3 }

function LastOrderBanner({ orderId, orderNumber, navigate, onDismiss }) {
  const [status, setStatus] = useState('pending')
  const [gone, setGone] = useState(false)

  useEffect(() => {
    let alive = true
    const poll = async () => {
      try {
        const r = await fetch(`/api/orders/${orderId}`)
        if (!r.ok || !alive) return
        const d = await r.json()
        if (d.status === 'cancelled') { setGone(true); clearInterval(id); onDismiss?.(); return }
        setStatus(d.status)
        if (d.status === 'delivered') { clearInterval(id) }
      } catch {}
    }
    poll()
    const id = setInterval(poll, 10000)
    return () => { alive = false; clearInterval(id) }
  }, [orderId])

  if (gone) return null

  const cur = STEP_IDX[status] ?? 0

  return (
    <div style={{ margin: '14px 16px 0', background: '#fff', border: '1px solid #ead8bf', borderRadius: 16, padding: '14px 16px', cursor: 'pointer' }} onClick={() => navigate('/confirmation')}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 11, color: C.red, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: 4, background: C.red, display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
            مباشر
          </div>
          {status === 'delivered' && (
            <button
              onClick={e => { e.stopPropagation(); onDismiss?.() }}
              style={{ fontSize: 10, color: C.muted, background: 'none', border: '1px solid #ead8bf', borderRadius: 6, padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit' }}
            >إخفاء</button>
          )}
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>تتبع الطلب · #{orderNumber}</div>
      </div>

      {STEPS.map((step, i) => {
        const done   = i < cur
        const active = i === cur
        const future = i > cur
        return (
          <div key={step.key} style={{ display: 'grid', gridTemplateColumns: '1fr 32px', gap: 10, paddingBottom: i < STEPS.length - 1 ? 16 : 0 }}>
            <div style={{ paddingTop: 4, textAlign: 'right' }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: future ? C.muted : C.ink }}>{step.label}</div>
              <div style={{ fontSize: 11, color: future ? C.rule : C.muted, marginTop: 1 }}>{step.desc}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 28, height: 28, borderRadius: 14, flexShrink: 0,
                background: done ? '#1f7a3f' : active ? C.red : 'transparent',
                border: `2px solid ${done ? '#1f7a3f' : active ? C.red : C.rule}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, color: '#fff', fontWeight: 900,
                boxShadow: active ? `0 0 0 5px ${C.red}22` : 'none',
                transition: 'all .4s',
              }}>
                {done ? '✓' : active ? step.icon : ''}
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, width: 2, minHeight: 14, marginTop: 3, background: done ? '#1f7a3f' : C.rule, transition: 'background .4s' }} />
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function MenuPage() {
  const { state, dispatch } = useCart()
  const [activeCat, setActiveCat] = useState(CATS[0].id)
  const [unavailable, setUnavailable] = useState(new Set())
  const [descMap, setDescMap] = useState({})
  const [siteName, setSiteName]           = useState('Crepe Corner')
  const [offers, setOffers]               = useState([])
  const [disabledSections, setDisabledSections] = useState(new Set())
  const navigate = useNavigate()
  const branch = state.selectedBranch

  useEffect(() => {
    fetch('/api/settings').then(r => r.ok ? r.json() : {}).then(s => {
      if (s.restaurant_name) setSiteName(s.restaurant_name)
    }).catch(() => {})
    fetch('/api/offers/active').then(r => r.ok ? r.json() : []).then(setOffers).catch(() => {})
  }, [])

  useEffect(() => {
    if (!branch) { navigate('/branch', { replace: true }); return }

    Promise.all([
      fetch('/api/products').then(r => r.ok ? r.json() : []),
      fetch(`/api/products/branch/${branch.id}`).then(r => r.ok ? r.json() : []),
      fetch('/api/sections').then(r => r.ok ? r.json() : []),
    ]).then(([allProducts, branchProducts, sections]) => {
      const disabled = new Set(
        sections
          .filter(s => (s.branch_availability?.[branch.id]) === false)
          .map(s => s.name)
      )
      setDisabledSections(disabled)
      setActiveCat(prev => {
        const prevCat = CATS.find(c => c.id === prev)
        if (prevCat && disabled.has(prevCat.ar)) {
          return CATS.find(c => !disabled.has(c.ar))?.id ?? prev
        }
        return prev
      })
      const globallyUnavailable = new Set(allProducts.filter(p => !p.available).map(p => p.name))
      const branchAvailableNames = new Set(branchProducts.map(p => p.name))
      const allDbNames = new Set(allProducts.map(p => p.name))
      // Mark as unavailable: globally off, OR exists in DB but not in branch's products
      const hidden = new Set([
        ...globallyUnavailable,
        ...[...allDbNames].filter(n => !branchAvailableNames.has(n) && !globallyUnavailable.has(n)),
      ])
      setUnavailable(hidden)
      const dm = {}
      allProducts.forEach(p => { if (p.description) dm[p.name] = p.description })
      setDescMap(dm)
    }).catch(() => {})
  }, [branch?.id])

  const cartCount = state.items.reduce((s, i) => s + i.quantity, 0)
  const total = calculateTotal(state.items)
  const isAdditions = activeCat === 'additions'
  const items = isAdditions ? [] : menuData.filter(m => m.cat === activeCat && !unavailable.has(m.name)).map(m => ({ ...m, description: descMap[m.name] || null }))
  const cat = CATS.find(c => c.id === activeCat)

  const serviceOptions = [
    { key: 'توصيل',        sub: '٣٠ د' },
    { key: 'استلام',       sub: '١٥ د' },
    { key: 'داخل المحل',   sub: 'QR'   },
  ]

  const addToCart = item => dispatch({ type: 'ADD_ITEM', payload: item })

  return (
    <div dir="rtl" style={{ background: C.bg, minHeight: '100vh', ...ar }}>
      <style>{`
        @keyframes offerSlide {
          0%   { transform: translateX(0) }
          100% { transform: translateX(-50%) }
        }
      `}</style>
      {/* Red header */}
      <div style={{
        background: `linear-gradient(180deg, ${C.redDark} 0%, ${C.red} 100%)`,
        padding: '54px 18px 18px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <img src={bgLogoSrc} alt="" style={{
            position: 'absolute', left: -20, top: '50%', transform: 'translateY(-50%)',
            width: 240, height: 240, objectFit: 'contain', opacity: 0.12,
          }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          <CCLogo size={64} />
          <div style={{ flex: 1 }}>
            <div style={{ ...disp, color: C.yellow, fontWeight: 800, fontSize: 18, letterSpacing: -0.3, fontStyle: 'italic' }}>
              {siteName}
            </div>
            {branch ? (
              <div style={{ color: '#fff', fontSize: 11, opacity: 0.85, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>🏪</span>
                <span>{branch.name}</span>
                {branch.address && <span>· {branch.address}</span>}
              </div>
            ) : (
              <div style={{ color: '#fff', fontSize: 11, opacity: 0.85, marginTop: 2 }}>{siteName}</div>
            )}
            {offers.length > 0 && (
              <div style={{ marginTop: 6, overflow: 'hidden', borderRadius: 8 }}>
                {offers.length === 1 ? (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    background: 'rgba(244,181,40,0.22)', borderRadius: 7,
                    padding: '4px 9px',
                  }}>
                    <span style={{ fontSize: 12 }}>🎁</span>
                    <span style={{ color: C.yellow, fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap' }}>
                      {offers[0].title}
                      {offers[0].discount_percent > 0 && (
                        <span style={{ marginRight: 5, background: C.yellow, color: C.redDark, borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>
                          {offers[0].discount_percent}%
                        </span>
                      )}
                    </span>
                  </div>
                ) : (
                  <div style={{ overflow: 'hidden', width: '100%' }}>
                    <div style={{
                      display: 'flex', gap: 6, width: 'max-content',
                      animation: `offerSlide ${offers.length * 5}s linear infinite`,
                    }}>
                      {[...offers, ...offers].map((o, idx) => (
                        <div key={idx} style={{
                          flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 5,
                          background: 'rgba(244,181,40,0.22)', borderRadius: 7,
                          padding: '4px 9px',
                        }}>
                          <span style={{ fontSize: 11 }}>🎁</span>
                          <span style={{ color: C.yellow, fontSize: 11, fontWeight: 800, whiteSpace: 'nowrap' }}>
                            {o.title}
                            {o.discount_percent > 0 && (
                              <span style={{ marginRight: 5, background: C.yellow, color: C.redDark, borderRadius: 4, padding: '1px 5px', fontSize: 10 }}>
                                {o.discount_percent}%
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {branch?.phone && <WhatsAppButton phone={branch.phone.replace(/^0/, '20')} />}
          <button
            onClick={() => navigate('/branch')}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, padding: '6px 10px', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
          >تغيير الفرع</button>
          <button
            onClick={() => navigate('/my-orders')}
            style={{ background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 10, padding: '6px 10px', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' }}
          >طلباتي</button>
        </div>

        {/* Service toggle */}
        <div style={{
          marginTop: 14, background: 'rgba(0,0,0,0.25)', borderRadius: 12, padding: 4,
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2,
          position: 'relative',
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
        <div
          onClick={() => navigate('/item/20')}
          style={{
            background: C.ink, borderRadius: 14, padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: 12, position: 'relative', overflow: 'hidden',
            cursor: 'pointer',
          }}
        >
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
      <div style={{ padding: '14px 0 6px', position: 'sticky', top: 0, zIndex: 5, background: C.bg }}>
        <div style={{ display: 'flex', gap: 8, padding: '0 18px', overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
          {CATS.filter(c => !disabledSections.has(c.ar)).map(c => (
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

      {/* Last order status banner */}
      {state.lastOrder?.id && (
        <LastOrderBanner
          orderId={state.lastOrder.id}
          orderNumber={state.lastOrder.orderNumber}
          navigate={navigate}
          onDismiss={() => dispatch({ type: 'SET_LAST_ORDER', payload: null })}
        />
      )}

      {/* Section header */}
      <div style={{ padding: '14px 18px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          display: 'inline-block', background: C.red, color: '#fff',
          padding: '10px 22px 10px 28px',
          ...ar, fontWeight: 800, fontSize: 18,
          clipPath: 'polygon(8px 0, 100% 0, calc(100% - 8px) 100%, 0 100%)',
        }}>
          {cat?.ar}
        </div>
        <div style={{ fontSize: 11, color: C.body, fontWeight: 600 }}>
          {isAdditions ? `${ADDONS.length} صنف` : `${items.length} صنف`}
        </div>
      </div>

      {/* Items */}
      {isAdditions ? (
        <div style={{ padding: '0 18px', paddingBottom: cartCount > 0 ? 120 : 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {ADDON_CATS.map(ac => {
            const group = ADDONS.filter(a => a.cat === ac.id && !unavailable.has(a.name))
            if (!group.length) return null
            return (
              <div key={ac.id}>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.muted, marginBottom: 8 }}>{ac.ar}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {group.map(a => (
                    <MenuRow
                      key={a.id}
                      item={{ ...a, tags: [] }}
                      onAdd={() => addToCart({ id: a.id, name: a.name, price: a.price, image: a.image, tags: [], quantity: 1 })}
                      onOpen={() => addToCart({ id: a.id, name: a.name, price: a.price, image: a.image, tags: [], quantity: 1 })}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div style={{ padding: '0 18px', paddingBottom: cartCount > 0 ? 120 : 32, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.map(item => (
            <MenuRow key={item.id} item={item} onAdd={addToCart} onOpen={() => navigate(`/item/${item.id}`)} />
          ))}
        </div>
      )}

      {/* Floating cart bar */}
      {cartCount > 0 && (
        <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 50, padding: '0 16px 24px' }}>
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
              }}>{arNum(cartCount)}</div>
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
