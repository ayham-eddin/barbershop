// test/booking.validation.test.ts
import { api, resetDb, createAdminToken } from './helpers';

interface SlotsOut { slots: { start: string; end: string }[] }

function isSlotsOut(x: unknown): x is SlotsOut {
  return !!x && typeof x === 'object' && Array.isArray((x as { slots?: unknown }).slots);
}

async function registerAndLogin(email: string, password: string) {
  await api.post('/api/auth/register')
    .send({ name: 'Test', email, password }) // name >= 2 chars to satisfy validator
    .expect(201);
  const loginRes = await api.post('/api/auth/login')
    .send({ email, password })
    .expect(200);
  return (loginRes.body as { token: string }).token;
}

describe('Booking – auth & validation', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('rejects creating a booking without token (401)', async () => {
    await api.post('/api/bookings')
      .send({
        barberId: '000000000000000000000000',
        serviceName: 'Haircut',
        durationMin: 30,
        startsAt: new Date().toISOString(),
        notes: 'no token',
      })
      .expect(401);
  });

  it('rejects invalid payload (missing/invalid fields -> 400)', async () => {
    const userToken = await registerAndLogin('u1@example.com', 'secret123');

    await api.post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        // missing barberId & startsAt etc.
        serviceName: 'Haircut',
        // intentional wrong type to trigger validator
        durationMin: 'thirty',
      })
      .expect(400);
  });

  it('creates minimal data to allow a valid booking then books once (201)', async () => {
    // 1) Admin creates a service & a barber exposing that service
    const admin = await createAdminToken({});

    // create service
    const sRes = await api.post('/api/admin/services')
      .set('Authorization', `Bearer ${admin}`)
      .send({ name: 'Haircut', durationMin: 30, price: 20 })
      .expect(201);
    const serviceId = (sRes.body as { service: { _id: string } }).service._id;

    // create barber
    const bRes = await api.post('/api/admin/barbers')
      .set('Authorization', `Bearer ${admin}`)
      .send({
        name: 'Hamza',
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
    const barberId = (bRes.body as { barber: { _id: string } }).barber._id;

    // 2) User logs in
    const userToken = await registerAndLogin('u2@example.com', 'secret123');

    // 3) Fetch slots for a known Thursday (matches the rest of the suite)
    const slotsRes = await api.get(`/api/barbers/${barberId}/slots`)
      .query({ date: '2025-10-30', duration: 30 })
      .expect(200);

    expect(isSlotsOut(slotsRes.body)).toBe(true);
    const slots = (slotsRes.body as SlotsOut).slots;

    expect(Array.isArray(slots)).toBe(true);
    expect(slots.length).toBeGreaterThan(0);

    const startsAt = slots[0].start;

    // 4) Book one slot
    await api.post('/api/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        barberId,
        serviceName: 'Haircut',
        durationMin: 30,
        startsAt,
        notes: 'validation happy path',
      })
      .expect(201);
  });
});
