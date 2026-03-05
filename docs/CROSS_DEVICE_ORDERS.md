# Cross-Device Orders (Phone → Main Dashboard)

So orders placed on one device (e.g. your phone) show up on the admin dashboard on another device (e.g. your main tablet/computer).

## How it works

- **Without API:** Orders are stored in the browser’s **localStorage**. Each device has its own list. Phone orders don’t appear on the main device.
- **With API:** Orders are stored on a **server** (JSON file). Every device (phone, tablet, computer) uses the same server, so everyone sees the same orders.

## Setup (same Wi‑Fi / same network)

1. **Start the orders API server** (one machine on your network, e.g. your main computer or a small server):
   - From the project folder run:
     - **Mac/Linux:** `PORT=3001 npm run dev:server`
     - **Windows (PowerShell):** `$env:PORT=3001; npm run dev:server`
   - The server will listen on port **3001** and log: `Orders API: GET/POST /api/orders ...`

2. **Point the frontend to that server:**
   - Copy `.env.example` to `.env` if you haven’t already.
   - Set:
     - **If you open the site on the same machine as the server:**  
       `VITE_ORDERS_API_URL=http://localhost:3001`
     - **If you open the site on other devices (e.g. phone):** use your computer’s IP and port, e.g.  
       `VITE_ORDERS_API_URL=http://192.168.1.100:3001`  
       (Replace with your machine’s IP; find it in your system settings or with `ipconfig` / `ifconfig`.)

3. **Run the frontend** (on the same or another machine):
   - `npm run dev`
   - Open the site (e.g. from your phone: `http://192.168.1.100:3000` if that’s where Vite is running).

4. **Use the app:**
   - On your **phone**: place an order (Order → Checkout → Place order).
   - On your **main device**: open the admin dashboard (Order management). You should see the same order and a “Synced” indicator in the header.

## Production / deployed site

When you deploy the app and server together (e.g. Railway, Render, VPS):

- Build and run the **same** server (it serves both the API and the static site in production).
- Set `VITE_ORDERS_API_URL` to your **public** API URL (e.g. `https://your-app.com`) so the built frontend talks to your deployed server. Then any device (phone, tablet, computer) will see the same orders.

## Troubleshooting

- **Orders still not syncing:** Ensure `VITE_ORDERS_API_URL` is set in `.env` and you **restarted** `npm run dev` after changing it.
- **CORS or network errors:** The server allows requests from any origin (`*`). If the dashboard is on another host/port, the API URL must be reachable from that device (same network or public URL).
