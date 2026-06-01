import { deriveBalance } from '../domain/balance';
import type { CompletionRepository } from './ports';

// Use-case: read the current spendable balance. Loads the completion log and
// projects it through the domain — balance is always recomputed, never read
// from a stored counter (SPEC §10).
export async function getBalance(repo: CompletionRepository): Promise<number> {
  const completions = await repo.getAll();
  return deriveBalance(completions);
}
