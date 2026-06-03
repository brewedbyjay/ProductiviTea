import { useEffect, useMemo, useRef, useState } from 'react';
import type { Stats } from '../application/getStats';
import { getStats } from '../application/getStats';
import {
  completionRepository,
  redemptionRepository,
  settingsRepository,
} from '../infrastructure/dexie/repositories';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

interface MonthCursor {
  year: number;
  month: number; // 0-based
}

// The History view: headline totals plus a month calendar of daily effort, all
// derived from the immutable logs (SPEC §6). The calendar shows one month at a
// time; navigate with the arrows or by swiping left/right. `reloadKey` bumps when
// the user completes/edits/redeems so the always-mounted desktop pane refreshes.
export default function StatsView({ reloadKey = 0 }: { reloadKey?: number }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const today = useMemo(() => toDayKey(new Date()), []);
  const thisMonth = useMemo<MonthCursor>(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  }, []);
  const [cursor, setCursor] = useState<MonthCursor>(thisMonth);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    void getStats(completionRepository, redemptionRepository, settingsRepository).then(
      setStats,
    );
  }, [reloadKey]);

  if (!stats) return null;

  // Can't go past the current month (no future data to show).
  const atCurrentMonth =
    cursor.year === thisMonth.year && cursor.month === thisMonth.month;

  const cells = monthCells(cursor.year, cursor.month);
  // Scale the color ramp to the busiest day of the shown month.
  const maxEarned = Math.max(
    1,
    ...cells
      .filter((d): d is number => d !== null)
      .map((d) => stats.daily.get(dayKey(cursor.year, cursor.month, d))?.earned ?? 0),
  );

  const goPrev = () => setCursor((c) => addMonths(c, -1));
  const goNext = () => {
    if (!atCurrentMonth) setCursor((c) => addMonths(c, 1));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (dx > 40) goPrev();
    else if (dx < -40) goNext();
  };

  const { summary } = stats;

  return (
    <section className="stats">
      <h2 className="stats-title">History</h2>

      {/* Month switcher — the arrows double as the swipe-left/right indicator. */}
      <div className="cal-header">
        <button className="cal-nav" aria-label="Previous month" onClick={goPrev}>
          ‹
        </button>
        <span className="cal-month">
          {MONTHS[cursor.month]} {cursor.year}
        </span>
        <button
          className="cal-nav"
          aria-label="Next month"
          onClick={goNext}
          disabled={atCurrentMonth}
        >
          ›
        </button>
      </div>

      {/* One calendar month: weekday columns (Mon..Sun), blanks pad the first row
          so day 1 lands on its weekday. Swipeable on touch. */}
      <div
        className="heatmap"
        role="img"
        aria-label={`${MONTHS[cursor.month]} ${cursor.year} activity`}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {WEEKDAYS.map((label) => (
          <span className="heatmap-label" key={label}>
            {label}
          </span>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <span className="heatmap-blank" key={`blank-${i}`} />;
          const key = dayKey(cursor.year, cursor.month, day);
          const stat = stats.daily.get(key);
          const earned = stat?.earned ?? 0;
          const future = key > today;
          return (
            <span
              key={key}
              className={`heatmap-day heat-${future ? 'future' : level(earned, maxEarned)}`}
              title={
                future ? undefined : `${key}: ${earned} earned, ${stat?.completed ?? 0} done`
              }
            />
          );
        })}
      </div>

      <p className="heatmap-legend">
        <span>Less</span>
        <span className="heatmap-day heat-0" />
        <span className="heatmap-day heat-1" />
        <span className="heatmap-day heat-2" />
        <span className="heatmap-day heat-3" />
        <span>More</span>
      </p>

      <h3 className="stats-group-title">Totals</h3>
      <div className="stats-tiles">
        <Tile label="Tasks done" value={summary.tasksCompleted} />
        <Tile label="Earned" value={summary.totalEarned} accent="coin" />
        <Tile label="Spent" value={summary.totalSpent} accent="coin" />
      </div>

      <h3 className="stats-group-title">Consistency</h3>
      <div className="stats-tiles">
        <Tile label="Best streak" value={summary.longestStreak} accent="accent" />
        <Tile label="Active days" value={summary.activeDays} />
      </div>
    </section>
  );
}

function Tile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: 'accent' | 'coin';
}) {
  return (
    <div className="stats-tile">
      <span className={accent ? `stats-value stats-value--${accent}` : 'stats-value'}>
        {value}
      </span>
      <span className="stats-label">{label}</span>
    </div>
  );
}

// Map a day's earnings to one of four intensity buckets (0 = none).
function level(earned: number, max: number): 0 | 1 | 2 | 3 {
  if (earned <= 0) return 0;
  const ratio = earned / max;
  if (ratio > 0.66) return 3;
  if (ratio > 0.33) return 2;
  return 1;
}

// --- Calendar helpers ------------------------------------------------------

function toDayKey(d: Date): string {
  return dayKey(d.getFullYear(), d.getMonth(), d.getDate());
}

function dayKey(year: number, month: number, day: number): string {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

function addMonths(c: MonthCursor, delta: number): MonthCursor {
  const d = new Date(c.year, c.month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

// The cells for a month grid: leading blanks (null) so the 1st lands under its
// weekday, then the day numbers 1..N. Monday-first.
function monthCells(year: number, month: number): (number | null)[] {
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // 0 = Monday
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  return cells;
}
