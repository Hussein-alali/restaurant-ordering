# Restaurant Ordering System, Minimal Architecture

A lightweight web system for browsing a restaurant menu, placing orders, and sending instant notifications to the owner via WhatsApp. The system avoids a traditional backend and runs with a React frontend and an n8n automation workflow.

---

## Overview

This project focuses on simplicity and low cost.

Architecture:

* React frontend handles UI and order creation
* n8n handles webhook, validation, and message automation
* WhatsApp Cloud API delivers order notifications to the owner

No server, no database, no third-party messaging providers.

---

## Features

Frontend:

* Responsive restaurant menu
* Add, remove, and update cart items
* Live total price calculation
* Customer and delivery form
* Order summary before submission

System:

* HTTP POST request to webhook
* Order validation inside n8n
* Automatic message formatting
* Instant WhatsApp notification to owner

---

## Architecture

Flow:

User → React App → n8n Webhook → WhatsApp Cloud API → Owner

Details:

1. User selects items from menu
2. User enters delivery details
3. React sends order payload to webhook
4. n8n validates and formats message
5. n8n sends request to Meta Graph API
6. Owner receives order on WhatsApp

---

## Tech Stack

Frontend:

* React
* JavaScript
* CSS

Automation:

* n8n

Messaging:

* WhatsApp Business Cloud API

---

## Project Structure

Frontend (React):

* components/

  * MenuList
  * MenuItem
  * Cart
  * CartItem
  * CustomerForm
  * OrderSummary
* pages/

  * MenuPage
  * CartPage
  * CheckoutPage
  * ConfirmationPage
* utils/

  * calculateTotal.js
  * formatPayload.js
  * validateForm.js

---

## Order Payload Example

```json
{
  "customerName": "Hussein",
  "phone": "201234567890",
  "address": "Cairo, Nasr City, Street 10",
  "items": [
    { "id": 1, "name": "Pizza", "quantity": 2, "price": 120 },
    { "id": 2, "name": "Burger", "quantity": 1, "price": 80 }
  ],
  "totalPrice": 320,
  "deliveryNotes": "No onions",
  "timestamp": "2026-04-21T15:30:00Z"
}
```

---

## n8n Workflow

Nodes:

1. Webhook

   * Receives POST request from frontend

2. Function / Set Node

   * Validates required fields
   * Formats message

3. HTTP Request Node

   * Sends message to WhatsApp API

---

## WhatsApp API Configuration

Endpoint:

[https://graph.facebook.com/v21.0/YOUR_PHONE_NUMBER_ID/messages](https://graph.facebook.com/v21.0/YOUR_PHONE_NUMBER_ID/messages)

Headers:

* Authorization: Bearer YOUR_ACCESS_TOKEN
* Content-Type: application/json

Example Request Body:

```json
{
  "messaging_product": "whatsapp",
  "to": "201XXXXXXXXX",
  "type": "text",
  "text": {
    "body": "New Order:\n\nName: Hussein\nPhone: 201234567890\nItems:\n- Pizza x2\n- Burger x1\nTotal: 320 EGP"
  }
}
```

---

## Setup Instructions

1. Frontend

* Install dependencies
* Run React app
* Configure webhook URL

2. n8n

* Create webhook node
* Add validation logic
* Add HTTP request node

3. WhatsApp Cloud API

* Create Meta developer app
* Get access token
* Get phone number ID
* Set recipient number (owner)

---

## Constraints

* No backend server
* No database
* No Twilio or external messaging services
* One-way messaging only (owner notifications)

---

## Cost

* Hosting: around $5 per month
* Messaging: free within WhatsApp Cloud API free tier

---

## Future Improvements

* Database integration for orders
* Payment gateway
* Admin dashboard
* Order tracking system
* Customer notifications
* Menu management panel

---

## Goal

Deliver a clean MVP for real-world restaurant usage with minimal complexity, fast setup, and low operational cost.
