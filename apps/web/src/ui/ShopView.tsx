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
  reloadKey = 0,
}: {
  balance: number;
  onBalanceChange: () => void;
  // Bumped by App after a reset so the rewards list re-loads (e.g. after a wipe).
  reloadKey?: number;
}) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [name, setName] = useState('');
  const [cost, setCost] = useState<number>(5);

  async function loadRewards() {
    setRewards(await rewardRepository.getAll());
  }

  useEffect(() => {
    void loadRewards();
  }, [reloadKey]);

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
        <label className="field field--grow">
          <span className="field-label">Reward</span>
          <input
            aria-label="Reward name"
            placeholder="New reward (e.g. Cola)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <label className="field">
          <span className="field-label">Cost</span>
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
        </label>

        <button type="submit" className="add-submit">
          Add
        </button>
      </form>

      <h2 className="shop-title">Rewards</h2>

      <ul className="row-list">
        {rewards.length === 0 && (
          <li className="empty">No rewards yet — add one above.</li>
        )}
        {rewards.map((reward) => (
          <li key={reward.id} className="row">
            <span className="row-name">{reward.name}</span>
            <span className="row-cost">{reward.baseCost}</span>
            <button
              className="redeem-button"
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
