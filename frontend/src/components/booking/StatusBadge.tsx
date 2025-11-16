import type { BookingStatus } from '../../api/bookings';

type Props = {
  status: BookingStatus;
};

const STATUS_CLASS_MAP: Record<BookingStatus, string> = {
  booked: 'bg-amber-100 text-amber-800 border-amber-200',
  rescheduled: 'bg-sky-100 text-sky-800 border-sky-200',
  completed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-neutral-100 text-neutral-700 border-neutral-200',
  no_show: 'bg-rose-100 text-rose-800 border-rose-200',
};

export default function StatusBadge({ status }: Props) {
  return (
    <span
      className={`text-xs font-medium px-2 py-1 rounded-full border ${
        STATUS_CLASS_MAP[status]
      }`}
    >
      {status.replace('_', ' ')}
    </span>
  );
}
