// test/booking.cancel.permissions.test.ts
import { api, resetDb, createAdminToken } from './helpers';

function readPath(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (
      typeof cur !== 'object' ||
      cur === null ||
      !(key in (cur as Record<string, unknown>))
    ) {
      throw new Error(`Missing path: ${path.join('.')}`);
    }
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}
function readString(obj: unknown, path: string[]): string {
  const v = readPath(obj, path);
  if (typeof v !== 'string') throw new Error(`Expected string at ${path.join('.')}`);
  return v;
}

async function registerAndLogin(email: string, password = 'secret123'): Promise<string> {
  const r = await api.post('/api/auth/register').send({ name: 'User', email, password });
  if (r.status !== 201) {
    throw new Error(`register failed: ${r.status} ${JSON.stringify(r.body)}`);
  }
  const login = await api.post('/api/auth/login').send({ email, password }).expect(200);
  return readString(login.body, ['token']);
}

// Find a future weekday in YYYY-MM-DD
function futureWeekdayYMD(minDaysAhead = 3): string {
  const base = new Date();
  base.setUTCHours(0, 0, 0, 0);
  for (let i = minDaysAhead; i < minDaysAhead + 7; i += 1) {
    const d = new Date(base);
    d.setUTCDate(d.getUTCDate() + i);
    const day = d.getUTCDay();
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

describe('Booking cancel permissions', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('does not allow a different user to cancel someone else\'s booking (404)', async () => {
    const admin = await createAdminToken({});

    // Seed service (admin)
    const sRes = await api
      .post('/api/admin/services')
      .set('Authorization', `Bearer ${admin}`)
      .send({ name: 'Haircut', durationMin: 30, price: 20 })
      .expect(201);
    const serviceId = readString(sRes.body, ['service', '_id']);

    // Seed barber (admin)
    const bRes = await api
      .post('/api/admin/barbers')
      .set('Authorization', `Bearer ${admin}`)
      .send({
        name: 'Barber B',
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

    // User A books a slot
    const tokenA = await registerAndLogin('permA@example.com');
    const date = futureWeekdayYMD(3);

    // NEW endpoint for availability
    const availRes = await api
      .get('/api/bookings/availability')
      .query({ barberId, date, durationMin: 30 })
      .expect(200);

    const slots = readPath(availRes.body, ['slots']);
    if (!Array.isArray(slots) || slots.length === 0) throw new Error('no slots');
    const startsAt = readString(slots[0], ['start']);

    const bookRes = await api
      .post('/api/bookings')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        barberId,
        serviceName: 'Haircut',
        durationMin: 30,
        startsAt,
      })
      .expect(201);
    const bookingId = readString(bookRes.body, ['booking', '_id']);

    // User B tries to cancel A's booking -> 404
    const tokenB = await registerAndLogin('permB@example.com');
    await api
      .post(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${tokenB}`)
      .expect(404);
  });
});
