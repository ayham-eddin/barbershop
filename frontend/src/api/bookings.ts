// src/api/bookings.ts
import api from './client';
import type { AxiosError } from 'axios';

export type BookingStatus =
  | 'booked'
  | 'cancelled'
  | 'completed'
  | 'no_show'
  | 'rescheduled';

export type Booking = {
  _id: string;
  userId: string;
  barberId: string;
  serviceName: string;
  durationMin: number;
  startsAt: string; // ISO
  endsAt: string;   // ISO
  status: BookingStatus;
  notes?: string;
  barber?: { id: string; name?: string };
  // For admin enrichment (Phase B/C) – may be present on /admin/all
  user?: {
    id: string;
    name?: string;
    email?: string;
    warning_count?: number;
    is_online_booking_blocked?: boolean;
    last_warning_at?: string;
  };
};

export async function getAvailability(params: {
  barberId: string;
  date: string;        // YYYY-MM-DD
  durationMin: number; // e.g. 30
}) {
  const { data } = await api.get<{ slots: { start: string; end: string }[] }>(
    '/api/bookings/availability',
    { params },
  );
  return data.slots;
}

export async function createBooking(payload: {
  barberId: string;
  serviceName: string;
  durationMin: number;
  startsAt: string; // ISO
  notes?: string;   // optional
}) {
  const { data } = await api.post<{ booking: Booking }>('/api/bookings', payload);
  return data.booking;
}

export async function getMyBookings() {
  const { data } = await api.get<{ bookings: Booking[] }>('/api/bookings/me');
  return data.bookings;
}

export async function cancelBooking(id: string) {
  const { data } = await api.post<{ booking: Booking }>(`/api/bookings/${id}/cancel`, {});
  return data.booking;
}

/** User reschedules own booking */
export async function rescheduleMyBooking(
  id: string,
  patch: Partial<{ startsAt: string; durationMin: number }>,
) {
  const { data } = await api.patch<{ booking: Booking }>(`/api/bookings/${id}`, patch);
  return data.booking;
}

/** Admin actions */
export async function adminCancelBooking(id: string) {
  const { data } = await api.post<{ booking: Booking }>(`/api/bookings/admin/${id}/cancel`, {});
  return data.booking;
}

export async function adminCompleteBooking(id: string) {
  const { data } = await api.post<{ booking: Booking }>(`/api/bookings/admin/${id}/complete`, {});
  return data.booking;
}

export async function adminMarkNoShow(id: string) {
  const { data } = await api.post<{ booking: Booking }>(`/api/bookings/admin/${id}/no-show`, {});
  return data.booking;
}

export async function adminUnblockUser(userId: string) {
  const { data } = await api.post<{ user: { _id: string; is_online_booking_blocked: boolean } }>(
    `/api/admin/users/${userId}/unblock`,
    {},
  );
  return data.user;
}

export async function adminBlockUser(userId: string, reason?: string) {
  const { data } = await api.post<{ user: { _id: string; is_online_booking_blocked: boolean; block_reason?: string } }>(
    `/api/admin/users/${userId}/block`,
    reason ? { reason } : {},
  );
  return data.user;
}

export async function adminClearWarning(userId: string) {
  const { data } = await api.post<{ user: { _id: string; warning_count: number } }>(
    `/api/admin/users/${userId}/clear-warning`,
    {},
  );
  return data.user;
}

/** Helpers to classify backend rejections by message */
export function isBlockedError(err: unknown): boolean {
  const ax = err as AxiosError<{ error?: string }>;
  const msg = ax.response?.data?.error ?? ax.message ?? '';
  return /restricted|blocked|no-shows/i.test(msg);
}

export function isWeeklyLimitError(err: unknown): boolean {
  const ax = err as AxiosError<{ error?: string }>;
  const msg = ax.response?.data?.error ?? ax.message ?? '';
  return /one active booking within 7 days/i.test(msg);
}
