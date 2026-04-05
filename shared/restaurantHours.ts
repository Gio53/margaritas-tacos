/**
 * Restaurant hours — America/New_York. Used by server + client + admin editor.
 */

export const RESTAURANT_TZ = "America/New_York";

/** 0 = Sunday … 6 = Saturday */
export type DayNum = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface DayHours {
  open: number;
  close: number;
}

export interface RestaurantHoursConfig {
  /** Keys "0"–"6"; null = closed that weekday */
  weekly: Record<string, DayHours | null>;
  /** Calendar dates closed (YYYY-MM-DD in Eastern) */
  closedDates: string[];
  /** When set, shown instead of auto message when closed */
  closedMessageCustom: string | null;
}

export function defaultRestaurantHoursConfig(): RestaurantHoursConfig {
  return {
    weekly: {
      "0": { open: 14, close: 21 },
      "1": null,
      "2": { open: 14, close: 21 },
      "3": { open: 14, close: 21 },
      "4": { open: 14, close: 21 },
      "5": { open: 14, close: 22 },
      "6": { open: 14, close: 22 },
    },
    closedDates: [],
    closedMessageCustom: null,
  };
}

export function dateStringInEastern(d: Date): string {
  const f = new Intl.DateTimeFormat("en-CA", {
    timeZone: RESTAURANT_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = f.formatToParts(d);
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const day = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${day}`;
}

function nowPartsEastern(d: Date): { day: DayNum; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: RESTAURANT_TZ,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(d);
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
  const dayStr = new Intl.DateTimeFormat("en-US", {
    timeZone: RESTAURANT_TZ,
    weekday: "short",
  }).format(d);
  const dayMap: Record<string, DayNum> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const day = dayMap[dayStr] ?? 0;
  return { day, hour, minute };
}

function isValidDayHours(h: unknown): h is DayHours {
  if (!h || typeof h !== "object") return false;
  const o = h as DayHours;
  return (
    typeof o.open === "number" &&
    typeof o.close === "number" &&
    o.open >= 0 &&
    o.open <= 23 &&
    o.close >= 1 &&
    o.close <= 24 &&
    o.open < o.close
  );
}

/** Normalize and validate API/body input; returns null if invalid. */
export function parseRestaurantHoursBody(data: unknown): RestaurantHoursConfig | null {
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;
  const weeklyRaw = o.weekly;
  if (!weeklyRaw || typeof weeklyRaw !== "object") return null;
  const weekly: Record<string, DayHours | null> = {};
  for (let d = 0; d <= 6; d++) {
    const key = String(d);
    const v = (weeklyRaw as Record<string, unknown>)[key];
    if (v === null || v === undefined) {
      weekly[key] = null;
      continue;
    }
    if (isValidDayHours(v)) weekly[key] = { open: v.open, close: v.close };
    else return null;
  }
  const cd = o.closedDates;
  if (!Array.isArray(cd)) return null;
  const closedDates: string[] = [];
  for (const x of cd) {
    if (typeof x !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(x)) return null;
    closedDates.push(x);
  }
  const custom = o.closedMessageCustom;
  const closedMessageCustom =
    custom === null || custom === undefined
      ? null
      : typeof custom === "string"
        ? custom.trim() || null
        : null;
  return { weekly, closedDates: Array.from(new Set(closedDates)).sort(), closedMessageCustom };
}

export function computeIsOpen(config: RestaurantHoursConfig, at: Date = new Date()): boolean {
  const dateStr = dateStringInEastern(at);
  if (config.closedDates.includes(dateStr)) return false;
  const { day, hour, minute } = nowPartsEastern(at);
  const h = config.weekly[String(day)];
  if (!h) return false;
  const mins = hour * 60 + minute;
  return mins >= h.open * 60 && mins < h.close * 60;
}

/** e.g. 14 -> "2:00 pm" */
export function formatHourForLabel(hour: number): string {
  const h = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const ampm = hour >= 12 ? "pm" : "am";
  return `${h}:00 ${ampm}`;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function dayName(day: DayNum): string {
  return DAY_NAMES[day];
}

/** Short human summary of weekly hours for closed banner / homepage. */
export function summarizeWeeklyForMessage(config: RestaurantHoursConfig): string {
  const parts: string[] = [];
  for (let d = 0; d <= 6; d++) {
    const h = config.weekly[String(d)];
    if (h) {
      parts.push(
        `${DAY_NAMES[d].slice(0, 3)} ${formatHourForLabel(h.open)}–${formatHourForLabel(h.close)}`
      );
    }
  }
  const closedDays = [];
  for (let d = 0; d <= 6; d++) {
    if (!config.weekly[String(d)]) closedDays.push(DAY_NAMES[d]);
  }
  let s = parts.length ? `Open: ${parts.join(", ")}` : "";
  if (closedDays.length) s += (s ? ". " : "") + `Closed: ${closedDays.join(", ")}`;
  return `${s} (Eastern).`;
}

export function buildClosedMessage(config: RestaurantHoursConfig, at: Date = new Date()): string {
  if (config.closedMessageCustom?.trim()) return config.closedMessageCustom.trim();
  const dateStr = dateStringInEastern(at);
  if (config.closedDates.includes(dateStr)) {
    return "We're closed today. Thank you — see you soon!";
  }
  return `We're closed. ${summarizeWeeklyForMessage(config)}`;
}
