// ============================================================
// Clover printed receipt — name + note layout (shared: server + preview UI)
// Order: quantity line, item name (in `name` with newline), then note:
// required choices (e.g. shell), No:, Add:
// ============================================================

export interface CloverReceiptLineInput {
  categoryId?: string;
  categoryName?: string;
  itemName?: string;
  quantity?: number;
  removeIngredients?: string[];
  addExtras?: Array<{ name?: string; quantity?: number }>;
  choices?: Record<string, string>;
}

export function isOrderOfThreePlatter(categoryName: string | undefined): boolean {
  return (
    categoryName === "3 Mexican Street Tacos" || categoryName === "3 American Tacos"
  );
}

/** Line items that print quantity as "1 order" / "N orders" (not "Qty: N") on Clover and kitchen tickets. */
export function usesOrderQuantityWording(
  categoryId: string | undefined,
  categoryName: string | undefined
): boolean {
  const id = (categoryId ?? "").trim();
  const name = (categoryName ?? "").trim();
  if (isOrderOfThreePlatter(name)) return true;
  if (id === "mexican-street-tacos" || id === "3-american-tacos") return true;
  if (id === "tostadas" || name === "Tostadas") return true;
  if (id === "enchiladas" || name === "Enchiladas") return true;
  return false;
}

/** Choices/required options as printed under the item (before No / Add). */
export function orderItemChoicesNote(
  categoryId: string | undefined,
  choices: Record<string, string> | undefined
): string {
  if (!choices || typeof choices !== "object") return "";
  if (categoryId === "3-american-tacos") {
    const shell = choices.shell;
    return shell ? `Shell: ${shell}` : "";
  }
  if (categoryId === "enchiladas") {
    const parts: string[] = [];
    if (choices.sauce) parts.push(`Sauce: ${choices.sauce}`);
    if (choices.tortilla) parts.push(`Tortilla: ${choices.tortilla}`);
    return parts.join("\n\n");
  }
  if (categoryId === "chilaquiles") {
    const s = choices.sauce;
    return s ? `Sauce: ${s}` : "";
  }
  return Object.entries(choices)
    .map(([k, v]) => `${k}: ${v}`)
    .join("; ");
}

/**
 * `name` — line 1: order/qty count; line 2: category — item
 * `note` — optional choices, then No:, then Add: (blank lines between blocks)
 */
export function buildCloverLineNameAndNote(line: CloverReceiptLineInput): {
  name: string;
  lineNote: string | undefined;
} {
  const qty = Math.max(1, line.quantity ?? 1);
  const baseName =
    [line.categoryName, line.itemName].filter(Boolean).join(" — ") ||
    line.itemName ||
    "Item";

  const choiceStr = orderItemChoicesNote(line.categoryId, line.choices);

  const noStr =
    line.removeIngredients?.length && line.removeIngredients.length > 0
      ? `No: ${line.removeIngredients.join(", ")}`
      : "";

  let addStr = "";
  if (line.addExtras?.length) {
    const parts = line.addExtras.map((e) => {
      const exQty = e.quantity ?? 1;
      const exName = String(e.name ?? "").trim() || "extra";
      return `Side of ${exName} ×${exQty}`;
    });
    addStr = `Add: ${parts.join(", ")}`;
  }

  const orderWording = usesOrderQuantityWording(line.categoryId, line.categoryName);
  const qtyLine = orderWording
    ? qty === 1
      ? "1 order"
      : `${qty} orders`
    : `Qty: ${qty}`;

  const name = `${qtyLine}\n${baseName}`;

  const noteParts: string[] = [];
  if (choiceStr) noteParts.push(choiceStr);
  if (noStr) noteParts.push(noStr);
  if (addStr) noteParts.push(addStr);
  const lineNote = noteParts.length > 0 ? noteParts.join("\n\n") : undefined;

  return { name, lineNote };
}
