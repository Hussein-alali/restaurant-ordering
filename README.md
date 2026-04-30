# Crepe Corner — Restaurant Ordering System

A production-ready, full-stack web application for restaurant order management. Customers can browse a categorized menu, build their order, and checkout with delivery or pickup options. Restaurant staff receive real-time order notifications and manage order status directly through a Telegram bot — no separate admin dashboard required.

---

## Features

### Customer Experience
- **Menu Browsing** — Categorized items (Crepes, Pizza, Burgers, Shawarma, Meals, Add-ons) with search and filtering
- **Item Details** — Full item view with customizable add-ons (sauces, sides)
- **Cart Management** — Add, remove, and adjust quantities with a persistent cart (localStorage)
- **Checkout** — Delivery or pickup selection with customer info, address, and payment method (cash or card)
- **Order Confirmation** — Unique order number displayed on confirmation
- **Order History** — "My Orders" page with real-time status tracking

### Admin / Operations
- **Telegram Bot Notifications** — Instant alerts for every new order with full order details
- **Inline Status Updates** — Update order status (Preparing → On the Way → Delivered/Cancelled) directly from Telegram
- **Bot Commands**:
  - `/orders` — View the last 20 orders
  - `/orders pending` — Filter orders by status
  - `/summary` — Order count and total revenue
  - `/customer <phone>` — View customer history and lifetime spend

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router DOM 7, Vite 6 |
| Styling | Tailwind CSS 3, Custom Design System |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL (`pg` driver) |
| Notifications | Telegram Bot API |
| Deployment | Railway (nixpacks) |

---

## Project Structure

```
restaurant-ordering/
├── src/
│   ├── pages/
│   │   ├── MenuPage.jsx          # Categorized menu with search
│   │   ├── ItemDetailPage.jsx    # Item view with add-ons
│   │   ├── CartPage.jsx          # Cart review and quantity management
│   │   ├── CheckoutPage.jsx      # Customer info and payment form
│   │   ├── ConfirmationPage.jsx  # Order success screen
│   │   └── MyOrdersPage.jsx      # Order history and status tracking
│   ├── context/
│   │   └── CartContext.jsx       # Global cart state (reducer + localStorage)
│   ├── data/
│   │   └── menu.js               # Menu items, categories, and pricing
│   └── components/
│       └── Layout.jsx
├── server/
│   ├── index.js                  # Express API + Telegram webhook handler
│   └── db.js                     # PostgreSQL connection pool and queries
├── n8n/                          # Optional n8n automation workflows
├── docs/                         # Vite build output (GitHub Pages)
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- Telegram bot token ([create one via BotFather](https://t.me/BotFather))

### Installation

```bash
git clone <repository-url>
cd restaurant-ordering
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here

# Server
PORT=3001
NODE_ENV=development
```

### Development

Run the frontend and backend simultaneously:

```bash
npm run dev:all
```

Or run them individually:

```bash
# Frontend (http://localhost:5173)
npm run dev

# Backend (http://localhost:3001)
npm run dev:server
```

The Vite dev server proxies all `/api/*` requests to the backend automatically.

### Production Build

```bash
npm run build   # Outputs to docs/
npm start       # Starts the Express server
```

---

## Database

Tables are created automatically on server startup if they do not exist:

| Table | Description |
|---|---|
| `customers` | Customer profiles (name, phone, address) |
| `orders` | Orders with items (JSON), totals, and status |
| `products` | Menu items with pricing and availability |

**Order statuses:** `pending` → `preparing` → `on_the_way` → `delivered` / `cancelled`

To seed the database with sample menu items:

```bash
# Hit the seed endpoint after starting the server
curl http://localhost:3001/api/seed
```

---

## Deployment (Railway)

This project is configured for one-click deployment on [Railway](https://railway.app).

1. Create a new Railway project and connect this repository.
2. Add a PostgreSQL service and copy the `DATABASE_URL` into environment variables.
3. Set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in Railway environment settings.
4. Railway will detect `nixpacks.toml` and deploy automatically.

The `railway.json` configures the start command and restart policy (on failure, max 3 retries).

---

## Design System

The UI targets Arabic-speaking users with full RTL layout support.

| Token | Value |
|---|---|
| Language | Arabic (`lang="ar" dir="rtl"`) |
| Primary Font | Cairo (Arabic), Rubik (display) |
| Brand Red | `#a8160c` |
| Accent Yellow | `#f4b528` |
| Background | `#f5ece0` (warm cream) |
| Number Locale | `ar-EG` |

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server (frontend only) |
| `npm run dev:server` | Start Express server (backend only) |
| `npm run dev:all` | Start both concurrently |
| `npm run build` | Production build to `docs/` |
| `npm run preview` | Preview production build locally |
| `npm start` | Start production server |

---

## License

MIT
