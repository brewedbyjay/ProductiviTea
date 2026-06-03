import type { UserSettings } from '../domain/settings';
import type { SettingsRepository } from './ports';

// Use-case: persist the user's settings (e.g. a changed day-start). Whole-object
// save keeps the single-row store simple; the boundary recomputes on next read.
export async function saveSettings(
  repo: SettingsRepository,
  settings: UserSettings,
): Promise<void> {
  await repo.save(settings);
}
