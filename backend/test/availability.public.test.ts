// test/availability.public.test.ts
import { api, resetDb, createAdminToken } from './helpers';

function readPath(obj: unknown, path: string[]): unknown {
  let cur: unknown = obj;
  for (const key of path) {
    if (typeof cur !== 'object' || cur === null || !(key in (cur as Record<string, unknown>))) {
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
function readArray(obj: unknown, path: string[]): unknown[] {
  const v = readPath(obj, path);
  if (!Array.isArray(v)) throw new Error(`Expected array at ${path.join('.')}`);
  return v;
}
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

describe('Public availability endpoint', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('returns 400 for bad query (missing params)', async () => {
    // Omit all required params so typeof !== 'string' check triggers 400
    await api.get('/api/bookings/availability')
      .query({})
      .expect(400);

    // Also test missing one param
    await api.get('/api/bookings/availability')
      .query({ barberId: 'abc' }) // missing date & durationMin
      .expect(400);
  });

  it('returns slots for a valid query', async () => {
    const admin = await createAdminToken({});

    // Seed a service
    const sRes = await api.post('/api/admin/services')
      .set('Authorization', `Bearer ${admin}`)
      .send({ name: 'Haircut', durationMin: 30, price: 20 })
      .expect(201);
    const serviceId = readString(sRes.body, ['service', '_id']);

    // Seed a barber (Mon–Fri 09:00–17:00) with that service
    const bRes = await api.post('/api/admin/barbers')
      .set('Authorization', `Bearer ${admin}`)
      .send({
        name: 'Barber Public',
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

    const date = futureWeekdayYMD(3);

    const avail = await api.get('/api/bookings/availability')
      .query({ barberId, date, durationMin: '30' })
      .expect(200);

    const slots = readArray(avail.body, ['slots']);
    expect(slots.length).toBeGreaterThan(0);
  });
});
