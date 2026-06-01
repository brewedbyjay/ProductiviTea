// Import first so a fake IndexedDB exists before db.ts instantiates Dexie.
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { db } from './db';
import { activityRepository, completionRepository } from './repositories';
import { createActivity } from '../../application/createActivity';
import { completeActivity } from '../../application/completeActivity';
import { getBalance } from '../../application/getBalance';

afterEach(async () => {
  await db.activities.clear();
  await db.completions.clear();
});

describe('core loop (Dexie integration)', () => {
  it('create -> complete -> balance accrues, and state persists in the store', async () => {
    const activity = await createActivity(activityRepository, {
      name: 'Read 20 min',
      baseFibonacciValue: 3,
    });

    expect(await getBalance(completionRepository)).toBe(0);

    await completeActivity(completionRepository, activity);
    expect(await getBalance(completionRepository)).toBe(3);

    await completeActivity(completionRepository, activity);
    expect(await getBalance(completionRepository)).toBe(6);

    // "Reload": read back from the store rather than from in-memory state.
    const persistedActivities = await activityRepository.getAll();
    expect(persistedActivities).toHaveLength(1);
    expect(persistedActivities[0].name).toBe('Read 20 min');

    // The completion log is append-only — two completions recorded.
    expect(await completionRepository.getAll()).toHaveLength(2);
  });
});
