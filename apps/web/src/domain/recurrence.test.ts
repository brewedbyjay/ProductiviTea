import { describe, expect, it } from 'vitest';
import { recurrenceState } from './recurrence';
import type { Completion } from './activity';

const DAY_START_4AM = 4 * 60;
const NOW = '2026-06-15T12:00:00';

function doneOn(day: string): Completion {
  return {
    id: crypto.randomUUID(),
    activityId: 'a1',
    completedAt: `${day}T12:00:00`,
    valueEarned: 3,
  };
}

describe('recurrenceState', () => {
  it('is due when never completed', () => {
    const s = recurrenceState([], 14, DAY_START_4AM, NOW);
    expect(s.due).toBe(true);
    expect(s.lastCompletedDay).toBeNull();
  });

  it('is not due within the interval, counting down from the last completion', () => {
    // Done 4 days ago, every 14 days -> 10 days left.
    const s = recurrenceState([doneOn('2026-06-11')], 14, DAY_START_4AM, NOW);
    expect(s.due).toBe(false);
    expect(s.daysUntilDue).toBe(10);
    expect(s.lastCompletedDay).toBe('2026-06-11');
  });

  it('is due again once the interval has elapsed', () => {
    // Done 14 days ago, every 14 days -> due now.
    const s = recurrenceState([doneOn('2026-06-01')], 14, DAY_START_4AM, NOW);
    expect(s.due).toBe(true);
    expect(s.daysUntilDue).toBe(0);
  });

  it('counts from the most recent completion, not the first', () => {
    const s = recurrenceState(
      [doneOn('2026-05-01'), doneOn('2026-06-14')],
      7,
      DAY_START_4AM,
      NOW,
    );
    expect(s.due).toBe(false);
    expect(s.daysUntilDue).toBe(6); // 1 day since the 14th, 7-day interval
  });
});
