import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatOrderQuantityLabel } from "@shared/orderLineHelpers";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Tacos → "1 order" / "N orders"; other items → "1x" / "Nx". */
export function formatQuantityLabel(
  categoryIdOrName: string | undefined,
  quantity: number,
  categoryName?: string
): string {
  // Call sites sometimes pass categoryName as the first arg when id is missing.
  return formatOrderQuantityLabel(
    categoryIdOrName,
    quantity,
    categoryName ?? categoryIdOrName
  );
}
