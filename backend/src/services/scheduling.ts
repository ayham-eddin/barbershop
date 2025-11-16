import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { Types } from 'mongoose';
import { Barber } from '@src/models/Barber';
import { Appointment } from '@src/models/Appointment';
import { TimeOff } from '@src/models/TimeOff';
import ENV from '@src/common/constants/ENV';

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);

export interface Slot {
  start: string; // ISO (UTC)
  end: string;   // ISO (UTC)
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Calculates available slots for a barber on a given UTC date.
 * - dateISO should be in "YYYY-MM-DD" format
 * - duration is in minutes
 * - stepMin defines granularity between slots (default 15)
 * - excludes overlapping appointments & time-offs
 * - respects BookingBufferMin only for slots on the current UTC day
 */
export async function getAvailableSlots(
  barberId: string,
  dateISO: string, // "YYYY-MM-DD"
  duration: number,
  stepMin = 15,
): Promise<Slot[]> {
  if (duration <= 0 || stepMin <= 0) return [];

  const barber = await Barber.findById(new Types.ObjectId(barberId)).exec();
  if (!barber) return [];

  // weekday index (0 = Sunday ... 6 = Saturday)
  const dayIdx = dayjs.utc(dateISO).day();
  const wh = barber.workingHours.find((w) => w.day === dayIdx);
  if (!wh) return [];

  const startM = toMinutes(wh.start);
  const endM = toMinutes(wh.end);
  if (endM <= startM) return [];

  // Full UTC day range
  const dayStart = dayjs.utc(dateISO).startOf('day');
  const rangeStart = dayStart.add(startM, 'minute');
  const rangeEnd = dayStart.add(endM, 'minute');

  // Buffer applies only if the requested date is today (UTC)
  const nowUtc = dayjs.utc();
  const isSameDay = dayStart.isSame(nowUtc, 'day');
  const minStartUtc = nowUtc.add(ENV.BookingBufferMin, 'minute');

  // Find overlapping appointments
  const appointments = await Appointment.find({
    barberId: barber._id,
    status: { $in: ['booked', 'rescheduled'] }, // ✅ treat rescheduled as active
    startsAt: { $lt: rangeEnd.toDate() },
    endsAt: { $gt: rangeStart.toDate() },
  })
    .select('startsAt endsAt')
    .lean()
    .exec();

  // Find overlapping time-off
  const offs = await TimeOff.find({
    barberId: barber._id,
    start: { $lt: rangeEnd.toDate() },
    end: { $gt: rangeStart.toDate() },
  })
    .select('start end')
    .lean()
    .exec();

  // Merge blocked ranges (appointments + time-offs)
  const blocks = [
    ...appointments.map((a) => ({
      s: dayjs.utc(a.startsAt),
      e: dayjs.utc(a.endsAt),
    })),
    ...offs.map((o) => ({
      s: dayjs.utc(o.start),
      e: dayjs.utc(o.end),
    })),
  ];

  const slots: Slot[] = [];
  let p = rangeStart;

  while (p.add(duration, 'minute').isSameOrBefore(rangeEnd)) {
    const q = p.add(duration, 'minute');

    const overlaps = blocks.some((b) => p.isBefore(b.e) && q.isAfter(b.s));
    // Apply buffer only for today; future/past days ignore it
    const respectsBuffer = !isSameDay || !p.isBefore(minStartUtc);

    if (!overlaps && respectsBuffer) {
      slots.push({ start: p.toISOString(), end: q.toISOString() });
    }
    p = p.add(stepMin, 'minute');
  }

  return slots;
}

export async function hasOverlap(params: {
  barberId: Types.ObjectId;
  startsAt: Date;
  endsAt: Date;
  excludeId?: Types.ObjectId;
}): Promise<boolean> {
  const { barberId, startsAt, endsAt, excludeId } = params;

  const q: Record<string, unknown> = {
    barberId,
    status: { $in: ['booked', 'rescheduled'] },
    startsAt: { $lt: endsAt },
    endsAt: { $gt: startsAt },
  };
  if (excludeId) q._id = { $ne: excludeId };

  const n = await Appointment.countDocuments(q).exec();
  return n > 0;
}
