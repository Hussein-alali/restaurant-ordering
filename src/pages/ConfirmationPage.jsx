import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

const C = {
  red: '#a8160c', redDeep: '#7a0d05', yellow: '#f4b528', yellowSoft: '#fde6a8',
  bg: '#f5ece0', card: '#ffffff', ink: '#1a0e08',
  body: '#5b4636', muted: '#9a8674', rule: '#ead8bf', green: '#1f7a3f',
}
const ar   = { fontFamily: '"Cairo", "Noto Naskh Arabic", system-ui, sans-serif' }
const disp = { fontFamily: '"Rubik", "Cairo", system-ui, sans-serif' }
const arNum = (n) => n.toLocaleString('ar-EG')
const egp   = (n) => `${arNum(n)} ج.م`

const STEPS = [
  { key: 'pending',    label: 'استُلم الطلب',  desc: 'المطبخ شايف طلبك',         icon: '📋' },
  { key: 'preparing',  label: 'جاري التحضير',  desc: 'بيتجهز دلوقتي',            icon: '👨‍🍳' },
  { key: 'on_the_way', label: 'في الطريق',      desc: 'المندوب اتحرك ناحيتك',     icon: '🛵' },
  { key: 'delivered',  label: 'وصل الطلب',     desc: 'بالهنا والشفا 🎉',          icon: '✅' },
]

const STATUS_INDEX = { pending: 0, preparing: 1, on_the_way: 2, delivered: 3 }

export default function ConfirmationPage() {
  const { state: cartState, dispatch: cartDispatch } = useCart()
  const navigate = useNavigate()
  const order = cartState.lastOrder

  const [status, setStatus]   = useState('pending')
  const [cancelled, setCancelled] = useState(false)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!order?.id) return

    const poll = async () => {
      try {
        const res = await fetch(`/api/orders/${order.id}`)
        if (!res.ok) return
        const data = await res.json()
        if (data.status === 'cancelled') {
          setCancelled(true)
          clearInterval(intervalRef.current)
          return
        }
        setStatus(data.status)
        if (data.status === 'delivered') clearInterval(intervalRef.current)
      } catch {}
    }

    poll()
    intervalRef.current = setInterval(poll, 10000)
    return () => clearInterval(intervalRef.current)
  }, [order?.id])

  if (!order) return (
    <div dir="rtl" style={{ ...ar, background: C.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: C.ink, marginBottom: 8 }}>مفيش طلب</div>
      <button onClick={() => navigate('/')} style={{ background: C.red, color: '#fff', border: 'none', borderRadius: 14, padding: '14px 28px', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>← القائمة</button>
    </div>
  )

  const etaLabel = { 'توصيل': '٣٠–٤٥ دقيقة', 'استلام': '~١٥ دقيقة', 'داخل المحل': '~٢٠ دقيقة' }
  const currentStep = STATUS_INDEX[status] ?? 0

  return (
    <div dir="rtl" style={{ background: C.bg, minHeight: '100vh', ...ar, paddingBottom: 48 }}>
      {/* Header */}
      <div style={{ padding: '54px 18px 18px', background: cancelled ? '#4b1010' : C.red, color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ fontSize: 11, color: '#fde6a8', fontWeight: 700, marginBottom: 4 }}>رقم الطلب · #{order.orderNumber}</div>
          <div style={{ ...disp, fontSize: 22, fontWeight: 900, fontStyle: 'italic' }}>
            {cancelled ? 'تم إلغاء الطلب ✕' : status === 'delivered' ? 'وصل الطلب 🎉' : 'تم تأكيد طلبك ✓'}
          </div>
        </div>
        {!cancelled && status !== 'delivered' && (
          <div style={{ background: C.yellow, color: C.redDeep, borderRadius: 10, padding: '6px 12px', fontSize: 12, fontWeight: 800 }}>
            {etaLabel[order.serviceType] || '٣٠–٤٥ دقيقة'}
          </div>
        )}
      </div>

      <div style={{ padding: '20px 18px' }}>
        {cancelled ? (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 14, padding: '16px 18px', marginBottom: 18, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🚫</div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#991b1b' }}>تم إلغاء الطلب</div>
            <div style={{ fontSize: 13, color: '#b91c1c', marginTop: 4 }}>تواصل معنا لو في استفسار</div>
          </div>
        ) : (
          <>
            {/* Greeting */}
            <div style={{ background: C.ink, borderRadius: 14, padding: '16px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ fontSize: 36 }}>{STEPS[currentStep].icon}</div>
              <div>
                <div style={{ color: C.yellow, fontSize: 13, fontWeight: 700 }}>{STEPS[currentStep].label}</div>
                <div style={{ color: '#d8c4a8', fontSize: 12, marginTop: 3 }}>{STEPS[currentStep].desc}</div>
              </div>
            </div>

            {/* Live timeline */}
            <div style={{ background: C.card, border: `1px solid ${C.rule}`, borderRadius: 14, padding: '16px', marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, marginBottom: 14 }}>
                تتبع الطلب {!order.id && ''}
                <span style={{ float: 'left', color: C.red, animation: 'pulse 2s infinite' }}>● مباشر</span>
              </div>
              {STEPS.map((step, i) => {
                const done   = i < currentStep
                const active = i === currentStep
                const future = i > currentStep
                return (
                  <div key={step.key} style={{ display: 'grid', gridTemplateColumns: '32px 1fr', gap: 10, paddingBottom: i < STEPS.length - 1 ? 18 : 0, position: 'relative' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: 14,
                        background: done ? C.green : active ? C.red : 'transparent',
                        border: `2px solid ${done ? C.green : active ? C.red : C.rule}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 13, flexShrink: 0,
                        boxShadow: active ? '0 0 0 6px rgba(168,22,12,0.12)' : 'none',
                        transition: 'all .4s ease',
                      }}>
                        {done ? '✓' : active ? step.icon : ''}
                      </div>
                      {i < STEPS.length - 1 && (
                        <div style={{ flex: 1, width: 2, minHeight: 16, marginTop: 4, background: done ? C.green : C.rule, transition: 'background .4s ease' }} />
                      )}
                    </div>
                    <div style={{ paddingTop: 4 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: future ? C.muted : C.ink, transition: 'color .4s' }}>{step.label}</div>
                      <div style={{ fontSize: 12, color: future ? C.rule : C.muted, marginTop: 1 }}>{step.desc}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Order summary */}
        <div style={{ background: C.card, border: `1px solid ${C.rule}`, borderRadius: 14, padding: '14px 16px', marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 10 }}>ملخص الطلب</div>
          {order.items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
              <span style={{ color: C.body }}>{item.name} <span style={{ color: C.muted }}>×{arNum(item.quantity)}</span></span>
              <span style={{ color: C.ink, fontWeight: 700 }}>{egp(item.price * item.quantity)}</span>
            </div>
          ))}
          <div style={{ height: 1, background: C.rule, margin: '10px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 15, fontWeight: 900, color: C.ink }}>الإجمالي</span>
            <span style={{ ...disp, fontSize: 22, fontWeight: 900, color: C.red, fontStyle: 'italic' }}>{egp(order.totalPrice + 15)}</span>
          </div>
        </div>

        {/* Customer info */}
        <div style={{ background: C.card, border: `1px solid ${C.rule}`, borderRadius: 14, padding: '14px 16px', marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 8 }}>بيانات التوصيل</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.ink }}>{order.customerName}</div>
          <div style={{ fontSize: 13, color: C.body, marginTop: 2 }}>{order.phone}</div>
          {order.address && <div style={{ fontSize: 13, color: C.body, marginTop: 2 }}>{order.address}</div>}
          {order.deliveryNotes && <div style={{ fontSize: 12, color: C.muted, fontStyle: 'italic', marginTop: 2 }}>{order.deliveryNotes}</div>}
        </div>

        <button
          onClick={() => { cartDispatch({ type: 'RESET' }); navigate('/') }}
          style={{ width: '100%', background: C.red, color: '#fff', border: 'none', borderRadius: 14, padding: '16px', fontSize: 15, fontWeight: 800, cursor: 'pointer', boxShadow: '0 12px 28px rgba(168,22,12,0.3)' }}
        >طلب جديد ←</button>
      </div>
    </div>
  )
}
