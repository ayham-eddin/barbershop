// src/utils/closedDaysNRW.ts

/** Pad to 2 digits. */
function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

// Meeus/Jones/Butcher algorithm – returns Easter Sunday (UTC)
function easterSundayUtc(year: number): Date {
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
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=March, 4=April
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

function ymdFromDateUtc(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(
    d.getUTCDate(),
  )}`;
}

// Returns a set of YYYY-MM-DD strings for NRW public holidays in a year
function nrwHolidaySet(year: number): Set<string> {
  const dates: string[] = [];

  const add = (month: number, day: number) => {
    dates.push(`${year}-${pad2(month)}-${pad2(day)}`);
  };

  // Fixed-date holidays
  add(1, 1); // Neujahrstag
  add(5, 1); // Tag der Arbeit
  add(10, 3); // Tag der Deutschen Einheit
  add(11, 1); // Allerheiligen
  add(12, 25); // Erster Weihnachtstag
  add(12, 26); // Zweiter Weihnachtstag

  // Movable feasts based on Easter
  const easter = easterSundayUtc(year);
  const mk = (offsetDays: number) => {
    const d = new Date(easter);
    d.setUTCDate(d.getUTCDate() + offsetDays);
    return ymdFromDateUtc(d);
  };

  dates.push(mk(-2)); // Karfreitag
  dates.push(mk(1)); // Ostermontag
  dates.push(mk(39)); // Christi Himmelfahrt
  dates.push(mk(50)); // Pfingstmontag
  dates.push(mk(60)); // Fronleichnam

  return new Set(dates);
}

/**
 * Check if a YYYY-MM-DD date is weekend or NRW public holiday.
 * Used by booking / reschedule flows.
 */
export function isClosedDateYmd(ymd: string): boolean {
  if (!ymd) return false;
  const [yStr, mStr, dStr] = ymd.split('-');
  const year = Number(yStr);
  const month = Number(mStr);
  const day = Number(dStr);
  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return false;
  }

  const jsDate = new Date(year, month - 1, day);
  const dow = jsDate.getDay(); // 0=Sun..6=Sat
  const isWeekend = dow === 0 || dow === 6;

  const holidays = nrwHolidaySet(year);
  const isHoliday = holidays.has(ymd);

  return isWeekend || isHoliday;
}
