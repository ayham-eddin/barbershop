// src/services/bookingOverlap.ts
import { Types } from 'mongoose';
import { Appointment } from '@src/models/Appointment';

/**
 * Checks if a time window overlaps with any existing *active* appointment
 * (booked or rescheduled) for the given barber.
 * Optionally excludes one booking (when editing).
 */
export async function hasOverlap(options: {
  barberId: Types.ObjectId;
  startsAt: Date;
  endsAt: Date;
  excludeId?: Types.ObjectId;
}): Promise<boolean> {
  const { barberId, startsAt, endsAt, excludeId } = options;

  const filter: Record<string, unknown> = {
    barberId,
    status: { $in: ['booked', 'rescheduled'] },
    startsAt: { $lt: endsAt },
    endsAt: { $gt: startsAt },
  };

  if (excludeId) {
    filter._id = { $ne: excludeId };
  }

  const count = await Appointment.countDocuments(filter).exec();
  return count > 0;
}
