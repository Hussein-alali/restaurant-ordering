import pg from 'pg'
import bcrypt from 'bcryptjs'
const { Pool } = pg

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set. Add a PostgreSQL service in Railway and reference its DATABASE_URL variable.')
  process.exit(1)
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

await pool.query(`
  CREATE TABLE IF NOT EXISTS customers (
    id          SERIAL PRIMARY KEY,
    name        TEXT    NOT NULL,
    phone       TEXT    NOT NULL UNIQUE,
    address     TEXT,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS branches (
    id               SERIAL PRIMARY KEY,
    name             TEXT    NOT NULL,
    phone            TEXT    NOT NULL,
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
    username      TEXT    NOT NULL UNIQUE,
    password_hash TEXT    NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`)

// Add missing columns to existing orders table (for upgrades)
await pool.query(`
  DO $$
  BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='order_note') THEN
      ALTER TABLE orders ADD COLUMN order_note TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='branch_id') THEN
      ALTER TABLE orders ADD COLUMN branch_id INTEGER REFERENCES branches(id);
    END IF;
  END $$;
`)

// Seed default admin
const { rows: admins } = await pool.query('SELECT id FROM admin_users WHERE username = $1', ['admin'])
if (!admins.length) {
  const hash = await bcrypt.hash('crepe2024', 10)
  await pool.query('INSERT INTO admin_users (username, password_hash) VALUES ($1, $2)', ['admin', hash])
  console.log('✅ Admin user created: admin / crepe2024')
}

// ─── Customers ────────────────────────────────────────────

export async function upsertCustomer({ name, phone, address }) {
  const { rows } = await pool.query(
    `INSERT INTO customers (name, phone, address) VALUES ($1, $2, $3)
     ON CONFLICT (phone) DO UPDATE SET name = $1, address = $3
     RETURNING id`,
    [name, phone, address || null],
  )
  return rows[0].id
}

export async function getCustomers({ limit = 50, offset = 0 } = {}) {
  const { rows } = await pool.query(
    'SELECT * FROM customers ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset],
  )
  return rows
}

export async function getCustomerByPhone(phone) {
  const { rows } = await pool.query('SELECT * FROM customers WHERE phone = $1', [phone])
  if (!rows[0]) return null
  return getCustomerWithOrders(rows[0].id)
}

export async function getCustomerWithOrders(id) {
  const { rows: customerRows } = await pool.query('SELECT * FROM customers WHERE id = $1', [id])
  if (!customerRows[0]) return null
  const { rows: orderRows } = await pool.query(
    'SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC',
    [id],
  )
  return { ...customerRows[0], orders: orderRows.map(r => ({ ...r, items: JSON.parse(r.items) })) }
}

// ─── Orders ───────────────────────────────────────────────

export async function createOrder(data) {
  const orderNumber = Date.now().toString(36).toUpperCase()
  const customerId = await upsertCustomer({ name: data.customerName, phone: data.phone, address: data.address })
  const subtotal = data.totalPrice
  const deliveryFee = 15
  const { rows } = await pool.query(
    `INSERT INTO orders
       (order_number, customer_id, customer_name, phone, address, service_type, payment_method,
        items, subtotal, delivery_fee, total, delivery_notes, order_note, branch_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
     RETURNING id`,
    [
      orderNumber, customerId, data.customerName, data.phone, data.address || null,
      data.serviceType, data.paymentMethod || 'كاش', JSON.stringify(data.items),
      subtotal, deliveryFee, subtotal + deliveryFee, data.deliveryNotes || null,
      data.orderNote || null, data.branchId || null,
    ],
  )
  return { id: rows[0].id, orderNumber }
}

export async function getOrders({ limit = 50, offset = 0, status } = {}) {
  let q = `SELECT o.*, b.name AS branch_name FROM orders o LEFT JOIN branches b ON b.id = o.branch_id`
  const params = []
  if (status) { q += ` WHERE o.status = $1`; params.push(status) }
  q += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
  params.push(limit, offset)
  const { rows } = await pool.query(q, params)
  return rows.map(r => ({ ...r, items: JSON.parse(r.items) }))
}

export async function getOrderById(id) {
  const { rows } = await pool.query(
    `SELECT o.*, b.name AS branch_name FROM orders o LEFT JOIN branches b ON b.id = o.branch_id WHERE o.id = $1`,
    [id],
  )
  return rows[0] ? { ...rows[0], items: JSON.parse(rows[0].items) } : null
}

export async function updateOrderStatus(id, status) {
  await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id])
}

// ─── Branches ─────────────────────────────────────────────

export async function getBranches() {
  const { rows } = await pool.query('SELECT * FROM branches ORDER BY created_at ASC')
  return rows
}

export async function getBranchById(id) {
  const { rows } = await pool.query('SELECT * FROM branches WHERE id = $1', [id])
  return rows[0] || null
}

export async function createBranch(data) {
  const { rows } = await pool.query(
    `INSERT INTO branches (name, phone, address, telegram_chat_id) VALUES ($1,$2,$3,$4) RETURNING *`,
    [data.name, data.phone, data.address || null, data.telegram_chat_id || null],
  )
  return rows[0]
}

export async function updateBranch(id, data) {
  const { rows } = await pool.query(
    `UPDATE branches SET name=$1, phone=$2, address=$3, telegram_chat_id=$4 WHERE id=$5 RETURNING *`,
    [data.name, data.phone, data.address || null, data.telegram_chat_id || null, id],
  )
  return rows[0] || null
}

export async function deleteBranch(id) {
  await pool.query('DELETE FROM branches WHERE id = $1', [id])
}

// ─── Product Branches ─────────────────────────────────────

export async function setProductBranches(productId, branchIds) {
  await pool.query('DELETE FROM product_branches WHERE product_id = $1', [productId])
  for (const branchId of branchIds) {
    await pool.query(
      'INSERT INTO product_branches (product_id, branch_id) VALUES ($1,$2) ON CONFLICT DO NOTHING',
      [productId, branchId],
    )
  }
}

export async function getProductBranches(productId) {
  const { rows } = await pool.query('SELECT branch_id FROM product_branches WHERE product_id = $1', [productId])
  return rows.map(r => r.branch_id)
}

export async function getProductsForBranch(branchId) {
  const { rows } = await pool.query(`
    SELECT * FROM products
    WHERE available = true
    AND (
      NOT EXISTS (SELECT 1 FROM product_branches pb WHERE pb.product_id = products.id)
      OR EXISTS (SELECT 1 FROM product_branches pb WHERE pb.product_id = products.id AND pb.branch_id = $1)
    )
    ORDER BY created_at ASC
  `, [branchId])
  return rows
}

// ─── Products ─────────────────────────────────────────────

export async function getProducts() {
  const { rows } = await pool.query('SELECT * FROM products ORDER BY created_at DESC')
  return rows
}

export async function createProduct(data) {
  const { rows } = await pool.query(
    `INSERT INTO products (name, description, image_url, delivery_time, original_price, discounted_price, available, type)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [data.name, data.description || null, data.image_url || null, data.delivery_time || null,
     data.original_price, data.discounted_price || null, data.available !== false, data.type || null],
  )
  return rows[0]
}

export async function updateProduct(id, data) {
  const { rows } = await pool.query(
    `UPDATE products SET name=$1, description=$2, image_url=$3, delivery_time=$4,
     original_price=$5, discounted_price=$6, available=$7, type=$8 WHERE id=$9 RETURNING *`,
    [data.name, data.description || null, data.image_url || null, data.delivery_time || null,
     data.original_price, data.discounted_price || null, data.available !== false, data.type || null, id],
  )
  return rows[0]
}

export async function deleteProduct(id) {
  await pool.query('DELETE FROM products WHERE id = $1', [id])
}

// ─── Admin ────────────────────────────────────────────────

export async function getAdminByUsername(username) {
  const { rows } = await pool.query('SELECT * FROM admin_users WHERE username = $1', [username])
  return rows[0] || null
}

export default pool
