import type { Activity, Cadence, ValueType } from '../domain/activity';
import type { ActivityRepository } from './ports';

export interface CreateActivityInput {
  name: string;
  // The default reward (Fibonacci) earned when the default amount is done.
  baseFibonacciValue: number;
  // Default to the simplest case; callers can override.
  valueType?: ValueType;
  cadence?: Cadence;
  description?: string;
  // The anchor amount (reps/minutes) that earns the default reward — required for
  // Quantitative/Timed, ignored for Simple.
  defaultAmount?: number;
  // The counting unit for a Quantitative task (e.g. "reps"); ignored otherwise.
  unit?: string;
  // The "latest due" interval for a Recurring (FlexibleInterval) task, in days.
  intervalDays?: number;
  // The soft "reminder" point for a Recurring task, in days (<= intervalDays).
  reminderDays?: number;
}

// Use-case: define a new task. Assigns identity and creation metadata, then
// persists via the repository port. Quantitative/Timed tasks keep their anchor
// amount; Simple tasks drop the amount/unit so the stored shape matches the type.
export async function createActivity(
  repo: ActivityRepository,
  input: CreateActivityInput,
): Promise<Activity> {
  const valueType = input.valueType ?? 'Simple';
  const cadence = input.cadence ?? 'DailyRecurring';
  const scaled = valueType === 'Quantitative' || valueType === 'Timed';
  const recurring = cadence === 'FlexibleInterval';
  const activity: Activity = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    description: input.description,
    valueType,
    cadence,
    baseFibonacciValue: input.baseFibonacciValue,
    defaultAmount: scaled ? input.defaultAmount : undefined,
    unit: valueType === 'Quantitative' ? input.unit?.trim() || undefined : undefined,
    intervalDays: recurring ? input.intervalDays : undefined,
    reminderDays: recurring ? input.reminderDays : undefined,
    status: 'Active',
    createdAt: new Date().toISOString(),
  };
  await repo.add(activity);
  return activity;
}
