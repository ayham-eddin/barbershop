type Slot = { start: string; end: string };

type SlotGridProps = {
  slots: Slot[];
  selectedSlot: string | null;
  loading: boolean;
  onSelect: (slotStart: string) => void;
  formatTime: (iso: string) => string;
};

export default function SlotGrid({
  slots,
  selectedSlot,
  loading,
  onSelect,
  formatTime,
}: SlotGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-10 rounded-lg bg-neutral-200 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (!slots.length) {
    return (
      <p className="text-neutral-500 text-sm">
        Choose options above, then tap{' '}
        <span className="font-medium">Check availability</span> to see times.
      </p>
    );
  }

  return (
    <div className="max-h-64 overflow-y-auto pr-1">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {slots.map((s) => {
          const active = selectedSlot === s.start;
          return (
            <button
              key={s.start}
              onClick={() => onSelect(s.start)}
              className={`rounded-lg border px-3 py-2 text-sm transition ${
                active
                  ? 'bg-amber-100 border-amber-300 text-neutral-900'
                  : 'bg-white border-neutral-300 hover:bg-amber-50 text-neutral-800'
              }`}
              title={`${formatTime(s.start)}–${formatTime(s.end)}`}
              type="button"
            >
              {formatTime(s.start)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
