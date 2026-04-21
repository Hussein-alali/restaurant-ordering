import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCart, calculateTotal, formatPayload, validateForm } from '../context/CartContext'

const WEBHOOK_URL = import.meta.env.VITE_WEBHOOK_URL || 'https://your-n8n-instance.com/webhook/restaurant-order'

function ArrowRightIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
    </svg>
  )
}

function SpinnerIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

function CheckoutPage() {
  const { state, dispatch } = useCart()
  const navigate = useNavigate()
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle')

  const total = calculateTotal(state.items)
  const cartCount = state.items.reduce((sum, item) => sum + item.quantity, 0)

  const updateCustomer = (field, value) => {
    dispatch({ type: 'SET_CUSTOMER', payload: { [field]: value } })
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const formData = {
      name: state.customer.name,
      phone: state.customer.phone,
      address: state.customer.address,
    }
    
    const validationErrors = validateForm(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    setStatus('loading')

    const payload = formatPayload(state)

    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      
      dispatch({ type: 'SET_LAST_ORDER', payload: payload })
      dispatch({ type: 'CLEAR_CART' })
      navigate('/confirmation')
    } catch (err) {
      console.error('Order submission failed:', err)
      setStatus('error')
    }
  }

  if (state.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col items-center justify-center text-center">
          <h2 className="font-display text-[#1b1c19] text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-[#5b4139] text-sm mb-6">Add items from the menu first.</p>
          <Link to="/" className="px-6 py-3 bg-[#ac2d00] hover:bg-[#8f2500] text-white font-bold rounded-lg transition-colors">
            Browse Menu
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <section className="mb-10">
        <p className="text-[#ac2d00] text-[11px] font-medium uppercase tracking-[2.2px] mb-3">CHECKOUT</p>
        <h1 className="font-display text-[#1b1c19] text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
          Delivery Details
        </h1>
      </section>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#f5f3ee] rounded-2xl p-6">
            <h2 className="font-display text-[#1b1c19] text-xl font-bold mb-6">Customer Information</h2>
            <div className="space-y-5">
              <div>
                <label className="block text-[#5b4139] text-xs font-semibold uppercase tracking-wider mb-2">Full Name</label>
                <input
                  type="text"
                  value={state.customer.name}
                  onChange={(e) => updateCustomer('name', e.target.value)}
                  placeholder="Enter your full name"
                  className={`w-full bg-[#e4e2dd] rounded-lg px-4 py-3.5 text-[#1b1c19] placeholder-[#a8a29e] focus:outline-none focus:ring-2 ${errors.name ? 'focus:ring-red-500' : 'focus:ring-[#ac2d00]/25'}`}
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-[#5b4139] text-xs font-semibold uppercase tracking-wider mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={state.customer.phone}
                  onChange={(e) => updateCustomer('phone', e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className={`w-full bg-[#e4e2dd] rounded-lg px-4 py-3.5 text-[#1b1c19] placeholder-[#a8a29e] focus:outline-none focus:ring-2 ${errors.phone ? 'focus:ring-red-500' : 'focus:ring-[#ac2d00]/25'}`}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-[#5b4139] text-xs font-semibold uppercase tracking-wider mb-2">Street Address</label>
                <input
                  type="text"
                  value={state.customer.address}
                  onChange={(e) => updateCustomer('address', e.target.value)}
                  placeholder="Street address"
                  className={`w-full bg-[#e4e2dd] rounded-lg px-4 py-3.5 text-[#1b1c19] placeholder-[#a8a29e] focus:outline-none focus:ring-2 ${errors.address ? 'focus:ring-red-500' : 'focus:ring-[#ac2d00]/25'}`}
                />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
              </div>
              <div>
                <label className="block text-[#5b4139] text-xs font-semibold uppercase tracking-wider mb-2">Building / Floor (Optional)</label>
                <input
                  type="text"
                  value={state.customer.building}
                  onChange={(e) => updateCustomer('building', e.target.value)}
                  placeholder="Building name, floor, apartment number"
                  className="w-full bg-[#e4e2dd] rounded-lg px-4 py-3.5 text-[#1b1c19] placeholder-[#a8a29e] focus:outline-none focus:ring-2 focus:ring-[#ac2d00]/25"
                />
              </div>
              <div>
                <label className="block text-[#5b4139] text-xs font-semibold uppercase tracking-wider mb-2">Delivery Notes (Optional)</label>
                <textarea
                  value={state.customer.deliveryNotes}
                  onChange={(e) => updateCustomer('deliveryNotes', e.target.value)}
                  placeholder="Building, floor, instructions..."
                  rows={3}
                  className="w-full bg-[#e4e2dd] rounded-lg px-4 py-3.5 text-[#1b1c19] placeholder-[#a8a29e] focus:outline-none focus:ring-2 focus:ring-[#ac2d00]/25 resize-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#f5f3ee] rounded-2xl p-6">
            <h2 className="font-display text-[#1b1c19] text-xl font-bold mb-6">Order Items</h2>
            <div className="space-y-4">
              {state.items.map(item => (
                <div key={item.id} className="flex justify-between items-center">
                  <div>
                    <span className="text-[#1b1c19] font-medium">{item.name}</span>
                    <span className="text-[#5b4139] text-sm ml-2">x{item.quantity}</span>
                  </div>
                  <span className="text-[#1b1c19]">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-[#f5f3ee] rounded-2xl p-6 sticky top-24">
            <h2 className="font-display text-[#1b1c19] text-xl font-bold mb-6">Payment</h2>
            <div className="mb-6">
              <label className="flex items-center gap-3 p-4 border-2 border-[#ac2d00] rounded-lg bg-[#ac2d00]/10">
                <input type="radio" name="payment" defaultChecked className="w-4 h-4 text-[#ac2d00]" />
                <span className="text-[#1b1c19] font-medium">Cash on Delivery</span>
              </label>
            </div>
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-[#5b4139]">Subtotal ({cartCount} items)</span>
                <span className="text-[#1b1c19] font-medium">${total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5b4139]">Delivery</span>
                <span className="text-[#ac2d00]">Complimentary</span>
              </div>
              <div className="border-t border-[#e4e2dd] pt-3 flex justify-between">
                <span className="font-display text-[#1b1c19] font-bold">Total</span>
                <span className="font-display text-[#ac2d00] text-2xl font-bold">${total.toFixed(2)}</span>
              </div>
            </div>

            {status === 'error' ? (
              <button
                type="button"
                onClick={() => setStatus('idle')}
                className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-lg"
              >
                Try Again
              </button>
            ) : (
              <button
                type="submit"
                disabled={status === 'loading'}
                className="w-full py-4 bg-[#ac2d00] hover:bg-[#8f2500] disabled:opacity-40 text-white font-bold rounded-lg flex items-center justify-center gap-3"
              >
                {status === 'loading' ? (
                  <>
                    <SpinnerIcon className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Confirm Order
                    <ArrowRightIcon className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}

export default CheckoutPage