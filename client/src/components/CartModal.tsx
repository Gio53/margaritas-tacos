// ============================================================
// Your Cart modal — item cards, subtotal, tax, total, Proceed to Checkout
// Matches mockup: dark brown bg, lighter brown cards, gold prices, checkout button
// ============================================================

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCart } from "@/contexts/CartContext";
import { formatAddExtra } from "@/data/orderOptions";
import { formatQuantityLabel } from "@/lib/utils";
import { X } from "lucide-react";

const ESPRESSO = "#2C1810";
const GOLD = "#E8A838";
const CREAM = "#FFF8F0";
const CARD_BG = "rgba(139, 90, 43, 0.35)"; // lighter brown rounded card
const TAX_RATE = 0.08875;

interface CartModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProceedToCheckout?: () => void;
}

export function CartModal({
  open,
  onOpenChange,
  onProceedToCheckout,
}: CartModalProps) {
  const { items, removeItem, updateQuantity, cartTotal } = useCart();
  const subtotal = cartTotal;
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md border-0 p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh] [&_[data-slot=dialog-close]]:text-white [&_[data-slot=dialog-close]]:hover:text-white [&_[data-slot=dialog-close]]:opacity-90"
        style={{ backgroundColor: ESPRESSO }}
      >
        <DialogHeader className="p-4 pb-3 text-left shrink-0 border-b border-white/10">
          <DialogTitle
            className="text-lg font-bold"
            style={{
              fontFamily: "'Oswald', sans-serif",
              color: CREAM,
            }}
          >
            Your Cart
          </DialogTitle>
        </DialogHeader>

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
                    className="font-bold pr-8"
                    style={{
                      color: ESPRESSO,
                      fontFamily: "'Oswald', sans-serif",
                      fontSize: "1rem",
                    }}
                  >
                    {line.categoryName}
                  </p>
                  <p
                    className="text-sm mt-0.5"
                    style={{ color: "rgba(44,24,16,0.75)" }}
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
                          borderColor: "rgba(44,24,16,0.25)",
                          backgroundColor: "rgba(255,255,255,0.5)",
                          color: ESPRESSO,
                        }}
                      >
                        −
                      </button>
                      <span
                        className="min-w-[1.5rem] text-center font-semibold"
                        style={{ color: ESPRESSO }}
                      >
                        {formatQuantityLabel(line.categoryId, line.quantity)}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateQuantity(line.id, line.quantity + 1)
                        }
                        className="size-8 rounded-lg flex items-center justify-center border transition-transform active:scale-95"
                        style={{
                          borderColor: "rgba(44,24,16,0.25)",
                          backgroundColor: "rgba(255,255,255,0.5)",
                          color: ESPRESSO,
                        }}
                      >
                        +
                      </button>
                    </div>
                    <span
                      className="font-bold"
                      style={{ color: GOLD }}
                    >
                      ${line.lineTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}

              {/* Order summary card */}
              <div
                className="rounded-xl p-4"
                style={{
                  backgroundColor: CARD_BG,
                  border: "1px solid rgba(255,248,240,0.12)",
                }}
              >
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: ESPRESSO }}>Subtotal</span>
                  <span className="font-bold" style={{ color: GOLD }}>
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span style={{ color: ESPRESSO }}>Tax (8.875%)</span>
                  <span className="font-bold" style={{ color: GOLD }}>
                    ${tax.toFixed(2)}
                  </span>
                </div>
                <div
                  className="border-t pt-2 flex justify-between font-bold"
                  style={{
                    borderColor: "rgba(44,24,16,0.2)",
                    color: ESPRESSO,
                  }}
                >
                  <span>Total</span>
                  <span style={{ color: GOLD }}>${total.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 shrink-0 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                onProceedToCheckout?.();
              }}
              className="w-full py-3 rounded-xl font-bold uppercase tracking-wider transition-transform active:scale-[0.98]"
              style={{
                backgroundColor: "#C4622D",
                color: CREAM,
                fontFamily: "'Oswald', sans-serif",
                fontSize: "0.95rem",
              }}
            >
              Proceed to checkout
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
