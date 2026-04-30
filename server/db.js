import pg from 'pg'
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
    status         TEXT    NOT NULL DEFAULT 'pending',
    created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`)

export async function upsertCustomer({ name, phone, address }) {
  const { rows } = await pool.query(
    `INSERT INTO customers (name, phone, address) VALUES ($1, $2, $3)
     ON CONFLICT (phone) DO UPDATE SET name = $1, address = $3
     RETURNING id`,
    [name, phone, address || null],
  )
  return rows[0].id
}

export async function createOrder(data) {
  const orderNumber = Date.now().toString(36).toUpperCase()
  const customerId = await upsertCustomer({ name: data.customerName, phone: data.phone, address: data.address })
  const subtotal = data.totalPrice
  const deliveryFee = 15
  const { rows } = await pool.query(
    `INSERT INTO orders
       (order_number, customer_id, customer_name, phone, address, service_type, payment_method, items, subtotal, delivery_fee, total, delivery_notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     RETURNING id`,
    [
      orderNumber, customerId, data.customerName, data.phone, data.address || null,
      data.serviceType, data.paymentMethod || 'كاش', JSON.stringify(data.items),
      subtotal, deliveryFee, subtotal + deliveryFee, data.deliveryNotes || null,
    ],
  )
  return { id: rows[0].id, orderNumber }
}

export async function getOrders({ limit = 50, offset = 0, status } = {}) {
  let q = 'SELECT * FROM orders'
  const params = []
  if (status) { q += ` WHERE status = $1`; params.push(status) }
  q += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`
  params.push(limit, offset)
  const { rows } = await pool.query(q, params)
  return rows.map(r => ({ ...r, items: JSON.parse(r.items) }))
}

export async function getOrderById(id) {
  const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id])
  return rows[0] ? { ...rows[0], items: JSON.parse(rows[0].items) } : null
}

export async function updateOrderStatus(id, status) {
  await pool.query('UPDATE orders SET status = $1 WHERE id = $2', [status, id])
}

export async function getCustomers({ limit = 50, offset = 0 } = {}) {
  const { rows } = await pool.query(
    'SELECT * FROM customers ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset],
  )
  return rows
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

export default pool
