import Dexie, { type EntityTable } from 'dexie';
import type { Activity, Completion } from '../../domain/activity';

// Local-first storage backed by IndexedDB via Dexie. One storage path that runs
// in both a plain browser (the hosted CV build) and the Tauri shell. The index
// strings list only the fields we query/sort on; full objects are still stored.
export class ProductiviTeaDB extends Dexie {
  activities!: EntityTable<Activity, 'id'>;
  completions!: EntityTable<Completion, 'id'>;

  constructor() {
    super('productivitea');
    this.version(1).stores({
      activities: 'id, status, createdAt',
      completions: 'id, activityId, completedAt',
    });
  }
}

export const db = new ProductiviTeaDB();
