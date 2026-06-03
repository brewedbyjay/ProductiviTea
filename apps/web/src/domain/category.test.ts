import { describe, expect, it } from 'vitest';
import { cadenceForCategory, categoryOf } from './category';

describe('categoryOf', () => {
  it('maps cadence to its user-facing category', () => {
    expect(categoryOf('DailyRecurring')).toBe('Daily');
    expect(categoryOf('FlexibleInterval')).toBe('Recurring');
    expect(categoryOf('OneOff')).toBe('One-time');
    expect(categoryOf('FixedDate')).toBe('One-time');
  });
});

describe('cadenceForCategory', () => {
  it('round-trips a category back to a representative cadence', () => {
    expect(categoryOf(cadenceForCategory('Daily'))).toBe('Daily');
    expect(categoryOf(cadenceForCategory('Recurring'))).toBe('Recurring');
    expect(categoryOf(cadenceForCategory('One-time'))).toBe('One-time');
  });
});
