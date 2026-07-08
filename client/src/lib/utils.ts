import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Order quantity for cart, checkout, tickets, and Clover receipts (1x = one order). */
export function formatQuantityLabel(
  _categoryIdOrName: string | undefined,
  quantity: number
): string {
  const qty = Math.max(1, Math.floor(Number(quantity)) || 1);
  return `${qty}x`;
}
