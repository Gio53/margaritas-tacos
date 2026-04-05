import { useState, useMemo, useCallback } from "react";
import { menuCategories } from "@/data/menuData";
import { useMenuAvailability } from "@/contexts/MenuAvailabilityContext";
import { toast } from "sonner";
import { ESPRESSO, READY_COLOR, API_BASE } from "./adminTheme";

function formatAvailableAgain(ts: number) {
  return new Date(ts).toLocaleString([], { dateStyle: "short", timeStyle: "short" });
}

export default function AdminAvailabilityPage() {
  const {
    refetch: refetchAvailability,
    unavailableUntil: getUnavailableUntil,
    loading: availabilityLoading,
    error: availabilityError,
  } = useMenuAvailability();

  const [availFilter, setAvailFilter] = useState("");
  const [availSavingKey, setAvailSavingKey] = useState<string | null>(null);

  const menuRows = useMemo(
    () =>
      menuCategories.flatMap((c) =>
        c.items.map((item) => ({
          categoryId: c.id,
          categoryName: c.name,
          itemName: item.name,
        }))
      ),
    []
  );

  const filteredMenuRows = useMemo(() => {
    const q = availFilter.trim().toLowerCase();
    if (!q) return menuRows;
    return menuRows.filter(
      (r) =>
        r.categoryName.toLowerCase().includes(q) || r.itemName.toLowerCase().includes(q)
    );
  }, [menuRows, availFilter]);

  const postAvailability = useCallback(
    async (
      categoryId: string,
      itemName: string,
      body: { action: "set"; durationMinutes: 240 | 1440 } | { action: "clear" }
    ) => {
      if (!API_BASE) return;
      const key = `${categoryId}\t${itemName}`;
      setAvailSavingKey(key);
      try {
        const base = API_BASE.replace(/\/$/, "");
        const res = await fetch(`${base}/api/menu-availability`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categoryId, itemName, ...body }),
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { error?: string };
          console.error("menu-availability", err);
          toast.error(err.error ?? `Could not update availability (${res.status})`);
          return;
        }
        await refetchAvailability();
        toast.success("Availability updated");
      } finally {
        setAvailSavingKey(null);
      }
    },
    [refetchAvailability]
  );

  return (
    <div className="flex-1 p-4 md:p-6 max-w-3xl mx-auto w-full">
      <section
        className="rounded-xl border-2 p-4 bg-white"
        style={{ borderColor: "rgba(44,24,16,0.15)" }}
      >
        <h2 className="text-lg font-bold mb-1" style={{ color: ESPRESSO }}>
          Menu item availability
        </h2>
        <p className="text-sm mb-3" style={{ color: "#6B7280" }}>
          Mark items temporarily out of stock (4 hours or 1 day). Customers will not be able to add them on the order page until the time passes.
        </p>
        {!API_BASE && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Set <code className="text-xs bg-white/80 px-1 rounded">VITE_ORDERS_API_URL</code> in your
            frontend env and run the orders server so availability can be saved and synced.
          </p>
        )}
        {API_BASE && availabilityError && (
          <p className="text-sm text-red-600 mb-2">Could not load availability: {availabilityError}</p>
        )}
        {API_BASE && (
          <>
            <input
              type="search"
              value={availFilter}
              onChange={(e) => setAvailFilter(e.target.value)}
              placeholder="Search category or item…"
              className="w-full rounded-lg border px-3 py-2 text-sm mb-3"
              style={{ borderColor: "rgba(44,24,16,0.25)" }}
            />
            {availabilityLoading && (
              <p className="text-xs mb-2" style={{ color: "#6B7280" }}>
                Updating availability…
              </p>
            )}
            <ul className="space-y-2 max-h-[min(70vh,560px)] overflow-y-auto pr-1">
              {filteredMenuRows.map((row) => {
                const until = getUnavailableUntil(row.categoryId, row.itemName);
                const busy = availSavingKey === `${row.categoryId}\t${row.itemName}`;
                return (
                  <li
                    key={`${row.categoryId}-${row.itemName}`}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-lg border px-3 py-2 text-sm"
                    style={{ borderColor: "rgba(44,24,16,0.12)" }}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold truncate" style={{ color: ESPRESSO }}>
                        {row.categoryName}
                      </p>
                      <p className="text-gray-700 truncate">{row.itemName}</p>
                      {until != null ? (
                        <p className="text-xs text-red-700 mt-0.5">
                          Unavailable until {formatAvailableAgain(until)}
                        </p>
                      ) : (
                        <p className="text-xs text-green-700 mt-0.5">Available</p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 shrink-0">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void postAvailability(row.categoryId, row.itemName, {
                            action: "set",
                            durationMinutes: 240,
                          })
                        }
                        className="px-2.5 py-1 rounded-md text-xs font-semibold border border-amber-600 text-amber-800 hover:bg-amber-50 disabled:opacity-50"
                      >
                        4 hours
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void postAvailability(row.categoryId, row.itemName, {
                            action: "set",
                            durationMinutes: 1440,
                          })
                        }
                        className="px-2.5 py-1 rounded-md text-xs font-semibold border border-amber-600 text-amber-800 hover:bg-amber-50 disabled:opacity-50"
                      >
                        1 day
                      </button>
                      <button
                        type="button"
                        disabled={busy || until == null}
                        onClick={() =>
                          void postAvailability(row.categoryId, row.itemName, { action: "clear" })
                        }
                        className="px-2.5 py-1 rounded-md text-xs font-semibold border text-white disabled:opacity-40"
                        style={{
                          backgroundColor: READY_COLOR,
                          borderColor: READY_COLOR,
                        }}
                      >
                        Available now
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
