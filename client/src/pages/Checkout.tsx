// ============================================================
// Checkout Page — Personal info, pickup confirmation, payment, order summary
// Mobile: order summary at top, collapses when user focuses any input
// ============================================================

import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useCart } from "@/contexts/CartContext";
import { useOrders } from "@/contexts/OrdersContext";
import { ChevronLeft, Check, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { isOpen, CLOSED_MESSAGE } from "@/utils/hours";
import { formatAddExtra } from "@/data/orderOptions";

const ESPRESSO = "#2C1810";
const GOLD = "#E8A838";
const CREAM = "#FFF8F0";
const BEIGE_BG = "#FFF8F0";
const TAX_RATE = 0.08875;
const PICKUP_ADDRESS = "4549 Austin Blvd, Island Park, NY";

export default function Checkout() {
  const { items, cartTotal, clearCart } = useCart();
  const { addOrder } = useOrders();
  const [, setLocation] = useLocation();
  const [placing, setPlacing] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  /** On mobile: when false, order summary is collapsed so user can type in form */
  const [summaryExpanded, setSummaryExpanded] = useState(true);

  const subtotal = cartTotal;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const handlePlaceOrder = async () => {
    if (!isOpen()) {
      toast.error(CLOSED_MESSAGE);
      return;
    }
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim()) {
      toast.error("Please fill in all personal information");
      return;
    }
    if (!cardNumber.trim() || !expiry.trim() || !cvc.trim()) {
      toast.error("Please enter card details");
      return;
    }

    setPlacing(true);
    try {
      const apiUrl = import.meta.env.VITE_CHECKOUT_API_URL;
      if (!apiUrl) {
        // Demo mode: save order for admin dashboard (API or localStorage), then clear cart
        await addOrder({
          customer: { firstName, lastName, email, phone },
          items: items.map((i) => ({
            categoryName: i.categoryName,
            itemName: i.itemName,
            quantity: i.quantity,
            removeIngredients: i.removeIngredients,
            addExtras: i.addExtras,
            lineTotal: i.lineTotal,
          })),
          subtotal,
          tax,
          total,
          pickupAddress: PICKUP_ADDRESS,
          paymentMethod: "card",
        });
        clearCart();
        toast.success("Order placed! (Demo — add Clover API for real payments)");
        setLocation("/order");
        return;
      }

      const checkoutUrl = apiUrl.replace(/\/$/, "") + "/api/checkout";
      const res = await fetch(checkoutUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paymentMethod: "card",
          customer: { firstName, lastName, email, phone },
          card: { number: cardNumber.replace(/\D/g, ""), expiry, cvc },
          items: items.map((i) => ({
            categoryName: i.categoryName,
            itemName: i.itemName,
            quantity: i.quantity,
            removeIngredients: i.removeIngredients,
            addExtras: i.addExtras,
            lineTotal: i.lineTotal,
          })),
          subtotal,
          tax,
          total,
          pickupAddress: PICKUP_ADDRESS,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { message?: string; error?: string };
        throw new Error(err.error || err.message || "Checkout failed");
      }
      // Server already saved the order (and charged card if applicable)
      clearCart();
      toast.success("Order placed! We'll have it ready for pickup.");
      setLocation("/order");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0 && !placing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ backgroundColor: BEIGE_BG }}>
        <p className="text-center text-lg mb-4" style={{ color: ESPRESSO }}>Your cart is empty</p>
        <Link href="/order" className="font-semibold" style={{ color: GOLD }}>Go to Order</Link>
      </div>
    );
  }

  const open = isOpen();
  if (!open) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ backgroundColor: BEIGE_BG, fontFamily: "'Lato', sans-serif" }}
      >
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold mb-3" style={{ color: ESPRESSO }}>
            We're closed
          </h1>
          <p className="text-base mb-6" style={{ color: ESPRESSO }}>
            Open Tue–Thu & Sun 2pm–9pm, Fri–Sat 2pm–10pm EST. Closed Mondays.
          </p>
          <Link
            href="/order"
            className="inline-block px-4 py-2 rounded-lg font-semibold text-white"
            style={{ backgroundColor: ESPRESSO }}
          >
            Back to order
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col md:flex-row"
      style={{ backgroundColor: BEIGE_BG, fontFamily: "'Lato', sans-serif" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 shrink-0"
        style={{
          backgroundColor: ESPRESSO,
          borderBottom: "1px solid rgba(232,168,56,0.2)",
        }}
      >
        <Link href="/order" className="flex items-center text-white hover:opacity-90">
          <ChevronLeft className="size-6" />
        </Link>
        <h1
          className="text-lg font-bold text-white uppercase tracking-wider"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          Checkout
        </h1>
      </header>

      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Mobile: Order summary at TOP, collapsible when user focuses form */}
        <aside
          className={`md:hidden shrink-0 flex flex-col overflow-hidden transition-all duration-300 ease-out ${!summaryExpanded ? "border-b" : ""}`}
          style={{
            backgroundColor: ESPRESSO,
            borderColor: "rgba(232,168,56,0.25)",
          }}
        >
          <button
            type="button"
            onClick={() => setSummaryExpanded((e) => !e)}
            className="w-full flex items-center justify-between px-4 py-3 text-left"
            style={{ borderBottom: summaryExpanded ? "1px solid rgba(255,248,240,0.1)" : "none" }}
          >
            <h2 className="text-lg font-bold text-white" style={{ fontFamily: "'Oswald', sans-serif" }}>
              Order Summary
            </h2>
            <span className="font-bold text-white flex items-center gap-2">
              ${total.toFixed(2)}
              {summaryExpanded ? <ChevronUp className="size-5" style={{ color: GOLD }} /> : <ChevronDown className="size-5" style={{ color: GOLD }} />}
            </span>
          </button>
          {summaryExpanded && (
            <>
              <div className="overflow-y-auto max-h-[40vh] p-4 space-y-3">
                {items.map((line) => (
                  <div key={line.id} className="text-sm">
                    <p className="font-semibold text-white">
                      {line.categoryName} {line.itemName}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,248,240,0.7)" }}>
                      Qty: {line.quantity}
                      {line.removeIngredients.length > 0 && ` • X Remove: ${line.removeIngredients.join(", ")}`}
                      {line.addExtras.length > 0 && ` • Add: ${line.addExtras.map(formatAddExtra).join(", ")}`}
                    </p>
                    <p className="font-semibold mt-1" style={{ color: GOLD }}>${line.lineTotal.toFixed(2)}</p>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t space-y-1 shrink-0" style={{ borderColor: "rgba(255,248,240,0.1)" }}>
                <div className="flex justify-between text-white text-sm">
                  <span>Subtotal</span>
                  <span style={{ color: GOLD }}>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-white text-sm">
                  <span>Tax</span>
                  <span style={{ color: GOLD }}>${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-white pt-2 mt-2 border-t" style={{ borderColor: "rgba(255,248,240,0.15)" }}>
                  <span>Total</span>
                  <span className="text-lg" style={{ color: GOLD }}>${total.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </aside>

        {/* Form — focus any input to collapse order summary on mobile */}
        <main
          className="flex-1 overflow-y-auto p-4 md:p-6 max-w-2xl"
          onFocusCapture={(e) => {
            const el = e.target as HTMLElement;
            if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") setSummaryExpanded(false);
          }}
        >
          <section className="mb-6">
            <h2 className="text-lg font-bold mb-4" style={{ color: ESPRESSO }}>
              Personal Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: ESPRESSO }}>First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 bg-white"
                  style={{ borderColor: "rgba(44,24,16,0.2)" }}
                  placeholder="First Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: ESPRESSO }}>Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 bg-white"
                  style={{ borderColor: "rgba(44,24,16,0.2)" }}
                  placeholder="Last Name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: ESPRESSO }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 bg-white"
                  style={{ borderColor: "rgba(44,24,16,0.2)" }}
                  placeholder="Email"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: ESPRESSO }}>Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2 bg-white"
                  style={{ borderColor: "rgba(44,24,16,0.2)" }}
                  placeholder="Phone Number"
                />
              </div>
            </div>
          </section>

          {/* Pickup banner */}
          <div
            className="rounded-xl p-4 mb-6 flex gap-3 items-start"
            style={{ backgroundColor: "rgba(34, 139, 34, 0.15)", border: "1px solid rgba(34, 139, 34, 0.4)" }}
          >
            <Check className="size-6 shrink-0 text-green-700" />
            <div>
              <p className="font-bold text-green-800">PICKUP ORDER</p>
              <p className="text-sm text-green-800 mt-0.5">
                Your order will be ready for pickup at <strong>{PICKUP_ADDRESS}</strong>
              </p>
            </div>
          </div>

          {/* Payment — card only */}
          <section className="mb-6">
            <h2 className="text-lg font-bold mb-4" style={{ color: ESPRESSO }}>
              Payment
            </h2>
            <p className="text-sm mb-4" style={{ color: ESPRESSO }}>Credit/Debit Card</p>
            <div className="space-y-4 pl-0">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: ESPRESSO }}>Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                  placeholder="1234 5678 9012 3456"
                  className="w-full rounded-lg border px-3 py-2 bg-white"
                  style={{ borderColor: "rgba(44,24,16,0.2)" }}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: ESPRESSO }}>Expiry Date</label>
                  <input
                    type="text"
                    value={
                      expiry.length >= 2
                        ? `${expiry.slice(0, 2)}/${expiry.slice(2, 4)}`
                        : expiry
                    }
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                      setExpiry(digits);
                    }}
                    placeholder="MM/YY"
                    className="w-full rounded-lg border px-3 py-2 bg-white"
                    style={{ borderColor: "rgba(44,24,16,0.2)" }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: ESPRESSO }}>CVC</label>
                  <input
                    type="text"
                    value={cvc}
                    onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                    placeholder="123"
                    className="w-full rounded-lg border px-3 py-2 bg-white"
                    style={{ borderColor: "rgba(44,24,16,0.2)" }}
                  />
                </div>
              </div>
              <p className="text-sm" style={{ color: "#C4622D" }}>
                Your payment is processed securely through Clover
              </p>
            </div>
          </section>
        </main>

        {/* Mobile: Place order button at bottom of form (when summary may be collapsed) */}
        <div className="md:hidden shrink-0 p-4 pt-0">
          <button
            type="button"
            onClick={handlePlaceOrder}
            disabled={placing}
            className="w-full py-3 rounded-xl font-bold uppercase tracking-wider text-white disabled:opacity-70 transition-transform active:scale-[0.98]"
            style={{
              backgroundColor: "#C4622D",
              fontFamily: "'Oswald', sans-serif",
              fontSize: "1rem",
            }}
          >
            {placing ? "Placing…" : "Place order"}
          </button>
        </div>

        {/* Desktop: Order summary sidebar (hidden on mobile) */}
        <aside
          className="hidden md:flex w-full md:w-80 shrink-0 flex-col rounded-t-2xl md:rounded-l-2xl border-t md:border-t-0 md:border-l overflow-hidden"
          style={{
            backgroundColor: ESPRESSO,
            borderColor: "rgba(232,168,56,0.25)",
          }}
        >
          <h2 className="p-4 text-lg font-bold text-white border-b" style={{ borderColor: "rgba(255,248,240,0.1)", fontFamily: "'Oswald', sans-serif" }}>
            Order Summary
          </h2>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {items.map((line) => (
              <div key={line.id} className="text-sm">
                <p className="font-semibold text-white">
                  {line.categoryName} {line.itemName}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,248,240,0.7)" }}>
                  Qty: {line.quantity}
                  {line.removeIngredients.length > 0 && ` • X Remove: ${line.removeIngredients.join(", ")}`}
                  {line.addExtras.length > 0 && ` • Add: ${line.addExtras.map(formatAddExtra).join(", ")}`}
                </p>
                <p className="font-semibold mt-1" style={{ color: GOLD }}>${line.lineTotal.toFixed(2)}</p>
              </div>
            ))}
          </div>
          <div className="p-4 border-t space-y-1" style={{ borderColor: "rgba(255,248,240,0.1)" }}>
            <div className="flex justify-between text-white text-sm">
              <span>Subtotal</span>
              <span style={{ color: GOLD }}>${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-white text-sm">
              <span>Tax</span>
              <span style={{ color: GOLD }}>${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-white pt-2 mt-2 border-t" style={{ borderColor: "rgba(255,248,240,0.15)" }}>
              <span>Total</span>
              <span className="text-lg" style={{ color: GOLD }}>${total.toFixed(2)}</span>
            </div>
          </div>
          <div className="p-4">
            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={placing}
              className="w-full py-3 rounded-xl font-bold uppercase tracking-wider text-white disabled:opacity-70 transition-transform active:scale-[0.98]"
              style={{
                backgroundColor: "#C4622D",
                fontFamily: "'Oswald', sans-serif",
                fontSize: "1rem",
              }}
            >
              {placing ? "Placing…" : "Place order"}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
