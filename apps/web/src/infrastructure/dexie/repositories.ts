import type {
  ActivityRepository,
  CompletionRepository,
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
