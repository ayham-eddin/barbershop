// src/pages/Admin/AdminBookingsPage.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cancelBooking } from '../../api/bookings';
import api from '../../api/client';
import { useMemo, useState } from 'react';

type Booking = {
  _id: string;
  userId: string;
  barberId: string;
  serviceName: string;
  durationMin: number;
  startsAt: string;
  endsAt: string;
  status: 'booked' | 'cancelled';
  createdAt: string;
};

type Barber = { _id: string; name: string };

export default function AdminBookingsPage() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'booked' | 'cancelled'>('all');

  const { data: bookings, isLoading, isError } = useQuery({
    queryKey: ['adminBookings'],
    queryFn: async () => {
      const res = await api.get<{ bookings: Booking[] }>('/api/bookings/admin/all');
      return res.data.bookings;
    },
  });

  const { data: barbers } = useQuery({
    queryKey: ['barbers'],
    queryFn: async () => {
      const res = await api.get<{ barbers: Barber[] }>('/api/barbers');
      return res.data.barbers;
    },
  });

  const barberNameById = useMemo(() => {
    const map = new Map<string, string>();
    (barbers ?? []).forEach((b) => map.set(b._id, b.name));
    return map;
  }, [barbers]);

  const mutation = useMutation({
    mutationFn: (id: string) => cancelBooking(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['adminBookings'] }),
  });

  const filtered = (bookings ?? []).filter((b) => filter === 'all' || b.status === filter);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Bookings</h1>
          <p className="text-sm text-neutral-500">Manage all customer appointments</p>
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as 'all' | 'booked' | 'cancelled')}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
        >
          <option value="all">All</option>
          <option value="booked">Booked</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-sm">
        <table className="min-w-full text-sm text-left text-neutral-700">
          <thead className="bg-neutral-100 text-neutral-900 font-medium">
            <tr>
              <th className="px-4 py-3">Barber</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Service</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-neutral-500">
                  Loading bookings…
                </td>
              </tr>
            )}

            {isError && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-rose-600">
                  Failed to load bookings.
                </td>
              </tr>
            )}

            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-8 text-neutral-500">
                  No bookings found.
                </td>
              </tr>
            )}

            {!isLoading &&
              filtered.map((b) => (
                <tr key={b._id} className="border-t border-neutral-200">
                  <td className="px-4 py-3">
                    {barberNameById.get(b.barberId) ?? `#${b.barberId.slice(-4)}`}
                  </td>
                  <td className="px-4 py-3">
                    {/* We don’t have a users endpoint yet; show a short id for now */}
                    #{b.userId.slice(-6)}
                  </td>
                  <td className="px-4 py-3">{b.serviceName} · {b.durationMin} min</td>
                  <td className="px-4 py-3">
                    {new Date(b.startsAt).toLocaleString('de-DE', {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                      timeZone: 'Europe/Berlin',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        b.status === 'booked'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-neutral-200 text-neutral-600'
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {b.status === 'booked' && (
                      <button
                        onClick={() => mutation.mutate(b._id)}
                        disabled={mutation.isPending}
                        className="rounded-md bg-rose-500 text-white px-3 py-1 text-xs font-medium hover:bg-rose-600 disabled:opacity-60"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
