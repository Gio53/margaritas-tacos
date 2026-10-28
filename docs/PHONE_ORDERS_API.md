# AI Phone Assistant — Order Intake API

Record-only endpoint for an AI Phone Assistant. It saves the order so it appears in the
restaurant's admin panel (with a **PHONE (AI)** badge, an **UNPAID** badge, and a distinct
alarm) as a backup in case the assistant's own ticket to the Clover printer never printed.

**This endpoint does NOT print to Clover, does NOT record any payment, and does NOT send
any SMS/email to the customer.** The assistant is responsible for sending its own ticket to
the Clover printer and for all customer communication. The customer pays at pickup.

## Endpoint

```
POST {SERVER_URL}/api/orders/phone
```

`SERVER_URL` is the same host as the orders API (the `VITE_ORDERS_API_URL` value, e.g.
`https://your-app.onrender.com`).

## Authentication

Send your API key in the `x-api-key` header. The key is the server's `PHONE_ORDER_API_KEY`
env var (generate one with `openssl rand -hex 32` and set it on the server, e.g. Render).

| Status | Meaning |
|---|---|
| `201` | Order saved — body is the stored order JSON |
| `400` | Validation error — body is `{ "error": "..." }` with a message you can act on |
| `401` | Missing or wrong `x-api-key` header |
| `503` | Server has no `PHONE_ORDER_API_KEY` configured (endpoint disabled) |
| `500` | Server error — retry safe (order was not saved) |

## Request body

All amounts are **dollars** (decimals, e.g. `13.5`), not cents.

```jsonc
{
  "customer": {
    "firstName": "Maria",          // required
    "lastName": "Lopez",           // optional
    "phone": "516-555-0123",       // optional (callers sometimes order without one)
    "email": "maria@example.com"   // optional
  },
  "items": [                        // required, 1–50 lines
    {
      "categoryName": "3 American Tacos",  // required, must match the menu category name
      "itemName": "Ground Beef",           // required, must match the menu item name
      "quantity": 1,                       // required, integer 1–99
      "lineTotal": 14.0,                   // required, >= 0, total for the line (price × qty + extras)
      "categoryId": "3-american-tacos",    // optional but recommended (see Choices below)
      "removeIngredients": ["Sour Cream"], // optional
      "addExtras": [                       // optional
        { "name": "Guacamole", "quantity": 1, "price": 3.0 }
      ],
      "choices": { "shell": "Hard shell" } // optional, see below
    }
  ],
  "subtotal": 14.0,                 // required, >= 0
  "tax": 1.24,                      // required, >= 0 (NY: 8.875% — the app uses this rate)
  "total": 15.24,                   // required, must equal subtotal + tax (± $0.02)
  "pickupAddress": "4549 Austin Blvd, Island Park, NY"  // optional, has a default
}
```

### Item identity and choices

- Menu items are identified by **exact name strings** (`categoryName` + `itemName`) as they
  appear on the menu. The menu lives in `client/src/data/menuData.ts` (category ids and
  item names/prices); option catalogs are in `client/src/data/orderOptions.ts`.
- **Prices are NOT re-validated server-side** — the order is recorded with whatever
  `lineTotal` you send. Your assistant must price from an up-to-date menu.
- `choices` uses option ids as keys. Recommended to send `categoryId` so the admin panel
  and the backup kitchen ticket format them correctly:
  - `3-american-tacos` → `choices.shell` (`"Hard shell"` / `"Soft shell"`) — required for this category
  - `enchiladas` → `choices.sauce` (red/green), `choices.tortilla` (corn/flour)
  - `chilaquiles`, `wet-burrito` → `choices.sauce` (red/green)
- `addExtras` on the menu: Guacamole $3, Pico $2, Sour Cream $2 (include `price` and fold
  it into `lineTotal`).

## Response

`201` with the stored order:

```jsonc
{
  "id": "order-1769542100000-ab12cd3",
  "source": "phone",
  "status": "pending",
  "customer": { "firstName": "Maria", "lastName": "Lopez", "email": "...", "phone": "..." },
  "items": [ /* merged lines with lineTotal */ ],
  "subtotal": 14.0,
  "tax": 1.24,
  "total": 15.24,
  "pickupAddress": "Phone order — pickup in store",
  "paymentMethod": "cash",
  "createdAt": 1769542100000
}
```

Notes:

- `paymentMethod` is always `"cash"` and there is **no payment step** — the customer pays
  at pickup. The admin panel shows an UNPAID badge until the order is completed.
- Duplicate identical lines (same item + same modifiers) are merged and their quantities
  and totals summed, matching what the kitchen ticket shows.
- Orders created here stay `pending` until staff mark them ready/completed in the admin
  panel. They are excluded from the automatic "ready" timer and never trigger the
  "order ready" SMS/email.

## What the restaurant sees

- The order appears in the admin panel (Orders → Today) within ~15 seconds.
- A looping alarm plays — a fast high triple-beep for phone orders (the regular web-order
  alarm is a slower double-beep). Pressing **Spacebar** silences it.
- The order card shows a purple **PHONE (AI)** badge and a red **UNPAID** badge (until
  completed), and the browser-printable backup kitchen ticket is stamped
  `** PHONE ORDER — NOT PAID **` so staff can write the order down if your ticket
  to the Clover printer failed.
