import type { BookingStatus } from '../api/bookings';

/** True if the given ISO date/time is in the past. */
export function isPast(iso: string): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}

/** True if a booking status counts as "active" (can be rescheduled/cancelled). */
export function isActive(status: BookingStatus): boolean {
  return status === 'booked' || status === 'rescheduled';
}
