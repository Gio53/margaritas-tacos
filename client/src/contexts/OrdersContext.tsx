// ============================================================
// Orders store — syncs with API when VITE_ORDERS_API_URL is set (cross-device)
// Otherwise uses localStorage (single device)
// ============================================================

import { createContext, useCallback, useContext, useMemo, useState, useEffect } from "react";
import type { OrderExtra } from "@/data/orderOptions";

const STORAGE_KEY = "margaritas-orders";
const API_BASE = import.meta.env.VITE_ORDERS_API_URL ?? "";

export type OrderStatus = "pending" | "ready" | "completed";

export interface OrderItem {
  categoryName: string;
  itemName: string;
  quantity: number;
  removeIngredients: string[];
  addExtras: OrderExtra[];
  lineTotal: number;
}

export interface PlacedOrder {
  id: string;
  status: OrderStatus;
  customer: { firstName: string; lastName: string; email: string; phone: string };
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  pickupAddress: string;
  paymentMethod: "card" | "cash";
  createdAt: number;
}

interface OrdersContextValue {
  orders: PlacedOrder[];
  addOrder: (order: Omit<PlacedOrder, "id" | "status" | "createdAt">) => void;
  setOrderStatus: (orderId: string, status: OrderStatus) => void;
  pendingCount: number;
  readyCount: number;
  completedCount: number;
  totalCount: number;
  isLoading: boolean;
  useApi: boolean;
}

const OrdersContext = createContext<OrdersContextValue | null>(null);

function generateOrderId(): string {
  return `order-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadOrdersLocal(): PlacedOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveOrdersLocal(orders: PlacedOrder[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error("Failed to save orders", e);
  }
}

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<PlacedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(!!API_BASE);
  const useApi = !!API_BASE;

  // Load orders: from API or localStorage
  const loadOrders = useCallback(async () => {
    if (API_BASE) {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/orders`);
        if (res.ok) {
          const data = await res.json();
          setOrders(Array.isArray(data) ? data : []);
        }
      } catch (e) {
        console.error("Failed to fetch orders", e);
      } finally {
        setIsLoading(false);
      }
    } else {
      setOrders(loadOrdersLocal());
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Persist to localStorage only when not using API
  useEffect(() => {
    if (!API_BASE && orders.length > 0) saveOrdersLocal(orders);
  }, [orders, API_BASE]);

  const addOrder = useCallback(
    async (order: Omit<PlacedOrder, "id" | "status" | "createdAt">) => {
      if (API_BASE) {
        try {
          const res = await fetch(`${API_BASE}/api/orders`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(order),
          });
          if (res.ok) {
            const created = await res.json();
            setOrders((prev) => [created, ...prev]);
          }
        } catch (e) {
          console.error("Failed to create order", e);
        }
      } else {
        const newOrder: PlacedOrder = {
          ...order,
          id: generateOrderId(),
          status: "pending",
          createdAt: Date.now(),
        };
        setOrders((prev) => [newOrder, ...prev]);
      }
    },
    []
  );

  const setOrderStatus = useCallback(
    async (orderId: string, status: OrderStatus) => {
      if (API_BASE) {
        try {
          const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          });
          if (res.ok) {
            setOrders((prev) =>
              prev.map((o) => (o.id === orderId ? { ...o, status } : o))
            );
          }
        } catch (e) {
          console.error("Failed to update order status", e);
        }
      } else {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status } : o))
        );
      }
    },
    []
  );

  const pendingCount = useMemo(
    () => orders.filter((o) => o.status === "pending").length,
    [orders]
  );
  const readyCount = useMemo(
    () => orders.filter((o) => o.status === "ready").length,
    [orders]
  );
  const completedCount = useMemo(
    () => orders.filter((o) => o.status === "completed").length,
    [orders]
  );
  const totalCount = orders.length;

  const value = useMemo(
    () => ({
      orders,
      addOrder,
      setOrderStatus,
      pendingCount,
      readyCount,
      completedCount,
      totalCount,
      isLoading,
      useApi,
    }),
    [
      orders,
      addOrder,
      setOrderStatus,
      pendingCount,
      readyCount,
      completedCount,
      totalCount,
      isLoading,
      useApi,
    ]
  );

  return (
    <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error("useOrders must be used within OrdersProvider");
  return ctx;
}
