// src/utils/datetime.ts

const TZ = 'Europe/Berlin';

/** Format an ISO string for UI (Berlin timezone). */
export function formatBerlin(iso: string): string {
  return new Date(iso).toLocaleString('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: TZ,
  });
}

/** Convert a yyyy-MM-ddTHH:mm (local) input into an ISO UTC string. */
export function localInputToUtcIso(local: string): string {
  // local is like "2025-11-07T10:30"
  const d = new Date(local);
  return d.toISOString();
}

/** Convert ISO -> value for <input type="datetime-local"> (yyyy-MM-ddTHH:mm). */
export function isoToLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

/** Format only time in Berlin TZ. */
export function formatBerlinTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ,
  });
}
