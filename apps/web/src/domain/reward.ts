// Reward domain entities. A subset of SPEC §4/§11 — enough for the shop slice
// (Shop-source rewards with a Flat cost policy) while modelling the fuller shape
// so the type is honest about where this grows (linked rewards, savings goals,
// escalating/capped policies).

// Where a reward comes from. The slice only exercises 'Shop'.
export type RewardSource = 'Shop' | 'LinkedToTask' | 'SavingsGoal';

// How a reward is priced per redemption. The slice only exercises 'Flat'.
export type CostPolicy = 'Flat' | 'Escalating' | 'Capped';

export type RewardStatus = 'Active' | 'Paused' | 'Archived';

// A user-defined reward, priced on the same Fibonacci scale as tasks (SPEC §4).
export interface Reward {
  id: string;
  name: string;
  description?: string;
  source: RewardSource;
  costPolicy: CostPolicy;
  // The Flat cost per redemption. (Escalating/Capped will extend this later.)
  baseCost: number;
  status: RewardStatus;
  createdAt: string; // ISO-8601
}

// An append-only, immutable record of one redemption. It snapshots the cost paid
// at that moment so later price edits never rewrite history and the balance stays
// consistent (SPEC §10), mirroring Completion on the earning side.
export interface Redemption {
  id: string;
  rewardId: string;
  redeemedAt: string; // ISO-8601
  costPaid: number; // snapshot — not recomputed from the reward
}
