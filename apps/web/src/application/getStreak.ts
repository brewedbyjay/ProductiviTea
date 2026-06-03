import { deriveStreakState, type StreakState } from '../domain/streak';
import type { CompletionRepository, SettingsRepository } from './ports';
import { getSettings } from './getSettings';

// Use-case: read the current streak. Loads the completion log and the day-start
// setting, then projects them through the domain — the streak is always
// recomputed, never stored as a running counter (SPEC §10), exactly like balance.
export async function getStreak(
  completions: CompletionRepository,
  settings: SettingsRepository,
  now: string = new Date().toISOString(),
): Promise<StreakState> {
  const [log, { dayStartMinutes }] = await Promise.all([
    completions.getAll(),
    getSettings(settings),
  ]);
  return deriveStreakState(log, dayStartMinutes, now);
}
