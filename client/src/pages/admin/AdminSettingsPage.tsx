// ============================================================
// Admin — Settings (auto Mark Ready delay, etc.)
// ============================================================

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { API_BASE, ESPRESSO, GOLD } from "./adminTheme";

const DEFAULT_MINUTES = 25;
const MIN_MINUTES = 1;
const MAX_MINUTES = 180;

interface AdminSettings {
  autoReadyMinutes: number;
}

export default function AdminSettingsPage() {
  const [minutes, setMinutes] = useState(String(DEFAULT_MINUTES));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!API_BASE) {
        setLoading(false);
        return;
      }
      try {
        const base = API_BASE.replace(/\/$/, "");
        const res = await fetch(`${base}/api/admin-settings`);
        if (!res.ok) throw new Error("Failed to load settings");
        const data = (await res.json()) as AdminSettings;
        if (!cancelled && typeof data.autoReadyMinutes === "number") {
          setMinutes(String(data.autoReadyMinutes));
        }
      } catch (e) {
        if (!cancelled) toast.error(String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async () => {
    if (!API_BASE) {
      toast.error("Set VITE_ORDERS_API_URL and run the API server to save settings.");
      return;
    }
    const n = Math.floor(Number(minutes));
    if (!Number.isFinite(n) || n < MIN_MINUTES || n > MAX_MINUTES) {
      toast.error(`Enter a whole number from ${MIN_MINUTES} to ${MAX_MINUTES}.`);
      return;
    }
    setSaving(true);
    try {
      const base = API_BASE.replace(/\/$/, "");
      const res = await fetch(`${base}/api/admin-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoReadyMinutes: n }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(err.error ?? "Save failed");
        return;
      }
      const saved = (await res.json()) as AdminSettings;
      setMinutes(String(saved.autoReadyMinutes));
      toast.success(`Saved. Orders auto Mark Ready after ${saved.autoReadyMinutes} minutes.`);
    } catch (e) {
      toast.error(String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6 max-w-xl mx-auto w-full space-y-6">
      <section
        className="rounded-xl border-2 p-4 bg-white"
        style={{ borderColor: "rgba(44,24,16,0.15)" }}
      >
        <h2
          className="text-lg font-bold uppercase tracking-wide mb-1"
          style={{ color: ESPRESSO, fontFamily: "'Oswald', sans-serif" }}
        >
          Auto Mark Ready
        </h2>
        <p className="text-sm mb-4" style={{ color: "#6B7280" }}>
          After this many minutes, pending orders are automatically marked ready and the customer
          gets the “order is ready” text/email. You can still press Mark ready earlier anytime.
        </p>

        {loading ? (
          <p className="text-sm" style={{ color: "#6B7280" }}>
            Loading…
          </p>
        ) : (
          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold" style={{ color: ESPRESSO }}>
                Minutes after order placed
              </span>
              <input
                type="number"
                min={MIN_MINUTES}
                max={MAX_MINUTES}
                step={1}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="mt-1 w-full max-w-[10rem] rounded-lg border px-3 py-2"
                style={{ borderColor: "rgba(44,24,16,0.3)" }}
              />
              <span className="block mt-1 text-xs" style={{ color: "#9CA3AF" }}>
                Allowed: {MIN_MINUTES}–{MAX_MINUTES}. Default: {DEFAULT_MINUTES}.
              </span>
            </label>

            <button
              type="button"
              onClick={() => void save()}
              disabled={saving || !API_BASE}
              className="px-4 py-2 rounded-lg font-semibold text-white disabled:opacity-50"
              style={{ backgroundColor: ESPRESSO }}
            >
              {saving ? "Saving…" : "Save settings"}
            </button>

            {!API_BASE && (
              <p className="text-sm" style={{ color: "#DC2626" }}>
                Orders API URL is not set, so settings cannot be saved on this device.
              </p>
            )}
          </div>
        )}
      </section>

      <p className="text-xs text-center" style={{ color: GOLD }}>
        Changes apply on the next server check (within about 30 seconds).
      </p>
    </div>
  );
}
