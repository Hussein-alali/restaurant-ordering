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

app.post('/api/products/seed', async (req, res) => {
  const cU = (id) => `https://images.unsplash.com/photo-${id}?w=800&q=80&auto=format&fit=crop`
  const IMG = {
    crepe:    '/chicken_crepe.jpg',
    pizza:    cU('1628840042765-356cda07504e'),
    burger:   cU('1508736793122-f516e3ba5569'),
    shawarma: cU('1530469912745-a215c6b256ea'),
    fries:    cU('1573080496219-bb080dd4f877'),
    sauce:    cU('1571091718767-18b5b1457add'),
  }
  const CAT_AR = {
    'crepe-chicken': 'كريب فراخ', 'crepe-meat': 'كريب لحوم', 'crepe-mix': 'كريب ميكس',
    pizza: 'بيتزا كورنر', burger: 'بيف برجر', shawarma: 'الشاورما', meals: 'وجبات', additions: 'الإضافات',
  }
  const items = [
    { name:'كريب بانيه (ناجيتس)',       price:80,  image:IMG.crepe,    cat:'crepe-chicken' },
    { name:'كريب كرسبي (ناجيتس / حار)', price:90,  image:IMG.crepe,    cat:'crepe-chicken' },
    { name:'كريب شيش',                  price:125, image:IMG.crepe,    cat:'crepe-chicken' },
    { name:'كريب استرس (حار)',           price:130, image:IMG.crepe,    cat:'crepe-chicken' },
    { name:'كريب فاهيتا فراخ',          price:125, image:IMG.crepe,    cat:'crepe-chicken' },
    { name:'كريب زنجر (حار)',            price:130, image:IMG.crepe,    cat:'crepe-chicken' },
    { name:'كريب شاورما سوري',           price:130, image:IMG.crepe,    cat:'crepe-chicken' },
    { name:'كريب سوبر كرانشي',           price:130, image:IMG.crepe,    cat:'crepe-chicken' },
    { name:'كريب شيش استرس',             price:135, image:IMG.crepe,    cat:'crepe-chicken' },
    { name:'كريب البروفيسور',            price:150, image:IMG.crepe,    cat:'crepe-chicken' },
    { name:'كريب سوسيس',               price:110, image:IMG.crepe,    cat:'crepe-meat' },
    { name:'كريب هوت دوج',             price:110, image:IMG.crepe,    cat:'crepe-meat' },
    { name:'كريب كفته',                price:125, image:IMG.crepe,    cat:'crepe-meat' },
    { name:'كريب سجق',                 price:120, image:IMG.crepe,    cat:'crepe-meat' },
    { name:'كريب بسطرمة',              price:150, image:IMG.crepe,    cat:'crepe-meat' },
    { name:'كريب لحم مفروم',           price:125, image:IMG.crepe,    cat:'crepe-meat' },
    { name:'كريب برجر لحم',            price:125, image:IMG.crepe,    cat:'crepe-meat' },
    { name:'كريب ميكس فراخ',          price:125, image:IMG.crepe,    cat:'crepe-mix', desc:'شيش · استرس · بانيه ناجيتس · فلفل · طماطم · كاتشب ومايونيز' },
    { name:'كريب ميكس لحوم',          price:130, image:IMG.crepe,    cat:'crepe-mix', desc:'لحم مفروم · سوسيس · سجق · موزريلا · فلفل · طماطم · كاتشب ومايونيز' },
    { name:'كريب كورنر',              price:160, image:IMG.crepe,    cat:'crepe-mix', desc:'سجق · لحم مفروم · سوسيس · بانيه · شيش · استرس · بطاطس · جبنة موزريلا · صوص شيدر' },
    { name:'كريب ابو عبيدة (حار)',    price:130, image:IMG.crepe,    cat:'crepe-mix', desc:'ثلاث قطع صدور فراخ · ثلاث صوانيم موزريلا · جبنة موزريلا' },
    { name:'كريب 777',               price:130, image:IMG.crepe,    cat:'crepe-mix', desc:'شيش مدخن · استرس · سوسيس مكرمل · روز بيف · جبنة موزريلا · صوص شيدر' },
    { name:'اورجينال برجر',          price:125, image:IMG.burger,   cat:'burger',    desc:'قطعة لحم مشوية · خس · طماطم · خيار مخلل · صوص كوكتيل' },
    { name:'تشيز برجر',              price:135, image:IMG.burger,   cat:'burger',    desc:'قطعة لحم مشوية · خس · طماطم · بصل · خيار مخلل · شريحة جبن أمريكانا · صوص كوكتيل' },
    { name:'تشيز تشيز',              price:140, image:IMG.burger,   cat:'burger',    desc:'قطعة لحم مشوية · خس · طماطم · بصل · خيار مخلل · مكس من الجبن · صوص شيدر' },
    { name:'مشروم برجر',             price:145, image:IMG.burger,   cat:'burger',    desc:'قطعة لحم مشوية · خس · طماطم · بصل · مشروم · صوص باربيكيو' },
    { name:'هالبينو برجر',           price:140, image:IMG.burger,   cat:'burger',    desc:'قطعة لحم مشوية · خس · طماطم · فلفل هالبينو حار · صوص شيلي الحار' },
    { name:'بيف بيكو',              price:150, image:IMG.burger,   cat:'burger',    desc:'قطعة لحم مشوية · خس · طماطم · هوت دوج · فلفل ألوان · مشروم · صوص باربيكيو' },
    { name:'بيتزا برجر',            price:150, image:IMG.burger,   cat:'burger',    desc:'عجينة كورنر الخاصة · قطعة لحم · جبنة موزريلا · صوص شيدر · فلفل ألوان · زيتون' },
    { name:'بيتزا مارجريتا',        price:125, image:IMG.pizza,    cat:'pizza',     desc:'موتزريلا · زيتون · طماطم · ريحان' },
    { name:'بيتزا خضار',            price:125, image:IMG.pizza,    cat:'pizza',     desc:'موتزريلا · مشروم · فلفل ألوان · طماطم' },
    { name:'بيتزا مكس جبن',         price:145, image:IMG.pizza,    cat:'pizza',     desc:'موتزريلا · كريمة · شيدر · فيتا · زيتون · رومي' },
    { name:'بيتزا مكس فراخ',        price:150, image:IMG.pizza,    cat:'pizza',     desc:'موتزريلا · فراخ مشوية · فلفل ألوان · كاتشب · طماطم' },
    { name:'بيتزا فراخ باربيكيو',   price:150, image:IMG.pizza,    cat:'pizza',     desc:'موتزريلا · فراخ باربيكيو · بصل · فلفل ألوان · صوص باربيكيو' },
    { name:'بيتزا تشيكن رانش',      price:155, image:IMG.pizza,    cat:'pizza',     desc:'موتزريلا · فراخ مشوية · بصل · فلفل ألوان · صوص رانش' },
    { name:'بيتزا استرس',           price:145, image:IMG.pizza,    cat:'pizza',     desc:'موتزريلا · فراخ حار · فلفل حار · صوص شيلي' },
    { name:'بيتزا مكس لحوم',        price:155, image:IMG.pizza,    cat:'pizza',     desc:'موتزريلا · لحوم مشكلة · سجق · سوسيس · فلفل ألوان · طماطم' },
    { name:'بيتزا سوبريم',          price:155, image:IMG.pizza,    cat:'pizza',     desc:'موتزريلا · لحوم مشكلة · خضار متنوعة · فلفل ألوان · طماطم' },
    { name:'بيتزا سوسيس',          price:145, image:IMG.pizza,    cat:'pizza',     desc:'موتزريلا · سوسيس · فلفل ألوان · طماطم · زيتون' },
    { name:'بيتزا نصين (اختيارك)', price:170, image:IMG.pizza,    cat:'pizza',     desc:'نصفين من اختيارك' },
    { name:'بيتزا بيبروني',         price:140, image:IMG.pizza,    cat:'pizza',     desc:'موتزريلا · بيبروني · طماطم · زيتون' },
    { name:'بيتزا زنجر',            price:155, image:IMG.pizza,    cat:'pizza',     desc:'موتزريلا · فراخ زنجر حار · فلفل ألوان · طماطم' },
    { name:'بيتزا سجق',             price:145, image:IMG.pizza,    cat:'pizza',     desc:'موتزريلا · سجق · فلفل ألوان · طماطم · زيتون' },
    { name:'بيتزا مفروم',           price:145, image:IMG.pizza,    cat:'pizza',     desc:'موتزريلا · لحم مفروم · فلفل ألوان · زيتون · طماطم' },
    { name:'بيتزا تشيكن هالبينو',   price:150, image:IMG.pizza,    cat:'pizza',     desc:'موتزريلا · فراخ مشوية · فلفل هالبينو حار · كاتشب · طماطم' },
    { name:'بيتزا جمبري',           price:180, image:IMG.pizza,    cat:'pizza',     desc:'موتزريلا · جمبري · فلفل ألوان · زيتون · طماطم' },
    { name:'بيتزا جمبري رانش',      price:175, image:IMG.pizza,    cat:'pizza',     desc:'موتزريلا · جمبري · صوص رانش · فلفل ألوان · طماطم' },
    { name:'بيتزا تونة',            price:175, image:IMG.pizza,    cat:'pizza',     desc:'موتزريلا · تونة · زيتون · فلفل ألوان · طماطم' },
    { name:'ساندوتش شاورما وسط',      price:75,  image:IMG.shawarma, cat:'shawarma' },
    { name:'ساندوتش شاورما كبير',     price:90,  image:IMG.shawarma, cat:'shawarma' },
    { name:'ساندوتش ميكس شاورما بطاطس', price:85, image:IMG.shawarma, cat:'shawarma' },
    { name:'ساندوتش بطاطس سوري',      price:40,  image:IMG.fries,    cat:'shawarma' },
    { name:'ساندوتش بطاطس موزريلا',   price:60,  image:IMG.fries,    cat:'shawarma' },
    { name:'وجبة عربي',              price:110, image:IMG.sauce,    cat:'meals',    desc:'٦ قطع + تومية + بطاطس + مخلل' },
    { name:'وجبة اكسترا',            price:140, image:IMG.sauce,    cat:'meals',    desc:'٩ قطع + تومية + بطاطس + مخلل' },
    { name:'وجبة الديل',             price:180, image:IMG.sauce,    cat:'meals',    desc:'١٢ قطعة + تومية + بطاطس + مخلل' },
    { name:'فتة شاورما كبير',         price:150, image:IMG.shawarma, cat:'meals' },
    { name:'كيلو الشاورما',           price:700, image:IMG.shawarma, cat:'meals',    desc:'٤ عيش سوري + بطاطس + تومية + كول سلو' },
    { name:'باكت بطاطس',             price:30,  image:IMG.fries,    cat:'additions' },
    { name:'بطاطس شيدر',             price:40,  image:IMG.fries,    cat:'additions' },
    { name:'تشكن كرسبي فرايز',       price:65,  image:IMG.fries,    cat:'additions' },
    { name:'تشيلي تشيز فرايز',       price:65,  image:IMG.fries,    cat:'additions' },
    { name:'كول سلو',                price:15,  image:IMG.sauce,    cat:'additions' },
    { name:'علبة تومية',             price:10,  image:IMG.sauce,    cat:'additions' },
    { name:'علبة تومية حار',         price:10,  image:IMG.sauce,    cat:'additions' },
    { name:'علبة مخلل',              price:10,  image:IMG.sauce,    cat:'additions' },
  ]
  let inserted = 0
  for (const item of items) {
    try {
      await createProduct({
        name: item.name, description: item.desc || null, image_url: item.image,
        original_price: item.price, discounted_price: null,
        delivery_time: null, type: CAT_AR[item.cat] || item.cat, available: true,
      })
      inserted++
    } catch (_) { /* skip duplicates */ }
  }
  res.json({ ok: true, inserted })
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
