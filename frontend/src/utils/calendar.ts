// src/utils/calendar.ts
import { startOfWeek as sow, endOfWeek as eow } from "date-fns";

export function startOfWeekISO(d: Date): Date {
  // Monday as start of week (ISO 8601)
  return sow(d, { weekStartsOn: 1 });
}

export function endOfWeekISO(d: Date): Date {
  // Sunday 23:59:59.999 (exclusive boundary up to next day)
  return eow(d, { weekStartsOn: 1 });
}

export function toIsoMidnightUTC(d: Date): string {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
  return x.toISOString();
}

export function addDaysUTC(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}
