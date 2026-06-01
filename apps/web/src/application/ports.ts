import type { Activity, Completion } from '../domain/activity';

// Repository ports — the seam between use-cases and storage. The slice backs
// these with Dexie/IndexedDB; phase 2 swaps in an API client implementation
// without touching any use-case (SPEC §10 "persistence abstraction").

export interface ActivityRepository {
  add(activity: Activity): Promise<void>;
  getAll(): Promise<Activity[]>;
}

export interface CompletionRepository {
  // Append-only: completions are never updated, only added (SPEC §10).
  add(completion: Completion): Promise<void>;
  getAll(): Promise<Completion[]>;
}
