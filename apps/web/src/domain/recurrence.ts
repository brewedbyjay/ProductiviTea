import type { Completion } from './activity';
import { daysBetween, logicalDayKey, logicalToday } from './day';

// Whether a flexible-interval (Recurring) task is due, derived from its completion
// log (SPEC §3). The rolling window runs from the *last* completion: the task is
// due again once `intervalDays` have elapsed since it was last done. A task that
// has never been done is due now.
export interface RecurrenceState {
  due: boolean;
  daysUntilDue: number; // 0 when due now
  lastCompletedDay: string | null; // local YYYY-MM-DD, or null if never done
}

export function recurrenceState(
  completions: Completion[],
  intervalDays: number,
  dayStartMinutes: number,
  now: string,
): RecurrenceState {
  if (completions.length === 0) {
    return { due: true, daysUntilDue: 0, lastCompletedDay: null };
  }

  const lastCompletedDay = completions
    .map((c) => logicalDayKey(c.completedAt, dayStartMinutes))
    .reduce((latest, day) => (day > latest ? day : latest));

  const elapsed = daysBetween(lastCompletedDay, logicalToday(now, dayStartMinutes));
  const daysUntilDue = Math.max(0, intervalDays - elapsed);

  return { due: daysUntilDue === 0, daysUntilDue, lastCompletedDay };
}
