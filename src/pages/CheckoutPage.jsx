import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart, calculateTotal, formatPayload, validateForm } from '../context/CartContext'

const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/restaurant-order'

function StepDots({ step }) {
  const steps = ['address', 'pay']
  return (
    <div className="flex items-center gap-3 py-3.5">
      {steps.map((label, i) => {
        const n = i + 1
        const done = n < step
        const active = n === step
        return (
          <div key={label} className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <div
                className="flex items-center justify-center rounded-full text-xs"
                style={{
                  width: 22,
                  height: 22,
                  border: `1.5px solid ${done ? '#b8391a' : active ? '#1f1813' : '#e6dac1'}`,
                  background: done ? '#b8391a' : 'transparent',
                  color: done ? '#fff' : active ? '#1f1813' : '#8a7a6b',
                  fontFamily: done ? 'Work Sans, sans-serif' : 'Fraunces, serif',
                  fontStyle: active ? 'italic' : 'normal',
                  fontWeight: 500,
                }}
              >
                {done ? '✓' : n}
              </div>
              <span
                className="font-mono text-[10px] tracking-[1.5px] uppercase"
                style={{ color: done ? '#b8391a' : active ? '#1f1813' : '#8a7a6b' }}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className="h-px w-8 ml-1"
                style={{ background: done ? '#b8391a' : '#e6dac1' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', placeholder, error, optional }) {
  return (
    <div className="mb-4">
      <div className="font-mono text-[9px] text-muted tracking-[1.5px] uppercase mb-1.5">
        {label}{optional && <span className="ml-1 normal-case tracking-normal opacity-60">optional</span>}
      </div>
      <div
        className="rounded-2xl border px-4 py-3.5"
        style={{
          background: '#fff',
          borderColor: error ? '#b8391a' : '#e6dac1',
        }}
      >
        <input
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full text-[15px] text-ink bg-transparent outline-none placeholder-muted"
        />
      </div>
      {error && <p className="font-mono text-[10px] text-terra mt-1">{error}</p>}
    </div>
  )
}

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function CheckoutPage() {
  const { state, dispatch } = useCart()
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')

  const total = calculateTotal(state.items)
  const itemCount = state.items.reduce((s, i) => s + i.quantity, 0)
  const serviceType = state.serviceType
  const isDelivery = serviceType === 'Delivery'

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
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    setStep(2)
  }

  const handlePlaceOrder = async () => {
    setStatus('loading')
    const payload = formatPayload(state)
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      dispatch({ type: 'SET_LAST_ORDER', payload })
      dispatch({ type: 'CLEAR_CART' })
      navigate('/confirmation')
    } catch {
      setStatus('error')
    }
  }

  if (state.items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-5 pt-16 pb-32 flex flex-col items-center text-center">
        <div
          className="text-ink mb-3"
          style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 42, fontWeight: 400, letterSpacing: '-1px', lineHeight: 1 }}
        >
          nothing here.
        </div>
        <p className="text-sm text-ink-body mb-8">Add items from the menu first.</p>
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
      {/* Header */}
      <div className="pt-16 pb-2 flex items-center justify-between">
        <button
          onClick={() => (step === 1 ? navigate('/cart') : setStep(1))}
          className="font-mono text-[10px] text-muted tracking-[2px] uppercase"
        >
          ← {step === 1 ? 'cart' : 'address'}
        </button>
        <div className="font-mono text-[10px] text-terra tracking-[2px]">step {step}/2</div>
      </div>

      <StepDots step={step} />

      {/* Step 1 — Customer details */}
      {step === 1 && (
        <>
          <div
            className="text-ink pb-5 pt-2"
            style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontWeight: 400, fontSize: 36, letterSpacing: '-0.8px', lineHeight: 1 }}
          >
            {isDelivery ? 'where to?' : 'your details.'}
          </div>

          {/* Service type context hint */}
          {!isDelivery && (
            <div className="mb-4 rounded-2xl px-4 py-3 border border-rule" style={{ background: '#f3ead8' }}>
              <div className="font-mono text-[9px] text-terra tracking-[1.5px] uppercase mb-0.5">
                {serviceType === 'Dine-in' ? '◆ dining in' : '◆ takeaway'}
              </div>
              <div className="text-sm text-ink-body">
                {serviceType === 'Dine-in'
                  ? 'Your order will be prepared and served at the table.'
                  : 'Your order will be ready for pickup in 20 minutes.'}
              </div>
            </div>
          )}

          <Field
            label="Full name"
            value={state.customer.name}
            onChange={v => updateCustomer('name', v)}
            placeholder="Your full name"
            error={errors.name}
          />
          <Field
            label="Phone"
            value={state.customer.phone}
            onChange={v => updateCustomer('phone', v)}
            type="tel"
            placeholder="+1 (555) 000-0000"
            error={errors.phone}
          />
          {isDelivery && (
            <>
              <Field
                label="Street address"
                value={state.customer.address}
                onChange={v => updateCustomer('address', v)}
                placeholder="228 Mercer Street"
                error={errors.address}
              />
              <Field
                label="Building / Floor"
                value={state.customer.building}
                onChange={v => updateCustomer('building', v)}
                placeholder="Apt 4B, Floor 3…"
                optional
              />
            </>
          )}
          <Field
            label={isDelivery ? 'Notes to the driver' : 'Special requests'}
            value={state.customer.deliveryNotes}
            onChange={v => updateCustomer('deliveryNotes', v)}
            placeholder={isDelivery ? 'Leave at door · buzzer 4B…' : 'Allergies, preferences…'}
            optional
          />
        </>
      )}

      {/* Step 2 — Review & pay */}
      {step === 2 && (
        <>
          <div
            className="text-ink pb-5 pt-2"
            style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontWeight: 400, fontSize: 36, letterSpacing: '-0.8px', lineHeight: 1 }}
          >
            review & pay.
          </div>

          {/* Payment method */}
          <div className="mb-5">
            <div className="font-mono text-[9px] text-muted tracking-[1.5px] uppercase mb-2">Payment</div>
            <div
              className="rounded-2xl border px-4 py-3.5 flex items-center justify-between"
              style={{ background: '#fff', borderColor: '#1f1813' }}
            >
              <div style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 16, color: '#1f1813' }}>
                Cash on delivery
              </div>
              <div
                className="rounded-full"
                style={{ width: 18, height: 18, background: '#1f1813', border: '1.5px solid #1f1813' }}
              />
            </div>
          </div>

          {/* Order items */}
          <div className="mb-5">
            <div className="font-mono text-[9px] text-ochre tracking-[2px] uppercase mb-3">— your order —</div>
            <div
              className="rounded-2xl p-4"
              style={{ background: '#f3ead8' }}
            >
              {state.items.map(item => (
                <div key={item.id} className="flex justify-between py-1.5 text-sm text-ink-body">
                  <span>
                    {item.name}
                    <span className="text-muted ml-1.5">×{item.quantity}</span>
                  </span>
                  <span className="text-ink">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="border-t border-rule mt-2 pt-3 flex justify-between">
                <div className="font-mono text-[9px] text-muted tracking-[1.5px] uppercase">Delivery</div>
                <div className="text-sm text-terra italic">complimentary</div>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <div style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 18, color: '#1f1813' }}>
                  total
                </div>
                <div style={{ fontFamily: 'Fraunces, serif', fontSize: 26, fontWeight: 500, color: '#1f1813', letterSpacing: '-0.6px' }}>
                  ${total.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Customer summary */}
          <div className="mb-5">
            <div className="font-mono text-[9px] text-muted tracking-[1.5px] uppercase mb-2">
              {isDelivery ? 'Delivering to' : serviceType}
            </div>
            <div className="text-sm text-ink-body leading-relaxed">
              <div className="font-medium text-ink">{state.customer.name}</div>
              <div>{state.customer.phone}</div>
              {isDelivery && (
                <div>{[state.customer.address, state.customer.building].filter(Boolean).join(', ')}</div>
              )}
              {state.customer.deliveryNotes && (
                <div className="text-muted italic mt-0.5">{state.customer.deliveryNotes}</div>
              )}
            </div>
          </div>

          {status === 'error' && (
            <div className="mb-4 rounded-2xl border border-terra/40 bg-terra/5 px-4 py-3">
              <p className="font-mono text-[11px] text-terra">
                Couldn't reach the kitchen. Check your connection and try again.
              </p>
            </div>
          )}
        </>
      )}

      {/* Bottom CTA */}
      <div className="fixed left-0 right-0 bottom-0 z-50 px-4 pb-8">
        <div className="max-w-xl mx-auto flex gap-3">
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="rounded-2xl border border-ink px-5 py-4 text-sm font-semibold text-ink"
            >
              back
            </button>
          )}
          <button
            onClick={step === 1 ? handleStep1Continue : handlePlaceOrder}
            disabled={status === 'loading'}
            className="flex-1 flex items-center justify-between rounded-2xl px-5 py-4 shadow-2xl disabled:opacity-50"
            style={{ background: '#1f1813' }}
          >
            <div className="text-sm text-[#c9b39a]">
              {step === 1 ? `${itemCount} ${itemCount === 1 ? 'dish' : 'dishes'}` : `$${total.toFixed(2)} · tonight`}
            </div>
            <div style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 17, color: '#fbf6ec', display: 'flex', alignItems: 'center', gap: 8 }}>
              {status === 'loading' ? (
                <SpinnerIcon />
              ) : step === 1 ? (
                'continue →'
              ) : (
                'place order →'
              )}
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default CheckoutPage
