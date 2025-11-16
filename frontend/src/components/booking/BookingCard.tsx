import type { Booking } from '../../api/bookings';
import { formatBerlin } from '../../utils/datetime';
import { isPast } from '../../utils/bookings';
import Spinner from '../Spinner';
import StatusBadge from './StatusBadge';

type BookingCardProps = {
  booking: Booking;
  onCancel: () => void;
  onReschedule: () => void;
  cancelling: boolean;
  canReschedule: boolean;
};

export default function BookingCard({
  booking,
  onCancel,
  onReschedule,
  cancelling,
  canReschedule,
}: BookingCardProps) {
  const past = isPast(booking.startsAt);
  const canCancel =
    (booking.status === 'booked' || booking.status === 'rescheduled') && !past;
  const barberLabel =
    booking.barber?.name ?? booking.barber?.id ?? booking.barberId;

  return (
    <article className="rounded-2xl bg-white border border-neutral-200 p-5 shadow-sm flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium text-neutral-900">
          {booking.serviceName}{' '}
          <span className="text-neutral-400">•</span> {booking.durationMin} min
        </h3>
        <StatusBadge status={booking.status} />
      </div>

      {/* Date & barber */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2 text-sm">
        <p className="text-neutral-700">{formatBerlin(booking.startsAt)}</p>
        <p className="text-xs text-neutral-500">Barber: {barberLabel}</p>
      </div>

      {/* Notes */}
      {booking.notes && (
        <p className="text-sm text-neutral-600 bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2">
          <span className="font-medium text-neutral-700">Note:</span>{' '}
          {booking.notes}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        {/* spacer on desktop – we already show barber above */}
        <div className="hidden sm:block" />

        <div className="flex flex-wrap justify-end gap-2">
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
