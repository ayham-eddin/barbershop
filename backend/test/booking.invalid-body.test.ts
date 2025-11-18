/* =================== IMPORTS =================== */
import { Types } from 'mongoose';
import { api, resetDb, createUserToken } from './helpers';

/* ------------ safe readers ------------ */
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

/* ------------ helpers ------------ */
const futureIso = (daysAhead: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  return d.toISOString();
};

/* =================== TESTS =================== */

describe('Booking – invalid body passes zod but fails controller', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('returns 400 Invalid barberId when barberId is not an ObjectId', async () => {
    const token = await createUserToken({
      email: 'invalid-barber@example.com',
      name: 'User',
      password: 'secret123',
    });

    const res = await api.post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        barberId: 'not-an-object-id', // passes zod (string) but fails controller check
        serviceName: 'Haircut',
        durationMin: 30,
        startsAt: futureIso(5),
        notes: 'invalid barberId test',
      })
      .expect(400);

    const error = readString(res.body, ['error']);
    expect(error).toBe('Invalid barberId');
  });

  it('returns 400 Invalid durationMin when it is > 480', async () => {
    const token = await createUserToken({
      email: 'too-long-duration@example.com',
      name: 'User',
      password: 'secret123',
    });

    const res = await api.post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        barberId: new Types.ObjectId().toHexString(),
        serviceName: 'Haircut',
        durationMin: 1000, // passes zod (positive int) but fails controller range (1..480)
        startsAt: futureIso(6),
      })
      .expect(400);

    const error = readString(res.body, ['error']);
    expect(error).toBe('Invalid durationMin (1..480)');
  });

  it('returns 400 Cannot book in the past when startsAt is before now', async () => {
    const token = await createUserToken({
      email: 'past-date@example.com',
      name: 'User',
      password: 'secret123',
    });

    const past = new Date();
    past.setFullYear(past.getFullYear() - 1);

    const res = await api.post('/api/bookings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        barberId: new Types.ObjectId().toHexString(),
        serviceName: 'Haircut',
        durationMin: 30,
        startsAt: past.toISOString(), // valid ISO but in the past
      })
      .expect(400);

    const error = readString(res.body, ['error']);
    expect(error).toBe('Cannot book in the past');
  });
});
