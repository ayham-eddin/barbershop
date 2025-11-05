// src/pages/DashboardPage.tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMyBookings, cancelBooking, type Booking } from '../api/bookings';
import toast from 'react-hot-toast';

const dtFmt = new Intl.DateTimeFormat('de-DE', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Europe/Berlin',
});

function isPast(iso: string) {
  return new Date(iso).getTime() < Date.now();
}

export default function DashboardPage() {
  const qc = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['me', 'bookings'],
    queryFn: getMyBookings,
  });

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
    onSuccess: () => {
      toast.success('Booking cancelled.');
    },
    onError: (_err, _id, ctx) => {
      if (ctx?.prev) qc.setQueryData(['me', 'bookings'], ctx.prev);
      toast.error('Could not cancel booking.');
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['me', 'bookings'] });
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
                cancelling={cancelMut.isPending && cancelMut.variables === b._id}
              />
            ))}
        </div>
      )}
    </section>
  );
}

function StatusBadge({ status }: { status: Booking['status'] }) {
  const styles =
    status === 'booked'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : 'bg-neutral-100 text-neutral-700 border-neutral-200';
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded-full border ${styles}`}>
      {status}
    </span>
  );
}

function BookingCard({
  booking,
  onCancel,
  cancelling,
}: {
  booking: Booking;
  onCancel: () => void;
  cancelling: boolean;
}) {
  const past = isPast(booking.startsAt);
  const canCancel = booking.status === 'booked' && !past;

  return (
    <article className="rounded-2xl bg-white border border-neutral-200 p-5 shadow-sm flex flex-col gap-2">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium text-neutral-900">
          {booking.serviceName} <span className="text-neutral-400">•</span>{' '}
          {booking.durationMin} min
        </h3>
        <StatusBadge status={booking.status} />
      </div>

      <p className="text-sm text-neutral-700">
        {dtFmt.format(new Date(booking.startsAt))}
      </p>

      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-500">Barber: {booking.barberId}</p>
        <div className="flex items-center gap-2">
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
            {cancelling ? 'Cancelling…' : 'Cancel'}
          </button>
        </div>
      </div>
    </article>
  );
}
