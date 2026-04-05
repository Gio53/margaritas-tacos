// ============================================================
// Order Page — Place your order with category nav, item grid
// Your Cart pops up as a side panel next to the items (right side)
// ============================================================

import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { menuCategories } from "@/data/menuData";
import type { MenuItem } from "@/data/menuData";
import { useCart } from "@/contexts/CartContext";
import { useMenuAvailability } from "@/contexts/MenuAvailabilityContext";
import { CustomizeModal } from "@/components/CustomizeModal";
import { CartPanel } from "@/components/CartPanel";
import { ChevronLeft, ShoppingCart, Clock } from "lucide-react";
import { toast } from "sonner";
import { useRestaurantHours } from "@/contexts/RestaurantHoursContext";

const ESPRESSO = "#2C1810";
const GOLD = "#E8A838";
const CREAM = "#FFF8F0";
const BEIGE_BG = "#FFF8F0";
const LIGHT_PEACH = "rgba(232, 168, 56, 0.18)";
const CARD_BG = "rgba(255,248,240,0.95)";
const MUTED = "rgba(0,0,0,0.5)";

export default function OrderPage() {
  const { itemCount } = useCart();
  const { isOpen, closedMessage } = useRestaurantHours();
  const { isItemUnavailable, unavailableUntil } = useMenuAvailability();
  const [, setLocation] = useLocation();
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    menuCategories[0]?.id ?? ""
  );
  const [customizeItem, setCustomizeItem] = useState<{
    categoryId: string;
    categoryName: string;
    item: MenuItem;
  } | null>(null);
  const [cartOpen, setCartOpen] = useState(false);

  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const category = menuCategories.find((c) => c.id === selectedCategoryId);
  const categoryItems = category?.items ?? [];

  // Scroll selected category pill into view
  useEffect(() => {
    const el = categoryScrollRef.current?.querySelector(
      `[data-category-id="${selectedCategoryId}"]`
    );
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [selectedCategoryId]);

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: BEIGE_BG, fontFamily: "'Lato', sans-serif" }}
    >
      {/* Closed hours banner */}
      {!isOpen() && (
        <div
          className="flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium text-amber-900 bg-amber-100 border-b border-amber-200"
          role="alert"
        >
          <Clock className="size-4 shrink-0" />
          <span>{closedMessage}</span>
        </div>
      )}

      {/* ── Header: Back | PLACE YOUR ORDER | Cart icon ── */}
      <header
        className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 shadow-sm"
        style={{
          backgroundColor: ESPRESSO,
          borderBottom: "1px solid rgba(232,168,56,0.2)",
        }}
      >
        <Link href="/" className="flex items-center gap-1 text-[#E8A838] hover:opacity-90">
          <ChevronLeft className="size-5" />
          <span className="font-semibold uppercase tracking-wide">Back</span>
        </Link>
        <h1
          className="text-lg font-bold text-white uppercase tracking-wider absolute left-1/2 -translate-x-1/2"
          style={{ fontFamily: "'Oswald', sans-serif" }}
        >
          Place your order
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCartOpen((open) => !open)}
            className="flex items-center gap-2 p-1.5 rounded-lg transition-transform hover:scale-105 active:scale-95"
            style={{ color: GOLD }}
          >
            <span
              className="flex items-center justify-center size-8 rounded-full text-white font-bold text-sm"
              style={{ backgroundColor: GOLD }}
            >
              {itemCount}
            </span>
            <ShoppingCart className="size-6" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* ── Main: category nav + item grid ── */}
        <main className="h-full flex-1 min-w-0 overflow-y-auto flex flex-col">
          {/* Category pills — wrap in rows, selected = dark, unselected = light peach */}
          <div
            ref={categoryScrollRef}
            className="flex flex-wrap gap-2 px-4 py-3 shrink-0 border-b"
            style={{
              borderColor: "rgba(44,24,16,0.12)",
              backgroundColor: BEIGE_BG,
            }}
          >
            {menuCategories.map((cat) => (
              <button
                key={cat.id}
                data-category-id={cat.id}
                type="button"
                onClick={() => setSelectedCategoryId(cat.id)}
                className="shrink-0 rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-wide transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  backgroundColor:
                    selectedCategoryId === cat.id ? ESPRESSO : LIGHT_PEACH,
                  color: selectedCategoryId === cat.id ? CREAM : ESPRESSO,
                  border:
                    selectedCategoryId === cat.id
                      ? `1px solid ${ESPRESSO}`
                      : "1px solid rgba(139, 90, 43, 0.35)",
                  fontFamily: "'Oswald', sans-serif",
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Item grid */}
          <div className="p-4 flex-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categoryItems.map((item) => {
                const unavailable = isItemUnavailable(category!.id, item.name);
                const until = unavailableUntil(category!.id, item.name);
                return (
                  <button
                    key={item.name}
                    type="button"
                    aria-disabled={unavailable}
                    onClick={() => {
                      if (unavailable) {
                        const t =
                          until != null
                            ? new Date(until).toLocaleString([], {
                                dateStyle: "short",
                                timeStyle: "short",
                              })
                            : "";
                        toast.error(
                          t
                            ? `Temporarily unavailable until ${t}.`
                            : "This item is temporarily unavailable."
                        );
                        return;
                      }
                      setCustomizeItem({
                        categoryId: category!.id,
                        categoryName: category!.name,
                        item,
                      });
                    }}
                    className="text-left rounded-lg border p-4 transition-all duration-200 hover:scale-[1.02] hover:shadow-md active:scale-[0.99] disabled:opacity-60 disabled:pointer-events-auto disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                    style={{
                      backgroundColor: unavailable ? "rgba(0,0,0,0.04)" : CARD_BG,
                      borderColor: unavailable ? "rgba(220,38,38,0.25)" : "rgba(44,24,16,0.12)",
                    }}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <p
                          className="font-bold text-black"
                          style={{ fontFamily: "'Oswald', sans-serif" }}
                        >
                          {category?.name}
                        </p>
                        <p className="text-sm mt-0.5" style={{ color: MUTED }}>
                          {item.name}
                        </p>
                        {unavailable && (
                          <p className="text-xs mt-1 font-semibold text-red-700">
                            Unavailable
                            {until != null &&
                              ` until ${new Date(until).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`}
                          </p>
                        )}
                      </div>
                      <span
                        className="font-semibold shrink-0"
                        style={{ color: unavailable ? MUTED : GOLD }}
                      >
                        ${item.price.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs mt-2" style={{ color: MUTED }}>
                      {unavailable ? "Check back later" : "Click to customize"}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </main>

        {/* Your Cart — side panel next to items when open */}
        {cartOpen && (
          <div className="w-full sm:w-[380px] md:w-[400px] shrink-0 h-full overflow-hidden">
            <CartPanel
              onProceedToCheckout={() => {
                if (!isOpen()) {
                  toast.error(closedMessage);
                  return;
                }
                setCartOpen(false);
                setLocation("/checkout");
              }}
            />
          </div>
        )}
      </div>

      {/* Customize modal */}
      {customizeItem && (
        <CustomizeModal
          open={!!customizeItem}
          onOpenChange={(open) => !open && setCustomizeItem(null)}
          categoryId={customizeItem.categoryId}
          categoryName={customizeItem.categoryName}
          item={customizeItem.item}
          onOpenCart={() => setCartOpen(true)}
        />
      )}
    </div>
  );
}
