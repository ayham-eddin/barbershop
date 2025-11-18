// test/util.misc-and-validators.test.ts
import { getRandomInt } from '@src/common/util/misc';
import { isRelationalKey, transIsDate } from '@src/common/util/validators';

/* ------------ helpers (no any / no unsafe access) ------------ */
const isInteger = (value: unknown): value is number => {
  return typeof value === 'number' && Number.isInteger(value);
};

/* =================== TESTS =================== */

describe('common/util/misc – getRandomInt', () => {
  it('returns an integer between 1 and 1_000_000_000_000', () => {
    for (let i = 0; i < 10; i += 1) {
      const v = getRandomInt();
      expect(isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(1);
      expect(v).toBeLessThanOrEqual(1_000_000_000_000);
    }
  });
});

describe('common/util/validators – isRelationalKey & transIsDate', () => {
  it('isRelationalKey returns true only for numbers >= -1', () => {
    expect(isRelationalKey(-1)).toBe(true);
    expect(isRelationalKey(0)).toBe(true);
    expect(isRelationalKey(42)).toBe(true);

    // invalid values
    expect(isRelationalKey(-2)).toBe(false);
    expect(isRelationalKey(NaN)).toBe(false);
    expect(isRelationalKey('1')).toBe(false);
    expect(isRelationalKey(null)).toBe(false);
    expect(isRelationalKey(undefined)).toBe(false);
  });

  it('transIsDate accepts a valid date input without throwing', () => {
    expect(() =>
      transIsDate('2020-01-01T00:00:00.000Z' as unknown as string),
    ).not.toThrow();
  });
});
