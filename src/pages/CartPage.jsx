import { Link } from 'react-router-dom'
import { useCart, calculateTotal } from '../context/CartContext'

function PlusIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function MinusIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" />
    </svg>
  )
}

function TrashIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  )
}

function ShoppingBagIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm6.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  )
}

function CartPage() {
  const { state, dispatch } = useCart()
  const total = calculateTotal(state.items)
  const cartCount = state.items.reduce((sum, item) => sum + item.quantity, 0)

  const updateQuantity = (id, delta) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id, quantity: state.items.find(i => i.id === id).quantity + delta } })
  }

  const removeItem = (id) => {
    dispatch({ type: 'REMOVE_ITEM', payload: id })
  }

  if (state.items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col items-center justify-center text-center">
          <ShoppingBagIcon className="w-16 h-16 text-[#e4e2dd] mb-4" />
          <h2 className="font-display text-[#1b1c19] text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-[#5b4139] text-sm mb-6">Add something delicious from the menu!</p>
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
        <p className="text-[#ac2d00] text-[11px] font-medium uppercase tracking-[2.2px] mb-3">YOUR SELECTION</p>
        <h1 className="font-display text-[#1b1c19] text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
          Shopping Cart
        </h1>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {state.items.map(item => (
            <div key={item.id} className="flex gap-6 bg-[#f5f3ee] rounded-2xl p-6">
              <div className="w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none' }} />
              </div>
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-display text-[#1b1c19] text-xl font-bold">{item.name}</h3>
                  <p className="text-[#5b4139] text-sm">${item.price.toFixed(2)} each</p>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center bg-[#e4e2dd] rounded-full px-2 py-1 gap-2">
                    <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-[#1b1c19] hover:opacity-60">
                      <MinusIcon className="w-3 h-3" />
                    </button>
                    <span className="w-8 text-center text-[#1b1c19] font-bold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-[#1b1c19] hover:opacity-60">
                      <PlusIcon className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="font-display text-[#ac2d00] text-xl font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              </div>
              <button onClick={() => removeItem(item.id)} className="self-start p-2 text-[#5b4139] hover:text-[#ac2d00]">
                <TrashIcon className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-[#f5f3ee] rounded-2xl p-6 sticky top-24">
            <h2 className="font-display text-[#1b1c19] text-xl font-bold mb-6">Order Summary</h2>
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
            <Link
              to="/checkout"
              className="block w-full py-4 bg-[#ac2d00] hover:bg-[#8f2500] text-white font-bold text-center rounded-lg transition-colors"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CartPage