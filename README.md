# Tavola — Restaurant Ordering App

A mobile-first restaurant ordering web app built with React. Customers browse the menu, build an order, choose a service type, enter their details, and submit — the owner receives an instant WhatsApp notification via n8n and the WhatsApp Cloud API. No backend server, no database.

**Live demo:** https://hussein-alali.github.io/restaurant-ordering/

---

## How it works

```
Customer (React app) → POST order → n8n Webhook → WhatsApp Cloud API → Owner's WhatsApp
```

1. Customer browses the menu and adds items to cart
2. Selects service type: Delivery, Dine-in, or Takeaway
3. Enters name, phone, and address (delivery only)
4. Reviews order and confirms
5. n8n receives the payload, validates it, formats a message, and sends it to the owner's WhatsApp

---

## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v7, Tailwind CSS v3 |
| Build | Vite |
| Automation | n8n |
| Notifications | WhatsApp Business Cloud API (Meta) |
| Hosting | GitHub Pages |

---

## Features

- **Menu** — items with photos, category filter (Antipasti · Mains · Dolci · Bevande), and search
- **Service toggle** — Delivery, Dine-in, Takeaway (adapts checkout form and order payload)
- **Cart** — quantity controls, item removal, live total
- **Checkout** — 2-step form: customer details → review & pay
- **Confirmation** — order summary with estimated time based on service type
- **WhatsApp notification** — owner receives a formatted message the moment an order is placed

---

## Project structure

```
src/
├── components/
│   └── Layout.jsx            # Root layout with Outlet
├── context/
│   └── CartContext.jsx       # useReducer cart + customer state, utility functions
├── data/
│   └── menu.js              # Static menu items (15 dishes, 4 categories)
├── pages/
│   ├── MenuPage.jsx         # Browse, filter, search, add to cart
│   ├── CartPage.jsx         # Review cart, adjust quantities
│   ├── CheckoutPage.jsx     # 2-step checkout wizard
│   └── ConfirmationPage.jsx # Order confirmed + timeline
```

---

## Order payload

Sent as a JSON POST to the n8n webhook on order submission:

```json
{
  "customerName": "Amara Okafor",
  "phone": "+1 (415) 555-0142",
  "serviceType": "Delivery",
  "address": "228 Mercer Street, Apt 4B",
  "items": [
    { "id": 1, "name": "Bruschetta al Pomodoro", "quantity": 2, "price": 9.99 },
    { "id": 5, "name": "Ribeye Steak", "quantity": 1, "price": 42.99 }
  ],
  "totalPrice": 62.97,
  "deliveryNotes": "Leave at door",
  "timestamp": "2026-04-21T19:30:00.000Z"
}
```

`serviceType` is `"Delivery"`, `"Dine-in"`, or `"Takeaway"`. For non-delivery orders, `address` is set to the service type string.

---

## Local setup

```bash
git clone https://github.com/Hussein-alali/restaurant-ordering.git
cd restaurant-ordering
npm install
cp .env.example .env   # add your n8n webhook URL
npm run dev            # → http://localhost:5173
```

### Environment variable

```env
VITE_WEBHOOK_URL=https://your-n8n-instance.app/webhook/restaurant-order
```

---

## n8n workflow

Import `n8n-workflow.json` into your n8n instance. The workflow has 7 nodes:

| Node | Type | Purpose |
|------|------|---------|
| Receive Order | Webhook | Accepts POST at `/webhook/restaurant-order` |
| Validate Order | IF | Checks `customerName`, `phone`, and `items` are present |
| Reject Invalid | Respond | Returns 400 if validation fails |
| Format Message | Code | Builds the WhatsApp message text |
| Send WhatsApp | HTTP Request | Calls Meta Graph API |
| Respond Success | Respond | Returns 200 to the frontend |
| Respond API Error | Respond | Returns 500 if WhatsApp call fails |

### n8n environment variables

Set these in n8n → Settings → Environment Variables:

| Variable | Value |
|----------|-------|
| `WHATSAPP_ACCESS_TOKEN` | Permanent system user token from Meta |
| `WHATSAPP_PHONE_NUMBER_ID` | Numeric phone number ID from Meta dashboard |
| `OWNER_PHONE_NUMBER` | Owner's WhatsApp number in E.164 without `+` (e.g. `966501234567`) |

---

## WhatsApp Cloud API setup

1. Go to [developers.facebook.com](https://developers.facebook.com) → Create App → Business → add WhatsApp product
2. Under **WhatsApp → API Setup**, copy the Phone Number ID and generate a permanent system user token
3. Add your number as a test recipient and send a test message to verify
4. Paste credentials into n8n environment variables

The API is free for up to 1,000 conversations/month.

---

## GitHub Pages deployment

The `docs/` folder contains the production build and is served by GitHub Pages from the `main` branch → `/docs` folder.

**To deploy an update:**

```bash
npm run build   # outputs to docs/
git add docs/
git commit -m "rebuild"
git push
```

A GitHub Actions workflow (`.github/workflows/deploy.yml`) also triggers automatically on every push to `main` if you switch the Pages source to **GitHub Actions** in the repo settings.

---

## Cost

| Service | Cost |
|---------|------|
| React hosting (GitHub Pages) | Free |
| WhatsApp Cloud API | Free up to 1,000 conversations/month |
| n8n Cloud Starter | ~$20/month — or self-host on a $5 VPS |

---

## Future extensions

- API-driven menu (replace static `menu.js` with Supabase or Airtable)
- Customer confirmation message via WhatsApp template
- Order history with a database node in n8n
- Payment integration (Stripe link in checkout)
- Admin dashboard for menu management
- Real-time order tracking
