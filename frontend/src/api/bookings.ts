// src/api/bookings.ts
import api from './client';

export type Booking = {
  _id: string;
  userId: string;
  barberId: string;
  serviceName: string;
  durationMin: number;
  startsAt: string; // ISO
  endsAt: string;   // ISO
  status: 'booked' | 'cancelled';
};

export async function getAvailability(params: {
  barberId: string;
  date: string;        // YYYY-MM-DD
  durationMin: number; // e.g. 30
}) {
  const { data } = await api.get<{ slots: { start: string; end: string }[] }>(
    '/api/bookings/availability',
    { params }
  );
  return data.slots;
}

export async function createBooking(payload: {
  barberId: string;
  serviceName: string;
  durationMin: number;
  startsAt: string; // ISO
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
