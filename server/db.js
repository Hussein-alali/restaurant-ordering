import Database from 'better-sqlite3'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const db = new Database(join(__dirname, 'orders.db'))

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    phone       TEXT    NOT NULL,
    address     TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(phone)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
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
    created_at     DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`)

export function upsertCustomer({ name, phone, address }) {
  const existing = db.prepare('SELECT id FROM customers WHERE phone = ?').get(phone)
  if (existing) {
    db.prepare('UPDATE customers SET name = ?, address = ? WHERE phone = ?').run(name, address || null, phone)
    return existing.id
  }
  const result = db.prepare('INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)').run(name, phone, address || null)
  return result.lastInsertRowid
}

export function createOrder(data) {
  const orderNumber = Date.now().toString(36).toUpperCase()
  const customerId = upsertCustomer({ name: data.customerName, phone: data.phone, address: data.address })
  const subtotal = data.totalPrice
  const deliveryFee = 15
  const result = db.prepare(`
    INSERT INTO orders
      (order_number, customer_id, customer_name, phone, address, service_type, payment_method, items, subtotal, delivery_fee, total, delivery_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    orderNumber,
    customerId,
    data.customerName,
    data.phone,
    data.address || null,
    data.serviceType,
    data.paymentMethod || 'كاش',
    JSON.stringify(data.items),
    subtotal,
    deliveryFee,
    subtotal + deliveryFee,
    data.deliveryNotes || null,
  )
  return { id: result.lastInsertRowid, orderNumber }
}

export function getOrders({ limit = 50, offset = 0, status } = {}) {
  let q = 'SELECT * FROM orders'
  const params = []
  if (status) { q += ' WHERE status = ?'; params.push(status) }
  q += ' ORDER BY created_at DESC LIMIT ? OFFSET ?'
  params.push(limit, offset)
  return db.prepare(q).all(...params).map(r => ({ ...r, items: JSON.parse(r.items) }))
}

export function getOrderById(id) {
  const r = db.prepare('SELECT * FROM orders WHERE id = ?').get(id)
  return r ? { ...r, items: JSON.parse(r.items) } : null
}

export function updateOrderStatus(id, status) {
  return db.prepare('UPDATE orders SET status = ? WHERE id = ?').run(status, id)
}

export function getCustomers({ limit = 50, offset = 0 } = {}) {
  return db.prepare('SELECT * FROM customers ORDER BY created_at DESC LIMIT ? OFFSET ?').all(limit, offset)
}

export function getCustomerWithOrders(id) {
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id)
  if (!customer) return null
  const orders = db.prepare('SELECT * FROM orders WHERE customer_id = ? ORDER BY created_at DESC').all(id)
    .map(r => ({ ...r, items: JSON.parse(r.items) }))
  return { ...customer, orders }
}

export default db
