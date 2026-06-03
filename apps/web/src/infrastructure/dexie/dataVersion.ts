import { db } from './db';

// Local-data schema/version guard. Because task definitions live in IndexedDB,
// they keep their old shape while the code evolves — so old and new records can
// behave differently. Bumping DATA_VERSION forces a one-time wipe on the next
// load, guaranteeing the stored data always matches the current model.
//
// This is a deliberately blunt, destructive reset (the local-first slice has no
// migrations yet); revisit with real migrations once there is data worth keeping.
export const DATA_VERSION = 1;

const STORAGE_KEY = 'productivitea:dataVersion';

// Clear every Dexie store when the stored version differs from DATA_VERSION, then
// record the new version. Mirrors the store set that `resetAccount` wipes. Runs
// before the first render (see main.tsx); any failure is swallowed so a storage
// hiccup never blocks the app from starting.
export async function ensureDataVersion(): Promise<void> {
  if (typeof localStorage === 'undefined') return;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === String(DATA_VERSION)) return;

    await Promise.all([
      db.activities.clear(),
      db.completions.clear(),
      db.rewards.clear(),
      db.redemptions.clear(),
      db.settings.clear(),
    ]);
    localStorage.setItem(STORAGE_KEY, String(DATA_VERSION));
  } catch {
    // Storage unavailable or wipe failed — start the app anyway.
  }
}
