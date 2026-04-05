import { Link, useLocation } from "wouter";
import { ClipboardList } from "lucide-react";
import { ESPRESSO, GOLD } from "./adminTheme";

export function AdminChrome({ onLogout }: { onLogout: () => void }) {
  const [loc] = useLocation();
  const isOrders = loc === "/admin" || loc === "/admin/";
  const isAvail = loc.startsWith("/admin/availability");
  const isHours = loc.startsWith("/admin/hours");

  const tab = (href: string, label: string, active: boolean) => (
    <Link
      href={href}
      className="px-3 py-2 rounded-lg text-sm font-semibold uppercase tracking-wide transition-colors"
      style={{
        backgroundColor: active ? GOLD : "transparent",
        color: active ? ESPRESSO : "rgba(255,248,240,0.9)",
        border: active ? `1px solid ${GOLD}` : "1px solid rgba(255,248,240,0.25)",
      }}
    >
      {label}
    </Link>
  );

  return (
    <header
      className="sticky top-0 z-30 flex flex-col gap-2 px-4 py-3 shadow-md"
      style={{
        backgroundColor: ESPRESSO,
        borderBottom: "1px solid rgba(232,168,56,0.2)",
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <ClipboardList className="size-6 text-white shrink-0" />
          <h1
            className="text-lg font-bold text-white uppercase tracking-wider truncate"
            style={{ fontFamily: "'Oswald', sans-serif" }}
          >
            Admin
          </h1>
          {isOrders && (
            <span className="text-xs text-white/70 hidden sm:inline" title="When the new-order alarm is playing">
              (Spacebar to silence)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onLogout}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white/90 hover:text-white border border-white/30"
          >
            Log out
          </button>
          <Link
            href="/"
            className="px-4 py-2 rounded-lg font-semibold text-white uppercase text-sm border transition-opacity hover:opacity-90"
            style={{
              backgroundColor: "rgba(139, 90, 43, 0.8)",
              borderColor: "rgba(44,24,16,0.5)",
            }}
          >
            Home
          </Link>
        </div>
      </div>
      <nav className="flex flex-wrap gap-2 pt-1 border-t border-white/15" aria-label="Admin sections">
        {tab("/admin", "Orders", isOrders)}
        {tab("/admin/availability", "Menu availability", isAvail)}
        {tab("/admin/hours", "Hours & closures", isHours)}
      </nav>
    </header>
  );
}
