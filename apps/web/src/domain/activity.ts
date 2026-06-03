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
  // The "default reward": the Fibonacci value earned when the default amount is
  // done (SPEC §2). For a Simple task it is simply the flat payout. For a
  // Quantitative/Timed task it anchors the linear reward — doing the default
  // amount earns exactly this, and more/less scales from here (see `earnedFor`).
  baseFibonacciValue: number;
  // The "default amount" anchor for Quantitative/Timed tasks: the amount (reps)
  // or minutes that earns the default reward. Undefined for Simple. Must be > 0.
  defaultAmount?: number;
  // For Quantitative activities, the unit the amount is counted in (e.g. "reps",
  // "pages"). Undefined for Simple/Timed.
  unit?: string;
  // For FlexibleInterval (Recurring) activities, the *latest due* interval: the
  // number of days after the last completion by which it should be done again —
  // the hard end of the rolling window (SPEC §3). Undefined for other cadences.
  intervalDays?: number;
  // For FlexibleInterval (Recurring) activities, the soft *reminder* point: how
  // many days after the last completion the user wants a nudge — earlier than (or
  // equal to) `intervalDays`. Stored for the Layer-1 notifications; undefined when
  // unset or for other cadences.
  reminderDays?: number;
  status: ActivityStatus;
  createdAt: string; // ISO-8601
}

// A record of one completion. `valueEarned` snapshots the reward at completion so
// editing the *activity definition* later never rewrites past balance/stats
// (SPEC §10). The measurement fields (`quantity`/`durationMinutes`) record how
// much was done (SPEC §11); the user can change the amount anytime, which
// deliberately *re-prices this one completion* (`valueEarned` is recomputed from
// the new amount via `earnedFor`) — that is re-measuring the same act, not
// rewriting history.
export interface Completion {
  id: string;
  activityId: string;
  completedAt: string; // ISO-8601
  valueEarned: number; // the reward for the recorded amount (see earnedFor)
  quantity?: number; // how many units done (Quantitative)
  durationMinutes?: number; // minutes spent (Timed)
  note?: string;
}
