import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAvailability, createBooking } from '../api/bookings';
import api from '../api/client';
import { getServices, type Service } from '../api/public';

type Barber = { _id: string; name: string };

function todayYMD(): string {
  const d = new Date();
  const tz = 'Europe/Berlin';
  const yyyy = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric' }).format(d);
  const mm = new Intl.DateTimeFormat('en-CA', { timeZone: tz, month: '2-digit' }).format(d);
  const dd = new Intl.DateTimeFormat('en-CA', { timeZone: tz, day: '2-digit' }).format(d);
  return `${yyyy}-${mm}-${dd}`;
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Berlin',
  });
}

export default function BookingPage() {
  const navigate = useNavigate();

  // 🚫 Prevent admin from using booking UI
  useEffect(() => {
    const role = (localStorage.getItem('role') as 'user' | 'admin' | null) || null;
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
  const [feedback, setFeedback] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  // Load barbers + services
  useEffect(() => {
    (async () => {
      const [{ data: b }, svc] = await Promise.all([
        api.get<{ barbers: Barber[] }>('/api/barbers'),
        getServices(),
      ]);
      setBarbers(b.barbers);
      setServices(svc);
      if (b.barbers[0]?._id) setBarberId(b.barbers[0]._id);
      if (svc[0]?._id) setServiceId(svc[0]._id);
    })().catch(() => {
      setFeedback({ kind: 'err', text: 'Failed to load barbers/services.' });
    });
  }, []);

  async function handleCheck() {
    if (!barberId || !date || !durationMin) return;
    setLoading(true);
    setFeedback(null);
    setSelectedSlot(null);
    try {
      const next = await getAvailability({ barberId, date, durationMin });
      setSlots(next);
      if (!next.length) {
        setFeedback({ kind: 'err', text: 'No slots for that date. Try another time or service.' });
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
      });
      setFeedback({
        kind: 'ok',
        text: `Booking confirmed for ${fmtTime(booking.startsAt)} (${serviceName}, ${durationMin} min).`,
      });
      setSlots((prev) => prev.filter((s) => s.start !== selectedSlot));
      setSelectedSlot(null);

      // ✅ Redirect after short delay
      setTimeout(() => navigate('/dashboard', { replace: true }), 2500);
    } catch {
      setFeedback({ kind: 'err', text: 'Booking failed. Please try again.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid md:grid-cols-[1fr_320px] gap-6 md:gap-8 mt-10">
      {/* LEFT */}
      <section className="rounded-2xl bg-white border border-neutral-200 shadow-sm overflow-hidden">
        <div className="bg-neutral-900 text-white px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight">Book your appointment</h1>
          <span className="inline-flex items-center gap-2 text-xs text-neutral-300">
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            live availability
          </span>
        </div>

        <div className="p-6 space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Barber */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Barber</label>
              <select
                value={barberId}
                onChange={(e) => { setBarberId(e.target.value); setSelectedSlot(null); }}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {barbers.map((b) => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
            </div>

            {/* Service */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Service</label>
              <select
                value={serviceId}
                onChange={(e) => { setServiceId(e.target.value); setSelectedSlot(null); }}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {services.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name} — {s.durationMin} min · €{s.price}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                min={todayYMD()}
                onChange={(e) => { setDate(e.target.value); setSelectedSlot(null); }}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleCheck}
              disabled={loading || !barberId || !serviceId || !date}
              className="inline-flex items-center rounded-lg bg-amber-400 text-neutral-900 font-semibold px-4 py-2 hover:bg-amber-300 transition disabled:opacity-60"
            >
              {loading ? 'Loading…' : 'Check availability'}
            </button>

            {feedback && (
              <div
                className={`text-sm rounded-lg px-3 py-2 border ${
                  feedback.kind === 'ok'
                    ? 'bg-green-50 text-green-700 border-green-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {feedback.text}
              </div>
            )}
          </div>

          {/* Slots */}
          <div className="mt-2">
            <h2 className="text-sm font-medium text-neutral-700 mb-2">Available slots</h2>
            {!slots.length && !loading && (
              <p className="text-neutral-500 text-sm">
                Choose options above, then click <span className="font-medium">Check availability</span>.
              </p>
            )}
            {loading && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-10 rounded-lg bg-neutral-200 animate-pulse" />
                ))}
              </div>
            )}
            {!loading && !!slots.length && (
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
            )}
          </div>
        </div>
      </section>

      {/* RIGHT */}
      <aside className="md:sticky md:top-20 h-max rounded-2xl bg-white border border-neutral-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-neutral-900">Summary</h3>
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-neutral-600">Barber</dt>
            <dd className="font-medium text-neutral-900">{barbers.find((b) => b._id === barberId)?.name ?? '—'}</dd></div>
          <div className="flex justify-between"><dt className="text-neutral-600">Service</dt>
            <dd className="font-medium text-neutral-900">{serviceName} ({durationMin} min)</dd></div>
          <div className="flex justify-between"><dt className="text-neutral-600">Date</dt>
            <dd className="font-medium text-neutral-900">{date || '—'}</dd></div>
          <div className="flex justify-between"><dt className="text-neutral-600">Time</dt>
            <dd className="font-medium text-neutral-900">{selectedSlot ? fmtTime(selectedSlot) : '—'}</dd></div>
          <div className="flex justify-between"><dt className="text-neutral-600">Price</dt>
            <dd className="font-medium text-neutral-900">€{chosenService?.price ?? 0}</dd></div>
        </dl>

        <button
          onClick={handleConfirm}
          disabled={loading || !selectedSlot || !barberId || !serviceId}
          className="mt-5 w-full rounded-lg bg-neutral-900 text-white font-semibold py-2 hover:bg-neutral-800 transition disabled:opacity-50"
        >
          {loading ? 'Booking…' : 'Confirm booking'}
        </button>

        <p className="mt-3 text-xs text-neutral-500">
          You’ll see your appointment soon in <span className="font-medium">My Bookings</span>.
        </p>
      </aside>
    </div>
  );
}
