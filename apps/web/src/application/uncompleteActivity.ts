import type { CompletionRepository } from './ports';

// Use-case: undo a completion (toggle a task back to not-done). Deletes the
// completion record; balance and streak recompute from the log on next read, so
// there are no stored totals to unwind (SPEC §10/§11).
export async function uncompleteActivity(
  repo: CompletionRepository,
  completionId: string,
): Promise<void> {
  await repo.remove(completionId);
}
