import { useEffect, useState } from 'react';
import type { Activity } from '../domain/activity';
import { FIBONACCI_TIERS } from '../domain/fibonacci';
import { createActivity } from '../application/createActivity';
import { completeActivity } from '../application/completeActivity';
import { getBalance } from '../application/getBalance';
import {
  activityRepository,
  completionRepository,
} from '../infrastructure/dexie/repositories';
import './App.css';

// First vertical slice: create a task, complete it, watch the balance grow, and
// see it all survive a reload. Deliberately one plain screen — navigation, tabs,
// groups, the shop and streaks all come later.
export default function App() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [balance, setBalance] = useState(0);
  const [name, setName] = useState('');
  const [value, setValue] = useState<number>(3);

  // Load persisted state on mount (and refresh the derived balance).
  async function refresh() {
    setActivities(await activityRepository.getAll());
    setBalance(await getBalance(completionRepository));
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await createActivity(activityRepository, {
      name,
      baseFibonacciValue: value,
    });
    setName('');
    await refresh();
  }

  async function handleComplete(activity: Activity) {
    await completeActivity(completionRepository, activity);
    setBalance(await getBalance(completionRepository));
  }

  return (
    <div className="app">
      <header className="topbar">
        <h1>ProductiviTea</h1>
        <span className="balance" title="Spendable balance">
          {balance}
        </span>
      </header>

      <form className="add-form" onSubmit={handleAdd}>
        <input
          aria-label="Task name"
          placeholder="New task (e.g. Read 20 min)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select
          aria-label="Value"
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

      <ul className="task-list">
        {activities.length === 0 && (
          <li className="empty">No tasks yet — add one above.</li>
        )}
        {activities.map((activity) => (
          <li key={activity.id} className="task">
            <span className="task-name">{activity.name}</span>
            <span className="task-value">+{activity.baseFibonacciValue}</span>
            <button onClick={() => handleComplete(activity)}>Complete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
