import { deriveBalance } from '../domain/balance';
import type { CompletionRepository, RedemptionRepository } from './ports';

// Use-case: read the current spendable balance. Loads both the earning
// (completion) and spending (redemption) logs and projects them through the
// domain — balance is always recomputed, never read from a stored counter
// (SPEC §10).
export async function getBalance(
  completions: CompletionRepository,
  redemptions: RedemptionRepository,
): Promise<number> {
  const [completed, redeemed] = await Promise.all([
    completions.getAll(),
    redemptions.getAll(),
  ]);
  return deriveBalance(completed, redeemed);
}
