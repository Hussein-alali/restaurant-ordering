import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'


const TIMELINE = [
  { key: 'received', label: 'received', desc: 'The kitchen has your order.' },
  { key: 'prep',     label: 'preparing', desc: 'Our chefs are on it.' },
  { key: 'riding',   label: 'on the way', desc: 'Your rider picked up the order.' },
  { key: 'delivered',label: 'at your door', desc: 'Delivered. Buon appetito.' },
]

function ConfirmationPage() {
  const { state: cartState, dispatch: cartDispatch } = useCart()
  const navigate = useNavigate()

  const order = cartState.lastOrder
  const serviceType = order?.serviceType || 'Delivery'

  const etaLabel = { Delivery: '30–45 min', 'Dine-in': '~20 min', Takeaway: '~20 min' }
  const etaContext = {
    Delivery: "You'll receive a call when your rider is close.",
    'Dine-in': 'Your order is being prepared and will be served at your table.',
    Takeaway: 'Your order will be ready for pickup at the counter.',
  }

  const handleNewOrder = () => {
    cartDispatch({ type: 'RESET' })
    navigate('/')
  }

  if (!order) {
    return (
      <div className="max-w-xl mx-auto px-5 pt-16 pb-32 flex flex-col items-center text-center">
        <div
          className="text-ink mb-3"
          style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 42, fontWeight: 400, letterSpacing: '-1px', lineHeight: 1 }}
        >
          no order found.
        </div>
        <p className="text-sm text-ink-body mb-8">Place an order first.</p>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 rounded-2xl bg-ink text-paper text-sm font-semibold"
        >
          browse the menu →
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto px-5 pb-32">
      {/* Header */}
      <div className="pt-16 pb-2 flex items-center justify-between">
        <div className="font-mono text-[10px] text-muted tracking-[2px] uppercase">
          order · #{Math.floor(Date.now() / 1000).toString(36).toUpperCase()}
        </div>
        <div className="font-mono text-[10px] text-terra tracking-[2px]">confirmed ●</div>
      </div>

      {/* Large ETA */}
      <div className="pt-5 pb-3">
        <div className="font-mono text-[10px] text-ochre tracking-[2px] uppercase">
          {serviceType === 'Delivery' ? 'arriving in' : 'ready in'}
        </div>
        <div
          className="text-ink leading-none mt-1"
          style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontWeight: 400, fontSize: 68, letterSpacing: '-2px', lineHeight: 1 }}
        >
          {etaLabel[serviceType]}
        </div>
        <p className="text-sm text-ink-body mt-3">
          <span style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic' }}>Buon appetito, {order.customerName.split(' ')[0]}.</span>{' '}
          {etaContext[serviceType]}
        </p>
      </div>

      {/* Timeline */}
      <div className="mt-6">
        <div className="font-mono text-[10px] text-ochre tracking-[2px] uppercase mb-3">— timeline —</div>
        {TIMELINE.map((stage, i) => {
          const active = i === 0
          const done = false
          return (
            <div key={stage.key} className="grid gap-3 py-2" style={{ gridTemplateColumns: '28px 1fr' }}>
              <div className="relative">
                <div
                  className="rounded-full mt-0.5"
                  style={{
                    width: 14,
                    height: 14,
                    background: active ? '#b8391a' : 'transparent',
                    border: `1.5px solid ${active ? '#b8391a' : '#e6dac1'}`,
                    boxShadow: active ? '0 0 0 5px rgba(184,57,26,0.12)' : 'none',
                  }}
                />
                {i < TIMELINE.length - 1 && (
                  <div
                    className="absolute left-[6.5px] top-[18px]"
                    style={{ bottom: -10, width: 1, background: active ? '#b8391a' : '#e6dac1' }}
                  />
                )}
              </div>
              <div>
                <div
                  className="leading-tight"
                  style={{
                    fontFamily: 'Fraunces, serif',
                    fontStyle: active ? 'italic' : 'normal',
                    fontSize: 18,
                    color: active ? '#1f1813' : '#8a7a6b',
                    letterSpacing: '-0.2px',
                  }}
                >
                  {stage.label}
                </div>
                <div className="text-xs mt-0.5" style={{ color: active ? '#5a4a3e' : '#8a7a6b' }}>
                  {stage.desc}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Order summary */}
      <div className="mt-8">
        <div className="font-mono text-[10px] text-ochre tracking-[2px] uppercase mb-3">— your order —</div>
        <div className="rounded-2xl p-4 border-t border-rule" style={{ background: '#f3ead8' }}>
          <div className="border-b border-rule pb-3 mb-3">
            <div className="font-medium text-sm text-ink">{order.customerName}</div>
            <div className="text-sm text-ink-body">{order.phone}</div>
            <div className="text-sm text-ink-body">{order.address}</div>
            {order.deliveryNotes && (
              <div className="text-sm text-muted italic mt-0.5">{order.deliveryNotes}</div>
            )}
          </div>
          {order.items.map((item, idx) => (
            <div key={idx} className="flex justify-between py-1 text-sm text-ink-body">
              <span>
                {item.name}
                <span className="text-muted ml-1.5">×{item.quantity}</span>
              </span>
              <span className="text-ink">${(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-rule mt-2 pt-3 flex items-baseline justify-between">
            <div style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 18, color: '#1f1813' }}>total</div>
            <div style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 500, color: '#1f1813', letterSpacing: '-0.6px' }}>
              ${order.totalPrice.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* New order */}
      <div className="mt-8 text-center">
        <button
          onClick={handleNewOrder}
          className="px-8 py-4 rounded-2xl bg-ink text-paper font-semibold text-sm"
        >
          place another order →
        </button>
      </div>
    </div>
  )
}

export default ConfirmationPage
