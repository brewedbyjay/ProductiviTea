import { describe, expect, it } from 'vitest';
import { canAfford, deriveBalance } from './balance';
import type { Completion } from './activity';
import type { Redemption } from './reward';

function completion(valueEarned: number): Completion {
  return {
    id: crypto.randomUUID(),
    activityId: 'a1',
    completedAt: new Date().toISOString(),
    valueEarned,
  };
}

function redemption(costPaid: number): Redemption {
  return {
    id: crypto.randomUUID(),
    rewardId: 'r1',
    redeemedAt: new Date().toISOString(),
    costPaid,
  };
}

describe('deriveBalance', () => {
  it('is zero with no completions', () => {
    expect(deriveBalance([])).toBe(0);
  });

  it('sums the snapshotted payouts', () => {
    expect(deriveBalance([completion(3), completion(3), completion(5)])).toBe(11);
  });

  it('subtracts redemptions from earnings', () => {
    const earned = [completion(3), completion(5), completion(8)]; // 16
    const spent = [redemption(5), redemption(3)]; // 8
    expect(deriveBalance(earned, spent)).toBe(8);
  });
});

describe('canAfford', () => {
  it('allows redemption when the balance covers the cost', () => {
    expect(canAfford(8, 5)).toBe(true);
    expect(canAfford(5, 5)).toBe(true); // exact balance is affordable
  });

  it('blocks redemption when the cost exceeds the balance (no debt)', () => {
    expect(canAfford(3, 5)).toBe(false);
  });
});
