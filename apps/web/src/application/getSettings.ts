import { DEFAULT_DAY_START_MINUTES, type UserSettings } from '../domain/settings';
import type { SettingsRepository } from './ports';

// Use-case: read the user's settings, falling back to defaults when none have
// been saved yet (first run). The rest of the app never sees `undefined`.
export async function getSettings(
  repo: SettingsRepository,
): Promise<UserSettings> {
  const stored = await repo.get();
  return stored ?? { dayStartMinutes: DEFAULT_DAY_START_MINUTES };
}
