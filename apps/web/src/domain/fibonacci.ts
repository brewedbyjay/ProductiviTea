// The universal value scale for ProductiviTea (SPEC §2). Both tasks and rewards
// are priced on these Fibonacci tiers. The non-linear gaps are deliberate: they
// discourage gaming the economy and force every value to be a considered choice.
export const FIBONACCI_TIERS = [1, 2, 3, 5, 8, 13, 21] as const;

export type FibonacciTier = (typeof FIBONACCI_TIERS)[number];

export function isFibonacciTier(value: number): value is FibonacciTier {
  return (FIBONACCI_TIERS as readonly number[]).includes(value);
}

// A quantity-or-duration threshold mapped to a Fibonacci payout. Used by
// Quantitative/Timed activities (post-slice) so effort is rewarded in deliberate
// jumps rather than linearly — preserving the anti-gaming property (SPEC §2).
export interface Milestone {
  // Minimum quantity/duration required to reach this tier.
  threshold: number;
  // Fibonacci value earned once the threshold is met.
  value: number;
}

// Snaps a measured amount to the highest milestone whose threshold it meets.
// Below the first threshold the activity earns nothing. Milestones need not be
// pre-sorted — we scan for the best qualifying tier.
export function snapToMilestone(amount: number, milestones: Milestone[]): number {
  return milestones
    .filter((m) => amount >= m.threshold)
    .reduce((best, m) => (m.value > best ? m.value : best), 0);
}
