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

/** Format add extra for display: "Side of Guacamole (4oz cup) (+$3.00)" or "Side of Pico (4oz cup) ×2 (+$4.00)" */
export function formatAddExtra(e: OrderExtra): string {
  const qty = e.quantity ?? 1;
  const total = e.price * qty;
  const qtyLabel = qty > 1 ? ` ×${qty}` : "";
  return `Side of ${e.name} (${SIDE_CUP_LABEL})${qtyLabel} (+$${total.toFixed(2)})`;
}

export { SIDE_CUP_LABEL };

export interface CategoryOrderOptions {
  removeIngredients: string[];
  addExtras: OrderExtra[];
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
  },
  tostadas: {
    removeIngredients: ["Black beans", "Cheese", "Lettuce", "Tomato", "Sour cream", "Avocado"],
    addExtras: EXTRAS_2,
  },
  chilaquiles: {
    removeIngredients: ["Sour cream", "Cotija cheese"],
    addExtras: EXTRAS_2,
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
