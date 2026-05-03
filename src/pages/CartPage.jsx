import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart, calculateTotal } from '../context/CartContext'
import { ADDONS } from '../data/menu'
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

const UPSELL = ADDONS.slice(0, 3)
const UPSELL_IMGS = [
  'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=200&q=80',
  'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=200&q=80',
  'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=200&q=80',
]

function EditSheet({ item, onClose, dispatch }) {
  const [qty, setQty]   = useState(item.quantity)
  const [note, setNote] = useState(item.note || '')

  const save = () => {
    if (qty <= 0) {
      dispatch({ type: 'REMOVE_ITEM', payload: item.id })
    } else {
      dispatch({ type: 'UPDATE_ITEM', payload: { id: item.id, quantity: qty, note } })
    }
    onClose()
  }

  const remove = () => {
    dispatch({ type: 'REMOVE_ITEM', payload: item.id })
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 100 }}
      />
      {/* Sheet */}
      <div dir="rtl" style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 101,
        background: C.bg, borderRadius: '22px 22px 0 0',
        padding: '20px 18px 36px', ...ar,
        boxShadow: '0 -8px 32px rgba(0,0,0,0.18)',
      }}>
        <div style={{ width: 40, height: 4, borderRadius: 2, background: C.rule, margin: '0 auto 20px' }} />

        {/* Item header */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 }}>
          {item.image
            ? <img src={item.image} alt={item.name} style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
            : <div style={{ width: 56, height: 56, borderRadius: 10, background: C.rule, flexShrink: 0 }} />
          }
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: C.ink }}>{item.name}</div>
            <div style={{ ...disp, fontSize: 13, color: C.red, fontWeight: 700, marginTop: 2 }}>{egp(item.price)}</div>
          </div>
        </div>

        {/* Qty */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.ink }}>الكمية</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: C.card, borderRadius: 12, padding: 4, border: `1px solid ${C.rule}` }}>
            <button onClick={() => setQty(q => Math.max(1, q - 1))}
              style={{ width: 32, height: 32, borderRadius: 8, background: C.bg, border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 700, color: C.ink }}>−</button>
            <div style={{ fontSize: 15, fontWeight: 800, width: 28, textAlign: 'center', color: C.ink }}>{arNum(qty)}</div>
            <button onClick={() => setQty(q => q + 1)}
              style={{ width: 32, height: 32, borderRadius: 8, background: C.bg, border: 'none', cursor: 'pointer', fontSize: 16, fontWeight: 700, color: C.ink }}>+</button>
          </div>
        </div>

        {/* Note */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.ink, marginBottom: 8 }}>ملاحظات</div>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="مثال: بدون بصل، حار جداً…"
            rows={2}
            style={{
              width: '100%', background: C.card, border: `1px solid ${C.rule}`, borderRadius: 12,
              padding: '10px 12px', fontSize: 13, color: C.ink, fontFamily: 'inherit',
              resize: 'none', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Actions */}
        <button onClick={save} style={{
          width: '100%', background: C.red, color: '#fff', border: 'none',
          borderRadius: 14, padding: '14px 0', fontSize: 15, fontWeight: 800, cursor: 'pointer', marginBottom: 10,
        }}>
          حفظ التغييرات · {egp(item.price * qty)}
        </button>
        <button onClick={remove} style={{
          width: '100%', background: 'transparent', color: C.red, border: `1px solid ${C.red}`,
          borderRadius: 14, padding: '12px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer',
        }}>
          حذف من السلة
        </button>
      </div>
    </>
  )
}

function CartPage() {
  const { state, dispatch } = useCart()
  const navigate = useNavigate()
  const [promoCode, setPromoCode] = useState('')
  const [promoOpen, setPromoOpen] = useState(!!state.appliedOffer)
  const [promoError, setPromoError] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)

  const appliedOffer = state.appliedOffer
  const total = calculateTotal(state.items)
  const itemCount = state.items.reduce((s, i) => s + i.quantity, 0)
  const delivery = state.serviceType === 'توصيل' ? 15 : 0
  const discountAmt = appliedOffer ? Math.round(total * appliedOffer.discount_percent / 100) : 0
  const grandTotal = total - discountAmt + delivery

  const applyPromo = async () => {
    if (!promoCode.trim()) return
    setPromoLoading(true)
    setPromoError('')
    try {
      const r = await fetch(`/api/offers/code/${encodeURIComponent(promoCode.trim())}`)
      if (!r.ok) {
        const d = await r.json().catch(() => ({}))
        setPromoError(d.error || 'الكود غير صحيح')
        dispatch({ type: 'SET_OFFER', payload: null })
      } else {
        const offer = await r.json()
        dispatch({ type: 'SET_OFFER', payload: offer })
        setPromoError('')
      }
    } catch {
      setPromoError('حصل خطأ، حاول تاني')
    }
    setPromoLoading(false)
  }

  const update = (id, delta) => {
    const item = state.items.find(i => i.id === id)
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity: item.quantity + delta } })
  }

  const remove = id => dispatch({ type: 'REMOVE_ITEM', payload: id })

  const setPayment = method => dispatch({ type: 'SET_PAYMENT_METHOD', payload: method })

  const openItem = (cartItemId) => {
    const m = String(cartItemId).match(/^(\d+)/)
    if (m) navigate(`/item/${m[1]}`, { state: { cartItemId } })
  }

  const addUpsell = (addon) => {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        id: `addon-${addon.name}`,
        name: addon.name,
        price: addon.price,
        image: UPSELL_IMGS[0],
        tags: [],
        quantity: 1,
      },
    })
  }

  if (state.items.length === 0) {
    return (
      <div dir="rtl" style={{ ...ar, background: C.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 64 }}>🛒</div>
        <div style={{ ...disp, fontSize: 22, fontWeight: 900, color: C.ink, marginTop: 12 }}>السلة فارغة</div>
        <p style={{ fontSize: 14, color: C.body, marginTop: 8, marginBottom: 24 }}>أضف أصناف من القائمة أولاً</p>
        <button
          onClick={() => navigate('/')}
          style={{ background: C.red, color: '#fff', border: 'none', borderRadius: 14, padding: '14px 28px', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}
        >
          ← القائمة
        </button>
      </div>
    )
  }

  return (
    <div dir="rtl" style={{ background: C.bg, minHeight: '100vh', ...ar }}>
      {/* Header */}
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
          <div onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            <CCLogo size={64} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ ...disp, color: C.yellow, fontWeight: 800, fontSize: 18, letterSpacing: -0.3, fontStyle: 'italic' }}>
              Crepe Corner
            </div>
            <div style={{ color: '#fff', fontSize: 11, opacity: 0.85, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span>📍</span> كفر صقر · شارع المستشفى
            </div>
          </div>
          <button
            onClick={() => navigate('/')}
            style={{
              width: 38, height: 38, borderRadius: 19, background: 'rgba(255,255,255,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', flexShrink: 0,
            }}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/>
            </svg>
          </button>
        </div>

        {/* Service toggle */}
        <div style={{
          marginTop: 14, background: 'rgba(0,0,0,0.25)', borderRadius: 12, padding: 4,
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2,
          position: 'relative',
        }}>
          {[{ key: 'توصيل', sub: '٣٠ د' }, { key: 'استلام', sub: '١٥ د' }, { key: 'داخل المحل', sub: 'QR' }].map(({ key, sub }) => {
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

      {/* Address card */}
      <div style={{ padding: '14px 18px 8px' }}>
        <div style={{
          background: C.card, border: `1px solid ${C.rule}`, borderRadius: 14,
          padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, background: C.yellowSoft,
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 14s-5-4-5-8a5 5 0 0110 0c0 4-5 8-5 8z" stroke={C.red} strokeWidth="1.6" />
              <circle cx="8" cy="6" r="1.8" fill={C.red} />
            </svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 700 }}>التوصيل إلى</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, marginTop: 1 }}>
              {state.customer.address || 'أضف عنوان التوصيل'}
            </div>
          </div>
          <button
            onClick={() => navigate('/checkout')}
            style={{ fontSize: 12, fontWeight: 800, color: C.red, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {state.customer.address ? 'تغيير' : 'إضافة'}
          </button>
        </div>
      </div>

      {/* Items */}
      <div style={{ padding: '8px 18px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {state.items.map(item => (
          <div key={item.id} style={{
            background: C.card, border: `1px solid ${C.rule}`, borderRadius: 14,
            padding: 10, display: 'flex', gap: 12, alignItems: 'center',
          }}>
            <div
              onClick={() => openItem(item.id)}
              style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 0, cursor: String(item.id).match(/^\d+/) ? 'pointer' : 'default' }}
            >
              {item.image ? (
                <img src={item.image} alt={item.name} style={{ width: 60, height: 60, borderRadius: 10, flexShrink: 0, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 60, height: 60, borderRadius: 10, flexShrink: 0, background: C.rule }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, lineHeight: 1.2 }}>{item.name}</div>
                {item.note && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{item.note}</div>}
                <div style={{ ...disp, fontSize: 15, fontWeight: 800, color: C.red, marginTop: 4, fontStyle: 'italic' }}>
                  {egp(item.price * item.quantity)}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, background: C.bg, borderRadius: 10, padding: 3 }}>
              <button
                onClick={() => update(item.id, -1)}
                style={{ width: 28, height: 28, borderRadius: 7, background: C.card, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', color: C.ink }}
              >−</button>
              <div style={{ fontSize: 13, fontWeight: 800, padding: '0 6px', color: C.ink }}>{arNum(item.quantity)}</div>
              <button
                onClick={() => update(item.id, 1)}
                style={{ width: 28, height: 28, borderRadius: 7, background: C.card, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', color: C.ink }}
              >+</button>
            </div>
            <button
              onClick={() => remove(item.id)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.muted, padding: 4 }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
          </div>
        ))}
      </div>

      {/* Upsell strip */}
      <div style={{ padding: '14px 18px 0' }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.body, marginBottom: 10 }}>تضيف معاك؟</div>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
          {UPSELL.map((addon, i) => (
            <button
              key={addon.name}
              onClick={() => addUpsell(addon)}
              style={{
                background: C.card, border: `1px solid ${C.rule}`, borderRadius: 12,
                padding: 8, minWidth: 120, display: 'flex', alignItems: 'center', gap: 8,
                cursor: 'pointer', flexShrink: 0,
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                backgroundImage: `url(${UPSELL_IMGS[i]})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
              }} />
              <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                <div style={{ ...ar, fontSize: 11, fontWeight: 700, color: C.ink, lineHeight: 1.2 }}>{addon.name}</div>
                <div style={{ ...disp, fontSize: 12, color: C.red, fontWeight: 800, marginTop: 2 }}>+ {addon.price} ج.م</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Promo code */}
      <div style={{ padding: '14px 18px 0' }}>
        {!promoOpen ? (
          <button
            onClick={() => setPromoOpen(true)}
            style={{
              width: '100%', background: C.yellowSoft, border: `1px dashed ${C.yellow}`, borderRadius: 12,
              padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: 16 }}>🎟</span>
            <span style={{ ...ar, flex: 1, fontSize: 13, color: C.redDeep, fontWeight: 700, textAlign: 'right' }}>أضف كود الخصم</span>
          </button>
        ) : (
          <div>
            <div style={{
              background: appliedOffer ? '#f0fdf4' : C.yellowSoft,
              border: `1px solid ${appliedOffer ? '#86efac' : C.yellow}`, borderRadius: 12,
              padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <span style={{ fontSize: 16 }}>🎟</span>
              <input
                value={promoCode}
                onChange={e => { setPromoCode(e.target.value); dispatch({ type: 'SET_OFFER', payload: null }); setPromoError('') }}
                onKeyDown={e => e.key === 'Enter' && applyPromo()}
                placeholder="أدخل الكود"
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: C.ink, fontFamily: 'inherit', textAlign: 'right' }}
              />
              <button
                onClick={applyPromo}
                disabled={promoLoading}
                style={{ fontSize: 13, fontWeight: 800, color: appliedOffer ? '#15803d' : C.red, background: 'none', border: 'none', cursor: 'pointer', opacity: promoLoading ? 0.5 : 1 }}
              >
                {promoLoading ? '…' : appliedOffer ? '✓ مُطبَّق' : 'تطبيق'}
              </button>
            </div>
            {promoError && (
              <div style={{ fontSize: 12, color: C.red, fontWeight: 700, marginTop: 5, paddingRight: 4 }}>{promoError}</div>
            )}
            {appliedOffer && (
              <div style={{ fontSize: 12, color: '#15803d', fontWeight: 700, marginTop: 5, paddingRight: 4 }}>
                🎉 {appliedOffer.title} · خصم {appliedOffer.discount_percent}%
              </div>
            )}
          </div>
        )}
      </div>

      {/* Payment method */}
      <div style={{ padding: '14px 18px 0' }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: C.body, marginBottom: 8 }}>طريقة الدفع</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
          {[['💵', 'كاش'], ['📱', 'فودافون'], ['🏦', 'إنستاباي']].map(([icon, method]) => {
            const sel = state.paymentMethod === method
            return (
              <button
                key={method}
                onClick={() => setPayment(method)}
                style={{
                  background: sel ? C.ink : C.card,
                  color: sel ? '#fff' : C.ink,
                  border: sel ? 'none' : `1px solid ${C.rule}`,
                  borderRadius: 11, padding: '10px 4px', textAlign: 'center', cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: 16 }}>{icon}</div>
                <div style={{ fontSize: 12, fontWeight: 700, marginTop: 3 }}>{method}</div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Summary */}
      <div style={{ padding: '14px 18px 140px' }}>
        <div style={{ background: C.card, border: `1px solid ${C.rule}`, borderRadius: 14, padding: '14px 16px' }}>
          {[
            ['المجموع الفرعي', egp(total)],
            ...(delivery > 0 ? [['التوصيل', egp(delivery)]] : []),
            ...(discountAmt > 0 ? [['خصم', `- ${egp(discountAmt)}`]] : []),
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
              <span style={{ color: k === 'خصم' ? '#15803d' : C.body, fontWeight: 600 }}>{k}</span>
              <span style={{ ...disp, color: k === 'خصم' ? '#15803d' : C.ink, fontWeight: 700 }}>{v}</span>
            </div>
          ))}
          <div style={{ height: 1, background: C.rule, margin: '10px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 15, fontWeight: 900, color: C.ink }}>الإجمالي</span>
            <span style={{ ...disp, fontSize: 26, fontWeight: 900, color: C.red, letterSpacing: -0.5, fontStyle: 'italic' }}>
              {egp(grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom action */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 50, padding: '0 14px 24px' }}>
        <button
          onClick={() => navigate('/checkout')}
          style={{
            width: '100%', maxWidth: 600, margin: '0 auto', display: 'flex',
            background: C.red, color: '#fff', borderRadius: 16, padding: '14px 18px',
            alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 12px 28px rgba(168,22,12,0.4)',
            border: 'none', cursor: 'pointer',
          }}
        >
          <div>
            <div style={{ fontSize: 11, color: '#fde6a8', fontWeight: 700 }}>الإجمالي · {arNum(itemCount)} صنف</div>
            <div style={{ ...disp, fontSize: 18, fontWeight: 900, fontStyle: 'italic', marginTop: 1 }}>
              {egp(grandTotal)}
            </div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 900 }}>تأكيد الطلب ←</div>
        </button>
      </div>
    </div>
  )
}

export default CartPage
