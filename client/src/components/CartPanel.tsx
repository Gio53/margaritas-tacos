// ============================================================
// Your Cart side panel — sits next to menu, not a modal
// Dark brown panel, item cards, subtotal, tax, total, Proceed to Checkout
// ============================================================

import { useCart } from "@/contexts/CartContext";
import { formatAddExtra } from "@/data/orderOptions";
import { X } from "lucide-react";

const ESPRESSO = "#2C1810";
const GOLD = "#E8A838";
const CREAM = "#FFF8F0";
const CARD_BG = "rgba(139, 90, 43, 0.35)";
const TAX_RATE = 0.08875;

interface CartPanelProps {
  onProceedToCheckout?: () => void;
}

export function CartPanel({ onProceedToCheckout }: CartPanelProps) {
  const { items, removeItem, updateQuantity, cartTotal } = useCart();
  const subtotal = cartTotal;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  return (
    <aside
      className="h-full flex flex-col w-full min-w-0 rounded-l-2xl border-l border-t border-b overflow-hidden"
      style={{
        backgroundColor: ESPRESSO,
        borderColor: "rgba(232,168,56,0.25)",
      }}
    >
      <header className="shrink-0 p-4 border-b" style={{ borderColor: "rgba(255,248,240,0.1)" }}>
        <h2
          className="text-lg font-bold text-white"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          Your Cart
        </h2>
      </header>

      <div className="flex-1 overflow-y-auto min-h-0 p-4 space-y-4">
        {items.length === 0 ? (
          <p
            className="text-center py-8 text-sm"
            style={{ color: "rgba(255,248,240,0.5)" }}
          >
            Your cart is empty
          </p>
        ) : (
          <>
            {items.map((line) => (
              <div
                key={line.id}
                className="rounded-xl p-4 relative"
                style={{
                  backgroundColor: CARD_BG,
                  border: "1px solid rgba(255,248,240,0.12)",
                }}
              >
                <button
                  type="button"
                  onClick={() => removeItem(line.id)}
                  className="absolute top-3 right-3 p-1 rounded-md hover:bg-white/10 transition-colors"
                  style={{ color: GOLD }}
                  aria-label="Remove item"
                >
                  <X className="size-5" />
                </button>
                <p
                  className="font-bold pr-8 text-white"
                  style={{
                    fontFamily: "'Oswald', sans-serif",
                    fontSize: "1rem",
                  }}
                >
                  {line.categoryName}
                </p>
                <p
                  className="text-sm mt-0.5"
                  style={{ color: "rgba(255,248,240,0.8)" }}
                >
                  {line.itemName}
                  {line.removeIngredients.length > 0 &&
                    ` • No: ${line.removeIngredients.join(", ")}`}
                  {line.addExtras.length > 0 &&
                    ` • Add: ${line.addExtras.map(formatAddExtra).join(", ")}`}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(line.id, line.quantity - 1)
                      }
                      className="size-8 rounded-lg flex items-center justify-center border transition-transform active:scale-95"
                      style={{
                        borderColor: "rgba(255,248,240,0.3)",
                        backgroundColor: "rgba(255,255,255,0.1)",
                        color: CREAM,
                      }}
                    >
                      −
                    </button>
                    <span
                      className="min-w-[1.5rem] text-center font-semibold text-white"
                    >
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateQuantity(line.id, line.quantity + 1)
                      }
                      className="size-8 rounded-lg flex items-center justify-center border transition-transform active:scale-95"
                      style={{
                        borderColor: "rgba(255,248,240,0.3)",
                        backgroundColor: "rgba(255,255,255,0.1)",
                        color: CREAM,
                      }}
                    >
                      +
                    </button>
                  </div>
                  <span className="font-bold" style={{ color: GOLD }}>
                    ${line.lineTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}

            {/* Order summary — white text on dark brown */}
            <div className="rounded-xl p-4" style={{
              backgroundColor: "rgba(0,0,0,0.2)",
              border: "1px solid rgba(255,248,240,0.1)",
            }}>
              <div className="flex justify-between text-sm mb-1 text-white">
                <span>Subtotal</span>
                <span className="font-bold" style={{ color: GOLD }}>
                  ${subtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm mb-2 text-white">
                <span>Tax (8.875%)</span>
                <span className="font-bold" style={{ color: GOLD }}>
                  ${tax.toFixed(2)}
                </span>
              </div>
              <div
                className="border-t pt-2 flex justify-between font-bold text-white"
                style={{ borderColor: "rgba(255,248,240,0.2)" }}
              >
                <span>Total</span>
                <span style={{ color: GOLD }}>${total.toFixed(2)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {items.length > 0 && (
        <div className="p-4 shrink-0 border-t" style={{ borderColor: "rgba(255,248,240,0.1)" }}>
          <button
            type="button"
            onClick={onProceedToCheckout}
            className="w-full py-3 rounded-xl font-bold uppercase tracking-wider transition-transform active:scale-[0.98] text-white"
            style={{
              backgroundColor: "#C4622D",
              fontFamily: "'Oswald', sans-serif",
              fontSize: "0.95rem",
            }}
          >
            Proceed to checkout
          </button>
        </div>
      )}
    </aside>
  );
}
