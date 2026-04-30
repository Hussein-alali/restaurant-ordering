import express from 'express'
import cors from 'cors'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createOrder, getOrders, getOrderById, updateOrderStatus, getCustomers, getCustomerWithOrders } from './db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001
const N8N_URL = process.env.VITE_WEBHOOK_URL

app.use(cors())
app.use(express.json())

// ─── Orders ──────────────────────────────────────────────
app.post('/api/orders', async (req, res) => {
  try {
    const data = req.body
    if (!data.customerName || !data.phone || !data.items?.length) {
      return res.status(400).json({ error: 'بيانات ناقصة' })
    }

    const { id, orderNumber } = await createOrder(data)

    // Forward to n8n if configured (fire-and-forget)
    if (N8N_URL) {
      fetch(N8N_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, orderNumber }),
      }).catch(() => {})
    }

    res.status(201).json({ id, orderNumber })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'خطأ في الخادم' })
  }
})

app.get('/api/orders', async (req, res) => {
  const { limit, offset, status } = req.query
  res.json(await getOrders({ limit: Number(limit) || 50, offset: Number(offset) || 0, status }))
})

app.get('/api/orders/:id', async (req, res) => {
  const order = await getOrderById(Number(req.params.id))
  if (!order) return res.status(404).json({ error: 'الطلب مش موجود' })
  res.json(order)
})

app.patch('/api/orders/:id/status', async (req, res) => {
  const { status } = req.body
  const valid = ['pending', 'preparing', 'on_the_way', 'delivered', 'cancelled']
  if (!valid.includes(status)) return res.status(400).json({ error: 'status غير صحيح' })
  await updateOrderStatus(Number(req.params.id), status)
  res.json({ ok: true })
})

// ─── Customers ───────────────────────────────────────────
app.get('/api/customers', async (req, res) => {
  const { limit, offset } = req.query
  res.json(await getCustomers({ limit: Number(limit) || 50, offset: Number(offset) || 0 }))
})

app.get('/api/customers/:id', async (req, res) => {
  const customer = await getCustomerWithOrders(Number(req.params.id))
  if (!customer) return res.status(404).json({ error: 'العميل مش موجود' })
  res.json(customer)
})

// ─── Admin UI ────────────────────────────────────────────
app.get('/admin', (_, res) => {
  res.send(`<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Crepe Corner — Admin</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0 }
  body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5ece0; color: #1a0e08; direction: rtl }
  header { background: #a8160c; color: #fff; padding: 16px 24px; display: flex; align-items: center; gap: 12px }
  header h1 { font-size: 18px }
  nav { background: #7a0d05; display: flex; gap: 2px; padding: 0 24px }
  nav button { background: transparent; color: rgba(255,255,255,0.7); border: none; padding: 10px 16px; cursor: pointer; font-size: 13px; font-weight: 600 }
  nav button.active { color: #f4b528; border-bottom: 2px solid #f4b528 }
  main { padding: 20px 24px }
  .card { background: #fff; border-radius: 12px; padding: 16px; margin-bottom: 12px; border: 1px solid #ead8bf }
  .card-clickable { cursor: pointer; transition: box-shadow .15s }
  .card-clickable:hover { box-shadow: 0 2px 12px rgba(168,22,12,.12) }
  .badge { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 700 }
  .badge.pending    { background: #fde6a8; color: #7a0d05 }
  .badge.preparing  { background: #dbeafe; color: #1d4ed8 }
  .badge.on_the_way { background: #dcfce7; color: #166534 }
  .badge.delivered  { background: #e6f4ec; color: #1f7a3f }
  .badge.cancelled  { background: #fee2e2; color: #991b1b }
  select,input[type=date] { padding: 6px 10px; border-radius: 8px; border: 1px solid #ead8bf; font-size: 13px; cursor: pointer; background: #fff; font-family: inherit }
  .meta { font-size: 12px; color: #9a8674; margin-top: 4px }
  .price { font-size: 18px; font-weight: 800; color: #a8160c }
  h2 { font-size: 15px; font-weight: 800; margin-bottom: 12px; color: #5b4636 }
  #loading { text-align: center; padding: 40px; color: #9a8674 }
  .filters { background: #fff; border: 1px solid #ead8bf; border-radius: 12px; padding: 14px 16px; margin-bottom: 14px; display: flex; gap: 10px; flex-wrap: wrap; align-items: center }
  .filters label { font-size: 12px; color: #5b4636; font-weight: 600 }
  .filters-group { display: flex; flex-direction: column; gap: 4px }
  .summary { background: #a8160c; color: #fff; border-radius: 12px; padding: 14px 20px; margin-bottom: 14px; display: flex; gap: 28px; align-items: center }
  .summary-item { text-align: center }
  .summary-item .val { font-size: 22px; font-weight: 900 }
  .summary-item .lbl { font-size: 11px; opacity: .8; margin-top: 2px }
  .btn-reset { background: #f4b528; color: #1a0e08; border: none; border-radius: 8px; padding: 7px 14px; font-size: 12px; font-weight: 700; cursor: pointer }
  .modal-backdrop { display:none; position:fixed; inset:0; background:rgba(0,0,0,.45); z-index:100; justify-content:center; align-items:flex-start; padding-top: 40px }
  .modal-backdrop.open { display:flex }
  .modal { background:#fff; border-radius:16px; width:min(95vw,580px); max-height:80vh; overflow-y:auto; padding:24px }
  .modal-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:16px }
  .modal-header h3 { font-size:16px; font-weight:800; color:#a8160c }
  .close-btn { background:none; border:none; font-size:20px; cursor:pointer; color:#9a8674 }
  .order-mini { border:1px solid #ead8bf; border-radius:10px; padding:12px; margin-bottom:10px }
  .divider { height:1px; background:#ead8bf; margin: 6px 0 }
</style>
</head>
<body>
<header>
  <div style="width:36px;height:36px;background:#f4b528;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px;color:#1a0e08">CC</div>
  <h1>Crepe Corner — لوحة التحكم</h1>
</header>
<nav>
  <button class="active" onclick="show('orders')">الطلبات</button>
  <button onclick="show('customers')">العملاء</button>
</nav>
<main id="main"><div id="loading">جاري التحميل…</div></main>

<!-- Customer modal -->
<div class="modal-backdrop" id="modal" onclick="closeModal(event)">
  <div class="modal">
    <div class="modal-header">
      <h3 id="modal-title">بيانات العميل</h3>
      <button class="close-btn" onclick="document.getElementById('modal').classList.remove('open')">✕</button>
    </div>
    <div id="modal-body"></div>
  </div>
</div>

<script>
const STATUS_AR = { pending: 'قيد الانتظار', preparing: 'جاري التحضير', on_the_way: 'في الطريق', delivered: 'تم التوصيل', cancelled: 'ملغي' }
const STATUS_VALS = Object.keys(STATUS_AR)
let allOrders = []

async function show(tab) {
  document.querySelectorAll('nav button').forEach((b,i) => b.classList.toggle('active', (i===0&&tab==='orders')||(i===1&&tab==='customers')))
  document.getElementById('main').innerHTML = '<div id="loading">جاري التحميل…</div>'
  if (tab === 'orders') await loadOrders()
  else await loadCustomers()
}

// ─── Orders ──────────────────────────────────────────────
async function loadOrders() {
  allOrders = await fetch('/api/orders?limit=500').then(r => r.json())
  renderFilters()
  applyFilters()
}

function renderFilters() {
  const f = document.createElement('div')
  f.id = 'filters-bar'
  f.className = 'filters'
  f.innerHTML = \`
    <div class="filters-group">
      <label>من تاريخ</label>
      <input type="date" id="f-from" onchange="applyFilters()">
    </div>
    <div class="filters-group">
      <label>إلى تاريخ</label>
      <input type="date" id="f-to" onchange="applyFilters()">
    </div>
    <div class="filters-group">
      <label>الحالة</label>
      <select id="f-status" onchange="applyFilters()">
        <option value="">الكل</option>
        \${STATUS_VALS.map(s=>\`<option value="\${s}">\${STATUS_AR[s]}</option>\`).join('')}
      </select>
    </div>
    <button class="btn-reset" onclick="resetFilters()">مسح الفلاتر</button>
  \`
  document.getElementById('main').innerHTML = ''
  document.getElementById('main').appendChild(f)
  document.getElementById('main').insertAdjacentHTML('beforeend', '<div id="summary-bar"></div><div id="orders-list"></div>')
}

function applyFilters() {
  const from   = document.getElementById('f-from')?.value
  const to     = document.getElementById('f-to')?.value
  const status = document.getElementById('f-status')?.value

  let filtered = allOrders.filter(o => {
    const d = new Date(o.created_at)
    if (from && d < new Date(from)) return false
    if (to   && d > new Date(to + 'T23:59:59')) return false
    if (status && o.status !== status) return false
    return true
  })

  const totalPrice = filtered.reduce((s, o) => s + Number(o.total), 0)

  document.getElementById('summary-bar').innerHTML = \`
    <div class="summary">
      <div class="summary-item"><div class="val">\${filtered.length}</div><div class="lbl">طلب</div></div>
      <div style="width:1px;background:rgba(255,255,255,.3);height:36px"></div>
      <div class="summary-item"><div class="val">\${totalPrice.toLocaleString('ar-EG')} ج.م</div><div class="lbl">إجمالي المبيعات</div></div>
    </div>
  \`

  if (!filtered.length) {
    document.getElementById('orders-list').innerHTML = '<div id="loading">لا توجد طلبات بهذه الفلاتر</div>'
    return
  }

  document.getElementById('orders-list').innerHTML = filtered.map(o => \`
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
        <div>
          <div style="font-weight:800;font-size:15px">#\${o.order_number} · \${o.customer_name}</div>
          <div class="meta">\${o.phone} · \${o.service_type} · \${o.payment_method}</div>
          \${o.address ? '<div class="meta">📍 ' + o.address + '</div>' : ''}
          <div class="meta" style="margin-top:6px">\${(Array.isArray(o.items)?o.items:JSON.parse(o.items)).map(i=>i.name+' ×'+i.quantity).join(' · ')}</div>
          \${o.delivery_notes ? '<div class="meta" style="color:#5b4636;font-style:italic">📝 ' + o.delivery_notes + '</div>' : ''}
        </div>
        <div style="text-align:left;flex-shrink:0">
          <div class="price">\${o.total} ج.م</div>
          <div class="meta">\${new Date(o.created_at).toLocaleString('ar-EG')}</div>
        </div>
      </div>
      <div style="margin-top:10px;display:flex;align-items:center;gap:8px">
        <span class="badge \${o.status}">\${STATUS_AR[o.status]||o.status}</span>
        <select onchange="updateStatus(\${o.id}, this.value)">
          \${STATUS_VALS.map(s=>'<option value="'+s+'"'+(s===o.status?' selected':'')+'>'+STATUS_AR[s]+'</option>').join('')}
        </select>
      </div>
    </div>
  \`).join('')
}

function resetFilters() {
  document.getElementById('f-from').value = ''
  document.getElementById('f-to').value = ''
  document.getElementById('f-status').value = ''
  applyFilters()
}

// ─── Customers ───────────────────────────────────────────
async function loadCustomers() {
  const data = await fetch('/api/customers?limit=500').then(r => r.json())
  if (!data.length) { document.getElementById('main').innerHTML = '<div id="loading">لا يوجد عملاء بعد</div>'; return }
  document.getElementById('main').innerHTML =
    '<h2 style="margin-bottom:12px">العملاء (' + data.length + ')</h2>' +
    data.map(c => \`
      <div class="card card-clickable" onclick="openCustomer(\${c.id})">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-weight:800;font-size:15px">\${c.name}</div>
            <div class="meta">\${c.phone}</div>
            \${c.address ? '<div class="meta">📍 ' + c.address + '</div>' : ''}
          </div>
          <div style="color:#a8160c;font-size:20px">›</div>
        </div>
      </div>
    \`).join('')
}

async function openCustomer(id) {
  document.getElementById('modal-body').innerHTML = '<div style="text-align:center;padding:30px;color:#9a8674">جاري التحميل…</div>'
  document.getElementById('modal').classList.add('open')

  const data = await fetch('/api/customers/' + id).then(r => r.json())
  document.getElementById('modal-title').textContent = data.name + ' — ' + data.phone

  const totalSpent = data.orders.reduce((s, o) => s + Number(o.total), 0)

  document.getElementById('modal-body').innerHTML = \`
    \${data.address ? '<div class="meta" style="margin-bottom:10px">📍 ' + data.address + '</div>' : ''}
    <div style="display:flex;gap:20px;margin-bottom:16px">
      <div><div style="font-size:20px;font-weight:900;color:#a8160c">\${data.orders.length}</div><div class="meta">طلب</div></div>
      <div><div style="font-size:20px;font-weight:900;color:#a8160c">\${totalSpent.toLocaleString('ar-EG')} ج.م</div><div class="meta">إجمالي الإنفاق</div></div>
    </div>
    <div class="divider"></div>
    <div style="margin-top:12px">
      \${data.orders.length === 0 ? '<div class="meta">لا توجد طلبات</div>' :
        data.orders.map(o => \`
          <div class="order-mini">
            <div style="display:flex;justify-content:space-between">
              <div style="font-weight:700">#\${o.order_number}</div>
              <div style="font-weight:800;color:#a8160c">\${o.total} ج.م</div>
            </div>
            <div class="meta">\${new Date(o.created_at).toLocaleString('ar-EG')}</div>
            <div class="meta" style="margin-top:4px">\${(Array.isArray(o.items)?o.items:JSON.parse(o.items)).map(i=>i.name+' ×'+i.quantity).join(' · ')}</div>
            <div style="margin-top:6px"><span class="badge \${o.status}">\${STATUS_AR[o.status]||o.status}</span></div>
          </div>
        \`).join('')
      }
    </div>
  \`
}

function closeModal(e) {
  if (e.target.id === 'modal') document.getElementById('modal').classList.remove('open')
}

async function updateStatus(id, status) {
  await fetch('/api/orders/'+id+'/status', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({status}) })
  applyFilters()
}

show('orders')
setInterval(() => { if (document.querySelector('nav button.active').textContent.includes('طلب')) loadOrders() }, 15000)
</script>
</body>
</html>`)
})

// Serve React build
const staticDir = join(__dirname, '../docs')
app.use(express.static(staticDir))
app.use((req, res) => {
  res.sendFile(join(staticDir, 'index.html'))
})

app.listen(PORT, () => {
  console.log(`\n✅ Crepe Corner server running`)
  console.log(`   API:   http://localhost:${PORT}/api/orders`)
  console.log(`   Admin: http://localhost:${PORT}/admin\n`)
})
