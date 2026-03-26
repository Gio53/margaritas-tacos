// ============================================================
// Customize item modal — quantity, remove ingredients, add extras, ADD TO CART
// ============================================================

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  getOrderOptionsForCategory,
  getRequiredChoicesForCategory,
  SIDE_CUP_LABEL,
} from "@/data/orderOptions";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { MenuItem } from "@/data/menuData";
import type { OrderExtra } from "@/data/orderOptions";
import { useCart, computeLineTotal } from "@/contexts/CartContext";
import { formatQuantityLabel } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";
import { toast } from "sonner";

const ESPRESSO = "#2C1810";
const GOLD = "#E8A838";
const CREAM = "#FFF8F0";
const MUTED = "rgba(255,248,240,0.6)";

interface CustomizeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoryId: string;
  categoryName: string;
  item: MenuItem;
  /** Called when user adds to cart — e.g. open cart panel or go to checkout */
  onOpenCart?: () => void;
}

export function CustomizeModal({
  open,
  onOpenChange,
  categoryId,
  categoryName,
  item,
  onOpenCart,
}: CustomizeModalProps) {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [removeIngredients, setRemoveIngredients] = useState<string[]>([]);
  const [addExtras, setAddExtras] = useState<OrderExtra[]>([]);
  const [choiceValues, setChoiceValues] = useState<Record<string, string>>({});
  /** When false, required picks show as a one-line summary + "Change" (all choices filled). */
  const [requireExpanded, setRequireExpanded] = useState(true);
  const prevAllFilledRef = useRef(false);

  const options = getOrderOptionsForCategory(categoryId);
  const requiredList = useMemo(
    () => getRequiredChoicesForCategory(categoryId),
    [categoryId]
  );
  const hasRemove = options.removeIngredients.length > 0;
  const hasExtras = options.addExtras.length > 0;
  const allRequiredFilled =
    requiredList.length === 0 ||
    requiredList.every((rc) => Boolean(choiceValues[rc.id]?.trim()));

  const choiceSummary = useMemo(() => {
    if (requiredList.length === 0) return "";
    return requiredList
      .map((rc) => {
        const v = choiceValues[rc.id];
        return v ? `${rc.label}: ${v}` : "";
      })
      .filter(Boolean)
      .join(" · ");
  }, [requiredList, choiceValues]);

  useEffect(() => {
    if (!open) return;
    prevAllFilledRef.current = false;
    setRequireExpanded(true);
  }, [open, categoryId, item.name]);

  useEffect(() => {
    if (requiredList.length === 0) {
      setRequireExpanded(true);
      return;
    }
    if (!allRequiredFilled) {
      setRequireExpanded(true);
      prevAllFilledRef.current = false;
    }
  }, [allRequiredFilled, requiredList.length]);

  useEffect(() => {
    if (requiredList.length === 0) return;
    if (allRequiredFilled && !prevAllFilledRef.current) {
      setRequireExpanded(false);
    }
    prevAllFilledRef.current = allRequiredFilled;
  }, [allRequiredFilled, requiredList.length]);

  const toggleRemove = (name: string) => {
    setRemoveIngredients((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  };

  const getExtraQuantity = (name: string): number => {
    const e = addExtras.find((x) => x.name === name);
    return e?.quantity ?? 0;
  };

  const setExtraQuantity = (extra: OrderExtra, qty: number) => {
    setAddExtras((prev) => {
      if (qty < 1) return prev.filter((e) => e.name !== extra.name);
      const next = prev.filter((e) => e.name !== extra.name);
      next.push({ ...extra, quantity: qty });
      return next;
    });
  };

  const extrasTotal = useMemo(
    () => addExtras.reduce((s, e) => s + e.price * (e.quantity ?? 1), 0),
    [addExtras]
  );
  const lineTotal = computeLineTotal(item.price, quantity, addExtras, categoryId);

  const handleAddToCart = () => {
    if (!allRequiredFilled) {
      const missing = requiredList.find((rc) => !choiceValues[rc.id]?.trim());
      toast.error("Please choose an option", {
        description: missing?.prompt ?? "Complete all required choices.",
      });
      return;
    }
    const extrasWithQty = addExtras.map((e) => ({
      ...e,
      quantity: e.quantity ?? 1,
    }));
    const choicesPayload: Record<string, string> = {};
    for (const rc of requiredList) {
      const v = choiceValues[rc.id];
      if (v?.trim()) choicesPayload[rc.id] = v;
    }
    addItem({
      categoryId,
      categoryName,
      itemName: item.name,
      basePrice: item.price,
      quantity,
      removeIngredients: [...removeIngredients],
      addExtras: extrasWithQty,
      ...(Object.keys(choicesPayload).length > 0 && { choices: choicesPayload }),
    });
    onOpenChange(false);
    setQuantity(1);
    setRemoveIngredients([]);
    setAddExtras([]);
    setChoiceValues({});
    setRequireExpanded(true);
    prevAllFilledRef.current = false;

    toast.success("Item Added", {
      description: "View your cart or continue shopping.",
      action: {
        label: "Checkout",
        onClick: () => onOpenCart?.(),
      },
    });
  };

  const resetState = () => {
    setQuantity(1);
    setRemoveIngredients([]);
    setAddExtras([]);
    setChoiceValues({});
    setRequireExpanded(true);
    prevAllFilledRef.current = false;
  };

  const showRequiredEditors = requiredList.length > 0 && requireExpanded;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) resetState();
      }}
    >
      <DialogContent
        className="max-w-md border-0 p-0 gap-0 overflow-hidden flex flex-col max-h-[90vh] [&_[data-slot=dialog-close]]:text-white [&_[data-slot=dialog-close]]:hover:text-white [&_[data-slot=dialog-close]]:opacity-90"
        style={{ backgroundColor: ESPRESSO }}
      >
        <DialogHeader className="p-4 pb-2 text-left shrink-0">
          <DialogTitle
            className="text-xl font-bold text-white"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            {categoryName}
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-4 space-y-5 overflow-y-auto min-h-0 flex-1">
          {/* Quantity */}
          <div>
            <label
              className="block text-sm font-medium mb-2"
              style={{ color: CREAM }}
            >
              Quantity
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="size-10 rounded-md flex items-center justify-center border transition-colors"
                style={{
                  borderColor: "rgba(255,248,240,0.3)",
                  color: CREAM,
                  backgroundColor: "rgba(255,255,255,0.08)",
                }}
              >
                <Minus className="size-4" />
              </button>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) =>
                    setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))
                  }
                  className="w-16 text-center rounded-md border bg-transparent text-white font-semibold"
                  style={{ borderColor: "rgba(255,248,240,0.3)" }}
                />
                <span className="font-medium text-white">
                  {formatQuantityLabel(categoryId, quantity).replace(/^\d+\s*/, "")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="size-10 rounded-md flex items-center justify-center border transition-colors"
                style={{
                  borderColor: "rgba(255,248,240,0.3)",
                  color: CREAM,
                  backgroundColor: "rgba(255,255,255,0.08)",
                }}
              >
                <Plus className="size-4" />
              </button>
            </div>
          </div>

          {/* Required choices — compact radios; collapse to summary when all chosen */}
          {requiredList.length > 0 && (
            <div>
              {showRequiredEditors ? (
                <div className="space-y-3">
                  {requiredList.map((rc) => (
                    <div key={rc.id}>
                      <h3
                        className="text-sm font-semibold mb-1"
                        style={{ color: CREAM }}
                      >
                        {rc.prompt}
                      </h3>
                      <RadioGroup
                        value={choiceValues[rc.id] ?? ""}
                        onValueChange={(v) =>
                          setChoiceValues((prev) => ({ ...prev, [rc.id]: v }))
                        }
                        className="space-y-1"
                      >
                        {rc.options.map((opt) => (
                          <div
                            key={opt}
                            className="flex items-center gap-2 rounded-md border px-2.5 py-1.5"
                            style={{
                              borderColor: "rgba(255,248,240,0.2)",
                              backgroundColor: "rgba(255,255,255,0.05)",
                            }}
                          >
                            <RadioGroupItem
                              value={opt}
                              id={`${rc.id}-${opt}`}
                              className="border-[rgba(255,248,240,0.5)] text-[#E8A838] shrink-0"
                            />
                            <Label
                              htmlFor={`${rc.id}-${opt}`}
                              className="cursor-pointer flex-1 text-[#FFF8F0] text-sm leading-snug"
                            >
                              {opt}
                            </Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  ))}
                  {allRequiredFilled && (
                    <button
                      type="button"
                      onClick={() => setRequireExpanded(false)}
                      className="text-xs font-semibold uppercase tracking-wide pt-1"
                      style={{ color: GOLD }}
                    >
                      Done
                    </button>
                  )}
                </div>
              ) : (
                <div
                  className="rounded-md border px-3 py-2 flex flex-col gap-1.5"
                  style={{
                    borderColor: "rgba(255,248,240,0.2)",
                    backgroundColor: "rgba(255,255,255,0.05)",
                  }}
                >
                  <p className="text-sm" style={{ color: CREAM }}>
                    {choiceSummary}
                  </p>
                  <button
                    type="button"
                    onClick={() => setRequireExpanded(true)}
                    className="text-xs font-semibold self-start uppercase tracking-wide"
                    style={{ color: GOLD }}
                  >
                    Change
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Remove Ingredients (Optional) */}
          {hasRemove && (
            <div>
              <h3
                className="text-sm font-semibold mb-2"
                style={{ color: CREAM }}
              >
                Remove Ingredients (Optional)
              </h3>
              <div className="space-y-2">
                {options.removeIngredients.map((name) => (
                  <label
                    key={name}
                    className="flex items-center gap-3 rounded-md border px-3 py-2 cursor-pointer transition-colors"
                    style={{
                      borderColor: "rgba(255,248,240,0.2)",
                      backgroundColor: "rgba(255,255,255,0.05)",
                      color: CREAM,
                    }}
                  >
                    <Checkbox
                      checked={removeIngredients.includes(name)}
                      onCheckedChange={() => toggleRemove(name)}
                      className="border-[rgba(255,248,240,0.4)] data-[state=checked]:bg-[#E8A838] data-[state=checked]:border-[#E8A838]"
                    />
                    <span>{name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Add Extras on the Side (4oz cup each) */}
          {hasExtras && (
            <div>
              <h3
                className="text-sm font-semibold mb-2"
                style={{ color: CREAM }}
              >
                Add Extras on the Side ({SIDE_CUP_LABEL} each)
              </h3>
              <div className="space-y-2">
                {options.addExtras.map((extra) => {
                  const qty = getExtraQuantity(extra.name);
                  return (
                    <div
                      key={extra.name}
                      className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                      style={{
                        borderColor: "rgba(255,248,240,0.2)",
                        backgroundColor: "rgba(255,255,255,0.05)",
                        color: CREAM,
                      }}
                    >
                      <span>
                        {extra.name} ({SIDE_CUP_LABEL}) +${extra.price.toFixed(2)} each
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setExtraQuantity(extra, Math.max(0, qty - 1))}
                          className="size-8 rounded flex items-center justify-center border transition-colors disabled:opacity-40"
                          style={{
                            borderColor: "rgba(255,248,240,0.3)",
                            color: CREAM,
                            backgroundColor: "rgba(255,255,255,0.08)",
                          }}
                        >
                          <Minus className="size-4" />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setExtraQuantity(extra, qty + 1)}
                          className="size-8 rounded flex items-center justify-center border transition-colors"
                          style={{
                            borderColor: "rgba(255,248,240,0.3)",
                            color: CREAM,
                            backgroundColor: "rgba(255,255,255,0.08)",
                          }}
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Price summary */}
          <div
            className="space-y-1 pt-2 border-t"
            style={{ borderColor: "rgba(255,248,240,0.15)" }}
          >
            <div className="flex justify-between text-sm" style={{ color: MUTED }}>
              <span>Base Price</span>
              <span>${item.price.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-semibold" style={{ color: CREAM }}>
              <span>{quantity} x Total</span>
              <span>${lineTotal.toFixed(2)}</span>
            </div>
          </div>

          <Button
            onClick={handleAddToCart}
            disabled={!allRequiredFilled}
            className="w-full font-bold uppercase tracking-wider text-white border-0 shrink-0 disabled:opacity-50"
            style={{
              backgroundColor: GOLD,
              fontFamily: "'Oswald', sans-serif",
              fontSize: "1rem",
            }}
          >
            Add to cart
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
