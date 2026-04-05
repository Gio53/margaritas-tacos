/**
 * Restaurant hours helpers (America/New_York).
 * Live ordering uses `useRestaurantHours()` from RestaurantHoursContext (API-backed when configured).
 */

export {
  RESTAURANT_TZ,
  defaultRestaurantHoursConfig,
  computeIsOpen,
  buildClosedMessage,
  dateStringInEastern,
  summarizeWeeklyForMessage,
  formatHourForLabel,
  dayName,
  type RestaurantHoursConfig,
  type DayNum,
} from "@shared/restaurantHours";

import {
  defaultRestaurantHoursConfig,
  computeIsOpen,
  buildClosedMessage,
} from "@shared/restaurantHours";

/** Static fallback when context is not used (defaults only). */
export function isOpen(): boolean {
  return computeIsOpen(defaultRestaurantHoursConfig(), new Date());
}

export const CLOSED_MESSAGE = buildClosedMessage(defaultRestaurantHoursConfig(), new Date());
