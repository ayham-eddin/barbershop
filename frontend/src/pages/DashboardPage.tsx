import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyBookings,
  cancelBooking,
  rescheduleMyBooking,
  type Booking,
  type BookingStatus,
} from '../api/bookings';
import Spinner from '../components/Spinner';
import { notify } from '../lib/notify';
import { formatBerlin } from '../utils/datetime';
import Modal from '../components/Modal';
import TimeField from '../components/TimeField';

function isPast(iso: string) {
  return new Date(iso).getTime() < Date.now();
}

function isActive(status: BookingStatus) {
  return status === 'booked' || status === 'rescheduled';
}

export default function DashboardPage() {
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['me', 'bookings'],
    queryFn: getMyBookings,
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });

  // Cancel
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
  const [editStartsAtLocal, setEditStartsAtLocal] = useState<string>(''); // yyyy-MM-ddTHH:mm
  const [editDurationMin, setEditDurationMin] = useState<number>(30);

  function openReschedule(b: Booking) {
    setEditId(b._id);
    // prefill from current values
    const d = new Date(b.startsAt);
    const pad = (n: number) => String(n).padStart(2, '0');
    const local = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours(),
    )}:${pad(d.getMinutes())}`;
    setEditStartsAtLocal(local);
    setEditDurationMin(b.durationMin);
    setEditOpen(true);
  }

  const rescheduleMut = useMutation({
    mutationFn: async () => {
      if (!editId) return null;
      const startsAt =
        editStartsAtLocal ? new Date(editStartsAtLocal).toISOString() : undefined;
      const patch: Partial<{ startsAt: string; durationMin: number }> = {};
      if (startsAt) patch.startsAt = startsAt;
      if (Number.isFinite(editDurationMin)) patch.durationMin = editDurationMin;
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

      {isLoading && (
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-neutral-200 animate-pulse" />
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
            .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
            .map((b) => (
              <BookingCard
                key={b._id}
                booking={b}
                onCancel={() => cancelMut.mutate(b._id)}
                onReschedule={() => openReschedule(b)}
                cancelling={cancelMut.isPending && cancelMut.variables === b._id}
                canReschedule={isActive(b.status) && !isPast(b.startsAt)}
              />
            ))}
        </div>
      )}

      {/* Reschedule Modal */}
      <Modal open={editOpen} title="Reschedule booking" onClose={() => setEditOpen(false)}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            rescheduleMut.mutate();
          }}
          className="space-y-3"
        >
          <TimeField
            value={editStartsAtLocal}
            onChange={(isoLocal) => setEditStartsAtLocal(isoLocal)}
            label="Starts at"
            required
          />

          <label className="block text-sm font-medium text-neutral-700">
            Duration (min)
            <input
              type="number"
              min={5}
              max={480}
              value={editDurationMin}
              onChange={(e) => setEditDurationMin(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"
              required
            />
          </label>

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
        </form>
      </Modal>
    </section>
  );
}

function StatusBadge({ status }: { status: Booking['status'] }) {
  const map: Record<BookingStatus, string> = {
    booked: 'bg-amber-100 text-amber-800 border-amber-200',
    rescheduled: 'bg-sky-100 text-sky-800 border-sky-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-neutral-100 text-neutral-700 border-neutral-200',
    no_show: 'bg-rose-100 text-rose-800 border-rose-200',
  };
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full border ${map[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function BookingCard({
  booking,
  onCancel,
  onReschedule,
  cancelling,
  canReschedule,
}: {
  booking: Booking;
  onCancel: () => void;
  onReschedule: () => void;
  cancelling: boolean;
  canReschedule: boolean;
}) {
  const past = isPast(booking.startsAt);
  const canCancel = (booking.status === 'booked' || booking.status === 'rescheduled') && !past;

  const barberLabel = booking.barber?.name ?? booking.barber?.id ?? booking.barberId;

  return (
    <article className="rounded-2xl bg-white border border-neutral-200 p-5 shadow-sm flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium text-neutral-900">
          {booking.serviceName} <span className="text-neutral-400">•</span>{' '}
          {booking.durationMin} min
        </h3>
        <StatusBadge status={booking.status} />
      </div>

      <p className="text-sm text-neutral-700">{formatBerlin(booking.startsAt)}</p>

      {booking.notes && (
        <p className="text-sm text-neutral-600 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2">
          <span className="font-medium text-neutral-700">Note:</span> {booking.notes}
        </p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-500">Barber: {barberLabel}</p>
        <div className="flex items-center gap-2">
          {canReschedule && (
            <button
              onClick={onReschedule}
              className="text-sm border border-neutral-300 rounded-lg px-3 py-1.5 hover:bg-neutral-100 transition"
              title="Reschedule this booking"
            >
              Reschedule
            </button>
          )}
          <a
            href="/book"
            className="text-sm text-neutral-700 hover:text-neutral-900 underline underline-offset-4"
          >
            Book another
          </a>
          <button
            onClick={onCancel}
            disabled={!canCancel || cancelling}
            className="text-sm bg-neutral-900 text-white rounded-lg px-3 py-1.5 hover:bg-neutral-800 transition disabled:opacity-50"
            title={
              !canCancel
                ? past
                  ? 'Past booking cannot be cancelled'
                  : 'Already cancelled'
                : 'Cancel this booking'
            }
          >
            {cancelling ? (
              <span className="inline-flex items-center gap-2">
                <Spinner aria-label="Cancelling" />
                Cancelling…
              </span>
            ) : (
              'Cancel'
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
