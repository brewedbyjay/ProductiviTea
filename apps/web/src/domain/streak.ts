import type { Completion } from './activity';
import { daysBetween, logicalDayKey, logicalToday } from './day';

// StreakState is a *derived projection* over the completion log (SPEC §10), never
// a stored counter — same discipline as `deriveBalance`. SPEC §5: a streak is the
// count of consecutive logical days on which at least one task was completed.
export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastQualifyingDay: string | null; // local YYYY-MM-DD, or null if nothing logged
}

const EMPTY: StreakState = {
  currentStreak: 0,
  longestStreak: 0,
  lastQualifyingDay: null,
};

// Project the completion log into a streak. A "qualifying day" is any logical day
// with >= 1 completion (any value — SPEC §5, rewards *doing*, not the app open).
//
// Gentle/forgiving rules (SPEC §5):
//  - The active run is still alive if the last qualifying day is today *or*
//    yesterday — not having done today's task yet doesn't break it mid-day.
//  - If the gap to today is larger than that, the run has lapsed: currentStreak 0.
//  - longestStreak is the best run ever and always stands (a break never erases it).
export function deriveStreakState(
  completions: Completion[],
  dayStartMinutes: number,
  now: string,
): StreakState {
  if (completions.length === 0) return EMPTY;

  // Distinct qualifying days, ascending.
  const days = [
    ...new Set(completions.map((c) => logicalDayKey(c.completedAt, dayStartMinutes))),
  ].sort();

  // Longest run of consecutive days, scanning once.
  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    run = daysBetween(days[i - 1], days[i]) === 1 ? run + 1 : 1;
    if (run > longest) longest = run;
  }

  const lastQualifyingDay = days[days.length - 1];

  // Is the run still current? Only if its last day is today or yesterday.
  const today = logicalToday(now, dayStartMinutes);
  const gapToToday = daysBetween(lastQualifyingDay, today);
  const current = gapToToday <= 1 ? run : 0;

  return { currentStreak: current, longestStreak: longest, lastQualifyingDay };
}
