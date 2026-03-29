import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const API_BASE = import.meta.env.VITE_ORDERS_API_URL ?? "";

export interface MenuAvailabilityEntry {
  categoryId: string;
  itemName: string;
  unavailableUntil: number;
}

type MenuAvailabilityContextValue = {
  entries: MenuAvailabilityEntry[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isItemUnavailable: (categoryId: string, itemName: string) => boolean;
  unavailableUntil: (categoryId: string, itemName: string) => number | null;
};

const MenuAvailabilityContext = createContext<MenuAvailabilityContextValue | null>(null);

function availabilityKey(categoryId: string, itemName: string) {
  return `${categoryId}\t${itemName}`;
}

export function MenuAvailabilityProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<MenuAvailabilityEntry[]>([]);
  const [loading, setLoading] = useState(Boolean(API_BASE));
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!API_BASE) {
      setEntries([]);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE.replace(/\/$/, "")}/api/menu-availability`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { entries?: MenuAvailabilityEntry[] };
      setEntries(Array.isArray(data.entries) ? data.entries : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  useEffect(() => {
    if (!API_BASE) return;
    const id = setInterval(() => void refetch(), 60_000);
    return () => clearInterval(id);
  }, [refetch]);

  const untilMap = useMemo(() => {
    const m = new Map<string, number>();
    const now = Date.now();
    for (const e of entries) {
      if (e.unavailableUntil > now) m.set(availabilityKey(e.categoryId, e.itemName), e.unavailableUntil);
    }
    return m;
  }, [entries]);

  const isItemUnavailable = useCallback(
    (categoryId: string, itemName: string) => {
      const u = untilMap.get(availabilityKey(categoryId, itemName));
      return u != null && u > Date.now();
    },
    [untilMap]
  );

  const unavailableUntil = useCallback(
    (categoryId: string, itemName: string) => untilMap.get(availabilityKey(categoryId, itemName)) ?? null,
    [untilMap]
  );

  const value = useMemo<MenuAvailabilityContextValue>(
    () => ({
      entries,
      loading,
      error,
      refetch,
      isItemUnavailable,
      unavailableUntil,
    }),
    [entries, loading, error, refetch, isItemUnavailable, unavailableUntil]
  );

  return (
    <MenuAvailabilityContext.Provider value={value}>{children}</MenuAvailabilityContext.Provider>
  );
}

export function useMenuAvailability() {
  const ctx = useContext(MenuAvailabilityContext);
  if (!ctx) {
    throw new Error("useMenuAvailability must be used within MenuAvailabilityProvider");
  }
  return ctx;
}
