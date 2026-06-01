# ProductiviTea — Product & Design Spec

> **Status:** Living design document · **Last updated:** 2026-06-01
> **How to read:** The _Quick Overview_ below is the whole product at a glance. Every section after it is collapsed — expand the ones you care about. This is the single source of truth; update it as decisions change.

---

## Quick Overview

**Identity:** A self-management app that nudges you to *do* and keeps you from mindlessly *consuming* — by making rewards something you actually **earn**. Simple and fun. The user runs the app and themselves; the app doesn't try to run them.

**North star:** Help the user accomplish a productive **routine**. (Not task management, not a calendar.) Feature test: *does it help build/keep a productive routine?*

**Core loop:** Define your own tasks & rewards → complete tasks → earn **Fibonacci** currency → spend it in the shop on rewards you defined → keep a streak.

**Organizing:** Two independent axes. (1) **Category** = a task's type — **Daily / Recurring / One-time** — derived automatically from its settings and shown as a badge; these power the built-in **tabs** you swipe between inside the Tasks view. (2) **Groups** = your own collapsible sub-groupings of tasks *inside* a tab (Tab → Group → Task); a group surfaces across tabs, showing only the tasks that match each tab. **MVP ships the built-in type tabs + groups**; user-defined custom tabs and tab customization are **post-MVP** (§12). **Projects** are post-MVP too (§12).

**Scope:** Build **Layer 0 (core loop)** + **Layer 1 (gentle reminders)**. The "AI companion" idea is **dropped** — its useful part is just a simple scheduled nudge.

**Why it exists:** A genuine app the author will use daily, *and* a CV/portfolio piece — so a publicly hosted web version (clickable link) is a first-class deliverable.

**Stack & sequence:** React + Tauri (frontend) → then .NET API + PostgreSQL + Docker (backend showcase). Build **local-first** first, add the backend (and sync) after. Backend is where the engineering craft goes; frontend stays pragmatic.

---

<details>
<summary><b>1 · Vision, Scope & Guiding Principles</b></summary>

### Layered scope
- **Layer 0 — Core loop (MVP):** activities → earn → spend → streak → stats/history. Mostly local/offline-capable.
- **Layer 1 — Gentle reminders:** simple notifications (see §9).
- **Layer 2 — AI companion:** **DROPPED as a goal.** The valuable piece (a periodic "do something productive" nudge) is achieved with a plain scheduled notification, no AI.

### Guiding principles
- **Favor the user.** When a mechanic has a strict-vs-forgiving trade-off, default to forgiving/motivating.
- **The friction *is* the gift.** The reward landing *after* the effort is the whole psychological mechanism — protect it.
- **Keep it simple and fun.** Don't add mechanics that only decorate the core loop.
- **Product first, showcase second.** CV value rides along *because* the backend is built well; it must not distort product decisions.
- **Out of core:** life-admin obligations (rent, dentist) — they're not productivity *accomplishments*; a calendar handles them.

</details>

<details>
<summary><b>2 · The Economy (currency & values)</b></summary>

- **Universal scale: Fibonacci** (1, 2, 3, 5, 8, 13…) for **both** tasks and rewards. The non-linear gaps are intentional — they discourage gaming the economy and keep values deliberate.
- **Earning:** completing a task grants its Fibonacci value.
- **Quantitative/timed → snap to Fibonacci milestones.** Quantity or time maps to the *next* Fibonacci value at thresholds (e.g. 10 reps = 3, 20 = 5, 35 = 8). Effort is rewarded in deliberate jumps, never linearly — preserves the anti-gaming property.
- **No debt.** A reward is only redeemable once you can afford it. "Reward is earned, not impulsive" is the spine. (Possible future escape hatch: an explicit opt-in advance with interest + cap — never default.)
- **Currency persists, never decays.** Decay would punish the productive.
- **Anti-hoarding:** instead of decay, the app **detects inflation and *suggests* a voluntary reset/sink**, leaving the choice to the user. Big aspirational rewards also act as natural sinks.
- **Savings goals (invest toward a reward):** a big reward can be a goal you **deposit currency into over time** — deposits *leave your spendable balance* and fill a progress bar until it unlocks. A commitment device that doubles as a sink: walling currency off is what stops you impulse-spending it on small rewards. Fully consistent with **no debt** (you save forward, never borrow).

</details>

<details>
<summary><b>3 · Activities — the two-dimensional model</b></summary>

Every activity carries **both** a value-type **and** a cadence. Its **cadence** determines its user-facing **category** (Daily / Recurring / One-time) — the type badge and the built-in tab it appears under. Separately, an activity may **belong to a Group** (a user-defined sub-grouping) or be left ungrouped — see §11. Category (automatic, by type) and Group (user-made organization) are two independent axes; neither affects how an activity earns.

### Dimension A — value-type (how it earns)
- **Simple todo** — flat Fibonacci value; do it = earn it.
- **Quantitative** — a target (e.g. "10 sit-ups"); exceeding earns more, snapped to Fibonacci milestones.
- **Timed** — duration-based (e.g. "1 min plank"); longer = more, snapped to milestones.
- **Project (composite)** — contains child activities; earns children's values **plus a completion bonus** for finishing the whole thing within its window.

### Dimension B — cadence/lifecycle (when & how often)
- **Daily / recurring habit** — repeats, resets each day, feeds routine + streak.
- **One-off goal** — lives until marked *done* (usually a Project; e.g. "find a job" → child tasks → completion funds a big reward like "buy a game"). A completed one-off is **not deleted** — it can be **restarted in one tap** to run again (e.g. "deep-clean kitchen" next month).

### Per-activity options
- **Restartable one-offs** — a finished one-off can be re-opened/duplicated in one tap. This is the lightweight "personal template" — no separate template system needed.
- **"Track history" toggle** — trivial repeats can opt *out* of stats/mastery tracking so they don't clutter progress data. Currency is still earned; only the analytics aggregation ignores them.
- **Flexible-interval** — do once per rolling window, *not* a fixed date; clock runs from last completion; app nudges "it's time" + a soft "do by ~X" with gentle escalating pressure (e.g. "vacuum once / 2 weeks").
- **Fixed-date** *(lower priority / likely out of core)* — tied to a calendar date, one-time or recurring-on-a-date. Reconsidered as a life-admin obligation rather than a productivity accomplishment.

</details>

<details>
<summary><b>4 · Rewards & the Shop</b></summary>

- Rewards are user-defined, priced on the same Fibonacci scale. Generally not time-based but can be **amount-based** (e.g. "0.5L Coca-Cola").
- **Each reward has a cost policy** (the user knows what's good for them):
  - **Flat** — same cost every redemption (e.g. "1h gaming").
  - **Escalating** — cost rises per redemption within a period, then resets (e.g. cola 3 → 5 → 8 daily). Self-imposed friction against overindulgence; reuses the Fibonacci ladder.
  - **Capped** — hard limit (e.g. "max 1×/day").
- **Three ways a reward is obtained:**
  - **Shop purchase** *(default)* — spend currency, per its cost policy above.
  - **Linked to a task (auto-grant)** — the reward is tied to a task; completing that task **instantly cashes in the reward**, and the task earns **no currency** (the reward *is* its payout, not coins on top). Per occasion, tied to the task's cadence (drink water this morning → this morning's YouTube; earn it again tomorrow). Shown in the shop as "unlocked by: [task]" instead of a coin price. This is the keystone-routine pattern and the clean answer to the "breakfast YouTube before any work" edge case — you earn the *right* by doing the thing.
  - **Savings goal** — a big reward you **deposit currency into over time** (see §2); unlocks when the bar fills.
- **Consumed-today list:** a simple daily view of the rewards you've redeemed/taken today, so the day's indulgences are visible at a glance.
- Reward "holding/banking" was rejected.

</details>

<details>
<summary><b>5 · Streaks</b></summary>

- **Gentle by default — motivate, never punish.** A streak rewards showing up; losing one is never a punishment and **never touches your currency** (which persists — §2). The app motivates by *earning*, not fear of loss (see §8, "never guilt").
- **Active run + longest, as plain numbers.** Your current run and your best ever. A break just **resets the active run** and starts a new one — your longest stands as a stat (no trophy/badge artifact to design).
- **Kept by completing ≥ 1 task** that day (any value) — low and forgiving, rewards *doing*, not just opening the app.
- **Streak-killer tag (opt-in accountability):** the user may tag specific tasks as non-negotiable. A tagged task not done by its day/deadline **resets the current streak** (recoverable via the Streak Saver). Guardrails that keep it from becoming stressful: it's opt-in, shows a **warning** when enabled, and is **hard-capped at 4** tagged tasks so the app can't become a wall of obligations. *(The elaborate "HP bar" version — ramping damage, tiers, difficulty modes — was designed, judged too punishing for the north star, and moved to `docs/ARCHIVED_IDEAS.md` as opt-in hard mode for later.)*
- **Day boundary:** a **user-set day-start, configurable per weekday** (e.g. 4am). Activity before the day-start counts as the previous day, so late-night effort isn't punished. The rollover resets daily habits, ticks the streak, and recomputes "Today".
- **Streak Saver (single shop item):** one item replaces the former Freeze + Restore — it protects/revives a streak. Cost is a **linear ramp**: a base price plus a **flat +x per lapsed day** (never exponential), so a quick save is cheap, a long lapse costs more, and it never balloons out of reach. A healthy currency sink; calibrate so it's achievable but not trivial.

</details>

<details>
<summary><b>6 · Stats, History & Mastery</b></summary>

- **No XP bar.** The real want is **accomplishment tracking**, backed by data. Two levels:
- **History page (Stats/History tab):** a **calendar** emphasizing per-day **amount earned**, **tasks done**, and **rewards redeemed**, rolled up **day -> month -> year**, plus the list of **completed one-off tasks**. Also surfaces projects completed, days dailies were hit, current/longest streak, total earned. The "look how far I've come" view. *(The per-day "consumed-today" reward list in §4 is the same redemption data, scoped to today.)*
- **Per-activity dashboard** *(for recurring tasks; polish bucket, HIGH priority — first thing after MVP):* each habit's own page — times done, **hours/effort invested** (timed), current/longest streak (nice-to-have), and a **calendar heatmap** of colored cells (done days lit up, GitHub/Habitica style). Motivates inconsistent-but-loved hobbies ("how many hours into learning ukulele?"). Only meaningful for recurring/flexible/daily activities — a pure one-off has nothing to chart.
- **One source, many views:** all of the above is **derived from the completion log** (see §10) — per-activity = the log filtered to one activity grouped by day; global = the same log ungrouped. Always consistent.

</details>

<details>
<summary><b>7 · Onboarding & Starter Library</b></summary>

- Beat the blank screen with a **curated starter library** *(primary)* of common tasks **and** rewards with sensible default values — browse and tap to add, then tweak. Reusable anytime, not just first-run.
- Plus **starter Groups** ("Fitness", "Study", "Home") the user can import wholesale — a bundle imports as a Group pre-filled with its tasks (and sub-groups where useful).
- **Stored as data, not hardcoded:**
  - **MVP:** static `starter-activities.json` + `starter-rewards.json` bundled in the app (edit the file → done).
  - **Phase 2:** the same JSON served by a .NET endpoint and seeded into a Postgres table via migration (update presets without an app release; a nice backend artifact). **JSON shape stays identical** across phases.
- **Catalog is dev-owned**; users don't edit the shared list. (A full personal "template library" isn't needed — instead, completed one-off tasks are **restartable in one tap**; see §3 Per-activity options.)
- Schema tip: each preset mirrors the Activity-creation model, which forces the domain model to get concrete.

</details>

<details>
<summary><b>8 · Notifications (Layer 1)</b></summary>

Simple scheduled/triggered notifications — **no AI**. All per-activity / per-type **opt-in**.

| Type | When | Example |
|---|---|---|
| Daily check-in | At the user's **day-start (per weekday)** | "Good morning — one task keeps your streak." |
| Periodic productive nudge | User interval, **default every 3h, stops 20:00**, off by default | "Got 2 minutes? Knock out an easy win." |
| Flexible-interval "it's time" | When a flexible task is due soon | "It's been ~12 days — time to vacuum soon." |
| Streak-at-risk save | Streak about to break | "Your 8-day streak ends tonight — do one task." |

*(Reward-affordable & goal-milestone notifications were considered but not selected — optional/future.)*

**Anti-fatigue principles (research-backed):** value-first; cue-based/personalized timing beats arbitrary; granular per-activity opt-in + frequency control; positive reinforcement, never guilt; respect quiet hours (reuse day-start); soft-prime the OS permission before triggering it; concise + actionable. The periodic nudge is the riskiest — keep it conservative, suggest a small/easy win from the user's own low-tier tasks, one-tap done/snooze, and **self-tune down** if repeatedly ignored.

</details>

<details>
<summary><b>9 · App Structure / Navigation / UX</b></summary>

- **Desktop:** mostly everything on one rich page.
- **Mobile:** bottom navbar — **Home/Tasks · Shop · Add (+) · History** (Stats & Badges live here).
- **Tasks tab — second-level top tab-strip:** inside the Tasks tab, a horizontal, **swipeable** tab-strip switches the view. **MVP tabs are the built-in categories — Daily / Recurring / One-time** (filter by type); each tab lists that type's tasks, and a task shows its **category badge**. *(Post-MVP: an **All** tab, user-defined **custom tabs**, and tab show/hide + reorder with an auto **"Other"** tab — see §12.)*
- **Groups inside a tab:** a Group renders as a collapsible header over its tasks; a task is a completable row; tasks and a nested group can be **mixed**, ordered by `sortOrder`. A group **surfaces in every tab where it has matching tasks**, showing only the matching slice. Ungrouped tasks list directly under the tab. A group offers **"mark all as done"** (logs each task's default value; the user can still open a task and enter a custom amount).
- **Daily landing — "Today / Must-dos":** the first thing shown each day is a focused view of your **streak-killer tasks** (max 4) with each one's done/not-done state — "here's what protects your streak today." Calm and informational, not a countdown; pairs with the morning check-in notification (§8).
- **Consumed-today list:** a small section showing the rewards redeemed/taken today (§4) — the day's indulgences at a glance.
- **Due flexible-interval tasks** sort to the **top** with an *urgent* highlight color; a small transient **in-app toast** ("time to vacuum soon") is enough — no system push required. *(Low priority.)*
- **Always-visible top bar:** balance + streak, small (tapping jumps to Stats).
- **The Add (+) entry point** opens the create flow, the starter library, **and** "Restart a past task" (add + browse + revive in one place).
- **Completed one-off tasks** live on the **History page** (the Stats/History tab) alongside the calendar. They're revived via **"Restart a past task"** in the Add (+) sheet, which lists past one-time tasks.
- **Mobile-first** design; frontend stays pragmatic (no CSS rabbit holes).
- **"Skill tree" = metaphor only:** no literal node-graph UI; just the *feeling* of progression (levels, hours invested, next milestone).

</details>

<details>
<summary><b>10 · Architecture & Data</b></summary>

- **Clean Architecture / modular monolith:** Domain → Application → Infrastructure → API.
- **Immutable completion log + derived state:**
  - Every completion is an **append-only, immutable** record that **snapshots the value earned** at that moment.
  - Balance, stats, streaks, and mastery are **derived/projected** from the log — not stored as mutable running totals.
  - Editing a task affects only **future** completions; past records are untouched.
- **Deletion is the user's choice:** when removing a task, ask — **(a) delete entirely** (purge data), **(b) keep data** (archive; history retained), or **(c) pause** (deactivate, resumable, off the Today list). The immutable log makes (a) safe: completions already hold snapshotted values, so balance/stats stay consistent.
- **Build sequencing:** ① local-first Tauri + React core loop → ② .NET API + Postgres + Docker showcase backend (accounts / persistence / sync land here). **Sync is not in the MVP.**
- **Persistence abstraction:** structure storage so the local store can later be swapped for the API client without rewriting use-cases.

</details>

<details>
<summary><b>11 · Domain Model (entities & relationships)</b></summary>

> First draft of the Clean Architecture domain. Names indicative.

**Core entities**
- **User** *(phase 2; MVP = single implicit user)* — owns everything.
- **UserSettings** — `dayStartByWeekday` (Mon–Sun times), `nudgeIntervalHours` (default 3), `nudgeEndTime` (20:00), notification toggles, currency display prefs.
- **Group** *(user-defined organizing container — distinct from Category)* — `id, name, description?, parentGroupId? (null = top-level; if set, the parent must itself be top-level — depth capped at one extra level), icon?, color?, sortOrder, status {Active|Paused|Archived}, createdAt`. A group's **children** are its sub-groups **and** its activities, merged by `sortOrder` (mixed children allowed). **Invariants:** (a) a group with a non-null `parentGroupId` cannot itself be a parent (depth cap of 2); (b) a group is **never empty** — created with ≥ 1 member, not persisted otherwise. **Display mapping:** a **top-level** group surfaces as a **custom tab**, a **nested** group as a **group within a tab** *(custom tabs are post-MVP; §12)*.
- **Activity** *(the user-defined task definition)* — `id, name, description, groupId? (the Group it lives in; null = ungrouped, listed directly under its tab), valueType {Simple|Quantitative|Timed|Project}, cadence {DailyRecurring|OneOff|FlexibleInterval|FixedDate}, baseFibonacciValue, isStreakKiller (opt-in "non-negotiable" tag; resets the streak if missed; max 4 per user), trackHistory (bool), status {Active|Paused|Completed|Archived}, parentId? (for Project children), createdAt`. The user-facing **category** (Daily/Recurring/One-time) is **derived from `cadence`**, not a stored field. A `Completed` one-off can transition back to `Active` (restart).
  - *Quantitative:* `unit`, `milestones[]` (quantity → Fibonacci).
  - *Timed:* `milestones[]` (duration → Fibonacci).
  - *FlexibleInterval:* `intervalDays`.
  - *FixedDate:* `dueDate`, `recurrence {None|Weekly|Monthly|Yearly}`.
  - *Project:* `completionBonus`, has child Activities via `parentId`. **Post-MVP** — see §12; not part of the initial build.
- **Completion** *(immutable log)* — `id, activityId, completedAt, valueEarned (snapshot), quantity?/duration?, note?`. Append-only.
- **Reward** — `id, name, description, category, source {Shop|LinkedToTask|SavingsGoal}, costPolicy {Flat|Escalating|Capped}, baseCost, escalation {step, resetPeriod}?, cap {max, period}?, amountSpec?, status, createdAt`.
  - *LinkedToTask:* `linkedActivityId` — completing that activity auto-redeems this reward (per the activity's cadence); the activity earns **no currency** and the reward has no `baseCost`.
  - *SavingsGoal:* `targetCost`; `deposited` is derived from the `SavingsDeposit` log.
- **Redemption** *(immutable log)* — `id, rewardId, redeemedAt, costPaid (snapshot; 0 for LinkedToTask — paid by the task, not currency)`. Append-only.
- **StreakSaver** *(immutable log / sink)* — `id, purchasedAt, appliedToDate, costPaid (snapshot; base + flat ramp per lapsed day)`. Single mechanic, replaces the former Freeze/Restore split.
- **SavingsDeposit** *(immutable log)* — `id, rewardId (a SavingsGoal), depositedAt, amount, direction {In|Out}`. Append-only; `Out` = a withdrawal (if allowed — see §13).
- **StarterTemplate / Bundle** *(catalog from JSON)* — preset Activities & Rewards, grouped into category bundles.

**Derived (not stored as mutable state)**
- **Balance** = Σ `Completion.valueEarned` − Σ `Redemption.costPaid` − Σ `StreakSaver.costPaid` − Σ `SavingsDeposit (In − Out)`. **Un-completing** an activity removes its `Completion`, so Balance recomputes; if that leaves spending > balance, surface a light **teasing "cheater" nudge** rather than blocking (the user owns their ledger). This is the one case Balance can read negative.
- **StreakState** = `currentStreak, longestStreak, lastQualifyingDay` — computed from the Completion log + `UserSettings.dayStart`.
- **Mastery (per activity)** = Σ time/effort from that activity's Completions.

**Relationships**
- Group 1—* Activity (a task belongs to ≤ 1 group) · Group self-ref parent/child capped at one level · Activity 1—* Completion · Activity self-ref parent/child (Project) · Reward 1—* Redemption · LinkedToTask Reward → its `linkedActivityId` Activity · SavingsGoal Reward 1—* SavingsDeposit · Balance/Streak/Mastery are projections over the logs.

**Layering**
- **Domain:** entities + rules (Fibonacci snapping, completion-bonus, streak calc, balance projection, cost-policy resolution, streak-killer cap ≤ 4, linked-reward auto-grant, savings deposit/withdraw, un-complete recompute + cheat-detection).
- **Application:** use-cases — `CompleteActivity`, `UncompleteActivity` (recompute + cheat-nudge), `CreateGroupWithMembers` (atomic, non-empty), `MarkGroupDone`, `RedeemReward`, `SaveStreak`, `DepositToSavings` / `WithdrawFromSavings`, `GetToday`, `GetConsumedToday`, `GetStats`, `ImportStarterBundle`, `DetectInflation`.
- **Infrastructure:** persistence (local store MVP → EF Core/Postgres phase 2), JSON catalog loader, notification scheduler.
- **API:** RESTful, versioned `/api/v1/...`.

</details>

<details>
<summary><b>12 · Deferred / Polish bucket (NOT MVP)</b></summary>

- **Per-activity mastery** (time invested) — *high priority*, first add post-MVP.
- **Badges / milestones** — *de-prioritized*: Jay doesn't want to design trophy art, and longest-streak already lives as a plain stat. Revisit only if motivation feels flat.
- **Tea-themed unlocks** — cosmetic, brand flavor.
- **Lifetime rank/level** — *skip* unless stats feel flat (big-goal sinks + inflation-suggest already cover "earning stays meaningful").
- **Cross-device sync & accounts** — arrives with the phase-2 backend.
- **Fixed-date / calendar obligations** — likely out of core entirely.
- **Reward-affordable & goal-milestone notifications.**
- **Projects (composite activities)** — finite, **Trello-like** containers (boards, ordered/dependent cards) with milestones + a completion bonus; includes **task→task gating** ("do A before B"). Deferred from MVP (domain stub in §11).
- **Custom tabs & tab customization** — user-defined tabs beyond the built-in type tabs, plus show/hide + reorder, the **All** and auto **"Other"** tabs, and cross-tab group hinting.
- **Funding links** — automatically route a task's earnings into a specific reward / savings goal. A nice-to-have quality-of-life touch, not necessary.
- **Hard / Challenge mode** — the HP bar, ramping damage, importance tiers, instakill deadlines, and difficulty settings. Designed then shelved (too punishing for the north star); see `docs/ARCHIVED_IDEAS.md`. Opt-in stakes for later, off by default.

</details>

<details>
<summary><b>13 · Open questions / to tune</b></summary>

- Economy balance: default values so earning vs. reward costs feel right (needs dogfooding).
- Streak Saver cost ramp — exact base + flat per-day `x`.
- Savings-goal **withdrawal**: can deposited currency be pulled back out (with a little friction), or is it locked once committed?
- Flexible-interval **streak-killer** tasks need a concrete "missed" point — how many days past the interval before the streak resets.
- Mastery's exact "time invested" capture (manual log vs. in-app timer).
- Exact **cadence → category** mapping for the built-in tabs (Daily ← daily-recurring, Recurring ← flexible/non-daily, One-time ← one-off; where FixedDate lands if it ever ships).
- Whether a Group should ever carry aggregate economy/streak meaning, or stay purely organizational (current assumption: organizational only, plus "mark all as done").

</details>

---

### Conventions
English throughout · Conventional Commits · feature branches off `main` · comments explain *intent* for collaborators · RESTful versioned API · small focused React components.

### Licensing constraint
Only **free, permissively-licensed** dependencies (MIT / Apache-2.0 / BSD). **Avoid** copyleft (GPL/AGPL) and source-available/commercial-restricted licenses (BSL/SSPL). Goal: a modern, marketable, license-clean cross-platform stack. Current stack is all clear — React (MIT), Tauri (MIT/Apache-2.0), .NET (MIT), PostgreSQL (BSD-style), Docker Engine/CLI (Apache-2.0). *Note: Docker Engine/CLI is free; Docker Desktop GUI needs a paid license for large orgs — deploy with the engine.*
