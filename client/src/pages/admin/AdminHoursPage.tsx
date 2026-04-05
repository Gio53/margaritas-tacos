import { useState, useEffect, useMemo } from "react";
import {
  defaultRestaurantHoursConfig,
  formatHourForLabel,
  dayName,
  type DayNum,
  type RestaurantHoursConfig,
} from "@shared/restaurantHours";
import { useRestaurantHours } from "@/contexts/RestaurantHoursContext";
import { toast } from "sonner";
import { ESPRESSO, GOLD, API_BASE } from "./adminTheme";

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export default function AdminHoursPage() {
  const { config: serverConfig, refetch } = useRestaurantHours();
  const [draft, setDraft] = useState<RestaurantHoursConfig>(() => defaultRestaurantHoursConfig());
  const [saving, setSaving] = useState(false);
  const [newDate, setNewDate] = useState("");

  useEffect(() => {
    setDraft({
      weekly: { ...serverConfig.weekly },
      closedDates: [...serverConfig.closedDates],
      closedMessageCustom: serverConfig.closedMessageCustom,
    });
  }, [serverConfig]);

  const summary = useMemo(() => {
    const c = draft;
    const lines: string[] = [];
    for (let d = 0; d <= 6; d++) {
      const h = c.weekly[String(d)];
      lines.push(
        `${dayName(d as DayNum)}: ${h ? `${formatHourForLabel(h.open)} – ${formatHourForLabel(h.close)}` : "Closed"}`
      );
    }
    return lines;
  }, [draft]);

  const setDayClosed = (day: number, closed: boolean) => {
    const k = String(day);
    setDraft((prev) => ({
      ...prev,
      weekly: { ...prev.weekly, [k]: closed ? null : prev.weekly[k] ?? { open: 14, close: 21 } },
    }));
  };

  const setDayHours = (day: number, field: "open" | "close", value: number) => {
    const k = String(day);
    setDraft((prev) => {
      const cur = prev.weekly[k];
      if (!cur) return prev;
      return {
        ...prev,
        weekly: { ...prev.weekly, [k]: { ...cur, [field]: value } },
      };
    });
  };

  const addClosedDate = () => {
    const d = newDate.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
      toast.error("Pick a date from the calendar.");
      return;
    }
    if (draft.closedDates.includes(d)) return;
    setDraft((prev) => ({
      ...prev,
      closedDates: [...prev.closedDates, d].sort(),
    }));
    setNewDate("");
  };

  const removeClosedDate = (d: string) => {
    setDraft((prev) => ({
      ...prev,
      closedDates: prev.closedDates.filter((x) => x !== d),
    }));
  };

  const save = async () => {
    if (!API_BASE) {
      toast.error("Set VITE_ORDERS_API_URL and run the API server to save hours.");
      return;
    }
    for (let d = 0; d <= 6; d++) {
      const h = draft.weekly[String(d)];
      if (h && h.open >= h.close) {
        toast.error(`${dayName(d as DayNum)}: open time must be before close time.`);
        return;
      }
    }
    setSaving(true);
    try {
      const base = API_BASE.replace(/\/$/, "");
      const res = await fetch(`${base}/api/restaurant-hours`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(err.error ?? "Save failed");
        return;
      }
      await refetch();
      toast.success("Hours saved. Online ordering uses these times (Eastern).");
    } catch (e) {
      toast.error(String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6 max-w-3xl mx-auto w-full space-y-6">
      <section
        className="rounded-xl border-2 p-4 bg-white"
        style={{ borderColor: "rgba(44,24,16,0.15)" }}
      >
        <h2 className="text-lg font-bold mb-1" style={{ color: ESPRESSO }}>
          Hours & closures
        </h2>
        <p className="text-sm mb-4" style={{ color: "#6B7280" }}>
          Set weekly hours and extra closed days (holidays, events). All times are{" "}
          <strong>Eastern (America/New_York)</strong>, matching your ordering page.
        </p>
        {!API_BASE && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
            Connect <code className="text-xs bg-white/80 px-1 rounded">VITE_ORDERS_API_URL</code> and run
            the server to save changes. Until then, the site uses default hours from the code.
          </p>
        )}

        <div className="space-y-3 mb-6">
          {( [0, 1, 2, 3, 4, 5, 6] as const ).map((d) => {
            const k = String(d);
            const h = draft.weekly[k];
            return (
              <div
                key={d}
                className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 rounded-lg border px-3 py-2"
                style={{ borderColor: "rgba(44,24,16,0.12)" }}
              >
                <label className="flex items-center gap-2 min-w-[140px] text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={h === null}
                    onChange={(e) => setDayClosed(d, e.target.checked)}
                  />
                  <span style={{ color: ESPRESSO }}>{dayName(d)}</span>
                </label>
                {h ? (
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-gray-600">Open</span>
                    <select
                      value={h.open}
                      onChange={(e) => setDayHours(d, "open", Number(e.target.value))}
                      className="rounded-lg border px-2 py-1"
                    >
                      {HOURS.map((hr) => (
                        <option key={hr} value={hr}>
                          {formatHourForLabel(hr)}
                        </option>
                      ))}
                    </select>
                    <span className="text-gray-600">Close</span>
                    <select
                      value={h.close}
                      onChange={(e) => setDayHours(d, "close", Number(e.target.value))}
                      className="rounded-lg border px-2 py-1"
                    >
                      {HOURS.map((hr) => (
                        <option key={hr} value={hr}>
                          {formatHourForLabel(hr)}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="text-sm text-gray-500">Closed all day</span>
                )}
              </div>
            );
          })}
        </div>

        <h3 className="text-sm font-bold mb-2" style={{ color: ESPRESSO }}>
          Closed on specific dates
        </h3>
        <p className="text-xs text-gray-600 mb-2">
          Add holidays or one-off closures (calendar day in Eastern time).
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          <input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="rounded-lg border px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={addClosedDate}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-white"
            style={{ backgroundColor: GOLD }}
          >
            Add date
          </button>
        </div>
        {draft.closedDates.length > 0 ? (
          <ul className="flex flex-wrap gap-2 mb-6">
            {draft.closedDates.map((d) => (
              <li
                key={d}
                className="flex items-center gap-1 px-2 py-1 rounded-full text-sm border"
                style={{ borderColor: "rgba(44,24,16,0.2)" }}
              >
                <span>{d}</span>
                <button
                  type="button"
                  onClick={() => removeClosedDate(d)}
                  className="text-red-600 font-bold px-1"
                  aria-label={`Remove ${d}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500 mb-6">No extra closed dates.</p>
        )}

        <h3 className="text-sm font-bold mb-2" style={{ color: ESPRESSO }}>
          Custom closed message (optional)
        </h3>
        <p className="text-xs text-gray-600 mb-2">
          If set, customers see this whenever ordering is closed (instead of the auto summary).
        </p>
        <textarea
          value={draft.closedMessageCustom ?? ""}
          onChange={(e) =>
            setDraft((prev) => ({
              ...prev,
              closedMessageCustom: e.target.value.length > 0 ? e.target.value : null,
            }))
          }
          placeholder="e.g. Closed for Labor Day — back Tuesday!"
          rows={3}
          className="w-full rounded-lg border px-3 py-2 text-sm mb-4"
        />

        <button
          type="button"
          disabled={saving || !API_BASE}
          onClick={() => void save()}
          className="px-6 py-3 rounded-lg font-semibold text-white disabled:opacity-50"
          style={{ backgroundColor: ESPRESSO }}
        >
          {saving ? "Saving…" : "Save hours"}
        </button>
      </section>

      <section className="rounded-xl border p-4 bg-white/80 text-sm" style={{ borderColor: "rgba(44,24,16,0.12)" }}>
        <p className="font-semibold mb-2" style={{ color: ESPRESSO }}>
          Preview (what customers see when closed)
        </p>
        <ul className="text-gray-700 space-y-1 font-mono text-xs">
          {summary.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
