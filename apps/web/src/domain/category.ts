import type { Cadence } from './activity';

// The user-facing category — a task's type, shown as a card (SPEC §3/§9). It is
// *derived* from cadence, never stored: Daily ← daily-recurring, Recurring ←
// flexible/non-daily, One-time ← one-off (and any fixed-date, if that ever ships).
export type Category = 'Daily' | 'Recurring' | 'One-time';

// Display order of the category cards.
export const CATEGORIES: Category[] = ['Daily', 'Recurring', 'One-time'];

export function categoryOf(cadence: Cadence): Category {
  switch (cadence) {
    case 'DailyRecurring':
      return 'Daily';
    case 'FlexibleInterval':
      return 'Recurring';
    case 'OneOff':
    case 'FixedDate':
      return 'One-time';
  }
}

// The reverse mapping, for creating a task into a chosen category. Each category
// maps to its representative cadence (Recurring → flexible-interval per SPEC §13).
export function cadenceForCategory(category: Category): Cadence {
  switch (category) {
    case 'Daily':
      return 'DailyRecurring';
    case 'Recurring':
      return 'FlexibleInterval';
    case 'One-time':
      return 'OneOff';
  }
}
