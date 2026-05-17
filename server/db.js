import pg from 'pg'
import bcrypt from 'bcryptjs'
const { Pool } = pg

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set.')
  process.exit(1)
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

// ─── Schema ───────────────────────────────────────────────

await pool.query(`
  CREATE TABLE IF NOT EXISTS customers (
    id         SERIAL PRIMARY KEY,
    name       TEXT NOT NULL,
    phone      TEXT NOT NULL UNIQUE,
    address    TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS branches (
    id               SERIAL PRIMARY KEY,
    name             TEXT NOT NULL,
    phone            TEXT NOT NULL,
    address          TEXT,
    telegram_chat_id TEXT,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id               SERIAL PRIMARY KEY,
    name             TEXT    NOT NULL,
    description      TEXT,
    image_url        TEXT,
    delivery_time    TEXT,
    original_price   INTEGER NOT NULL,
    discounted_price INTEGER,
    available        BOOLEAN NOT NULL DEFAULT true,
    type             TEXT,
    created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS product_branches (
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    branch_id  INTEGER REFERENCES branches(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, branch_id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id             SERIAL PRIMARY KEY,
    order_number   TEXT    NOT NULL UNIQUE,
    customer_id    INTEGER REFERENCES customers(id),
    customer_name  TEXT    NOT NULL,
    phone          TEXT    NOT NULL,
    address        TEXT,
    service_type   TEXT    NOT NULL DEFAULT 'توصيل',
    payment_method TEXT    NOT NULL DEFAULT 'كاش',
    items          TEXT    NOT NULL,
    subtotal       INTEGER NOT NULL,
    delivery_fee   INTEGER NOT NULL DEFAULT 15,
    total          INTEGER NOT NULL,
    delivery_notes TEXT,
    order_note     TEXT,
    branch_id      INTEGER REFERENCES branches(id),
    status         TEXT    NOT NULL DEFAULT 'pending',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admin_users (
    id            SERIAL PRIMARY KEY,
    username      TEXT NOT NULL UNIQUE,
    email         TEXT UNIQUE,
    password_hash TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT 'super_admin',
    branch_id     INTEGER REFERENCES branches(id) ON DELETE SET NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id         SERIAL PRIMARY KEY,
    name       TEXT NOT NULL UNIQUE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS site_settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS offers (
    id          SERIAL PRIMARY KEY,
    title       TEXT NOT NULL,
    description TEXT,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS offer_items (
    offer_id   INTEGER REFERENCES offers(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    PRIMARY KEY (offer_id, product_id)
  );

  CREATE TABLE IF NOT EXISTS sections (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS branch_sections (
    branch_id    INTEGER REFERENCES branches(id) ON DELETE CASCADE,
    section_id   INTEGER REFERENCES sections(id) ON DELETE CASCADE,
    is_available BOOLEAN NOT NULL DEFAULT true,
    PRIMARY KEY (branch_id, section_id)
  );
`)

// ─── Migrations (idempotent upgrades) ─────────────────────

await pool.query(`
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='order_note') THEN
      ALTER TABLE orders ADD COLUMN order_note TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='branch_id') THEN
      ALTER TABLE orders ADD COLUMN branch_id INTEGER REFERENCES branches(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_users' AND column_name='email') THEN
      ALTER TABLE admin_users ADD COLUMN email TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_users' AND column_name='role') THEN
      ALTER TABLE admin_users ADD COLUMN role TEXT NOT NULL DEFAULT 'super_admin';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='admin_users' AND column_name='branch_id') THEN
      ALTER TABLE admin_users ADD COLUMN branch_id INTEGER REFERENCES branches(id) ON DELETE SET NULL;
    END IF;
  END $$;
`)

// Set email + role for existing admin user if missing
await pool.query(`
  UPDATE admin_users
  SET email = 'admin@crepecorner.com', role = 'super_admin'
  WHERE username = 'admin' AND (email IS NULL OR email = '')
`)

// Add unique constraint on email if not already there
await pool.query(`
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'admin_users_email_key' AND conrelid = 'admin_users'::regclass
    ) THEN
      ALTER TABLE admin_users ADD CONSTRAINT admin_users_email_key UNIQUE (email);
    END IF;
  END $$;
`)

// ─── Seed super admin ─────────────────────────────────────

const { rows: existing } = await pool.query(`SELECT id FROM admin_users WHERE username = 'admin'`)
if (!existing.length) {
  const hash = await bcrypt.hash('crepe2024', 12)
  await pool.query(
    `INSERT INTO admin_users (username, email, password_hash, role) VALUES ($1,$2,$3,$4)`,
    ['admin', 'admin@crepecorner.com', hash, 'super_admin'],
  )
  console.log('✅ Super Admin: admin@crepecorner.com / crepe2024')
}

// ─── Customers ────────────────────────────────────────────

export async function upsertCustomer({ name, phone, address }) {
  const { rows } = await pool.query(
    `INSERT INTO customers (name, phone, address) VALUES ($1,$2,$3)
     ON CONFLICT (phone) DO UPDATE SET name=$1, address=$3 RETURNING id`,
    [name, phone, address || null],
  )
  return rows[0].id
}

export async function getCustomers({ limit = 50, offset = 0, branchId, phone } = {}) {
  const params = []
  const where  = []
  if (branchId) {
    where.push(`c.id IN (SELECT DISTINCT customer_id FROM orders WHERE branch_id=$${params.length + 1} AND customer_id IS NOT NULL)`)
    params.push(branchId)
  }
  if (phone) {
    where.push(`c.phone ILIKE $${params.length + 1}`)
    params.push(`%${phone.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`)
  }
  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : ''
  params.push(limit, offset)
  const { rows } = await pool.query(
    `SELECT c.*, COUNT(o.id)::int AS order_count
     FROM customers c
     LEFT JOIN orders o ON o.customer_id = c.id
     ${whereClause}
     GROUP BY c.id
     ORDER BY c.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  )
  return rows
}

export async function getCustomerByPhone(phone) {
  const { rows } = await pool.query('SELECT * FROM customers WHERE phone=$1', [phone])
  if (!rows[0]) return null
  return getCustomerWithOrders(rows[0].id)
}

export async function getCustomerWithOrders(id, branchId = null) {
  const { rows: cr } = await pool.query('SELECT * FROM customers WHERE id=$1', [id])
  if (!cr[0]) return null
  const filter = branchId ? 'AND branch_id=$2' : ''
  const params = branchId ? [id, branchId] : [id]
  const { rows: or } = await pool.query(
    `SELECT * FROM orders WHERE customer_id=$1 ${filter} ORDER BY created_at DESC`, params,
  )
  return { ...cr[0], orders: or.map(r => ({ ...r, items: JSON.parse(r.items) })) }
}

// ─── Orders ───────────────────────────────────────────────

export async function createOrder(data) {
  const orderNumber = Date.now().toString(36).toUpperCase()
  const customerId  = await upsertCustomer({ name: data.customerName, phone: data.phone, address: data.address })

  // Server-side price verification — never trust client-supplied prices.
  // Look up each item's current price in the DB; fall back to client price only
  // if the product ID is not found (e.g. items from the static frontend menu file).
  const productIds = (data.items || []).map(i => Number(i.id)).filter(id => Number.isInteger(id) && id > 0)
  const priceMap   = new Map()
  if (productIds.length) {
    const { rows: prods } = await pool.query(
      'SELECT id, COALESCE(discounted_price, original_price) AS price FROM products WHERE id = ANY($1::int[])',
      [productIds],
    )
    prods.forEach(p => priceMap.set(p.id, Number(p.price)))
  }

  const verifiedItems = (data.items || []).map(item => ({
    ...item,
    price: priceMap.get(Number(item.id)) ?? Number(item.price),
  }))

  const subtotal    = verifiedItems.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0)
  // Delivery fee is 0 for pickup / dine-in
  const deliveryFee = data.serviceType === 'delivery' ? 15 : 0

  const { rows } = await pool.query(
    `INSERT INTO orders
       (order_number,customer_id,customer_name,phone,address,service_type,payment_method,
        items,subtotal,delivery_fee,total,delivery_notes,order_note,branch_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`,
    [
      orderNumber, customerId, data.customerName, data.phone, data.address || null,
      data.serviceType, data.paymentMethod || 'كاش', JSON.stringify(verifiedItems),
      subtotal, deliveryFee, subtotal + deliveryFee,
      data.deliveryNotes || null, data.orderNote || null, data.branchId || null,
    ],
  )
  return { id: rows[0].id, orderNumber }
}

export async function getOrders({ limit = 50, offset = 0, status, branchId, dateFrom, dateTo } = {}) {
  const params = []
  const where  = []
  if (status)   { params.push(status);   where.push(`o.status = $${params.length}`) }
  if (branchId) { params.push(branchId); where.push(`o.branch_id = $${params.length}`) }
  if (dateFrom) { params.push(dateFrom); where.push(`o.created_at >= $${params.length}::date`) }
  if (dateTo)   { params.push(dateTo);   where.push(`o.created_at < ($${params.length}::date + interval '1 day')`) }
  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : ''
  params.push(limit, offset)
  const { rows } = await pool.query(
    `SELECT o.*, b.name AS branch_name
     FROM orders o LEFT JOIN branches b ON b.id = o.branch_id
     ${whereClause}
     ORDER BY o.created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params,
  )
  return rows.map(r => ({ ...r, items: JSON.parse(r.items) }))
}

export async function getOrderById(id) {
  const { rows } = await pool.query(
    `SELECT o.*, b.name AS branch_name
     FROM orders o LEFT JOIN branches b ON b.id = o.branch_id WHERE o.id=$1`,
    [id],
  )
  return rows[0] ? { ...rows[0], items: JSON.parse(rows[0].items) } : null
}

export async function updateOrderStatus(id, status) {
  await pool.query('UPDATE orders SET status=$1 WHERE id=$2', [status, id])
}

// ─── Branches ─────────────────────────────────────────────

export async function getBranches() {
  const { rows } = await pool.query('SELECT * FROM branches ORDER BY created_at ASC')
  return rows
}

export async function getBranchById(id) {
  const { rows } = await pool.query('SELECT * FROM branches WHERE id=$1', [id])
  return rows[0] || null
}

export async function createBranch(data) {
  const { rows } = await pool.query(
    `INSERT INTO branches (name,phone,address,telegram_chat_id) VALUES ($1,$2,$3,$4) RETURNING *`,
    [data.name, data.phone, data.address || null, data.telegram_chat_id || null],
  )
  return rows[0]
}

export async function updateBranch(id, data) {
  const { rows } = await pool.query(
    `UPDATE branches SET name=$1,phone=$2,address=$3,telegram_chat_id=$4 WHERE id=$5 RETURNING *`,
    [data.name, data.phone, data.address || null, data.telegram_chat_id || null, id],
  )
  return rows[0] || null
}

export async function deleteBranch(id) {
  await pool.query('DELETE FROM branches WHERE id=$1', [id])
}

// ─── Products ─────────────────────────────────────────────

export async function getProducts() {
  const { rows } = await pool.query('SELECT * FROM products ORDER BY created_at DESC')
  return rows
}

export async function getProductsForBranch(branchId) {
  const { rows } = await pool.query(`
    SELECT * FROM products WHERE available=true
    AND (
      NOT EXISTS (SELECT 1 FROM product_branches pb WHERE pb.product_id=products.id)
      OR  EXISTS (SELECT 1 FROM product_branches pb WHERE pb.product_id=products.id AND pb.branch_id=$1)
    )
    AND (
      products.type IS NULL
      OR NOT EXISTS (SELECT 1 FROM sections s WHERE s.name=products.type)
      OR NOT EXISTS (
        SELECT 1 FROM sections s
        JOIN branch_sections bs ON bs.section_id=s.id AND bs.branch_id=$1
        WHERE s.name=products.type AND bs.is_available=false
      )
    )
    ORDER BY created_at ASC
  `, [branchId])
  return rows
}

export async function setProductBranches(productId, branchIds) {
  await pool.query('DELETE FROM product_branches WHERE product_id=$1', [productId])
  for (const bid of branchIds) {
    await pool.query(
      'INSERT INTO product_branches (product_id,branch_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [productId, bid],
    )
  }
}

export async function getProductBranches(productId) {
  const { rows } = await pool.query('SELECT branch_id FROM product_branches WHERE product_id=$1', [productId])
  return rows.map(r => r.branch_id)
}

export async function createProduct(data) {
  const { rows } = await pool.query(
    `INSERT INTO products (name,description,image_url,delivery_time,original_price,discounted_price,available,type)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [data.name, data.description || null, data.image_url || null, data.delivery_time || null,
     data.original_price, data.discounted_price || null, data.available !== false, data.type || null],
  )
  return rows[0]
}

export async function updateProduct(id, data) {
  const { rows } = await pool.query(
    `UPDATE products SET name=$1,description=$2,image_url=$3,delivery_time=$4,
     original_price=$5,discounted_price=$6,available=$7,type=$8 WHERE id=$9 RETURNING *`,
    [data.name, data.description || null, data.image_url || null, data.delivery_time || null,
     data.original_price, data.discounted_price || null, data.available !== false, data.type || null, id],
  )
  return rows[0]
}

export async function deleteProduct(id) {
  await pool.query('DELETE FROM products WHERE id=$1', [id])
}

// ─── Admin Users ──────────────────────────────────────────

export async function getAdminByEmail(email) {
  const { rows } = await pool.query(
    'SELECT * FROM admin_users WHERE LOWER(email)=LOWER($1)', [email],
  )
  return rows[0] || null
}

export async function getAdminById(id) {
  const { rows } = await pool.query('SELECT * FROM admin_users WHERE id=$1', [id])
  return rows[0] || null
}

export async function getAdminUsers() {
  const { rows } = await pool.query(`
    SELECT a.id, a.username, a.email, a.role, a.branch_id, a.created_at, b.name AS branch_name
    FROM admin_users a LEFT JOIN branches b ON b.id=a.branch_id
    ORDER BY a.created_at ASC
  `)
  return rows
}

export async function createAdminUser({ username, email, password, role, branchId }) {
  const hash = await bcrypt.hash(password, 12)
  const { rows } = await pool.query(
    `INSERT INTO admin_users (username,email,password_hash,role,branch_id) VALUES ($1,$2,$3,$4,$5) RETURNING id,username,email,role,branch_id`,
    [username, email.toLowerCase(), hash, role || 'branch_admin', branchId || null],
  )
  return rows[0]
}

export async function deleteAdminUser(id) {
  await pool.query('DELETE FROM admin_users WHERE id=$1 AND role!=\'super_admin\'', [id])
}

export async function updateAdminPassword(id, password) {
  const hash = await bcrypt.hash(password, 12)
  await pool.query('UPDATE admin_users SET password_hash=$1 WHERE id=$2', [hash, id])
}

// ─── Offers ───────────────────────────────────────────────

async function attachOfferItems(offers) {
  if (!offers.length) return offers
  const ids = offers.map(o => o.id)
  const { rows } = await pool.query(
    `SELECT oi.offer_id, p.id, p.name, p.type,
            COALESCE(p.discounted_price, p.original_price) AS price, p.image_url
     FROM offer_items oi JOIN products p ON p.id=oi.product_id
     WHERE oi.offer_id = ANY($1::int[])`,
    [ids],
  )
  return offers.map(o => ({ ...o, items: rows.filter(r => r.offer_id === o.id) }))
}

export async function getOffers() {
  const { rows } = await pool.query('SELECT * FROM offers ORDER BY created_at DESC')
  return attachOfferItems(rows)
}

export async function getActiveOffers() {
  const { rows } = await pool.query('SELECT * FROM offers WHERE is_active=true ORDER BY created_at DESC')
  return attachOfferItems(rows)
}

export async function createOffer({ title, description }) {
  const { rows } = await pool.query(
    'INSERT INTO offers (title, description) VALUES ($1,$2) RETURNING *',
    [title.trim(), description || null],
  )
  return rows[0]
}

export async function updateOffer(id, { title, description, is_active }) {
  const { rows } = await pool.query(
    'UPDATE offers SET title=$1, description=$2, is_active=$3 WHERE id=$4 RETURNING *',
    [title.trim(), description || null, is_active, id],
  )
  return rows[0] || null
}

export async function setOfferItems(offerId, productIds) {
  await pool.query('DELETE FROM offer_items WHERE offer_id=$1', [offerId])
  for (const pid of productIds) {
    await pool.query(
      'INSERT INTO offer_items (offer_id, product_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [offerId, pid],
    )
  }
}

export async function deleteOffer(id) {
  await pool.query('DELETE FROM offers WHERE id=$1', [id])
}

// ─── Sections ────────────────────────────────────────────

export async function getSections() {
  const { rows: secs } = await pool.query('SELECT * FROM sections ORDER BY name ASC')
  if (!secs.length) return []
  const { rows: avail } = await pool.query('SELECT branch_id, section_id, is_available FROM branch_sections')
  return secs.map(s => ({
    ...s,
    branch_availability: Object.fromEntries(
      avail.filter(a => a.section_id === s.id).map(a => [a.branch_id, a.is_available]),
    ),
  }))
}

export async function createSection({ name, description }) {
  const { rows } = await pool.query(
    'INSERT INTO sections (name, description) VALUES ($1, $2) RETURNING *',
    [name.trim(), description || null],
  )
  const section = rows[0]
  const { rows: branches } = await pool.query('SELECT id FROM branches')
  for (const b of branches) {
    await pool.query(
      'INSERT INTO branch_sections (branch_id, section_id, is_available) VALUES ($1,$2,true) ON CONFLICT DO NOTHING',
      [b.id, section.id],
    )
  }
  return section
}

export async function updateSection(id, { name, description }) {
  const { rows } = await pool.query(
    'UPDATE sections SET name=$1, description=$2 WHERE id=$3 RETURNING *',
    [name.trim(), description || null, id],
  )
  return rows[0] || null
}

export async function deleteSection(id) {
  await pool.query('DELETE FROM sections WHERE id=$1', [id])
}

export async function updateBranchSection(branchId, sectionId, isAvailable) {
  await pool.query(
    `INSERT INTO branch_sections (branch_id, section_id, is_available) VALUES ($1,$2,$3)
     ON CONFLICT (branch_id, section_id) DO UPDATE SET is_available=$3`,
    [branchId, sectionId, isAvailable],
  )
}

// ─── Site Settings ────────────────────────────────────────

export async function getSettings() {
  const { rows } = await pool.query('SELECT key, value FROM site_settings')
  return Object.fromEntries(rows.map(r => [r.key, r.value]))
}

export async function upsertSetting(key, value) {
  await pool.query(
    'INSERT INTO site_settings (key, value) VALUES ($1,$2) ON CONFLICT (key) DO UPDATE SET value=$2',
    [key, value],
  )
}

// ─── Categories ───────────────────────────────────────────

export async function getCategories() {
  const { rows } = await pool.query('SELECT * FROM categories ORDER BY sort_order ASC, name ASC')
  return rows
}

export async function createCategory({ name, sortOrder = 0 }) {
  const { rows } = await pool.query(
    'INSERT INTO categories (name, sort_order) VALUES ($1, $2) RETURNING *',
    [name.trim(), sortOrder],
  )
  return rows[0]
}

export async function updateCategory(id, { name, sortOrder = 0 }) {
  const { rows } = await pool.query(
    'UPDATE categories SET name=$1, sort_order=$2 WHERE id=$3 RETURNING *',
    [name.trim(), sortOrder, id],
  )
  return rows[0] || null
}

export async function deleteCategory(id) {
  await pool.query('DELETE FROM categories WHERE id=$1', [id])
}

export default pool
