import { describe, expect, it } from 'vitest';
import { earnedFor } from './earning';
import type { Activity } from './activity';

function activity(overrides: Partial<Activity>): Activity {
  return {
    id: 'a1',
    name: 'Task',
    valueType: 'Simple',
    cadence: 'DailyRecurring',
    baseFibonacciValue: 3,
    status: 'Active',
    createdAt: '2026-06-02T00:00:00.000Z',
    ...overrides,
  };
}

describe('earnedFor', () => {
  it('Simple earns the flat default reward', () => {
    expect(earnedFor(activity({ valueType: 'Simple' }), {})).toBe(3);
  });

  it('Quantitative scales linearly from the anchor', () => {
    const pushups = activity({
      valueType: 'Quantitative',
      defaultAmount: 10,
      baseFibonacciValue: 3,
      unit: 'reps',
    });
    expect(earnedFor(pushups, { quantity: 10 })).toBe(3); // the anchor
    expect(earnedFor(pushups, { quantity: 20 })).toBe(6); // double
    expect(earnedFor(pushups, { quantity: 5 })).toBe(2); // round(1.5)
  });

  it('rounds to whole coins — no fractional currency', () => {
    const pushups = activity({
      valueType: 'Quantitative',
      defaultAmount: 10,
      baseFibonacciValue: 3,
    });
    expect(earnedFor(pushups, { quantity: 14 })).toBe(4); // round(4.2)
    expect(earnedFor(pushups, { quantity: 15 })).toBe(5); // round(4.5)
  });

  it('Timed scales on minutes', () => {
    const meditate = activity({
      valueType: 'Timed',
      defaultAmount: 20,
      baseFibonacciValue: 5,
    });
    expect(earnedFor(meditate, { durationMinutes: 20 })).toBe(5);
    expect(earnedFor(meditate, { durationMinutes: 40 })).toBe(10);
  });

  it('falls back to the default reward when the amount or anchor is missing', () => {
    const noAmount = activity({ valueType: 'Quantitative', defaultAmount: 10 });
    expect(earnedFor(noAmount, {})).toBe(3);
    const noAnchor = activity({ valueType: 'Quantitative', defaultAmount: 0 });
    expect(earnedFor(noAnchor, { quantity: 50 })).toBe(3);
  });
});
