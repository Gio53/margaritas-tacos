import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  defaultRestaurantHoursConfig,
  computeIsOpen,
  buildClosedMessage,
  type RestaurantHoursConfig,
} from "@shared/restaurantHours";

const API_BASE = import.meta.env.VITE_ORDERS_API_URL ?? "";

type Value = {
  config: RestaurantHoursConfig;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isOpen: () => boolean;
  closedMessage: string;
};

const RestaurantHoursContext = createContext<Value | null>(null);

export function RestaurantHoursProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<RestaurantHoursConfig>(() => defaultRestaurantHoursConfig());
  const [loading, setLoading] = useState(Boolean(API_BASE));
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!API_BASE) {
      setConfig(defaultRestaurantHoursConfig());
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const base = API_BASE.replace(/\/$/, "");
      const res = await fetch(`${base}/api/restaurant-hours`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Partial<RestaurantHoursConfig>;
      if (data && typeof data === "object" && data.weekly) {
        const base = defaultRestaurantHoursConfig();
        setConfig({
          ...base,
          ...data,
          weekly: { ...base.weekly, ...data.weekly },
          closedDates: Array.isArray(data.closedDates) ? data.closedDates : base.closedDates,
          closedMessageCustom:
            data.closedMessageCustom === undefined
              ? base.closedMessageCustom
              : data.closedMessageCustom,
        });
      } else setConfig(defaultRestaurantHoursConfig());
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setConfig(defaultRestaurantHoursConfig());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    if (!API_BASE) return;
    const id = setInterval(() => void refetch(), 120_000);
    return () => clearInterval(id);
  }, [refetch]);

  const isOpen = useCallback(() => computeIsOpen(config, new Date()), [config]);

  const closedMessage = useMemo(() => buildClosedMessage(config, new Date()), [config]);

  const value = useMemo<Value>(
    () => ({
      config,
      loading,
      error,
      refetch,
      isOpen,
      closedMessage,
    }),
    [config, loading, error, refetch, isOpen, closedMessage]
  );

  return (
    <RestaurantHoursContext.Provider value={value}>{children}</RestaurantHoursContext.Provider>
  );
}

export function useRestaurantHours() {
  const ctx = useContext(RestaurantHoursContext);
  if (!ctx) throw new Error("useRestaurantHours must be used within RestaurantHoursProvider");
  return ctx;
}
