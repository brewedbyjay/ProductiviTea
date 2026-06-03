import type {
  ActivityRepository,
  CompletionRepository,
  RedemptionRepository,
  RewardRepository,
  SettingsRepository,
} from '../../application/ports';
import { db, SETTINGS_ID } from './db';

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
  async update(activity) {
    // put overwrites the whole record by primary key, so the use-case's
    // normalized shape is stored exactly (cleared fields actually disappear).
    await db.activities.put(activity);
  },
  async clear() {
    await db.activities.clear();
  },
};

export const completionRepository: CompletionRepository = {
  async add(completion) {
    await db.completions.add(completion);
  },
  async getAll() {
    return db.completions.toArray();
  },
  async remove(id) {
    await db.completions.delete(id);
  },
  async update(id, patch) {
    // Dexie merges only the given keys onto the stored record.
    await db.completions.update(id, patch);
  },
  async clear() {
    await db.completions.clear();
  },
};

export const rewardRepository: RewardRepository = {
  async add(reward) {
    await db.rewards.add(reward);
  },
  async getAll() {
    return db.rewards.toArray();
  },
  async clear() {
    await db.rewards.clear();
  },
};

export const redemptionRepository: RedemptionRepository = {
  async add(redemption) {
    await db.redemptions.add(redemption);
  },
  async getAll() {
    return db.redemptions.toArray();
  },
  async clear() {
    await db.redemptions.clear();
  },
};

export const settingsRepository: SettingsRepository = {
  async get() {
    // The fixed-key row carries the storage id alongside the payload; the port
    // exposes only the domain UserSettings, so map the fields out explicitly.
    const row = await db.settings.get(SETTINGS_ID);
    if (!row) return undefined;
    return {
      dayStartMinutes: row.dayStartMinutes,
      categoryColors: row.categoryColors,
    };
  },
  async save(settings) {
    await db.settings.put({ id: SETTINGS_ID, ...settings });
  },
  async clear() {
    await db.settings.clear();
  },
};
