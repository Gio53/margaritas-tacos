// ============================================================
// Shared order-line helpers (cart, Clover, admin, kitchen ticket)
// ============================================================

/** American + Mexican street taco categories use "order(s)"; everything else uses "Nx". */
export function isTacoOrderCategory(
  categoryId?: string,
  categoryName?: string
): boolean {
  const id = (categoryId ?? "").toLowerCase();
  if (id === "mexican-street-tacos" || id === "3-american-tacos") return true;
  const name = (categoryName ?? "").toLowerCase();
  return (
    name.includes("mexican street taco") ||
    name.includes("american taco")
  );
}

/** Quantity label: tacos → "1 order" / "N orders"; other items → "1x" / "Nx". */
export function formatOrderQuantityLabel(
  categoryId: string | undefined,
  quantity: number,
  categoryName?: string
): string {
  const qty = Math.max(1, Math.floor(Number(quantity)) || 1);
  if (isTacoOrderCategory(categoryId, categoryName)) {
    return qty === 1 ? "1 order" : `${qty} orders`;
  }
  return `${qty}x`;
}

export interface MergeableOrderLine {
  categoryId?: string;
  categoryName?: string;
  itemName?: string;
  quantity?: number;
  removeIngredients?: string[];
  addExtras?: Array<{ name?: string; quantity?: number; price?: number }>;
  choices?: Record<string, string>;
  lineTotal?: number;
}

function normalizeRemoves(removes: string[] | undefined): string {
  return [...(removes ?? [])]
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .sort()
    .join("|");
}

function normalizeExtras(
  extras: MergeableOrderLine["addExtras"]
): string {
  return [...(extras ?? [])]
    .map((e) => {
      const name = String(e.name ?? "")
        .trim()
        .toLowerCase();
      const qty = e.quantity ?? 1;
      return `${name}:${qty}`;
    })
    .filter((s) => !s.startsWith(":"))
    .sort()
    .join("|");
}

function normalizeChoices(choices: Record<string, string> | undefined): string {
  if (!choices || typeof choices !== "object") return "";
  return Object.entries(choices)
    .map(([k, v]) => `${k.trim().toLowerCase()}=${String(v).trim().toLowerCase()}`)
    .sort()
    .join("|");
}

/** Identity for merge: same item + same modifiers/choices/extras (exact). */
export function orderLineIdentityKey(line: MergeableOrderLine): string {
  return [
    (line.categoryId ?? "").trim().toLowerCase(),
    (line.itemName ?? "").trim().toLowerCase(),
    normalizeRemoves(line.removeIngredients),
    normalizeExtras(line.addExtras),
    normalizeChoices(line.choices),
  ].join("::");
}

function mergeExtras(
  a: MergeableOrderLine["addExtras"],
  b: MergeableOrderLine["addExtras"]
): NonNullable<MergeableOrderLine["addExtras"]> {
  const map = new Map<
    string,
    { name?: string; quantity?: number; price?: number }
  >();
  for (const e of [...(a ?? []), ...(b ?? [])]) {
    const name = String(e.name ?? "").trim();
    if (!name) continue;
    const key = name.toLowerCase();
    const prev = map.get(key);
    if (!prev) {
      map.set(key, { ...e, name, quantity: e.quantity ?? 1 });
    } else {
      map.set(key, {
        ...prev,
        quantity: (prev.quantity ?? 1) + (e.quantity ?? 1),
        price: prev.price ?? e.price,
      });
    }
  }
  return Array.from(map.values());
}

/**
 * Combine identical lines (same item + same mods). Different shell/No/Add/choices stay separate.
 * Sums quantity, lineTotal, and matching extras quantities.
 */
export function mergeIdenticalOrderLines<T extends MergeableOrderLine>(
  lines: T[]
): T[] {
  if (!Array.isArray(lines) || lines.length <= 1) return lines ?? [];

  const map = new Map<string, T>();
  const order: string[] = [];

  for (const line of lines) {
    const key = orderLineIdentityKey(line);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, { ...line });
      order.push(key);
      continue;
    }
    const qty =
      Math.max(1, existing.quantity ?? 1) + Math.max(1, line.quantity ?? 1);
    const lineTotal = (existing.lineTotal ?? 0) + (line.lineTotal ?? 0);
    map.set(key, {
      ...existing,
      quantity: qty,
      lineTotal,
      addExtras: mergeExtras(existing.addExtras, line.addExtras) as T["addExtras"],
    });
  }

  return order.map((k) => map.get(k)!);
}
