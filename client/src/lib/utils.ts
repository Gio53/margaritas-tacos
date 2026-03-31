import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { usesOrderQuantityWording } from "@shared/cloverReceiptLayout";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Taco platters, Tostadas, Enchiladas, etc.: "1 order" / "2 orders". Otherwise plain quantity number. */
export function formatQuantityLabel(
  categoryIdOrName: string | undefined,
  quantity: number
): string {
  if (!categoryIdOrName) return String(quantity);
  if (usesOrderQuantityWording(categoryIdOrName, categoryIdOrName)) {
    return quantity === 1 ? "1 order" : `${quantity} orders`;
  }
  return String(quantity);
}
