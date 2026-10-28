import dotenv from "dotenv";
import express from "express";
import { createServer } from "http";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import {
  buildCloverLineNameAndNote,
  type CloverReceiptLineInput,
} from "../shared/cloverReceiptLayout";
import { mergeIdenticalOrderLines } from "../shared/orderLineHelpers";
import {
  defaultRestaurantHoursConfig,
  parseRestaurantHoursBody,
  type DayHours,
  type RestaurantHoursConfig,
} from "../shared/restaurantHours";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root so CLOVER_ACCESS_TOKEN, CLOVER_ECOM_API_KEY, PORT are set
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

/** Persist orders across deploys on Render etc.: set MARGARITAS_DATA_DIR to a mounted disk path (see render.yaml). */
const DATA_DIR = process.env.MARGARITAS_DATA_DIR?.trim()
  ? path.resolve(process.env.MARGARITAS_DATA_DIR.trim())
  : path.resolve(__dirname, "..", "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const AVAILABILITY_FILE = path.join(DATA_DIR, "item-availability.json");
const RESTAURANT_HOURS_FILE = path.join(DATA_DIR, "restaurant-hours.json");
const ADMIN_SETTINGS_FILE = path.join(DATA_DIR, "admin-settings.json");

const DEFAULT_AUTO_READY_MINUTES = 25;
const MIN_AUTO_READY_MINUTES = 1;
const MAX_AUTO_READY_MINUTES = 180;

interface AdminSettings {
  /** Minutes after order placed before auto Mark Ready + customer notify */
  autoReadyMinutes: number;
}

function defaultAdminSettings(): AdminSettings {
  return { autoReadyMinutes: DEFAULT_AUTO_READY_MINUTES };
}

function clampAutoReadyMinutes(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  const minutes = Math.floor(n);
  if (minutes < MIN_AUTO_READY_MINUTES || minutes > MAX_AUTO_READY_MINUTES) return null;
  return minutes;
}

function parseAdminSettingsBody(body: unknown): AdminSettings | null {
  if (!body || typeof body !== "object") return null;
  const minutes = clampAutoReadyMinutes((body as { autoReadyMinutes?: unknown }).autoReadyMinutes);
  if (minutes == null) return null;
  return { autoReadyMinutes: minutes };
}

async function readAdminSettings(): Promise<AdminSettings> {
  try {
    const raw = await fs.readFile(ADMIN_SETTINGS_FILE, "utf-8");
    const data = JSON.parse(raw) as unknown;
    const parsed = parseAdminSettingsBody(data);
    if (parsed) return parsed;
  } catch {
    // fall through
  }
  return defaultAdminSettings();
}

async function writeAdminSettings(settings: AdminSettings): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(ADMIN_SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
}

function mergeHoursWithDefaults(partial: RestaurantHoursConfig): RestaurantHoursConfig {
  const base = defaultRestaurantHoursConfig();
  const weekly: Record<string, DayHours | null> = { ...base.weekly };
  for (let d = 0; d <= 6; d++) {
    const k = String(d);
    if (Object.prototype.hasOwnProperty.call(partial.weekly, k)) weekly[k] = partial.weekly[k];
  }
  return {
    weekly,
    closedDates: partial.closedDates ?? [],
    closedMessageCustom: partial.closedMessageCustom ?? null,
  };
}

async function readRestaurantHours(): Promise<RestaurantHoursConfig> {
  try {
    const raw = await fs.readFile(RESTAURANT_HOURS_FILE, "utf-8");
    const data = JSON.parse(raw) as unknown;
    const parsed = parseRestaurantHoursBody(data);
    if (parsed) return mergeHoursWithDefaults(parsed);
  } catch {
    // fall through
  }
  return defaultRestaurantHoursConfig();
}

async function writeRestaurantHours(config: RestaurantHoursConfig): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    RESTAURANT_HOURS_FILE,
    JSON.stringify(config, null, 2),
    "utf-8"
  );
}

interface AvailabilityEntry {
  categoryId: string;
  itemName: string;
  unavailableUntil: number;
}

async function readAvailabilityRaw(): Promise<AvailabilityEntry[]> {
  try {
    const raw = await fs.readFile(AVAILABILITY_FILE, "utf-8");
    const data = JSON.parse(raw) as { entries?: AvailabilityEntry[] };
    return Array.isArray(data.entries) ? data.entries : [];
  } catch {
    return [];
  }
}

function pruneAvailabilityEntries(entries: AvailabilityEntry[]): AvailabilityEntry[] {
  const now = Date.now();
  return entries.filter(
    (e) =>
      e &&
      typeof e.categoryId === "string" &&
      typeof e.itemName === "string" &&
      typeof e.unavailableUntil === "number" &&
      e.unavailableUntil > now
  );
}

async function readAvailability(): Promise<AvailabilityEntry[]> {
  const raw = await readAvailabilityRaw();
  const pruned = pruneAvailabilityEntries(raw);
  if (pruned.length !== raw.length) await writeAvailability(pruned);
  return pruned;
}

async function writeAvailability(entries: AvailabilityEntry[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    AVAILABILITY_FILE,
    JSON.stringify({ entries }, null, 2),
    "utf-8"
  );
}

/** Order as stored in orders.json; includes optional Clover sync fields */
interface StoredOrder {
  id: string;
  status: string;
  /** "phone" = AI Phone Assistant order (admin-panel backup only; never synced to Clover or messaged). Absent = web order. */
  source?: string;
  customer?: { firstName?: string; lastName?: string; email?: string; phone?: string };
  items?: Array<{
    categoryId?: string;
    categoryName?: string;
    itemName?: string;
    quantity?: number;
    removeIngredients?: string[];
    addExtras?: Array<{ name?: string; quantity?: number; price?: number }>;
    lineTotal?: number;
    choices?: Record<string, string>;
    basePrice?: number;
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
  /** Clover Ecommerce charge id (chrg-...) from the card payment, for reconciliation if the save crashes mid-checkout */
  cloverChargeId?: string;
}

/** A line item body for the Clover bulk_line_items endpoint. */
interface CloverLineBody {
  name: string;
  price: number;
  note?: string;
}

/** Build Clover line item bodies from merged order lines, ready for bulk_line_items. */
function buildCloverLineBodies(items: StoredOrder["items"]): CloverLineBody[] {
  const orderItems = mergeIdenticalOrderLines(items ?? []);
  const bodies: CloverLineBody[] = [];
  for (const line of orderItems) {
    const qty = Math.max(1, line.quantity ?? 1);
    const { name, lineNote } = buildCloverLineNameAndNote({
      categoryId: line.categoryId,
      categoryName: line.categoryName,
      itemName: line.itemName,
      quantity: qty,
      removeIngredients: line.removeIngredients,
      addExtras: (line.addExtras ?? []) as CloverReceiptLineInput["addExtras"],
      choices: line.choices,
    });
    /* Full line total, no unitQty — quantity is only in `name` / `note` so Clover does not repeat it in a qty column + "each". */
    bodies.push({
      name,
      price: Math.round((line.lineTotal ?? 0) * 100),
      ...(lineNote && { note: lineNote }),
    });
  }
  return bodies;
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

export interface PhoneOrderBody {
  customer?: {
    firstName?: unknown;
    lastName?: unknown;
    email?: unknown;
    phone?: unknown;
  };
  items?: unknown[];
  subtotal?: unknown;
  tax?: unknown;
  total?: unknown;
  pickupAddress?: unknown;
}

/**
 * Validate an AI Phone Assistant order body. Returns either { error } with a message
 * the assistant can act on, or { order } ready to persist (not yet merged/persisted).
 */
function parsePhoneOrderBody(body: unknown): { error: string } | { order: StoredOrder } {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return { error: "Request body must be a JSON object" };
  }
  const b = body as PhoneOrderBody;

  const c = b.customer && typeof b.customer === "object" ? b.customer : {};
  const firstName = typeof c.firstName === "string" ? c.firstName.trim() : "";
  const phone = typeof c.phone === "string" ? c.phone.trim() : "";
  if (!firstName) return { error: "customer.firstName is required (string)" };
  if (!phone) return { error: "customer.phone is required (string)" };

  if (!Array.isArray(b.items) || b.items.length < 1) {
    return { error: "items is required (non-empty array)" };
  }
  if (b.items.length > 50) return { error: "items cannot exceed 50 lines" };

  const items: StoredOrder["items"] = [];
  for (let i = 0; i < b.items.length; i++) {
    const raw = (b.items[i] ?? {}) as Record<string, unknown>;
    const categoryName = typeof raw.categoryName === "string" ? raw.categoryName.trim() : "";
    const itemName = typeof raw.itemName === "string" ? raw.itemName.trim() : "";
    const quantity = typeof raw.quantity === "number" ? Math.round(raw.quantity) : NaN;
    const lineTotal = typeof raw.lineTotal === "number" ? raw.lineTotal : NaN;
    if (!categoryName) return { error: `items[${i}].categoryName is required (string)` };
    if (!itemName) return { error: `items[${i}].itemName is required (string)` };
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      return { error: `items[${i}].quantity must be an integer from 1 to 99` };
    }
    if (!Number.isFinite(lineTotal) || lineTotal < 0) {
      return { error: `items[${i}].lineTotal must be a number >= 0 (dollars, e.g. 13.50)` };
    }
    const removeIngredients = Array.isArray(raw.removeIngredients)
      ? raw.removeIngredients
          .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
          .map((v) => v.trim())
      : [];
    const addExtras = Array.isArray(raw.addExtras)
      ? (raw.addExtras as Record<string, unknown>[])
          .filter((x) => x && typeof x.name === "string" && x.name.trim().length > 0)
          .map((x) => ({
            name: (x.name as string).trim(),
            ...(typeof x.quantity === "number" && Number.isFinite(x.quantity) && x.quantity > 1
              ? { quantity: Math.round(x.quantity) }
              : {}),
            ...(typeof x.price === "number" && Number.isFinite(x.price) && x.price >= 0
              ? { price: x.price }
              : {}),
          }))
      : [];
    const choices =
      raw.choices && typeof raw.choices === "object" && !Array.isArray(raw.choices)
        ? Object.fromEntries(
            Object.entries(raw.choices as Record<string, unknown>)
              .filter(([, v]) => typeof v === "string" && v.trim().length > 0)
              .map(([k, v]) => [k, (v as string).trim()])
          )
        : undefined;
    const notes = typeof raw.notes === "string" && raw.notes.trim() ? raw.notes.trim().slice(0, 200) : undefined;
    items.push({
      ...(typeof raw.categoryId === "string" && raw.categoryId.trim()
        ? { categoryId: raw.categoryId.trim() }
        : {}),
      categoryName,
      itemName,
      quantity,
      lineTotal,
      removeIngredients,
      addExtras,
      ...(choices && Object.keys(choices).length > 0 ? { choices } : {}),
      ...(notes ? { notes } : {}),
    });
  }

  const subtotal = typeof b.subtotal === "number" && Number.isFinite(b.subtotal) ? b.subtotal : NaN;
  const tax = typeof b.tax === "number" && Number.isFinite(b.tax) ? b.tax : NaN;
  const total = typeof b.total === "number" && Number.isFinite(b.total) ? b.total : NaN;
  if (!Number.isFinite(subtotal) || subtotal < 0) return { error: "subtotal must be a number >= 0 (dollars)" };
  if (!Number.isFinite(tax) || tax < 0) return { error: "tax must be a number >= 0 (dollars)" };
  if (!Number.isFinite(total) || total < 0) return { error: "total must be a number >= 0 (dollars)" };
  if (Math.abs(subtotal + tax - total) > 0.02) {
    return { error: `total must equal subtotal + tax (within $0.02): got subtotal ${subtotal} + tax ${tax} vs total ${total}` };
  }

  const pickupAddress =
    typeof b.pickupAddress === "string" && b.pickupAddress.trim()
      ? b.pickupAddress.trim()
      : "Phone order — pickup in store";

  return {
    order: {
      id: `order-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      source: "phone",
      status: "pending",
      customer: {
        firstName,
        lastName: typeof c.lastName === "string" ? c.lastName.trim() : "",
        email: typeof c.email === "string" ? c.email.trim() : "",
        phone,
      },
      items,
      subtotal,
      tax,
      total,
      pickupAddress,
      /* Customer has NOT paid — they pay at pickup; no payment is ever recorded for phone orders. */
      paymentMethod: "cash",
      createdAt: Date.now(),
    },
  };
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "1mb" }));

  // CORS so frontend on another port (e.g. Vite) can call API
  app.use((_req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, x-api-key");
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

  /** Tender ID for POST /orders/{id}/payments (external / custom tenders only — see Clover docs). */
  function resolveWebsitePaymentTenderId(paymentMethod: string | undefined): string {
    const fallback = (process.env.CLOVER_WEBSITE_TENDER_ID ?? "").trim();
    const cardT = (process.env.CLOVER_WEBSITE_CARD_TENDER_ID ?? "").trim();
    const cashT = (process.env.CLOVER_WEBSITE_CASH_TENDER_ID ?? "").trim();
    if (paymentMethod === "card") return cardT || fallback;
    return cashT || fallback;
  }

  /**
   * Create a Clover v3 order with line items and trigger print on the merchant's default printer.
   * Uses API Token from Dashboard → API Tokens (Read/Write Orders). Prices in cents.
   * Phone orders (AI assistant) are skipped entirely — the assistant sends its own ticket to Clover.
   */
  async function sendOrderToClover(order: StoredOrder): Promise<{
    cloverOrderId?: string;
    cloverSyncStatus?: "synced" | "failed";
    cloverError?: string;
  }> {
    if (order.source === "phone") {
      console.log(`Skipping Clover sync for phone order ${order.id} (AI assistant prints its own ticket)`);
      return {};
    }
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
      let cloverOrderId = order.cloverOrderId?.trim() || "";
      let resumed = false;
      let orderTotalCents: number | null = null;

      /* Retry/resume: reuse the existing Clover order instead of creating a duplicate. */
      if (cloverOrderId) {
        const existingRes = await fetch(`${CLOVER_V3_BASE}/v3/merchants/${mId}/orders/${cloverOrderId}`, {
          headers: { Authorization: `Bearer ${CLOVER_API_TOKEN}` },
        });
        if (existingRes.ok) {
          const existing = (await existingRes.json()) as { total?: number };
          resumed = true;
          if (typeof existing.total === "number" && existing.total > 0) {
            orderTotalCents = existing.total;
          }
        } else {
          const warnText = await existingRes.text().catch(() => "");
          console.warn(
            `Clover order ${cloverOrderId} not reusable (GET ${existingRes.status}), creating a new order`,
            warnText.slice(0, 150)
          );
          cloverOrderId = "";
        }
      }

      if (!cloverOrderId) {
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
        cloverOrderId = created.id ?? "";
        if (!cloverOrderId) {
          return { cloverSyncStatus: "failed", cloverError: "No order id in Clover response" };
        }
      }

      /* One bulk request for all line items instead of one POST per line (per-line POSTs hit 429 rate limits). */
      const lineBodies = buildCloverLineBodies(order.items);
      let pendingBodies = lineBodies;
      if (resumed) {
        const existingLinesRes = await fetch(`${CLOVER_V3_BASE}/v3/merchants/${mId}/orders/${cloverOrderId}/line_items`, {
          headers: { Authorization: `Bearer ${CLOVER_API_TOKEN}` },
        });
        if (existingLinesRes.ok) {
          const existingLines = (await existingLinesRes.json()) as {
            elements?: Array<{ name?: string; price?: number }>;
          };
          /* Count-based (multiset) matching so two legitimate identical lines never wrongly dedupe each other. */
          const present = new Map<string, number>();
          for (const li of existingLines.elements ?? []) {
            const key = `${li.name ?? ""}|${li.price ?? 0}`;
            present.set(key, (present.get(key) ?? 0) + 1);
          }
          pendingBodies = lineBodies.filter((body) => {
            const key = `${body.name}|${body.price}`;
            const remaining = present.get(key) ?? 0;
            if (remaining > 0) {
              present.set(key, remaining - 1);
              return false;
            }
            return true;
          });
        } else {
          console.warn(
            `Could not list existing line items for Clover order ${cloverOrderId} (${existingLinesRes.status}); re-sending all lines`
          );
        }
      }

      if (pendingBodies.length === 0) {
        console.log(`Clover order ${cloverOrderId} already has all line items; skipping upload`);
      } else {
        for (let i = 0; i < pendingBodies.length; i += 100) {
          const pendingChunk = pendingBodies.slice(i, i + 100);
          const bulkRes = await fetch(`${CLOVER_V3_BASE}/v3/merchants/${mId}/orders/${cloverOrderId}/bulk_line_items`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${CLOVER_API_TOKEN}`,
            },
            body: JSON.stringify({ items: pendingChunk }),
          });
          if (!bulkRes.ok) {
            const errText = await bulkRes.text();
            console.error("Clover bulk line items error", bulkRes.status, errText);
            return {
              cloverOrderId,
              cloverSyncStatus: "failed",
              cloverError: `Bulk line items failed: ${errText.slice(0, 150)}`,
            };
          }
        }
      }

      const tenderId = resolveWebsitePaymentTenderId(order.paymentMethod);
      if (tenderId) {
        let payAmountCents = resumed && orderTotalCents ? orderTotalCents : totalCents;
        let skipPayment = false;
        if (resumed) {
          /* Never double-charge on retry: skip payment if the order already has payments. */
          const paymentsRes = await fetch(`${CLOVER_V3_BASE}/v3/merchants/${mId}/orders/${cloverOrderId}/payments`, {
            headers: { Authorization: `Bearer ${CLOVER_API_TOKEN}` },
          });
          if (!paymentsRes.ok) {
            /* Cannot confirm payment state: fail the sync instead of risking a double charge. */
            const errText = await paymentsRes.text().catch(() => "");
            console.error("Clover payments check error", paymentsRes.status, errText);
            return {
              cloverOrderId,
              cloverSyncStatus: "failed",
              cloverError: `Could not verify existing payments (GET ${paymentsRes.status}); payment skipped to avoid double charge`,
            };
          }
          const payments = (await paymentsRes.json()) as { elements?: unknown[] };
          if ((payments.elements ?? []).length > 0) {
            console.log(`Clover order ${cloverOrderId} already has payments; skipping payment`);
            skipPayment = true;
          }
        }
        if (!skipPayment) {
          const payRes = await fetch(`${CLOVER_V3_BASE}/v3/merchants/${mId}/orders/${cloverOrderId}/payments`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${CLOVER_API_TOKEN}`,
            },
            body: JSON.stringify({
              amount: payAmountCents,
              tender: { id: tenderId },
            }),
          });
          if (!payRes.ok) {
            const payErr = await payRes.text();
            console.error("Clover order payment error", payRes.status, payErr);
            return {
              cloverOrderId,
              cloverSyncStatus: "failed",
              cloverError: `Payment on order failed: ${payErr.slice(0, 180)}`,
            };
          }
        }
      } else {
        console.warn(
          "Clover order left unpaid in dashboard: set CLOVER_WEBSITE_TENDER_ID (your custom tender UUID) so the API can record payment on the order."
        );
      }

      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const maxPrintRetries = 3;
      const retryDelays = [0, 2000, 4000];
      let printOk = false;
      let printErrText = "";
      for (let attempt = 0; attempt < maxPrintRetries; attempt++) {
        if (attempt > 0) {
          await sleep(retryDelays[attempt]);
          console.warn(`Clover print_event retry ${attempt}/${maxPrintRetries - 1}`);
        }
        const printRes = await fetch(`${CLOVER_V3_BASE}/v3/merchants/${mId}/print_event`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${CLOVER_API_TOKEN}`,
          },
          body: JSON.stringify({ orderRef: { id: cloverOrderId } }),
        });
        if (printRes.ok) {
          printOk = true;
          break;
        }
        printErrText = await printRes.text();
        console.error("Clover print_event error", printRes.status, printErrText);
        const isRetryable = printRes.status === 429 || (printRes.status >= 500 && printRes.status < 600);
        if (!isRetryable || attempt === maxPrintRetries - 1) break;
      }
      if (!printOk) {
        return {
          cloverOrderId,
          cloverSyncStatus: "synced",
          cloverError: `Order created but print failed: ${printErrText.slice(0, 120)}`,
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

      let cloverChargeId: string | undefined;
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
        const chargeData = (await chargeRes.json()) as { id?: string };
        cloverChargeId = chargeData.id;
      }

      // Save order (cash or after successful card charge) — merge identical lines first
      const newOrderMerged: StoredOrder = {
        ...newOrder,
        items: mergeIdenticalOrderLines(newOrder.items ?? []),
        ...(cloverChargeId && { cloverChargeId }),
      };
      const orders = await readOrders();
      orders.unshift(newOrderMerged);
      await writeOrders(orders);

      const cloverResult = await sendOrderToClover(newOrderMerged);
      const updatedOrder: StoredOrder = {
        ...newOrderMerged,
        cloverOrderId: cloverResult.cloverOrderId,
        cloverSyncStatus: cloverResult.cloverSyncStatus,
        cloverError: cloverResult.cloverError,
      };
      const idx = orders.findIndex((o) => o.id === newOrder.id);
      if (idx !== -1) {
        orders[idx] = updatedOrder;
        await writeOrders(orders);
      }

      sendOrderPlacedSms(customer.phone).catch((e) => console.error("Order-placed SMS failed", e));

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
      newOrder.items = mergeIdenticalOrderLines(newOrder.items ?? []);
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

      const cust = newOrder.customer as { phone?: string } | undefined;
      if (newOrder.source !== "phone") {
        sendOrderPlacedSms(cust?.phone).catch((e) => console.error("Order-placed SMS failed", e));
      }

      res.status(201).json(updatedOrder);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to save order" });
    }
  });

  /**
   * AI Phone Assistant order intake — RECORD ONLY.
   * The assistant sends its own ticket to the Clover printer; this endpoint only saves the
   * order so it appears in the admin panel (phone/unpaid badges + alarm) as a backup in case
   * the ticket never printed. No Clover call, no printing, no customer SMS/email.
   * Auth: x-api-key header must match the PHONE_ORDER_API_KEY env var.
   */
  app.post("/api/orders/phone", async (req, res) => {
    const expectedKey = (process.env.PHONE_ORDER_API_KEY ?? "").trim();
    if (!expectedKey) {
      return res
        .status(503)
        .json({ error: "Phone orders are not configured: set PHONE_ORDER_API_KEY on the server" });
    }
    const providedKey = String(req.header("x-api-key") ?? "");
    if (providedKey !== expectedKey) {
      return res.status(401).json({ error: "Invalid or missing x-api-key header" });
    }
    try {
      const parsed = parsePhoneOrderBody(req.body);
      if ("error" in parsed) return res.status(400).json({ error: parsed.error });
      const newOrder = parsed.order;
      newOrder.items = mergeIdenticalOrderLines(newOrder.items ?? []);
      const orders = await readOrders();
      orders.unshift(newOrder);
      await writeOrders(orders);
      console.log(`Phone order (AI assistant) saved: ${newOrder.id} — $${(newOrder.total ?? 0).toFixed(2)}`);
      res.status(201).json(newOrder);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to save phone order" });
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

  /** Send a test order to Clover to verify integration and receipt printing. Looks like a regular order; customer name is "Test Order". */
  app.post("/api/orders/test-clover", async (_req, res) => {
    try {
      const testOrder: StoredOrder = {
        id: "test-order-" + Date.now(),
        status: "pending",
        customer: { firstName: "Test", lastName: "Order", email: "test@example.com", phone: "516-555-0123" },
        items: [
          { categoryName: "Tacos", itemName: "Street Taco", quantity: 2, lineTotal: 10, removeIngredients: [], addExtras: [] },
          { categoryName: "Drinks", itemName: "Margarita", quantity: 1, lineTotal: 8, removeIngredients: [], addExtras: [] },
        ],
        subtotal: 18,
        tax: 0,
        total: 18,
        pickupAddress: "4549 Austin Blvd, Island Park, NY",
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

  /** SMS right after customer places an order (Twilio). */
  async function sendOrderPlacedSms(phone: string | undefined): Promise<void> {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_PHONE_NUMBER;
    if (!sid || !token || !from || !phone?.trim()) return;
    const digits = phone.replace(/\D/g, "");
    const to = digits.length === 10 ? `+1${digits}` : digits.length === 11 && digits.startsWith("1") ? `+${digits}` : `+${digits}`;
    if (to.length < 11) return;
    const body =
      "Thank you for ordering Margaritas Tacos, Your Order will take 20-25 minutes to complete";
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
      console.error("Twilio order-placed SMS error", twilioRes.status, errText);
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

  function notifyOrderReady(customer: StoredOrder["customer"] | undefined): void {
    if (!customer) return;
    sendOrderReadyEmail(customer.email).catch((e) => console.error("Email send failed", e));
    sendOrderReadySms(customer.phone).catch((e) => console.error("SMS send failed", e));
  }

  /** Auto Mark Ready: pending orders older than the Settings delay get marked ready + customer notified. */
  const AUTO_READY_POLL_MS = 30_000;

  async function autoMarkReadyOrders(): Promise<void> {
    try {
      const settings = await readAdminSettings();
      const autoReadyAfterMs = settings.autoReadyMinutes * 60 * 1000;
      const orders = await readOrders();
      const cutoff = Date.now() - autoReadyAfterMs;
      let changed = false;
      const newlyReady: StoredOrder[] = [];

      for (let i = 0; i < orders.length; i++) {
        const order = orders[i];
        if (order.status !== "pending") continue;
        /* Phone orders: staff mark them ready manually — the AI assistant owns customer comms. */
        if (order.source === "phone") continue;
        const createdAt = typeof order.createdAt === "number" ? order.createdAt : 0;
        if (!createdAt || createdAt > cutoff) continue;
        orders[i] = { ...order, status: "ready" };
        newlyReady.push(orders[i]);
        changed = true;
      }

      if (!changed) return;
      await writeOrders(orders);
      for (const order of newlyReady) {
        console.log(`Auto Mark Ready (${settings.autoReadyMinutes} min): ${order.id}`);
        notifyOrderReady(order.customer);
      }
    } catch (e) {
      console.error("Auto Mark Ready failed", e);
    }
  }

  app.patch("/api/orders/:id/status", async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body as { status?: string };
      if (!id || !status || !["pending", "ready", "completed"].includes(status)) {
        return res.status(400).json({ error: "Invalid id or status" });
      }
      const orders = await readOrders();
      const index = orders.findIndex((o) => o.id === id);
      if (index === -1) return res.status(404).json({ error: "Order not found" });
      const order = orders[index];
      const previousStatus = order.status;
      orders[index] = { ...order, status };
      await writeOrders(orders);
      // Only notify when transitioning into ready (manual or otherwise); never for phone orders
      if (status === "ready" && previousStatus !== "ready" && order.source !== "phone") {
        notifyOrderReady(order.customer);
      }
      res.json(orders[index]);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  app.get("/api/menu-availability", async (_req, res) => {
    try {
      const entries = await readAvailability();
      res.json({ entries });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to read menu availability" });
    }
  });

  app.post("/api/menu-availability", async (req, res) => {
    try {
      const body = req.body as {
        action?: string;
        categoryId?: string;
        itemName?: string;
        durationMinutes?: number;
      };
      const { action, categoryId, itemName } = body;
      if (!action || !categoryId || !itemName || typeof categoryId !== "string" || typeof itemName !== "string") {
        return res.status(400).json({ error: "action, categoryId, and itemName are required" });
      }
      const trimmedName = itemName.trim();
      if (!trimmedName) return res.status(400).json({ error: "Invalid itemName" });

      let merged = pruneAvailabilityEntries(await readAvailabilityRaw());

      if (action === "clear") {
        merged = merged.filter((e) => !(e.categoryId === categoryId && e.itemName === trimmedName));
        await writeAvailability(merged);
        return res.json({ entries: merged });
      }

      if (action !== "set") {
        return res.status(400).json({ error: "action must be set or clear" });
      }

      const dm = body.durationMinutes;
      const allowed = [240, 1440];
      if (typeof dm !== "number" || !allowed.includes(dm)) {
        return res.status(400).json({ error: "durationMinutes must be 240 (4h) or 1440 (1 day)" });
      }
      const unavailableUntil = Date.now() + dm * 60 * 1000;
      merged = merged.filter((e) => !(e.categoryId === categoryId && e.itemName === trimmedName));
      merged.push({ categoryId, itemName: trimmedName, unavailableUntil });
      await writeAvailability(merged);
      res.json({ entries: merged });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to update menu availability" });
    }
  });

  app.get("/api/restaurant-hours", async (_req, res) => {
    try {
      const config = await readRestaurantHours();
      res.json(config);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to read restaurant hours" });
    }
  });

  app.post("/api/restaurant-hours", async (req, res) => {
    try {
      const parsed = parseRestaurantHoursBody(req.body);
      if (!parsed) {
        return res.status(400).json({ error: "Invalid hours payload" });
      }
      await writeRestaurantHours(parsed);
      res.json(parsed);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to save restaurant hours" });
    }
  });

  app.get("/api/admin-settings", async (_req, res) => {
    try {
      const settings = await readAdminSettings();
      res.json(settings);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to read admin settings" });
    }
  });

  app.post("/api/admin-settings", async (req, res) => {
    try {
      const parsed = parseAdminSettingsBody(req.body);
      if (!parsed) {
        return res.status(400).json({
          error: `autoReadyMinutes must be a whole number from ${MIN_AUTO_READY_MINUTES} to ${MAX_AUTO_READY_MINUTES}`,
        });
      }
      await writeAdminSettings(parsed);
      res.json(parsed);
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: "Failed to save admin settings" });
    }
  });

  // Serve static files only in production when not API-only (e.g. Netlify hosts frontend, Render hosts API)
  if (process.env.NODE_ENV === "production" && !process.env.API_ONLY) {
    const staticPath = path.resolve(__dirname, "public");
    const spaShellRoutes = new Set([
      "/",
      "/order",
      "/checkout",
      "/admin",
      "/test-order",
      "/receipt-preview",
      "/404",
    ]);
    app.use(express.static(staticPath, { index: false, fallthrough: true }));
    app.get("*", (req, res) => {
      const pathname = (req.path || "/").replace(/\/$/, "") || "/";
      const isSpa =
        spaShellRoutes.has(pathname) ||
        pathname.startsWith("/admin/") ||
        pathname.startsWith("/order/") ||
        pathname.startsWith("/checkout/");
      if (isSpa) {
        // Prefer prerendered folder index when present (e.g. order/index.html)
        const nested =
          pathname === "/"
            ? path.join(staticPath, "index.html")
            : path.join(staticPath, pathname.replace(/^\//, ""), "index.html");
        const fallback = path.join(staticPath, "index.html");
        return res.sendFile(nested, (err) => {
          if (err) res.sendFile(fallback);
        });
      }
      const notFound = path.join(staticPath, "404.html");
      res.status(404).sendFile(notFound, (err) => {
        if (err) res.status(404).send("Not found");
      });
    });
  } else {
    app.get("*", (_req, res) => res.status(404).json({ error: "Not found" }));
  }

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    console.log(
      `GET/POST /api/orders, PATCH /api/orders/:id/status, GET/POST /api/menu-availability, GET/POST /api/restaurant-hours, GET/POST /api/admin-settings`
    );
    // Mark pending orders ready after the Settings delay so customers get the ready SMS/email
    void autoMarkReadyOrders();
    setInterval(() => {
      void autoMarkReadyOrders();
    }, AUTO_READY_POLL_MS);
    void readAdminSettings().then((s) => {
      console.log(
        `Auto Mark Ready: every ${AUTO_READY_POLL_MS / 1000}s; delay = ${s.autoReadyMinutes} min (change in Admin → Settings)`
      );
    });
  });
}

startServer().catch(console.error);
