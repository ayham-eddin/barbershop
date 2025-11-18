/* eslint-disable max-len */
import { api, resetDb, createAdminToken, createUserToken } from './helpers';
import { User } from '@src/models/User';

/* ------------ safe readers (no any / no unsafe access) ------------ */
const readPath = (obj: unknown, path: string[]): unknown => {
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
};

const readString = (obj: unknown, path: string[]): string => {
  const v = readPath(obj, path);
  if (typeof v !== 'string') {
    throw new Error(`Expected string at ${path.join('.')}`);
  }
  return v;
};

const readArray = (obj: unknown, path: string[]): unknown[] => {
  const v = readPath(obj, path);
  if (!Array.isArray(v)) {
    throw new Error(`Expected array at ${path.join('.')}`);
  }
  return v;
};

/* ------------------------- date utilities (UTC) ------------------------ */
/** Find a weekday (Mon–Fri) at least `minDaysAhead` days in the future. */
const futureWeekdayYMD = (minDaysAhead = 3): string => {
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
};

/* ----------------------- seed helpers (admin) ---------------------- */
const seedBarberWithHaircut = async (
  adminToken: string,
): Promise<{ serviceId: string; barberId: string; serviceName: 'Haircut' }> => {
  const serviceName = 'Haircut';

  const sRes = await api.post('/api/admin/services')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ name: serviceName, durationMin: 30, price: 20 })
    .expect(201);

  const serviceId = readString(sRes.body, ['service', '_id']);

  const bRes = await api.post('/api/admin/barbers')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Barber Blocking',
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
};

/** Get first available slot (ISO) for given barber/date/duration */
const getFirstSlotISO = async (
  barberId: string,
  dateYmd: string,
  durationMin: number,
): Promise<string> => {
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
};

/** Helper to create booking with debug logging on failure */
const createBookingWithDebug = async (payload: {
  token: string;
  barberId: string;
  serviceName: string;
  durationMin: number;
  startsAt: string;
}) => {
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
};

/* =================== TESTS =================== */

describe('Booking – blocking, weekly limit, reschedule & no-show', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('rejects booking when user already has an active booking in the 7-day window (409)', async () => {
    const admin = await createAdminToken({});
    const { barberId, serviceName } = await seedBarberWithHaircut(admin);

    const userToken = await createUserToken({
      email: 'limit1@example.com',
      password: 'secret123',
    });

    const date = futureWeekdayYMD(3);
    const startsAt = await getFirstSlotISO(barberId, date, 30);

    // first booking in window -> ok
    await createBookingWithDebug({
      token: userToken,
      barberId,
      serviceName,
      durationMin: 30,
      startsAt,
    });

    // second booking in same 7-day window -> blocked by weekly limit
    const res = await api.post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        barberId,
        serviceName,
        durationMin: 30,
        startsAt,
      });

    expect(res.status).toBe(409);
    const errorMsg = String(readPath(res.body, ['error']));
    expect(errorMsg).toContain('one active booking');
  });

  it('rejects booking when user is flagged as online-booking blocked (403)', async () => {
    const admin = await createAdminToken({});
    const { barberId, serviceName } = await seedBarberWithHaircut(admin);

    const email = 'blocked@example.com';
    const userToken = await createUserToken({
      email,
      password: 'secret123',
    });

    // mark user as blocked directly in DB
    await User.updateOne(
      { email },
      {
        $set: {
          is_online_booking_blocked: true,
          block_reason: 'Test block',
        },
      },
    ).exec();

    const date = futureWeekdayYMD(4);
    const startsAt = await getFirstSlotISO(barberId, date, 30);

    const res = await api.post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        barberId,
        serviceName,
        durationMin: 30,
        startsAt,
      });

    expect(res.status).toBe(403);
    const errorMsg = String(readPath(res.body, ['error']));
    expect(errorMsg).toContain('restricted');
  });

  it('allows a user to reschedule their own active booking to a future slot (200, status=rescheduled)', async () => {
    const admin = await createAdminToken({});
    const { barberId, serviceName } = await seedBarberWithHaircut(admin);

    const userToken = await createUserToken({
      email: 'reschedule@example.com',
      password: 'secret123',
    });

    const date = futureWeekdayYMD(5);
    const startsAt = await getFirstSlotISO(barberId, date, 30);

    const createRes = await createBookingWithDebug({
      token: userToken,
      barberId,
      serviceName,
      durationMin: 30,
      startsAt,
    });

    const bookingId = readString(createRes.body, ['booking', '_id']);

    // choose another future date for reschedule
    const reschedDate = futureWeekdayYMD(6);
    const newStartsAt = await getFirstSlotISO(barberId, reschedDate, 30);

    const patchRes = await api.patch(`/api/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ startsAt: newStartsAt })
      .expect(200);

    const status = readString(patchRes.body, ['booking', 'status']);
    expect(status).toBe('rescheduled');
  });

  it('admin can mark a booking as no-show and user gets blocked after two no-shows', async () => {
    const admin = await createAdminToken({});
    const { barberId, serviceName } = await seedBarberWithHaircut(admin);

    const email = 'noshow@example.com';
    const userToken = await createUserToken({
      email,
      password: 'secret123',
    });

    const date = futureWeekdayYMD(7);
    const startsAt = await getFirstSlotISO(barberId, date, 30);

    const createRes = await createBookingWithDebug({
      token: userToken,
      barberId,
      serviceName,
      durationMin: 30,
      startsAt,
    });

    const bookingId = readString(createRes.body, ['booking', '_id']);

    // first no-show -> warning_count = 1, not yet blocked
    await api.post(`/api/bookings/admin/${bookingId}/no-show`)
      .set('Authorization', `Bearer ${admin}`)
      .expect(200);

    const userAfterFirst = await User.findOne({ email }).lean().exec();
    expect(userAfterFirst).not.toBeNull();
    expect(userAfterFirst?.warning_count).toBe(1);
    expect(userAfterFirst?.is_online_booking_blocked).toBeFalsy();

    // second no-show on same booking -> warning_count = 2, should be blocked
    await api.post(`/api/bookings/admin/${bookingId}/no-show`)
      .set('Authorization', `Bearer ${admin}`)
      .expect(200);

    const userAfterSecond = await User.findOne({ email }).lean().exec();
    expect(userAfterSecond).not.toBeNull();
    expect(userAfterSecond?.warning_count).toBe(2);
    expect(userAfterSecond?.is_online_booking_blocked).toBe(true);
  });
});
