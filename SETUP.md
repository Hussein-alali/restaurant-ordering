# Restaurant Ordering System — Setup Guide

## Architecture

```
Customer Browser (React)
        │
        │  POST /webhook/restaurant-order
        ▼
   n8n Webhook
        │
        ├─ Validate (name, phone, items)
        │
        ├─ Format order message
        │
        └─ WhatsApp Cloud API → Owner's WhatsApp
```

**No traditional backend. No Twilio. No third-party messaging provider.**  
Uses Meta's WhatsApp Business Cloud API directly — free up to 1,000 conversations/month.

---

## 1. React Frontend

### Install & Run

```bash
cd restaurant-ordering
npm install
cp .env.example .env     # set VITE_WEBHOOK_URL
npm run dev              # → http://localhost:5173
npm run build            # production build → dist/
```

### `.env`

```env
VITE_WEBHOOK_URL=https://your-n8n-instance.app/webhook/restaurant-order
```

---

## 2. WhatsApp Cloud API Setup

This uses **Meta's official WhatsApp Business Platform** — no Twilio, no intermediary.

### Step 1 — Create a Meta Developer App

1. Go to [developers.facebook.com](https://developers.facebook.com) → **My Apps → Create App**
2. Choose **Business** type
3. Add the **WhatsApp** product to your app

### Step 2 — Get your credentials

From **WhatsApp → API Setup** in your app dashboard:

| Credential | Where to find |
|------------|---------------|
| `WHATSAPP_ACCESS_TOKEN` | Temporary token on the API Setup page (or generate a permanent System User token via Business Settings) |
| `WHATSAPP_PHONE_NUMBER_ID` | The numeric Phone Number ID shown under your test number |
| `OWNER_PHONE_NUMBER` | Your own WhatsApp number in E.164 format (e.g. `+966501234567`) |

> **Permanent token**: Go to Business Settings → System Users → Create system user with Standard role → Assign the app → Generate token with `whatsapp_business_messaging` permission. This token does not expire.

### Step 3 — Add your number as a test recipient

While in development (before submitting for review):

1. **WhatsApp → API Setup → To** field — add your phone number
2. Send yourself a test message from the dashboard to verify it works

### Step 4 — Go to Production (optional)

1. Add a real phone number under **WhatsApp → Phone Numbers → Add phone number**
2. Verify it via SMS or voice call
3. No app review needed if you're only sending to the owner's number

---

## 3. n8n Workflow Setup

### Import

1. Open n8n → **Workflows → Import from file**
2. Upload `n8n-workflow.json`
3. Set environment variables (below)
4. **Activate** the workflow

### n8n Environment Variables

Set in n8n → **Settings → Environment Variables**:

| Variable | Value |
|----------|-------|
| `WHATSAPP_ACCESS_TOKEN` | Your permanent system user token |
| `WHATSAPP_PHONE_NUMBER_ID` | Numeric ID from Meta dashboard |
| `OWNER_PHONE_NUMBER` | E.164 number, no `+` — e.g. `966501234567` |

> n8n uses `$env.VARIABLE_NAME` to reference these inside nodes.

### Webhook URL

After activating, copy the URL from the **Receive Order** node:
```
https://your-n8n-instance.app/webhook/restaurant-order
```
Paste into `.env` as `VITE_WEBHOOK_URL`.

---

## 4. n8n Workflow — Node Diagram

```
[Webhook POST /webhook/restaurant-order]
                 │
                 ▼
      [IF: Validate Order]
   name ✓  phone ✓  items > 0
        │                  │
      TRUE               FALSE
        │                  │
        ▼                  ▼
  [Code: Format     [Respond 400
   order text]       Invalid Order]
        │
        ▼
  [HTTP Request: WhatsApp Cloud API]
  POST graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages
  Authorization: Bearer {ACCESS_TOKEN}
  Body: { messaging_product, to, type, text }
        │
        ▼
  [Respond 200 Success]
```

---

## 5. WhatsApp Cloud API — HTTP Request Details

```
POST https://graph.facebook.com/v21.0/{PHONE_NUMBER_ID}/messages
Authorization: Bearer {ACCESS_TOKEN}
Content-Type: application/json

{
  "messaging_product": "whatsapp",
  "to": "966501234567",
  "type": "text",
  "text": {
    "preview_url": false,
    "body": "🍽️ NEW ORDER\n..."
  }
}
```

**Successful response (200):**
```json
{
  "messaging_product": "whatsapp",
  "contacts": [{ "input": "966501234567", "wa_id": "966501234567" }],
  "messages": [{ "id": "wamid.xxx" }]
}
```

---

## 6. Example Request & Response

### React → n8n (POST payload)

```json
{
  "orderId": "ORD-1705339200000",
  "timestamp": "2024-01-15T14:30:00.000Z",
  "customer": {
    "name": "Ahmad Hassan",
    "phone": "+966 50 123 4567"
  },
  "items": [
    {
      "id": 1,
      "name": "Bruschetta al Pomodoro",
      "category": "Appetizers",
      "unitPrice": 9.99,
      "quantity": 2,
      "subtotal": 19.98
    },
    {
      "id": 5,
      "name": "Ribeye Steak",
      "category": "Main Course",
      "unitPrice": 42.99,
      "quantity": 1,
      "subtotal": 42.99
    }
  ],
  "total": 62.97,
  "currency": "USD"
}
```

### n8n → React (success response)

```json
{
  "success": true,
  "orderId": "ORD-1705339200000",
  "message": "Order received. Owner notified via WhatsApp."
}
```

### WhatsApp message delivered to owner

```
🍽️ *NEW ORDER*
Order ID: ORD-1705339200000
Time: Jan 15, 2024, 2:30 PM UTC

👤 *Customer*
Name: Ahmad Hassan
Phone: +966 50 123 4567

📦 *Items*
  • 2x Bruschetta al Pomodoro  $19.98
  • 1x Ribeye Steak  $42.99

💰 *Total: $62.97 USD*
```

---

## 7. Cost Breakdown

| Service | Cost |
|---------|------|
| WhatsApp Cloud API | Free up to 1,000 conversations/month (Meta free tier) |
| n8n Cloud (Starter) | ~$20/month — or self-host on a $5 VPS |
| React hosting (Vercel/Netlify) | Free |
| **Total MVP cost** | **~$5–20/month** |

> Owner-to-business messages use the **service window** (free). Since you control both the business number and the owner number, you can keep the window open by messaging the business number from the owner phone periodically — or use the dashboard to send a test message anytime.

---

## 8. Future Extensions

| Feature | How to add |
|---------|-----------|
| Order history | Add PostgreSQL node in n8n between validation and WhatsApp send |
| Customer confirmation | Add a second WhatsApp message node targeting `customer.phone` (requires template message for outbound-initiated) |
| Payments | Add a Stripe payment link to the order form before submission |
| Menu from database | Replace `src/data/menu.js` with a fetch from Supabase or Airtable |
| Order status tracking | Add status field to DB, expose via n8n GET webhook |

---

## 9. Deployment

### React → Vercel

```bash
npm run build
# Push to GitHub → connect repo in Vercel
# Add VITE_WEBHOOK_URL in Vercel Environment Variables
```

### n8n → Self-hosted (Docker on $5 VPS)

```bash
docker run -d \
  --name n8n \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  -e N8N_BASIC_AUTH_ACTIVE=true \
  -e N8N_BASIC_AUTH_USER=admin \
  -e N8N_BASIC_AUTH_PASSWORD=yourpassword \
  n8nio/n8n
```
