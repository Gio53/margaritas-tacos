// ============================================================
// Cart / checkout totals — tax
// ============================================================

export const TAX_RATE = 0.08875;

export interface OrderTotals {
  subtotal: number;
  tax: number;
  total: number;
}

export function computeOrderTotals(cartTotal: number): OrderTotals {
  const subtotal = Math.round(cartTotal * 100) / 100;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  return {
    subtotal,
    tax,
    total,
  };
}
