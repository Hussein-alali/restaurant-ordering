import { useNavigate } from 'react-router-dom'
import { useCart, calculateTotal } from '../context/CartContext'

function CartPage() {
  const { state, dispatch } = useCart()
  const navigate = useNavigate()
  const total = calculateTotal(state.items)
  const itemCount = state.items.reduce((s, i) => s + i.quantity, 0)

  const update = (id, delta) => {
    const item = state.items.find(i => i.id === id)
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity: item.quantity + delta } })
  }

  const remove = id => dispatch({ type: 'REMOVE_ITEM', payload: id })

  if (state.items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-5 pt-16 pb-32 flex flex-col items-center text-center">
        <div
          className="text-ink mb-3"
          style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 42, fontWeight: 400, letterSpacing: '-1px', lineHeight: 1 }}
        >
          still hungry?
        </div>
        <p className="text-sm text-ink-body mb-8">Your table is empty. Add some dishes first.</p>
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
    <div className="max-w-xl mx-auto px-5" style={{ paddingBottom: 120 }}>
      {/* Header nav */}
      <div className="pt-16 pb-4 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="font-mono text-[10px] text-muted tracking-[2px] uppercase"
        >
          ← back to menu
        </button>
        <div className="font-mono text-[10px] text-terra tracking-[2px] uppercase">◆ your table</div>
      </div>

      {/* Title */}
      <div className="pb-5">
        <div
          className="text-ink leading-none"
          style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontWeight: 400, fontSize: 46, letterSpacing: '-1.2px', lineHeight: 1 }}
        >
          your table.
        </div>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <p className="text-sm text-ink-body">
            {itemCount} {itemCount === 1 ? 'dish' : 'dishes'}
          </p>
          <span
            className="font-mono text-[9px] px-2.5 py-1 rounded-full tracking-[1px] uppercase"
            style={{ background: '#f3ead8', color: '#b8391a', border: '1px solid #e6dac1' }}
          >
            {state.serviceType}
          </span>
        </div>
      </div>

      {/* Items */}
      <div>
        {state.items.map(item => (
          <div key={item.id} className="flex gap-3 py-4 border-t border-rule">
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-paper-deep flex-shrink-0">
              {item.image && (
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover"
                  onError={e => { e.target.style.display = 'none' }}
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div
                className="text-ink leading-tight"
                style={{ fontFamily: 'Fraunces, serif', fontSize: 16, fontWeight: 500, letterSpacing: '-0.2px' }}
              >
                {item.name}
              </div>
              <div className="text-[11px] text-muted mt-0.5">${item.price.toFixed(2)} each</div>
              <div className="flex items-center justify-between mt-2">
                <div
                  className="inline-flex items-center gap-1 rounded-full p-0.5"
                  style={{ background: '#f3ead8' }}
                >
                  <button
                    onClick={() => update(item.id, -1)}
                    className="w-6 h-6 flex items-center justify-center text-ink-body rounded-full text-sm leading-none"
                  >
                    −
                  </button>
                  <span className="w-6 text-center text-sm font-semibold text-ink">{item.quantity}</span>
                  <button
                    onClick={() => update(item.id, 1)}
                    className="w-6 h-6 flex items-center justify-center text-ink-body rounded-full text-sm leading-none"
                  >
                    +
                  </button>
                </div>
                <div
                  className="text-ink"
                  style={{ fontFamily: 'Fraunces, serif', fontSize: 16, fontWeight: 600 }}
                >
                  ${(item.price * item.quantity).toFixed(2)}
                </div>
              </div>
            </div>
            <button
              onClick={() => remove(item.id)}
              className="self-start pt-0.5 text-muted hover:text-terra transition-colors"
              aria-label="Remove item"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {/* Add more row */}
      <button
        onClick={() => navigate('/')}
        className="w-full mt-3 border border-dashed border-rule rounded-2xl py-3.5 px-4 flex items-center justify-between text-sm"
      >
        <span className="text-ink-body">
          <span style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', color: '#1f1813' }}>
            still hungry?
          </span>{' '}
          add more dishes
        </span>
        <span className="text-terra font-semibold">+</span>
      </button>

      {/* Totals */}
      <div className="mt-6">
        <div className="font-mono text-[10px] text-ochre tracking-[2px] uppercase mb-3">— the bill —</div>
        {[
          ['Subtotal', `$${total.toFixed(2)}`],
          ['Delivery', 'complimentary'],
        ].map(([label, val]) => (
          <div key={label} className="flex justify-between py-2 text-sm text-ink-body">
            <span>{label}</span>
            <span style={{ color: val === 'complimentary' ? '#b8391a' : '#1f1813', fontStyle: val === 'complimentary' ? 'italic' : 'normal' }}>
              {val}
            </span>
          </div>
        ))}
        <div className="border-t border-rule mt-2 pt-3 flex items-baseline justify-between">
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 18, fontWeight: 500, color: '#1f1813' }}>Total</div>
          <div style={{ fontFamily: 'Fraunces, serif', fontSize: 30, fontWeight: 500, color: '#1f1813', letterSpacing: '-0.6px' }}>
            ${total.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Checkout bar */}
      <div className="fixed left-0 right-0 bottom-0 z-50 px-4 pb-8">
        <div className="max-w-xl mx-auto">
          <button
            onClick={() => navigate('/checkout')}
            className="w-full flex items-center justify-between rounded-2xl px-5 py-4 shadow-2xl"
            style={{ background: '#1f1813' }}
          >
            <div className="text-sm text-[#c9b39a]">${total.toFixed(2)}</div>
            <div style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 18, color: '#fbf6ec' }}>
              checkout →
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default CartPage
