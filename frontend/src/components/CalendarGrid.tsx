import { useMemo, useRef } from "react";

/** Calendar event type exposed to consumers */
export type Booking = {
  id: string;
  start: Date;
  end: Date;
  label: string;
  status: string; // e.g., booked | cancelled | completed | no_show | rescheduled
};

export type CalendarGridProps = {
  /** Events to render within the time window */
  bookings: Booking[];

  /** Start/end of the visible window (same local day) */
  startDate: Date;
  endDate: Date;

  /** Working hours to show in the header (purely cosmetic) */
  workingHours: { startHour: number; endHour: number };

  /** Optional "current time" for highlighting (only used if same day & in range) */
  now?: Date;

  /** Optional subtitle shown in the header (e.g. "All barbers" / "Barber: Max") */
  subtitle?: string;

  /** Clicked on an event */
  onEventClick?: (ev: Booking) => void;

  /** Clicked on an empty slot -> returns the datetime clicked */
  onEmptySlotClick?: (dt: Date) => void;
};

function minutesBetween(a: Date, b: Date): number {
  return Math.max(0, Math.round((b.getTime() - a.getTime()) / 60000));
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * A simple day-view time grid. Each minute equals 1px for clarity.
 * (So a 10-hour window renders at 600px height.)
 */
export default function CalendarGrid({
  bookings,
  startDate,
  endDate,
  workingHours,
  now,
  subtitle,
  onEventClick,
  onEmptySlotClick,
}: CalendarGridProps) {
  const totalMinutes = useMemo(
    () => minutesBetween(startDate, endDate),
    [startDate, endDate]
  );
  const pxPerMin = 1; // 1px / minute
  const gridRef = useRef<HTMLDivElement>(null);

  const hours = useMemo(() => {
    const out: number[] = [];
    for (let h = workingHours.startHour; h <= workingHours.endHour; h += 1) {
      out.push(h);
    }
    return out;
  }, [workingHours]);

  const normalizedEvents = useMemo(() => {
    return bookings.map((ev) => {
      const topMin = clamp(
        minutesBetween(startDate, ev.start),
        0,
        totalMinutes
      );
      const endMin = clamp(minutesBetween(startDate, ev.end), 0, totalMinutes);
      const heightMin = Math.max(10, endMin - topMin); // at least 10px visible
      return {
        ev,
        topPx: topMin * pxPerMin,
        heightPx: heightMin * pxPerMin,
      };
    });
  }, [bookings, startDate, totalMinutes]);

  const nowLineTop = useMemo(() => {
    if (!now) return null;
    if (!isSameDay(now, startDate)) return null;
    if (now < startDate || now > endDate) return null;

    const mins = clamp(minutesBetween(startDate, now), 0, totalMinutes);
    return mins * pxPerMin;
  }, [now, startDate, endDate, totalMinutes]);

  const handleEmptyClick = (clientY: number) => {
    if (!onEmptySlotClick || !gridRef.current) return;
    const rect = gridRef.current.getBoundingClientRect();
    const offsetY = clientY - rect.top;
    const mins = clamp(Math.round(offsetY / pxPerMin), 0, totalMinutes);
    const dt = new Date(startDate.getTime() + mins * 60000);
    onEmptySlotClick(dt);
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="text-lg font-semibold text-neutral-900">
          {startDate.toLocaleDateString(undefined, {
            weekday: "long",
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </div>
        <div className="text-right text-sm text-neutral-600">
          <div>
            {String(workingHours.startHour).padStart(2, "0")}:00 —{" "}
            {String(workingHours.endHour).padStart(2, "0")}:00
          </div>
          {subtitle && (
            <div className="mt-0.5 text-xs text-neutral-500">
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Grid */}
      <div
        ref={gridRef}
        className="relative border border-neutral-200 rounded-xl bg-white shadow-sm overflow-y-auto max-h-[70vh]"
        style={{ height: totalMinutes * pxPerMin }}
        onClick={(e) => handleEmptyClick(e.clientY)}
        role="grid"
        aria-label="Day calendar grid"
      >
        {/* Hour lines */}
        {hours.map((h) => {
          const minsFromStart = (h - workingHours.startHour) * 60;
          const y = clamp(minsFromStart * pxPerMin, 0, totalMinutes * pxPerMin);
          return (
            <div
              key={h}
              className="absolute left-0 right-0 border-t border-neutral-100"
              style={{ top: y }}
              aria-hidden
            >
              <div className="absolute -top-3 left-2 text-[11px] text-neutral-500 bg-white px-1">
                {String(h).padStart(2, "0")}:00
              </div>
            </div>
          );
        })}

        {/* Current time line */}
        {nowLineTop !== null && (
          <div
            className="absolute left-0 right-0 border-t border-rose-400"
            style={{ top: nowLineTop }}
            aria-hidden
          >
            <div className="absolute -top-1 left-1 w-2 h-2 rounded-full bg-rose-500" />
          </div>
        )}

        {/* Events */}
        {normalizedEvents.map(({ ev, topPx, heightPx }) => {
          // pick base color by status
          const colorClasses: Record<string, string> = {
            booked: "bg-amber-50 border-amber-300",
            rescheduled: "bg-sky-50 border-sky-300",
            no_show: "bg-rose-50 border-rose-300",
            cancelled: "bg-neutral-50 border-neutral-300",
            completed: "bg-green-50 border-green-300",
          };
          const cls =
            colorClasses[ev.status] ?? "bg-neutral-50 border-neutral-300";

          return (
            <button
              key={ev.id}
              type="button"
              className={`absolute left-2 right-2 rounded-lg border shadow-sm text-left px-3 py-2 hover:brightness-95 transition ${cls}`}
              style={{ top: topPx, height: heightPx }}
              onClick={(e) => {
                e.stopPropagation();
                if (onEventClick) onEventClick(ev);
              }}
            >
              <div className="text-sm font-medium truncate">{ev.label}</div>
              <div className="text-[11px] text-neutral-500">
                {ev.start.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}{" "}
                —{" "}
                {ev.end.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
