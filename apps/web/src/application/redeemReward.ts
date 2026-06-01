import { canAfford } from '../domain/balance';
import type { Redemption, Reward } from '../domain/reward';
import type { CompletionRepository, RedemptionRepository } from './ports';
import { getBalance } from './getBalance';

// Thrown when a redemption would put the balance into debt. The no-debt rule is
// the spine of the product, so it is enforced here in the use-case rather than
// relying on the UI to disable a button (SPEC §2).
export const INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE';

// Use-case: redeem a reward. Recomputes the current balance from both logs,
// enforces affordability, then appends an immutable redemption snapshotting the
// cost paid. Mirrors completeActivity on the earning side.
export async function redeemReward(
  completions: CompletionRepository,
  redemptions: RedemptionRepository,
  reward: Reward,
): Promise<Redemption> {
  const balance = await getBalance(completions, redemptions);
  if (!canAfford(balance, reward.baseCost)) {
    throw new Error(INSUFFICIENT_BALANCE);
  }

  const redemption: Redemption = {
    id: crypto.randomUUID(),
    rewardId: reward.id,
    redeemedAt: new Date().toISOString(),
    costPaid: reward.baseCost,
  };
  await redemptions.add(redemption);
  return redemption;
}
