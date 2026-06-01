import { useEffect, useState } from 'react';
import type { Reward } from '../domain/reward';
import { canAfford } from '../domain/balance';
import { FIBONACCI_TIERS } from '../domain/fibonacci';
import { createReward } from '../application/createReward';
import { redeemReward, INSUFFICIENT_BALANCE } from '../application/redeemReward';
import {
  completionRepository,
  redemptionRepository,
  rewardRepository,
} from '../infrastructure/dexie/repositories';

// The spending side: define rewards and redeem them with earned currency.
// Redeeming changes the balance, so it reports back via onBalanceChange. The
// current balance is passed in to gate affordability (the no-debt rule).
export default function ShopView({
  balance,
  onBalanceChange,
}: {
  balance: number;
  onBalanceChange: () => void;
}) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [name, setName] = useState('');
  const [cost, setCost] = useState<number>(5);

  async function loadRewards() {
    setRewards(await rewardRepository.getAll());
  }

  useEffect(() => {
    void loadRewards();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    await createReward(rewardRepository, { name, baseCost: cost });
    setName('');
    await loadRewards();
  }

  async function handleRedeem(reward: Reward) {
    try {
      await redeemReward(completionRepository, redemptionRepository, reward);
      onBalanceChange();
    } catch (err) {
      // The button is disabled when unaffordable, but the use-case enforces the
      // no-debt rule regardless — surface anything unexpected.
      if (!(err instanceof Error) || err.message !== INSUFFICIENT_BALANCE) {
        throw err;
      }
    }
  }

  return (
    <section>
      <form className="add-form" onSubmit={handleAdd}>
        <input
          aria-label="Reward name"
          placeholder="New reward (e.g. Cola)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <select
          aria-label="Reward cost"
          value={cost}
          onChange={(e) => setCost(Number(e.target.value))}
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
        {rewards.length === 0 && (
          <li className="empty">No rewards yet — add one above.</li>
        )}
        {rewards.map((reward) => (
          <li key={reward.id} className="row">
            <span className="row-name">{reward.name}</span>
            <span className="row-cost">{reward.baseCost}</span>
            <button
              onClick={() => handleRedeem(reward)}
              disabled={!canAfford(balance, reward.baseCost)}
            >
              Redeem
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
