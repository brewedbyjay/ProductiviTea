// The day boundary. SPEC §5: the logical day starts at a user-set time (e.g. 4am),
// not midnight — so late-night effort counts toward the day it *feels* like, and
// isn't punished. Everything that reasons about "today" or per-day streaks goes
// through here so the boundary is defined in exactly one place.

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Maps an instant to the calendar key (local `YYYY-MM-DD`) of the logical day it
// belongs to. An instant earlier in the clock-day than `dayStartMinutes` rolls
// back to the previous day: we shift local wall-clock time back by the day-start
// offset, then read off the date. With a 4am start, 1am Tuesday -> "Monday".
export function logicalDayKey(instant: string, dayStartMinutes: number): string {
  const shifted = new Date(instant);
  shifted.setMinutes(shifted.getMinutes() - dayStartMinutes);
  return localDateKey(shifted);
}

// The logical day that `now` falls in — the anchor for "today".
export function logicalToday(now: string, dayStartMinutes: number): string {
  return logicalDayKey(now, dayStartMinutes);
}

// Day key arithmetic, in whole logical days. `daysBetween` is later − earlier, so
// consecutive days differ by 1. Both keys are local `YYYY-MM-DD`.
export function daysBetween(earlier: string, later: string): number {
  return Math.round((dayNumber(later) - dayNumber(earlier)) / MS_PER_DAY);
}

// Local date as `YYYY-MM-DD` (not UTC — the boundary is the user's wall clock).
function localDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// A day key as a sortable/diffable number of whole days since the epoch, read in
// local time. Used only for `daysBetween`.
function dayNumber(key: string): number {
  const [year, month, day] = key.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}
