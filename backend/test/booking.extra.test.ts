// test/booking.extra.test.ts
import { api, resetDb, createAdminToken } from './helpers';

/* ------------ safe readers (no any / no unsafe access) ------------ */
function readPath(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (
      typeof cur !== 'object' ||
      cur === null ||
      !(key in (cur as Record<string, unknown>))
    ) {
      throw new Error(`Response body missing path: ${path.join('.')}`);
    }
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}
function readString(obj: unknown, path: string[]): string {
  const v = readPath(obj, path);
  if (typeof v !== 'string') {
    throw new Error(`Expected string at ${path.join('.')}`);
  }
  return v;
}
function readArray(obj: unknown, path: string[]): unknown[] {
  const v = readPath(obj, path);
  if (!Array.isArray(v)) {
    throw new Error(`Expected array at ${path.join('.')}`);
  }
  return v;
}

/* ------------------------- date utilities (UTC) ------------------------ */
function futureWeekdayYMD(minDaysAhead = 3): string {
  const base = new Date();
  base.setUTCHours(0, 0, 0, 0);
  for (let i = minDaysAhead; i < minDaysAhead + 7; i += 1) {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + i);
    const day = d.getUTCDay(); // Mon..Fri => 1..5
    if (day >= 1 && day <= 5) {
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(d.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${dd}`;
    }
  }
  const f = new Date(base);
  f.setUTCDate(f.getUTCDate() + minDaysAhead);
  const y = f.getUTCFullYear();
  const m = String(f.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(f.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

/* ----------------------- auth + seed test helpers ---------------------- */
async function registerAndLogin(email: string, password: string): Promise<string> {
  const r = await api.post('/api/auth/register')
    .send({ name: 'User', email, password });
  expect(r.status).toBe(201);

  const res = await api.post('/api/auth/login')
    .send({ email, password })
    .expect(200);

  return readString(res.body, ['token']);
}

/** Create a *fixed* service "Haircut" and a barber exposing it; return ids */
async function seedBarberWithHaircut(
  adminToken: string,
): Promise<{ serviceId: string; barberId: string; serviceName: 'Haircut' }> {
  const serviceName = 'Haircut';

  const sRes = await api.post('/api/admin/services')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: serviceName, durationMin: 30, price: 20 })
    .expect(201);

  const serviceId = readString(sRes.body, ['service', '_id']);

  const bRes = await api.post('/api/admin/barbers')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Barber A',
      workingHours: [
        { day: 1, start: '09:00', end: '17:00' },
        { day: 2, start: '09:00', end: '17:00' },
        { day: 3, start: '09:00', end: '17:00' },
        { day: 4, start: '09:00', end: '17:00' },
        { day: 5, start: '09:00', end: '17:00' },
      ],
      services: [serviceId],
    })
    .expect(201);

  const barberId = readString(bRes.body, ['barber', '_id']);
  return { serviceId, barberId, serviceName };
}

/** Get first available slot (ISO) for given barber/date/duration */
async function getFirstSlotISO(
  barberId: string,
  dateYmd: string,
  durationMin: number,
): Promise<string> {
  const slotsRes = await api
    .get(`/api/barbers/${barberId}/slots`)
    .query({ date: dateYmd, duration: durationMin })
    .expect(200);

  const arr = readArray(slotsRes.body, ['slots']);
  if (arr.length === 0) throw new Error('No available slots returned');

  const first = arr[0];
  if (
    typeof first !== 'object' ||
    first === null ||
    typeof (first as Record<string, unknown>).start !== 'string'
  ) {
    throw new Error('Malformed slot object');
  }
  return (first as Record<string, string>).start;
}

/** Helper to create booking with debug logging on failure */
async function createBookingWithDebug(payload: {
  token: string;
  barberId: string;
  serviceName: string;
  durationMin: number;
  startsAt: string;
}) {
  const res = await api.post('/api/bookings')
    .set('Authorization', `Bearer ${payload.token}`)
    .send({
      barberId: payload.barberId,
      serviceName: payload.serviceName,
      durationMin: payload.durationMin,
      startsAt: payload.startsAt,
    });

  if (res.status !== 201) {
    // eslint-disable-next-line no-console
    console.log('Create booking failed:', res.status, res.body);
  }
  expect(res.status).toBe(201);
  return res;
}

/* =================== TESTS =================== */

describe('BookingController – edge cases & admin', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('prevents overlapping bookings (409)', async () => {
    const admin = await createAdminToken({});
    const { barberId, serviceName } = await seedBarberWithHaircut(admin);
    const token = await registerAndLogin('u1@example.com', 'secret123');

    const date = futureWeekdayYMD(3);
    const startsAt = await getFirstSlotISO(barberId, date, 30);

    await createBookingWithDebug({
      token,
      barberId,
      serviceName,
      durationMin: 30,
      startsAt,
    });

    await api.post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({ barberId, serviceName, durationMin: 30, startsAt })
      .expect(409);
  });

  it('allows cancelling a booking (200) and fails on re-cancel (404)', async () => {
    const admin = await createAdminToken({});
    const { barberId, serviceName } = await seedBarberWithHaircut(admin);
    const token = await registerAndLogin('u2@example.com', 'secret123');

    const date = futureWeekdayYMD(4);
    const startsAt = await getFirstSlotISO(barberId, date, 30);

    const bookRes = await createBookingWithDebug({
      token,
      barberId,
      serviceName,
      durationMin: 30,
      startsAt,
    });

    const bookingId = readString(bookRes.body, ['booking', '_id']);

    await api.post(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await api.post(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
  });

  it('lets user and admin list bookings', async () => {
    const admin = await createAdminToken({});
    const { barberId, serviceName } = await seedBarberWithHaircut(admin);
    const token = await registerAndLogin('u3@example.com', 'secret123');

    const date = futureWeekdayYMD(5);
    const startsAt = await getFirstSlotISO(barberId, date, 20);

    await createBookingWithDebug({
      token,
      barberId,
      serviceName,
      durationMin: 20,
      startsAt,
    });

    const my = await api.get('/api/bookings/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const myBookings = readArray(my.body, ['bookings']);
    expect(myBookings.length).toBeGreaterThan(0);

    const all = await api.get('/api/bookings/admin/all')
      .set('Authorization', `Bearer ${admin}`)
      .expect(200);
    const allBookings = readArray(all.body, ['bookings']);
    expect(allBookings.length).toBeGreaterThan(0);
  });
});
