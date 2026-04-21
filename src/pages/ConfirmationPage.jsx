import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

function CheckCircleIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

function ConfirmationPage() {
  const { state, dispatch } = useCart()
  const navigate = useNavigate()

  const order = state.lastOrder || null

  const handleNewOrder = () => {
    dispatch({ type: 'RESET' })
    navigate('/')
  }

  if (!order) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col items-center justify-center text-center">
          <h2 className="font-display text-[#1b1c19] text-2xl font-bold mb-2">No order found</h2>
          <p className="text-[#5b4139] text-sm mb-6">Please place an order first.</p>
          <Link to="/" className="px-6 py-3 bg-[#ac2d00] hover:bg-[#8f2500] text-white font-bold rounded-lg transition-colors">
            Browse Menu
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex flex-col items-center text-center mb-12">
        <div className="w-24 h-24 rounded-full bg-[#ac2d00]/10 flex items-center justify-center mb-6">
          <CheckCircleIcon className="w-14 h-14 text-[#ac2d00]" />
        </div>
        <p className="text-[#ac2d00] text-[11px] font-medium uppercase tracking-[2.2px] mb-3">SUCCESS</p>
        <h1 className="font-display text-[#1b1c19] text-4xl sm:text-5xl font-bold leading-tight tracking-tight mb-4">
          Order Confirmed!
        </h1>
        <p className="text-[#5b4139] text-sm max-w-lg">
          Thank you for your order! We've received your request and will begin preparing it shortly. You'll receive a confirmation call shortly.
        </p>
      </div>

      <div className="max-w-2xl mx-auto bg-[#f5f3ee] rounded-2xl p-8">
        <h2 className="font-display text-[#1b1c19] text-xl font-bold mb-6">Order Summary</h2>
        
        <div className="space-y-4 mb-8">
          <div className="flex justify-between pb-4 border-b border-[#e4e2dd]">
            <div>
              <p className="text-[#5b4139] text-xs font-semibold uppercase tracking-wider mb-1">Customer</p>
              <p className="text-[#1b1c19] font-medium">{order.customerName}</p>
              <p className="text-[#1b1c19]">{order.phone}</p>
            </div>
            <div className="text-right">
              <p className="text-[#5b4139] text-xs font-semibold uppercase tracking-wider mb-1">Delivery Address</p>
              <p className="text-[#1b1c19]">{order.address}</p>
            </div>
          </div>

          <div>
            <p className="text-[#5b4139] text-xs font-semibold uppercase tracking-wider mb-3">Items</p>
            <div className="space-y-2">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="text-[#1b1c19]">{item.name} x{item.quantity}</span>
                  <span className="text-[#1b1c19]">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-[#e4e2dd]">
            <span className="font-display text-[#1b1c19] font-bold">Total</span>
            <span className="font-display text-[#ac2d00] text-2xl font-bold">${order.totalPrice.toFixed(2)}</span>
          </div>

          {order.deliveryNotes && (
            <div className="pt-4">
              <p className="text-[#5b4139] text-xs font-semibold uppercase tracking-wider mb-1">Delivery Notes</p>
              <p className="text-[#1b1c19]">{order.deliveryNotes}</p>
            </div>
          )}
        </div>

        <div className="bg-[#1b1c19] rounded-xl p-6 text-center">
          <p className="text-[#fbf9f4] font-medium mb-2">Estimated Delivery Time</p>
          <p className="text-[#ac2d00] font-display text-2xl font-bold">30-45 minutes</p>
        </div>
      </div>

      <div className="text-center mt-8">
        <button
          onClick={handleNewOrder}
          className="px-8 py-4 bg-[#ac2d00] hover:bg-[#8f2500] text-white font-bold rounded-lg transition-colors"
        >
          Place Another Order
        </button>
      </div>
    </div>
  )
}

export default ConfirmationPage