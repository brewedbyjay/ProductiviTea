# ProductiviTea — Archived Ideas

> Ideas that were designed in depth, then deliberately shelved. They are **not** part of the
> MVP or the core product, but they're recorded here so the thinking isn't lost and can be
> revived later (most likely as opt-in modes). The live design lives in `SPEC.md`.

---

## Streak "HP / Challenge mode" (shelved 2026-06-01)

A more punishing version of the streak-killer mechanic (see `SPEC.md` §5 for the gentle
version that shipped to the core). It was fully worked out, then cut because it made the
*primary user* feel pushed and anxious — a direct conflict with the north star ("the app
doesn't try to run you") and the "positive reinforcement, never guilt" principle (§8).
Punishment/loss-aversion mechanics motivate through fear of losing, which is the opposite of
this app's "motivate by earning" identity.

**Intended future home:** an explicit, opt-in **Challenge / difficulty mode**, off by default.
Some users genuinely like stakes — let them choose it.

### The mechanic as designed

- **Streak HP bar.** A single shared health bar (not per task). The streak breaks when HP hits 0.
- **HP scales with the number of must-do (streak-killer) tasks**, on the Fibonacci ladder, to
  keep "total neglect" breaking you in a consistent ~2 days regardless of how many you track:
  - 1 must-do → **3 HP**
  - 2 must-dos → **5 HP**
  - 3 must-dos → **8 HP**
  - 4+ must-dos → **10 HP** (capped; more must-dos against the cap = a deliberately steeper cliff)
- **Ramping damage.** Each consecutive day a task is ignored hurts more: 1, then 2, then 3…
  Doing the task resets *its* ramp. (Worked example: 1 must-do at 3 HP → −1, −2 = dead in 2 days.)
- **Healing only by doing the work** — no "health potion" in the shop (rejected: it duplicates
  the Streak Saver and pulls focus to managing a meter instead of doing tasks). HP moves two ways
  only: a neglected must-do bleeds it at the daily rollover; a **fully clean day** (all must-dos
  done) refills it to full and resets ramps. No automatic daily refill (that would stop damage
  ever accumulating).
- **Importance tiers** (per-task damage weight, Habitica-style) — considered and rejected even
  here as over-choice; the streak-killer tag is itself the importance signal.
- **Instakill deadlines.** One-time tasks with a hard deadline would deal massive damage (enough
  to usually zero the bar) rather than a separate "instant death" rule — keeping one unified HP
  mechanic. Reserved for harder difficulty levels.
- **Difficulty modes.** Easy = damage only, generous healing, strong Streak Saver. Harder =
  instakills, slower healing, weaker/again-overpowered-no-more Saver.

### Why the gentle core version is different

The core keeps only: a streak-killer tag (opt-in, warning, **cap 4**) that simply **resets the
current streak** if a tagged task is missed, recoverable via the single **Streak Saver** (linear
cost). No meter, no numbers ticking down, no dread — just a clear self-chosen line. The anxiety
came from *managing a draining system*, not from the idea of commitments.
