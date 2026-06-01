import type { Completion } from './activity';

// Balance is a *derived projection* over the immutable completion log, never a
// stored mutable total (SPEC §10). For the first slice it is simply the sum of
// every completion's snapshotted payout. Later this gains the subtractions for
// redemptions, streak-savers, and savings deposits — all as further projections
// over their own append-only logs.
export function deriveBalance(completions: Completion[]): number {
  return completions.reduce((sum, c) => sum + c.valueEarned, 0);
}
