# Go-live checklist — step by step (beginner-friendly)

This guide walks you through putting your Margaritas Tacos site on the internet so customers can order, pay with a card, and get a text when their order is ready. If you’ve never used GitHub, Netlify, Render, or Twilio before, that’s okay — we’ll explain each part in plain language.

---

## What you’re putting online (in simple terms)

Your project has **two parts**:

1. **The website** (what customers see) — the order page, checkout, menu, etc. This will be hosted on **Netlify**. Customers will open a link like `https://your-site.netlify.app` in their browser.
2. **The server / backend** (the “brain”) — it saves orders, talks to Clover to charge cards, and sends the “order ready” text via Twilio. This will run on **Render**. Customers never open Render; only your website talks to it.

You’ll also use **GitHub** to store your code online. Netlify and Render will connect to GitHub so they can automatically build and run your project. **Environment variables** are secret settings (like API keys and passwords) that you type into Netlify and Render — you never put them in your code or on GitHub.

---

## Step 1: Put your code on GitHub

**What is GitHub?**  
A place to store your code on the internet. Netlify and Render need to “see” your code to build and run it, so we put it on GitHub first.

**What to do:**

1. Go to [github.com](https://github.com) and create a free account (or log in).
2. Click the **+** at the top right and choose **New repository**.
3. Give it a name (e.g. `margaritas-tacos`). Leave the rest as default. Click **Create repository**.
4. On your computer, open a terminal in your project folder (the one that has `package.json`).
5. Run these commands one at a time (replace `YOUR_USERNAME` and `YOUR_REPO` with your GitHub username and repo name):

   ```text
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

6. If it asks for a username and password, use your GitHub username and a **Personal Access Token** (GitHub → Settings → Developer settings → Personal access tokens → create one with “repo” access). Use the token as the password.
7. After it finishes, refresh your repo page on GitHub. You should see all your project files there.

**If your repo on GitHub only shows a README (no `package.json`, no `server` or `client` folders):**  
You didn’t push the full project — only a README is on GitHub. Do this from your **project folder** (the one that has `package.json`, `server/`, `client/`, etc.):

1. Open a terminal in that folder (e.g. `cd C:\Users\...\margaritas-tacos` or wherever the project lives).
2. Run:  
   `git status`  
   If it says “not a git repository,” run:  
   `git init`  
   then:  
   `git add .`  
   `git commit -m "Add full project"`  
   `git branch -M main`  
   `git remote add origin https://github.com/YOUR_USERNAME/margaritas-tacos.git`  
   (use your GitHub username and repo name).
3. If you already had `git remote add origin` before, the remote might point at the repo that only has the README. Then run:  
   `git push -u origin main --force`  
   The `--force` replaces what’s on GitHub with your full project (so the README-only state is overwritten). Only do this if the repo has nothing else you need.
4. If you never added the remote, run:  
   `git push -u origin main`  
   (and use your GitHub username + Personal Access Token if it asks for a password).
5. Refresh the repo on GitHub. You should now see `package.json`, `server/`, `client/`, `docs/`, `render.yaml`, etc.

**Important:** Your `.env` file (with your real Clover and Twilio keys) should **not** be on GitHub. The project’s `.gitignore` already lists `.env`, so `git add .` won’t add it. Never copy your `.env` into the repo. We’ll type those secrets into Render and Netlify later.

**Quick check:** In the project folder run `npm run build`, then `npm run build:server`. If both finish without errors, you’re good to move on.

---

## Step 2: Get your Clover keys (for real card payments)

**What is Clover?**  
The system you use to accept card payments. Your site sends card details to your server, and the server talks to Clover to charge the customer. For “live” (real) payments you need **production** keys from Clover, not sandbox.

**What to do:**

1. Log in to your **Clover** account (the one you use for your restaurant).
2. Go to the place where you manage **Ecommerce** or **API** settings (often under Setup or Settings → Ecommerce → Ecommerce API Tokens).
3. Create or open your **production** API token (not sandbox). You should get two values:
   - **Public token** (or “public key”) — used to turn the card into a one-time token.
   - **Private token** (or “private key”) — used to actually charge the card.
4. Copy both and keep them somewhere safe (e.g. a notes app). You’ll paste them into Render in Step 4. **Do not** put them in your code or on GitHub.

---

## Step 3: Get your Twilio details (for “order ready” texts)

**What is Twilio?**  
A service that sends SMS messages. When you click “Mark ready” in Order Management, your server will ask Twilio to send a text to the customer’s phone.

**What to do:**

1. Go to [twilio.com](https://www.twilio.com) and sign up (or log in).
2. If you’re on a **trial**, you can only send to phone numbers you “verify” in Twilio. To send to any customer, add a little credit or upgrade (Twilio will explain when you try to send).
3. In the Twilio dashboard (console):
   - Find **Account SID** and **Auth Token** (often on the main page or under Account → API keys).
   - Get your **Twilio phone number** (the number Twilio gives you to send from). It usually looks like `+1 516 555 1234`. Write it as one string with no spaces, e.g. `+15165551234`.
4. Copy these three things: **Account SID**, **Auth Token**, **Twilio phone number**. You’ll paste them into Render in Step 4.

---

## Step 4: Set up Render (the server that handles orders, payments, and SMS)

**What is Render?**  
A place that runs your **server** (backend) on the internet 24/7. When a customer clicks “Place order,” your website sends the order and card info to this server. The server saves the order, charges the card via Clover, and later sends the “order ready” text via Twilio.

**What to do:**

1. Go to [render.com](https://render.com) and sign up (free account is fine). You can “Sign up with GitHub” so Render can see your repos.
2. Click **New +** and choose **Web Service**.
3. Connect your **GitHub** account if you haven’t. Select the repo where you put the Margaritas Tacos code.
4. Render will ask how to run your app. Fill it in like this:
   - **Name:** something like `margaritas-orders-api` (this becomes part of your URL).
   - **Region:** pick one close to you (e.g. Oregon).
   - **Branch:** `main`.
   - **Root Directory:** leave **blank**. (If you put `src` or anything here, the build will fail because `package.json` is at the repo root, not inside a subfolder.)
   - **Runtime:** **Node**.
   - **Build Command:** type exactly: `npm run build:server`
   - **Start Command:** type exactly: `node dist/index.js`
5. Before you click **Create**, scroll to **Environment Variables** (or find it after creating the service). Click **Add Environment Variable** and add these **one by one** (use the exact names; values are what you copied earlier):

   | Key (name)                  | Value (your actual value)                          |
   |-----------------------------|----------------------------------------------------|
   | `NODE_ENV`                  | `production`                                       |
   | `API_ONLY`                  | `true`                                             |
   | `CLOVER_SANDBOX`            | `false`                                            |
   | `CLOVER_ACCESS_TOKEN`       | your Clover **private** token                      |
   | `CLOVER_ECOM_API_KEY`       | your Clover **public** token                       |
   | `TWILIO_ACCOUNT_SID`        | your Twilio Account SID                            |
   | `TWILIO_AUTH_TOKEN`         | your Twilio Auth Token                             |
   | `TWILIO_PHONE_NUMBER`       | your Twilio number, e.g. `+15165551234`            |

   Don’t add quotes around the values. No spaces at the start or end.

6. Click **Create Web Service**. Render will build and start your server. Wait until it says the service is **live** (green).
7. At the top of the page you’ll see your service URL, something like `https://margaritas-orders-api.onrender.com`. **Copy this URL** and keep it — you’ll need it for Netlify. Do **not** add a slash at the end.

**If the build fails with “Could not read package.json” or “ENOENT ... package.json”:**  
Render is building from the wrong folder. Try this:

- **Option A — Find Root Directory:** In Render, open your service → **Settings** (left sidebar or top). Scroll to **Build & Deploy** (or **Build**). Look for **Root Directory** or **Repository root**. If you see it and it says `src` or anything else, **clear it** so it’s empty, then save and redeploy.
- **Option B — Check your GitHub repo:** Open your repo in the browser. When you look at the files, is **package.json** at the **top level** (same level as `server`, `client`, `docs`)? Or is it inside a folder (e.g. one folder and then package.json inside it)? If it’s inside a folder, that folder name is your “root” — in Render, set **Root Directory** to that folder name (e.g. `margaritas-tacos`).
- **Option C — Use the project’s render.yaml:** This repo has a `render.yaml` file at the root that tells Render to build from the repo root. Push the latest code (including `render.yaml`) to GitHub. In Render, go to **Dashboard** → **New +** → **Blueprint**. Connect the same repo. Render will read `render.yaml` and create or update the service from it (build runs from repo root). Then add your **environment variables** (Clover, Twilio, etc.) in the new/updated service’s **Environment** tab.

**Note:** On Render’s free plan, if the service restarts or redeploys, any orders stored in the server’s files may be reset. For a busy restaurant you may later add a small database or Render Disk; for now you can go live and test.

---

## Step 5: Set up Netlify (the website customers visit)

**What is Netlify?**  
A place that hosts your **website** (the pages customers see and use to order). When someone opens your Netlify link, they get the order page, checkout, etc. When they click “Place order,” the site sends the order to your **Render** server (using the URL you copied).

**What to do:**

1. Go to [netlify.com](https://netlify.com) and sign up (free). “Sign up with GitHub” is easiest.
2. Click **Add new site** → **Import an existing project**.
3. Choose **GitHub** and pick the **same repo** you used for Render (your Margaritas Tacos repo).
4. Netlify may already see the build settings from your project. If it shows:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist/public`  
   leave them as is. If not, type those in.
5. **Before** you click **Deploy**, open **Advanced** or **Environment variables** and add two variables:

   | Key (name)                  | Value                                              |
   |-----------------------------|----------------------------------------------------|
   | `VITE_ORDERS_API_URL`       | the Render URL you copied, e.g. `https://margaritas-orders-api.onrender.com` |
   | `VITE_CHECKOUT_API_URL`     | the **same** Render URL again                      |

   Again: no trailing slash, no quotes. Same URL for both.

6. Click **Deploy site**. Wait until the deploy finishes (status “Published”).
7. Netlify will show your site URL, something like `https://something-random-123.netlify.app`. That’s the link you can share with customers (or connect a custom domain later).

---

## Step 6: Admin password (who can see Order Management)

Only people who know the password can open **Order Management** (where you see orders and click “Mark ready”).

- The default password in the code is **2022**. If you want to change it: in your project open `client/src/pages/Admin.tsx`, find the line that says `ADMIN_PASSWORD = "2022"`, change `"2022"` to your new password, save, then push to GitHub so Netlify can redeploy. Keep the new password private.

---

## Step 7: Restaurant hours (when customers can order)

The site only allows checkout during your open hours (Tue–Thu & Sun 2–9pm, Fri–Sat 2–10pm EST; closed Monday). If you need to change these later, edit `client/src/utils/hours.ts` in the project, then push to GitHub and let Netlify redeploy.

---

## Step 8: Test everything before you share the link

Go through this once so you know it all works:

1. Open your **Netlify** URL in your browser (and on your phone if possible).
2. Add an item to the cart and go to checkout. Enter your real name, email, and **your own phone number** so you can get the test text. Use a real card with a small amount — you should see the charge in Clover.
3. After the order goes through, open **Order Management** (link in the footer). Log in with the admin password (2022 or whatever you set). You should see the order you just placed.
4. Click **Mark ready** for that order. In a few seconds your phone should get a text saying the order is ready for pickup.
5. Click **Print ticket** and make sure the kitchen ticket looks right (print or save as PDF).
6. If you want, try opening the site outside your open hours — you should see “We’re closed” and not be able to place an order.

If all of that works, you’re ready to share the Netlify link with customers (or add a custom domain in Netlify and point it to your site).

---

## Step 9: Custom domain (optional, for later)

When you buy a domain (e.g. `margaritastacos.com`), you can connect it to your Netlify site so customers go to that address instead of `something.netlify.app`. In Netlify: **Site configuration** → **Domain management** → **Add custom domain**, then follow the instructions (usually adding a few DNS records at your domain provider). Keep `VITE_ORDERS_API_URL` and `VITE_CHECKOUT_API_URL` in Netlify pointing to your **Render** URL; the site will keep using that server.

---

## Quick reference (where everything lives)

| What                         | Where it’s set up        | What you need there                                      |
|-----------------------------|---------------------------|----------------------------------------------------------|
| Your code                   | GitHub                    | Repo with the project (no `.env` in the repo)           |
| Clover (card payments)      | Render env vars           | `CLOVER_SANDBOX=false`, `CLOVER_ACCESS_TOKEN`, `CLOVER_ECOM_API_KEY` |
| Twilio (order-ready texts)  | Render env vars           | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER` |
| Server (orders, checkout)   | Render                    | Build: `npm run build:server`, Start: `node dist/index.js`, plus env vars |
| Website (what customers see)| Netlify                   | Build: `npm run build`, Publish: `dist/public`, plus `VITE_ORDERS_API_URL` and `VITE_CHECKOUT_API_URL` = Render URL |
| Admin password              | In code (`Admin.tsx`)     | Change there, then push and redeploy                     |

Once you’ve done Steps 1–8 and tested, you’re live and can use Twilio to text customers when their order is ready.
