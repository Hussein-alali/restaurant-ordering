import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import menuData, { ADDONS } from '../data/menu'

const ALL_MENU = [...menuData, ...ADDONS]
const imageByName = (name) => ALL_MENU.find(m => m.name === name)?.image || null

const C = {
  red: '#a8160c', bg: '#f5ece0', card: '#ffffff',
  ink: '#1a0e08', body: '#5b4636', muted: '#9a8674', rule: '#ead8bf',
}
const arNum = (n) => Number(n).toLocaleString('ar-EG')
const egp   = (n) => `${arNum(n)} ج.م`

const STATUS = {
  pending:    { label: 'قيد الانتظار', bg: '#fde6a8', color: '#7a0d05' },
  preparing:  { label: 'جاري التحضير', bg: '#dbeafe', color: '#1d4ed8' },
  on_the_way: { label: 'في الطريق',    bg: '#dcfce7', color: '#166534' },
  delivered:  { label: 'تم التوصيل',   bg: '#e6f4ec', color: '#1f7a3f' },
  cancelled:  { label: 'ملغي',          bg: '#fee2e2', color: '#991b1b' },
}

export default function MyOrdersPage() {
  const navigate = useNavigate()
  const { dispatch } = useCart()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [noPhone, setNoPhone] = useState(false)

  useEffect(() => {
    const phone = (() => { try { return JSON.parse(localStorage.getItem('cc_customer') || '{}').phone || '' } catch { return '' } })()
    if (!phone) { setNoPhone(true); setLoading(false); return }
    fetch(`/api/customers/by-phone/${encodeURIComponent(phone)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: C.bg, direction: 'rtl', fontFamily: '"Cairo", system-ui, sans-serif' }}>
      <div style={{ background: C.red, color: '#fff', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: '#fff', fontSize: 22, cursor: 'pointer', lineHeight: 1 }}>‹</button>
        <div style={{ fontSize: 17, fontWeight: 900 }}>طلباتي</div>
      </div>

      <div style={{ padding: '20px 16px', maxWidth: 480, margin: '0 auto' }}>
        {loading && <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>جاري التحميل…</div>}

        {noPhone && (
          <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🛵</div>
            <div style={{ fontWeight: 700 }}>لازم تعمل طلب الأول عشان تشوف طلباتك.</div>
          </div>
        )}

        {data && data.orders.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: C.muted }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🍽️</div>
            <div style={{ fontWeight: 700 }}>لا توجد طلبات بعد.</div>
          </div>
        )}

        {data && data.orders.length > 0 && (
          <>
            {data.orders.map(order => {
              const st    = STATUS[order.status] || { label: order.status, bg: '#eee', color: '#333' }
              const items = Array.isArray(order.items) ? order.items : JSON.parse(order.items)
              return (
                <div key={order.id} style={{ background: C.card, border: `1px solid ${C.rule}`, borderRadius: 14, padding: 16, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 14, color: C.ink }}>#{order.order_number}</div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                        {new Date(order.created_at).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </div>
                    <div style={{ fontWeight: 900, fontSize: 16, color: C.red }}>{egp(order.total)}</div>
                  </div>
                  <div style={{ margin: '10px 0', fontSize: 13, color: C.body }}>
                    {items.map(i => `${i.name} ×${arNum(i.quantity)}`).join(' · ')}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                    <div style={{ display: 'inline-block', padding: '3px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color }}>
                      {st.label}
                    </div>
                    <button
                      onClick={() => {
                        dispatch({ type: 'CLEAR_CART' })
                        items.forEach(i => dispatch({ type: 'ADD_ITEM', payload: { ...i, image: i.image || imageByName(i.name) } }))
                        navigate('/cart')
                      }}
                      style={{ background: C.red, color: '#fff', border: 'none', borderRadius: 8, padding: '5px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}
                    >🔁 إعادة الطلب</button>
                  </div>
                </div>
              )
            })}
          </>
        )}
      </div>
    </div>
  )
}
