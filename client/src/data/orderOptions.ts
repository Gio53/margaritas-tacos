// ============================================================
// Order customization: remove ingredients & add extras per category
// ============================================================

export interface OrderExtra {
  name: string;
  /** Price per side in dollars; omitted on phone-order free-text extras. */
  price?: number;
  /** Number of sides (default 1). */
  quantity?: number;
}

const SIDE_CUP_LABEL = "4oz cup";

/** Format add extra for display: always show quantity, e.g. "Side of Guacamole (4oz cup) ×1 (+$3.00)" or "×2 (+$6.00)". Price is omitted when unknown (e.g. phone-order free-text extras). */
export function formatAddExtra(e: OrderExtra): string {
  const qty = e.quantity ?? 1;
  const qtyLabel = ` ×${qty}`;
  const cupLabel = e.price == null ? "" : ` (${SIDE_CUP_LABEL})`;
  const priceLabel = e.price == null ? "" : ` (+$${(e.price * qty).toFixed(2)})`;
  return `Side of ${e.name}${cupLabel}${qtyLabel}${priceLabel}`;
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
  /** Optional price delta per option over the base price, e.g. { Mixed: 2 } for +$2. */
  optionPriceDelta?: Record<string, number>;
}

/** Price delta for one option of a required pick (0 when unpriced). */
export function getOptionPriceDelta(rc: RequiredChoice, option: string): number {
  return rc.optionPriceDelta?.[option] ?? 0;
}

export interface CategoryOrderOptions {
  removeIngredients: string[];
  addExtras: OrderExtra[];
  /** Single required pick (backward compatible). */
  requiredChoice?: RequiredChoice;
  /** Multiple required picks (e.g. sauce + tortilla). Overrides using only `requiredChoice` when both set — prefer one or the other. */
  requiredChoices?: RequiredChoice[];
  /** Per-item overrides for categories whose items differ (e.g. Specials). */
  itemOverrides?: Record<string, Partial<Omit<CategoryOrderOptions, "itemOverrides">>>;
}

/** All required picks for an item's category (item overrides win). */
export function getRequiredChoicesForCategory(
  categoryId: string,
  itemName?: string
): RequiredChoice[] {
  const o = getOrderOptionsForCategory(categoryId, itemName);
  if (o.requiredChoices?.length) return o.requiredChoices;
  if (o.requiredChoice) return [o.requiredChoice];
  return [];
}

/** Sum of price deltas from selected required picks (e.g. Fajitas "Mixed" = +$2). */
export function getChoicesPriceDelta(
  categoryId: string | undefined,
  itemName: string | undefined,
  choices: Record<string, string> | undefined
): number {
  if (!categoryId || !choices) return 0;
  let delta = 0;
  for (const rc of getRequiredChoicesForCategory(categoryId, itemName)) {
    const v = choices[rc.id];
    if (v) delta += getOptionPriceDelta(rc, v);
  }
  return delta;
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
  taquitos: {
    removeIngredients: ["Cilantro", "Onions"],
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
    requiredChoice: {
      id: "sauce",
      label: "Sauce",
      prompt: "Choose sauce (required)",
      options: ["Red sauce", "Green sauce"],
    },
  },
  nachos: {
    removeIngredients: ["Black beans", "Cheese", "Pico de gallo", "Sour cream", "Guacamole"],
    addExtras: EXTRAS_2,
  },
  sides: {
    removeIngredients: [],
    addExtras: [],
  },
  enchiladas: {
    removeIngredients: ["Lettuce", "Sour cream", "Rice & beans"],
    addExtras: EXTRAS_2,
    requiredChoices: [
      {
        id: "sauce",
        label: "Sauce",
        prompt: "Choose sauce (required)",
        options: ["Red sauce", "Green sauce"],
      },
      {
        id: "tortilla",
        label: "Tortilla",
        prompt: "Choose tortilla (required)",
        options: ["Corn tortillas", "Flour tortillas"],
      },
    ],
  },
  specials: {
    removeIngredients: [],
    addExtras: [],
    itemOverrides: {
      "Carne Asada": {
        removeIngredients: ["Grilled Jalapenos", "Grilled Onions"],
      },
      Fajitas: {
        removeIngredients: ["Grilled Peppers", "Grilled Onions"],
        requiredChoice: {
          id: "protein",
          label: "Protein",
          prompt: "Choose protein (required)",
          options: ["Chicken", "Steak", "Shrimp", "Mixed"],
          optionPriceDelta: { Mixed: 2 },
        },
      },
    },
  },
};

/** Per-category customization options for the order modal (item override applied when given). */
export function getOrderOptionsForCategory(
  categoryId: string,
  itemName?: string
): CategoryOrderOptions {
  const base = categoryOrderOptions[categoryId] ?? {
    removeIngredients: [],
    addExtras: EXTRAS_2,
  };
  const override = itemName ? base.itemOverrides?.[itemName] : undefined;
  if (!override) return base;
  return {
    removeIngredients: override.removeIngredients ?? base.removeIngredients,
    addExtras: override.addExtras ?? base.addExtras,
    requiredChoice: override.requiredChoice ?? base.requiredChoice,
    requiredChoices: override.requiredChoices ?? base.requiredChoices,
  };
}

/** Line item note for cart / tickets (e.g. "Hard shell · Sauce: Red sauce"). */
export function formatChoicesLine(
  categoryId: string | undefined,
  choices: Record<string, string> | undefined,
  itemName?: string
): string {
  if (!choices || Object.keys(choices).length === 0) return "";
  const list = categoryId
    ? getRequiredChoicesForCategory(categoryId, itemName)
    : [];
  if (list.length > 0) {
    const parts = list
      .map((rc) => {
        const v = choices[rc.id];
        if (!v) return "";
        if (rc.id === "shell") return v;
        return `${rc.label}: ${v}`;
      })
      .filter(Boolean);
    return parts.join(" · ");
  }
  return Object.entries(choices)
    .map(([k, v]) => `${k}: ${v}`)
    .join(" · ");
}
