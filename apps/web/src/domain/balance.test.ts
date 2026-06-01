import { describe, expect, it } from 'vitest';
import { deriveBalance } from './balance';
import type { Completion } from './activity';

function completion(valueEarned: number): Completion {
  return {
    id: crypto.randomUUID(),
    activityId: 'a1',
    completedAt: new Date().toISOString(),
    valueEarned,
  };
}

describe('deriveBalance', () => {
  it('is zero with no completions', () => {
    expect(deriveBalance([])).toBe(0);
  });

  it('sums the snapshotted payouts', () => {
    expect(deriveBalance([completion(3), completion(3), completion(5)])).toBe(11);
  });
});
