import { useEffect, useState } from 'react';
import type { Activity } from '../domain/activity';
import { FIBONACCI_TIERS } from '../domain/fibonacci';
import { createActivity } from '../application/createActivity';
import { completeActivity } from '../application/completeActivity';
import {
  activityRepository,
  completionRepository,
} from '../infrastructure/dexie/repositories';

// The earning side: define tasks and complete them to earn currency.
// Completing changes the balance, so it reports back via onBalanceChange.
export default function TasksView({
  onBalanceChange,
}: {
  onBalanceChange: () => void;
}) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [name, setName] = useState('');
  const [value, setValue] = useState<number>(3);

  async function loadActivities() {
    setActivities(await activityRepository.getAll());
  }

  useEffect(() => {
    void loadActivities();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await createActivity(activityRepository, { name, baseFibonacciValue: value });
    setName('');
    await loadActivities();
  }

  async function handleComplete(activity: Activity) {
    await completeActivity(completionRepository, activity);
    onBalanceChange();
  }

  return (
    <section>
      <form className="add-form" onSubmit={handleAdd}>
        <input
          aria-label="Task name"
          placeholder="New task (e.g. Read 20 min)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select
          aria-label="Task value"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
        >
          {FIBONACCI_TIERS.map((tier) => (
            <option key={tier} value={tier}>
              {tier}
            </option>
          ))}
        </select>
        <button type="submit">Add</button>
      </form>

      <ul className="row-list">
        {activities.length === 0 && (
          <li className="empty">No tasks yet — add one above.</li>
        )}
        {activities.map((activity) => (
          <li key={activity.id} className="row">
            <span className="row-name">{activity.name}</span>
            <span className="row-earn">+{activity.baseFibonacciValue}</span>
            <button onClick={() => handleComplete(activity)}>Complete</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
