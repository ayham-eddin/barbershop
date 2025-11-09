// src/common/time.ts
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import tz from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(tz);

const EUROPE_BERLIN = 'Europe/Berlin';

export interface Window7dUtc {
  startUtc: Date;
  endUtc: Date;
}

/**
 * Rolling 7-day window starting "now" in Europe/Berlin, returned as UTC Dates.
 * This matches the product rule: “one active booking within the next 7 days from now”.
 */
export function berlinNowWindow7dUtc(): Window7dUtc {
  const nowBerlin = dayjs().tz(EUROPE_BERLIN);
  const endBerlin = nowBerlin.add(7, 'day');

  return {
    startUtc: nowBerlin.toDate(),       // same instant, UTC date
    endUtc: endBerlin.toDate(),         // same instant, +7d, UTC date
  };
}

export function toBerlin(isoOrDate: string | Date): string {
  return dayjs(isoOrDate).tz(EUROPE_BERLIN).format();
}
export function nowBerlinISO(): string {
  return dayjs().tz(EUROPE_BERLIN).format();
}
