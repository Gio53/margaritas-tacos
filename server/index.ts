import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root so CLOVER_ACCESS_TOKEN, CLOVER_ECOM_API_KEY, PORT are set
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const ORDERS_FILE =
  process.env.NODE_ENV === "production"
    ? path.resolve(__dirname, "..", "data", "orders.json")
    : path.resolve(__dirname, "..", "data", "orders.json");

/** Order as stored in orders.json; includes optional Clover sync fields */
interface StoredOrder {
  id: string;
  status: string;
  customer?: { firstName?: string; lastName?: string; email?: string; phone?: string };
  items?: Array<{
    categoryName?: string;
    itemName?: string;
    quantity?: number;
    removeIngredients?: string[];
    addExtras?: unknown[];
    lineTotal?: number;
  }>;
  subtotal?: number;
  tax?: number;
  total?: number;
  pickupAddress?: string;
  paymentMethod?: string;
  createdAt?: number;
  cloverOrderId?: string;
  cloverSyncStatus?: "pending" | "synced" | "failed";
  cloverError?: string;
}

async function readOrders(): Promise<StoredOrder[]> {
  try {
    const raw = await fs.readFile(ORDERS_FILE, "utf-8");
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function writeOrders(orders: StoredOrder[]) {
  await fs.mkdir(path.dirname(ORDERS_FILE), { recursive: true });
  await fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 2), "utf-8");
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "1mb" }));

  // CORS so frontend on another port (e.g. Vite) can call API
  app.use((_req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    if (_req.method === "OPTIONS") return res.sendStatus(204);
    next();
  });

  // --- Clover helpers (sandbox vs production) ---
  const CLOVER_SANDBOX = process.env.CLOVER_SANDBOX !== "false";
  const CLOVER_TOKEN_URL = CLOVER_SANDBOX
    ? "https://token-sandbox.dev.clover.com/v1/tokens"
    : "https://token.clover.com/v1/tokens";
  const CLOVER_CHARGES_URL = CLOVER_SANDBOX
    ? "https://scl-sandbox.dev.clover.com/v1/charges"
    : "https://scl.clover.com/v1/charges";

  const CLOVER_V3_BASE = CLOVER_SANDBOX
    ? "https://apisandbox.dev.clover.com"
    : "https://api.clover.com";
  const CLOVER_MERCHANT_ID = process.env.CLOVER_MERCHANT_ID ?? "";
  const CLOVER_API_TOKEN = process.env.CLOVER_API_TOKEN ?? "";

  /**
   * Create a Clover v3 order with line items and trigger print on the merchant's default printer.
   * Uses API Token from Dashboard → API Tokens (Read/Write Orders). Prices in cents.
   */
  async function sendOrderToClover(order: StoredOrder): Promise<{
    cloverOrderId?: string;
    cloverSyncStatus: "synced" | "failed";
    cloverError?: string;
  }> {
    if (!CLOVER_MERCHANT_ID || !CLOVER_API_TOKEN) {
      console.warn("Clover v3 not configured: set CLOVER_MERCHANT_ID and CLOVER_API_TOKEN");
      return { cloverSyncStatus: "failed", cloverError: "Clover v3 not configured" };
    }
    const mId = CLOVER_MERCHANT_ID;
    const totalCents = Math.round((order.total ?? 0) * 100);
    const customerName = [order.customer?.firstName, order.customer?.lastName].filter(Boolean).join(" ") || "Customer";
    const customerPhone = order.customer?.phone ?? "";
    const pickup = order.pickupAddress ?? "";
    const noteLines = [`Customer: ${customerName}`, customerPhone ? `Phone: ${customerPhone}` : "", pickup ? `Pickup: ${pickup}` : ""].filter(Boolean);
    const orderNote = noteLines.join("\n");

    try {
      const createRes = await fetch(`${CLOVER_V3_BASE}/v3/merchants/${mId}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CLOVER_API_TOKEN}`,
        },
        body: JSON.stringify({
          state: "Open",
          total: totalCents,
          currency: "USD",
          note: orderNote,
        }),
      });
      if (!createRes.ok) {
        const errText = await createRes.text();
        console.error("Clover create order error", createRes.status, errText);
        return { cloverSyncStatus: "failed", cloverError: errText.slice(0, 200) };
      }
      const created = (await createRes.json()) as { id?: string };
      const cloverOrderId = created.id;
      if (!cloverOrderId) {
        return { cloverSyncStatus: "failed", cloverError: "No order id in Clover response" };
      }

      const orderItems = order.items ?? [];
      for (const line of orderItems) {
        const qty = Math.max(1, line.quantity ?? 1);
        const lineTotal = line.lineTotal ?? 0;
        const pricePerUnitCents = Math.round((lineTotal / qty) * 100);
        const name = [line.categoryName, line.itemName].filter(Boolean).join(" — ") || line.itemName || "Item";
        const mods: string[] = [];
        if (line.removeIngredients?.length) mods.push(`No: ${line.removeIngredients.join(", ")}`);
        if (line.addExtras?.length) {
          const extras = line.addExtras.map((e: unknown) => (typeof e === "object" && e !== null && "name" in e ? String((e as { name?: string }).name) : String(e)));
          mods.push(`Add: ${extras.join(", ")}`);
        }
        const lineNote = mods.join("; ") || undefined;
        const lineRes = await fetch(`${CLOVER_V3_BASE}/v3/merchants/${mId}/orders/${cloverOrderId}/line_items`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${CLOVER_API_TOKEN}`,
          },
          body: JSON.stringify({
            name,
            price: pricePerUnitCents,
            unitQty: qty,
            ...(lineNote && { note: lineNote }),
          }),
        });
        if (!lineRes.ok) {
          const errText = await lineRes.text();
          console.error("Clover line item error", lineRes.status, errText);
          return {
            cloverOrderId,
            cloverSyncStatus: "failed",
            cloverError: `Line item failed: ${errText.slice(0, 150)}`,
          };
        }
      }

      const printRes = await fetch(`${CLOVER_V3_BASE}/v3/merchants/${mId}/print_event`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${CLOVER_API_TOKEN}`,
        },
        body: JSON.stringify({ orderRef: { id: cloverOrderId } }),
      });
      if (!printRes.ok) {
        const errText = await printRes.text();
        console.error("Clover print_event error", printRes.status, errText);
        return {
          cloverOrderId,
          cloverSyncStatus: "synced",
          cloverError: `Order created but print failed: ${errText.slice(0, 100)}`,
        };
      }
      return { cloverOrderId, cloverSyncStatus: "synced" };
    } catch (e) {
      const err = e instanceof Error ? e.message : String(e);
      console.error("Clover v3 error", err);
      return { cloverSyncStatus: "failed", cloverError: err };
    }
  }

  function parseExpiry(expiry: string): { exp_month: string; exp_year: string } | null {
    const s = String(expiry).replace(/\D/g, "");
    if (s.length < 4) return null;
    const mm = s.slice(0, 2);
    const yy = s.slice(2, 4);
    const yyyy = parseInt(yy, 10) < 50 ? `20${yy}` : `19${yy}`;
    return { exp_month: mm, exp_year: yyyy };
  }

  // --- Checkout (saves order; charges card via Clover when paymentMethod === 'card') ---
  app.post("/api/checkout", async (req, res) => {
    try {
      const body = req.body as {
        customer?: { firstName: string; lastName: string; email: string; phone: string };
        items?: unknown[];
        subtotal?: number;
        tax?: number;
        total?: number;
        paymentMethod?: string;
        card?: { number?: string; expiry?: string; cvc?: string };
        pickupAddress?: string;
      };
      const {
        customer,
        items,
        subtotal,
        tax,
        total,
        paymentMethod,
        card,
        pickupAddress,
      } = body;

      if (!customer || !items || !Array.isArray(items) || total == null) {
        return res.status(400).json({ error: "Missing customer, items, or total" });
      }

      const orderId = `order-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const newOrder: StoredOrder = {
        id: orderId,
        status: "pending",
        customer,
        items: items as StoredOrder["items"],
        subtotal: subtotal ?? total,
        tax: tax ?? 0,
        total,
        pickupAddress: pickupAddress ?? "",
        paymentMethod: paymentMethod === "card" ? "card" : "cash",
        createdAt: Date.now(),
      };

      if (paymentMethod === "card" && card) {
        const accessToken = process.env.CLOVER_ACCESS_TOKEN;
        const ecomKey = process.env.CLOVER_ECOM_API_KEY;
        if (!accessToken || !ecomKey) {
          return res.status(503).json({ error: "Clover not configured. Set CLOVER_ACCESS_TOKEN and CLOVER_ECOM_API_KEY." });
        }
        const parsed = parseExpiry(card.expiry ?? "");
        if (!card.number || !parsed || !card.cvc) {
          return res.status(400).json({ error: "Invalid card: need number, expiry (MMYY), and CVC" });
        }

        // 1) Tokenize card
        const tokenRes = await fetch(CLOVER_TOKEN_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            apikey: ecomKey,
          },
          body: JSON.stringify({
            card: {
              number: card.number.replace(/\D/g, ""),
              exp_month: parsed.exp_month,
              exp_year: parsed.exp_year,
              cvv: String(card.cvc).replace(/\D/g, ""),
            },
          }),
        });
        if (!tokenRes.ok) {
          const errText = await tokenRes.text();
          console.error("Clover token error", tokenRes.status, errText);
          let msg = "Card could not be verified. Check number and expiry.";
          try {
            const errJson = JSON.parse(errText) as { message?: string };
            if (errJson.message) msg = errJson.message;
          } catch {
            if (errText.length < 120) msg = errText;
          }
          return res.status(400).json({ error: msg });
        }
        const tokenData = (await tokenRes.json()) as { id?: string };
        const sourceToken = tokenData.id;
        if (!sourceToken) {
          return res.status(502).json({ error: "Invalid response from payment processor." });
        }

        // 2) Create charge (amount in cents)
        const amountCents = Math.round(total * 100);
        const chargeRes = await fetch(CLOVER_CHARGES_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            amount: amountCents,
            currency: "usd",
            source: sourceToken,
          }),
        });
        if (!chargeRes.ok) {
          const errText = await chargeRes.text();
          console.error("Clover charge error", chargeRes.status, errText);
          let msg = "Payment failed. Please check your card or try another.";
          try {
            const errJson = JSON.parse(errText) as { message?: string };
            if (errJson.message) msg = errJson.message;
          } catch {
            if (errText.length < 120) msg = errText;
          }
          return res.status(402).json({ error: msg });
        }
      }

      // Save order (cash or after successful card charge)
      const orders = await readOrders();
      orders.unshift(newOrder);
      await writeOrders(orders);

      const cloverResult = await sendOrderToClover(newOrder);
      const updatedOrder: StoredOrder = {
        ...newOrder,
        cloverOrderId: cloverResult.cloverOrderId,
        cloverSyncStatus: cloverResult.cloverSyncStatus,
        cloverError: cloverResult.cloverError,
      };
      const idx = orders.findIndex((o) => o.id === newOrder.id);
      if (idx !== -1) {
        orders[idx] = updatedOrder;
        await writeOrders(orders);
      }

      res.status(201).json(updatedOrder);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Checkout failed. Please try again." });
    }
  });
  app.get("/api/orders", async (_req, res) => {
    try {
      const orders = await readOrders();
      res.json(orders);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to load orders" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const body = req.body as Record<string, unknown>;
      const orders = await readOrders();
      const id = `order-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      const newOrder: StoredOrder = {
        ...(body as Partial<StoredOrder>),
        id,
        status: "pending",
        createdAt: Date.now(),
      };
      orders.unshift(newOrder);
      await writeOrders(orders);
      res.status(201).json(newOrder);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to save order" });
    }
  });

  /** Retry sending a single order to Clover (e.g. after failed sync). */
  app.post("/api/orders/:id/sync-clover", async (req, res) => {
    try {
      const { id } = req.params;
      const orders = await readOrders();
      const index = orders.findIndex((o) => o.id === id);
      if (index === -1) return res.status(404).json({ error: "Order not found" });
      const order = orders[index];
      const result = await sendOrderToClover(order);
      const updated: StoredOrder = {
        ...order,
        cloverOrderId: result.cloverOrderId ?? order.cloverOrderId,
        cloverSyncStatus: result.cloverSyncStatus,
        cloverError: result.cloverError,
      };
      orders[index] = updated;
      await writeOrders(orders);
      res.json(updated);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to sync order to Clover" });
    }
  });

  /** Send a test order to Clover to verify integration and receipt printing. Clearly marked as TEST ORDER. */
  app.post("/api/orders/test-clover", async (_req, res) => {
    try {
      const testOrder: StoredOrder = {
        id: "test-order-" + Date.now(),
        status: "pending",
        customer: { firstName: "TEST ORDER", lastName: "(Not a real order)", email: "test@example.com", phone: "555-123-4567" },
        items: [
          { categoryName: "Tacos", itemName: "Street Taco", quantity: 2, lineTotal: 10, removeIngredients: [], addExtras: [] },
          { categoryName: "Drinks", itemName: "Margarita", quantity: 1, lineTotal: 8, removeIngredients: [], addExtras: [] },
        ],
        subtotal: 18,
        tax: 0,
        total: 18,
        pickupAddress: "This is a test receipt only. Safe to ignore.",
        paymentMethod: "cash",
        createdAt: Date.now(),
      };
      const result = await sendOrderToClover(testOrder);
      res.json({
        success: result.cloverSyncStatus === "synced",
        cloverOrderId: result.cloverOrderId,
        error: result.cloverError,
      });
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, error: String(e) });
    }
  });

  // Send "order ready" EMAIL (free via Resend — 100/day free). Optional: set RESEND_API_KEY.
  async function sendOrderReadyEmail(email: string | undefined): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL || "Margaritas Tacos <onboarding@resend.dev>";
    if (!apiKey || !email?.trim() || !email.includes("@")) return;
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email.trim()],
        subject: "Your order is ready for pickup!",
        text: "Your Margaritas Tacos order is ready for pickup. Thank you!",
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error("Resend email error", res.status, errText);
    }
  }

  // Send "order ready" SMS via Twilio when order is marked ready (optional, paid). Set TWILIO_* env vars.
  async function sendOrderReadySms(phone: string | undefined): Promise<void> {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;
    if (!sid || !token || !from || !phone?.trim()) return;
    const digits = phone.replace(/\D/g, "");
    const to = digits.length === 10 ? `+1${digits}` : digits.length === 11 && digits.startsWith("1") ? `+${digits}` : `+${digits}`;
    if (to.length < 11) return;
    const body = "Your Margaritas Tacos order is ready for pickup!";
    const auth = Buffer.from(`${sid}:${token}`).toString("base64");
    const twilioRes = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
      }
    );
    if (!twilioRes.ok) {
      const errText = await twilioRes.text();
      console.error("Twilio SMS error", twilioRes.status, errText);
    }
  }

  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body as { status?: string };
      if (!id || !status || !["pending", "ready", "completed"].includes(status)) {
        return res.status(400).json({ error: "Invalid id or status" });
      }
      const orders = (await readOrders()) as { id: string; status: string; customer?: { phone?: string; email?: string } }[];
      const index = orders.findIndex((o) => o.id === id);
      if (index === -1) return res.status(404).json({ error: "Order not found" });
      const order = orders[index];
      orders[index] = { ...order, status };
      await writeOrders(orders);
      if (status === "ready" && order?.customer) {
        sendOrderReadyEmail(order.customer.email).catch((e) => console.error("Email send failed", e));
        sendOrderReadySms(order.customer.phone).catch((e) => console.error("SMS send failed", e));
      }
      res.json(orders[index]);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  // Serve static files only in production when not API-only (e.g. Netlify hosts frontend, Render hosts API)
  if (process.env.NODE_ENV === "production" && !process.env.API_ONLY) {
    const staticPath = path.resolve(__dirname, "public");
    app.use(express.static(staticPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(staticPath, "index.html"));
    });
  } else {
    app.get("*", (_req, res) => res.status(404).json({ error: "Not found" }));
  }

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(`Orders API: GET/POST /api/orders, PATCH /api/orders/:id/status`);
  });
}

startServer().catch(console.error);
