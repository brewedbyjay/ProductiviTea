import type { Activity, Completion } from '../domain/activity';
import { logicalToday, logicalDayKey, daysBetween } from '../domain/day';
import { recurrenceState } from '../domain/recurrence';
import type { ActivityRepository, CompletionRepository, SettingsRepository } from './ports';
import { getSettings } from './getSettings';

// One row of the task list: a task plus whether it currently counts as done.
// "Done" means completed in the current logical day for Daily tasks, "completed
// within the interval" (i.e. not yet due) for Recurring tasks, and "ever
// completed" for One-time tasks (they stay done until restarted, SPEC §3). When
// done, `completionId` (the relevant completion) is what the toggle-off undoes
// and what amount edits target; `quantity`/`durationMinutes` are that
// completion's recorded amount; `valueEarned` is the reward it earns. For
// Recurring tasks, `dueInDays` is the days until it's due again (0 = due now).
export interface TodayItem {
  activity: Activity;
  doneToday: boolean;
  completionId?: string;
  quantity?: number;
  durationMinutes?: number;
  valueEarned?: number;
  dueInDays?: number;
}

// Use-case: build today's task list. Lists Active tasks and marks each done if it
// has a completion in the current logical day (per the user's day-start). The
// "today" scope lives entirely in the domain day boundary (SPEC §5).
export async function getToday(
  activities: ActivityRepository,
  completions: CompletionRepository,
  settings: SettingsRepository,
  now: string = new Date().toISOString(),
): Promise<TodayItem[]> {
  const [allActivities, log, { dayStartMinutes }] = await Promise.all([
    activities.getAll(),
    completions.getAll(),
    getSettings(settings),
  ]);

  const today = logicalToday(now, dayStartMinutes);

  // Completions grouped per activity, most recent first.
  const byActivity = new Map<string, Completion[]>();
  for (const c of log) {
    const arr = byActivity.get(c.activityId) ?? [];
    arr.push(c);
    byActivity.set(c.activityId, arr);
  }
  for (const arr of byActivity.values()) {
    arr.sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  }

  return allActivities
    .filter((a) => a.status === 'Active')
    .map((activity) => {
      const completions = byActivity.get(activity.id) ?? [];

      // Recurring: "done" until the rolling interval elapses (SPEC §3). The undo
      // target is the most recent completion (which may be from days ago).
      if (activity.cadence === 'FlexibleInterval') {
        // Never done yet: schedule from the creation day using the soft reminder
        // point (falling back to the latest-due, then 1), so a freshly added task
        // shows its reminder date rather than reading as immediately due. It stays
        // actionable (not done) and only becomes due once that window elapses.
        if (completions.length === 0) {
          const scheduleDays =
            activity.reminderDays ?? activity.intervalDays ?? 1;
          const created = logicalDayKey(activity.createdAt, dayStartMinutes);
          const elapsed = daysBetween(created, logicalToday(now, dayStartMinutes));
          return {
            activity,
            doneToday: false,
            dueInDays: Math.max(0, scheduleDays - elapsed),
          };
        }

        const rec = recurrenceState(
          completions,
          activity.intervalDays ?? 1,
          dayStartMinutes,
          now,
        );
        const done = rec.due ? undefined : completions[0];
        return {
          activity,
          doneToday: !rec.due,
          completionId: done?.id,
          quantity: done?.quantity,
          durationMinutes: done?.durationMinutes,
          valueEarned: done?.valueEarned,
          dueInDays: rec.daysUntilDue,
        };
      }

      // One-time: stays done until restarted (SPEC §3). Unlike a daily it is not
      // re-scoped to the logical day — a one-off completed days ago is still
      // done; unchecking it (deleting the completion) is the one-tap restart.
      if (activity.cadence === 'OneOff') {
        const done = completions[0]; // most recent (sorted desc above), if any
        return {
          activity,
          doneToday: done !== undefined,
          completionId: done?.id,
          quantity: done?.quantity,
          durationMinutes: done?.durationMinutes,
          valueEarned: done?.valueEarned,
        };
      }

      // Daily (and FixedDate): scoped to the current logical day.
      const done = completions.find(
        (c) => logicalDayKey(c.completedAt, dayStartMinutes) === today,
      );
      return {
        activity,
        doneToday: done !== undefined,
        completionId: done?.id,
        quantity: done?.quantity,
        durationMinutes: done?.durationMinutes,
        valueEarned: done?.valueEarned,
      };
    });
}
