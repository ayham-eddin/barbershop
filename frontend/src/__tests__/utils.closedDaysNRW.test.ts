import { isClosedDateYmd } from '../utils/closedDaysNRW';

describe('utils/closedDaysNRW - isClosedDateYmd', () => {
  it('returns false for invalid input', () => {
    expect(isClosedDateYmd('')).toBe(false);
    expect(isClosedDateYmd('not-a-date')).toBe(false);
  });

  it('detects weekends as closed', () => {
    // 2025-01-04 is a Saturday, 2025-01-05 is a Sunday
    expect(isClosedDateYmd('2025-01-04')).toBe(true);
    expect(isClosedDateYmd('2025-01-05')).toBe(true);
  });

  it('detects fixed NRW public holidays', () => {
    // New Year
    expect(isClosedDateYmd('2025-01-01')).toBe(true);
    // Tag der Arbeit
    expect(isClosedDateYmd('2025-05-01')).toBe(true);
  });

  it('detects movable feasts based on Easter (e.g. Good Friday)', () => {
    // For 2025, Good Friday is 2025-04-18
    expect(isClosedDateYmd('2025-04-18')).toBe(true);
  });

  it('returns false for normal working day', () => {
    // Random Wednesday, not a holiday
    expect(isClosedDateYmd('2025-01-08')).toBe(false);
  });
});
