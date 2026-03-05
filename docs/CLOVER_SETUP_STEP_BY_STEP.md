# Clover setup — step-by-step

Use this guide to get card payments working with Clover. Choose **Option A** if you have one Clover merchant (e.g. your restaurant). Use **Option B** only if you’re building an app for many merchants.

---

## Option A: Single merchant (one restaurant) — recommended

You’ll get two keys from the **Clover Merchant Dashboard**: a **public** key (for tokenizing cards) and a **private** key (for creating charges). No OAuth or app creation required.

### 1. Open Clover and go to Ecommerce API Tokens

- Log in to [Clover](https://www.clover.com/) (your merchant account).
- Go to **Setup** (or **Settings**) → **Ecommerce** → **Ecommerce API Tokens**.
- If you see a “Welcome” or “Get started” flow, complete it (including two-factor auth and location if Clover asks).

### 2. Create a new token

- Click **Create New Token** (or **Get Started**).
- When asked for **Integration type**, choose **API** (or “API—Generate a public and private token”).
- Click **Create Token**.

### 3. Copy the two keys

You’ll see:

- **Public token** (or “Public key”) — used for card tokenization.
- **Private token** (or “Private key”) — used as Bearer token for charges.

Copy both; you can’t see the private key again after you leave the page.

### 4. Set environment variables on your computer (local testing)

- In the project root, copy `.env.example` to `.env` (if you don’t already have a `.env`).
- In `.env`, set **only** these (leave `VITE_*` for the next step):

```env
CLOVER_SANDBOX=true
CLOVER_ACCESS_TOKEN=<paste the PRIVATE token here>
CLOVER_ECOM_API_KEY=<paste the PUBLIC token here>
```

- For local testing, also set the frontend to point at your local server. In `.env`:

```env
VITE_ORDERS_API_URL=http://localhost:3001
VITE_CHECKOUT_API_URL=http://localhost:3001
```

- Save the file. **Never commit `.env`** (it’s in `.gitignore`).

### 5. Run the server and frontend

- Terminal 1 — backend (must run so checkout can call Clover):

```bash
PORT=3001 npm run dev:server
```

- Terminal 2 — frontend:

```bash
npm run dev
```

- Open the app in the browser (e.g. `http://localhost:5173`).

### 6. Place a test order

- Add something to the cart and go to **Checkout**.
- Fill in personal info and card details.
- Use a **Clover sandbox test card** (sandbox only), for example:
  - Card: `6011361000006668`
  - Expiry: any future date (e.g. `12/28`)
  - CVC: any 3 digits (e.g. `123`)
- Click **Place order**. If everything is set up correctly, the order completes and appears in Admin.

### 7. When you’re ready for production

- In the Clover Merchant Dashboard, switch to **production** (or create production API tokens if your dashboard separates sandbox/production).
- Get the **production** public and private tokens.
- Set in your **production** environment (e.g. Render):
  - `CLOVER_SANDBOX=false`
  - `CLOVER_ACCESS_TOKEN=<production private token>`
  - `CLOVER_ECOM_API_KEY=<production public token>`
- In Netlify (or your frontend host), set `VITE_CHECKOUT_API_URL` and `VITE_ORDERS_API_URL` to your production API URL (e.g. `https://your-app.onrender.com`).

---

## Option B: App for multiple merchants (OAuth + PAKMS)

Use this if you’re building one app that will be used by many Clover merchants (each with their own keys). You need an **OAuth access token** and a **PAKMS key** per merchant.

### 1. Create an app in the Clover Developer Dashboard

- Go to [Clover Developer Dashboard](https://dashboard.clover.com/) (or [Global Developer Dashboard](https://www.clover.com/global-developer-home/home)).
- Create a new app (sandbox first). Note your **App ID** and **App Secret**.

### 2. Install the app on a test merchant

- Follow Clover’s docs to [install your app on a test merchant](https://docs.clover.com/dev/docs/gdp-install-your-app-to-a-test-merchant) and [set app link / CORS](https://docs.clover.com/dev/docs/using-cors).
- Configure **permissions** so the app can create charges and use payments.

### 3. Get an OAuth access token (sandbox)

- In the Developer Dashboard, use the OAuth flow so your test merchant “connects” your app.
- Clover redirects to your app with a `code` in the URL. Your app then exchanges that code for tokens:

```bash
curl -X POST "https://apisandbox.dev.clover.com/oauth/v2/token" \
  -H "Content-Type: application/json" \
  -d '{
    "client_id": "YOUR_APP_ID",
    "client_secret": "YOUR_APP_SECRET",
    "code": "AUTHORIZATION_CODE_FROM_REDIRECT"
  }'
```

- From the JSON response, copy `access_token` (and keep `refresh_token` to get new access tokens when they expire).

### 4. Get the PAKMS key for that merchant

- Using the **access_token** from step 3:

```bash
curl -X GET "https://scl-sandbox.dev.clover.com/pakms/apikey" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

- From the JSON response, copy `apiAccessKey`. That’s the PAKMS / Ecommerce key for this merchant.

### 5. Configure the server

- Set in your environment (e.g. `.env` or Render):
  - `CLOVER_SANDBOX=true`
  - `CLOVER_ACCESS_TOKEN=<access_token from step 3>`
  - `CLOVER_ECOM_API_KEY=<apiAccessKey from step 4>`
- **Note:** Access tokens expire. For production you must implement [refresh token](https://docs.clover.com/dev/docs/refresh-access-tokens) and store per-merchant tokens (e.g. in a database).

### 6. Run and test

- Same as Option A steps 5–6: run server and frontend, set `VITE_CHECKOUT_API_URL` and `VITE_ORDERS_API_URL`, then place a test order with a sandbox test card.

---

## Quick reference

| What you need        | Option A (single merchant)     | Option B (multi-merchant app)   |
|----------------------|--------------------------------|----------------------------------|
| **CLOVER_ACCESS_TOKEN** | Private token from Merchant Dashboard | OAuth `access_token` from v2 token endpoint |
| **CLOVER_ECOM_API_KEY** | Public token from Merchant Dashboard  | `apiAccessKey` from GET `/pakms/apikey`    |
| **CLOVER_SANDBOX**   | `true` for sandbox, `false` for live   | Same                               |

## Troubleshooting

- **“Clover not configured”**  
  Server is missing `CLOVER_ACCESS_TOKEN` or `CLOVER_ECOM_API_KEY`. Add both to `.env` (local) or to your host’s environment (e.g. Render).

- **Checkout fails with 4xx**  
  Check the server logs. Clover returns an error message (e.g. invalid card, expired token). For sandbox, use a [Clover test card](https://docs.clover.com/dev/docs/ecommerce-api-payments-flow).

- **CORS errors in browser**  
  The frontend URL must be allowed by your server. The project’s server allows the origin from `VITE_*` or the request’s `Origin` header; if you use a different frontend URL, you may need to add it to the server’s CORS config.

- **Token expired (Option B)**  
  Use the refresh token to get a new `access_token` and update `CLOVER_ACCESS_TOKEN` (or your per-merchant store). See [Refresh access tokens](https://docs.clover.com/dev/docs/refresh-access-tokens).

---

For more detail on how the app uses these keys, see [CLOVER_INTEGRATION.md](./CLOVER_INTEGRATION.md).
