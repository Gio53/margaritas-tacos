// ============================================================
// Test order page — passcode "test2022", build a custom test order
// Shows in Order Management, triggers alarm (Spacebar to silence), prints on Clover
// ============================================================

import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useOrders } from "@/contexts/OrdersContext";
import { toast } from "sonner";
import { menuCategories } from "@/data/menuData";
import type { MenuItem } from "@/data/menuData";
import {
  getOrderOptionsForCategory,
  getRequiredChoicesForCategory,
  formatChoicesLine,
} from "@/data/orderOptions";
import type { OrderExtra } from "@/data/orderOptions";
import { computeLineTotal } from "@/contexts/CartContext";
import { formatQuantityLabel } from "@/lib/utils";
import { Plus, Minus, Trash2 } from "lucide-react";

const PASSCODE = "test2022";
const SESSION_KEY = "margaritas_test_order";
const DEFAULT_PICKUP = "4549 Austin Blvd, Island Park, NY";
const ESPRESSO = "#2C1810";
const GOLD = "#E8A838";
const BEIGE_BG = "#FFF8F0";

interface TestOrderLine {
  categoryId: string;
  categoryName: string;
  itemName: string;
  basePrice: number;
  quantity: number;
  removeIngredients: string[];
  addExtras: OrderExtra[];
  lineTotal: number;
  choices?: Record<string, string>;
}

export default function TestOrder() {
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem(SESSION_KEY) === "true");
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const [adding, setAdding] = useState(false);
  const { addOrder, useApi } = useOrders();

  const [lines, setLines] = useState<TestOrderLine[]>([]);
  const [customerFirstName, setCustomerFirstName] = useState("Test");
  const [customerLastName, setCustomerLastName] = useState("Order");
  const [customerEmail, setCustomerEmail] = useState("test@example.com");
  const [customerPhone, setCustomerPhone] = useState("555-000-0000");
  const [pickupAddress, setPickupAddress] = useState(DEFAULT_PICKUP);

  const [addCategoryId, setAddCategoryId] = useState("");
  const [addItem, setAddItem] = useState<MenuItem | null>(null);
  const [addQty, setAddQty] = useState(1);
  const [addRemove, setAddRemove] = useState<string[]>([]);
  const [addExtras, setAddExtras] = useState<OrderExtra[]>([]);
  const [addChoiceValues, setAddChoiceValues] = useState<Record<string, string>>({});

  const selectedCategory = useMemo(
    () => menuCategories.find((c) => c.id === addCategoryId) ?? null,
    [addCategoryId]
  );
  const options = getOrderOptionsForCategory(addCategoryId);
  const requiredForAdd = useMemo(
    () => getRequiredChoicesForCategory(addCategoryId),
    [addCategoryId]
  );

  const toggleRemove = (name: string) => {
    setAddRemove((prev) =>
      prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name]
    );
  };

  const getExtraQty = (name: string) =>
    addExtras.find((e) => e.name === name)?.quantity ?? 0;
  const setExtraQty = (extra: OrderExtra, qty: number) => {
    setAddExtras((prev) => {
      if (qty < 1) return prev.filter((e) => e.name !== extra.name);
      const next = prev.filter((e) => e.name !== extra.name);
      next.push({ ...extra, quantity: qty });
      return next;
    });
  };

  const lineTotalForAdd = useMemo(() => {
    if (!addItem || !addCategoryId) return 0;
    return computeLineTotal(addItem.price, addQty, addExtras, addCategoryId);
  }, [addItem, addCategoryId, addQty, addExtras]);

  const addLine = () => {
    if (!selectedCategory || !addItem) return;
    const missing = requiredForAdd.find((rc) => !addChoiceValues[rc.id]?.trim());
    if (missing) {
      toast.error(missing.prompt);
      return;
    }
    const lineTotal = computeLineTotal(
      addItem.price,
      addQty,
      addExtras,
      addCategoryId
    );
    const choices: Record<string, string> = {};
    for (const rc of requiredForAdd) {
      const v = addChoiceValues[rc.id];
      if (v?.trim()) choices[rc.id] = v;
    }
    const choicesPayload =
      Object.keys(choices).length > 0 ? choices : undefined;
    setLines((prev) => [
      ...prev,
      {
        categoryId: addCategoryId,
        categoryName: selectedCategory.name,
        itemName: addItem.name,
        basePrice: addItem.price,
        quantity: addQty,
        removeIngredients: [...addRemove],
        addExtras: addExtras.map((e) => ({ ...e, quantity: e.quantity ?? 1 })),
        lineTotal,
        ...(choicesPayload && { choices: choicesPayload }),
      },
    ]);
    setAddItem(null);
    setAddQty(1);
    setAddRemove([]);
    setAddExtras([]);
    setAddChoiceValues({});
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const subtotal = useMemo(
    () => lines.reduce((s, l) => s + l.lineTotal, 0),
    [lines]
  );
  const tax = 0;
  const total = subtotal + tax;

  const handleAddTestOrder = async () => {
    if (lines.length === 0) {
      toast.error("Add at least one item to the test order.");
      return;
    }
    setAdding(true);
    try {
      await addOrder({
        customer: {
          firstName: customerFirstName.trim() || "Test",
          lastName: customerLastName.trim() || "Order",
          email: customerEmail.trim() || "test@example.com",
          phone: customerPhone.trim() || "555-000-0000",
        },
        items: lines.map((l) => ({
          categoryId: l.categoryId,
          categoryName: l.categoryName,
          itemName: l.itemName,
          quantity: l.quantity,
          removeIngredients: l.removeIngredients,
          addExtras: l.addExtras,
          lineTotal: l.lineTotal,
          ...(l.choices && Object.keys(l.choices).length > 0 && { choices: l.choices }),
        })),
        subtotal,
        tax,
        total,
        pickupAddress: pickupAddress.trim() || DEFAULT_PICKUP,
        paymentMethod: "cash",
      });
      toast.success(
        "Test order added. Check Order Management — alarm will play; press Spacebar to silence. Receipt should print on Clover."
      );
    } catch (e) {
      toast.error("Failed to add test order");
    } finally {
      setAdding(false);
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() === PASSCODE) {
      sessionStorage.setItem(SESSION_KEY, "true");
      setUnlocked(true);
      setError("");
      setInput("");
    } else {
      setError("Wrong passcode");
    }
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setUnlocked(false);
  };

  if (!unlocked) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ backgroundColor: BEIGE_BG, fontFamily: "'Lato', sans-serif" }}
      >
        <div
          className="w-full max-w-sm rounded-xl border-2 p-6 bg-white"
          style={{ borderColor: ESPRESSO }}
        >
          <h1 className="text-xl font-bold mb-2 text-center" style={{ color: ESPRESSO }}>
            Test order
          </h1>
          <p className="text-sm mb-4 text-center" style={{ color: "#6B7280" }}>
            Enter passcode to build a custom test order.
          </p>
          <form onSubmit={handleUnlock} className="space-y-3">
            <input
              type="password"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                setError("");
              }}
              placeholder="Passcode"
              className="w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "rgba(44,24,16,0.3)" }}
              autoFocus
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              className="w-full py-2 rounded-lg font-semibold text-white"
              style={{ backgroundColor: ESPRESSO }}
            >
              Enter
            </button>
          </form>
          <Link href="/" className="block mt-4 text-center text-sm" style={{ color: GOLD }}>
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen py-8 px-4"
      style={{ backgroundColor: BEIGE_BG, fontFamily: "'Lato', sans-serif" }}
    >
      <div className="max-w-lg mx-auto space-y-6">
        <div className="rounded-xl border-2 p-4 bg-white" style={{ borderColor: ESPRESSO }}>
          <h1 className="text-xl font-bold mb-1" style={{ color: ESPRESSO }}>
            Test order
          </h1>
          <p className="text-sm text-gray-600 mb-4">
            Build a custom test order. It will show in Order Management, trigger the alarm (Spacebar to silence), and print on Clover when configured.
          </p>
          {useApi && (
            <p className="text-xs text-green-600 mb-4">
              Synced with API — order will appear on all devices.
            </p>
          )}

          {/* Customer & pickup */}
          <div className="grid grid-cols-2 gap-3 mb-4 pb-4 border-b border-gray-200">
            <input
              type="text"
              value={customerFirstName}
              onChange={(e) => setCustomerFirstName(e.target.value)}
              placeholder="First name"
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              type="text"
              value={customerLastName}
              onChange={(e) => setCustomerLastName(e.target.value)}
              placeholder="Last name"
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="Email"
              className="col-span-2 rounded-lg border px-3 py-2 text-sm"
            />
            <input
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="Phone"
              className="col-span-2 rounded-lg border px-3 py-2 text-sm"
            />
            <input
              type="text"
              value={pickupAddress}
              onChange={(e) => setPickupAddress(e.target.value)}
              placeholder="Pickup address"
              className="col-span-2 rounded-lg border px-3 py-2 text-sm"
            />
          </div>

          {/* Add item */}
          <div className="space-y-3 mb-4">
            <h2 className="text-sm font-semibold" style={{ color: ESPRESSO }}>
              Add item
            </h2>
            <div className="flex gap-2 flex-wrap">
              <select
                value={addCategoryId}
                onChange={(e) => {
                  setAddCategoryId(e.target.value);
                  setAddItem(null);
                  setAddRemove([]);
                  setAddExtras([]);
                  setAddChoiceValues({});
                }}
                className="rounded-lg border px-3 py-2 text-sm flex-1 min-w-[140px]"
              >
                <option value="">Category</option>
                {menuCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <select
                value={addItem?.name ?? ""}
                onChange={(e) => {
                  const item = selectedCategory?.items.find(
                    (i) => i.name === e.target.value
                  );
                  setAddItem(item ?? null);
                  setAddRemove([]);
                  setAddExtras([]);
                  setAddChoiceValues({});
                }}
                className="rounded-lg border px-3 py-2 text-sm flex-1 min-w-[140px]"
              >
                <option value="">Item</option>
                {selectedCategory?.items.map((i) => (
                  <option key={i.name} value={i.name}>
                    {i.name} — ${i.price.toFixed(2)}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setAddQty((q) => Math.max(1, q - 1))}
                  className="size-8 rounded border flex items-center justify-center"
                >
                  <Minus className="size-4" />
                </button>
                <span className="w-8 text-center text-sm font-medium">{addQty}</span>
                <button
                  type="button"
                  onClick={() => setAddQty((q) => q + 1)}
                  className="size-8 rounded border flex items-center justify-center"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>

            {addItem && (
              <>
                {requiredForAdd.map((rc) => (
                  <div key={rc.id} className="text-sm space-y-1">
                    <p className="font-medium" style={{ color: ESPRESSO }}>
                      {rc.prompt}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {rc.options.map((opt) => (
                        <label key={opt} className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name={`test-${rc.id}`}
                            checked={addChoiceValues[rc.id] === opt}
                            onChange={() =>
                              setAddChoiceValues((prev) => ({
                                ...prev,
                                [rc.id]: opt,
                              }))
                            }
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
                {options.removeIngredients.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {options.removeIngredients.map((name) => (
                      <label
                        key={name}
                        className="flex items-center gap-1.5 text-sm cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={addRemove.includes(name)}
                          onChange={() => toggleRemove(name)}
                          className="rounded"
                        />
                        <span>No {name}</span>
                      </label>
                    ))}
                  </div>
                )}
                {options.addExtras.length > 0 && (
                  <div className="flex flex-wrap gap-2 items-center">
                    {options.addExtras.map((extra) => (
                      <div key={extra.name} className="flex items-center gap-1">
                        <span className="text-sm">{extra.name} (+${extra.price.toFixed(2)}):</span>
                        <button
                          type="button"
                          onClick={() =>
                            setExtraQty(extra, Math.max(0, getExtraQty(extra.name) - 1))
                          }
                          className="size-6 rounded border flex items-center justify-center text-xs"
                        >
                          −
                        </button>
                        <span className="w-5 text-center text-sm">{getExtraQty(extra.name)}</span>
                        <button
                          type="button"
                          onClick={() => setExtraQty(extra, getExtraQty(extra.name) + 1)}
                          className="size-6 rounded border flex items-center justify-center text-xs"
                        >
                          +
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    Line total: ${lineTotalForAdd.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={addLine}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-semibold text-white"
                    style={{ backgroundColor: GOLD }}
                  >
                    <Plus className="size-4" />
                    Add to order
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Line items */}
          {lines.length > 0 && (
            <div className="mb-4">
              <h2 className="text-sm font-semibold mb-2" style={{ color: ESPRESSO }}>
                Your test order
              </h2>
              <ul className="space-y-2">
                {lines.map((line, idx) => (
                  <li
                    key={idx}
                    className="flex items-start justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                  >
                    <div>
                      <span className="font-medium">
                        {line.categoryName} — {line.itemName} × {formatQuantityLabel(line.categoryId, line.quantity)}
                      </span>
                      {formatChoicesLine(line.categoryId, line.choices) && (
                        <p className="text-xs text-gray-600 mt-0.5">
                          {formatChoicesLine(line.categoryId, line.choices)}
                        </p>
                      )}
                      {(line.removeIngredients.length > 0 || line.addExtras.length > 0) && (
                        <p className="text-xs text-gray-600 mt-0.5">
                          {line.removeIngredients.length > 0 && `No: ${line.removeIngredients.join(", ")}`}
                          {line.removeIngredients.length > 0 && line.addExtras.length > 0 && " · "}
                          {line.addExtras.length > 0 &&
                            `Add: ${line.addExtras.map((e) => `${e.name}${(e.quantity ?? 1) > 1 ? ` ×${e.quantity}` : ""}`).join(", ")}`}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-semibold" style={{ color: GOLD }}>
                        ${line.lineTotal.toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="text-red-600 hover:text-red-700 p-1"
                        aria-label="Remove line"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="text-sm font-semibold mt-2 flex justify-between">
                <span>Total</span>
                <span style={{ color: GOLD }}>${total.toFixed(2)}</span>
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleAddTestOrder}
              disabled={adding || lines.length === 0}
              className="w-full py-3 rounded-lg font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: GOLD }}
            >
              {adding ? "Adding…" : "Add test order"}
            </button>
            <button
              type="button"
              onClick={logout}
              className="w-full py-2 rounded-lg font-medium border"
              style={{ borderColor: "rgba(44,24,16,0.3)", color: ESPRESSO }}
            >
              Lock (enter passcode again)
            </button>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <Link href="/admin" style={{ color: GOLD }} className="hover:underline font-semibold">
            Order Management
          </Link>
          <Link href="/" style={{ color: GOLD }} className="hover:underline font-semibold">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
