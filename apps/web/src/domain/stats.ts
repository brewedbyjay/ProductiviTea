import type { Completion } from './activity';
import type { Redemption } from './reward';
import { logicalDayKey } from './day';
import { deriveBalance } from './balance';
import { deriveStreakState } from './streak';

// History is a *derived projection* over the immutable logs, exactly like balance
// and streak (SPEC §6/§10) — never a stored aggregate. Two shapes come out of the
// logs: per-day buckets (for the calendar heatmap) and the headline totals.

// One logical day's activity. `earned`/`completed` come from the completion log;
// `redeemed` is the currency spent that day (from the redemption log).
export interface DailyStat {
  day: string; // logical-day key, local YYYY-MM-DD
  earned: number; // Σ valueEarned of that day's completions
  completed: number; // count of completions that day
  redeemed: number; // Σ costPaid of that day's redemptions
}

// Bucket both logs into per-logical-day stats, keyed by day. Days with no activity
// are simply absent (the heatmap fills the gaps for the range it draws).
export function deriveDailyStats(
  completions: Completion[],
  redemptions: Redemption[],
  dayStartMinutes: number,
): Map<string, DailyStat> {
  const byDay = new Map<string, DailyStat>();
  const bucket = (day: string): DailyStat => {
    let stat = byDay.get(day);
    if (!stat) {
      stat = { day, earned: 0, completed: 0, redeemed: 0 };
      byDay.set(day, stat);
    }
    return stat;
  };

  for (const c of completions) {
    const stat = bucket(logicalDayKey(c.completedAt, dayStartMinutes));
    stat.earned += c.valueEarned;
    stat.completed += 1;
  }
  for (const r of redemptions) {
    bucket(logicalDayKey(r.redeemedAt, dayStartMinutes)).redeemed += r.costPaid;
  }

  return byDay;
}

// The headline numbers for the stats page. Balance and streak reuse the same
// projections the top bar shows, so History can never disagree with them.
export interface StatsSummary {
  totalEarned: number;
  totalSpent: number;
  balance: number;
  tasksCompleted: number;
  activeDays: number; // distinct logical days with at least one completion
  currentStreak: number;
  longestStreak: number;
}

export function summarizeStats(
  completions: Completion[],
  redemptions: Redemption[],
  dayStartMinutes: number,
  now: string,
): StatsSummary {
  const totalEarned = completions.reduce((sum, c) => sum + c.valueEarned, 0);
  const totalSpent = redemptions.reduce((sum, r) => sum + r.costPaid, 0);
  const activeDays = new Set(
    completions.map((c) => logicalDayKey(c.completedAt, dayStartMinutes)),
  ).size;
  const { currentStreak, longestStreak } = deriveStreakState(
    completions,
    dayStartMinutes,
    now,
  );

  return {
    totalEarned,
    totalSpent,
    balance: deriveBalance(completions, redemptions),
    tasksCompleted: completions.length,
    activeDays,
    currentStreak,
    longestStreak,
  };
}
