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

// ─── Admin UI (simple) ───────────────────────────────────
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
  .badge { display: inline-block; padding: 3px 10px; border-radius: 99px; font-size: 11px; font-weight: 700 }
  .badge.pending { background: #fde6a8; color: #7a0d05 }
  .badge.preparing { background: #dbeafe; color: #1d4ed8 }
  .badge.on_the_way { background: #dcfce7; color: #166534 }
  .badge.delivered { background: #e6f4ec; color: #1f7a3f }
  .badge.cancelled { background: #fee2e2; color: #991b1b }
  select { padding: 4px 8px; border-radius: 6px; border: 1px solid #ead8bf; font-size: 12px; cursor: pointer }
  .meta { font-size: 12px; color: #9a8674; margin-top: 4px }
  .total { font-size: 18px; font-weight: 800; color: #a8160c }
  h2 { font-size: 15px; font-weight: 800; margin-bottom: 12px; color: #5b4636 }
  #loading { text-align: center; padding: 40px; color: #9a8674 }
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

<script>
const STATUS_AR = { pending: 'قيد الانتظار', preparing: 'جاري التحضير', on_the_way: 'في الطريق', delivered: 'تم التوصيل', cancelled: 'ملغي' }
const STATUS_VALS = Object.keys(STATUS_AR)

async function show(tab) {
  document.querySelectorAll('nav button').forEach((b,i) => b.classList.toggle('active', (i===0&&tab==='orders')||(i===1&&tab==='customers')))
  document.getElementById('main').innerHTML = '<div id="loading">جاري التحميل…</div>'
  if (tab === 'orders') await loadOrders()
  else await loadCustomers()
}

async function loadOrders() {
  const data = await fetch('/api/orders').then(r => r.json())
  if (!data.length) { document.getElementById('main').innerHTML = '<div id="loading">لا توجد طلبات بعد</div>'; return }
  document.getElementById('main').innerHTML = '<h2>آخر الطلبات (' + data.length + ')</h2>' +
    data.map(o => \`
    <div class="card">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
        <div>
          <div style="font-weight:800;font-size:15px">#\${o.order_number} · \${o.customer_name}</div>
          <div class="meta">\${o.phone} · \${o.service_type} · \${o.payment_method}</div>
          \${o.address ? '<div class="meta">📍 ' + o.address + '</div>' : ''}
          <div class="meta" style="margin-top:6px">\${JSON.parse(typeof o.items==='string'?o.items:JSON.stringify(o.items)).map(i=>i.name+' ×'+i.quantity).join(' · ')}</div>
          \${o.delivery_notes ? '<div class="meta" style="color:#5b4636;font-style:italic">📝 ' + o.delivery_notes + '</div>' : ''}
        </div>
        <div style="text-align:left;flex-shrink:0">
          <div class="total">\${o.total} ج.م</div>
          <div class="meta">\${new Date(o.created_at).toLocaleString('ar-EG')}</div>
        </div>
      </div>
      <div style="margin-top:10px;display:flex;align-items:center;gap:8px">
        <span class="badge \${o.status}">\${STATUS_AR[o.status]||o.status}</span>
        <select onchange="updateStatus(\${o.id}, this.value)">
          \${STATUS_VALS.map(s=>'<option value="'+s+'"'+(s===o.status?' selected':'')+'>'+STATUS_AR[s]+'</option>').join('')}
        </select>
      </div>
    </div>\`).join('')
}

async function loadCustomers() {
  const data = await fetch('/api/customers').then(r => r.json())
  if (!data.length) { document.getElementById('main').innerHTML = '<div id="loading">لا يوجد عملاء بعد</div>'; return }
  document.getElementById('main').innerHTML = '<h2>العملاء (' + data.length + ')</h2>' +
    data.map(c => \`
    <div class="card">
      <div style="font-weight:800;font-size:15px">\${c.name}</div>
      <div class="meta">\${c.phone}</div>
      \${c.address ? '<div class="meta">📍 ' + c.address + '</div>' : ''}
      <div class="meta">انضم: \${new Date(c.created_at).toLocaleString('ar-EG')}</div>
    </div>\`).join('')
}

async function updateStatus(id, status) {
  await fetch('/api/orders/'+id+'/status', { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({status}) })
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
