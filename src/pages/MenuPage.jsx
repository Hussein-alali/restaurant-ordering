import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart, calculateTotal } from '../context/CartContext'
import menuData, { CATS } from '../data/menu'

const ROMAN = ['i', 'ii', 'iii', 'iv']

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
      <circle cx="6.5" cy="6.5" r="4.5" stroke="#8a7a6b" strokeWidth="1.6" />
      <path d="M10 10l3.5 3.5" stroke="#8a7a6b" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function AddBtn({ small, onClick }) {
  const s = small ? 32 : 40
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 flex items-center justify-center rounded-full bg-ink text-white active:scale-90 transition-transform"
      style={{ width: s, height: s }}
      aria-label="Add to cart"
    >
      <svg width={small ? 12 : 14} height={small ? 12 : 14} viewBox="0 0 14 14" fill="none">
        <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  )
}

function FeaturedCard({ item, onAdd }) {
  return (
    <div className="mb-6">
      <div className="relative rounded-2xl overflow-hidden bg-paper-deep" style={{ aspectRatio: '4/3' }}>
        {item.image && (
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={e => { e.target.style.display = 'none' }}
          />
        )}
        <div className="absolute top-3 right-3">
          <span
            className="bg-white rounded-full px-3 py-1.5 text-sm text-ink"
            style={{ fontFamily: 'Fraunces, serif', fontWeight: 600 }}
          >
            ${item.price.toFixed(2)}
          </span>
        </div>
      </div>
      <div className="mt-4 flex items-start gap-3">
        <div className="flex-1">
          <h3
            className="text-ink leading-tight"
            style={{ fontFamily: 'Fraunces, serif', fontSize: 24, fontWeight: 500, letterSpacing: '-0.4px' }}
          >
            {item.name}
          </h3>
          <p className="text-sm text-ink-body leading-relaxed mt-1.5">{item.description}</p>
        </div>
        <AddBtn onClick={() => onAdd(item)} />
      </div>
    </div>
  )
}

function ListRow({ item, onAdd }) {
  return (
    <div className="flex items-center gap-3.5 py-3.5 border-t border-rule">
      <div className="w-[70px] h-[70px] flex-shrink-0 rounded-xl overflow-hidden bg-paper-deep">
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
          style={{ fontFamily: 'Fraunces, serif', fontSize: 17, fontWeight: 500, letterSpacing: '-0.2px' }}
        >
          {item.name}
        </div>
        <div className="text-xs text-ink-body leading-snug mt-0.5 line-clamp-2">{item.description}</div>
        <div
          className="text-ink mt-1"
          style={{ fontFamily: 'Fraunces, serif', fontSize: 14, fontWeight: 600 }}
        >
          ${item.price.toFixed(2)}
        </div>
      </div>
      <AddBtn small onClick={() => onAdd(item)} />
    </div>
  )
}

function MenuPage() {
  const { state, dispatch } = useCart()
  const [activeCategory, setActiveCategory] = useState(CATS[0])
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  const cartCount = state.items.reduce((sum, i) => sum + i.quantity, 0)
  const total = calculateTotal(state.items)
  const serviceType = state.serviceType

  const serviceLabel = {
    Delivery: `$${total.toFixed(2)} · 30 min`,
    'Dine-in': `$${total.toFixed(2)} · at the table`,
    Takeaway: `$${total.toFixed(2)} · pickup 20 min`,
  }

  const searching = searchQuery.trim().length > 0

  const filteredItems = menuData.filter(item => {
    if (searching) return item.name.toLowerCase().includes(searchQuery.toLowerCase())
    return item.category === activeCategory
  })

  const catIndex = CATS.indexOf(activeCategory)

  const addToCart = item => dispatch({ type: 'ADD_ITEM', payload: item })

  return (
    <div className="max-w-xl mx-auto px-5" style={{ paddingBottom: cartCount > 0 ? 120 : 48 }}>
      {/* Hero */}
      <div className="pt-16 pb-5">
        <div className="font-mono text-[10px] text-terra tracking-[2px] uppercase mb-3">
          ◆ Est. 2019 · Open till 11
        </div>
        <div
          className="text-ink leading-none"
          style={{
            fontFamily: 'Fraunces, serif',
            fontSize: 54,
            letterSpacing: '-1.5px',
            fontVariationSettings: '"SOFT" 40',
          }}
        >
          <span style={{ fontStyle: 'italic', fontWeight: 300 }}>tavola</span>
          <span className="font-mono text-muted align-super ml-1.5" style={{ fontSize: 13 }}>
            /ˈtaː.vo.la/
          </span>
        </div>
        <p className="text-sm text-ink-body leading-relaxed mt-3 max-w-xs">
          The table, delivered. A neighborhood trattoria, brought home in{' '}
          <span style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontWeight: 500 }}>
            thirty minutes
          </span>
          .
        </p>
      </div>

      {/* Service type toggle */}
      <div className="pb-4">
        <div
          className="inline-flex gap-0.5 p-1 rounded-full border border-rule"
          style={{ background: '#f3ead8' }}
        >
          {['Delivery', 'Dine-in', 'Takeaway'].map(t => (
            <button
              key={t}
              onClick={() => dispatch({ type: 'SET_SERVICE_TYPE', payload: t })}
              className="text-xs font-semibold px-3.5 py-1.5 rounded-full leading-none transition-all"
              style={{
                color: serviceType === t ? '#fff' : '#5a4a3e',
                background: serviceType === t ? '#1f1813' : 'transparent',
              }}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="font-mono text-[10px] text-muted mt-2" style={{ letterSpacing: '0.5px' }}>
          {serviceType === 'Delivery' && <>→ delivery to <span className="text-ink underline underline-offset-2">your address</span></>}
          {serviceType === 'Dine-in' && <>→ dining <span className="text-ink">at the restaurant</span></>}
          {serviceType === 'Takeaway' && <>→ pickup <span className="text-ink">ready in 20 min</span></>}
        </div>
      </div>

      {/* Search */}
      <div className="mb-1">
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-2xl border border-rule bg-white">
          <SearchIcon />
          <input
            type="text"
            placeholder="search the menu…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="flex-1 text-sm text-ink bg-transparent outline-none placeholder-muted font-mono"
          />
        </div>
      </div>

      {/* Sticky category strip */}
      {!searching && (
        <div
          className="sticky top-0 z-20 -mx-5 px-5 py-3 border-b border-rule mb-0"
          style={{ background: 'rgba(251,246,236,0.93)', backdropFilter: 'blur(8px)' }}
        >
          <div className="flex gap-5 overflow-x-auto scrollbar-hide">
            {CATS.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="relative pb-1.5 whitespace-nowrap flex-shrink-0 transition-colors"
                style={{
                  fontFamily: 'Fraunces, serif',
                  fontSize: 18,
                  fontWeight: 500,
                  letterSpacing: '-0.3px',
                  color: cat === activeCategory ? '#1f1813' : '#8a7a6b',
                  fontStyle: cat === activeCategory ? 'italic' : 'normal',
                }}
              >
                {cat.toLowerCase()}
                {cat === activeCategory && (
                  <span className="absolute left-0 right-0 bottom-0 block h-0.5 bg-terra" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Section header */}
      {!searching && (
        <div className="flex items-baseline justify-between pt-5 pb-3">
          <div>
            <div className="font-mono text-[10px] text-ochre tracking-[2px] uppercase">
              — {ROMAN[catIndex]} —
            </div>
            <div
              className="text-ink mt-0.5"
              style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontWeight: 400, fontSize: 38, letterSpacing: '-0.8px', lineHeight: 1 }}
            >
              {activeCategory}
            </div>
          </div>
          <div className="font-mono text-[11px] text-muted">{filteredItems.length} dishes</div>
        </div>
      )}

      {/* Search header */}
      {searching && (
        <div className="pt-5 pb-3">
          <div className="font-mono text-[10px] text-ochre tracking-[2px] uppercase">— results —</div>
          <div className="font-mono text-[11px] text-muted mt-1">{filteredItems.length} dishes found</div>
        </div>
      )}

      {/* Items */}
      {filteredItems.length === 0 ? (
        <div className="py-16 text-center font-mono text-sm text-muted">no dishes found.</div>
      ) : searching ? (
        filteredItems.map(item => <ListRow key={item.id} item={item} onAdd={addToCart} />)
      ) : (
        <>
          <FeaturedCard item={filteredItems[0]} onAdd={addToCart} />
          {filteredItems.slice(1).map(item => (
            <ListRow key={item.id} item={item} onAdd={addToCart} />
          ))}
        </>
      )}

      {/* Floating cart bar */}
      {cartCount > 0 && (
        <div className="fixed left-0 right-0 bottom-0 z-50 px-4 pb-8">
          <div className="max-w-xl mx-auto">
            <button
              onClick={() => navigate('/cart')}
              className="w-full flex items-center justify-between rounded-2xl px-4 py-3.5 shadow-2xl"
              style={{ background: '#1f1813' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center rounded-full text-white font-semibold text-[13px]"
                  style={{ width: 28, height: 28, background: '#b8391a', flexShrink: 0 }}
                >
                  {cartCount > 99 ? '99+' : cartCount}
                </div>
                <div>
                  <div className="text-[13px] font-medium text-paper">Your table</div>
                  <div className="font-mono text-[10px] text-[#c9b39a]" style={{ letterSpacing: '0.4px' }}>
                    {serviceLabel[serviceType]}
                  </div>
                </div>
              </div>
              <div style={{ fontFamily: 'Fraunces, serif', fontStyle: 'italic', fontSize: 16, color: '#fbf6ec' }}>
                review →
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default MenuPage
