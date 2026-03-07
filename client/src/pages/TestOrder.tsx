// ============================================================
// Test order page — passcode "test2022", adds a $0 test order
// So you can test Order Management / auto-print / chime without backend or Clover
// ============================================================

import { useState } from "react";
import { Link } from "wouter";
import { useOrders } from "@/contexts/OrdersContext";
import { toast } from "sonner";

const PASSCODE = "test2022";
const SESSION_KEY = "margaritas_test_order";
const PICKUP_ADDRESS = "4549 Austin Blvd, Island Park, NY";
const ESPRESSO = "#2C1810";
const GOLD = "#E8A838";
const BEIGE_BG = "#FFF8F0";

export default function TestOrder() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === "true");
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const { addOrder, useApi } = useOrders();

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === PASSCODE) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setUnlocked(true);
      setError("");
      setInput("");
    } else {
      setError("Wrong passcode");
    }
  };

  const handleAddTestOrder = async () => {
    setAdding(true);
    try {
      await addOrder({
        customer: {
          firstName: "Test",
          lastName: "Order",
          email: "test@example.com",
          phone: "555-000-0000",
        },
        items: [
          {
            categoryName: "Test",
            itemName: "Test order (no charge)",
            quantity: 1,
            removeIngredients: [],
            addExtras: [],
            lineTotal: 0,
          },
        ],
        subtotal: 0,
        tax: 0,
        total: 0,
        pickupAddress: PICKUP_ADDRESS,
        paymentMethod: "card",
      });
      toast.success("Test order added. Check Order Management.");
    } catch (e) {
      toast.error("Failed to add test order");
    } finally {
      setAdding(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setUnlocked(false);
  };

  if (!unlocked) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ backgroundColor: BEIGE_BG, fontFamily: "'Lato', sans-serif" }}
      >
        <div className="w-full max-w-sm rounded-xl border-2 p-6 bg-white" style={{ borderColor: ESPRESSO }}>
          <h1 className="text-xl font-bold mb-2 text-center" style={{ color: ESPRESSO }}>
            Test order
          </h1>
          <p className="text-sm mb-4 text-center" style={{ color: "#6B7280" }}>
            Enter passcode to add a $0 test order for Order Management.
          </p>
          <form onSubmit={handleUnlock} className="space-y-3">
            <input
              type="password"
              value={input}
              onChange={(e) => { setInput(e.target.value); setError(""); }}
              placeholder="Passcode"
              className="w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "rgba(44,24,16,0.3)" }}
              autoFocus
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
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
      className="min-h-screen flex flex-col items-center justify-center p-6"
      style={{ backgroundColor: BEIGE_BG, fontFamily: "'Lato', sans-serif" }}
    >
      <div className="w-full max-w-md rounded-xl border-2 p-6 bg-white" style={{ borderColor: ESPRESSO }}>
        <h1 className="text-xl font-bold mb-2 text-center" style={{ color: ESPRESSO }}>
          Test order
        </h1>
        <p className="text-sm mb-4 text-center" style={{ color: "#6B7280" }}>
          Adds one order with a $0 item. It will show in Order Management and trigger chime/print if enabled.
        </p>
        <p className="text-xs mb-4 text-center" style={{ color: "#16a34a" }}>
          Test orders can be added 24/7 (hours don’t apply).
        </p>
        {useApi && (
          <p className="text-xs mb-4 text-center" style={{ color: "#16a34a" }}>
            Synced with API — order will appear on all devices.
          </p>
        )}
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={handleAddTestOrder}
            disabled={adding}
            className="w-full py-3 rounded-lg font-semibold text-white disabled:opacity-70"
            style={{ backgroundColor: GOLD }}
          >
            {adding ? "Adding…" : "Add test order"}
          </button>
          <button
            type="button"
            onClick={logout}
            className="w-full py-2 rounded-lg font-medium border"
            style={{ borderColor: "rgba(44,24,16,0.3)", color: ESPRESSO }}
          >
            Lock (enter passcode again)
          </button>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
          <Link href="/admin" style={{ color: GOLD }} className="hover:underline font-semibold">
            Order Management
          </Link>
          <Link href="/" style={{ color: GOLD }} className="hover:underline font-semibold">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
