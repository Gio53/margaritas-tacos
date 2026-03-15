// ============================================================
// Kitchen Ticket — printable receipt for cooks
// ============================================================

import type { PlacedOrder } from "@/contexts/OrdersContext";
import { formatAddExtra } from "@/data/orderOptions";
import { formatQuantityLabel } from "@/lib/utils";

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString();
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Standalone HTML for receipt — print in a new window so only one page feeds (no extra paper) */
export function getTicketPrintHtml(order: PlacedOrder): string {
  const orderId = order.id.replace(/^order-/, "").slice(0, 12).toUpperCase();
  const dateStr = formatDate(order.createdAt);
  const timeStr = formatTime(order.createdAt);
  const customerPhone = order.customer.phone || "—";
  const itemsHtml = order.items
    .map(
      (line) =>
        `<div style="margin-bottom: 0.75rem; font-size: 14px;">
          <p style="font-weight: bold; margin: 0 0 2px 0;">${escapeHtml(formatQuantityLabel(line.categoryName, line.quantity))} × ${escapeHtml(line.categoryName)} — ${escapeHtml(line.itemName)}</p>
          ${line.removeIngredients.length > 0 ? `<p style="font-size: 12px; color: #374151; margin: 0 0 2px 0;">NO: ${escapeHtml(line.removeIngredients.join(", "))}</p>` : ""}
          ${line.addExtras.length > 0 ? `<p style="font-size: 12px; color: #374151; margin: 0;">Add: ${escapeHtml(line.addExtras.map(formatAddExtra).join(", "))}</p>` : ""}
        </div>`
    )
    .join("");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Kitchen Ticket</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
@page{margin:0;size:72mm auto}
html,body{margin:0;padding:0;background:#fff}
body{font-family:sans-serif;padding:4px 8px 8px;width:72mm;max-width:72mm}
h1{font-size:18px;border-bottom:2px solid #000;padding-bottom:6px;margin-bottom:10px}
.meta{font-size:14px;margin-bottom:12px}
.customer{border-top:1px solid #000;padding-top:8px;margin-bottom:12px;font-size:14px}
.customer p{margin-bottom:2px}
.total{border-top:2px solid #000;margin-top:12px;padding-top:8px;font-size:16px;font-weight:bold;display:flex;justify-content:space-between}
.pickup{font-size:12px;color:#374151;margin-top:8px}
</style>
</head><body>
<h1>MARGARITAS TACOS — KITCHEN TICKET</h1>
<div class="meta"><p><strong>Order #${escapeHtml(orderId)}</strong></p><p>${escapeHtml(dateStr)} · ${timeStr}</p></div>
<div class="customer"><p><strong>${escapeHtml(order.customer.firstName)} ${escapeHtml(order.customer.lastName)}</strong></p><p>${escapeHtml(customerPhone)}</p></div>
<div class="items">${itemsHtml}</div>
<div class="total"><span>TOTAL</span><span>$${order.total.toFixed(2)}</span></div>
<p class="pickup">Pickup: ${escapeHtml(order.pickupAddress)}</p>
</body></html>`;
}

export default function KitchenTicket({ order }: { order: PlacedOrder }) {
  return (
    <>
      <div className="kitchen-ticket bg-white text-black p-6 max-w-md mx-auto font-sans">
        <h1 className="text-2xl font-bold border-b-2 border-black pb-2 mb-3">
          MARGARITAS TACOS — KITCHEN TICKET
        </h1>
        <div className="space-y-1 text-lg mb-4">
          <p className="font-bold">Order #{order.id.replace(/^order-/, "").slice(0, 12).toUpperCase()}</p>
          <p>{formatDate(order.createdAt)} · {formatTime(order.createdAt)}</p>
        </div>
        <div className="border-t border-black pt-3 mb-4">
          <p className="font-bold text-lg">{order.customer.firstName} {order.customer.lastName}</p>
          <p className="text-base">{order.customer.phone}</p>
        </div>
        <div className="border-t border-black pt-3 space-y-3">
          {order.items.map((line, idx) => (
            <div key={idx} className="text-base">
              <p className="font-bold">
                {formatQuantityLabel(line.categoryName, line.quantity)} × {line.categoryName} — {line.itemName}
              </p>
              {line.removeIngredients.length > 0 && (
                <p className="text-sm text-gray-700">NO: {line.removeIngredients.join(", ")}</p>
              )}
              {line.addExtras.length > 0 && (
                <p className="text-sm text-gray-700">Add: {line.addExtras.map(formatAddExtra).join(", ")}</p>
              )}
            </div>
          ))}
        </div>
        <div className="border-t-2 border-black mt-4 pt-3 flex justify-between text-lg font-bold">
          <span>TOTAL</span>
          <span>${order.total.toFixed(2)}</span>
        </div>
        <p className="text-sm mt-4 text-gray-700">Pickup: {order.pickupAddress}</p>
      </div>
      <style>{`
        @media print {
          /* Prevent extra pages: only one page of content */
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
          /* Hide everything except the ticket */
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
