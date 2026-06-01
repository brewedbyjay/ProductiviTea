import type { Activity, Completion } from '../domain/activity';
import type { CompletionRepository } from './ports';

// Use-case: mark a task done. Appends an immutable completion that *snapshots*
// the value earned right now, so later edits to the activity never rewrite this
// payout (SPEC §10). For a Simple activity the payout is its base value.
export async function completeActivity(
  repo: CompletionRepository,
  activity: Activity,
): Promise<Completion> {
  const completion: Completion = {
    id: crypto.randomUUID(),
    activityId: activity.id,
    completedAt: new Date().toISOString(),
    valueEarned: activity.baseFibonacciValue,
  };
  await repo.add(completion);
  return completion;
}
