// Import first so a fake IndexedDB exists before db.ts instantiates Dexie.
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { db } from './db';
import {
  activityRepository,
  completionRepository,
  redemptionRepository,
  rewardRepository,
} from './repositories';
import { createActivity } from '../../application/createActivity';
import { completeActivity } from '../../application/completeActivity';
import { createReward } from '../../application/createReward';
import {
  redeemReward,
  INSUFFICIENT_BALANCE,
} from '../../application/redeemReward';
import { getBalance } from '../../application/getBalance';

afterEach(async () => {
  await db.activities.clear();
  await db.completions.clear();
  await db.rewards.clear();
  await db.redemptions.clear();
});

const balance = () => getBalance(completionRepository, redemptionRepository);

describe('core loop (Dexie integration)', () => {
  it('create -> complete -> balance accrues, and state persists in the store', async () => {
    const activity = await createActivity(activityRepository, {
      name: 'Read 20 min',
      baseFibonacciValue: 3,
    });

    expect(await balance()).toBe(0);

    await completeActivity(completionRepository, activity);
    expect(await balance()).toBe(3);

    await completeActivity(completionRepository, activity);
    expect(await balance()).toBe(6);

    // "Reload": read back from the store rather than from in-memory state.
    const persistedActivities = await activityRepository.getAll();
    expect(persistedActivities).toHaveLength(1);
    expect(persistedActivities[0].name).toBe('Read 20 min');

    // The completion log is append-only — two completions recorded.
    expect(await completionRepository.getAll()).toHaveLength(2);
  });

  it('earn -> redeem a reward -> balance drops by the cost, redemption logged', async () => {
    const activity = await createActivity(activityRepository, {
      name: 'Read 20 min',
      baseFibonacciValue: 3,
    });
    await completeActivity(completionRepository, activity);
    await completeActivity(completionRepository, activity); // balance 6

    const cola = await createReward(rewardRepository, { name: 'Cola', baseCost: 5 });
    await redeemReward(completionRepository, redemptionRepository, cola);

    expect(await balance()).toBe(1);
    expect(await redemptionRepository.getAll()).toHaveLength(1);
  });

  it('enforces the no-debt rule: cannot redeem above the balance', async () => {
    const activity = await createActivity(activityRepository, {
      name: 'Read 20 min',
      baseFibonacciValue: 3,
    });
    await completeActivity(completionRepository, activity); // balance 3

    const movie = await createReward(rewardRepository, { name: 'Movie', baseCost: 8 });

    await expect(
      redeemReward(completionRepository, redemptionRepository, movie),
    ).rejects.toThrow(INSUFFICIENT_BALANCE);

    // Balance untouched and nothing logged.
    expect(await balance()).toBe(3);
    expect(await redemptionRepository.getAll()).toHaveLength(0);
  });
});
