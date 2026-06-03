import { describe, expect, it } from 'vitest';
import { daysBetween, logicalDayKey } from './day';

// 4am day-start, expressed in minutes (SPEC §5 example).
const DAY_START_4AM = 4 * 60;

describe('logicalDayKey', () => {
  it('keeps an instant after the day-start on the same calendar day', () => {
    // 10:00 local on the 15th, day starts 4am -> still the 15th.
    expect(logicalDayKey('2026-06-15T10:00:00', DAY_START_4AM)).toBe('2026-06-15');
  });

  it('rolls a pre-day-start instant back to the previous day', () => {
    // 01:00 local on the 15th, day starts 4am -> counts as the 14th.
    expect(logicalDayKey('2026-06-15T01:00:00', DAY_START_4AM)).toBe('2026-06-14');
  });

  it('treats exactly the day-start as the new day', () => {
    expect(logicalDayKey('2026-06-15T04:00:00', DAY_START_4AM)).toBe('2026-06-15');
  });

  it('with a midnight day-start, the logical day equals the calendar day', () => {
    expect(logicalDayKey('2026-06-15T00:30:00', 0)).toBe('2026-06-15');
    expect(logicalDayKey('2026-06-15T23:59:00', 0)).toBe('2026-06-15');
  });
});

describe('daysBetween', () => {
  it('is 1 for consecutive days', () => {
    expect(daysBetween('2026-06-14', '2026-06-15')).toBe(1);
  });

  it('is 0 for the same day', () => {
    expect(daysBetween('2026-06-15', '2026-06-15')).toBe(0);
  });

  it('counts across a month boundary', () => {
    expect(daysBetween('2026-05-31', '2026-06-02')).toBe(2);
  });
});
