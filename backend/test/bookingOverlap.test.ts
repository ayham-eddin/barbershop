/* =================== IMPORTS =================== */
import { Types } from 'mongoose';
import { resetDb } from './helpers';
import { Appointment } from '@src/models/Appointment';
import { hasOverlap } from '@src/services/bookingOverlap';

/* =================== TESTS =================== */

describe('bookingOverlap.hasOverlap', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('returns false when no appointments exist', async () => {
    const barberId = new Types.ObjectId();
    const startsAt = new Date('2050-01-01T10:00:00.000Z');
    const endsAt = new Date('2050-01-01T10:30:00.000Z');

    const result = await hasOverlap({ barberId, startsAt, endsAt });
    expect(result).toBe(false);
  });

  it('returns true when an overlapping appointment exists', async () => {
    const barberId = new Types.ObjectId();
    const userId = new Types.ObjectId();

    const startsAt = new Date('2050-01-01T10:00:00.000Z');
    const endsAt = new Date('2050-01-01T10:30:00.000Z');

    await Appointment.create({
      userId,
      barberId,
      serviceName: 'Test Service',
      durationMin: 30,
      startsAt,
      endsAt,
      status: 'booked',
      notes: '',
      original_created_at: new Date('2050-01-01T09:00:00.000Z'),
      last_modified_at: new Date('2050-01-01T09:00:00.000Z'),
    });

    const result = await hasOverlap({
      barberId,
      startsAt: new Date('2050-01-01T10:10:00.000Z'),
      endsAt: new Date('2050-01-01T10:40:00.000Z'),
    });

    expect(result).toBe(true);
  });

  it('ignores the appointment when excludeId matches (no overlap reported)', async () => {
    const barberId = new Types.ObjectId();
    const userId = new Types.ObjectId();

    const startsAt = new Date('2050-01-01T10:00:00.000Z');
    const endsAt = new Date('2050-01-01T10:30:00.000Z');

    const appt = await Appointment.create({
      userId,
      barberId,
      serviceName: 'Test Service',
      durationMin: 30,
      startsAt,
      endsAt,
      status: 'booked',
      notes: '',
      original_created_at: new Date('2050-01-01T09:00:00.000Z'),
      last_modified_at: new Date('2050-01-01T09:00:00.000Z'),
    });

    const result = await hasOverlap({
      barberId,
      startsAt: new Date('2050-01-01T10:10:00.000Z'),
      endsAt: new Date('2050-01-01T10:40:00.000Z'),
      excludeId: appt._id,
    });

    expect(result).toBe(false);
  });
});
