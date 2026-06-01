import { describe, expect, it } from 'vitest';
import { isFibonacciTier, snapToMilestone, type Milestone } from './fibonacci';

describe('isFibonacciTier', () => {
  it('accepts values on the scale', () => {
    expect(isFibonacciTier(1)).toBe(true);
    expect(isFibonacciTier(8)).toBe(true);
  });

  it('rejects values off the scale', () => {
    expect(isFibonacciTier(4)).toBe(false);
    expect(isFibonacciTier(0)).toBe(false);
  });
});

describe('snapToMilestone', () => {
  const milestones: Milestone[] = [
    { threshold: 10, value: 3 },
    { threshold: 20, value: 5 },
    { threshold: 35, value: 8 },
  ];

  it('earns nothing below the first threshold', () => {
    expect(snapToMilestone(5, milestones)).toBe(0);
  });

  it('snaps to the highest met milestone, not linearly', () => {
    expect(snapToMilestone(10, milestones)).toBe(3);
    expect(snapToMilestone(19, milestones)).toBe(3);
    expect(snapToMilestone(20, milestones)).toBe(5);
    expect(snapToMilestone(34, milestones)).toBe(5);
    expect(snapToMilestone(35, milestones)).toBe(8);
    expect(snapToMilestone(100, milestones)).toBe(8);
  });

  it('does not depend on milestone ordering', () => {
    const shuffled = [milestones[2], milestones[0], milestones[1]];
    expect(snapToMilestone(20, shuffled)).toBe(5);
  });
});
