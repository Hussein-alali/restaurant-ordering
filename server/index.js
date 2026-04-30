import express from 'express'
import cors from 'cors'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createOrder, getOrders, getOrderById, updateOrderStatus, getCustomers, getCustomerWithOrders, getCustomerByPhone } from './db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = process.env.PORT || 3001
const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TG_CHAT  = process.env.TELEGRAM_CHAT_ID

async function sendTelegram(orderId, orderNumber, data) {
  if (!TG_TOKEN || !TG_CHAT) {
    console.error('Telegram: missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID')
    return
  }
  const { customerName, phone, address, items, totalPrice, deliveryNotes, serviceType, paymentMethod } = data

  const itemLines = items
    .map(i => `• ${i.name} ×${i.quantity} — ${Number(i.price) * Number(i.quantity)} ج.م`)
    .join('\n')

  const lines = [
    '🍽️ <b>طلب جديد!</b>',
    `🔢 <b>${orderNumber}</b>`,
    '',
    '👤 <b>العميل</b>',
    `الاسم: ${customerName}`,
    `📞 ${phone}`,
  ]
  if (address)       lines.push(`📍 ${address}`)
  if (serviceType)   lines.push(`النوع: ${serviceType}`)
  if (paymentMethod) lines.push(`الدفع: ${paymentMethod}`)
  if (deliveryNotes) lines.push(`📝 <i>${deliveryNotes}</i>`)
  lines.push('', '📦 <b>الأصناف</b>', itemLines, '', `💰 <b>الإجمالي: ${Number(totalPrice) + 15} ج.م</b>`)

  const keyboard = {
    inline_keyboard: [
      [
        { text: '👨‍🍳 جاري التحضير', callback_data: `st:${orderId}:preparing` },
        { text: '🛵 في الطريق',      callback_data: `st:${orderId}:on_the_way` },
      ],
      [
        { text: '✅ تم التوصيل', callback_data: `st:${orderId}:delivered` },
        { text: '🚫 ملغي',       callback_data: `st:${orderId}:cancelled` },
      ],
    ],
  }

  const res  = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: TG_CHAT,
      text: lines.join('\n'),
      parse_mode: 'HTML',
      reply_markup: keyboard,
    }),
  }).catch(err => { console.error('Telegram fetch error:', err.message); return null })

  if (res && !res.ok) {
    const err = await res.json().catch(() => ({}))
    console.error('Telegram API error:', JSON.stringify(err))
  } else {
    console.log(`✅ Telegram sent for order ${orderNumber}`)
  }
}

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

    sendTelegram(id, orderNumber, data)

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

// ─── Telegram Bot Webhook ────────────────────────────────
app.post('/telegram-webhook', async (req, res) => {
  res.sendStatus(200)
  const update = req.body
  const STATUS_AR = { preparing: '👨‍🍳 جاري التحضير', on_the_way: '🛵 في الطريق', delivered: '✅ تم التوصيل', cancelled: '🚫 ملغي' }

  if (update.callback_query) {
    const cbq = update.callback_query
    const [, orderId, newStatus] = cbq.data.split(':')
    if (orderId && newStatus) {
      await updateOrderStatus(Number(orderId), newStatus).catch(() => {})
      await fetch(`https://api.telegram.org/bot${TG_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: cbq.id, text: STATUS_AR[newStatus] || 'تم التحديث', show_alert: false }),
      }).catch(() => {})
    }
    return
  }

  if (update.message?.text) {
    const msg    = update.message
    const chatId = msg.chat.id
    const parts  = msg.text.trim().split(/\s+/)
    const cmd    = parts[0].toLowerCase()
    const arg    = parts.slice(1).join(' ').trim()

    const reply = (text) => fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    }).catch(() => {})

    if (cmd === '/orders' || cmd === '/طلبات') {
      const orders = await getOrders({ limit: 20, status: arg || undefined })
      if (!orders.length) return reply('لا توجد طلبات.')
      const statusAr = { pending: '⏳', preparing: '👨‍🍳', on_the_way: '🛵', delivered: '✅', cancelled: '🚫' }
      const lines = orders.map(o =>
        `*#${o.order_number}* — ${o.customer_name}\n📞 ${o.phone} | ${o.total} ج.م | ${statusAr[o.status] || o.status}\n${o.items.map(i => `${i.name} ×${i.quantity}`).join('، ')}`
      ).join('\n\n')
      return reply(`📋 *آخر الطلبات*\n\n${lines}`)
    }

    if (cmd === '/summary' || cmd === '/ملخص') {
      const orders = await getOrders({ limit: 500 })
      const total  = orders.reduce((s, o) => s + Number(o.total), 0)
      const byStatus = {}
      orders.forEach(o => { byStatus[o.status] = (byStatus[o.status] || 0) + 1 })
      const statusAr = { pending: '⏳ انتظار', preparing: '👨‍🍳 تحضير', on_the_way: '🛵 في الطريق', delivered: '✅ تم', cancelled: '🚫 ملغي' }
      const lines = Object.entries(byStatus).map(([s, c]) => `${statusAr[s] || s}: *${c}*`).join('\n')
      return reply(`📊 *ملخص الطلبات*\n\n${lines}\n\n💰 *الإجمالي: ${total.toLocaleString()} ج.م*\n📦 *العدد: ${orders.length}*`)
    }

    if ((cmd === '/customer' || cmd === '/عميل') && arg) {
      const customer = await getCustomerByPhone(arg)
      if (!customer) return reply('❌ العميل مش موجود.')
      const totalSpent = customer.orders.reduce((s, o) => s + Number(o.total), 0)
      const statusAr = { pending: '⏳', preparing: '👨‍🍳', on_the_way: '🛵', delivered: '✅', cancelled: '🚫' }
      const orderLines = customer.orders.slice(0, 5).map(o =>
        `${statusAr[o.status] || ''} *#${o.order_number}* — ${o.total} ج.م\n${o.items.map(i => `${i.name} ×${i.quantity}`).join('، ')}`
      ).join('\n\n')
      return reply(`👤 *${customer.name}*\n📞 ${customer.phone}${customer.address ? '\n📍 ' + customer.address : ''}\n\n📦 عدد الطلبات: *${customer.orders.length}*\n💰 إجمالي الإنفاق: *${totalSpent} ج.م*${customer.orders.length ? '\n\n*آخر الطلبات:*\n\n' + orderLines : ''}`)
    }

    return reply('🤖 *Crepe Corner Bot*\n\nالأوامر:\n`/orders` — آخر 20 طلب\n`/orders pending` — فلتر بالحالة\n`/summary` — ملخص وإجماليات\n`/customer 01012345678` — بيانات عميل')
  }
})

// ─── Customers ───────────────────────────────────────────
app.get('/api/customers', async (req, res) => {
  const { limit, offset } = req.query
  res.json(await getCustomers({ limit: Number(limit) || 50, offset: Number(offset) || 0 }))
})

app.get('/api/customers/by-phone/:phone', async (req, res) => {
  const customer = await getCustomerByPhone(req.params.phone)
  if (!customer) return res.status(404).json({ error: 'العميل مش موجود' })
  res.json(customer)
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
<script src="https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js"></script>
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
  .btn-reset { background: #f4b528; color: #1a0e08; border: none; border-radius: 8px; padding: 7px 14px; font-size: 12px; font-weight: 700; cursor: pointer; align-self: flex-end }
  .btn-excel { background: #1d6f42; color: #fff; border: none; border-radius: 8px; padding: 7px 14px; font-size: 12px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; margin-right: auto }
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
  <button class="btn-excel" onclick="exportExcel()">📊 تصدير Excel</button>
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

async function exportExcel() {
  const [ordersRaw, customersRaw] = await Promise.all([
    fetch('/api/orders?limit=5000').then(r => r.json()),
    fetch('/api/customers?limit=5000').then(r => r.json()),
  ])

  const STATUS_AR = { pending: 'قيد الانتظار', preparing: 'جاري التحضير', on_the_way: 'في الطريق', delivered: 'تم التوصيل', cancelled: 'ملغي' }

  const ordersSheet = ordersRaw.map(o => ({
    'رقم الطلب':       o.order_number,
    'اسم العميل':      o.customer_name,
    'التليفون':        o.phone,
    'العنوان':         o.address || '',
    'نوع الخدمة':      o.service_type,
    'طريقة الدفع':     o.payment_method,
    'الأصناف':         (Array.isArray(o.items) ? o.items : JSON.parse(o.items)).map(i => \`\${i.name} ×\${i.quantity}\`).join(' | '),
    'المجموع':         o.subtotal,
    'رسوم التوصيل':    o.delivery_fee,
    'الإجمالي':        o.total,
    'ملاحظات':         o.delivery_notes || '',
    'الحالة':          STATUS_AR[o.status] || o.status,
    'التاريخ':         new Date(o.created_at).toLocaleString('ar-EG'),
  }))

  const customersSheet = customersRaw.map(c => ({
    'الاسم':        c.name,
    'التليفون':     c.phone,
    'العنوان':      c.address || '',
    'تاريخ التسجيل': new Date(c.created_at).toLocaleString('ar-EG'),
  }))

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ordersSheet),    'الطلبات')
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(customersSheet), 'العملاء')

  const date = new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')
  XLSX.writeFile(wb, \`crepe-corner-\${date}.xlsx\`)
}
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
