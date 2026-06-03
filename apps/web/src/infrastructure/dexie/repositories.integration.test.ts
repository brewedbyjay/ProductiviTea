// Import first so a fake IndexedDB exists before db.ts instantiates Dexie.
import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import { db } from './db';
import {
  activityRepository,
  completionRepository,
  redemptionRepository,
  rewardRepository,
  settingsRepository,
} from './repositories';
import { createActivity } from '../../application/createActivity';
import { updateActivity } from '../../application/updateActivity';
import { completeActivity } from '../../application/completeActivity';
import { uncompleteActivity } from '../../application/uncompleteActivity';
import { updateCompletionAmount } from '../../application/updateCompletionAmount';
import { createReward } from '../../application/createReward';
import {
  redeemReward,
  INSUFFICIENT_BALANCE,
} from '../../application/redeemReward';
import { getBalance } from '../../application/getBalance';
import { getSettings } from '../../application/getSettings';
import { saveSettings } from '../../application/saveSettings';
import { DEFAULT_DAY_START_MINUTES } from '../../domain/settings';

afterEach(async () => {
  await db.activities.clear();
  await db.completions.clear();
  await db.rewards.clear();
  await db.redemptions.clear();
  await db.settings.clear();
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

  it('un-completing removes the record and recomputes the balance down', async () => {
    const activity = await createActivity(activityRepository, {
      name: 'Read 20 min',
      baseFibonacciValue: 3,
    });
    const completion = await completeActivity(completionRepository, activity);
    expect(await balance()).toBe(3);

    await uncompleteActivity(completionRepository, completion.id);

    // The log entry is gone and the balance recomputes from what remains.
    expect(await balance()).toBe(0);
    expect(await completionRepository.getAll()).toHaveLength(0);
  });

  it('anchors a scaled task and re-prices the reward when the amount is edited', async () => {
    // Anchor: 10 reps = 3 coins.
    const pushups = await createActivity(activityRepository, {
      name: 'Push-ups',
      baseFibonacciValue: 3,
      valueType: 'Quantitative',
      defaultAmount: 10,
      unit: 'reps',
    });

    // Ticking the box with no amount records the anchor amount -> the reward.
    const completion = await completeActivity(completionRepository, pushups);
    expect(await balance()).toBe(3);

    // Doing more raises the reward linearly: 20 reps -> 6 coins.
    await updateCompletionAmount(completionRepository, completion.id, pushups, {
      quantity: 20,
    });
    let [stored] = await completionRepository.getAll();
    expect(stored.quantity).toBe(20);
    expect(stored.valueEarned).toBe(6);
    expect(await balance()).toBe(6);

    // Lowering the amount lowers the reward: 14 reps -> round(4.2) = 4 coins.
    await updateCompletionAmount(completionRepository, completion.id, pushups, {
      quantity: 14,
    });
    [stored] = await completionRepository.getAll();
    expect(stored.valueEarned).toBe(4);
    expect(await balance()).toBe(4);
  });

  it('edits a task definition without rewriting earned history', async () => {
    // Anchor: 10 reps = 3 coins, completed once for the anchor reward.
    const pushups = await createActivity(activityRepository, {
      name: 'Push-ups',
      baseFibonacciValue: 3,
      valueType: 'Quantitative',
      defaultAmount: 10,
      unit: 'reps',
    });
    await completeActivity(completionRepository, pushups);
    expect(await balance()).toBe(3);

    // Re-tier the reward and rename. The past completion keeps its snapshot, so
    // the balance is untouched; the stored definition reflects the new values.
    await updateActivity(activityRepository, pushups, {
      name: 'Push-ups (hard)',
      baseFibonacciValue: 5,
    });

    const [stored] = await activityRepository.getAll();
    expect(stored.name).toBe('Push-ups (hard)');
    expect(stored.baseFibonacciValue).toBe(5);
    expect(await balance()).toBe(3);
  });

  it('drops type-specific fields when the task type changes', async () => {
    const pushups = await createActivity(activityRepository, {
      name: 'Push-ups',
      baseFibonacciValue: 3,
      valueType: 'Quantitative',
      defaultAmount: 10,
      unit: 'reps',
    });

    // Count -> Basic: the amount/unit no longer apply and must not linger.
    await updateActivity(activityRepository, pushups, { valueType: 'Simple' });

    const [stored] = await activityRepository.getAll();
    expect(stored.valueType).toBe('Simple');
    expect(stored.defaultAmount).toBeUndefined();
    expect(stored.unit).toBeUndefined();
    // Single record — an edit overwrites rather than appending.
    expect(await activityRepository.getAll()).toHaveLength(1);
  });

  it('settings default until saved, then persist in the store', async () => {
    // Nothing saved yet -> the default day-start (SPEC §5).
    expect(await getSettings(settingsRepository)).toEqual({
      dayStartMinutes: DEFAULT_DAY_START_MINUTES,
    });

    await saveSettings(settingsRepository, { dayStartMinutes: 5 * 60 });
    expect(await getSettings(settingsRepository)).toEqual({
      dayStartMinutes: 5 * 60,
    });

    // Single-row store: a second save overwrites rather than appending.
    await saveSettings(settingsRepository, { dayStartMinutes: 6 * 60 });
    expect(await db.settings.count()).toBe(1);
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
