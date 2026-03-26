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

  const platter = isOrderOfThreePlatter(line.categoryName);
  const qtyLine = platter
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
