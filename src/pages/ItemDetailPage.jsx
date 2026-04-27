import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import menuData, { ADDONS } from '../data/menu'

const C = {
  red:        '#a8160c',
  redDeep:    '#7a0d05',
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

const ar   = { fontFamily: '"Cairo", "Noto Naskh Arabic", system-ui, sans-serif' }
const disp = { fontFamily: '"Rubik", "Cairo", system-ui, sans-serif' }
const egp  = (n) => `${n} ج.م`

function Tag({ tag }) {
  if (tag === 'hot')       return <span style={{ ...ar, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: '#fde2dc', color: C.hot }}>🌶 حار</span>
  if (tag === 'popular')   return <span style={{ ...ar, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: C.yellowSoft, color: C.redDeep }}>⭐ الأكثر طلباً</span>
  if (tag === 'signature') return <span style={{ ...ar, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: C.ink, color: C.yellow }}>✦ سيجنتشر</span>
  if (tag === 'family')    return <span style={{ ...ar, fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: '#e6f4ec', color: C.green }}>👨‍👩‍👧 عيلة</span>
  return null
}

function ItemDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { dispatch } = useCart()

  const item = menuData.find(m => m.id === Number(id))

  const hasSizes = item?.sizes?.length > 0
  const [selectedSize, setSelectedSize] = useState(() => item?.sizes?.[0]?.key ?? null)
  const [selectedAddons, setSelectedAddons] = useState([])
  const [qty, setQty] = useState(1)
  const [note, setNote] = useState('')

  if (!item) {
    return (
      <div dir="rtl" style={{ ...ar, textAlign: 'center', padding: 40, color: C.body }}>
        الصنف غير موجود
      </div>
    )
  }

  const basePrice   = hasSizes
    ? (item.sizes.find(s => s.key === selectedSize)?.price ?? item.price)
    : item.price
  const addonsTotal = selectedAddons.reduce((sum, name) => {
    const a = ADDONS.find(a => a.name === name)
    return sum + (a?.price ?? 0)
  }, 0)
  const unitPrice = basePrice + addonsTotal
  const total     = unitPrice * qty

  const toggleAddon = (name) =>
    setSelectedAddons(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    )

  const handleAddToCart = () => {
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        ...item,
        id: hasSizes ? `${item.id}-${selectedSize}` : item.id,
        name: hasSizes && selectedSize ? `${item.name} (${selectedSize})` : item.name,
        price: unitPrice,
        quantity: qty,
        note,
      },
    })
    navigate(-1)
  }

  return (
    <div dir="rtl" style={{ background: C.bg, minHeight: '100vh', ...ar }}>

      {/* Hero image */}
      <div style={{
        height: 300, position: 'relative',
        backgroundImage: `linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.45) 100%), url(${item.image})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        backgroundColor: C.rule,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute', top: 52, right: 16,
            width: 40, height: 40, borderRadius: 20,
            background: 'rgba(255,255,255,0.92)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L6 8l4 5" stroke={C.ink} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {item.tags.length > 0 && (
          <div style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', gap: 6 }}>
            {item.tags.map(t => <Tag key={t} tag={t} />)}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{
        marginTop: -20, background: C.bg,
        borderRadius: '22px 22px 0 0',
        padding: '22px 18px 160px',
      }}>

        {/* Name + price */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ ...ar, fontSize: 24, fontWeight: 900, color: C.ink, lineHeight: 1.2 }}>
              {item.name}
            </div>
            {item.desc && (
              <div style={{ ...ar, fontSize: 13, color: C.body, marginTop: 6, lineHeight: 1.7 }}>
                {item.desc}
              </div>
            )}
          </div>
          <div style={{
            ...disp, background: C.red, color: '#fff',
            padding: '8px 14px', borderRadius: 12,
            fontSize: 20, fontWeight: 900, fontStyle: 'italic',
            display: 'flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1,
            flexShrink: 0,
          }}>
            <div>{basePrice}</div>
            <div style={{ fontSize: 10, marginTop: 2, color: C.yellow }}>ج.م</div>
          </div>
        </div>

        {/* Size selector — only for pizza */}
        {hasSizes && (
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.ink }}>المقاس</div>
              <div style={{ fontSize: 11, color: C.muted }}>مطلوب</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: `repeat(${item.sizes.length}, 1fr)`, gap: 8 }}>
              {item.sizes.map(({ key, price }) => {
                const sel = selectedSize === key
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedSize(key)}
                    style={{
                      padding: '12px 8px', borderRadius: 12, textAlign: 'center',
                      background: sel ? C.ink : C.card,
                      color: sel ? '#fff' : C.ink,
                      border: sel ? 'none' : `1.5px solid ${C.rule}`,
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 800 }}>{key}</div>
                    <div style={{ fontSize: 12, marginTop: 3, color: sel ? C.yellow : C.muted, fontWeight: 700 }}>
                      {egp(price)}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Add-ons */}
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.ink }}>الإضافات</div>
            <div style={{ fontSize: 11, color: C.muted }}>اختياري</div>
          </div>
          {ADDONS.map(a => {
            const checked = selectedAddons.includes(a.name)
            return (
              <button
                key={a.name}
                onClick={() => toggleAddon(a.name)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 12,
                  background: C.card, border: `1px solid ${checked ? C.red : C.rule}`,
                  borderRadius: 12, padding: '12px 14px', marginBottom: 8,
                  cursor: 'pointer', textAlign: 'right',
                }}
              >
                <div style={{
                  width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                  border: `1.5px solid ${checked ? C.red : C.rule}`,
                  background: checked ? C.red : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {checked && (
                    <svg width="12" height="12" viewBox="0 0 12 12">
                      <path d="M2 6l3 3 5-6" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <div style={{ flex: 1, fontSize: 14, fontWeight: 700, color: C.ink }}>{a.name}</div>
                <div style={{ ...disp, fontSize: 13, fontWeight: 800, color: C.red }}>+ {a.price} ج.م</div>
              </button>
            )
          })}
        </div>

        {/* Notes */}
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.ink, marginBottom: 8 }}>ملاحظات للمطبخ</div>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="مثال: بدون مايونيز · حار زيادة …"
            rows={3}
            style={{
              width: '100%', background: C.card, border: `1px solid ${C.rule}`,
              borderRadius: 12, padding: '12px 14px',
              fontSize: 13, color: C.ink, fontFamily: 'inherit',
              resize: 'none', outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div style={{
        position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 50,
        padding: '10px 16px 28px',
        background: `linear-gradient(180deg, transparent 0%, ${C.bg} 30%)`,
      }}>
        <div style={{
          background: C.card, border: `1px solid ${C.rule}`,
          borderRadius: 16, padding: 6,
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 12px 28px rgba(0,0,0,0.08)',
          maxWidth: 600, margin: '0 auto',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4, padding: 4,
            background: C.bg, borderRadius: 11,
          }}>
            <button
              onClick={() => setQty(q => Math.max(1, q - 1))}
              style={{
                width: 32, height: 32, borderRadius: 8, background: C.card,
                border: 'none', cursor: 'pointer', fontSize: 18, fontWeight: 700, color: C.ink,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >−</button>
            <div style={{ fontSize: 15, fontWeight: 800, width: 24, textAlign: 'center', color: C.ink }}>{qty}</div>
            <button
              onClick={() => setQty(q => q + 1)}
              style={{
                width: 32, height: 32, borderRadius: 8, background: C.card,
                border: 'none', cursor: 'pointer', fontSize: 18, fontWeight: 700, color: C.ink,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >+</button>
          </div>

          <button
            onClick={handleAddToCart}
            style={{
              flex: 1, background: C.red, color: '#fff',
              padding: '13px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              ...ar, fontSize: 14, fontWeight: 800,
            }}
          >
            <span>أضف للسلة</span>
            <span style={{ ...disp, fontSize: 16, fontWeight: 900, fontStyle: 'italic' }}>{egp(total)}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default ItemDetailPage
