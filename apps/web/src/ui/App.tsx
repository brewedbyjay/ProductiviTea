import { useCallback, useEffect, useState } from 'react';
import { getBalance } from '../application/getBalance';
import {
  completionRepository,
  redemptionRepository,
} from '../infrastructure/dexie/repositories';
import TasksView from './TasksView';
import ShopView from './ShopView';
import './App.css';

type View = 'tasks' | 'shop';

// Closes the core loop: earn on the Tasks view, spend on the Shop view. The
// balance is shared across both and is always recomputed from the logs, so a
// completion or a redemption in either view refreshes the same number on top.
export default function App() {
  const [balance, setBalance] = useState(0);
  const [view, setView] = useState<View>('tasks');

  const refreshBalance = useCallback(async () => {
    setBalance(await getBalance(completionRepository, redemptionRepository));
  }, []);

  useEffect(() => {
    void refreshBalance();
  }, [refreshBalance]);

  return (
    <div className="app">
      <header className="topbar">
        <h1>ProductiviTea</h1>
        <span className="balance" title="Spendable balance">
          {balance}
        </span>
      </header>

      <nav className="view-toggle">
        <button
          className={view === 'tasks' ? 'active' : ''}
          onClick={() => setView('tasks')}
        >
          Tasks
        </button>
        <button
          className={view === 'shop' ? 'active' : ''}
          onClick={() => setView('shop')}
        >
          Shop
        </button>
      </nav>

      {view === 'tasks' ? (
        <TasksView onBalanceChange={refreshBalance} />
      ) : (
        <ShopView balance={balance} onBalanceChange={refreshBalance} />
      )}
    </div>
  );
}
