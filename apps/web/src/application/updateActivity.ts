import type { Activity, Cadence, ValueType } from '../domain/activity';
import type { ActivityRepository } from './ports';

// The editable parts of a task definition. Identity and creation metadata (id,
// createdAt, status) are never changed here. Every field is optional so callers
// can patch just what changed; anything omitted keeps the existing value.
export interface UpdateActivityInput {
  name?: string;
  description?: string;
  valueType?: ValueType;
  cadence?: Cadence;
  baseFibonacciValue?: number;
  defaultAmount?: number;
  unit?: string;
  intervalDays?: number;
  reminderDays?: number;
}

// Use-case: edit an existing task definition. Merges the patch onto the current
// activity, then re-applies the same shape rules as createActivity so the stored
// record stays consistent with its (possibly changed) type/cadence — a task that
// becomes Simple drops its amount/unit, a non-recurring one drops its interval
// fields. Past completions snapshot their reward, so re-pricing never touches the
// existing balance/stats (SPEC §10).
export async function updateActivity(
  repo: ActivityRepository,
  existing: Activity,
  input: UpdateActivityInput,
): Promise<Activity> {
  const valueType = input.valueType ?? existing.valueType;
  const cadence = input.cadence ?? existing.cadence;
  const scaled = valueType === 'Quantitative' || valueType === 'Timed';
  const recurring = cadence === 'FlexibleInterval';

  const updated: Activity = {
    ...existing,
    name: (input.name ?? existing.name).trim(),
    description: input.description ?? existing.description,
    valueType,
    cadence,
    baseFibonacciValue: input.baseFibonacciValue ?? existing.baseFibonacciValue,
    defaultAmount: scaled ? input.defaultAmount ?? existing.defaultAmount : undefined,
    unit:
      valueType === 'Quantitative'
        ? (input.unit ?? existing.unit)?.trim() || undefined
        : undefined,
    intervalDays: recurring ? input.intervalDays ?? existing.intervalDays : undefined,
    reminderDays: recurring ? input.reminderDays ?? existing.reminderDays : undefined,
  };

  await repo.update(updated);
  return updated;
}
