import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart, calculateTotal, formatPayload, validateForm } from '../context/CartContext'


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
}

const ar = { fontFamily: '"Cairo", "Noto Naskh Arabic", system-ui, sans-serif' }
const disp = { fontFamily: '"Rubik", "Cairo", system-ui, sans-serif' }
const arNum = (n) => n.toLocaleString('ar-EG')
const egp = (n) => `${arNum(n)} ج.م`

function Field({ label, value, onChange, type = 'text', placeholder, error, optional }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 6 }}>
        {label}{optional && <span style={{ fontSize: 10, opacity: 0.7, marginRight: 4 }}>— اختياري</span>}
      </div>
      <div style={{
        borderRadius: 12, border: `1.5px solid ${error ? C.red : C.rule}`,
        background: C.card, padding: '12px 14px',
      }}>
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          dir="auto"
          style={{
            width: '100%', fontSize: 15, color: C.ink, background: 'transparent',
            border: 'none', outline: 'none', fontFamily: 'inherit',
          }}
        />
      </div>
      {error && <p style={{ fontSize: 11, color: C.red, fontWeight: 700, marginTop: 4 }}>{error}</p>}
    </div>
  )
}

function CheckoutPage() {
  const { state, dispatch } = useCart()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')

  const total = calculateTotal(state.items)
  const delivery = 15
  const serviceType = state.serviceType
  const isDelivery = serviceType === 'توصيل'
  const appliedOffer = state.appliedOffer
  const discountAmt = appliedOffer ? Math.round(total * appliedOffer.discount_percent / 100) : 0
  const grandTotal = total - discountAmt + (isDelivery ? delivery : 0)

  const updateCustomer = (field, value) => {
    dispatch({ type: 'SET_CUSTOMER', payload: { [field]: value } })
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: null }))
  }

  const handleStep1Continue = () => {
    const errs = validateForm({
      name: state.customer.name,
      phone: state.customer.phone,
      address: state.customer.address,
    }, serviceType)
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setStep(2)
  }

  const handlePlaceOrder = async () => {
    setStatus('loading')
    const payload = formatPayload(state)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const { id, orderNumber } = await res.json()
      dispatch({ type: 'SET_LAST_ORDER', payload: { ...payload, id, orderNumber } })
      dispatch({ type: 'CLEAR_CART' })
      navigate('/confirmation')
    } catch {
      setStatus('error')
    }
  }

  if (state.items.length === 0) {
    return (
      <div dir="rtl" style={{ ...ar, background: C.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ ...disp, fontSize: 22, fontWeight: 900, color: C.ink, marginBottom: 8 }}>مفيش طلبات</div>
        <p style={{ fontSize: 14, color: C.body, marginBottom: 24 }}>أضف أصناف من القائمة أولاً</p>
        <button onClick={() => navigate('/')} style={{ background: C.red, color: '#fff', border: 'none', borderRadius: 14, padding: '14px 28px', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
          ← القائمة
        </button>
      </div>
    )
  }

  return (
    <div dir="rtl" style={{ background: C.bg, minHeight: '100vh', ...ar }}>
      {/* Header */}
      <div style={{
        padding: '54px 18px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: C.red, color: '#fff',
      }}>
        <button
          onClick={() => step === 1 ? navigate('/cart') : setStep(1)}
          style={{
            width: 38, height: 38, borderRadius: 19, background: 'rgba(255,255,255,0.18)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M5 2l5 5-5 5" stroke="#fff" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <div style={{ fontSize: 17, fontWeight: 900 }}>{step === 1 ? 'بيانات التوصيل' : 'مراجعة الطلب'}</div>
        <div style={{ fontSize: 12, color: C.yellowSoft, fontWeight: 700 }}>خطوة {arNum(step)} / ٢</div>
      </div>

      {/* Step dots */}
      <div style={{ padding: '16px 18px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
        {[1, 2].map((n, i) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: n < step ? C.red : n === step ? C.ink : 'transparent',
              border: `1.5px solid ${n <= step ? (n < step ? C.red : C.ink) : C.rule}`,
              color: n <= step ? '#fff' : C.muted, fontSize: 12, fontWeight: 700,
            }}>
              {n < step ? '✓' : n}
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: n === step ? C.ink : C.muted }}>
              {n === 1 ? 'البيانات' : 'التأكيد'}
            </span>
            {i === 0 && <div style={{ width: 32, height: 1, background: step > 1 ? C.red : C.rule, marginLeft: 4 }} />}
          </div>
        ))}
      </div>

      <div style={{ padding: '20px 18px', paddingBottom: 120 }}>
        {/* Step 1 */}
        {step === 1 && (
          <>
            <div style={{ ...disp, fontSize: 22, fontWeight: 900, color: C.ink, marginBottom: 20 }}>
              {isDelivery ? 'بتوصّل فين؟' : 'بياناتك'}
            </div>

            {!isDelivery && (
              <div style={{
                background: C.yellowSoft, border: `1px solid ${C.yellow}`, borderRadius: 12,
                padding: '12px 14px', marginBottom: 20,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.redDeep }}>
                  {serviceType === 'استلام' ? '📦 هتاخد الطلب بنفسك — جاهز في ١٥ دقيقة' : '🍽 داخل المحل — هيتجهز على الفور'}
                </div>
              </div>
            )}

            <Field label="الاسم" value={state.customer.name} onChange={v => updateCustomer('name', v)} placeholder="اسمك كامل" error={errors.name} />
            <Field label="رقم الموبايل" value={state.customer.phone} onChange={v => updateCustomer('phone', v)} type="tel" placeholder="01xxxxxxxxx" error={errors.phone} />
            {isDelivery && (
              <>
                <Field label="العنوان" value={state.customer.address} onChange={v => updateCustomer('address', v)} placeholder="الشارع والمنطقة" error={errors.address} />
                <Field label="الدور / الشقة" value={state.customer.building} onChange={v => updateCustomer('building', v)} placeholder="مثال: الدور الثالث، شقة ٢" optional />
              </>
            )}
            <Field
              label="ملاحظة على الطلب"
              value={state.customer.orderNote || ''}
              onChange={v => updateCustomer('orderNote', v)}
              placeholder="مثال: بدون طماطم، زيادة صوص، إلخ…"
              optional
            />
            <Field
              label={isDelivery ? 'ملاحظة للتوصيل' : 'طلبات خاصة'}
              value={state.customer.deliveryNotes}
              onChange={v => updateCustomer('deliveryNotes', v)}
              placeholder="مثال: اطرق الباب الجانبي…"
              optional
            />
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <>
            <div style={{ ...disp, fontSize: 22, fontWeight: 900, color: C.ink, marginBottom: 20 }}>مراجعة وتأكيد</div>

            <div style={{ background: C.card, border: `1px solid ${C.rule}`, borderRadius: 14, padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 8 }}>بياناتك</div>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.ink }}>{state.customer.name}</div>
              <div style={{ fontSize: 13, color: C.body, marginTop: 2 }}>{state.customer.phone}</div>
              {isDelivery && <div style={{ fontSize: 13, color: C.body, marginTop: 2 }}>{[state.customer.address, state.customer.building].filter(Boolean).join(' · ')}</div>}
              {state.customer.orderNote && <div style={{ fontSize: 12, color: C.ink, fontWeight: 700, marginTop: 4 }}>🗒 {state.customer.orderNote}</div>}
              {state.customer.deliveryNotes && <div style={{ fontSize: 12, color: C.muted, fontStyle: 'italic', marginTop: 2 }}>{state.customer.deliveryNotes}</div>}
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.rule}`, borderRadius: 14, padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 10 }}>طلبك</div>
              {state.items.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', fontSize: 13 }}>
                  <span style={{ color: C.body }}>
                    {item.name} <span style={{ color: C.muted }}>×{arNum(item.quantity)}</span>
                  </span>
                  <span style={{ ...disp, color: C.ink, fontWeight: 700 }}>{egp(item.price * item.quantity)}</span>
                </div>
              ))}
              <div style={{ height: 1, background: C.rule, margin: '10px 0' }} />
              {[
                ...(isDelivery ? [['التوصيل', egp(delivery)]] : []),
                ...(discountAmt > 0 ? [['خصم', `- ${egp(discountAmt)}`]] : []),
                ['الإجمالي', egp(grandTotal)],
              ].map(([k, v], i, arr) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                  <span style={{ fontSize: i === arr.length-1 ? 15 : 13, fontWeight: i === arr.length-1 ? 900 : 600, color: k === 'خصم' ? '#15803d' : C.ink }}>{k}</span>
                  <span style={{ ...disp, fontSize: i === arr.length-1 ? 20 : 13, fontWeight: i === arr.length-1 ? 900 : 700, color: i === arr.length-1 ? C.red : k === 'خصم' ? '#15803d' : C.ink, fontStyle: 'italic' }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ background: C.card, border: `1.5px solid ${C.ink}`, borderRadius: 14, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.ink }}>
                {state.paymentMethod === 'فودافون' ? '📱' : state.paymentMethod === 'إنستاباي' ? '🏦' : '💵'} {state.paymentMethod || 'كاش'}
              </div>
              <div style={{ width: 18, height: 18, borderRadius: 9, background: C.ink }} />
            </div>

            {status === 'error' && (
              <div style={{ background: '#fde2dc', border: `1px solid ${C.red}`, borderRadius: 12, padding: '12px 14px', marginBottom: 14 }}>
                <p style={{ fontSize: 12, color: C.red, fontWeight: 700 }}>حصل مشكلة. تحقق من النت وحاول تاني.</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Bottom CTA */}
      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 50, padding: '0 14px 24px', display: 'flex', gap: 10 }}>
        {step === 2 && (
          <button
            onClick={() => setStep(1)}
            style={{ borderRadius: 14, border: `1.5px solid ${C.ink}`, padding: '14px 18px', fontSize: 14, fontWeight: 800, color: C.ink, background: C.card, cursor: 'pointer' }}
          >
            تعديل
          </button>
        )}
        <button
          onClick={step === 1 ? handleStep1Continue : handlePlaceOrder}
          disabled={status === 'loading'}
          style={{
            flex: 1, background: C.red, color: '#fff', border: 'none', borderRadius: 14,
            padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 12px 28px rgba(168,22,12,0.4)', cursor: 'pointer', opacity: status === 'loading' ? 0.6 : 1,
          }}
        >
          <span style={{ fontSize: 11, color: '#fde6a8', fontWeight: 700 }}>
            {step === 1 ? `${state.items.reduce((s, i) => s + i.quantity, 0)} صنف` : egp(grandTotal)}
          </span>
          <span style={{ ...disp, fontSize: 16, fontWeight: 900, fontStyle: 'italic' }}>
            {status === 'loading' ? '…' : step === 1 ? 'متابعة ←' : 'تأكيد الطلب ←'}
          </span>
        </button>
      </div>
    </div>
  )
}

export default CheckoutPage
