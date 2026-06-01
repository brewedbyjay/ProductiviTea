import type { Completion } from './activity';
import type { Redemption } from './reward';

// Balance is a *derived projection* over the immutable logs, never a stored
// mutable total (SPEC §10). It is everything earned minus everything spent:
//   Σ Completion.valueEarned − Σ Redemption.costPaid
// Redemptions default to empty so pure callers that only have completions stay
// valid. Future sinks (streak-savers, savings deposits) are further subtractions.
export function deriveBalance(
  completions: Completion[],
  redemptions: Redemption[] = [],
): number {
  const earned = completions.reduce((sum, c) => sum + c.valueEarned, 0);
  const spent = redemptions.reduce((sum, r) => sum + r.costPaid, 0);
  return earned - spent;
}

// The no-debt rule (SPEC §2): a reward is only redeemable once you can afford it.
export function canAfford(balance: number, cost: number): boolean {
  return balance >= cost;
}
