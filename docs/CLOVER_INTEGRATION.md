# Clover API Integration — Steps to Get Payments to Your Clover Account

Use this guide to connect the checkout flow to Clover so money goes to your Clover account. Start with **fake/sandbox** credentials to verify the flow, then switch to your real keys.

---

## 1. Get Clover credentials (sandbox first)

- **Sandbox (testing):** [Clover Developer Dashboard](https://dashboard.clover.com/) → create an app → use **Sandbox** merchant and get:
  - **Merchant ID** (merchant UUID)
  - **OAuth `access_token`** (with payments permissions)
  - **Ecommerce API key** (PAKMS key) for card tokenization
- **Production:** Same dashboard, use your real Clover account and get production merchant ID, tokens, and API key.

---

## 2. How Clover expects to get paid

Clover’s ecommerce flow is:

1. **Tokenize the card** (never send raw card numbers to your server):  
   Use Clover’s **Create a card token** API with your **Ecommerce API key** (PAKMS).  
   You get a `source` token (starts with `clv_`).
2. **Create the charge:**  
   Your backend calls Clover’s **Create a charge** API with:
   - OAuth **Bearer `access_token`**
   - The **`source`** token from step 1
   - **Amount** (in cents), currency, etc.

Card data should only go to Clover (e.g. via their hosted fields/iframe or a server that calls the tokenize endpoint). Your app should never log or store raw card numbers.

---

## 3. Where to put keys (security)

- **Never** put Clover API keys or OAuth tokens in the frontend (no `VITE_` for secrets).
- Use a **backend** (e.g. your existing `server/` or a small API) that:
  - Receives checkout payload from the frontend (customer info, order lines, **no** raw card number).
  - For card payments: either
    - Receives a **card token** from the frontend (frontend gets it from Clover’s tokenize API or hosted solution), or
    - Uses a **server-side** tokenize call with the Ecommerce API key (only if card is sent to you over HTTPS and you’re PCI-aware; usually tokenizing in the browser or Clover’s iframe is simpler).
  - Calls Clover **Create charge** (and optionally Create order) with the token and your **OAuth `access_token`**.
- Store in **environment variables** on the server, e.g.:
  - `CLOVER_MERCHANT_ID`
  - `CLOVER_ACCESS_TOKEN` (or refresh via OAuth)
  - `CLOVER_ECOM_API_KEY` (PAKMS key, only if you tokenize on server)

---

## 4. What’s implemented in this project

The server already has **POST /api/checkout** that:

- Accepts the same payload the frontend sends (customer, items, subtotal, tax, total, paymentMethod, card when paying by card).
- **Cash:** Saves the order and returns 201.
- **Card:** Tokenizes the card with Clover (PAKMS key), creates a charge (OAuth token), then saves the order and returns 201. On token or charge failure, returns 4xx with a message.

**Server env vars (set on Render or wherever the API runs):**

| Variable | Description |
|----------|-------------|
| `CLOVER_ACCESS_TOKEN` | OAuth access token (from Clover dashboard). |
| `CLOVER_ECOM_API_KEY` | PAKMS / Ecommerce API key (for tokenizing cards). |
| `CLOVER_SANDBOX` | Set to `true` for sandbox (default). Set to `false` for production. |
| `CLOVER_MERCHANT_ID` | Merchant ID for **REST API v3** (full orders + receipts). From Dashboard → API Tokens. |
| `CLOVER_API_TOKEN` | **API Token** from Dashboard → **API Tokens** (not the Ecommerce key). Needs **Read Orders** and **Write Orders**. Used for orders with line items and printing on Clover Station. |

**Clover v3 (full receipts):** After each checkout, the server creates a Clover order with line items and triggers print on your default Clover printer. Set `CLOVER_MERCHANT_ID` and `CLOVER_API_TOKEN` so receipts show item names, quantities, prices, customer info, and special instructions. In the admin dashboard you’ll see Clover sync status, Clover Order ID, “Retry send to Clover,” “View in Clover,” and a **Test Clover** button to verify the integration.

**Frontend:** Set `VITE_CHECKOUT_API_URL` to your server URL (e.g. `https://your-app.onrender.com`). Use the same URL as `VITE_ORDERS_API_URL` so orders and checkout use one backend.

---

## 5. Steps to go live with Clover

| Step | What to do |
|------|------------|
| 1 | Get sandbox credentials from [Clover Developer Dashboard](https://dashboard.clover.com/): OAuth `access_token` and Ecommerce (PAKMS) API key. |
| 2 | On your server (e.g. Render), set `CLOVER_ACCESS_TOKEN`, `CLOVER_ECOM_API_KEY`, and `CLOVER_SANDBOX=true`. For full receipts on Clover Station, also set `CLOVER_MERCHANT_ID` and `CLOVER_API_TOKEN` (from Dashboard → API Tokens, Read/Write Orders). |
| 3 | Set `VITE_CHECKOUT_API_URL` (and `VITE_ORDERS_API_URL`) to your server URL in Netlify (or your frontend host) env. |
| 4 | Run a test order with a [Clover sandbox test card](https://docs.clover.com/dev/docs/ecommerce-api-payments-flow) (e.g. 6011361000006668). |
| 5 | When ready for production, get production credentials, set `CLOVER_SANDBOX=false`, and use production tokens/keys. |

---

## 6. Useful Clover docs

- [Ecommerce API – Accept payments flow](https://docs.clover.com/dev/docs/ecommerce-api-payments-flow)
- [Create a card token](https://docs.clover.com/reference/create-card-token)
- [Create a charge](https://docs.clover.com/reference/createcharge)
- [Create an atomic order](https://docs.clover.com/dev/docs/create-an-atomic-order) (optional, for full order in Clover)
- [Creating custom orders (v3)](https://docs.clover.com/dev/docs/creating-custom-orders) — create order, add line items, print
- [Print orders with the REST API](https://docs.clover.com/dev/docs/printing-orders-rest-api)

---

## 7. .env

See project root **.env.example**. Copy to **.env** and set the Clover vars on the server; never commit **.env**.
