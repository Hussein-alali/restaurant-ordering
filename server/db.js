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

export async function getCustomers({ limit = 50, offset = 0 } = {}) {
  const { rows } = await pool.query(
    'SELECT * FROM customers ORDER BY created_at DESC LIMIT $1 OFFSET $2',
    [limit, offset],
  )
  return rows
}

export async function getCustomerByPhone(phone) {
  const { rows } = await pool.query('SELECT * FROM customers WHERE phone=$1', [phone])
  if (!rows[0]) return null
  return getCustomerWithOrders(rows[0].id)
}

export async function getCustomerWithOrders(id) {
  const { rows: cr } = await pool.query('SELECT * FROM customers WHERE id=$1', [id])
  if (!cr[0]) return null
  const { rows: or } = await pool.query(
    'SELECT * FROM orders WHERE customer_id=$1 ORDER BY created_at DESC', [id],
  )
  return { ...cr[0], orders: or.map(r => ({ ...r, items: JSON.parse(r.items) })) }
}

// ─── Orders ───────────────────────────────────────────────

export async function createOrder(data) {
  const orderNumber = Date.now().toString(36).toUpperCase()
  const customerId  = await upsertCustomer({ name: data.customerName, phone: data.phone, address: data.address })
  const subtotal    = data.totalPrice
  const deliveryFee = 15
  const { rows } = await pool.query(
    `INSERT INTO orders
       (order_number,customer_id,customer_name,phone,address,service_type,payment_method,
        items,subtotal,delivery_fee,total,delivery_notes,order_note,branch_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`,
    [
      orderNumber, customerId, data.customerName, data.phone, data.address || null,
      data.serviceType, data.paymentMethod || 'كاش', JSON.stringify(data.items),
      subtotal, deliveryFee, subtotal + deliveryFee,
      data.deliveryNotes || null, data.orderNote || null, data.branchId || null,
    ],
  )
  return { id: rows[0].id, orderNumber }
}

export async function getOrders({ limit = 50, offset = 0, status, branchId } = {}) {
  const params = []
  const where  = []
  if (status)   { params.push(status);   where.push(`o.status = $${params.length}`) }
  if (branchId) { params.push(branchId); where.push(`o.branch_id = $${params.length}`) }
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

export default pool
