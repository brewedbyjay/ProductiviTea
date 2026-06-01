import type {
  ActivityRepository,
  CompletionRepository,
  RedemptionRepository,
  RewardRepository,
} from '../../application/ports';
import { db } from './db';

// Dexie-backed implementations of the application ports. These are the only
// place that knows about IndexedDB — swapping to an API client later means
// providing alternative objects with the same shape.

export const activityRepository: ActivityRepository = {
  async add(activity) {
    await db.activities.add(activity);
  },
  async getAll() {
    return db.activities.toArray();
  },
};

export const completionRepository: CompletionRepository = {
  async add(completion) {
    await db.completions.add(completion);
  },
  async getAll() {
    return db.completions.toArray();
  },
};

export const rewardRepository: RewardRepository = {
  async add(reward) {
    await db.rewards.add(reward);
  },
  async getAll() {
    return db.rewards.toArray();
  },
};

export const redemptionRepository: RedemptionRepository = {
  async add(redemption) {
    await db.redemptions.add(redemption);
  },
  async getAll() {
    return db.redemptions.toArray();
  },
};
