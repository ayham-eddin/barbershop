import { api, resetDb, createAdminToken } from './helpers';

interface ServiceOut {
  _id: string;
  name: string;
  durationMin: number;
  price: number;
}

interface BarberOut {
  _id: string;
  name: string;
  workingHours: { day: number; start: string; end: string }[];
  services: ServiceOut[];
}

interface SlotsOut {
  slots: { start: string; end: string }[];
}

interface TimeoffOut {
  _id: string;
  barberId: string;
  start: string;
  end: string;
  reason?: string;
}

/**
 * Pick a future weekday date string (YYYY-MM-DD),
 * at least `minDaysAhead` days from now, ensuring Mon–Fri (day 1..5).
 */
function futureWeekdayISO(minDaysAhead = 10): string {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  // search up to a week beyond minDaysAhead for a weekday
  for (let i = minDaysAhead; i < minDaysAhead + 7; i += 1) {
    const cand = new Date(d.getTime());
    cand.setUTCDate(cand.getUTCDate() + i);
    const day = cand.getUTCDay(); // 0..6 (Sun=0)
    if (day >= 1 && day <= 5) {
      const y = cand.getUTCFullYear();
      const m = String(cand.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(cand.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    }
  }
  // Fallback: just return minDaysAhead even if weekend (shouldn't happen)
  const fallback = new Date(d.getTime());
  fallback.setUTCDate(fallback.getUTCDate() + minDaysAhead);
  const y = fallback.getUTCFullYear();
  const m = String(fallback.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(fallback.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/** Build an ISO in UTC on the given YYYY-MM-DD at HH:MM */
function onDateTimeUTC(dateYmd: string, hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number);
  const [Y, M, D] = dateYmd.split('-').map(Number);
  const dt = new Date(Date.UTC(Y, (M ?? 1) - 1, D ?? 1, h ?? 0, m ?? 0, 0, 0));
  return dt.toISOString();
}

describe('Slots & time-off interactions', () => {
  let adminToken: string;
  let barberId: string;
  let haircut: ServiceOut;

  beforeEach(async () => {
    await resetDb();
    adminToken = await createAdminToken({});

    // Ensure at least one service exists
    const sRes = await api.post('/api/admin/services')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Haircut', durationMin: 30, price: 20 })
      .expect(201);

    haircut = (sRes.body as { service: ServiceOut }).service;

    // Create a barber with Mon–Fri 09:00–17:00 and attach the service
    const createBarberRes = await api.post('/api/admin/barbers')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Hamza',
        workingHours: [
          { day: 1, start: '09:00', end: '17:00' },
          { day: 2, start: '09:00', end: '17:00' },
          { day: 3, start: '09:00', end: '17:00' },
          { day: 4, start: '09:00', end: '17:00' },
          { day: 5, start: '09:00', end: '17:00' },
        ],
      })
      .expect(201);

    const barber = (createBarberRes.body as { barber: BarberOut }).barber;
    barberId = barber._id;

    const patchRes = await api.patch(`/api/admin/barbers/${barberId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ services: [haircut._id] })
      .expect(200);

    const patched = (patchRes.body as { barber: BarberOut }).barber;
    expect(patched.services.map((s) => s._id)).toContain(haircut._id);
  });

  it('returns slots; then time-off removes overlapping slots', async () => {
    // Pick a safe future weekday far enough ahead to avoid booking buffer
    const date = futureWeekdayISO(10);

    // initial slots for 30 minutes duration
    const slotsRes = await api
      .get(`/api/barbers/${barberId}/slots?date=${date}&duration=30`)
      .expect(200);
    const slots1 = (slotsRes.body as SlotsOut).slots;
    expect(Array.isArray(slots1)).toBe(true);
    expect(slots1.length).toBeGreaterThan(0);

    // create a time-off that blocks 09:30–10:30 UTC on that day
    const startIso = onDateTimeUTC(date, '09:30');
    const endIso = onDateTimeUTC(date, '10:30');

    const toRes = await api.post('/api/admin/timeoff')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        barberId,
        start: startIso,
        end: endIso,
        reason: 'Test block',
      })
      .expect(201);

    const timeoff = (toRes.body as { timeoff: TimeoffOut }).timeoff;
    expect(timeoff.barberId).toBe(barberId);

    // slots should now exclude anything overlapping that range
    const slotsRes2 = await api
      .get(`/api/barbers/${barberId}/slots?date=${date}&duration=30`)
      .expect(200);
    const slots2 = (slotsRes2.body as SlotsOut).slots;

    const blockedStart = new Date(startIso).getTime();
    const blockedEnd = new Date(endIso).getTime();

    const overlapsBlocked = slots2.some(({ start, end }) => {
      const s = new Date(start).getTime();
      const e = new Date(end).getTime();
      return s < blockedEnd && e > blockedStart;
    });

    expect(overlapsBlocked).toBe(false);
  });
});
