import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** For taco platters sold as orders of 3, show "1 order" / "2 orders". Otherwise the number. */
export function formatQuantityLabel(
  categoryIdOrName: string | undefined,
  quantity: number
): string {
  if (!categoryIdOrName) return String(quantity);
  const isOrderOfThree =
    categoryIdOrName === "mexican-street-tacos" ||
    categoryIdOrName === "3 Mexican Street Tacos" ||
    categoryIdOrName === "3-american-tacos" ||
    categoryIdOrName === "3 American Tacos";
  if (isOrderOfThree) return quantity === 1 ? "1 order" : `${quantity} orders`;
  return String(quantity);
}
