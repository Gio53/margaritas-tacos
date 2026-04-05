// ============================================================
// Admin — password gate + sectioned pages (orders / availability / hours)
// ============================================================

import { useState, useEffect } from "react";
import { Link, Route, Switch } from "wouter";
import { AdminChrome } from "./admin/AdminChrome";
import AdminOrdersPage from "./admin/AdminOrdersPage";
import AdminAvailabilityPage from "./admin/AdminAvailabilityPage";
import AdminHoursPage from "./admin/AdminHoursPage";
import {
  ADMIN_SESSION_KEY,
  ADMIN_PASSWORD,
  BEIGE_BG,
  ESPRESSO,
  GOLD,
} from "./admin/adminTheme";

export default function Admin() {
  const [authenticated, setAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    setAuthenticated(sessionStorage.getItem(ADMIN_SESSION_KEY) === "true");
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
      setAuthenticated(true);
      setPasswordError("");
      setPasswordInput("");
      try {
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        void ctx.resume();
      } catch {
        // ignore
      }
    } else {
      setPasswordError("Wrong password");
    }
  };

  const logout = () => {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setAuthenticated(false);
  };

  if (!authenticated) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center p-6"
        style={{ backgroundColor: BEIGE_BG, fontFamily: "'Lato', sans-serif" }}
      >
        <div className="w-full max-w-sm rounded-xl border-2 p-6 bg-white" style={{ borderColor: ESPRESSO }}>
          <h1 className="text-xl font-bold mb-4 text-center" style={{ color: ESPRESSO }}>
            Admin
          </h1>
          <p className="text-sm mb-4 text-center" style={{ color: "#6B7280" }}>
            Enter the admin password to continue.
          </p>
          <form onSubmit={handlePasswordSubmit} className="space-y-3">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                setPasswordError("");
              }}
              placeholder="Password"
              className="w-full rounded-lg border px-3 py-2"
              style={{ borderColor: "rgba(44,24,16,0.3)" }}
              autoFocus
            />
            {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
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
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: BEIGE_BG, fontFamily: "'Lato', sans-serif" }}
    >
      <AdminChrome onLogout={logout} />
      <Switch>
        <Route path="/admin/availability" component={AdminAvailabilityPage} />
        <Route path="/admin/hours" component={AdminHoursPage} />
        <Route path="/admin" component={AdminOrdersPage} />
      </Switch>
    </div>
  );
}
