// Core domain entities. A deliberate subset of SPEC §11 — enough to drive the
// first vertical slice (create -> complete -> earn) while leaving room for the
// full model (groups, projects, streak-killers, etc.) to grow in later.

// How an activity earns. The slice only exercises Simple; the rest are modelled
// now so the type is honest about the domain.
export type ValueType = 'Simple' | 'Quantitative' | 'Timed' | 'Project';

// When/how often an activity recurs. The user-facing category (Daily/Recurring/
// One-time) is derived from this, never stored.
export type Cadence = 'DailyRecurring' | 'OneOff' | 'FlexibleInterval' | 'FixedDate';

export type ActivityStatus = 'Active' | 'Paused' | 'Completed' | 'Archived';

// The user-defined task definition.
export interface Activity {
  id: string;
  name: string;
  description?: string;
  valueType: ValueType;
  cadence: Cadence;
  // The flat Fibonacci payout for a Simple activity (SPEC §2).
  baseFibonacciValue: number;
  status: ActivityStatus;
  createdAt: string; // ISO-8601
}

// An append-only, immutable record of one completion. It snapshots the value
// earned at that moment so editing the activity later never rewrites history
// and balance/stats stay consistent (SPEC §10).
export interface Completion {
  id: string;
  activityId: string;
  completedAt: string; // ISO-8601
  valueEarned: number; // snapshot — not recomputed from the activity
  note?: string;
}
