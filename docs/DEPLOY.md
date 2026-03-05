# Deploy without a domain (Netlify + Render)

**When to do this:** When the website is **finished** (or when you want to put it online for the first time). You don’t need to deploy while you’re still building — keep developing locally with `npm run dev` and only run these steps when you’re ready to go live.

**Before you go live (Clover, Twilio, env vars, testing):** Use **[GO_LIVE_CHECKLIST.md](./GO_LIVE_CHECKLIST.md)** — it walks through everything step by step.

You get **two free URLs** — no domain purchase needed. Add a custom domain later in Netlify when you’re ready.

---

## 1. Push your code to GitHub

If you haven’t already:

- Create a repo on [GitHub](https://github.com/new).
- Push this project:  
  `git init && git add . && git commit -m "Initial" && git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git && git push -u origin main`

---

## 2. Deploy the orders API (Render) — free URL for the backend

1. Go to [render.com](https://render.com) and sign up (free).
2. **New → Web Service**.
3. Connect your GitHub repo (same one as above).
4. Configure:
   - **Name:** e.g. `margaritas-orders-api`
   - **Region:** pick one close to you.
   - **Branch:** `main`.
   - **Root Directory:** leave blank.
   - **Runtime:** Node.
   - **Build Command:** `npm run build:server`
   - **Start Command:** `node dist/index.js`
   - **Environment variables** (Add):
     - `NODE_ENV` = `production`
     - `API_ONLY` = `true`  
     (so the server only runs the orders API, not the static site.)
5. Click **Create Web Service**. Render will build and deploy.
6. Copy your service URL, e.g. **`https://margaritas-orders-api.onrender.com`** (no trailing slash). You’ll use this in Netlify.

**Note:** On Render’s free tier, the filesystem is ephemeral — orders are lost when the service restarts or redeploys. For persistent orders you’d add a [Render Disk](https://render.com/docs/disks) or a small database later.

---

## 3. Deploy the website (Netlify) — free URL for the frontend

1. Go to [netlify.com](https://netlify.com) and sign up (free).
2. **Add new site → Import an existing project**.
3. Connect the **same** GitHub repo.
4. Netlify should detect the build from `netlify.toml`. If not, set:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist/public`
5. **Environment variables** (Site settings → Environment variables → Add):
   - **Key:** `VITE_ORDERS_API_URL`  
   - **Value:** your Render API URL, e.g. `https://margaritas-orders-api.onrender.com`  
   (no trailing slash)
6. **Deploy site**. Netlify will build and give you a URL like **`https://random-name-123.netlify.app`**.

---

## 4. Test

- Open the Netlify URL (e.g. on your phone).
- Place an order (Order → Checkout → Place order).
- On another device (or same), open **Order management** (footer link). You should see the order and a “Synced” badge — orders are stored on Render and shared across devices.

---

## 5. Add a custom domain later

When you buy a domain:

1. In **Netlify**: Site → **Domain settings** → **Add custom domain** → follow the steps (e.g. point DNS to Netlify).
2. Keep **`VITE_ORDERS_API_URL`** pointing to your Render URL; the site will keep using that API.
3. Optional: put the API on a subdomain (e.g. `api.yourdomain.com`) via Render’s custom domain and set `VITE_ORDERS_API_URL` to that.

---

## Summary

| What        | Where   | URL example                          |
|------------|---------|--------------------------------------|
| Website    | Netlify | `https://your-site.netlify.app`      |
| Orders API | Render  | `https://margaritas-orders-api.onrender.com` |

No domain is required to run and test everything.
