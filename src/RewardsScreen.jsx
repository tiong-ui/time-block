import { useEffect, useRef, useState } from 'react'
import { starBalance, canAfford } from './stars.js'
import {
  watchRewards,
  seedDefaultRewards,
  addReward,
  removeReward,
  validateReward,
} from './rewards.js'
import { redeemReward, NotEnoughStarsError } from './kids.js'
import { errorDetail } from './errorMessage.js'
import { tBoth } from './i18n.js'
import { T, Label } from './T.jsx'

// What the stars are for. Earning them is only half a reward system —
// spending them is the half a kid is actually working towards.
export default function RewardsScreen({ familyCode, kid, onBack }) {
  const [rewards, setRewards] = useState(null)
  const [error, setError] = useState(null)
  const [celebrating, setCelebrating] = useState(null)
  const seededRef = useRef(false)

  const { balance } = starBalance(kid)

  useEffect(() => {
    if (!familyCode) return undefined
    return watchRewards(familyCode, setRewards, err =>
      setError(tBoth('errLoadRewards', { detail: errorDetail(err) })),
    )
  }, [familyCode])

  // A family that has never opened this screen has no rewards to show,
  // which reads as broken rather than empty. Seeding is guarded on the
  // server side too, so this only ever happens once.
  useEffect(() => {
    if (seededRef.current || !familyCode || rewards?.length !== 0) return
    seededRef.current = true
    seedDefaultRewards(familyCode).catch(err => console.error('Could not seed rewards:', err))
  }, [familyCode, rewards])

  async function handleRedeem(reward) {
    setError(null)
    try {
      await redeemReward(familyCode, kid.id, {
        cost: reward.cost,
        label: reward.label,
        emoji: reward.emoji,
      })
      setCelebrating(reward.id)
    } catch (err) {
      console.error('Redeem failed:', err)
      setError(
        err instanceof NotEnoughStarsError
          ? tBoth('needMoreStars', { count: reward.cost - err.balance })
          : tBoth('errRedeem', { detail: errorDetail(err) }),
      )
    }
  }

  return (
    <RewardsView
      kid={kid}
      rewards={rewards}
      balance={balance}
      error={error}
      celebrating={celebrating}
      onRedeem={handleRedeem}
      onRemove={rewardId =>
        removeReward(familyCode, rewardId).catch(err => {
          console.error('Could not remove reward:', err)
          setError(tBoth('errAddReward', { detail: errorDetail(err) }))
        })
      }
      onAdd={async value => {
        try {
          await addReward(familyCode, { ...value, emoji: '🎁' })
        } catch (err) {
          console.error('Could not add reward:', err)
          setError(tBoth('errAddReward', { detail: errorDetail(err) }))
        }
      }}
      onBack={onBack}
    />
  )
}

// Kept apart from the Firestore work above so the screen can be
// rendered from a fixed list of rewards, which a test environment can
// reach and the live collection can't.
export function RewardsView({ kid, rewards, balance, error, celebrating, onRedeem, onRemove, onAdd, onBack }) {
  const [confirming, setConfirming] = useState(null)
  const [adding, setAdding] = useState(false)

  return (
    <div className="screen rewards-screen">
      <div className="hero-icon" aria-hidden="true">🎁</div>
      <h1><T k="rewardsTitle" vars={{ name: kid.name }} /></h1>
      <p className="subtitle"><T k="youHaveStars" vars={{ count: balance }} /></p>

      {error && <p className="form-error">{error}</p>}
      {rewards === null && !error && <p className="subtitle"><T k="loading" /></p>}
      {rewards?.length === 0 && <p className="subtitle"><T k="noRewardsYet" /></p>}

      <ul className="reward-list">
        {(rewards ?? []).map(reward => (
          <RewardRow
            key={reward.id}
            reward={reward}
            balance={balance}
            celebrating={celebrating === reward.id}
            onRedeem={() => setConfirming(reward)}
            onRemove={() => onRemove(reward.id)}
          />
        ))}
      </ul>

      {adding
        ? <AddRewardForm
            onCancel={() => setAdding(false)}
            onAdd={async value => { await onAdd(value); setAdding(false) }}
          />
        : <button className="text-btn bi-inline" onClick={() => setAdding(true)}>
            <T k="addReward" />
          </button>}

      {confirming && (
        <ConfirmRedeem
          reward={confirming}
          balance={balance}
          onCancel={() => setConfirming(null)}
          onConfirm={() => { const reward = confirming; setConfirming(null); onRedeem(reward) }}
        />
      )}

      <button className="text-btn" onClick={onBack}><T k="back" /></button>
    </div>
  )
}

function RewardRow({ reward, balance, celebrating, onRedeem, onRemove }) {
  const affordable = canAfford(balance, reward.cost)
  const short = reward.cost - balance

  return (
    <li className={`reward-row${affordable ? ' reward-affordable' : ''}`}>
      {/* The name gets the full width on its own line — squeezed beside
          the buttons it wrapped to three lines and read as a puzzle. */}
      <div className="reward-head">
        <span className="reward-emoji" aria-hidden="true">{reward.emoji ?? '🎁'}</span>
        <span className="reward-name"><Label value={reward.label} /></span>
        <button
          className="reward-remove"
          onClick={onRemove}
          aria-label={tBoth('removeReward', { reward: labelText(reward.label) })}
          title={tBoth('removeReward', { reward: labelText(reward.label) })}
        >
          ✕
        </button>
      </div>
      <div className="reward-foot">
        <span className="reward-cost bi-inline">
          {affordable
            ? <T k="costStars" vars={{ count: reward.cost }} />
            : <T k="needMoreStars" vars={{ count: short }} />}
        </span>
        <button
          className="preset-btn reward-redeem"
          onClick={onRedeem}
          disabled={!affordable || celebrating}
        >
          {celebrating ? <T k="redeemed" /> : <T k="redeem" />}
        </button>
      </div>
    </li>
  )
}

function labelText(label) {
  return label && typeof label === 'object' ? `${label.zh} / ${label.en}` : String(label ?? '')
}

function ConfirmRedeem({ reward, balance, onCancel, onConfirm }) {
  return (
    <div className="confirm-card">
      <p className="confirm-title"><T k="confirmRedeemTitle" /></p>
      <p className="confirm-reward">
        <span aria-hidden="true">{reward.emoji ?? '🎁'}</span> <Label value={reward.label} />
      </p>
      <p className="confirm-body">
        <T k="confirmRedeemBody" vars={{ cost: reward.cost, left: balance - reward.cost }} />
      </p>
      <p className="confirm-grownup"><T k="askGrownUp" /></p>
      <div className="confirm-actions">
        <button className="preset-btn wide-btn collect-btn" onClick={onConfirm}>
          <T k="yesRedeem" />
        </button>
        <button className="preset-btn wide-btn" onClick={onCancel}>
          <T k="cancel" />
        </button>
      </div>
    </div>
  )
}

function AddRewardForm({ onAdd, onCancel }) {
  const [name, setName] = useState('')
  const [cost, setCost] = useState('')
  const [problem, setProblem] = useState(null)

  function handleSubmit(event) {
    event.preventDefault()
    const result = validateReward({ name, cost })
    if (!result.ok) {
      setProblem(result.reason.startsWith('name') ? 'rewardNameNeeded' : 'rewardCostNeeded')
      return
    }
    setProblem(null)
    onAdd(result.value)
  }

  return (
    <form className="add-reward-form" onSubmit={handleSubmit}>
      <p className="confirm-title"><T k="newReward" /></p>
      <input
        className="text-input"
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder={tBoth('rewardNamePlaceholder')}
        maxLength={40}
      />
      <input
        className="text-input"
        value={cost}
        onChange={e => setCost(e.target.value.replace(/\D/g, ''))}
        placeholder={tBoth('rewardCostPlaceholder')}
        inputMode="numeric"
      />
      {problem && <p className="form-error"><T k={problem} /></p>}
      <div className="confirm-actions">
        <button className="preset-btn wide-btn collect-btn" type="submit"><T k="saveReward" /></button>
        <button className="preset-btn wide-btn" type="button" onClick={onCancel}><T k="cancelAdd" /></button>
      </div>
    </form>
  )
}
