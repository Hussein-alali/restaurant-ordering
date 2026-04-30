import db from './db.js'

db.prepare('DELETE FROM orders').run()
db.prepare('DELETE FROM customers').run()
db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('orders','customers')").run()

const customers = [
  { name: 'أحمد محمد',    phone: '07801234567', address: 'الكرادة، بغداد' },
  { name: 'سارة علي',     phone: '07709876543', address: 'المنصور، بغداد' },
  { name: 'محمد حسن',     phone: '07811112222', address: null },
  { name: 'نور كمال',     phone: '07723334444', address: 'الجادرية، بغداد' },
  { name: 'علي عبدالله',  phone: '07835556666', address: 'الزعفرانية، بغداد' },
  { name: 'فاطمة إبراهيم', phone: '07707778888', address: 'الدورة، بغداد' },
]

const insertCustomer = db.prepare('INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)')
customers.forEach(c => insertCustomer.run(c.name, c.phone, c.address))

const orders = [
  {
    orderNumber: 'A1B2C3',
    customerId: 1, customerName: 'أحمد محمد', phone: '07801234567',
    address: 'الكرادة، بغداد', serviceType: 'توصيل', paymentMethod: 'كاش',
    items: [{ name: 'كريب نوتيلا', quantity: 2, price: 3500 }, { name: 'عصير برتقال', quantity: 1, price: 2000 }],
    subtotal: 9000, deliveryFee: 15, total: 9015,
    deliveryNotes: 'الطابق الثاني', status: 'pending',
  },
  {
    orderNumber: 'D4E5F6',
    customerId: 2, customerName: 'سارة علي', phone: '07709876543',
    address: 'المنصور، بغداد', serviceType: 'توصيل', paymentMethod: 'بطاقة',
    items: [{ name: 'كريب فراولة وكريمة', quantity: 1, price: 4000 }, { name: 'كريب لوتس', quantity: 1, price: 4500 }],
    subtotal: 8500, deliveryFee: 15, total: 8515,
    deliveryNotes: '', status: 'preparing',
  },
  {
    orderNumber: 'G7H8I9',
    customerId: 3, customerName: 'محمد حسن', phone: '07811112222',
    address: null, serviceType: 'استلام', paymentMethod: 'كاش',
    items: [{ name: 'كريب شوكولاتة', quantity: 3, price: 3500 }],
    subtotal: 10500, deliveryFee: 0, total: 10500,
    deliveryNotes: null, status: 'on_the_way',
  },
  {
    orderNumber: 'J1K2L3',
    customerId: 4, customerName: 'نور كمال', phone: '07723334444',
    address: 'الجادرية، بغداد', serviceType: 'توصيل', paymentMethod: 'كاش',
    items: [{ name: 'كريب موز وعسل', quantity: 2, price: 3800 }, { name: 'كريب نوتيلا', quantity: 1, price: 3500 }, { name: 'ماء معدني', quantity: 2, price: 500 }],
    subtotal: 12100, deliveryFee: 15, total: 12115,
    deliveryNotes: 'بدون سكر', status: 'delivered',
  },
  {
    orderNumber: 'M4N5O6',
    customerId: 5, customerName: 'علي عبدالله', phone: '07835556666',
    address: 'الزعفرانية، بغداد', serviceType: 'توصيل', paymentMethod: 'بطاقة',
    items: [{ name: 'كريب لوتس', quantity: 2, price: 4500 }],
    subtotal: 9000, deliveryFee: 15, total: 9015,
    deliveryNotes: null, status: 'delivered',
  },
  {
    orderNumber: 'P7Q8R9',
    customerId: 6, customerName: 'فاطمة إبراهيم', phone: '07707778888',
    address: 'الدورة، بغداد', serviceType: 'توصيل', paymentMethod: 'كاش',
    items: [{ name: 'كريب فراولة وكريمة', quantity: 2, price: 4000 }, { name: 'عصير تفاح', quantity: 2, price: 2000 }],
    subtotal: 12000, deliveryFee: 15, total: 12015,
    deliveryNotes: 'يرجى الإسراع', status: 'cancelled',
  },
]

const insertOrder = db.prepare(`
  INSERT INTO orders
    (order_number, customer_id, customer_name, phone, address, service_type, payment_method, items, subtotal, delivery_fee, total, delivery_notes, status)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)

orders.forEach(o => {
  insertOrder.run(
    o.orderNumber, o.customerId, o.customerName, o.phone, o.address,
    o.serviceType, o.paymentMethod, JSON.stringify(o.items),
    o.subtotal, o.deliveryFee, o.total, o.deliveryNotes, o.status,
  )
})

console.log(`✅ Seeded ${customers.length} customers and ${orders.length} orders`)
db.close()
