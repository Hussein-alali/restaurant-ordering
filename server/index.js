import express from 'express'
import cors from 'cors'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createOrder, getOrders, getOrderById, updateOrderStatus, getCustomers, getCustomerWithOrders, getCustomerByPhone, getProducts, createProduct, updateProduct, deleteProduct } from './db.js'

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

// ─── Products API ─────────────────────────────────────────
app.get('/api/products', async (req, res) => {
  res.json(await getProducts())
})

app.post('/api/products', async (req, res) => {
  try {
    const product = await createProduct(req.body)
    res.status(201).json(product)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'خطأ في الخادم' })
  }
})

app.put('/api/products/:id', async (req, res) => {
  try {
    const product = await updateProduct(Number(req.params.id), req.body)
    if (!product) return res.status(404).json({ error: 'المنتج مش موجود' })
    res.json(product)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'خطأ في الخادم' })
  }
})

app.delete('/api/products/:id', async (req, res) => {
  await deleteProduct(Number(req.params.id))
  res.json({ ok: true })
})

// ─── Admin UI ────────────────────────────────────────────
app.get('/admin', (_, res) => {
  res.sendFile(join(__dirname, 'admin.html'))
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
