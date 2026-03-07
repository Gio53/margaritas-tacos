# How to Set Up Clover & Admin Dashboard

Follow these steps to get your restaurant website talking to Clover and printing full receipts on your Clover Station Trio.

---

## 1. Run the project locally

```bash
# Install dependencies (from project root)
npm install

# Start the API server (handles checkout + Clover)
npm run dev:server
```

Leave that running. In another terminal:

```bash
# Start the frontend (Vite)
npm run dev
```

- Frontend: **http://localhost:5173**
- API: **http://localhost:3000** (or the port shown in the server log)

---

## 2. Point the frontend at your API

So that orders and checkout hit your server (and Clover runs on the server), set:

**In the project root, create or edit `.env`** (copy from `.env.example`):

```env
# Use your running server URL (same for both in local dev)
VITE_ORDERS_API_URL=http://localhost:3000
VITE_CHECKOUT_API_URL=http://localhost:3000
```

Restart the Vite dev server after changing `.env`.

---

## 3. Get Clover credentials

You need **two sets** of Clover credentials:

### A. Payments (card charges) — optional if you only want receipts

- Go to [Clover Developer Dashboard](https://dashboard.clover.com/).
- Create or open an app, use **Sandbox** for testing.
- Get:
  - **Merchant ID**
  - **OAuth access token** (with payments)
  - **Ecommerce API key** (PAKMS) for card tokenization

### B. Orders & receipts (what makes full receipts print)

- In the same Clover Dashboard, go to **API Tokens** (or **Developers → API Tokens**).
- Create or copy a token that has **Read Orders** and **Write Orders**.
- Note your **Merchant ID** (same as above if same merchant).

You’ll use:
- **CLOVER_MERCHANT_ID** = that Merchant ID  
- **CLOVER_API_TOKEN** = the token from **API Tokens** (not the Ecommerce key)

---

## 4. Set environment variables on the server

All Clover keys go on the **server** only (never in `VITE_*`).

**Local:** in the project root `.env` (same file as step 2), add:

```env
# Sandbox vs production (use true for testing)
CLOVER_SANDBOX=true

# Payments (card charges) — required only if you accept card online
CLOVER_ACCESS_TOKEN=your-oauth-access-token
CLOVER_ECOM_API_KEY=your-pakms-ecom-api-key

# Orders + receipts on Clover Station (full line items, print)
CLOVER_MERCHANT_ID=your-merchant-id
CLOVER_API_TOKEN=your-api-token-from-api-tokens-page
```

**Production (e.g. Render):** set the same variables in the service’s **Environment** tab. Never commit real values to git.

---

## 5. Restart the server and test

1. Restart the API server so it picks up the new env vars.
2. Open the site, go to **Admin** (e.g. http://localhost:5173/admin), log in (password: **2022**).
3. Click **“Test Clover Integration”** in the header.
   - Success: you’ll see a green message and a Clover Order ID; a **test receipt** (marked “TEST ORDER”) should print on your Clover Station Trio.
   - Failure: you’ll see an error; check `CLOVER_MERCHANT_ID`, `CLOVER_API_TOKEN`, and that the token has Read/Write Orders.
4. Place a **real order** from the site (cart → checkout).  
   - In Admin you should see the order with a green “Sent to Clover” indicator and a Clover Order ID.  
   - A full receipt (line items, customer, pickup) should print on the Clover printer.

---

## 6. Admin dashboard quick reference

| Feature | Where |
|--------|--------|
| Clover status (sent / failed / sending) | On each order card (green check, red X, yellow spinner) |
| Clover Order ID | On each order card under “Clover Order ID:” |
| Retry failed orders | “Retry send to Clover” on failed/pending orders |
| Open in Clover | “View in Clover Dashboard” (opens Clover with that order) |
| Test integration | “Test Clover Integration” in the header |
| Filter by Clover status | “All orders” / “Sent to Clover” / “Failed to send” under the order list |

---

## 7. Going to production

1. Get **production** Clover credentials (real merchant, production API token with Read/Write Orders).
2. Deploy your API (e.g. Render) and set env vars there:
   - `CLOVER_SANDBOX=false`
   - `CLOVER_MERCHANT_ID`, `CLOVER_API_TOKEN` (and payment vars if you use card).
3. Set frontend env on your host (e.g. Netlify):
   - `VITE_ORDERS_API_URL=https://your-api.onrender.com`
   - `VITE_CHECKOUT_API_URL=https://your-api.onrender.com`
4. Run “Test Clover Integration” again from the live admin to confirm receipts print.

---

## Troubleshooting

| Problem | What to check |
|--------|----------------|
| “Clover v3 not configured” | `CLOVER_MERCHANT_ID` and `CLOVER_API_TOKEN` set on the **server** and server restarted. |
| Receipt doesn’t print | Same env vars; Clover Station is on and default printer is set; token has **Write Orders**. |
| “Orders API URL not set” on Test | Frontend `.env` has `VITE_ORDERS_API_URL` pointing at your API and you restarted Vite. |
| Card charge fails but order saves | Payment uses `CLOVER_ACCESS_TOKEN` and `CLOVER_ECOM_API_KEY`; receipts use `CLOVER_API_TOKEN`. |

For more detail, see **docs/CLOVER_INTEGRATION.md**.
