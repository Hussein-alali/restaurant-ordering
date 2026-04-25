import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

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
}

const ar = { fontFamily: '"Cairo", "Noto Naskh Arabic", system-ui, sans-serif' }
const disp = { fontFamily: '"Rubik", "Cairo", system-ui, sans-serif' }
const egp = (n) => `${n} ج.م`

const TIMELINE = [
  { key: 'received', ar: 'استُلم الطلب',   desc: 'المطبخ شايف طلبك' },
  { key: 'prep',     ar: 'جاري التحضير',   desc: 'بيتجهز دلوقتي' },
  { key: 'riding',   ar: 'في الطريق',       desc: 'المندوب اتحرك ناحيتك' },
  { key: 'done',     ar: 'وصل الطلب',      desc: 'بالهنا والشفا 🎉' },
]

function ConfirmationPage() {
  const { state: cartState, dispatch: cartDispatch } = useCart()
  const navigate = useNavigate()

  const order = cartState.lastOrder
  const serviceType = order?.serviceType || 'توصيل'

  const etaLabel = { 'توصيل': '٣٠–٤٥ دقيقة', 'استلام': '~١٥ دقيقة', 'داخل المحل': '~٢٠ دقيقة' }

  const handleNewOrder = () => {
    cartDispatch({ type: 'RESET' })
    navigate('/')
  }

  if (!order) {
    return (
      <div dir="rtl" style={{ ...ar, background: C.bg, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ ...disp, fontSize: 22, fontWeight: 900, color: C.ink, marginBottom: 8 }}>مفيش طلب</div>
        <p style={{ fontSize: 14, color: C.body, marginBottom: 24 }}>قدّم طلب الأول</p>
        <button onClick={() => navigate('/')} style={{ background: C.red, color: '#fff', border: 'none', borderRadius: 14, padding: '14px 28px', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>
          ← القائمة
        </button>
      </div>
    )
  }

  const orderNum = Math.floor(Date.now() / 1000).toString(36).toUpperCase()

  return (
    <div dir="rtl" style={{ background: C.bg, minHeight: '100vh', ...ar, paddingBottom: 48 }}>
      {/* Header */}
      <div style={{
        padding: '54px 18px 18px', background: C.red, color: '#fff',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
      }}>
        <div>
          <div style={{ fontSize: 11, color: '#fde6a8', fontWeight: 700, marginBottom: 4 }}>رقم الطلب · #{orderNum}</div>
          <div style={{ ...disp, fontSize: 22, fontWeight: 900, fontStyle: 'italic' }}>تم تأكيد طلبك ✓</div>
        </div>
        <div style={{
          background: C.yellow, color: C.redDeep, borderRadius: 10,
          padding: '6px 12px', fontSize: 12, fontWeight: 800,
        }}>
          {etaLabel[serviceType]}
        </div>
      </div>

      <div style={{ padding: '20px 18px' }}>
        {/* Greeting */}
        <div style={{
          background: C.ink, borderRadius: 14, padding: '16px 18px', marginBottom: 18,
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ fontSize: 36 }}>🎉</div>
          <div>
            <div style={{ color: C.yellow, fontSize: 13, fontWeight: 700 }}>الطلب جاي يا {order.customerName?.split(' ')[0] || 'صديقي'}</div>
            <div style={{ color: '#d8c4a8', fontSize: 12, marginTop: 3 }}>
              {serviceType === 'توصيل'
                ? 'هنتصل بيك لما المندوب يقترب'
                : serviceType === 'استلام'
                  ? 'طلبك هيبقى جاهز للاستلام خلال ' + etaLabel[serviceType]
                  : 'طلبك بيتجهز وهيتقدملك على الطاولة'}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.body, marginBottom: 12 }}>مراحل الطلب</div>
          {TIMELINE.map((stage, i) => {
            const active = i === 0
            return (
              <div key={stage.key} style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 10, paddingBottom: i < TIMELINE.length - 1 ? 16 : 0, position: 'relative' }}>
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: 7,
                    background: active ? C.red : 'transparent',
                    border: `1.5px solid ${active ? C.red : C.rule}`,
                    boxShadow: active ? '0 0 0 5px rgba(168,22,12,0.12)' : 'none',
                    marginTop: 3, flexShrink: 0,
                  }} />
                  {i < TIMELINE.length - 1 && (
                    <div style={{ flex: 1, width: 1, background: active ? C.red : C.rule, minHeight: 20, marginTop: 4 }} />
                  )}
                </div>
                <div style={{ paddingBottom: 4 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: active ? C.ink : C.muted }}>{stage.ar}</div>
                  <div style={{ fontSize: 12, color: active ? C.body : C.muted, marginTop: 1 }}>{stage.desc}</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Order summary */}
        <div style={{ background: C.card, border: `1px solid ${C.rule}`, borderRadius: 14, padding: '14px 16px', marginBottom: 18 }}>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 10 }}>ملخص الطلب</div>
          {order.items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: 13 }}>
              <span style={{ color: C.body }}>
                {item.name} <span style={{ color: C.muted }}>×{item.quantity}</span>
              </span>
              <span style={{ color: C.ink, fontWeight: 700 }}>{egp(item.price * item.quantity)}</span>
            </div>
          ))}
          <div style={{ height: 1, background: C.rule, margin: '10px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 15, fontWeight: 900, color: C.ink }}>الإجمالي</span>
            <span style={{ ...disp, fontSize: 22, fontWeight: 900, color: C.red, fontStyle: 'italic' }}>
              {egp(order.totalPrice + 15)}
            </span>
          </div>
        </div>

        {/* Customer info */}
        <div style={{ background: C.card, border: `1px solid ${C.rule}`, borderRadius: 14, padding: '14px 16px', marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 8 }}>بيانات التوصيل</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.ink }}>{order.customerName}</div>
          <div style={{ fontSize: 13, color: C.body, marginTop: 2 }}>{order.phone}</div>
          <div style={{ fontSize: 13, color: C.body, marginTop: 2 }}>{order.address}</div>
          {order.deliveryNotes && <div style={{ fontSize: 12, color: C.muted, fontStyle: 'italic', marginTop: 2 }}>{order.deliveryNotes}</div>}
        </div>

        <button
          onClick={handleNewOrder}
          style={{
            width: '100%', background: C.red, color: '#fff', border: 'none', borderRadius: 14,
            padding: '16px', fontSize: 15, fontWeight: 800, cursor: 'pointer',
            boxShadow: '0 12px 28px rgba(168,22,12,0.3)',
          }}
        >
          طلب جديد ←
        </button>
      </div>
    </div>
  )
}

export default ConfirmationPage
