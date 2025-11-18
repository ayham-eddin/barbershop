/* =================== IMPORTS =================== */
import {
  createBookingSchema,
  cancelBookingSchema,
  adminUpdateBookingSchema,
} from '@src/routes/validators/bookingSchemas';

describe('bookingSchemas – createBookingSchema', () => {
  it('accepts a valid booking payload', () => {
    const result = createBookingSchema.safeParse({
      barberId: '64b7a9f2c2c8c8a1b2c3d4e5',
      serviceName: 'Haircut',
      durationMin: 30,
      startsAt: '2030-01-01T10:00:00.000Z',
      notes: 'Optional note',
    });

    expect(result.success).toBe(true);
  });

  it('rejects invalid payload (missing fields / wrong types)', () => {
    const result = createBookingSchema.safeParse({
      // missing barberId
      serviceName: 'Haircut',
      durationMin: '30',
      startsAt: 'not-a-date',
    });

    expect(result.success).toBe(false);
  });
});

describe('bookingSchemas – cancelBookingSchema', () => {
  it('accepts a valid cancel payload', () => {
    const result = cancelBookingSchema.safeParse({
      id: 'some-id',
    });

    expect(result.success).toBe(true);
  });

  it('rejects when id is empty', () => {
    const result = cancelBookingSchema.safeParse({
      id: '',
    });

    expect(result.success).toBe(false);
  });
});

describe('bookingSchemas – adminUpdateBookingSchema', () => {
  it('rejects an empty object with refine message', () => {
    const result = adminUpdateBookingSchema.safeParse({});
    expect(result.success).toBe(false);

    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message).join(' ');
      expect(messages).toContain('At least one field must be provided');
    }
  });

  it('rejects invalid barberId (not an ObjectId)', () => {
    const result = adminUpdateBookingSchema.safeParse({
      barberId: 'not-an-object-id',
    });

    expect(result.success).toBe(false);
  });

  it('accepts a minimal valid update payload', () => {
    const result = adminUpdateBookingSchema.safeParse({
      durationMin: 30,
    });

    expect(result.success).toBe(true);
  });
});
