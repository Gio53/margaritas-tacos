// ============================================================
// Cart / checkout totals — tax and automatic bulk discount
// ============================================================

export const TAX_RATE = 0.08875;

/** Cart subtotal (before tax) above this gets 25% off automatically. */
export const BULK_DEAL_THRESHOLD = 20;

export const BULK_DEAL_DISCOUNT_RATE = 0.25;

export interface OrderTotals {
  /** Sum of line items before discount */
  subtotalBeforeDiscount: number;
  bulkDealEligible: boolean;
  discountAmount: number;
  /** After discount, before tax */
  subtotal: number;
  tax: number;
  total: number;
}

export function computeOrderTotals(cartTotal: number): OrderTotals {
  const subtotalBeforeDiscount = cartTotal;
  const bulkDealEligible = subtotalBeforeDiscount > BULK_DEAL_THRESHOLD;
  const discountAmount = bulkDealEligible
    ? Math.round(subtotalBeforeDiscount * BULK_DEAL_DISCOUNT_RATE * 100) / 100
    : 0;
  const subtotal =
    Math.round((subtotalBeforeDiscount - discountAmount) * 100) / 100;
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  return {
    subtotalBeforeDiscount,
    bulkDealEligible,
    discountAmount,
    subtotal,
    tax,
    total,
  };
}
