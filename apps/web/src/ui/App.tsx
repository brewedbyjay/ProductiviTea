import { useCallback, useEffect, useState } from 'react';
import type { UserSettings } from '../domain/settings';
import { DEFAULT_DAY_START_MINUTES } from '../domain/settings';
import { getBalance } from '../application/getBalance';
import { getStreak } from '../application/getStreak';
import { getSettings } from '../application/getSettings';
import { saveSettings } from '../application/saveSettings';
import {
  removeAllTasks,
  resetCoins,
  resetAccount,
} from '../application/resetData';
import {
  activityRepository,
  completionRepository,
  redemptionRepository,
  rewardRepository,
  settingsRepository,
} from '../infrastructure/dexie/repositories';
import TasksView from './TasksView';
import ShopView from './ShopView';
import StatsView from './StatsView';
import DevColorsView from './DevColorsView';
import './App.css';

type View = 'tasks' | 'add' | 'shop' | 'stats' | 'settings';

// Closes the core loop: earn (Tasks), add (+), spend (Shop), with the streak and
// balance recomputed from the logs in the top bar. Settings live here as the
// single source of truth (the cog and the category-color picker both edit them),
// so saves merge instead of overwriting each other.
export default function App() {
  const [balance, setBalance] = useState(0);
  const [streak, setStreak] = useState(0);
  const [settings, setSettings] = useState<UserSettings>({
    dayStartMinutes: DEFAULT_DAY_START_MINUTES,
  });
  const [view, setView] = useState<View>('tasks');
  const [showSettings, setShowSettings] = useState(false);
  // Dev-only colour inspector (desktop link, bottom-right).
  const [showDevColors, setShowDevColors] = useState(false);
  // Bumped whenever the logs change (complete/edit/redeem) so the always-mounted
  // desktop stats pane re-derives its history; mobile re-mounts it on tab switch.
  const [reloadKey, setReloadKey] = useState(0);

  const refreshBalance = useCallback(async () => {
    setBalance(await getBalance(completionRepository, redemptionRepository));
    setReloadKey((k) => k + 1);
  }, []);

  const refreshStreak = useCallback(async () => {
    const { currentStreak } = await getStreak(
      completionRepository,
      settingsRepository,
    );
    setStreak(currentStreak);
  }, []);

  const refreshSettings = useCallback(async () => {
    setSettings(await getSettings(settingsRepository));
  }, []);

  useEffect(() => {
    void refreshBalance();
    void refreshStreak();
    void refreshSettings();
  }, [refreshBalance, refreshStreak, refreshSettings]);

  // Merge a settings change, persist it, then refresh derived state. Persist
  // before updating React state so any reader re-fetching from the store (e.g.
  // the Tasks "today" scope, which depends on day-start) sees the new value.
  const updateSettings = useCallback(
    async (patch: Partial<UserSettings>) => {
      const next = { ...settings, ...patch };
      await saveSettings(settingsRepository, next);
      setSettings(next);
      await refreshStreak();
    },
    [settings, refreshStreak],
  );

  // After a bulk wipe, re-derive everything. refreshBalance bumps reloadKey, which
  // re-loads the Tasks/Shop/Stats views (they key their loads on it).
  const refreshAfterReset = useCallback(async () => {
    await refreshSettings();
    await refreshStreak();
    await refreshBalance();
  }, [refreshSettings, refreshStreak, refreshBalance]);

  const handleRemoveAllTasks = useCallback(async () => {
    await removeAllTasks(activityRepository);
    await refreshAfterReset();
  }, [refreshAfterReset]);

  const handleResetCoins = useCallback(async () => {
    await resetCoins(completionRepository, redemptionRepository);
    await refreshAfterReset();
  }, [refreshAfterReset]);

  const handleResetAccount = useCallback(async () => {
    await resetAccount(
      activityRepository,
      completionRepository,
      rewardRepository,
      redemptionRepository,
      settingsRepository,
    );
    await refreshAfterReset();
  }, [refreshAfterReset]);

  return (
    <div className="app">
      <header className="topbar">
        <h1>ProductiviTea</h1>
        <div className="topbar-right">
          <div className="topbar-stats">
            <span className="streak" title="Current streak">
              {streak}
              {/* Lightning glyph tinted green via CSS mask (streak.png). */}
              <span className="stat-icon streak-icon" aria-hidden="true" />
            </span>
            <span className="balance" title="Spendable balance">
              {balance}
              <img className="stat-icon" src="/coin.png" alt="" />
            </span>
          </div>
          <button
            className="settings-button"
            aria-label="Settings"
            aria-expanded={showSettings}
            onClick={() => setShowSettings((s) => !s)}
          >
            <img className="settings-icon" src="/settings.png" alt="" />
          </button>
        </div>
      </header>

      {showSettings && (
        <div className="settings-panel" role="dialog" aria-label="Settings">
          <SettingsContent
            settings={settings}
            onUpdateSettings={updateSettings}
            onResetAccount={handleResetAccount}
            onRemoveAllTasks={handleRemoveAllTasks}
            onResetCoins={handleResetCoins}
            onOpenDevColors={() => {
              setShowSettings(false);
              setShowDevColors(true);
            }}
          />
        </div>
      )}

      <div className={`workspace workspace--${view}`}>
        <main className="tasks-pane">
          <TasksView
            mode={view === 'add' ? 'add' : 'list'}
            settings={settings}
            reloadKey={reloadKey}
            onUpdateSettings={updateSettings}
            onAdded={() => setView('tasks')}
            onBalanceChange={refreshBalance}
            onStreakChange={refreshStreak}
          />
        </main>
        <aside className="shop-pane">
          <ShopView
            balance={balance}
            reloadKey={reloadKey}
            onBalanceChange={refreshBalance}
          />
        </aside>
        <aside className="stats-pane">
          <StatsView reloadKey={reloadKey} />
        </aside>
        {/* Settings as a full view (mobile only — desktop edits via the cog). */}
        <aside className="settings-pane">
          <h2 className="settings-pane__title">Settings</h2>
          <SettingsContent
            settings={settings}
            onUpdateSettings={updateSettings}
            onResetAccount={handleResetAccount}
            onRemoveAllTasks={handleRemoveAllTasks}
            onResetCoins={handleResetCoins}
            onOpenDevColors={() => {
              setShowSettings(false);
              setShowDevColors(true);
            }}
          />
        </aside>
      </div>

      {/* Fixed bottom navbar (SPEC §9). Mobile only — wide screens show every pane.
          An even number of tabs keeps the middle "+" (add task) centered. */}
      <nav className="bottom-nav">
        <button
          className={view === 'tasks' ? 'active' : ''}
          aria-label="Tasks"
          onClick={() => setView('tasks')}
        >
          <img className="nav-icon" src="/clipboard.png" alt="" />
        </button>
        <button
          className={view === 'stats' ? 'active' : ''}
          aria-label="Stats"
          onClick={() => setView('stats')}
        >
          <img className="nav-icon" src="/stats.png" alt="" />
        </button>
        <button
          className={view === 'add' ? 'nav-add active' : 'nav-add'}
          aria-label="Add task"
          onClick={() => setView('add')}
        >
          +
        </button>
        {/* Reserves the centre column so the absolutely-placed "+" has breathing
            room and the four icons sit symmetrically either side of it. */}
        <span className="nav-spacer" aria-hidden="true" />
        <button
          className={view === 'shop' ? 'active' : ''}
          aria-label="Shop"
          onClick={() => setView('shop')}
        >
          <img className="nav-icon" src="/shop.png" alt="" />
        </button>
        <button
          className={view === 'settings' ? 'active' : ''}
          aria-label="Settings"
          onClick={() => setView('settings')}
        >
          <img className="nav-icon" src="/settings.png" alt="" />
        </button>
      </nav>

      {/* Dev colour inspector — opened from the Settings → Debug section. */}
      {showDevColors && <DevColorsView onClose={() => setShowDevColors(false)} />}
    </div>
  );
}

// The settings body, shared by the cog dropdown (desktop) and the Settings view
// (mobile): the day-start, a confirmed account reset, and debug wipes.
function SettingsContent({
  settings,
  onUpdateSettings,
  onResetAccount,
  onRemoveAllTasks,
  onResetCoins,
  onOpenDevColors,
}: {
  settings: UserSettings;
  onUpdateSettings: (patch: Partial<UserSettings>) => void;
  onResetAccount: () => void;
  onRemoveAllTasks: () => void;
  onResetCoins: () => void;
  onOpenDevColors: () => void;
}) {
  return (
    <div className="settings-content">
      <DayStartSetting settings={settings} onUpdateSettings={onUpdateSettings} />

      <div className="settings-section">
        <button
          type="button"
          className="danger-button"
          onClick={() => {
            if (
              window.confirm(
                'Reset your account? This permanently deletes all tasks, rewards, and history.',
              )
            ) {
              onResetAccount();
            }
          }}
        >
          Reset account
        </button>
      </div>

      <div className="settings-section">
        <span className="settings-section__label">Debug</span>
        <div className="settings-buttons">
          <button type="button" onClick={onRemoveAllTasks}>
            Remove all tasks
          </button>
          <button type="button" onClick={onResetCoins}>
            Reset coins
          </button>
          <button type="button" onClick={onOpenDevColors}>
            Dev colours
          </button>
        </div>
      </div>
    </div>
  );
}

// The day-start control (SPEC §5), which defines the logical-day boundary for
// streaks and the "today" list. Shared by the cog dropdown and the mobile
// Settings view so both stay in sync.
function DayStartSetting({
  settings,
  onUpdateSettings,
}: {
  settings: UserSettings;
  onUpdateSettings: (patch: Partial<UserSettings>) => void;
}) {
  function handleDayStartChange(e: React.ChangeEvent<HTMLInputElement>) {
    const minutes = timeToMinutes(e.target.value);
    if (minutes === null) return;
    onUpdateSettings({ dayStartMinutes: minutes });
  }

  return (
    <label className="day-start">
      Day starts at
      <input
        type="time"
        aria-label="Day start time"
        value={minutesToTime(settings.dayStartMinutes)}
        onChange={handleDayStartChange}
      />
    </label>
  );
}

// "HH:MM" <-> minutes-past-midnight, the shape the domain day boundary expects.
function minutesToTime(minutes: number): string {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0');
  const m = String(minutes % 60).padStart(2, '0');
  return `${h}:${m}`;
}

function timeToMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}
