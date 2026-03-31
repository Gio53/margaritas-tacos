import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Matches Clover / kitchen tickets: always "1 order" or "N orders" (category arg kept for call sites). */
export function formatQuantityLabel(
  _categoryIdOrName: string | undefined,
  quantity: number
): string {
  const qty = Math.max(1, Math.floor(Number(quantity)) || 1);
  return qty === 1 ? "1 order" : `${qty} orders`;
}
