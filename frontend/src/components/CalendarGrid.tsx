// src/components/CalendarGrid.tsx
import { useMemo } from 'react';

type Slot = { start: string; end: string }; // ISO times (UTC or local-consistent)
type Booking = {
  _id: string;
  startsAt: string; // ISO
  endsAt: string;   // ISO
  serviceName?: string;
  userName?: string;
};

interface CalendarGridProps {
  /** Day in YYYY-MM-DD (local) used only for heading/context */
  day: string;
  /** Inclusive hour (0-23) the grid starts at (e.g. 9) */
  startHour?: number;
  /** Exclusive hour (1-24) the grid ends at (e.g. 18) */
  endHour?: number;
  /** Available slots to click/pick (optional visual aid) */
  slots?: Slot[];
  /** Existing bookings to render (blocks) */
  bookings?: Booking[];
  /** Called when user clicks an available slot cell (passes ISO start) */
  onPick?: (startIso: string) => void;
}

function hhmm(hour: number): string {
  const h = Math.floor(hour);
  return `${String(h).padStart(2, '0')}:00`;
}

function toMinutes(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

export default function CalendarGrid({
  day,
  startHour = 9,
  endHour = 18,
  slots = [],
  bookings = [],
  onPick,
}: CalendarGridProps) {
  // one row per hour
  const ticks = useMemo(() => {
    const out: number[] = [];
    for (let h = startHour; h < endHour; h += 1) out.push(h);
    return out;
  }, [startHour, endHour]);

  // helpers for positioning blocks in the grid
  const dayStartMin = startHour * 60;
  const totalMin = (endHour - startHour) * 60;

  const pctFromIso = (iso: string) => {
    const mins = toMinutes(iso) - dayStartMin;
    return Math.max(0, Math.min(100, (mins / totalMin) * 100));
  };

  const heightPct = (startIso: string, endIso: string) => {
    const s = toMinutes(startIso);
    const e = toMinutes(endIso);
    const clamped = Math.max(0, Math.min(totalMin, e - s));
    return Math.max(3, (clamped / totalMin) * 100); // at least 3%
  };

  return (
    <div className="w-full">
      <div className="flex items-end justify-between mb-3">
        <h3 className="text-lg font-semibold text-neutral-900">
          {day}
        </h3>
        <div className="text-xs text-neutral-500">
          {hhmm(startHour)} — {hhmm(endHour)}
        </div>
      </div>

      <div className="relative grid grid-cols-[64px_1fr]">
        {/* left gutter with hour labels */}
        <div className="border-r border-neutral-200">
          {ticks.map((_, i) => (
            <div
              key={i}
              className="h-16 flex items-start justify-end pr-2 text-[11px] text-neutral-500"
            >
              <span className="translate-y-[-6px]">{hhmm(startHour + i)}</span>
            </div>
          ))}
        </div>

        {/* main timeline */}
        <div className="relative">
          {/* hour rows */}
          {ticks.map((_, i) => (
            <div
              key={i}
              className={`h-16 border-t ${i === 0 ? 'border-neutral-200' : 'border-neutral-100'}`}
            />
          ))}

          {/* clickable slots (optional) */}
          {slots.map((s, idx) => {
            const top = pctFromIso(s.start);
            const h = heightPct(s.start, s.end);
            return (
              <button
                key={`slot-${idx}`}
                type="button"
                style={{ top: `${top}%`, height: `${h}%` }}
                onClick={() => onPick?.(s.start)}
                className="absolute left-2 right-2 rounded-md border border-sky-300 bg-sky-50/70 hover:bg-sky-100 text-sky-800 text-[11px] px-2 py-1 text-left shadow-sm"
                title="Available slot"
              >
                {new Date(s.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                {new Date(s.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </button>
            );
          })}

          {/* existing bookings */}
          {bookings.map((b) => {
            const top = pctFromIso(b.startsAt);
            const h = heightPct(b.startsAt, b.endsAt);
            return (
              <div
                key={b._id}
                style={{ top: `${top}%`, height: `${h}%` }}
                className="absolute left-2 right-2 rounded-md border border-amber-300 bg-amber-50 text-amber-900 text-[11px] px-2 py-1 shadow-sm"
                title={`${b.serviceName ?? 'Booking'} • ${new Date(b.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
              >
                <div className="font-medium truncate">{b.serviceName ?? 'Booking'}</div>
                {b.userName && <div className="truncate">{b.userName}</div>}
                <div className="text-[10px] text-amber-900/80">
                  {new Date(b.startsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                  {new Date(b.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
