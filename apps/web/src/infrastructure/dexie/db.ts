import Dexie, { type EntityTable } from 'dexie';
import type { Activity, Completion } from '../../domain/activity';
import type { Redemption, Reward } from '../../domain/reward';

// Local-first storage backed by IndexedDB via Dexie. One storage path that runs
// in both a plain browser (the hosted CV build) and the Tauri shell. The index
// strings list only the fields we query/sort on; full objects are still stored.
export class ProductiviTeaDB extends Dexie {
  activities!: EntityTable<Activity, 'id'>;
  completions!: EntityTable<Completion, 'id'>;
  rewards!: EntityTable<Reward, 'id'>;
  redemptions!: EntityTable<Redemption, 'id'>;

  constructor() {
    super('productivitea');
    // v1: the earning side (tasks + completion log).
    this.version(1).stores({
      activities: 'id, status, createdAt',
      completions: 'id, activityId, completedAt',
    });
    // v2: the spending side (rewards + redemption log). Dexie auto-migrates;
    // existing v1 stores carry over unchanged.
    this.version(2).stores({
      rewards: 'id, status, createdAt',
      redemptions: 'id, rewardId, redeemedAt',
    });
  }
}

export const db = new ProductiviTeaDB();
