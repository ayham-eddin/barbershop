type Barber = { _id: string; name: string };

type BookingSummaryDetailsProps = {
  barbers: Barber[];
  barberId: string;
  serviceName: string;
  durationMin: number;
  date: string;
  selectedSlot: string | null;
  price: number;
  notes: string;
  formatTime: (iso: string) => string;
};

export default function BookingSummaryDetails({
  barbers,
  barberId,
  serviceName,
  durationMin,
  date,
  selectedSlot,
  price,
  notes,
  formatTime,
}: BookingSummaryDetailsProps) {
  const barberName =
    barbers.find((b) => b._id === barberId)?.name ?? '—';

  return (
    <dl className="mt-3 space-y-2 text-sm">
      <div className="flex items-center justify-between gap-4">
        <dt className="text-neutral-600">Barber</dt>
        <dd className="font-medium text-neutral-900 text-right">
          {barberName}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-4">
        <dt className="text-neutral-600">Service</dt>
        <dd className="font-medium text-neutral-900 text-right">
          {serviceName} ({durationMin} min)
        </dd>
      </div>
      <div className="flex items-center justify-between gap-4">
        <dt className="text-neutral-600">Date</dt>
        <dd className="font-medium text-neutral-900 text-right">
          {date || '—'}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-4">
        <dt className="text-neutral-600">Time</dt>
        <dd className="font-medium text-neutral-900 text-right">
          {selectedSlot ? formatTime(selectedSlot) : '—'}
        </dd>
      </div>
      <div className="flex items-center justify-between gap-4">
        <dt className="text-neutral-600">Price</dt>
        <dd className="font-medium text-neutral-900 text-right">
          €{price}
        </dd>
      </div>
      {notes.trim() && (
        <div className="flex items-start justify-between gap-4">
          <dt className="text-neutral-600 mt-0.5">Notes</dt>
          <dd
            className="font-medium text-neutral-900 max-w-[220px] text-right truncate"
            title={notes}
          >
            {notes}
          </dd>
        </div>
      )}
    </dl>
  );
}
