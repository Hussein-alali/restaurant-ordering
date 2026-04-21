import { Link } from 'react-router-dom'
import { useCart, calculateTotal } from '../context/CartContext'

function ShoppingBagIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm6.75 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  )
}

function Layout({ children }) {
  const { state } = useCart()
  const cartCount = state.items.reduce((sum, item) => sum + item.quantity, 0)
  const total = calculateTotal(state.items)

  return (
    <div className="min-h-screen flex flex-col bg-[#fbf9f4]">
      <header className="sticky top-0 z-30 bg-[rgba(250,250,249,0.85)] backdrop-blur-md border-b border-[#e4e2dd]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="font-display text-[#7c2d12] text-xl font-extrabold tracking-tight">
            The Sensory Gallery
          </Link>
          <Link
            to="/cart"
            className="relative p-2 rounded-full text-[#1b1c19] hover:bg-[#e4e2dd] transition-colors"
            aria-label={`Cart with ${cartCount} items`}
          >
            <ShoppingBagIcon className="w-5 h-5" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[1.1rem] h-[1.1rem] flex items-center justify-center bg-[#ac2d00] text-white text-[10px] font-bold rounded-full px-0.5">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="bg-[#1b1c19] text-[#fbf9f4] py-8">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="font-display text-lg font-bold mb-2">The Sensory Gallery</p>
          <p className="text-sm text-[#a8a29e]">123 Culinary Street, Food City FC 12345</p>
          <p className="text-sm text-[#a8a29e]">Phone: (555) 123-4567</p>
        </div>
      </footer>
    </div>
  )
}

export default Layout