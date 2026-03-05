/**
 * Restaurant hours — EST (America/New_York).
 * Tue, Wed, Thu, Sun: 2pm – 9pm
 * Fri, Sat: 2pm – 10pm
 * Mon: closed
 */

const TZ = "America/New_York";

/** 0 = Sunday, 1 = Monday, ... 6 = Saturday */
type DayNum = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface DayHours {
  open: number; // 14 = 2pm
  close: number; // 21 = 9pm, 22 = 10pm
}

const SCHEDULE: Record<DayNum, DayHours | null> = {
  0: { open: 14, close: 21 }, // Sun: 2pm–9pm
  1: null,                    // Mon: closed
  2: { open: 14, close: 21 }, // Tue: 2pm–9pm
  3: { open: 14, close: 21 }, // Wed: 2pm–9pm
  4: { open: 14, close: 21 }, // Thu: 2pm–9pm
  5: { open: 14, close: 22 }, // Fri: 2pm–10pm
  6: { open: 14, close: 22 }, // Sat: 2pm–10pm
};

function nowInEST(): { day: DayNum; hour: number; minute: number } {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  const parts = formatter.formatToParts(new Date());
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);
  const dayFormatter = new Intl.DateTimeFormat("en-US", { timeZone: TZ, weekday: "short" });
  const dayStr = dayFormatter.format(new Date());
  const dayMap: Record<string, DayNum> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  };
  const day = dayMap[dayStr] ?? 0;
  return { day, hour, minute };
}

/** True if the restaurant is currently open for orders (EST). */
export function isOpen(): boolean {
  const { day, hour, minute } = nowInEST();
  const h = SCHEDULE[day];
  if (!h) return false;
  const mins = hour * 60 + minute;
  const openMins = h.open * 60;
  const closeMins = h.close * 60;
  return mins >= openMins && mins < closeMins;
}

/** Human-readable hours message for when closed. */
export const CLOSED_MESSAGE =
  "We're closed. Open Tue–Thu & Sun 2pm–9pm, Fri–Sat 2pm–10pm EST. Closed Mondays.";
