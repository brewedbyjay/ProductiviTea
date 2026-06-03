import type { Activity } from './activity';

// How much an activity earns for a given measured amount (SPEC §2).
//
// - Simple: the flat default reward, regardless of any amount.
// - Quantitative/Timed: a *linear* reward anchored on the task's defaults —
//   doing the default amount earns the default reward, and the reward scales
//   proportionally from there:
//       earned = round(amount / defaultAmount * defaultReward)
//   We round to a whole number (no fractional coins): with a 10 reps = 3 anchor,
//   20 reps = 6, 14 reps = round(4.2) = 4. Linear (not exponential) on purpose —
//   the project motivates effort without letting one task be farmed into runaway
//   currency.
//
// `amount` is the measured quantity (Quantitative) or minutes (Timed). When it is
// missing, or the anchor is unusable, we fall back to the default reward.
export function earnedFor(
  activity: Activity,
  measurement: { quantity?: number; durationMinutes?: number },
): number {
  if (activity.valueType === 'Simple') return activity.baseFibonacciValue;

  const amount =
    activity.valueType === 'Timed'
      ? measurement.durationMinutes
      : measurement.quantity;
  const anchor = activity.defaultAmount;

  if (amount == null || anchor == null || anchor <= 0) {
    return activity.baseFibonacciValue;
  }
  return Math.round((amount / anchor) * activity.baseFibonacciValue);
}
