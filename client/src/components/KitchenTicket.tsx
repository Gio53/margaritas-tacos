// ============================================================
// Kitchen Ticket — printable receipt for cooks
// ============================================================

import type { PlacedOrder } from "@/contexts/OrdersContext";
import { formatAddExtra } from "@/data/orderOptions";

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString();
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
                {line.quantity}× {line.categoryName} — {line.itemName}
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
          body * { visibility: hidden; }
          .kitchen-ticket, .kitchen-ticket * { visibility: visible; }
          .kitchen-ticket {
            position: fixed;
            left: 0;
            top: 0;
            width: 100%;
            max-width: 100%;
            margin: 0;
            padding: 1rem;
            box-shadow: none;
          }
          .print-ticket-actions { display: none !important; }
        }
      `}</style>
    </>
  );
}
