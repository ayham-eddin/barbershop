import {
  startOfWeekISO,
  endOfWeekISO,
  toIsoMidnightUTC,
  addDaysUTC,
} from '../utils/calendar';

const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;

describe('utils/calendar', () => {
  it('startOfWeekISO returns Monday for a given week', () => {
    // 2025-01-08 is Wednesday -> start of week should be Monday 2025-01-06
    const d = new Date('2025-01-08T12:00:00Z');
    const start = startOfWeekISO(d);
    expect(ymd(start)).toBe('2025-01-06');
  });

  it('endOfWeekISO returns Sunday for a given week', () => {
    const d = new Date('2025-01-08T12:00:00Z');
    const end = endOfWeekISO(d);
    // same week should end on Sunday 2025-01-12
    expect(ymd(end)).toBe('2025-01-12');
  });

  it('toIsoMidnightUTC normalises date to midnight UTC', () => {
    const d = new Date('2025-01-02T15:30:00.000Z');
    const iso = toIsoMidnightUTC(d);
    expect(iso).toBe('2025-01-02T00:00:00.000Z');
  });

  it('addDaysUTC adds days in UTC space', () => {
    const iso = '2025-01-01T00:00:00.000Z';
    const plusThree = addDaysUTC(iso, 3);
    expect(plusThree.startsWith('2025-01-04')).toBe(true);
  });
});
