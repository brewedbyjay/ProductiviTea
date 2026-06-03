import {
  deriveDailyStats,
  summarizeStats,
  type DailyStat,
  type StatsSummary,
} from '../domain/stats';
import type {
  CompletionRepository,
  RedemptionRepository,
  SettingsRepository,
} from './ports';
import { getSettings } from './getSettings';

export interface Stats {
  daily: Map<string, DailyStat>;
  summary: StatsSummary;
}

// Use-case: build the History view's data. Loads both logs and the day-start
// setting, then projects them through the domain — every number is recomputed
// from the logs (SPEC §10), so History always agrees with the top bar.
export async function getStats(
  completions: CompletionRepository,
  redemptions: RedemptionRepository,
  settings: SettingsRepository,
  now: string = new Date().toISOString(),
): Promise<Stats> {
  const [completed, redeemed, { dayStartMinutes }] = await Promise.all([
    completions.getAll(),
    redemptions.getAll(),
    getSettings(settings),
  ]);

  return {
    daily: deriveDailyStats(completed, redeemed, dayStartMinutes),
    summary: summarizeStats(completed, redeemed, dayStartMinutes, now),
  };
}
