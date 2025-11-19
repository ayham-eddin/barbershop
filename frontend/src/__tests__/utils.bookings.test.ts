import { isPast, isActive } from '../utils/bookings';
import type { BookingStatus } from '../api/bookings';

describe('utils/bookings', () => {
  it('isPast returns false for empty string', () => {
    expect(isPast('')).toBe(false);
  });

  it('isPast returns true for clearly past dates', () => {
    expect(isPast('2000-01-01T00:00:00.000Z')).toBe(true);
  });

  it('isPast returns false for clearly future dates', () => {
    expect(isPast('2999-01-01T00:00:00.000Z')).toBe(false);
  });

  it('isActive only returns true for booked / rescheduled', () => {
    const active: BookingStatus[] = ['booked', 'rescheduled'];
    const inactive: BookingStatus[] = ['cancelled', 'completed', 'no_show'];

    active.forEach((s) => expect(isActive(s)).toBe(true));
    inactive.forEach((s) => expect(isActive(s)).toBe(false));
  });
});
