// ============================================================
// Kitchen Ticket — printable prep ticket (UberEats / Clover style)
// ============================================================

import type { PlacedOrder, OrderItem } from "@/contexts/OrdersContext";
import { getRequiredChoicesForCategory } from "@/data/orderOptions";
import { formatQuantityLabel } from "@/lib/utils";
import { mergeIdenticalOrderLines } from "@shared/orderLineHelpers";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatTicketTimeWithSeconds(d: Date): string {
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  const ap = h >= 12 ? "P" : "A";
  h = h % 12 || 12;
  return `${h}:${m}:${s}${ap}`;
}

function formatTicketDateTime(ts: number): string {
  const d = new Date(ts);
  const day = String(d.getDate()).padStart(2, "0");
  const mon = MONTHS[d.getMonth()];
  const yr = d.getFullYear();
  return `${day}-${mon}-${yr} ${formatTicketTimeWithSeconds(d)}`;
}

function formatTicketTime(ts: number): string {
  return formatTicketTimeWithSeconds(new Date(ts));
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function orderShortId(order: PlacedOrder): string {
  return order.id.replace(/^order-/, "").slice(0, 8).toLowerCase();
}

/** e.g. "3 Ground Beef American Tacos", "Birria Burrito", "Nachos (Ground Beef)" */
export function formatTicketItemName(line: OrderItem): string {
  const cat = line.categoryName?.trim() ?? "";
  const item = line.itemName?.trim() ?? "";
  if (!cat) return item;
  if (!item) return cat;

  const numbered = cat.match(/^(\d+)\s+(.+)$/);
  if (numbered) {
    const [, num, rest] = numbered;
    if (/tacos/i.test(rest)) {
      const suffix = rest.replace(/mexican\s+street\s+/i, "").trim();
      return `${num} ${item} ${suffix}`.replace(/\s+/g, " ").trim();
    }
    return `${num} ${item} ${rest}`.replace(/\s+/g, " ").trim();
  }

  if (/^nachos$/i.test(cat)) return `Nachos (${item})`;
  if (/^torta$/i.test(cat)) return `Torta (${item})`;
  if (/^enchiladas$/i.test(cat)) return `${item} Enchiladas`;
  if (/burrito/i.test(cat)) return `${item} ${cat}`;

  return `${item} ${cat}`.replace(/\s+/g, " ").trim();
}

function formatShellChoice(shell: string): string {
  return shell.trim();
}

/** Indented modifier lines — no prices, kitchen-style wording. */
export function formatTicketModifiers(line: OrderItem): string[] {
  const mods: string[] = [];

  if (line.choices && Object.keys(line.choices).length > 0) {
    const required = line.categoryId
      ? getRequiredChoicesForCategory(line.categoryId)
      : [];
    if (required.length > 0) {
      for (const rc of required) {
        const v = line.choices[rc.id];
        if (!v) continue;
        if (rc.id === "shell") {
          mods.push(formatShellChoice(v));
        } else if (rc.id === "sauce") {
          mods.push(/red/i.test(v) ? "Red Sauce" : /green/i.test(v) ? "Green Sauce" : v);
        } else if (rc.id === "tortilla") {
          mods.push(v);
        } else {
          mods.push(v);
        }
      }
    } else {
      for (const v of Object.values(line.choices)) {
        if (v) mods.push(v);
      }
    }
  }

  for (const extra of line.addExtras) {
    const qty = extra.quantity ?? 1;
    mods.push(qty === 1 ? `Side of ${extra.name}` : `Side of ${extra.name} ×${qty}`);
  }

  for (const ing of line.removeIngredients) {
    mods.push(`Remove ${ing}`);
  }

  return mods;
}

function formatCustomerLine(order: PlacedOrder): string {
  const first = order.customer.firstName.trim();
  const last = order.customer.lastName.trim();
  const initial = last ? `${last.charAt(0).toUpperCase()}.` : "";
  const phone = order.customer.phone?.trim() ?? "";
  const namePart = `${first} ${initial}`.trim();
  return `${namePart}(${phone}) - MARGARITAS ONLINE - PICKUP -`;
}

function itemBlockHtml(line: OrderItem): string {
  const qtyLabel = formatQuantityLabel(line.categoryId, line.quantity, line.categoryName);
  const name = formatTicketItemName(line);
  const mods = formatTicketModifiers(line);

  const modHtml = mods
    .map((m) => `<div class="kt-mod">${escapeHtml(m)}</div>`)
    .join("\n");

  return `<div class="kt-item">
  <div class="kt-item-row">
    <span class="kt-qty">${escapeHtml(qtyLabel)}</span>
    <span class="kt-name">${escapeHtml(name)}</span>
  </div>
${modHtml}
</div>
<div class="kt-dash">----------</div>`;
}

const ticketStyles = `
*{margin:0;padding:0;box-sizing:border-box}
@page{margin:0;size:72mm auto}
html,body{margin:0;padding:0;background:#fff}
body{font-family:Consolas,'Courier New',monospace;padding:4px 6px;width:72mm;max-width:72mm;font-size:12px;line-height:1.3;color:#000}
.kt-order-head{font-size:13px;font-weight:700;margin-bottom:2px;line-height:1.25}
.kt-line{font-size:12px;margin-bottom:2px;line-height:1.25}
.kt-dash{color:#000;margin:6px 0;font-size:11px;overflow:hidden;letter-spacing:-0.02em}
.kt-items{margin:4px 0}
.kt-item{margin-bottom:2px}
.kt-item-row{display:flex;gap:6px;align-items:flex-start;line-height:1.25}
.kt-qty{font-weight:700;min-width:1.2em;flex-shrink:0}
.kt-name{font-weight:700;flex:1;min-width:0}
.kt-mod{padding-left:1.6em;font-size:11px;line-height:1.25;margin-top:1px}
.kt-server{font-weight:700;margin:2px 0 6px}
.kt-footer{font-size:11px;margin-top:4px}
`;

/** Standalone HTML for receipt — print in a new window */
export function getTicketPrintHtml(order: PlacedOrder): string {
  const oid = orderShortId(order);
  const pickup = order.pickupAddress || "—";
  const placed = formatTicketDateTime(order.createdAt);
  const now = Date.now();
  const printed = formatTicketTime(now);
  const sent = formatTicketTime(order.createdAt);
  const customer = formatCustomerLine(order);
  const footerId = order.cloverOrderId?.trim() || order.id;

  const itemsHtml = mergeIdenticalOrderLines(order.items)
    .map((line) => itemBlockHtml(line as OrderItem))
    .join("\n");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Kitchen Ticket</title>
<style>${ticketStyles}</style>
</head><body>
<p class="kt-order-head">ORDER: ${escapeHtml(oid)} (${escapeHtml(pickup)})</p>
<p class="kt-line">Margaritas-Online</p>
<p class="kt-line">${escapeHtml(placed)}</p>
<p class="kt-line">Printed: ${escapeHtml(printed)}</p>
<p class="kt-line">Sent: ${escapeHtml(sent)}</p>
<p class="kt-line">${escapeHtml(customer)}</p>
<p class="kt-line">Ready by 20 minutes -</p>
<div class="kt-dash">----------</div>
<p class="kt-server">Server: WEB ORDER</p>
<div class="kt-items">${itemsHtml}</div>
<p class="kt-footer">Order ID: ${escapeHtml(footerId)}</p>
</body></html>`;
}

function TicketItem({ line }: { line: OrderItem }) {
  const qtyLabel = formatQuantityLabel(line.categoryId, line.quantity, line.categoryName);
  const name = formatTicketItemName(line);
  const mods = formatTicketModifiers(line);

  return (
    <>
      <div className="mb-0.5">
        <div className="flex gap-1.5 items-start leading-tight">
          <span className="font-bold shrink-0 min-w-[1.2em]">{qtyLabel}</span>
          <span className="font-bold flex-1 min-w-0">{name}</span>
        </div>
        {mods.map((mod, i) => (
          <p key={i} className="pl-6 text-[11px] leading-tight mt-0.5">
            {mod}
          </p>
        ))}
      </div>
      <p className="text-[11px] tracking-tight my-1.5 overflow-hidden leading-none">
        ----------
      </p>
    </>
  );
}

export default function KitchenTicket({ order }: { order: PlacedOrder }) {
  const oid = orderShortId(order);
  const placed = formatTicketDateTime(order.createdAt);
  const customer = formatCustomerLine(order);
  const footerId = order.cloverOrderId?.trim() || order.id;

  return (
    <>
      <div className="kitchen-ticket bg-white text-black p-3 max-w-md mx-auto text-xs leading-snug font-mono">
        <p className="font-bold text-[13px] leading-tight mb-0.5">
          ORDER: {oid} ({order.pickupAddress})
        </p>
        <p>Margaritas-Online</p>
        <p>{placed}</p>
        <p>Printed: {formatTicketTime(Date.now())}</p>
        <p>Sent: {formatTicketTime(order.createdAt)}</p>
        <p>{customer}</p>
        <p>Ready by 20 minutes -</p>
        <p className="tracking-tight my-1.5 overflow-hidden leading-none">
          ----------
        </p>
        <p className="font-bold mb-1.5">Server: WEB ORDER</p>
        <div>
          {mergeIdenticalOrderLines(order.items).map((line, idx) => (
            <TicketItem key={idx} line={line as OrderItem} />
          ))}
        </div>
        <p className="text-[11px] mt-1">Order ID: {footerId}</p>
      </div>
      <style>{`
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: hidden !important;
          }
          @page {
            size: 72mm auto;
            margin: 0;
          }
          body * { visibility: hidden !important; }
          .kitchen-ticket, .kitchen-ticket * { visibility: visible !important; }
          .kitchen-ticket {
            position: fixed !important;
            left: 0 !important;
            top: 0 !important;
            width: 72mm !important;
            max-width: 72mm !important;
            margin: 0 !important;
            padding: 4px 6px !important;
            box-shadow: none !important;
            background: white !important;
            page-break-inside: avoid !important;
            font-family: Consolas, "Courier New", monospace !important;
          }
          .print-ticket-actions { display: none !important; }
        }
      `}</style>
    </>
  );
}
