import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Europe/Berlin');

export function nowBerlin() {
  return dayjs.tz();
}

export function berlinAddDays(baseISO: string | Date, days: number) {
  return dayjs.tz(baseISO).add(days, 'day');
}

// Return [startUTC, endUTC) for a rolling 7-day window starting “now in Berlin”
export function berlinNowWindow7dUtc(): { startUtc: Date; endUtc: Date } {
  const start = nowBerlin();
  const end = start.add(7, 'day');
  return { startUtc: start.toDate(), endUtc: end.toDate() };
}
