import { describe, expect, it } from 'vitest';
import { deriveStreakState } from './streak';
import type { Completion } from './activity';

const DAY_START_4AM = 4 * 60;

// A completion at noon local on the given YYYY-MM-DD (noon avoids the day-start
// boundary, so the logical day equals the calendar day here).
function doneOn(day: string): Completion {
  return {
    id: crypto.randomUUID(),
    activityId: 'a1',
    completedAt: `${day}T12:00:00`,
    valueEarned: 3,
  };
}

const NOON_15TH = '2026-06-15T12:00:00';

describe('deriveStreakState', () => {
  it('is empty with no completions', () => {
    expect(deriveStreakState([], DAY_START_4AM, NOON_15TH)).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      lastQualifyingDay: null,
    });
  });

  it('counts consecutive days as one run', () => {
    const log = [doneOn('2026-06-13'), doneOn('2026-06-14'), doneOn('2026-06-15')];
    const s = deriveStreakState(log, DAY_START_4AM, NOON_15TH);
    expect(s.currentStreak).toBe(3);
    expect(s.longestStreak).toBe(3);
    expect(s.lastQualifyingDay).toBe('2026-06-15');
  });

  it('counts multiple completions on one day only once', () => {
    const log = [doneOn('2026-06-15'), doneOn('2026-06-15'), doneOn('2026-06-15')];
    expect(deriveStreakState(log, DAY_START_4AM, NOON_15TH).currentStreak).toBe(1);
  });

  it('stays alive when yesterday is done but today is not yet (forgiving)', () => {
    const log = [doneOn('2026-06-13'), doneOn('2026-06-14')];
    // "now" is the 15th; last qualifying day is the 14th (yesterday).
    expect(deriveStreakState(log, DAY_START_4AM, NOON_15TH).currentStreak).toBe(2);
  });

  it('resets the current run after a gap but keeps the longest', () => {
    const log = [
      doneOn('2026-06-09'),
      doneOn('2026-06-10'),
      doneOn('2026-06-11'), // a 3-day run...
      // ...then a gap; last qualifying day is the 11th, four days before "now".
    ];
    const s = deriveStreakState(log, DAY_START_4AM, NOON_15TH);
    expect(s.currentStreak).toBe(0);
    expect(s.longestStreak).toBe(3);
    expect(s.lastQualifyingDay).toBe('2026-06-11');
  });

  it('tracks the longest run across an earlier break', () => {
    const log = [
      doneOn('2026-06-01'),
      doneOn('2026-06-02'),
      doneOn('2026-06-03'),
      doneOn('2026-06-04'), // 4-day run
      // gap
      doneOn('2026-06-14'),
      doneOn('2026-06-15'), // current 2-day run
    ];
    const s = deriveStreakState(log, DAY_START_4AM, NOON_15TH);
    expect(s.currentStreak).toBe(2);
    expect(s.longestStreak).toBe(4);
  });
});
