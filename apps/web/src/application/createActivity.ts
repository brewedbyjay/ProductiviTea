import type { Activity, Cadence, ValueType } from '../domain/activity';
import type { ActivityRepository } from './ports';

export interface CreateActivityInput {
  name: string;
  baseFibonacciValue: number;
  // Default to the simplest case for the slice; callers can override later.
  valueType?: ValueType;
  cadence?: Cadence;
  description?: string;
}

// Use-case: define a new task. Assigns identity and creation metadata, then
// persists via the repository port.
export async function createActivity(
  repo: ActivityRepository,
  input: CreateActivityInput,
): Promise<Activity> {
  const activity: Activity = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    description: input.description,
    valueType: input.valueType ?? 'Simple',
    cadence: input.cadence ?? 'DailyRecurring',
    baseFibonacciValue: input.baseFibonacciValue,
    status: 'Active',
    createdAt: new Date().toISOString(),
  };
  await repo.add(activity);
  return activity;
}
