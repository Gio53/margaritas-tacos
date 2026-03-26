// ============================================================
// Kitchen Ticket — printable ticket (UberEats / Clover–style blocks)
// ============================================================

import type { PlacedOrder, OrderItem } from "@/contexts/OrdersContext";
import { formatAddExtra, formatChoicesLine } from "@/data/orderOptions";
import { formatQuantityLabel } from "@/lib/utils";

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTicketDateTime(ts: number): string {
  const d = new Date(ts);
  const dateStr = d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  return `${dateStr} ${formatTime(ts)}`;
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
  return order.id.replace(/^order-/, "").slice(0, 8).toUpperCase();
}

function itemBlockHtml(line: OrderItem, index: number): string {
  const num = String(index + 1);
  const title = [line.categoryName, line.itemName].filter(Boolean).join(" — ");
  const qtyLine = formatQuantityLabel(line.categoryId ?? line.categoryName, line.quantity);
  const choice = formatChoicesLine(line.categoryId, line.choices);
  const noLine =
    line.removeIngredients.length > 0
      ? `NO: ${escapeHtml(line.removeIngredients.join(", "))}`
      : "";
  const addLine =
    line.addExtras.length > 0
      ? `Add: ${escapeHtml(line.addExtras.map(formatAddExtra).join(", "))}`
      : "";

  return `<div class="kt-item">
  <div class="kt-item-num">${escapeHtml(num)}</div>
  <div class="kt-item-body">
    <p class="kt-item-title">${escapeHtml(title)}</p>
    <p class="kt-item-qty">${escapeHtml(qtyLine)}</p>
    ${choice ? `<p class="kt-item-mod">${escapeHtml(choice)}</p>` : ""}
    ${noLine ? `<p class="kt-item-mod">${noLine}</p>` : ""}
    ${addLine ? `<p class="kt-item-mod">${addLine}</p>` : ""}
  </div>
</div>
<div class="kt-dash">--------------------------------</div>`;
}

const ticketStyles = `
*{margin:0;padding:0;box-sizing:border-box}
@page{margin:0;size:72mm auto}
html,body{margin:0;padding:0;background:#fff}
body{font-family:'Segoe UI',Helvetica,Arial,sans-serif;padding:6px 8px;width:72mm;max-width:72mm;font-size:13px;line-height:1.35;color:#000}
.kt-order-head{font-size:14px;font-weight:800;margin-bottom:4px;line-height:1.25}
.kt-source,.kt-times,.kt-customer,.kt-server{font-size:12px;margin-bottom:3px}
.kt-customer{margin-top:6px}
.kt-server{font-weight:700;margin-top:4px}
.kt-dash{color:#000;letter-spacing:-0.05em;margin:8px 0;font-size:11px;overflow:hidden}
.kt-items{margin:6px 0}
.kt-item{display:flex;gap:8px;align-items:flex-start;margin-bottom:4px}
.kt-item-num{font-weight:800;font-size:14px;min-width:1em;flex-shrink:0;line-height:1.25}
.kt-item-body{flex:1;min-width:0}
.kt-item-title{font-weight:700;font-size:13px;margin-bottom:2px}
.kt-item-qty{font-size:12px;margin-bottom:2px}
.kt-item-mod{font-size:11px;color:#111;margin-bottom:2px;padding-left:0}
.kt-total{border-top:2px solid #000;margin-top:10px;padding-top:8px;font-size:15px;font-weight:800;display:flex;justify-content:space-between}
`;

/** Standalone HTML for receipt — print in a new window */
export function getTicketPrintHtml(order: PlacedOrder): string {
  const oid = orderShortId(order);
  const pickup = order.pickupAddress || "—";
  const placed = formatTicketDateTime(order.createdAt);
  const customer = `${order.customer.firstName} ${order.customer.lastName}`.trim();
  const phone = order.customer.phone?.trim() || "—";

  const itemsHtml = order.items.map((line, i) => itemBlockHtml(line, i)).join("\n");

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Kitchen Ticket</title>
<style>${ticketStyles}</style>
</head><body>
<p class="kt-order-head">ORDER: ${escapeHtml(oid)} (${escapeHtml(pickup)})</p>
<p class="kt-source">Source: Margaritas online</p>
<p class="kt-times">Placed: ${escapeHtml(placed)}</p>
<div class="kt-dash">--------------------------------</div>
<p class="kt-customer">Customer: ${escapeHtml(customer)}${phone !== "—" ? ` (${escapeHtml(phone)})` : ""}</p>
<p class="kt-server">Server: WEB ORDER</p>
<div class="kt-dash">--------------------------------</div>
<div class="kt-items">${itemsHtml}</div>
<div class="kt-total"><span>TOTAL</span><span>$${order.total.toFixed(2)}</span></div>
</body></html>`;
}

function TicketItem({ line, index }: { line: OrderItem; index: number }) {
  const title = [line.categoryName, line.itemName].filter(Boolean).join(" — ");
  const qtyLine = formatQuantityLabel(line.categoryId ?? line.categoryName, line.quantity);
  const choice = formatChoicesLine(line.categoryId, line.choices);

  return (
    <>
      <div className="flex gap-2 items-start mb-1">
        <span className="font-extrabold text-base shrink-0 w-5 text-right">{index + 1}</span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-sm leading-tight">{title}</p>
          <p className="text-xs text-black mt-0.5">{qtyLine}</p>
          {choice && <p className="text-xs text-gray-800 mt-0.5">{choice}</p>}
          {line.removeIngredients.length > 0 && (
            <p className="text-xs text-gray-800 mt-0.5">
              NO: {line.removeIngredients.join(", ")}
            </p>
          )}
          {line.addExtras.length > 0 && (
            <p className="text-xs text-gray-800 mt-0.5">
              Add: {line.addExtras.map(formatAddExtra).join(", ")}
            </p>
          )}
        </div>
      </div>
      <p className="text-gray-500 text-[10px] tracking-tighter my-2 overflow-hidden leading-none">
        --------------------------------
      </p>
    </>
  );
}

export default function KitchenTicket({ order }: { order: PlacedOrder }) {
  const oid = orderShortId(order);
  const placed = formatTicketDateTime(order.createdAt);
  const customer = `${order.customer.firstName} ${order.customer.lastName}`.trim();
  const phone = order.customer.phone?.trim();

  return (
    <>
      <div className="kitchen-ticket bg-white text-black p-4 max-w-md mx-auto font-sans text-sm">
        <p className="font-extrabold text-base leading-tight mb-1">
          ORDER: {oid} ({order.pickupAddress})
        </p>
        <p>Source: Margaritas online</p>
        <p className="mt-0.5">Placed: {placed}</p>
        <p className="text-gray-500 text-[10px] tracking-tighter my-2 overflow-hidden leading-none">
          --------------------------------
        </p>
        <p>
          Customer: {customer}
          {phone ? ` (${phone})` : ""}
        </p>
        <p className="font-bold mt-1">Server: WEB ORDER</p>
        <p className="text-gray-500 text-[10px] tracking-tighter my-2 overflow-hidden leading-none">
          --------------------------------
        </p>
        <div className="space-y-0">
          {order.items.map((line, idx) => (
            <TicketItem key={idx} line={line} index={idx} />
          ))}
        </div>
        <div className="border-t-2 border-black mt-3 pt-2 flex justify-between text-base font-extrabold">
          <span>TOTAL</span>
          <span>${order.total.toFixed(2)}</span>
        </div>
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
            size: auto;
            margin: 12mm;
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
            padding: 0.5rem !important;
            box-shadow: none !important;
            background: white !important;
            page-break-inside: avoid !important;
          }
          .print-ticket-actions { display: none !important; }
        }
      `}</style>
    </>
  );
}
