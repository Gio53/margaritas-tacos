import { Link, useLocation } from "wouter";
import { ESPRESSO, GOLD } from "./adminTheme";

/** Sub-tabs only for the Orders section (Orders list + Settings). */
export function OrdersSectionNav() {
  const [loc] = useLocation();
  const isOrders = loc === "/admin" || loc === "/admin/";
  const isSettings = loc.startsWith("/admin/settings");

  const tab = (href: string, label: string, active: boolean) => (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
      style={{
        backgroundColor: active ? GOLD : "transparent",
        color: active ? ESPRESSO : ESPRESSO,
        border: active ? `1px solid ${GOLD}` : "1px solid rgba(44,24,16,0.2)",
        opacity: active ? 1 : 0.75,
      }}
    >
      {label}
    </Link>
  );

  return (
    <nav className="flex flex-wrap gap-2 mb-4" aria-label="Orders section">
      {tab("/admin", "Orders", isOrders)}
      {tab("/admin/settings", "Settings", isSettings)}
    </nav>
  );
}
