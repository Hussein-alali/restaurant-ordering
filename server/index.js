import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import {
  createOrder, getOrders, getOrderById, updateOrderStatus,
  getCustomers, getCustomerWithOrders, getCustomerByPhone,
  getProducts, createProduct, updateProduct, deleteProduct,
  getProductsForBranch, setProductBranches, getProductBranches,
  getBranches, getBranchById, createBranch, updateBranch, deleteBranch,
  getAdminByEmail, getAdminById, getAdminUsers, createAdminUser,
  deleteAdminUser, updateAdminPassword,
  getCategories, createCategory, updateCategory, deleteCategory,
  getSettings, upsertSetting,
  getSections, createSection, updateSection, deleteSection, updateBranchSection,
  getOffers, getActiveOffers, getOfferByCode, createOffer, updateOffer, setOfferItems, deleteOffer,
} from './db.js'

const __dirname  = dirname(fileURLToPath(import.meta.url))
const app        = express()
const PORT       = process.env.PORT || 3001

// Trust Railway's reverse proxy so req.ip reflects the real client IP,
// not the internal load-balancer address (fixes rate-limiter accuracy)
app.set('trust proxy', 1)
const TG_TOKEN   = process.env.TELEGRAM_BOT_TOKEN
const TG_CHAT    = process.env.TELEGRAM_CHAT_ID
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  if (process.env.NODE_ENV === 'production') {
    console.warn('⚠️  JWT_SECRET not set — using insecure default. Set JWT_SECRET env var.')
  }
  return 'crepe-corner-jwt-secret-change-me'
})()

// ─── Security Headers ────────────────────────────────────

// helmet sets HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, etc.
// CSP is set manually below because admin.html has inline scripts.
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }))

app.use((req, res, next) => {
  // HSTS: tell browsers to always use HTTPS for 2 years (production only)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }
  // CSP: admin.html requires unsafe-inline for its script block; sheetjs from CDN
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' cdn.sheetjs.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com; font-src 'self' fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' api.telegram.org; frame-ancestors 'none'",
  )
  res.setHeader('Permissions-Policy', 'geolocation=(), camera=(), microphone=()')
  next()
})

// CORS: restrict to our own domain — wildcard would allow any site to call our API
const ALLOWED_ORIGINS = process.env.NODE_ENV === 'production'
  ? ['https://restaurant-ordering-production.up.railway.app']
  : ['http://localhost:5173', 'http://localhost:3001', 'http://127.0.0.1:5173']

app.use(cors({
  origin: (origin, cb) => (!origin || ALLOWED_ORIGINS.includes(origin) ? cb(null, true) : cb(new Error('Not allowed by CORS'))),
  credentials: true,
}))

// 100 KB is more than enough for any legitimate order payload
app.use(express.json({ limit: '100kb' }))

// ─── Rate Limiting ───────────────────────────────────────

function makeRateLimiter({ windowMs, max, message }) {
  const store = new Map()
  setInterval(() => { const now = Date.now(); for (const [k, r] of store) if (now > r.resetAt) store.delete(k) }, 60_000)
  return (req, res, next) => {
    const ip  = req.ip || 'unknown'
    const now = Date.now()
    const rec = store.get(ip) || { count: 0, resetAt: now + windowMs }
    if (now > rec.resetAt) { rec.count = 0; rec.resetAt = now + windowMs }
    if (rec.count >= max) {
      const mins = Math.ceil((rec.resetAt - now) / 60_000)
      return res.status(429).json({ error: message(mins) })
    }
    rec.count++
    store.set(ip, rec)
    req._rateLimitStore = store
    req._rateLimitIp    = ip
    next()
  }
}

// 10 login attempts per 15 min per IP (brute-force protection)
const rateLimitLogin   = makeRateLimiter({ windowMs: 15 * 60_000, max: 10,  message: m => `كثير من المحاولات. حاول بعد ${m} دقيقة` })
// 30 lookups per minute per IP (customer order-history scraping protection)
const rateLimitByPhone = makeRateLimiter({ windowMs: 60_000,       max: 30,  message: () => 'كثير من المحاولات' })

// ─── Auth Middleware ──────────────────────────────────────

function adminAuth(req, res, next) {
  const raw   = req.headers.authorization || ''
  const token = raw.startsWith('Bearer ') ? raw.slice(7) : raw
  if (!token) return res.status(401).json({ error: 'يجب تسجيل الدخول' })
  try {
    req.admin = jwt.verify(token, JWT_SECRET)
    next()
  } catch (e) {
    const msg = e.name === 'TokenExpiredError' ? 'انتهت الجلسة — سجل الدخول مرة أخرى' : 'رمز غير صحيح'
    res.status(401).json({ error: msg })
  }
}

function superAdminOnly(req, res, next) {
  if (req.admin?.role !== 'super_admin') {
    return res.status(403).json({ error: 'هذه العملية تتطلب صلاحيات المدير العام' })
  }
  next()
}

// Branch admin can only affect their own branch; super admin passes through
function branchScope(req, res, next) {
  if (req.admin?.role === 'branch_admin') {
    req.scopedBranchId = req.admin.branchId
  }
  next()
}

// ─── Telegram Notification ───────────────────────────────

async function sendTelegram(orderId, orderNumber, data, branchChatId) {
  const chatId = branchChatId || TG_CHAT
  if (!TG_TOKEN || !chatId) return

  const { customerName, phone, address, items, totalPrice,
          deliveryNotes, orderNote, serviceType, paymentMethod, branchName } = data

  const itemLines = items
    .map(i => `• ${i.name} ×${i.quantity} — ${Number(i.price) * Number(i.quantity)} ج.م`)
    .join('\n')

  const lines = ['🍽️ <b>طلب جديد!</b>', `🔢 <b>${orderNumber}</b>`]
  if (branchName)    lines.push(`🏪 <b>الفرع: ${branchName}</b>`)
  lines.push('', '👤 <b>العميل</b>', `الاسم: ${customerName}`, `📞 ${phone}`)
  if (address)       lines.push(`📍 ${address}`)
  if (serviceType)   lines.push(`النوع: ${serviceType}`)
  if (paymentMethod) lines.push(`الدفع: ${paymentMethod}`)
  if (orderNote)     lines.push(`🗒 <i>${orderNote}</i>`)
  if (deliveryNotes) lines.push(`📝 <i>${deliveryNotes}</i>`)
  lines.push('', '📦 <b>الأصناف</b>', itemLines, '', `💰 <b>الإجمالي: ${Number(totalPrice) + 15} ج.م</b>`)

  const keyboard = { inline_keyboard: [
    [{ text: '👨‍🍳 جاري التحضير', callback_data: `st:${orderId}:preparing` },
     { text: '🛵 في الطريق',      callback_data: `st:${orderId}:on_the_way` }],
    [{ text: '✅ تم التوصيل',    callback_data: `st:${orderId}:delivered` },
     { text: '🚫 ملغي',          callback_data: `st:${orderId}:cancelled` }],
  ]}

  await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: lines.join('\n'), parse_mode: 'HTML', reply_markup: keyboard }),
  }).catch(err => console.error('Telegram error:', err.message))
}

// ═══════════════════════════════════════════════════════════
// PUBLIC ROUTES
// ═══════════════════════════════════════════════════════════

// ─── Admin Login ─────────────────────────────────────────

app.post('/api/admin/login', rateLimitLogin, async (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'البريد الإلكتروني وكلمة المرور مطلوبين' })

  const admin = await getAdminByEmail(email.trim()).catch(() => null)

  // Always run bcrypt to prevent timing attacks even when user not found
  const DUMMY_HASH = '$2a$12$invalidhashusedtopreventtimingattacks000000000000000000'
  const hashToCheck = admin ? admin.password_hash : DUMMY_HASH
  const ok = await bcrypt.compare(password, hashToCheck)

  if (!admin || !ok) {
    return res.status(401).json({ error: 'بريد إلكتروني أو كلمة مرور غير صحيحة' })
  }

  // Reset rate limit on success
  if (req._rateLimitStore && req._rateLimitIp) req._rateLimitStore.delete(req._rateLimitIp)

  const token = jwt.sign(
    { id: admin.id, email: admin.email, username: admin.username, role: admin.role, branchId: admin.branch_id },
    JWT_SECRET,
    { expiresIn: '12h' },
  )

  res.json({ token, username: admin.username, email: admin.email, role: admin.role, branchId: admin.branch_id })
})

// ─── Branches (public read — needed by customer app) ─────

app.get('/api/branches', async (req, res) => {
  res.json(await getBranches())
})

// ─── Products (public — needed by customer app) ──────────

app.get('/api/products', async (req, res) => {
  res.json(await getProducts())
})

app.get('/api/products/branch/:branchId', async (req, res) => {
  res.json(await getProductsForBranch(Number(req.params.branchId)))
})

app.get('/api/products/:id/branches', async (req, res) => {
  res.json(await getProductBranches(Number(req.params.id)))
})

// ─── Orders: single (public — customer tracking) ─────────
// Returns only tracking fields — no customer PII (name/phone/address) to prevent
// BOLA: sequential numeric IDs are guessable; a full dump would leak all customer data

app.get('/api/orders/:id', async (req, res) => {
  const order = await getOrderById(Number(req.params.id))
  if (!order) return res.status(404).json({ error: 'الطلب مش موجود' })
  res.json({
    id:           order.id,
    order_number: order.order_number,
    status:       order.status,
    items:        order.items,
    total:        order.total,
    service_type: order.service_type,
    created_at:   order.created_at,
  })
})

// ─── Orders: create (public) ─────────────────────────────

app.post('/api/orders', async (req, res) => {
  try {
    const data = req.body
    if (!data.customerName || !data.phone || !data.items?.length) {
      return res.status(400).json({ error: 'بيانات ناقصة' })
    }
    const { id, orderNumber } = await createOrder(data)
    let branchChatId = null, branchName = null
    if (data.branchId) {
      const branch = await getBranchById(data.branchId).catch(() => null)
      branchChatId = branch?.telegram_chat_id || null
      branchName   = branch?.name || null
    }
    sendTelegram(id, orderNumber, { ...data, branchName }, branchChatId)
    res.status(201).json({ id, orderNumber })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'خطأ في الخادم' })
  }
})

// ─── Customers: by-phone (public — customer "My Orders") ─

app.get('/api/customers/by-phone/:phone', rateLimitByPhone, async (req, res) => {
  const customer = await getCustomerByPhone(req.params.phone)
  if (!customer) return res.status(404).json({ error: 'العميل مش موجود' })
  res.json(customer)
})

// ─── Telegram Webhook (public) ───────────────────────────

app.post('/telegram-webhook', async (req, res) => {
  res.sendStatus(200)
  const update = req.body
  const STATUS_AR = { preparing: '👨‍🍳 جاري التحضير', on_the_way: '🛵 في الطريق', delivered: '✅ تم التوصيل', cancelled: '🚫 ملغي' }

  const VALID_TG_STATUSES = new Set(['preparing', 'on_the_way', 'delivered', 'cancelled'])

  if (update.callback_query) {
    const cbq = update.callback_query
    const [, orderId, newStatus] = cbq.data.split(':')
    // Whitelist status values — never pass raw callback_data to the DB
    if (orderId && VALID_TG_STATUSES.has(newStatus)) {
      await updateOrderStatus(Number(orderId), newStatus).catch(() => {})
      await fetch(`https://api.telegram.org/bot${TG_TOKEN}/answerCallbackQuery`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: cbq.id, text: STATUS_AR[newStatus] || 'تم التحديث', show_alert: false }),
      }).catch(() => {})
    }
    return
  }

  if (update.message?.text) {
    const msg = update.message, chatId = msg.chat.id
    const parts = msg.text.trim().split(/\s+/), cmd = parts[0].toLowerCase(), arg = parts.slice(1).join(' ').trim()
    const reply = t => fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: t, parse_mode: 'Markdown' }),
    }).catch(() => {})

    if (cmd === '/orders' || cmd === '/طلبات') {
      const orders = await getOrders({ limit: 20, status: arg || undefined })
      if (!orders.length) return reply('لا توجد طلبات.')
      const s = { pending:'⏳', preparing:'👨‍🍳', on_the_way:'🛵', delivered:'✅', cancelled:'🚫' }
      return reply('📋 *آخر الطلبات*\n\n' + orders.map(o =>
        `*#${o.order_number}* — ${o.customer_name}\n📞 ${o.phone} | ${o.total} ج.م | ${s[o.status]||o.status}${o.branch_name?' | 🏪 '+o.branch_name:''}\n${o.items.map(i=>`${i.name} ×${i.quantity}`).join('، ')}`
      ).join('\n\n'))
    }
    if (cmd === '/summary' || cmd === '/ملخص') {
      const orders = await getOrders({ limit: 500 })
      const total = orders.reduce((s,o) => s + Number(o.total), 0)
      const byStatus = {}; orders.forEach(o => { byStatus[o.status] = (byStatus[o.status]||0)+1 })
      const s = { pending:'⏳ انتظار', preparing:'👨‍🍳 تحضير', on_the_way:'🛵 في الطريق', delivered:'✅ تم', cancelled:'🚫 ملغي' }
      return reply(`📊 *ملخص الطلبات*\n\n${Object.entries(byStatus).map(([k,v])=>`${s[k]||k}: *${v}*`).join('\n')}\n\n💰 *الإجمالي: ${total.toLocaleString()} ج.م*\n📦 *العدد: ${orders.length}*`)
    }
    if ((cmd === '/customer' || cmd === '/عميل') && arg) {
      const c = await getCustomerByPhone(arg)
      if (!c) return reply('❌ العميل مش موجود.')
      const spent = c.orders.reduce((s,o)=>s+Number(o.total),0)
      const s = { pending:'⏳', preparing:'👨‍🍳', on_the_way:'🛵', delivered:'✅', cancelled:'🚫' }
      return reply(`👤 *${c.name}*\n📞 ${c.phone}\n📦 عدد الطلبات: *${c.orders.length}*\n💰 الإنفاق: *${spent} ج.م*`)
    }
    return reply('🤖 *Crepe Corner Bot*\n\n`/orders` — آخر 20 طلب\n`/summary` — ملخص\n`/customer 01012345678` — عميل')
  }
})

// ═══════════════════════════════════════════════════════════
// PROTECTED ROUTES (require valid JWT)
// ═══════════════════════════════════════════════════════════

// ─── Admin: me ───────────────────────────────────────────

app.get('/api/admin/me', adminAuth, (req, res) => {
  res.json({ id: req.admin.id, email: req.admin.email, username: req.admin.username, role: req.admin.role, branchId: req.admin.branchId })
})

// ─── Admin Users (super admin only) ──────────────────────

app.get('/api/admin/users', adminAuth, superAdminOnly, async (req, res) => {
  res.json(await getAdminUsers())
})

app.post('/api/admin/users', adminAuth, superAdminOnly, async (req, res) => {
  const { username, email, password, branchId } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'البريد وكلمة المرور مطلوبين' })
  if (password.length < 8) return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
  try {
    const user = await createAdminUser({
      username: username || email.split('@')[0],
      email: email.trim().toLowerCase(),
      password,
      role: 'branch_admin',
      branchId: branchId || null,
    })
    res.status(201).json(user)
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'البريد الإلكتروني مستخدم بالفعل' })
    console.error(err); res.status(500).json({ error: 'خطأ في الخادم' })
  }
})

app.put('/api/admin/users/:id/password', adminAuth, superAdminOnly, async (req, res) => {
  const { password } = req.body || {}
  if (!password || password.length < 8) return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' })
  await updateAdminPassword(Number(req.params.id), password)
  res.json({ ok: true })
})

app.delete('/api/admin/users/:id', adminAuth, superAdminOnly, async (req, res) => {
  const id = Number(req.params.id)
  if (id === req.admin.id) return res.status(400).json({ error: 'لا يمكن حذف حسابك الخاص' })
  await deleteAdminUser(id)
  res.json({ ok: true })
})

// ─── Branches (write: super admin only) ──────────────────

app.post('/api/branches', adminAuth, superAdminOnly, async (req, res) => {
  try {
    const { adminEmail, adminPassword, adminUsername, ...branchData } = req.body
    const branch = await createBranch(branchData)
    // Optionally create branch admin at the same time
    let adminUser = null
    if (adminEmail && adminPassword) {
      if (adminPassword.length < 8) {
        return res.status(400).json({ error: 'كلمة مرور المشرف يجب أن تكون 8 أحرف على الأقل' })
      }
      adminUser = await createAdminUser({
        username: adminUsername || adminEmail.split('@')[0],
        email:    adminEmail.trim().toLowerCase(),
        password: adminPassword,
        role:     'branch_admin',
        branchId: branch.id,
      }).catch(err => {
        if (err.code === '23505') throw new Error('البريد الإلكتروني مستخدم بالفعل')
        throw err
      })
    }
    res.status(201).json({ branch, adminUser })
  } catch (err) {
    console.error(err)
    res.status(err.message.includes('مستخدم') ? 409 : 500).json({ error: err.message || 'خطأ في الخادم' })
  }
})

app.put('/api/branches/:id', adminAuth, superAdminOnly, async (req, res) => {
  try {
    const branch = await updateBranch(Number(req.params.id), req.body)
    if (!branch) return res.status(404).json({ error: 'الفرع مش موجود' })
    res.json(branch)
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'خطأ في الخادم' })
  }
})

app.delete('/api/branches/:id', adminAuth, superAdminOnly, async (req, res) => {
  await deleteBranch(Number(req.params.id))
  res.json({ ok: true })
})

// ─── Orders: list (admin — branch scoped) ────────────────

app.get('/api/orders', adminAuth, branchScope, async (req, res) => {
  const { limit, offset, status } = req.query
  const branchId = req.scopedBranchId ?? (req.query.branchId ? Number(req.query.branchId) : undefined)
  res.json(await getOrders({
    limit:  Math.min(Math.max(Number(limit)  || 50, 1), 500), // cap at 500
    offset: Math.max(Number(offset) || 0, 0),
    status,
    branchId,
  }))
})

// ─── Orders: status update (admin — branch scoped) ───────

app.patch('/api/orders/:id/status', adminAuth, branchScope, async (req, res) => {
  const { status } = req.body
  const valid = ['pending', 'preparing', 'on_the_way', 'delivered', 'cancelled']
  if (!valid.includes(status)) return res.status(400).json({ error: 'status غير صحيح' })
  const orderId = Number(req.params.id)

  // Branch admin: verify order belongs to their branch
  if (req.scopedBranchId) {
    const order = await getOrderById(orderId)
    if (!order) return res.status(404).json({ error: 'الطلب مش موجود' })
    if (order.branch_id !== req.scopedBranchId) return res.status(403).json({ error: 'ليس لديك صلاحية تعديل هذا الطلب' })
  }

  await updateOrderStatus(orderId, status)
  res.json({ ok: true })
})

// ─── Customers (admin — branch scoped) ───────────────────

app.get('/api/customers', adminAuth, branchScope, async (req, res) => {
  const { limit, offset, phone } = req.query
  const branchId = req.scopedBranchId ?? (req.query.branchId ? Number(req.query.branchId) : undefined)
  res.json(await getCustomers({
    limit:    Math.min(Math.max(Number(limit)  || 50, 1), 500),
    offset:   Math.max(Number(offset) || 0, 0),
    branchId,
    phone:    phone?.trim() || undefined,
  }))
})

app.get('/api/customers/:id', adminAuth, branchScope, async (req, res) => {
  // Branch admin sees only orders from their own branch for this customer
  const customer = await getCustomerWithOrders(Number(req.params.id), req.scopedBranchId || null)
  if (!customer) return res.status(404).json({ error: 'العميل مش موجود' })
  res.json(customer)
})

// ─── Products: write (admin — branch scoped) ─────────────

app.post('/api/products/seed', adminAuth, superAdminOnly, async (req, res) => {
  const cU = id => `https://images.unsplash.com/photo-${id}?w=800&q=80&auto=format&fit=crop`
  const IMG = {
    crepe: '/chicken_crepe.jpg',
    pizza: cU('1628840042765-356cda07504e'), burger: cU('1508736793122-f516e3ba5569'),
    shawarma: cU('1530469912745-a215c6b256ea'), fries: cU('1573080496219-bb080dd4f877'),
    sauce: cU('1571091718767-18b5b1457add'),
  }
  const CAT = { 'crepe-chicken':'كريب فراخ','crepe-meat':'كريب لحوم','crepe-mix':'كريب ميكس',pizza:'بيتزا كورنر',burger:'بيف برجر',shawarma:'الشاورما',meals:'وجبات',additions:'الإضافات' }
  const items = [
    {name:'كريب بانيه (ناجيتس)',price:80,img:IMG.crepe,cat:'crepe-chicken'},
    {name:'كريب كرسبي (ناجيتس / حار)',price:90,img:IMG.crepe,cat:'crepe-chicken'},
    {name:'كريب شيش',price:125,img:IMG.crepe,cat:'crepe-chicken'},
    {name:'كريب استرس (حار)',price:130,img:IMG.crepe,cat:'crepe-chicken'},
    {name:'كريب فاهيتا فراخ',price:125,img:IMG.crepe,cat:'crepe-chicken'},
    {name:'كريب زنجر (حار)',price:130,img:IMG.crepe,cat:'crepe-chicken'},
    {name:'كريب شاورما سوري',price:130,img:IMG.crepe,cat:'crepe-chicken'},
    {name:'كريب سوبر كرانشي',price:130,img:IMG.crepe,cat:'crepe-chicken'},
    {name:'كريب شيش استرس',price:135,img:IMG.crepe,cat:'crepe-chicken'},
    {name:'كريب البروفيسور',price:150,img:IMG.crepe,cat:'crepe-chicken'},
    {name:'كريب سوسيس',price:110,img:IMG.crepe,cat:'crepe-meat'},
    {name:'كريب هوت دوج',price:110,img:IMG.crepe,cat:'crepe-meat'},
    {name:'كريب كفته',price:125,img:IMG.crepe,cat:'crepe-meat'},
    {name:'كريب سجق',price:120,img:IMG.crepe,cat:'crepe-meat'},
    {name:'كريب بسطرمة',price:150,img:IMG.crepe,cat:'crepe-meat'},
    {name:'كريب لحم مفروم',price:125,img:IMG.crepe,cat:'crepe-meat'},
    {name:'كريب برجر لحم',price:125,img:IMG.crepe,cat:'crepe-meat'},
    {name:'كريب ميكس فراخ',price:125,img:IMG.crepe,cat:'crepe-mix'},
    {name:'كريب ميكس لحوم',price:130,img:IMG.crepe,cat:'crepe-mix'},
    {name:'كريب كورنر',price:160,img:IMG.crepe,cat:'crepe-mix'},
    {name:'كريب ابو عبيدة (حار)',price:130,img:IMG.crepe,cat:'crepe-mix'},
    {name:'كريب 777',price:130,img:IMG.crepe,cat:'crepe-mix'},
    {name:'اورجينال برجر',price:125,img:IMG.burger,cat:'burger'},
    {name:'تشيز برجر',price:135,img:IMG.burger,cat:'burger'},
    {name:'تشيز تشيز',price:140,img:IMG.burger,cat:'burger'},
    {name:'مشروم برجر',price:145,img:IMG.burger,cat:'burger'},
    {name:'هالبينو برجر',price:140,img:IMG.burger,cat:'burger'},
    {name:'بيف بيكو',price:150,img:IMG.burger,cat:'burger'},
    {name:'بيتزا برجر',price:150,img:IMG.burger,cat:'burger'},
    {name:'بيتزا مارجريتا',price:125,img:IMG.pizza,cat:'pizza'},
    {name:'بيتزا خضار',price:125,img:IMG.pizza,cat:'pizza'},
    {name:'بيتزا مكس جبن',price:145,img:IMG.pizza,cat:'pizza'},
    {name:'بيتزا مكس فراخ',price:150,img:IMG.pizza,cat:'pizza'},
    {name:'بيتزا فراخ باربيكيو',price:150,img:IMG.pizza,cat:'pizza'},
    {name:'بيتزا تشيكن رانش',price:155,img:IMG.pizza,cat:'pizza'},
    {name:'بيتزا استرس',price:145,img:IMG.pizza,cat:'pizza'},
    {name:'بيتزا مكس لحوم',price:155,img:IMG.pizza,cat:'pizza'},
    {name:'بيتزا سوبريم',price:155,img:IMG.pizza,cat:'pizza'},
    {name:'بيتزا سوسيس',price:145,img:IMG.pizza,cat:'pizza'},
    {name:'بيتزا نصين (اختيارك)',price:170,img:IMG.pizza,cat:'pizza'},
    {name:'بيتزا بيبروني',price:140,img:IMG.pizza,cat:'pizza'},
    {name:'بيتزا زنجر',price:155,img:IMG.pizza,cat:'pizza'},
    {name:'بيتزا سجق',price:145,img:IMG.pizza,cat:'pizza'},
    {name:'بيتزا مفروم',price:145,img:IMG.pizza,cat:'pizza'},
    {name:'بيتزا تشيكن هالبينو',price:150,img:IMG.pizza,cat:'pizza'},
    {name:'بيتزا جمبري',price:180,img:IMG.pizza,cat:'pizza'},
    {name:'بيتزا جمبري رانش',price:175,img:IMG.pizza,cat:'pizza'},
    {name:'بيتزا تونة',price:175,img:IMG.pizza,cat:'pizza'},
    {name:'ساندوتش شاورما وسط',price:75,img:IMG.shawarma,cat:'shawarma'},
    {name:'ساندوتش شاورما كبير',price:90,img:IMG.shawarma,cat:'shawarma'},
    {name:'ساندوتش ميكس شاورما بطاطس',price:85,img:IMG.shawarma,cat:'shawarma'},
    {name:'ساندوتش بطاطس سوري',price:40,img:IMG.fries,cat:'shawarma'},
    {name:'ساندوتش بطاطس موزريلا',price:60,img:IMG.fries,cat:'shawarma'},
    {name:'وجبة عربي',price:110,img:IMG.sauce,cat:'meals'},
    {name:'وجبة اكسترا',price:140,img:IMG.sauce,cat:'meals'},
    {name:'وجبة الديل',price:180,img:IMG.sauce,cat:'meals'},
    {name:'فتة شاورما كبير',price:150,img:IMG.shawarma,cat:'meals'},
    {name:'كيلو الشاورما',price:700,img:IMG.shawarma,cat:'meals'},
    {name:'باكت بطاطس',price:30,img:IMG.fries,cat:'additions'},
    {name:'بطاطس شيدر',price:40,img:IMG.fries,cat:'additions'},
    {name:'تشكن كرسبي فرايز',price:65,img:IMG.fries,cat:'additions'},
    {name:'تشيلي تشيز فرايز',price:65,img:IMG.fries,cat:'additions'},
    {name:'كول سلو',price:15,img:IMG.sauce,cat:'additions'},
    {name:'علبة تومية',price:10,img:IMG.sauce,cat:'additions'},
    {name:'علبة تومية حار',price:10,img:IMG.sauce,cat:'additions'},
    {name:'علبة مخلل',price:10,img:IMG.sauce,cat:'additions'},
  ]
  let inserted = 0
  for (const item of items) {
    try {
      await createProduct({ name:item.name, image_url:item.img, original_price:item.price, type:CAT[item.cat]||item.cat, available:true })
      inserted++
    } catch { /* skip duplicates */ }
  }
  res.json({ ok: true, inserted })
})

app.put('/api/products/:id/branches', adminAuth, superAdminOnly, async (req, res) => {
  const { branchIds } = req.body
  await setProductBranches(Number(req.params.id), Array.isArray(branchIds) ? branchIds : [])
  res.json({ ok: true })
})

app.post('/api/products', adminAuth, branchScope, async (req, res) => {
  try {
    const product = await createProduct(req.body)
    // Branch admin: auto-assign to their branch
    if (req.scopedBranchId) {
      await setProductBranches(product.id, [req.scopedBranchId])
    }
    res.status(201).json(product)
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'خطأ في الخادم' })
  }
})

app.put('/api/products/:id', adminAuth, branchScope, async (req, res) => {
  try {
    const id = Number(req.params.id)
    // Branch admin: can only edit products assigned to their branch (or unassigned)
    if (req.scopedBranchId) {
      const assigned = await getProductBranches(id)
      if (assigned.length > 0 && !assigned.includes(req.scopedBranchId)) {
        return res.status(403).json({ error: 'ليس لديك صلاحية تعديل هذا المنتج' })
      }
    }
    const product = await updateProduct(id, req.body)
    if (!product) return res.status(404).json({ error: 'المنتج مش موجود' })
    res.json(product)
  } catch (err) {
    console.error(err); res.status(500).json({ error: 'خطأ في الخادم' })
  }
})

app.delete('/api/products/:id', adminAuth, superAdminOnly, async (req, res) => {
  await deleteProduct(Number(req.params.id))
  res.json({ ok: true })
})

// ─── Categories ──────────────────────────────────────────

app.get('/api/categories', async (req, res) => {
  res.json(await getCategories())
})

app.post('/api/categories', adminAuth, superAdminOnly, async (req, res) => {
  const { name, sortOrder } = req.body || {}
  if (!name?.trim()) return res.status(400).json({ error: 'اسم الفئة مطلوب' })
  try {
    res.status(201).json(await createCategory({ name, sortOrder: Number(sortOrder) || 0 }))
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'الفئة موجودة بالفعل' })
    console.error(err); res.status(500).json({ error: 'خطأ في الخادم' })
  }
})

app.put('/api/categories/:id', adminAuth, superAdminOnly, async (req, res) => {
  const { name, sortOrder } = req.body || {}
  if (!name?.trim()) return res.status(400).json({ error: 'اسم الفئة مطلوب' })
  const cat = await updateCategory(Number(req.params.id), { name, sortOrder: Number(sortOrder) || 0 })
  if (!cat) return res.status(404).json({ error: 'الفئة مش موجودة' })
  res.json(cat)
})

app.delete('/api/categories/:id', adminAuth, superAdminOnly, async (req, res) => {
  await deleteCategory(Number(req.params.id))
  res.json({ ok: true })
})

// ─── Offers ──────────────────────────────────────────────

app.get('/api/offers', adminAuth, async (req, res) => {
  res.json(await getOffers())
})

app.get('/api/offers/active', async (req, res) => {
  res.json(await getActiveOffers())
})

app.get('/api/offers/code/:code', async (req, res) => {
  const offer = await getOfferByCode(req.params.code)
  if (!offer) return res.status(404).json({ error: 'الكود غير صحيح أو منتهي' })
  res.json(offer)
})

app.post('/api/offers', adminAuth, superAdminOnly, async (req, res) => {
  const { title, description, discount_code, discount_percent, items = [] } = req.body
  if (!title?.trim()) return res.status(400).json({ error: 'title required' })
  const offer = await createOffer({ title, description, discount_code, discount_percent })
  if (items.length) await setOfferItems(offer.id, items.map(Number).filter(Boolean))
  res.status(201).json(offer)
})

app.put('/api/offers/:id', adminAuth, superAdminOnly, async (req, res) => {
  const { title, description, is_active, discount_code, discount_percent, items } = req.body
  if (!title?.trim()) return res.status(400).json({ error: 'title required' })
  const offer = await updateOffer(Number(req.params.id), { title, description, is_active: is_active !== false, discount_code, discount_percent })
  if (!offer) return res.status(404).json({ error: 'not found' })
  if (Array.isArray(items)) await setOfferItems(offer.id, items.map(Number).filter(Boolean))
  res.json(offer)
})

app.delete('/api/offers/:id', adminAuth, superAdminOnly, async (req, res) => {
  await deleteOffer(Number(req.params.id))
  res.json({ ok: true })
})

// ─── Sections ────────────────────────────────────────────

app.post('/api/sections/seed', adminAuth, superAdminOnly, async (req, res) => {
  const defaults = [
    { name: 'كريب فراخ',    description: 'كريب بالفراخ بأشكال متنوعة' },
    { name: 'كريب لحوم',    description: 'كريب باللحوم والسجق' },
    { name: 'كريب ميكس',   description: 'كريب بمزيج الفراخ واللحوم' },
    { name: 'بيتزا كورنر',  description: 'بيتزا طازجة بعجينة مميزة' },
    { name: 'بيف برجر',    description: 'برجر لحم بتشكيلة متنوعة' },
    { name: 'الشاورما',     description: 'شاورما سورية أصيلة' },
    { name: 'وجبات',        description: 'وجبات متكاملة' },
    { name: 'الإضافات',     description: 'بطاطس وصوصات وإضافات' },
  ]
  let inserted = 0
  for (const s of defaults) {
    try { await createSection(s); inserted++ } catch { /* skip duplicate */ }
  }
  res.json({ inserted })
})

app.get('/api/sections', async (req, res) => {
  res.json(await getSections())
})

app.post('/api/sections', adminAuth, superAdminOnly, async (req, res) => {
  const { name, description } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'name required' })
  try {
    res.status(201).json(await createSection({ name, description }))
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ error: 'اسم القسم موجود بالفعل' })
    throw e
  }
})

app.put('/api/sections/:id', adminAuth, superAdminOnly, async (req, res) => {
  const { name, description } = req.body
  if (!name?.trim()) return res.status(400).json({ error: 'name required' })
  const sec = await updateSection(Number(req.params.id), { name, description })
  if (!sec) return res.status(404).json({ error: 'not found' })
  res.json(sec)
})

app.delete('/api/sections/:id', adminAuth, superAdminOnly, async (req, res) => {
  await deleteSection(Number(req.params.id))
  res.json({ ok: true })
})

app.patch('/api/branch-sections', adminAuth, async (req, res) => {
  const { branch_id, section_id, is_available } = req.body
  if (!branch_id || !section_id || typeof is_available !== 'boolean')
    return res.status(400).json({ error: 'invalid body' })
  if (req.admin.role === 'branch_admin' && req.admin.branch_id !== Number(branch_id))
    return res.status(403).json({ error: 'forbidden' })
  await updateBranchSection(Number(branch_id), Number(section_id), is_available)
  res.json({ ok: true })
})

// ─── Site Settings ───────────────────────────────────────

app.get('/api/settings', async (req, res) => {
  res.json(await getSettings())
})

app.put('/api/settings', adminAuth, superAdminOnly, async (req, res) => {
  const allowed = ['restaurant_name', 'tagline']
  const updates = Object.entries(req.body).filter(([k]) => allowed.includes(k))
  for (const [k, v] of updates) await upsertSetting(k, String(v).trim().slice(0, 200))
  res.json(await getSettings())
})

// ─── Admin UI ────────────────────────────────────────────

app.get('/admin', (_, res) => res.sendFile(join(__dirname, 'admin.html')))

// Serve React build
const staticDir = join(__dirname, '../docs')
app.use(express.static(staticDir))
app.use((req, res) => res.sendFile(join(staticDir, 'index.html')))

app.listen(PORT, () => {
  console.log(`\n✅ Crepe Corner server on :${PORT}`)
  console.log(`   Admin: http://localhost:${PORT}/admin\n`)
})
