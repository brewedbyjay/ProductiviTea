import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import type { Activity, ValueType } from '../domain/activity';
import type { Category } from '../domain/category';
import type { UserSettings } from '../domain/settings';
import type { TodayItem } from '../application/getToday';
import { CATEGORIES, cadenceForCategory, categoryOf } from '../domain/category';
import { FIBONACCI_TIERS } from '../domain/fibonacci';
import { earnedFor } from '../domain/earning';
import { getToday } from '../application/getToday';
import { createActivity } from '../application/createActivity';
import { updateActivity } from '../application/updateActivity';
import type { UpdateActivityInput } from '../application/updateActivity';
import { completeActivity } from '../application/completeActivity';
import { uncompleteActivity } from '../application/uncompleteActivity';
import { updateCompletionAmount } from '../application/updateCompletionAmount';
import {
  activityRepository,
  completionRepository,
  settingsRepository,
} from '../infrastructure/dexie/repositories';
import { PALETTE, lightVariant } from './palette';

// Whether a value-type carries a measurable amount (vs. a flat Simple task).
function isScaled(type: ValueType): boolean {
  return type === 'Quantitative' || type === 'Timed';
}

function unitLabel(item: TodayItem): string {
  return item.activity.valueType === 'Timed' ? 'min' : item.activity.unit ?? '';
}

function amountOf(item: TodayItem): number | undefined {
  return item.activity.valueType === 'Timed'
    ? item.durationMinutes
    : item.quantity;
}

// Build the measurement shape `earnedFor`/`completeActivity` expect from a raw
// amount: minutes for Timed tasks, a count otherwise.
function measurementFor(activity: Activity, amount: number | undefined) {
  return activity.valueType === 'Timed'
    ? { durationMinutes: amount }
    : { quantity: amount };
}

// The unified task view: define tasks and complete them for today, grouped into
// per-category cards (Daily / Recurring / One-time). Each card's color is chosen
// by the user from the palette. A Quantitative/Timed task is anchored on a default
// amount = default reward; editing the recorded amount re-prices it linearly.
// Settings (day-start, category colors) come from App so saves stay merged.
export default function TasksView({
  mode,
  settings,
  reloadKey = 0,
  onUpdateSettings,
  onAdded,
  onBalanceChange,
  onStreakChange,
}: {
  // Mobile shows either the add form ('add') or the category list ('list'); the
  // bottom nav switches between them. Desktop shows both regardless.
  mode: 'list' | 'add';
  settings: UserSettings;
  // Bumped by App after a reset/wipe so the list re-loads from storage.
  reloadKey?: number;
  onUpdateSettings: (patch: Partial<UserSettings>) => void;
  onAdded: () => void;
  onBalanceChange: () => void;
  onStreakChange: () => void;
}) {
  const [items, setItems] = useState<TodayItem[]>([]);

  // New-task form state.
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>('Daily');
  const [valueType, setValueType] = useState<ValueType>('Simple');
  const [reward, setReward] = useState<number>(3);
  // The numeric fields start empty and show a gray hint (placeholder) instead of a
  // pre-filled value, so nothing is silently committed that the user never typed.
  const [defaultAmount, setDefaultAmount] = useState('');
  // Recurring tasks have two thresholds: the soft reminder and the latest due.
  const [reminderDays, setReminderDays] = useState('');
  const [intervalDays, setIntervalDays] = useState('');

  // Which category the mobile tab strip is showing (desktop shows all cards).
  const [selectedCategory, setSelectedCategory] = useState<Category>('Daily');

  // The task currently open in the edit dialog (null = no dialog).
  const [editing, setEditing] = useState<Activity | null>(null);

  const load = useCallback(async () => {
    setItems(
      await getToday(activityRepository, completionRepository, settingsRepository),
    );
  }, []);

  // Reload on mount, when the day-start changes (it re-scopes "today"), and after
  // a reset/wipe (reloadKey bumps).
  useEffect(() => {
    void load();
  }, [load, settings.dayStartMinutes, reloadKey]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const scaled = isScaled(valueType);
    const anchor = Number(defaultAmount);
    if (scaled && (!Number.isFinite(anchor) || anchor <= 0)) return;
    const recurring = category === 'Recurring';
    const due = Number(intervalDays);
    const reminder = reminderDays === '' ? undefined : Number(reminderDays);
    if (recurring && (!Number.isFinite(due) || due <= 0)) return;
    if (recurring && reminder !== undefined && (!Number.isFinite(reminder) || reminder <= 0))
      return;

    await createActivity(activityRepository, {
      name,
      baseFibonacciValue: reward,
      valueType,
      cadence: cadenceForCategory(category),
      defaultAmount: scaled ? anchor : undefined,
      intervalDays: recurring ? due : undefined,
      reminderDays: recurring ? reminder : undefined,
    });
    setName('');
    // Show the new task's category and (on mobile) jump to the Tasks tab.
    setSelectedCategory(category);
    await load();
    onAdded();
  }

  // Assign a category its color via the shared settings (merged + persisted in App).
  function setCategoryColor(cat: Category, color: string) {
    onUpdateSettings({
      categoryColors: { ...settings.categoryColors, [cat]: color },
    });
  }

  // Complete a task with the amount currently in its row (undefined = the anchor
  // default, handled by the use-case).
  async function handleComplete(item: TodayItem, amount: number | undefined) {
    await completeActivity(
      completionRepository,
      item.activity,
      measurementFor(item.activity, amount),
    );
    await load();
    onBalanceChange();
    onStreakChange();
  }

  async function handleUncomplete(item: TodayItem) {
    if (!item.completionId) return;
    await uncompleteActivity(completionRepository, item.completionId);
    await load();
    onBalanceChange();
    onStreakChange();
  }

  // Live amount sync (debounced in the row): entering an amount completes the task
  // (or re-prices it if it's already done) and clearing the box un-completes it —
  // so the balance tracks the amount live. There is deliberately no "lowering"
  // prompt: an emptied box simply un-completes, which cleanly reverts the balance
  // (no half-finished completion to look like cheating).
  async function handleSetAmount(item: TodayItem, amount: number | undefined) {
    if (amount === undefined) {
      if (item.doneToday) await handleUncomplete(item);
      return;
    }
    if (!item.doneToday) {
      await handleComplete(item, amount);
      return;
    }
    if (!item.completionId) return;
    await updateCompletionAmount(
      completionRepository,
      item.completionId,
      item.activity,
      measurementFor(item.activity, amount),
    );
    await load();
    onBalanceChange();
  }

  // Persist an edit to a task definition, then close the dialog and reload. Past
  // completions keep their snapshots, so the balance is untouched; the row just
  // re-renders with the new name/type/amount/reward.
  async function handleSaveEdit(activity: Activity, input: UpdateActivityInput) {
    await updateActivity(activityRepository, activity, input);
    setEditing(null);
    await load();
  }

  // Group today's tasks under their derived category. All built-in categories
  // show as cards (even empty ones) so every category is visible and colorable.
  // Recurring rows are ordered by urgency (soonest due first); the stable sort
  // keeps the original order for everything else.
  const grouped = CATEGORIES.map((cat) => {
    const rows = items.filter((it) => categoryOf(it.activity.cadence) === cat);
    if (cat === 'Recurring') {
      rows.sort(
        (a, b) => (a.dueInDays ?? Infinity) - (b.dueInDays ?? Infinity),
      );
    }
    return { category: cat, color: settings.categoryColors?.[cat], rows };
  });

  return (
    <section className={`tasks tasks--${mode}`}>
      <div className="add-region">
        <form className="add-form" onSubmit={handleAdd}>
          <label className="field field--grow">
            <span className="field-label">Task</span>
            <input
              aria-label="Task name"
              placeholder="New task (e.g. Push-ups)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field-label">Category</span>
            <select
              aria-label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>

          {category === 'Recurring' && (
            <>
              <label className="field field--interval">
                <span className="field-label">Reminder (days)</span>
                <input
                  aria-label="Reminder in days"
                  inputMode="numeric"
                  placeholder="e.g. 5"
                  title="Days after completing it before you get a reminder"
                  value={reminderDays}
                  onChange={(e) => setReminderDays(digitsOnly(e.target.value))}
                />
              </label>
              <label className="field field--interval">
                <span className="field-label">Latest due (days)</span>
                <input
                  aria-label="Latest due in days"
                  inputMode="numeric"
                  placeholder="e.g. 7"
                  title="Days after completing it before it's due at the latest"
                  value={intervalDays}
                  onChange={(e) => setIntervalDays(digitsOnly(e.target.value))}
                />
              </label>
            </>
          )}

          <label className="field">
            <span className="field-label">Type</span>
            <select
              aria-label="Task type"
              value={valueType}
              onChange={(e) => setValueType(e.target.value as ValueType)}
            >
              <option value="Simple">Basic</option>
              <option value="Quantitative">Count</option>
              <option value="Timed">Timed</option>
            </select>
          </label>

          {isScaled(valueType) && (
            <label className="field field--amount">
              <span className="field-label">Amount</span>
              <input
                aria-label="Default amount"
                className="amount-input"
                inputMode="numeric"
                placeholder={valueType === 'Timed' ? 'e.g. 30' : 'e.g. 10'}
                value={defaultAmount}
                onChange={(e) => setDefaultAmount(digitsOnly(e.target.value))}
              />
            </label>
          )}

          <label className="field">
            <span className="field-label">Reward</span>
            <select
              aria-label="Default reward"
              value={reward}
              onChange={(e) => setReward(Number(e.target.value))}
            >
              {FIBONACCI_TIERS.map((tier) => (
                <option key={tier} value={tier}>
                  {tier}
                </option>
              ))}
            </select>
          </label>

          <button type="submit" className="add-submit">
            Add
          </button>
        </form>
      </div>

      {/* Mobile category tab strip; hidden on desktop (which shows all cards). */}
      <nav className="category-nav">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            className={cat === selectedCategory ? 'active' : ''}
            onClick={() => setSelectedCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </nav>

      {/* Desktop: cards in a horizontal row. Mobile: only the selected card shows. */}
      <div className="category-cards">
        {grouped.map(({ category: cat, color, rows }) => (
          <CategoryCard
            key={cat}
            category={cat}
            color={color}
            active={cat === selectedCategory}
            onPickColor={(c) => setCategoryColor(cat, c)}
          >
            {rows.length === 0 ? (
              <p className="empty">No tasks here yet.</p>
            ) : (
              <ul className="row-list">
                {rows.map((item) => (
                  <TaskRow
                    key={item.activity.id}
                    item={item}
                    onComplete={(amount) => void handleComplete(item, amount)}
                    onUncomplete={() => void handleUncomplete(item)}
                    onAmountChange={(amount) => void handleSetAmount(item, amount)}
                    onEdit={() => setEditing(item.activity)}
                  />
                ))}
              </ul>
            )}
          </CategoryCard>
        ))}
      </div>

      {editing && (
        <EditTaskDialog
          activity={editing}
          onClose={() => setEditing(null)}
          onSave={(input) => void handleSaveEdit(editing, input)}
        />
      )}
    </section>
  );
}

// A category as a colored card. The header carries the category name and its own
// settings (gear) icon; clicking it reveals this card's color palette. Each card
// owns this toggle independently of the top-bar settings cog.
function CategoryCard({
  category,
  color,
  active,
  onPickColor,
  children,
}: {
  category: Category;
  color?: string;
  active: boolean;
  onPickColor: (color: string) => void;
  children: React.ReactNode;
}) {
  const [paletteOpen, setPaletteOpen] = useState(false);
  // --card-color tints the header; --card-bar-color (the lighter tint) tints the
  // attached count bar. Both fall back to a neutral when no color is picked.
  const style = {
    '--card-color': color ?? 'var(--border)',
    '--card-bar-color': lightVariant(color) ?? 'var(--border)',
  } as CSSProperties;
  return (
    <section
      className={active ? 'category-card category-card--active' : 'category-card'}
      style={style}
    >
      <header className="category-card__header">
        <h2 className="category-card__title">{category}</h2>
        <div className="card-header-controls">
          {/* The palette only appears while this card's gear is toggled on. */}
          {paletteOpen && (
            <div className="swatches" role="group" aria-label={`${category} color`}>
              {PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={c === color ? 'swatch swatch--active' : 'swatch'}
                  style={{ background: c }}
                  aria-label={`Use ${c}`}
                  aria-pressed={c === color}
                  onClick={() => onPickColor(c)}
                />
              ))}
            </div>
          )}
          <button
            type="button"
            className="card-settings-button"
            aria-label={`${category} color settings`}
            aria-expanded={paletteOpen}
            onClick={() => setPaletteOpen((open) => !open)}
          >
            <img src="/settings.png" alt="" className="card-settings-icon" />
          </button>
        </div>
      </header>
      {children}
    </section>
  );
}

// One completable task. The reward badge sits *outside* the row card (same slot
// for every task) and updates live as the amount changes. For Count/Timed tasks
// the amount input drives completion: typing an amount marks the task done and
// updates the balance live (debounced); clearing it un-marks the task.
function TaskRow({
  item,
  onComplete,
  onUncomplete,
  onAmountChange,
  onEdit,
}: {
  item: TodayItem;
  onComplete: (amount: number | undefined) => void;
  onUncomplete: () => void;
  onAmountChange: (amount: number | undefined) => void;
  onEdit: () => void;
}) {
  const scaled = isScaled(item.activity.valueType);
  const recurring = item.activity.cadence === 'FlexibleInterval';

  // The amount shown in the row: the recorded amount when the task is already done
  // today, else EMPTY. We never pre-fill the anchor default — a just-added task
  // (or a fresh day, which loads as not-done) starts blank so it is never
  // auto-completed. Ticking the box still records the anchor default (the
  // use-case fills it in), and the badge above previews that default reward.
  const [amount, setAmount] = useState(() =>
    scaled && item.doneToday ? String(amountOf(item) ?? '') : '',
  );
  const numericAmount = amount === '' ? undefined : Number(amount);

  // Live reward from the current input (flat default for Basic tasks).
  const earn = scaled
    ? earnedFor(item.activity, measurementFor(item.activity, numericAmount))
    : item.activity.baseFibonacciValue;

  // Debounced live sync of a typed amount to storage (so the balance follows the
  // input without a write per keystroke). The badge above already updates live.
  // Keep the latest callback in a ref so the debounce effect can stay keyed on the
  // amount alone (the prop is a fresh closure every render).
  const sync = useRef(onAmountChange);
  useEffect(() => {
    sync.current = onAmountChange;
  });
  // Only write on a genuine change from the last synced value (seeded with the
  // initial amount). This also absorbs React StrictMode's double-invoke of the
  // mount effect, which previously fired a sync on the seeded value and could
  // mark a brand-new task done.
  const lastSynced = useRef(numericAmount);
  useEffect(() => {
    if (!scaled) return;
    if (numericAmount === lastSynced.current) return;
    const id = setTimeout(() => {
      lastSynced.current = numericAmount;
      sync.current(numericAmount);
    }, 300);
    return () => clearTimeout(id);
  }, [numericAmount, scaled]);

  const handleToggle = () =>
    item.doneToday ? onUncomplete() : onComplete(numericAmount);

  // A scaled task gets the attached count bar below, so square the card's bottom
  // edge (row--with-bar) to make them read as one connected piece.
  const rowClass = `row${item.doneToday ? ' row-done' : ''}${
    scaled ? ' row--with-bar' : ''
  }`;

  return (
    <li className="task-item">
      <div className={rowClass}>
        <input
          type="checkbox"
          aria-label={`Mark ${item.activity.name} done`}
          checked={item.doneToday}
          onChange={handleToggle}
        />
        <span className="row-name">{item.activity.name}</span>

        {/* Recurring: when it's next due. Driven by the countdown so a freshly
            added (scheduled) task reads neutrally; only an actually-due task
            (0 days left) gets the red "due: today". */}
        {recurring && (
          <span className={item.dueInDays === 0 ? 'due due--now' : 'due'}>
            {item.dueInDays === 0 ? 'due: today' : `due in ${item.dueInDays}d`}
          </span>
        )}

        {/* Count/Timed: the editable amount lives in the row, sized to its
            content (size in chars) with the digits centered. */}
        {scaled && (
          <input
            className="amount-input"
            inputMode="numeric"
            aria-label={`Amount for ${item.activity.name}`}
            value={amount}
            size={Math.max(amount.length, 1)}
            style={{ width: 'auto', textAlign: 'center' }}
            onChange={(e) => setAmount(digitsOnly(e.target.value))}
          />
        )}

        {/* Reward badge — inside the card, pushed right (margin-left:auto) so it
            sits just left of the edit icon. */}
        <span className="row-earn">+{earn}</span>

        {/* Edit the task definition (name/type/amount/reward/interval). */}
        <button
          type="button"
          className="row-edit"
          aria-label={`Edit ${item.activity.name}`}
          onClick={onEdit}
        >
          <img src="/edit.png" alt="" className="row-edit-icon" />
        </button>
      </div>

      {/* Count/Timed: the anchor ("10 reps = 3") sits in a bar attached under the
          card, tinted with a light shade of the category color. */}
      {scaled && (
        <div className="count-bar">
          <span className="anchor" title="default amount = reward">
            {/* Omit the unit segment when there is none (Quantitative tasks no
                longer carry a unit), so it reads "10 = 3" not "10  = 3". */}
            {[item.activity.defaultAmount, unitLabel(item)]
              .filter((part) => part !== '' && part !== undefined)
              .join(' ')}{' '}
            = {item.activity.baseFibonacciValue}
          </span>
        </div>
      )}
    </li>
  );
}

// A modal for editing an existing task's definition. Seeded from the activity and
// mirroring the add-form fields, it normalizes the same way (Simple drops the
// amount/unit, non-recurring drops the interval fields) via `updateActivity`.
// Editing never rewrites past completions — those snapshot their reward (SPEC §10).
function EditTaskDialog({
  activity,
  onClose,
  onSave,
}: {
  activity: Activity;
  onClose: () => void;
  onSave: (input: UpdateActivityInput) => void;
}) {
  const [name, setName] = useState(activity.name);
  const [category, setCategory] = useState<Category>(categoryOf(activity.cadence));
  const [valueType, setValueType] = useState<ValueType>(activity.valueType);
  const [reward, setReward] = useState<number>(activity.baseFibonacciValue);
  // Seed scaled fields with a sensible default so a Simple -> Count switch isn't
  // blank; the existing value wins when there is one.
  const [defaultAmount, setDefaultAmount] = useState(
    String(activity.defaultAmount ?? '10'),
  );
  const [reminderDays, setReminderDays] = useState(
    activity.reminderDays === undefined ? '' : String(activity.reminderDays),
  );
  const [intervalDays, setIntervalDays] = useState(
    activity.intervalDays === undefined ? '7' : String(activity.intervalDays),
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const scaled = isScaled(valueType);
    const anchor = Number(defaultAmount);
    if (scaled && (!Number.isFinite(anchor) || anchor <= 0)) return;
    const recurring = category === 'Recurring';
    const due = Number(intervalDays);
    const reminder = reminderDays === '' ? undefined : Number(reminderDays);
    if (recurring && (!Number.isFinite(due) || due <= 0)) return;
    if (recurring && reminder !== undefined && (!Number.isFinite(reminder) || reminder <= 0))
      return;

    onSave({
      name,
      valueType,
      cadence: cadenceForCategory(category),
      baseFibonacciValue: reward,
      defaultAmount: scaled ? anchor : undefined,
      intervalDays: recurring ? due : undefined,
      reminderDays: recurring ? reminder : undefined,
    });
  }

  return (
    <div className="dialog-backdrop" onClick={onClose}>
      <div
        className="dialog"
        role="dialog"
        aria-modal="true"
        aria-label={`Edit ${activity.name}`}
        // Clicks inside the panel must not bubble to the backdrop (which closes it).
        onClick={(e) => e.stopPropagation()}
      >
        <header className="dialog__header">
          <h2 className="dialog__title">Edit task</h2>
          <button
            type="button"
            className="dialog__close"
            aria-label="Close"
            onClick={onClose}
          >
            &times;
          </button>
        </header>

        <form className="add-form" onSubmit={handleSubmit}>
          <label className="field field--grow">
            <span className="field-label">Task</span>
            <input
              aria-label="Task name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="field">
            <span className="field-label">Category</span>
            <select
              aria-label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </label>

          {category === 'Recurring' && (
            <>
              <label className="field field--interval">
                <span className="field-label">Reminder (days)</span>
                <input
                  aria-label="Reminder in days"
                  inputMode="numeric"
                  placeholder="e.g. 5"
                  title="Days after completing it before you get a reminder"
                  value={reminderDays}
                  onChange={(e) => setReminderDays(digitsOnly(e.target.value))}
                />
              </label>
              <label className="field field--interval">
                <span className="field-label">Latest due (days)</span>
                <input
                  aria-label="Latest due in days"
                  inputMode="numeric"
                  placeholder="e.g. 7"
                  title="Days after completing it before it's due at the latest"
                  value={intervalDays}
                  onChange={(e) => setIntervalDays(digitsOnly(e.target.value))}
                />
              </label>
            </>
          )}

          <label className="field">
            <span className="field-label">Type</span>
            <select
              aria-label="Task type"
              value={valueType}
              onChange={(e) => setValueType(e.target.value as ValueType)}
            >
              <option value="Simple">Basic</option>
              <option value="Quantitative">Count</option>
              <option value="Timed">Timed</option>
            </select>
          </label>

          {isScaled(valueType) && (
            <label className="field field--amount">
              <span className="field-label">Amount</span>
              <input
                aria-label="Default amount"
                className="amount-input"
                inputMode="numeric"
                placeholder={valueType === 'Timed' ? 'e.g. 30' : 'e.g. 10'}
                value={defaultAmount}
                onChange={(e) => setDefaultAmount(digitsOnly(e.target.value))}
              />
            </label>
          )}

          <label className="field">
            <span className="field-label">Reward</span>
            <select
              aria-label="Default reward"
              value={reward}
              onChange={(e) => setReward(Number(e.target.value))}
            >
              {FIBONACCI_TIERS.map((tier) => (
                <option key={tier} value={tier}>
                  {tier}
                </option>
              ))}
            </select>
          </label>

          <div className="dialog__actions">
            <button type="button" className="dialog__cancel" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="add-submit">
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Keep only digits — the amount inputs behave as numeric textboxes.
function digitsOnly(value: string): string {
  return value.replace(/[^0-9]/g, '');
}
