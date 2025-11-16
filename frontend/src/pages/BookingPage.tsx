import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getAvailability,
  createBooking,
  getMyBookings,
  type Booking,
  isBlockedError,
  isWeeklyLimitError,
} from '../api/bookings';
import api from '../api/client';
import { getServices, type Service } from '../api/public';
import { formatBerlinTime } from '../utils/datetime';
import { isClosedDateYmd } from '../utils/closedDaysNRW';

type Barber = { _id: string; name: string };

function todayYMD(): string {
  const d = new Date();
  const tz = 'Europe/Berlin';
  const yyyy = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
  }).format(d);
  const mm = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    month: '2-digit',
  }).format(d);
  const dd = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    day: '2-digit',
  }).format(d);
  return `${yyyy}-${mm}-${dd}`;
}

const fmtTime = (iso: string) => formatBerlinTime(iso);

function within7DaysBerlin(iso: string): boolean {
  const now = new Date();
  const t = new Date(iso);
  const diffMs = t.getTime() - now.getTime();
  return diffMs >= 0 && diffMs <= 7 * 24 * 60 * 60 * 1000;
}

export default function BookingPage() {
  const navigate = useNavigate();

  // 🚫 Prevent admin from using booking UI
  useEffect(() => {
    const role =
      (localStorage.getItem('role') as 'user' | 'admin' | null) || null;
    if (role === 'admin') {
      navigate('/admin/bookings', { replace: true });
    }
  }, [navigate]);

  // Data sources
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  // Selections
  const [barberId, setBarberId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState(todayYMD());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);

  // NEW: optional notes
  const [notes, setNotes] = useState<string>('');

  // Derived service info
  const chosenService = useMemo(
    () => services.find((s) => s._id === serviceId) || null,
    [services, serviceId],
  );
  const durationMin = chosenService?.durationMin ?? 30;
  const serviceName = chosenService?.name ?? 'Haircut';

  // Availability & booking state
  const [slots, setSlots] = useState<{ start: string; end: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<
    | { kind: 'ok'; text: string }
    | { kind: 'err'; text: string; reason?: 'blocked' | 'weekly' }
    | null
  >(null);

  // Check if the user already has an active booking within 7 days
  const [myActiveWithin7d, setMyActiveWithin7d] = useState<Booking | null>(
    null,
  );

  const isBootstrapping = !barbers.length || !services.length;

  // Is the currently chosen date a closed day?
  const isClosedDateSelected = useMemo(
    () => isClosedDateYmd(date),
    [date],
  );

  // Load barbers + services + my bookings (for UX gating)
  useEffect(() => {
    (async () => {
      const [{ data: b }, svc, mine] = await Promise.all([
        api.get<{ barbers: Barber[] }>('/api/barbers'),
        getServices(),
        getMyBookings().catch(() => [] as Booking[]), // ignore errors here
      ]);
      setBarbers(b.barbers);
      setServices(svc);
      if (b.barbers[0]?._id) setBarberId(b.barbers[0]._id);
      if (svc[0]?._id) setServiceId(svc[0]._id);

      const active = (mine as Booking[]).find(
        (bk) =>
          (bk.status === 'booked' || bk.status === 'rescheduled') &&
          within7DaysBerlin(bk.startsAt),
      );
      setMyActiveWithin7d(active ?? null);
    })().catch(() => {
      setFeedback({
        kind: 'err',
        text: 'Failed to load barbers/services. Please refresh the page.',
        reason: undefined,
      });
    });
  }, []);

  async function handleCheck() {
    if (!barberId || !date || !durationMin) return;

    // Block weekends & NRW holidays on the client too
    if (isClosedDateYmd(date)) {
      setSlots([]);
      setFeedback({
        kind: 'err',
        text:
          'We are closed on weekends and public holidays in NRW. ' +
          'Please choose another date.',
      });
      return;
    }

    setLoading(true);
    setFeedback(null);
    setSelectedSlot(null);
    try {
      const next = await getAvailability({ barberId, date, durationMin });
      setSlots(next);
      if (!next.length) {
        setFeedback({
          kind: 'err',
          text: 'No slots for that date. Try another time or service.',
        });
      }
    } catch {
      setFeedback({ kind: 'err', text: 'Could not fetch availability.' });
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm() {
    if (!selectedSlot || !barberId) return;
    setLoading(true);
    setFeedback(null);
    try {
      const booking = await createBooking({
        barberId,
        serviceName,
        durationMin,
        startsAt: selectedSlot,
        notes: notes.trim() ? notes.trim() : undefined,
      });
      setFeedback({
        kind: 'ok',
        text: `Booking confirmed for ${fmtTime(
          booking.startsAt,
        )} (${serviceName}, ${durationMin} min).`,
      });
      setSlots((prev) => prev.filter((s) => s.start !== selectedSlot));
      setSelectedSlot(null);
      setNotes('');

      // redirect after short delay
      setTimeout(() => navigate('/dashboard', { replace: true }), 2500);
    } catch (err) {
      if (isBlockedError(err)) {
        setFeedback({
          kind: 'err',
          text:
            'Your online booking is restricted due to repeated no-shows. Please call the barbershop to book.',
          reason: 'blocked',
        });
      } else if (isWeeklyLimitError(err)) {
        setFeedback({
          kind: 'err',
          text:
            'You can only have one active booking within 7 days. Please reschedule your existing booking.',
          reason: 'weekly',
        });
      } else {
        setFeedback({
          kind: 'err',
          text: 'Booking failed. Please try again.',
        });
      }
    } finally {
      setLoading(false);
    }
  }

  const showRescheduleCta = Boolean(myActiveWithin7d);

  return (
    <section className="mt-8 space-y-4">
      {/* Page heading */}
      <header className="px-1 md:px-0">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Book an appointment
        </h1>
        <p className="text-sm text-neutral-600 mt-1">
          Choose your barber, service, and time. You’ll see a summary before
          confirming.
        </p>
      </header>

      <div className="mt-4 grid gap-5 md:gap-8 md:grid-cols-[minmax(0,1fr)_320px] items-start">
        {/* LEFT (form / controls) */}
        <section className="rounded-2xl bg-white border border-neutral-200 shadow-sm overflow-hidden">
          <div className="bg-neutral-900 text-white px-4 py-3 md:px-6 md:py-4 flex items-center justify-between">
            <div>
              <h2 className="text-base md:text-lg font-semibold tracking-tight">
                Book your appointment
              </h2>
              <p className="mt-0.5 text-xs text-neutral-300 hidden sm:block">
                Step 1: Select barber, service and date. Step 2: Pick a time
                slot.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-[11px] text-neutral-300">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: '#f59e0b' }}
              />
              live availability
            </span>
          </div>

          <div className="p-4 md:p-6 space-y-6">
            {/* Top selectors */}
            <div className="grid gap-3 md:gap-4 md:grid-cols-3">
              {/* Barber */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Barber
                </label>
                <select
                  value={barberId}
                  onChange={(e) => {
                    setBarberId(e.target.value);
                    setSelectedSlot(null);
                  }}
                  disabled={isBootstrapping || showRescheduleCta}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-neutral-100 disabled:text-neutral-400"
                >
                  {barbers.length === 0 && <option>Loading…</option>}
                  {barbers.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Service */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Service
                </label>
                <select
                  value={serviceId}
                  onChange={(e) => {
                    setServiceId(e.target.value);
                    setSelectedSlot(null);
                  }}
                  disabled={isBootstrapping || showRescheduleCta}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-neutral-100 disabled:text-neutral-400"
                >
                  {services.length === 0 && <option>Loading…</option>}
                  {services.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} — {s.durationMin} min · €{s.price}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  min={todayYMD()}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setSelectedSlot(null);
                  }}
                  disabled={showRescheduleCta}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-neutral-100 disabled:text-neutral-400"
                />
                <div className="mt-1 flex gap-2 text-xs text-neutral-500">
                  <button
                    type="button"
                    className="px-2 py-0.5 rounded-full border border-neutral-200 hover:bg-neutral-100"
                    onClick={() => {
                      const t = todayYMD();
                      setDate(t);
                      setSelectedSlot(null);
                    }}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    className="px-2 py-0.5 rounded-full border border-neutral-200 hover:bg-neutral-100"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate() + 1);
                      const yyyy = d.getFullYear();
                      const mm = String(d.getMonth() + 1).padStart(2, '0');
                      const dd = String(d.getDate()).padStart(2, '0');
                      setDate(`${yyyy}-${mm}-${dd}`);
                      setSelectedSlot(null);
                    }}
                  >
                    Tomorrow
                  </button>
                </div>
                {isClosedDateSelected && (
                  <p className="mt-1 text-xs text-rose-600">
                    We are closed on weekends and public holidays in NRW. Please
                    choose another date.
                  </p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Any preference or note for the barber…"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <div className="mt-1 text-xs text-neutral-500 text-right">
                {notes.length}/500
              </div>
            </div>

            {/* Actions + feedback */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
              {!showRescheduleCta && (
                <button
                  onClick={handleCheck}
                  disabled={
                    loading ||
                    isBootstrapping ||
                    !barberId ||
                    !serviceId ||
                    !date ||
                    isClosedDateSelected
                  }
                  className="inline-flex items-center justify-center rounded-lg bg-amber-400 text-neutral-900 font-semibold px-4 py-2 text-sm hover:bg-amber-300 transition disabled:opacity-60"
                >
                  {loading ? 'Loading…' : 'Check availability'}
                </button>
              )}

              {showRescheduleCta && (
                <a
                  href="/dashboard"
                  className="inline-flex items-center justify-center rounded-lg border border-amber-300 text-neutral-900 font-semibold px-4 py-2 text-sm hover:bg-amber-50 transition"
                  title="You already have an active booking in the next 7 days. Reschedule it instead."
                >
                  Go to My Bookings to reschedule
                </a>
              )}

              {feedback && (
                <div
                  className={`text-sm rounded-lg px-3 py-2 border max-w-full sm:max-w-md ${
                    feedback.kind === 'ok'
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {feedback.text}{' '}
                  {feedback.kind === 'err' && feedback.reason === 'blocked' && (
                    <a
                      href="tel:+490000000000"
                      className="underline underline-offset-4 ml-1"
                    >
                      Call now
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Slots */}
            {!showRescheduleCta && (
              <div className="mt-2">
                <h2 className="text-sm font-medium text-neutral-700 mb-2">
                  Available slots
                </h2>
                {!slots.length && !loading && (
                  <p className="text-neutral-500 text-sm">
                    Choose options above, then tap{' '}
                    <span className="font-medium">Check availability</span> to
                    see times.
                  </p>
                )}
                {loading && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-10 rounded-lg bg-neutral-200 animate-pulse"
                      />
                    ))}
                  </div>
                )}
                {!loading && !!slots.length && (
                  <div className="max-h-64 overflow-y-auto pr-1">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {slots.map((s) => {
                        const active = selectedSlot === s.start;
                        return (
                          <button
                            key={s.start}
                            onClick={() => setSelectedSlot(s.start)}
                            className={`rounded-lg border px-3 py-2 text-sm transition ${
                              active
                                ? 'bg-amber-100 border-amber-300 text-neutral-900'
                                : 'bg-white border-neutral-300 hover:bg-amber-50 text-neutral-800'
                            }`}
                            disabled={loading}
                            title={`${fmtTime(s.start)}–${fmtTime(s.end)}`}
                            type="button"
                          >
                            {fmtTime(s.start)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT (summary / CTA) */}
        <aside className="md:sticky md:top-20 h-max rounded-2xl bg-white border border-neutral-200 shadow-sm p-4 md:p-6">
          <h3 className="text-base font-semibold text-neutral-900">
            Summary
          </h3>
          <p className="mt-1 text-xs text-neutral-500 md:text-[13px]">
            Double-check the details, then confirm your booking.
          </p>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-neutral-600">Barber</dt>
              <dd className="font-medium text-neutral-900 text-right">
                {barbers.find((b) => b._id === barberId)?.name ?? '—'}
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
                {selectedSlot ? fmtTime(selectedSlot) : '—'}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-neutral-600">Price</dt>
              <dd className="font-medium text-neutral-900 text-right">
                €{chosenService?.price ?? 0}
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

          {!showRescheduleCta && (
            <button
              onClick={handleConfirm}
              disabled={
                loading || !selectedSlot || !barberId || !serviceId
              }
              className="mt-5 w-full rounded-lg bg-neutral-900 text-white font-semibold py-2 text-sm hover:bg-neutral-800 transition disabled:opacity-50"
            >
              {loading ? 'Booking…' : 'Confirm booking'}
            </button>
          )}

          {showRescheduleCta && (
            <a
              href="/dashboard"
              className="mt-5 inline-flex w-full items-center justify-center rounded-lg bg-neutral-900 text-white font-semibold py-2 text-sm hover:bg-neutral-800 transition"
            >
              Go to My Bookings to reschedule
            </a>
          )}
          <p className="mt-3 text-xs text-neutral-500">
            You’ll see your appointment soon in{' '}
            <span className="font-medium">My Bookings</span>.
          </p>
        </aside>
      </div>
    </section>
  );
}
