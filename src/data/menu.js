const U = (id) => `https://images.unsplash.com/photo-${id}?w=800&q=80&auto=format&fit=crop`

const menu = [
  // ── Antipasti ────────────────────────────────────────────────────────────────
  {
    id: 1,
    name: 'Bruschetta al Pomodoro',
    category: 'Antipasti',
    price: 9.99,
    description: 'Grilled sourdough, San Marzano tomato, garlic, basil, aged balsamic.',
    image: U('1572695157366-5e585ab2b69f'),
  },
  {
    id: 2,
    name: 'Calamari Fritti',
    category: 'Antipasti',
    price: 13.99,
    description: 'Golden rings, house marinara, lemon aioli.',
    image: U('1599487488170-d11ec9c172f0'),
  },
  {
    id: 3,
    name: 'Caesar Salad',
    category: 'Antipasti',
    price: 11.99,
    description: 'Romaine, Caesar, shaved parmesan, herbed croutons.',
    image: U('1512852939750-1305098529bf'),
  },

  // ── Mains ─────────────────────────────────────────────────────────────────────
  {
    id: 4,
    name: 'Grilled Atlantic Salmon',
    category: 'Mains',
    price: 28.99,
    description: 'Lemon-herb butter, asparagus, roasted cherry tomato.',
    image: U('1467003909585-2f8a72700288'),
  },
  {
    id: 5,
    name: 'Ribeye Steak',
    category: 'Mains',
    price: 42.99,
    description: '12oz USDA Prime, truffle butter, garlic mash.',
    image: U('1546833999-b9f581a1996d'),
  },
  {
    id: 6,
    name: 'Pasta Carbonara',
    category: 'Mains',
    price: 19.99,
    description: 'Rigatoni, guanciale, farm eggs, pecorino, black pepper.',
    image: U('1612874742237-6526221588e3'),
  },
  {
    id: 7,
    name: 'Margherita Pizza',
    category: 'Mains',
    price: 17.99,
    description: 'Wood-fired, San Marzano, buffalo mozzarella, basil.',
    image: U('1574071318508-1cdbab80d002'),
  },
  {
    id: 8,
    name: 'Osso Buco Milanese',
    category: 'Mains',
    price: 36.99,
    description: 'Slow-braised veal, gremolata, saffron risotto.',
    image: U('1544025162-d76538eebc36'),
  },

  // ── Dolci ─────────────────────────────────────────────────────────────────────
  {
    id: 9,
    name: 'Tiramisu',
    category: 'Dolci',
    price: 9.99,
    description: 'Espresso savoiardi, mascarpone, cocoa.',
    image: U('1571877227200-a0d98ea607e9'),
  },
  {
    id: 10,
    name: 'Chocolate Lava Cake',
    category: 'Dolci',
    price: 11.99,
    description: 'Dark-chocolate, molten center, Madagascar vanilla ice cream.',
    image: U('1578985545062-69928b1d9587'),
  },
  {
    id: 11,
    name: 'New York Cheesecake',
    category: 'Dolci',
    price: 8.99,
    description: 'Graham cracker crust, strawberry compote.',
    image: U('1567327613485-fbe3873b7930'),
  },

  // ── Bevande ───────────────────────────────────────────────────────────────────
  {
    id: 12,
    name: 'House Red Wine',
    category: 'Bevande',
    price: 12.99,
    description: 'Chianti · Barolo · Primitivo, by the glass.',
    image: U('1510812431401-41d2bd2722f3'),
  },
  {
    id: 13,
    name: 'Signature Cocktail',
    category: 'Bevande',
    price: 14.99,
    description: 'Seasonal, fresh citrus, house syrups.',
    image: U('1514362545857-3bc16c4c7d1b'),
  },
  {
    id: 14,
    name: 'Italian Espresso',
    category: 'Bevande',
    price: 4.99,
    description: 'Double ristretto, Sicilian single-origin.',
    image: U('1510591509098-f4fdc6d0ff04'),
  },
  {
    id: 15,
    name: 'Sparkling Water',
    category: 'Bevande',
    price: 3.99,
    description: 'San Pellegrino · Acqua Panna.',
    image: U('1548839140-29a749e1cf4d'),
  },
]

export const CATS = ['Antipasti', 'Mains', 'Dolci', 'Bevande']

export default menu
