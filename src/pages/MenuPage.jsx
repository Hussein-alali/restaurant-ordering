import { useState } from 'react'
import { useCart } from '../context/CartContext'
import menuData from '../data/menu'

function PlusIcon({ className }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function MenuPage() {
  const { state, dispatch } = useCart()
  const [activeCategory, setActiveCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  const categories = ['All', ...new Set(menuData.map(item => item.category))]

  const filteredMenu = menuData.filter(item => {
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  const cartQtyMap = state.items.reduce((acc, item) => {
    acc[item.id] = item.quantity
    return acc
  }, {})

  const addToCart = (item) => {
    dispatch({ type: 'ADD_ITEM', payload: item })
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <section className="mb-10">
        <p className="text-[#ac2d00] text-[11px] font-medium uppercase tracking-[2.2px] mb-3">CURATED SELECTION</p>
        <h1 className="font-display text-[#1b1c19] text-4xl sm:text-5xl font-bold leading-tight tracking-tight mb-4">
          Our Menu
        </h1>
        <p className="text-[#5b4139] text-sm leading-relaxed max-w-lg">
          Experience our seasonal collection where every plate is a canvas of local flavors and artisanal craftsmanship.
        </p>
      </section>

      <div className="sticky top-16 z-20 bg-[rgba(251,249,244,0.92)] backdrop-blur-md border-b border-[#e4e2dd] -mx-6 px-6 mb-8">
        <div className="flex flex-col sm:flex-row gap-4 py-4">
          <input
            type="text"
            placeholder="Search menu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-[#e4e2dd] rounded-lg px-4 py-3 text-[#1b1c19] placeholder-[#a8a29e] focus:outline-none focus:ring-2 focus:ring-[#ac2d00]/25"
          />
          <div className="flex gap-2 overflow-x-auto py-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeCategory === cat
                    ? 'bg-[#ac2d00] text-white shadow-md shadow-[rgba(172,45,0,0.25)]'
                    : 'bg-[#eae8e3] text-[#1b1c19] hover:bg-[#e4e2dd]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filteredMenu.length === 0 ? (
        <div className="text-center py-20 text-[#5b4139]">No items found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredMenu.map(item => (
            <article key={item.id} className="group relative flex flex-col bg-[#f5f3ee] rounded-3xl overflow-hidden transition-shadow duration-300 hover:shadow-lg hover:shadow-[rgba(0,0,0,0.08)]">
              <div className="relative h-52 overflow-hidden flex-shrink-0">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => { e.target.style.display = 'none' }}
                />
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 bg-[rgba(251,249,244,0.9)] backdrop-blur-md text-[#ac2d00] text-xs font-bold rounded-full font-display">
                    ${item.price.toFixed(2)}
                  </span>
                </div>
                {cartQtyMap[item.id] > 0 && (
                  <div className="absolute top-4 left-4">
                    <span className="w-6 h-6 flex items-center justify-center bg-[#ac2d00] text-white text-xs font-bold rounded-full shadow">
                      {cartQtyMap[item.id]}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-5 flex flex-col flex-1">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <h3 className="font-display text-[#1b1c19] text-lg font-bold leading-tight truncate">{item.name}</h3>
                    <p className="text-[#9c4329] text-[10px] font-medium uppercase tracking-wider mt-0.5">{item.category}</p>
                  </div>
                  <button
                    onClick={() => addToCart(item)}
                    className="flex-shrink-0 w-10 h-10 flex items-center justify-center bg-[#ac2d00] hover:bg-[#8f2500] text-white rounded-2xl transition-all duration-150 active:scale-95 shadow-md shadow-[rgba(172,45,0,0.2)]"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[#5b4139] text-sm leading-relaxed flex-1 line-clamp-3">{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default MenuPage