import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** For Mexican Street Tacos (sold in orders of 3), show "1 order" / "2 orders". Otherwise the number. */
export function formatQuantityLabel(categoryIdOrName: string, quantity: number): string {
  const isStreetTacos =
    categoryIdOrName === "mexican-street-tacos" ||
    categoryIdOrName === "3 Mexican Street Tacos";
  if (isStreetTacos) return quantity === 1 ? "1 order" : `${quantity} orders`;
  return String(quantity);
}
