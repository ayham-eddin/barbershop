import {
  formatBerlin,
  localInputToUtcIso,
  isoToLocalInput,
  formatBerlinTime,
} from '../utils/datetime';

describe('utils/datetime', () => {
  it('formatBerlin returns a non-empty localized string', () => {
    const iso = '2025-04-18T10:30:00.000Z';
    const result = formatBerlin(iso);
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('localInputToUtcIso returns a valid ISO string', () => {
    const local = '2025-11-07T10:30';
    const result = localInputToUtcIso(local);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
    expect(() => new Date(result)).not.toThrow();
  });

  it('isoToLocalInput strips seconds and ms and returns yyyy-MM-ddTHH:mm', () => {
    const iso = '2025-01-02T03:04:05.678Z';
    const local = isoToLocalInput(iso);
    expect(local).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
  });

  it('formatBerlinTime returns HH:mm format', () => {
    const iso = '2025-01-02T10:30:00.000Z';
    const time = formatBerlinTime(iso);
    expect(time).toMatch(/^\d{2}:\d{2}$/);
  });
});
