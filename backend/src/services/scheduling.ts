import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import { Types } from 'mongoose';
import { Barber } from '@src/models/Barber';
import { Appointment } from '@src/models/Appointment';
import ENV from '@src/common/constants/ENV';

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);

export interface Slot {
  start: string; // ISO
  end: string;   // ISO
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h * 60) + m;
}

export async function getAvailableSlots(
  barberId: string,
  dateISO: string,       // e.g. "2025-11-01"
  durationMin: number,
  stepMin = 15,
): Promise<Slot[]> {
  if (durationMin <= 0 || stepMin <= 0) return [];

  const barber = await Barber.findById(
    new Types.ObjectId(barberId),
  ).exec();
  if (!barber) return [];

  // weekday index 0..6
  const dayIdx = dayjs(dateISO).day();
  const wh = barber.workingHours.find(w => w.day === dayIdx);
  if (!wh) return [];

  const startM = toMinutes(wh.start);
  const endM = toMinutes(wh.end);
  if (endM <= startM) return [];

  const dayStart = dayjs(dateISO).utc().startOf('day');
  const rangeStart = dayStart.add(startM, 'minute');
  const rangeEnd = dayStart.add(endM, 'minute');

  // Do not allow booking sooner than buffer from "now"
  const minStartUtc = dayjs().utc().add(ENV.BookingBufferMin, 'minute');

  const appointments = await Appointment.find({
    barberId: barber._id,
    status: 'booked',
    startsAt: { $lt: rangeEnd.toDate() },
    endsAt: { $gt: rangeStart.toDate() },
  }).exec();

  const blocks = appointments.map(a => ({
    s: dayjs(a.startsAt),
    e: dayjs(a.endsAt),
  }));

  const slots: Slot[] = [];
  let p = rangeStart;

  while (p.add(durationMin, 'minute').isSameOrBefore(rangeEnd)) {
    const q = p.add(durationMin, 'minute');

    const overlaps = blocks.some(b => p.isBefore(b.e) && q.isAfter(b.s));
    const respectsBuffer = !p.isBefore(minStartUtc);

    if (!overlaps && respectsBuffer) {
      slots.push({ start: p.toISOString(), end: q.toISOString() });
    }
    p = p.add(stepMin, 'minute');
  }

  return slots;
}
