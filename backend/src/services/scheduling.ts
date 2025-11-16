// src/services/scheduling.ts
import dayjs, { Dayjs } from 'dayjs';
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
 * Compute Easter Sunday (Gregorian) for a given year.
 * Used to derive several German moveable holidays.
 */
function computeEasterSunday(year: number): Dayjs {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  // Create a UTC date for Easter Sunday
  return dayjs.utc(new Date(Date.UTC(year, month - 1, day)));
}

/**
 * NRW public holidays (date-based) for a given day.
 * We treat the given Dayjs as a date (year-month-day).
 */
function isNrwPublicHoliday(date: Dayjs): boolean {
  const year = date.year();

  const easter = computeEasterSunday(year);
  const goodFriday = easter.subtract(2, 'day');
  const easterMonday = easter.add(1, 'day');
  const ascension = easter.add(39, 'day');
  const whitMonday = easter.add(50, 'day');
  const corpusChristi = easter.add(60, 'day');

  // Fixed-date holidays (NRW)
  const fixed = [
    dayjs.utc(new Date(Date.UTC(year, 0, 1))),   // 1 Jan – New Year
    dayjs.utc(new Date(Date.UTC(year, 4, 1))),   // 1 May – Labour Day
    dayjs.utc(new Date(Date.UTC(year, 9, 3))),   // 3 Oct – German Unity Day
    dayjs.utc(new Date(Date.UTC(year, 10, 1))),  // 1 Nov – All Saints' Day (NRW)
    dayjs.utc(new Date(Date.UTC(year, 11, 25))), // 25 Dec – Christmas
    dayjs.utc(new Date(Date.UTC(year, 11, 26))), // 26 Dec – 2nd Christmas Day
  ];

  if (fixed.some((d) => date.isSame(d, 'day'))) return true;

  const moveable = [
    goodFriday,
    easterMonday,
    ascension,
    whitMonday,
    corpusChristi,
  ];

  if (moveable.some((d) => date.isSame(d, 'day'))) return true;

  return false;
}

/**
 * Calculates available slots for a barber on a given UTC date.
 * - dateISO should be in "YYYY-MM-DD" format
 * - duration is in minutes
 * - stepMin defines granularity between slots (default 15)
 * - excludes overlapping appointments & time-offs
 * - respects BookingBufferMin only for slots on the current UTC day
 * - returns no slots on weekends and NRW public holidays
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

  const date = dayjs.utc(dateISO);

  // weekday index (0 = Sunday ... 6 = Saturday)
  const dayIdx = date.day();

  // Hide weekends
  if (dayIdx === 0 || dayIdx === 6) {
    return [];
  }

  // Hide NRW public holidays
  if (isNrwPublicHoliday(date)) {
    return [];
  }

  const wh = barber.workingHours.find((w) => w.day === dayIdx);
  if (!wh) return [];

  const startM = toMinutes(wh.start);
  const endM = toMinutes(wh.end);
  if (endM <= startM) return [];

  // Full UTC day range
  const dayStart = date.startOf('day');
  const rangeStart = dayStart.add(startM, 'minute');
  const rangeEnd = dayStart.add(endM, 'minute');

  // Buffer applies only if the requested date is today (UTC)
  const nowUtc = dayjs.utc();
  const isSameDay = dayStart.isSame(nowUtc, 'day');
  const minStartUtc = nowUtc.add(ENV.BookingBufferMin, 'minute');

  // Find overlapping appointments (booked + rescheduled)
  const appointments = await Appointment.find({
    barberId: barber._id,
    status: { $in: ['booked', 'rescheduled'] },
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
    // Apply buffer only for today; future days ignore it
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
