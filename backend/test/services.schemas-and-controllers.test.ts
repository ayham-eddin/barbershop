// test/services.schemas-and-controllers.test.ts
import { Types } from 'mongoose';
import { api, resetDb, createAdminToken } from './helpers';
import {
  createServiceSchema,
  updateServiceSchema,
} from '@src/routes/validators/serviceSchemas';
import {
  createBarberSchema,
  updateBarberSchema,
} from '@src/routes/validators/barberSchemas';

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

/* =================== SCHEMA TESTS =================== */

describe('Service & Barber schemas', () => {
  it('createServiceSchema accepts valid service and rejects bad durationMin', () => {
    const ok = createServiceSchema.safeParse({
      name: 'Haircut',
      durationMin: 30,
      price: 25,
    });
    expect(ok.success).toBe(true);

    const bad = createServiceSchema.safeParse({
      name: 'X',
      durationMin: 1, // too small
      price: 10,
    });
    expect(bad.success).toBe(false);
  });

  it('updateServiceSchema rejects empty object and accepts partial updates', () => {
    const empty = updateServiceSchema.safeParse({});
    expect(empty.success).toBe(false);

    if (!empty.success) {
      const issues = empty.error.issues;
      const messages = issues.map((issue) => issue.message).join(' ');
      expect(messages).toContain('At least one field must be provided');
    }

    const partial = updateServiceSchema.safeParse({
      durationMin: 45,
    });
    expect(partial.success).toBe(true);
  });

  it('createBarberSchema fills defaults and validates working hours', () => {
    const ok = createBarberSchema.safeParse({
      name: 'Barber A',
    });
    expect(ok.success).toBe(true);
    if (ok.success) {
      expect(ok.data.specialties).toEqual([]);
      expect(ok.data.services).toEqual([]);
      expect(ok.data.workingHours).toEqual([]);
      expect(ok.data.active).toBe(true);
    }

    const bad = createBarberSchema.safeParse({
      name: 'Barber B',
      workingHours: [
        {
          day: 1,
          start: '9:00', // invalid format (should be HH:MM)
          end: '17:00',
        },
      ],
    });

    expect(bad.success).toBe(false);
  });

  it('updateBarberSchema allows partial updates', () => {
    const partial = updateBarberSchema.safeParse({
      name: 'Updated Barber',
      active: false,
    });
    expect(partial.success).toBe(true);
  });
});

/* =================== SERVICE CONTROLLER ERROR BRANCHES =================== */

describe('ServiceController – invalid ids and not found', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('PATCH /api/admin/services/:id returns 400 for invalid id', async () => {
    const admin = await createAdminToken({});

    const res = await api.patch('/api/admin/services/not-a-valid-id')
      .set('Authorization', `Bearer ${admin}`)
      .send({ name: 'New Name' })
      .expect(400);

    const error = readString(res.body, ['error']);
    // comes from Zod/validate middleware
    expect(error).toBe('Validation error');
  });

  it('PATCH /api/admin/services/:id returns 404 when service does not exist', async () => {
    const admin = await createAdminToken({});
    const validButMissingId = new Types.ObjectId().toHexString();

    const res = await api.patch(`/api/admin/services/${validButMissingId}`)
      .set('Authorization', `Bearer ${admin}`)
      .send({ name: 'Non-existent service' })
      .expect(404);

    const error = readString(res.body, ['error']);
    expect(error).toBe('Service not found');
  });

  it('DELETE /api/admin/services/:id returns 400 for invalid id', async () => {
    const admin = await createAdminToken({});

    const res = await api.delete('/api/admin/services/invalid-id-123')
      .set('Authorization', `Bearer ${admin}`)
      .expect(400);

    const error = readString(res.body, ['error']);
    // also from validation middleware
    expect(error).toBe('Validation error');
  });

  it('DELETE /api/admin/services/:id returns 404 when service does not exist', async () => {
    const admin = await createAdminToken({});
    const validButMissingId = new Types.ObjectId().toHexString();

    const res = await api.delete(`/api/admin/services/${validButMissingId}`)
      .set('Authorization', `Bearer ${admin}`)
      .expect(404);

    const error = readString(res.body, ['error']);
    expect(error).toBe('Service not found');
  });
});
