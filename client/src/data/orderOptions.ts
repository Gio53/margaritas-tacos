// ============================================================
// Order customization: remove ingredients & add extras per category
// ============================================================

export interface OrderExtra {
  name: string;
  price: number;
  /** Number of sides (default 1). */
  quantity?: number;
}

const SIDE_CUP_LABEL = "4oz cup";

/** Format add extra for display: always show quantity, e.g. "Side of Guacamole (4oz cup) ×1 (+$3.00)" or "×2 (+$6.00)" */
export function formatAddExtra(e: OrderExtra): string {
  const qty = e.quantity ?? 1;
  const total = e.price * qty;
  const qtyLabel = ` ×${qty}`;
  return `Side of ${e.name} (${SIDE_CUP_LABEL})${qtyLabel} (+$${total.toFixed(2)})`;
}

export { SIDE_CUP_LABEL };

/** One required pick (e.g. shell type) before add to cart. */
export interface RequiredChoice {
  id: string;
  /** Short label for receipts/cart, e.g. "Shell" */
  label: string;
  /** Heading in the customize modal */
  prompt: string;
  options: string[];
}

export interface CategoryOrderOptions {
  removeIngredients: string[];
  addExtras: OrderExtra[];
  requiredChoice?: RequiredChoice;
}

const EXTRAS_2 = [
  { name: "Guacamole", price: 3.0 },
  { name: "Pico de Gallo", price: 2.0 },
  { name: "Sour Cream", price: 2.0 },
];

/** Per-category customization options for the order modal. */
export const categoryOrderOptions: Record<string, CategoryOrderOptions> = {
  "mexican-street-tacos": {
    removeIngredients: ["Cilantro", "Onions", "Guacamole"],
    addExtras: EXTRAS_2,
  },
  "3-american-tacos": {
    removeIngredients: ["Lettuce", "Cheese", "Sour Cream", "Tomato"],
    addExtras: EXTRAS_2,
    requiredChoice: {
      id: "shell",
      label: "Shell",
      prompt: "Choose shell (required)",
      options: ["Hard shell", "Soft shell"],
    },
  },
  tostadas: {
    removeIngredients: ["Black beans", "Cheese", "Lettuce", "Tomato", "Sour cream", "Avocado"],
    addExtras: EXTRAS_2,
  },
  chilaquiles: {
    removeIngredients: ["Sour cream", "Cotija cheese"],
    addExtras: EXTRAS_2,
    requiredChoice: {
      id: "sauce",
      label: "Sauce",
      prompt: "Choose sauce (required)",
      options: ["Red sauce", "Green sauce"],
    },
  },
  "rice-bowls": {
    removeIngredients: ["Black beans", "Cheese", "Lettuce", "Pico de gallo", "Sour cream", "Guacamole"],
    addExtras: EXTRAS_2,
  },
  burrito: {
    removeIngredients: ["Beans", "Rice", "Cheese", "Pico de gallo", "Guacamole", "Sour cream", "Lettuce"],
    addExtras: EXTRAS_2,
  },
  quesadillas: {
    removeIngredients: [],
    addExtras: EXTRAS_2,
  },
  "mexican-nachos": {
    removeIngredients: ["Black beans", "Cheese", "Pico de gallo", "Sour cream", "Guacamole"],
    addExtras: EXTRAS_2,
  },
  torta: {
    removeIngredients: ["Refried beans", "Cheese", "Tomato", "Lettuce", "Onion", "Avocado"],
    addExtras: EXTRAS_2,
  },
  flautas: {
    removeIngredients: ["Salad", "Rice & beans", "Sour cream", "Cotija cheese"],
    addExtras: EXTRAS_2,
  },
  "wet-burrito": {
    removeIngredients: ["Beans", "Rice", "Cheese", "Pico de gallo", "Guacamole", "Sour cream", "Lettuce"],
    addExtras: EXTRAS_2,
  },
  nachos: {
    removeIngredients: ["Black beans", "Cheese", "Pico de gallo", "Sour cream", "Guacamole"],
    addExtras: EXTRAS_2,
  },
  enchiladas: {
    removeIngredients: ["Lettuce", "Sour cream", "Rice & beans"],
    addExtras: EXTRAS_2,
    requiredChoice: {
      id: "sauce",
      label: "Sauce",
      prompt: "Choose sauce (required)",
      options: ["Red sauce", "Green sauce"],
    },
  },
};

export function getOrderOptionsForCategory(categoryId: string): CategoryOrderOptions {
  return (
    categoryOrderOptions[categoryId] ?? {
      removeIngredients: [],
      addExtras: EXTRAS_2,
    }
  );
}

/** Line item note for cart / tickets (e.g. "Shell: Hard shell"). */
export function formatChoicesLine(
  categoryId: string | undefined,
  choices: Record<string, string> | undefined
): string {
  if (!choices || Object.keys(choices).length === 0) return "";
  const rc = categoryId ? categoryOrderOptions[categoryId]?.requiredChoice : undefined;
  if (rc) {
    const v = choices[rc.id];
    return v ? `${rc.label}: ${v}` : "";
  }
  return Object.entries(choices)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");
}
