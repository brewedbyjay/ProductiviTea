import type { Activity } from '../domain/activity';
import { earnedFor } from '../domain/earning';
import type { CompletionRepository } from './ports';
import type { Measurement } from './completeActivity';

// Use-case: change the recorded amount/time on an existing completion. The reward
// is re-derived from the new amount (SPEC §2 linear earning) and saved alongside
// it, so raising the amount raises the reward and lowering it lowers the reward.
// Returns the new reward so the caller can reflect the balance change. The
// "warn before lowering" decision lives in the UI; this use-case just applies it.
export async function updateCompletionAmount(
  repo: CompletionRepository,
  completionId: string,
  activity: Activity,
  measurement: Measurement,
): Promise<number> {
  const valueEarned = earnedFor(activity, measurement);
  await repo.update(completionId, {
    quantity: measurement.quantity,
    durationMinutes: measurement.durationMinutes,
    valueEarned,
  });
  return valueEarned;
}
