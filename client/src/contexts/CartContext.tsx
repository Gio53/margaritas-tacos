// ============================================================
// Cart state for order page (and future checkout)
// ============================================================

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { OrderExtra } from "@/data/orderOptions";

export interface CartLineItem {
  id: string;
  categoryId: string;
  categoryName: string;
  itemName: string;
  basePrice: number;
  quantity: number;
  removeIngredients: string[];
  addExtras: OrderExtra[];
  /** Cached total for this line (basePrice * quantity + sum of extras * quantity) */
  lineTotal: number;
}

interface CartContextValue {
  items: CartLineItem[];
  addItem: (item: Omit<CartLineItem, "id" | "lineTotal">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  cartTotal: number;
  itemCount: number;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function generateId(): string {
  return `cart-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function computeLineTotal(
  basePrice: number,
  quantity: number,
  addExtras: OrderExtra[],
  _categoryId?: string
): number {
  const extrasTotal = addExtras.reduce(
    (s, e) => s + e.price * (e.quantity ?? 1),
    0
  );
  // Mexican Street Tacos: quantity = number of orders of 3; each order = basePrice ($12)
  return basePrice * quantity + extrasTotal;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartLineItem[]>([]);

  const addItem = useCallback(
    (item: Omit<CartLineItem, "id" | "lineTotal">) => {
      const lineTotal = computeLineTotal(
        item.basePrice,
        item.quantity,
        item.addExtras,
        item.categoryId
      );
      setItems((prev) => [
        ...prev,
        { ...item, id: generateId(), lineTotal },
      ]);
    },
    []
  );

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              quantity,
              lineTotal: computeLineTotal(
                i.basePrice,
                quantity,
                i.addExtras,
                i.categoryId
              ),
            }
          : i
      )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const cartTotal = useMemo(
    () => items.reduce((sum, i) => sum + i.lineTotal, 0),
    [items]
  );
  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      addItem,
      removeItem,
      updateQuantity,
      cartTotal,
      itemCount,
      clearCart,
    }),
    [items, addItem, removeItem, updateQuantity, cartTotal, itemCount, clearCart]
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
