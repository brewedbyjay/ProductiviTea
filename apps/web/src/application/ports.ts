import type { Activity, Completion } from '../domain/activity';
import type { Redemption, Reward } from '../domain/reward';
import type { UserSettings } from '../domain/settings';

// Repository ports — the seam between use-cases and storage. The slice backs
// these with Dexie/IndexedDB; phase 2 swaps in an API client implementation
// without touching any use-case (SPEC §10 "persistence abstraction").

export interface ActivityRepository {
  add(activity: Activity): Promise<void>;
  getAll(): Promise<Activity[]>;
  // Overwrite an existing task definition (edit). Takes the whole record so the
  // normalized shape — e.g. dropping amount/unit when a task becomes Simple — is
  // stored verbatim rather than merged. Past completions keep their snapshots
  // (SPEC §10), so editing a definition never rewrites earned history.
  update(activity: Activity): Promise<void>;
  // Wipe every record (account/debug resets). Phase 2 maps this to a bulk delete.
  clear(): Promise<void>;
}

// The editable fields of an existing completion. The amount and its re-priced
// reward move together (see `updateCompletionAmount`); identity/timestamp don't.
export type CompletionPatch = Partial<
  Pick<Completion, 'quantity' | 'durationMinutes' | 'valueEarned' | 'note'>
>;

export interface CompletionRepository {
  add(completion: Completion): Promise<void>;
  getAll(): Promise<Completion[]>;
  // Un-completing a task deletes its completion so balance/streak recompute from
  // the log (SPEC §11).
  remove(id: string): Promise<void>;
  // Apply an edit to one completion — used to re-price it when the user changes
  // the recorded amount (re-measuring the same act, SPEC §11).
  update(id: string, patch: CompletionPatch): Promise<void>;
  // Wipe the whole completion log (account/debug resets).
  clear(): Promise<void>;
}

export interface RewardRepository {
  add(reward: Reward): Promise<void>;
  getAll(): Promise<Reward[]>;
  // Wipe every reward (account reset).
  clear(): Promise<void>;
}

export interface RedemptionRepository {
  // Append-only spend log, mirroring CompletionRepository (SPEC §10).
  add(redemption: Redemption): Promise<void>;
  getAll(): Promise<Redemption[]>;
  // Wipe the whole spend log (account/debug resets).
  clear(): Promise<void>;
}

export interface SettingsRepository {
  // A single user's settings (MVP is a single implicit user — SPEC §11). Returns
  // undefined until anything has been saved; callers fall back to defaults.
  get(): Promise<UserSettings | undefined>;
  save(settings: UserSettings): Promise<void>;
  // Drop saved settings (account reset) so callers fall back to defaults.
  clear(): Promise<void>;
}
