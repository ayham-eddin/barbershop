// frontend/src/pages/DashboardPage.tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyBookings,
  cancelBooking,
  rescheduleMyBooking,
  type Booking,
} from '../api/bookings';
import { getMe } from '../api/me';
import { notify } from '../lib/notify';
import Modal from '../components/Modal';
import TimeField from '../components/TimeField';
import BookingCard from '../components/booking/BookingCard';
import { isActive, isPast } from '../utils/bookings';

export default function DashboardPage() {
  const qc = useQueryClient();

  // ✅ Fetch user info (warnings / block)
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
    staleTime: 5 * 60 * 1000,
  });

  // ✅ Fetch bookings
  const { data, isLoading, isError } = useQuery({
    queryKey: ['me', 'bookings'],
    queryFn: getMyBookings,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });

  // Cancel mutation
  const cancelMut = useMutation({
    mutationFn: (id: string) => cancelBooking(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['me', 'bookings'] });
      const prev = qc.getQueryData<Booking[]>(['me', 'bookings']);
      if (prev) {
        qc.setQueryData<Booking[]>(
          ['me', 'bookings'],
          prev.map((b) => (b._id === id ? { ...b, status: 'cancelled' } : b)),
        );
      }
      return { prev };
    },
    onSuccess: () => notify.success('Booking cancelled.'),
    onError: (err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['me', 'bookings'], ctx.prev);
      notify.apiError(err, 'Could not cancel booking.');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['me', 'bookings'] });
    },
  });

  // Reschedule modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editStartsAtLocal, setEditStartsAtLocal] = useState<string>(''); // yyyy-MM-ddTHH:mm or ISO

  function openReschedule(b: Booking) {
    setEditId(b._id);
    // prefill from current values
    const d = new Date(b.startsAt);
    const pad = (n: number) => String(n).padStart(2, '0');
    const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
      d.getDate(),
    )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    setEditStartsAtLocal(local);
    setEditOpen(true);
  }

  const rescheduleMut = useMutation({
    mutationFn: async () => {
      if (!editId) return null;
      const startsAt = editStartsAtLocal
        ? new Date(editStartsAtLocal).toISOString()
        : undefined;

      const patch: Partial<{ startsAt: string }> = {};
      if (startsAt) patch.startsAt = startsAt;

      return rescheduleMyBooking(editId, patch);
    },
    onSuccess: () => {
      notify.success('Booking rescheduled.');
      setEditOpen(false);
      setEditId(null);
      (async () => {
        await qc.invalidateQueries({ queryKey: ['me', 'bookings'] });
      })().catch(() => {});
    },
    onError: (err) => {
      notify.apiError(err, 'Could not reschedule this booking.');
    },
  });

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold text-neutral-900">My Bookings</h1>
        <p className="text-sm text-neutral-600 mt-1">
          View and manage your upcoming appointments.
        </p>
      </header>

      {/* ⚠️ Warning or block banners */}
      {me?.is_online_booking_blocked && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm">
          ⚠️ Your online booking is restricted due to repeated no-shows. Please call the
          barbershop to book in person.
        </div>
      )}

      {!me?.is_online_booking_blocked && (me?.warning_count ?? 0) > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 text-amber-700 px-4 py-3 text-sm">
          ⚠️ You have {me?.warning_count ?? 0} warning
          {(me?.warning_count ?? 0) > 1 ? 's' : ''} for missed appointments.
        </div>
      )}

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-neutral-200 animate-pulse"
            />
          ))}
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 px-4 py-3 text-sm">
          Couldn’t load bookings. Please refresh.
        </div>
      )}

      {data && data.length === 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white px-4 py-6 text-center">
          <p className="text-neutral-600">No bookings yet.</p>
          <a
            href="/book"
            className="inline-flex mt-3 rounded-lg bg-amber-400 text-neutral-900 font-semibold px-4 py-2 hover:bg-amber-300 transition"
          >
            Book your first appointment
          </a>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {data
            .slice()
            .sort(
              (a, b) =>
                new Date(a.startsAt).getTime() -
                new Date(b.startsAt).getTime(),
            )
            .map((b) => (
              <BookingCard
                key={b._id}
                booking={b}
                onCancel={() => cancelMut.mutate(b._id)}
                onReschedule={() => openReschedule(b)}
                cancelling={
                  cancelMut.isPending && cancelMut.variables === b._id
                }
                canReschedule={isActive(b.status) && !isPast(b.startsAt)}
              />
            ))}
        </div>
      )}

      {/* Reschedule Modal */}
      <Modal
        open={editOpen}
        title="Reschedule booking"
        onClose={() => setEditOpen(false)}
        footer= {
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setEditOpen(false)}
              className="rounded-md border border-neutral-300 px-3 py-1.5 hover:bg-neutral-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rescheduleMut.isPending}
              className="rounded-md bg-neutral-900 text-white px-4 py-1.5 hover:bg-neutral-800 disabled:opacity-50"
            >
              {rescheduleMut.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        }
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            rescheduleMut.mutate();
          }}
          className="space-y-3"
        >
          <TimeField
            value={editStartsAtLocal}
            onChange={(iso) => setEditStartsAtLocal(iso)}
            label="Starts at"
            required
          />
        </form>
      </Modal>
    </section>
  );
}
