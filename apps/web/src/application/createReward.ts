import type { CostPolicy, Reward, RewardSource } from '../domain/reward';
import type { RewardRepository } from './ports';

export interface CreateRewardInput {
  name: string;
  baseCost: number;
  // Default to the simplest case for the slice; callers can override later.
  source?: RewardSource;
  costPolicy?: CostPolicy;
  description?: string;
}

// Use-case: define a new reward. Assigns identity and metadata, then persists
// via the repository port. Mirrors createActivity on the earning side.
export async function createReward(
  repo: RewardRepository,
  input: CreateRewardInput,
): Promise<Reward> {
  const reward: Reward = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    description: input.description,
    source: input.source ?? 'Shop',
    costPolicy: input.costPolicy ?? 'Flat',
    baseCost: input.baseCost,
    status: 'Active',
    createdAt: new Date().toISOString(),
  };
  await repo.add(reward);
  return reward;
}
