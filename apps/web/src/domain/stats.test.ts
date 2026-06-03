import { describe, expect, it } from 'vitest';
import type { Completion } from './activity';
import type { Redemption } from './reward';
import { deriveDailyStats, summarizeStats } from './stats';

const DAY_START_4AM = 4 * 60;

// Noon avoids the day-start boundary, so the logical day equals the calendar day.
function doneOn(day: string, valueEarned: number): Completion {
  return {
    id: crypto.randomUUID(),
    activityId: 'a1',
    completedAt: `${day}T12:00:00`,
    valueEarned,
  };
}

function spentOn(day: string, costPaid: number): Redemption {
  return {
    id: crypto.randomUUID(),
    rewardId: 'r1',
    redeemedAt: `${day}T12:00:00`,
    costPaid,
  };
}

const NOON_15TH = '2026-06-15T12:00:00';

describe('deriveDailyStats', () => {
  it('buckets completions and redemptions by logical day', () => {
    const byDay = deriveDailyStats(
      [doneOn('2026-06-14', 3), doneOn('2026-06-14', 2), doneOn('2026-06-15', 5)],
      [spentOn('2026-06-14', 4)],
      DAY_START_4AM,
    );

    expect(byDay.get('2026-06-14')).toEqual({
      day: '2026-06-14',
      earned: 5,
      completed: 2,
      redeemed: 4,
    });
    expect(byDay.get('2026-06-15')).toEqual({
      day: '2026-06-15',
      earned: 5,
      completed: 1,
      redeemed: 0,
    });
  });

  it('rolls a pre-day-start completion into the previous logical day', () => {
    // 02:00 on the 15th is before the 4am start, so it counts toward the 14th.
    const byDay = deriveDailyStats(
      [{ id: 'c', activityId: 'a1', completedAt: '2026-06-15T02:00:00', valueEarned: 3 }],
      [],
      DAY_START_4AM,
    );

    expect(byDay.get('2026-06-14')?.earned).toBe(3);
    expect(byDay.has('2026-06-15')).toBe(false);
  });

  it('is empty with no activity', () => {
    expect(deriveDailyStats([], [], DAY_START_4AM).size).toBe(0);
  });
});

describe('summarizeStats', () => {
  it('totals earnings, spend, balance, active days and streak', () => {
    const completions = [
      doneOn('2026-06-13', 3),
      doneOn('2026-06-14', 2),
      doneOn('2026-06-14', 4), // two on one day -> one active day
      doneOn('2026-06-15', 5),
    ];
    const redemptions = [spentOn('2026-06-15', 6)];

    const s = summarizeStats(completions, redemptions, DAY_START_4AM, NOON_15TH);

    expect(s.totalEarned).toBe(14);
    expect(s.totalSpent).toBe(6);
    expect(s.balance).toBe(8);
    expect(s.tasksCompleted).toBe(4);
    expect(s.activeDays).toBe(3); // 13th, 14th, 15th
    expect(s.currentStreak).toBe(3);
    expect(s.longestStreak).toBe(3);
  });

  it('is all-zero with no activity', () => {
    expect(summarizeStats([], [], DAY_START_4AM, NOON_15TH)).toEqual({
      totalEarned: 0,
      totalSpent: 0,
      balance: 0,
      tasksCompleted: 0,
      activeDays: 0,
      currentStreak: 0,
      longestStreak: 0,
    });
  });
});
