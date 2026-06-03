import type { Activity, Completion } from '../domain/activity';
import { earnedFor } from '../domain/earning';
import type { CompletionRepository } from './ports';

// How much was done, captured at completion. Optional — Simple tasks pass nothing,
// and a Quantitative/Timed task that's just checked off defaults to its anchor
// amount (so ticking the box earns the default reward). The amount is editable
// afterwards via `updateCompletionAmount`.
export interface Measurement {
  quantity?: number;
  durationMinutes?: number;
}

// Use-case: mark a task done. Records the measured amount (defaulting to the
// task's anchor when none is given) and the reward that amount earns. The reward
// is snapshotted so a later edit to the *activity* never rewrites it (SPEC §10).
export async function completeActivity(
  repo: CompletionRepository,
  activity: Activity,
  measurement: Measurement = {},
): Promise<Completion> {
  // Ticking the box with no amount counts as "did the default amount".
  const quantity =
    activity.valueType === 'Quantitative'
      ? measurement.quantity ?? activity.defaultAmount
      : measurement.quantity;
  const durationMinutes =
    activity.valueType === 'Timed'
      ? measurement.durationMinutes ?? activity.defaultAmount
      : measurement.durationMinutes;

  const completion: Completion = {
    id: crypto.randomUUID(),
    activityId: activity.id,
    completedAt: new Date().toISOString(),
    valueEarned: earnedFor(activity, { quantity, durationMinutes }),
    quantity,
    durationMinutes,
  };
  await repo.add(completion);
  return completion;
}
