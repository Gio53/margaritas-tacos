// ============================================================
// Admin — Order Management dashboard (DoorDash-style)
// Password gate: 2022 (sessionStorage; change ADMIN_PASSWORD to update)
// ============================================================

import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { useOrders } from "@/contexts/OrdersContext";
import type { OrderStatus, PlacedOrder } from "@/contexts/OrdersContext";
import { formatAddExtra } from "@/data/orderOptions";
import { ClipboardList, Printer } from "lucide-react";
import KitchenTicket, { getTicketPrintHtml } from "@/components/KitchenTicket";

const ADMIN_SESSION_KEY = "margaritas_admin";
const ADMIN_PASSWORD = "2022";

const ESPRESSO = "#2C1810";
const GOLD = "#E8A838";
const BEIGE_BG = "#FFF8F0";
const PENDING_COLOR = "#DC2626";
const READY_COLOR = "#16A34A";
const COMPLETED_COLOR = "#2563EB";
const TOTAL_COLOR = "#EA580C";

function formatTime(ts: number) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString();
}

function StatusCard({
  label,
  count,
  borderColor,
  countColor,
}: {
  label: string;
  count: number;
  borderColor: string;
  countColor: string;
}) {
  return (
    <div
      className="rounded-xl border-2 p-4 bg-white"
      style={{ borderColor }}
    >
      <p className="text-xs font-medium mb-1" style={{ color: "#6B7280" }}>
        {label}
      </p>
      <p className="text-3xl font-bold" style={{ color: countColor }}>
        {count}
      </p>
    </div>
  );
}

function OrderCard({
  order,
  onStatusChange,
  onPrintTicket,
}: {
  order: PlacedOrder;
  onStatusChange: (id: string, status: OrderStatus) => void;
  onPrintTicket: (order: PlacedOrder) => void;
}) {
  const handlePrint = () => {
    const html = getTicketPrintHtml(order);
    const w = window.open("", "_blank", "width=300,height=500");
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => {
        w.focus();
        w.print();
        w.afterprint = () => w.close();
      }, 200);
    }
    onPrintTicket(order);
  };
  return (
    <div
      className="rounded-xl border p-4 bg-white"
      style={{ borderColor: "rgba(44,24,16,0.15)" }}
    >
      <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
        <div>
          <p className="font-bold" style={{ color: ESPRESSO }}>
            {order.customer.firstName} {order.customer.lastName}
          </p>
          <p className="text-sm" style={{ color: "#6B7280" }}>
            {[order.customer.phone, order.customer.email].filter(Boolean).join(" · ") || "—"}
          </p>
          <p className="text-xs mt-1" style={{ color: "#6B7280" }}>
            {formatDate(order.createdAt)} at {formatTime(order.createdAt)} · {order.paymentMethod === "card" ? "Card" : "Cash on pickup"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-1 rounded text-xs font-semibold capitalize"
            style={{
              backgroundColor:
                order.status === "pending"
                  ? "rgba(220,38,38,0.15)"
                  : order.status === "ready"
                    ? "rgba(22,163,74,0.15)"
                    : "rgba(37,99,235,0.15)",
              color:
                order.status === "pending"
                  ? PENDING_COLOR
                  : order.status === "ready"
                    ? READY_COLOR
                    : COMPLETED_COLOR,
            }}
          >
            {order.status}
          </span>
          <span className="font-bold" style={{ color: TOTAL_COLOR }}>
            ${order.total.toFixed(2)}
          </span>
        </div>
      </div>

      <div className="border-t pt-3 mt-3 space-y-2" style={{ borderColor: "rgba(44,24,16,0.1)" }}>
        {order.items.map((line, idx) => (
          <div key={idx} className="text-sm">
            <p className="font-semibold" style={{ color: ESPRESSO }}>
              {line.categoryName} — {line.itemName} × {line.quantity}
            </p>
            {(line.removeIngredients.length > 0 || line.addExtras.length > 0) && (
              <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                {line.removeIngredients.length > 0 && (
                  <>No: {line.removeIngredients.join(", ")}</>
                )}
                {line.removeIngredients.length > 0 && line.addExtras.length > 0 && " · "}
                {line.addExtras.length > 0 && (
                  <>Add: {line.addExtras.map(formatAddExtra).join(", ")}</>
                )}
              </p>
            )}
            <p className="text-xs font-semibold mt-0.5" style={{ color: GOLD }}>
              ${line.lineTotal.toFixed(2)}
            </p>
          </div>
        ))}
      </div>

      <p className="text-xs mt-2" style={{ color: "#6B7280" }}>
        Pickup: {order.pickupAddress}
      </p>

      <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t" style={{ borderColor: "rgba(44,24,16,0.1)" }}>
        <button
          type="button"
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold border"
          style={{ borderColor: ESPRESSO, color: ESPRESSO }}
        >
          <Printer className="size-4" />
          Print ticket
        </button>
        {order.status === "pending" && (
          <button
            type="button"
            onClick={() => onStatusChange(order.id, "ready")}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: READY_COLOR }}
          >
            Mark ready
          </button>
        )}
        {order.status === "ready" && (
          <button
            type="button"
            onClick={() => onStatusChange(order.id, "completed")}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: COMPLETED_COLOR }}
          >
            Mark completed
          </button>
        )}
      </div>
    </div>
  );
}

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [orderToPrint, setOrderToPrint] = useState<PlacedOrder | null>(null);

  useEffect(() => {
    setAuthenticated(sessionStorage.getItem(ADMIN_SESSION_KEY) === "true");
  }, []);

  const {
    orders,
    setOrderStatus,
    pendingCount,
    readyCount,
    completedCount,
    totalCount,
    isLoading,
    useApi,
  } = useOrders();

  // Only show orders from today (from 12:00 AM local time); dateTick updates at midnight
  const [dateTick, setDateTick] = useState(() => new Date().toDateString());
  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date().toDateString();
      setDateTick((prev) => (now !== prev ? now : prev));
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  const startOfToday = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [dateTick]);

  const todayOrders = useMemo(
    () => orders.filter((o) => o.createdAt >= startOfToday),
    [orders, startOfToday]
  );

  /** All completed orders, newest first (for "All completed" view) */
  const allCompletedOrders = useMemo(
    () => [...orders].filter((o) => o.status === "completed").sort((a, b) => b.createdAt - a.createdAt),
    [orders]
  );

  const [viewMode, setViewMode] = useState<"today" | "all-completed">("today");
  const ordersToShow = viewMode === "today" ? todayOrders : allCompletedOrders;

  const todayPendingCount = todayOrders.filter((o) => o.status === "pending").length;
  const todayReadyCount = todayOrders.filter((o) => o.status === "ready").length;
  const todayCompletedCount = todayOrders.filter((o) => o.status === "completed").length;
  const todayTotalCount = todayOrders.length;
  const allCompletedCount = allCompletedOrders.length;

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
      setAuthenticated(true);
      setPasswordError("");
      setPasswordInput("");
    } else {
      setPasswordError("Wrong password");
    }
  };

  const logout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setAuthenticated(false);
  };

  if (!authenticated) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ backgroundColor: BEIGE_BG, fontFamily: "'Lato', sans-serif" }}
      >
        <div className="w-full max-w-sm rounded-xl border-2 p-6 bg-white" style={{ borderColor: ESPRESSO }}>
          <h1 className="text-xl font-bold mb-4 text-center" style={{ color: ESPRESSO }}>
            Order Management
          </h1>
          <p className="text-sm mb-4 text-center" style={{ color: "#6B7280" }}>
            Enter the admin password to continue.
          </p>
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(""); }}
              placeholder="Password"
              className="w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "rgba(44,24,16,0.3)" }}
              autoFocus
            />
            {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
            <button
              type="submit"
              className="w-full py-2 rounded-lg font-semibold text-white"
              style={{ backgroundColor: ESPRESSO }}
            >
              Enter
            </button>
          </form>
          <Link href="/" className="block mt-4 text-center text-sm" style={{ color: GOLD }}>Back to home</Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: BEIGE_BG, fontFamily: "'Lato', sans-serif" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-20 flex items-center justify-between px-4 py-3"
        style={{
          backgroundColor: ESPRESSO,
          borderBottom: "1px solid rgba(232,168,56,0.2)",
        }}
      >
        <div className="flex items-center gap-2">
          <ClipboardList className="size-6 text-white" />
          <h1
            className="text-lg font-bold text-white uppercase tracking-wider"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            Order Management
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {useApi && (
            <span className="text-xs text-white/80 px-2 py-1 rounded bg-white/10">
              Synced
            </span>
          )}
          <button
            type="button"
            onClick={logout}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white/90 hover:text-white border border-white/30"
          >
            Log out
          </button>
          <Link
            href="/"
            className="px-4 py-2 rounded-lg font-semibold text-white uppercase text-sm border transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "rgba(139, 90, 43, 0.8)",
              borderColor: "rgba(44,24,16,0.5)",
            }}
          >
            Back to home
          </Link>
        </div>
      </header>

      <div className="flex-1 p-4 md:p-6 max-w-2xl mx-auto w-full">
        {/* Status cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <StatusCard
            label="Pending"
            count={todayPendingCount}
            borderColor={PENDING_COLOR}
            countColor={PENDING_COLOR}
          />
          <StatusCard
            label="Ready"
            count={todayReadyCount}
            borderColor={READY_COLOR}
            countColor={READY_COLOR}
          />
          <StatusCard
            label="Completed"
            count={todayCompletedCount}
            borderColor={COMPLETED_COLOR}
            countColor={COMPLETED_COLOR}
          />
          <StatusCard
            label="Total"
            count={todayTotalCount}
            borderColor={TOTAL_COLOR}
            countColor={TOTAL_COLOR}
          />
        </div>

        {/* Order list — Today or All completed */}
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <h2 className="text-lg font-bold" style={{ color: ESPRESSO }}>
            {viewMode === "today" ? "Orders — Today" : "All completed orders"}
          </h2>
          <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: "rgba(44,24,16,0.2)" }}>
            <button
              type="button"
              onClick={() => setViewMode("today")}
              className="px-3 py-1.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor: viewMode === "today" ? ESPRESSO : "transparent",
                color: viewMode === "today" ? "white" : ESPRESSO,
              }}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setViewMode("all-completed")}
              className="px-3 py-1.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor: viewMode === "all-completed" ? ESPRESSO : "transparent",
                color: viewMode === "all-completed" ? "white" : ESPRESSO,
              }}
            >
              All completed ({allCompletedCount})
            </button>
          </div>
        </div>
        {isLoading ? (
          <p className="text-center py-8" style={{ color: "#6B7280" }}>
            Loading orders…
          </p>
        ) : ordersToShow.length === 0 ? (
          <p className="text-center py-8" style={{ color: "#6B7280" }}>
            {viewMode === "today"
              ? "No orders today yet. Orders from checkout will appear here."
              : "No completed orders yet."}
          </p>
        ) : (
          <div className="space-y-4">
            {ordersToShow.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onStatusChange={setOrderStatus}
                onPrintTicket={setOrderToPrint}
              />
            ))}
          </div>
        )}
      </div>

      {/* Print ticket modal — only the ticket content is visible when printing */}
      {orderToPrint && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-auto bg-black/50 p-4 print:bg-transparent print:p-0"
          aria-modal
          role="dialog"
        >
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full my-4 print:shadow-none print:max-w-none">
            <KitchenTicket order={orderToPrint} />
            <div className="print-ticket-actions flex flex-wrap gap-2 p-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  const html = getTicketPrintHtml(orderToPrint);
                  const w = window.open("", "_blank", "width=300,height=500");
                  if (w) {
                    w.document.write(html);
                    w.document.close();
                    setTimeout(() => {
                      w.focus();
                      w.print();
                      w.afterprint = () => w.close();
                    }, 200);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-white"
                style={{ backgroundColor: ESPRESSO }}
              >
                <Printer className="size-4" />
                Print
              </button>
              <button
                type="button"
                onClick={() => setOrderToPrint(null)}
                className="px-4 py-2 rounded-lg font-semibold border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
