// src/api/adminBookings.ts
import api from './client';

export type AdminBookingPatch = Partial<{
  startsAt: string;           // ISO string
  durationMin: number;
  barberId: string;
  serviceName: string;
  notes: string;
}>;

export async function patchAdminBooking(id: string, patch: AdminBookingPatch) {
  const { data } = await api.patch(`/api/bookings/admin/${id}`, patch);
  return data.booking as {
    _id: string;
    serviceName: string;
    durationMin: number;
    startsAt: string;
    endsAt: string;
    status: string;
    user?: { id: string; name?: string; email?: string };
    barber?: { id: string; name?: string };
  };
}
