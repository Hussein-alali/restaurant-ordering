import pool from './db.js'

await pool.query('DELETE FROM orders')
await pool.query('DELETE FROM customers')
await pool.query("ALTER SEQUENCE orders_id_seq RESTART WITH 1")
await pool.query("ALTER SEQUENCE customers_id_seq RESTART WITH 1")

const customers = [
  { name: 'أحمد محمد',     phone: '01012345678', address: 'المعادي، القاهرة' },
  { name: 'سارة علي',      phone: '01198765432', address: 'الزمالك، القاهرة' },
  { name: 'محمد حسن',      phone: '01234567890', address: null },
  { name: 'نور كمال',      phone: '01556781234', address: 'المهندسين، الجيزة' },
  { name: 'علي عبدالله',   phone: '01067893456', address: 'مدينة نصر، القاهرة' },
  { name: 'فاطمة إبراهيم', phone: '01122334455', address: 'الإسكندرية' },
]

for (const c of customers) {
  await pool.query(
    'INSERT INTO customers (name, phone, address) VALUES ($1, $2, $3)',
    [c.name, c.phone, c.address],
  )
}

const orders = [
  {
    orderNumber: 'A1B2C3', customerId: 1, customerName: 'أحمد محمد', phone: '01012345678',
    address: 'المعادي، القاهرة', serviceType: 'توصيل', paymentMethod: 'كاش',
    items: [{ name: 'كريب نوتيلا', quantity: 2, price: 35 }, { name: 'عصير برتقال', quantity: 1, price: 20 }],
    subtotal: 90, deliveryFee: 15, total: 105, deliveryNotes: 'الطابق الثاني', status: 'pending',
  },
  {
    orderNumber: 'D4E5F6', customerId: 2, customerName: 'سارة علي', phone: '01198765432',
    address: 'الزمالك، القاهرة', serviceType: 'توصيل', paymentMethod: 'بطاقة',
    items: [{ name: 'كريب فراولة وكريمة', quantity: 1, price: 40 }, { name: 'كريب لوتس', quantity: 1, price: 45 }],
    subtotal: 85, deliveryFee: 15, total: 100, deliveryNotes: null, status: 'preparing',
  },
  {
    orderNumber: 'G7H8I9', customerId: 3, customerName: 'محمد حسن', phone: '01234567890',
    address: null, serviceType: 'استلام', paymentMethod: 'كاش',
    items: [{ name: 'كريب شوكولاتة', quantity: 3, price: 35 }],
    subtotal: 105, deliveryFee: 0, total: 105, deliveryNotes: null, status: 'on_the_way',
  },
  {
    orderNumber: 'J1K2L3', customerId: 4, customerName: 'نور كمال', phone: '01556781234',
    address: 'المهندسين، الجيزة', serviceType: 'توصيل', paymentMethod: 'كاش',
    items: [{ name: 'كريب موز وعسل', quantity: 2, price: 38 }, { name: 'كريب نوتيلا', quantity: 1, price: 35 }, { name: 'ماء معدني', quantity: 2, price: 10 }],
    subtotal: 131, deliveryFee: 15, total: 146, deliveryNotes: 'بدون سكر', status: 'delivered',
  },
  {
    orderNumber: 'M4N5O6', customerId: 5, customerName: 'علي عبدالله', phone: '01067893456',
    address: 'مدينة نصر، القاهرة', serviceType: 'توصيل', paymentMethod: 'بطاقة',
    items: [{ name: 'كريب لوتس', quantity: 2, price: 45 }],
    subtotal: 90, deliveryFee: 15, total: 105, deliveryNotes: null, status: 'delivered',
  },
  {
    orderNumber: 'P7Q8R9', customerId: 6, customerName: 'فاطمة إبراهيم', phone: '01122334455',
    address: 'الإسكندرية', serviceType: 'توصيل', paymentMethod: 'كاش',
    items: [{ name: 'كريب فراولة وكريمة', quantity: 2, price: 40 }, { name: 'عصير تفاح', quantity: 2, price: 20 }],
    subtotal: 120, deliveryFee: 15, total: 135, deliveryNotes: 'يرجى الإسراع', status: 'cancelled',
  },
]

for (const o of orders) {
  await pool.query(
    `INSERT INTO orders
       (order_number, customer_id, customer_name, phone, address, service_type, payment_method, items, subtotal, delivery_fee, total, delivery_notes, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
    [o.orderNumber, o.customerId, o.customerName, o.phone, o.address, o.serviceType, o.paymentMethod,
     JSON.stringify(o.items), o.subtotal, o.deliveryFee, o.total, o.deliveryNotes, o.status],
  )
}

console.log(`✅ Seeded ${customers.length} customers and ${orders.length} orders`)
await pool.end()
