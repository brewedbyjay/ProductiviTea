import type {
  ActivityRepository,
  CompletionRepository,
  RedemptionRepository,
  RewardRepository,
  SettingsRepository,
} from './ports';

// Maintenance use-cases: bulk wipes of the local store. `resetAccount` is the
// user-facing "start over" (clears everything); the other two are debug helpers
// for testing after data-model changes. Each clears whole stores via the ports,
// so a phase-2 API backend implements the same contract server-side.

// Remove every task definition but KEEP the completion log, so the earned balance
// (and streak/stats, which derive from the same log) is untouched. Orphaned
// completions are harmless: `getToday` maps over existing activities so they don't
// render, while `getBalance` still sums them.
export async function removeAllTasks(
  activities: ActivityRepository,
): Promise<void> {
  await activities.clear();
}

// Zero the balance by clearing both ledgers it derives from. This also resets the
// streak and per-day stats (they share the completion log); task and reward
// *definitions* are untouched.
export async function resetCoins(
  completions: CompletionRepository,
  redemptions: RedemptionRepository,
): Promise<void> {
  await Promise.all([completions.clear(), redemptions.clear()]);
}

// Full account reset: tasks, completions, rewards, redemptions, and settings.
export async function resetAccount(
  activities: ActivityRepository,
  completions: CompletionRepository,
  rewards: RewardRepository,
  redemptions: RedemptionRepository,
  settings: SettingsRepository,
): Promise<void> {
  await Promise.all([
    activities.clear(),
    completions.clear(),
    rewards.clear(),
    redemptions.clear(),
    settings.clear(),
  ]);
}
