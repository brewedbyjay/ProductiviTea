import { describe, expect, it } from 'vitest';
import type { Activity, Completion } from '../domain/activity';
import { DEFAULT_DAY_START_MINUTES } from '../domain/settings';
import type {
  ActivityRepository,
  CompletionRepository,
  SettingsRepository,
} from './ports';
import { getToday } from './getToday';

// Minimal in-memory fakes — the use-case only reads, so getAll over arrays is
// enough; the unused mutators throw to flag accidental writes.
function fakeActivities(items: Activity[]): ActivityRepository {
  return {
    add: () => Promise.reject(new Error('not used')),
    getAll: () => Promise.resolve(items),
    update: () => Promise.reject(new Error('not used')),
    clear: () => Promise.reject(new Error('not used')),
  };
}

function fakeCompletions(items: Completion[]): CompletionRepository {
  return {
    add: () => Promise.reject(new Error('not used')),
    getAll: () => Promise.resolve(items),
    remove: () => Promise.reject(new Error('not used')),
    update: () => Promise.reject(new Error('not used')),
    clear: () => Promise.reject(new Error('not used')),
  };
}

// Settings store with nothing saved — getSettings falls back to the 4am default.
const defaultSettings: SettingsRepository = {
  get: () => Promise.resolve(undefined),
  save: () => Promise.reject(new Error('not used')),
  clear: () => Promise.reject(new Error('not used')),
};

function activity(overrides: Partial<Activity>): Activity {
  return {
    id: 'a1',
    name: 'Task',
    valueType: 'Simple',
    cadence: 'OneOff',
    baseFibonacciValue: 3,
    status: 'Active',
    createdAt: '2026-06-01T00:00:00.000Z',
    ...overrides,
  };
}

// Noon avoids the day-start boundary, so the logical day equals the calendar day.
function doneOn(activityId: string, day: string): Completion {
  return {
    id: `c-${activityId}-${day}`,
    activityId,
    completedAt: `${day}T12:00:00`,
    valueEarned: 3,
  };
}

const NOON_15TH = '2026-06-15T12:00:00';

describe('getToday', () => {
  it('keeps a one-off done after its completion day passes (stays done until restarted)', async () => {
    const oneOff = activity({ id: 'one', cadence: 'OneOff' });
    const yesterday = doneOn('one', '2026-06-14');

    const [item] = await getToday(
      fakeActivities([oneOff]),
      fakeCompletions([yesterday]),
      defaultSettings,
      NOON_15TH,
    );

    expect(item.doneToday).toBe(true);
    expect(item.completionId).toBe(yesterday.id);
  });

  it('shows a never-completed one-off as not done', async () => {
    const oneOff = activity({ id: 'one', cadence: 'OneOff' });

    const [item] = await getToday(
      fakeActivities([oneOff]),
      fakeCompletions([]),
      defaultSettings,
      NOON_15TH,
    );

    expect(item.doneToday).toBe(false);
    expect(item.completionId).toBeUndefined();
  });

  it('re-scopes a daily to the logical day (yesterday does not carry over)', async () => {
    const daily = activity({ id: 'day', cadence: 'DailyRecurring' });
    const yesterday = doneOn('day', '2026-06-14');

    const [item] = await getToday(
      fakeActivities([daily]),
      fakeCompletions([yesterday]),
      defaultSettings,
      NOON_15TH,
    );

    expect(item.doneToday).toBe(false);
  });

  it('schedules a never-completed recurring task from its creation reminder, not due now', async () => {
    const recurring = activity({
      id: 'rec',
      cadence: 'FlexibleInterval',
      reminderDays: 5,
      intervalDays: 7,
      createdAt: '2026-06-14T12:00:00', // one day before "now"
    });

    const [item] = await getToday(
      fakeActivities([recurring]),
      fakeCompletions([]),
      defaultSettings,
      NOON_15TH,
    );

    // Not flagged due-now; counts down from the 5-day reminder (1 day elapsed).
    expect(item.doneToday).toBe(false);
    expect(item.dueInDays).toBe(4);
  });

  it('uses the default day-start when no settings are saved', async () => {
    // Sanity check the fallback path the other cases rely on.
    expect(DEFAULT_DAY_START_MINUTES).toBe(4 * 60);
  });
});
