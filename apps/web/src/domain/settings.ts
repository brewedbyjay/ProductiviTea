import type { Category } from './category';

// User-controlled settings. A deliberate subset of SPEC §11's UserSettings —
// enough to drive the day boundary, streaks, and category colors. The full model
// also carries per-weekday day-starts, notification toggles, and display prefs.
export interface UserSettings {
  // Minutes past local midnight at which a new logical day begins (SPEC §5).
  // GROWTH POINT: SPEC §11 makes this per-weekday (`dayStartByWeekday`); we ship a
  // single global value and expand the shape when the per-weekday UI lands.
  dayStartMinutes: number;
  // The color each category card uses, chosen by the user from the palette — one
  // color per category (SPEC §11 Group.color, applied to the built-in categories).
  // Absent until the user picks; a category with no color renders neutral.
  categoryColors?: Partial<Record<Category, string>>;
}

// 4am — the example day-start in SPEC §5. Late-night effort before this counts
// toward the previous day.
export const DEFAULT_DAY_START_MINUTES = 4 * 60;
