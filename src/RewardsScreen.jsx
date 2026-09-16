import { useEffect, useRef, useState } from 'react'
import { starBalance, canAfford } from './stars.js'
import {
  watchRewards,
  seedDefaultRewards,
  addReward,
  updateReward,
  removeReward,
  validateReward,
  labelToText,
  editedLabel,
  emojiChoices,
  DEFAULT_REWARD_EMOJI,
} from './rewards.js'
import { watchFamily, familyHasPin } from './family.js'
import { redeemReward, NotEnoughStarsError } from './kids.js'
import { errorDetail } from './errorMessage.js'
import { tBoth } from './i18n.js'
import { T, Label } from './T.jsx'
import { PinGate, PinSetup } from './PinGate.jsx'
import EmojiGrid from './EmojiGrid.jsx'

// What the stars are for. Redeeming is the kid's to do; the list
// itself — what's on it and what it costs — is a grown-up's, behind
// the same PIN as handing out stars. A kid who can re-price "a new
// toy" to 5 stars has taken the meaning out of the whole thing.
export default function RewardsScreen({ familyCode, kid, unlocked, onUnlock, onBack }) {
  const [rewards, setRewards] = useState(null)
  const [family, setFamily] = useState(undefined)
  const [error, setError] = useState(null)
  const [celebrating, setCelebrating] = useState(null)
  const [gateOpen, setGateOpen] = useState(false)
  const seededRef = useRef(false)

  const { balance } = starBalance(kid)

  useEffect(() => {
    if (!familyCode) return undefined
    return watchRewards(familyCode, setRewards, err =>
      setError(tBoth('errLoadRewards', { detail: errorDetail(err) })),
    )
  }, [familyCode])

  useEffect(() => {
    if (!familyCode) return undefined
    return watchFamily(familyCode, setFamily, () => setFamily(null))
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

  function report(err, key) {
    console.error(key, err)
    setError(tBoth(key, { detail: errorDetail(err) }))
  }

  return (
    <RewardsView
      kid={kid}
      rewards={rewards}
      balance={balance}
      error={error}
      celebrating={celebrating}
      unlocked={unlocked}
      gate={
        gateOpen && family !== undefined
          ? (familyHasPin(family)
              ? <PinGate family={family} onUnlocked={() => { setGateOpen(false); onUnlock() }} />
              : <PinSetup familyCode={familyCode} onSaved={() => { setGateOpen(false); onUnlock() }} />)
          : null
      }
      onOpenGate={() => setGateOpen(true)}
      onRedeem={handleRedeem}
      onRemove={rewardId => removeReward(familyCode, rewardId).catch(err => report(err, 'errEditReward'))}
      onAdd={async value => {
        try {
          await addReward(familyCode, value)
        } catch (err) {
          report(err, 'errAddReward')
        }
      }}
      onEdit={async (reward, value) => {
        try {
          await updateReward(familyCode, reward.id, {
            label: editedLabel(reward.label, value.label),
            cost: value.cost,
            emoji: value.emoji,
          })
        } catch (err) {
          report(err, 'errEditReward')
        }
      }}
      onBack={onBack}
    />
  )
}

// Kept apart from the Firestore work above so the screen can be
// rendered from a fixed list of rewards, locked or unlocked, which a
// test environment can reach and the live collection can't.
export function RewardsView({
  kid, rewards, balance, error, celebrating, unlocked, gate,
  onOpenGate, onRedeem, onRemove, onAdd, onEdit, onBack,
}) {
  const [confirming, setConfirming] = useState(null)
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)

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
            unlocked={unlocked}
            celebrating={celebrating === reward.id}
            editing={editing === reward.id}
            onRedeem={() => setConfirming(reward)}
            onRemove={() => onRemove(reward.id)}
            onStartEdit={() => setEditing(reward.id)}
            onCancelEdit={() => setEditing(null)}
            onSaveEdit={async value => { await onEdit(reward, value); setEditing(null) }}
          />
        ))}
      </ul>

      {unlocked && (adding
        ? <RewardForm
            titleKey="newReward"
            saveKey="saveReward"
            onCancel={() => setAdding(false)}
            onSave={async value => { await onAdd(value); setAdding(false) }}
          />
        : <button className="text-btn bi-inline" onClick={() => setAdding(true)}>
            <T k="addReward" />
          </button>)}

      {gate}

      {/* The way in and out of grown-up mode. Locked, the list is a menu
          a kid can choose from; unlocked, it's something to be changed. */}
      {!gate && (unlocked
        ? <p className="confirm-grownup managing-note"><T k="managingRewards" /></p>
        : <button className="text-btn bi-inline" onClick={onOpenGate}>
            <T k="manageRewards" />
          </button>)}

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

function RewardRow({
  reward, balance, unlocked, celebrating, editing,
  onRedeem, onRemove, onStartEdit, onCancelEdit, onSaveEdit,
}) {
  const affordable = canAfford(balance, reward.cost)
  const short = reward.cost - balance

  if (editing) {
    return (
      <li className="reward-row">
        <RewardForm
          titleKey="editRewardTitle"
          saveKey="saveChanges"
          initialName={labelToText(reward.label)}
          initialCost={String(reward.cost)}
          initialEmoji={reward.emoji ?? DEFAULT_REWARD_EMOJI}
          onCancel={onCancelEdit}
          onSave={onSaveEdit}
        />
      </li>
    )
  }

  return (
    <li className={`reward-row${affordable ? ' reward-affordable' : ''}`}>
      <div className="reward-head">
        <span className="reward-emoji" aria-hidden="true">{reward.emoji ?? '🎁'}</span>
        <span className="reward-name"><Label value={reward.label} /></span>
        {unlocked && (
          <>
            <button
              className="reward-remove"
              onClick={onStartEdit}
              aria-label={tBoth('editReward', { reward: labelText(reward.label) })}
              title={tBoth('editReward', { reward: labelText(reward.label) })}
            >
              ✏️
            </button>
            <button
              className="reward-remove"
              onClick={onRemove}
              aria-label={tBoth('removeReward', { reward: labelText(reward.label) })}
              title={tBoth('removeReward', { reward: labelText(reward.label) })}
            >
              ✕
            </button>
          </>
        )}
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

// One form for both adding and editing — the fields and the rules are
// identical, only the wording and what it starts with differ.
function RewardForm({
  titleKey, saveKey,
  initialName = '', initialCost = '', initialEmoji = DEFAULT_REWARD_EMOJI,
  onSave, onCancel,
}) {
  const [name, setName] = useState(initialName)
  const [cost, setCost] = useState(initialCost)
  const [emoji, setEmoji] = useState(initialEmoji)
  const [problem, setProblem] = useState(null)

  function handleSubmit(event) {
    event.preventDefault()
    const result = validateReward({ name, cost })
    if (!result.ok) {
      setProblem(result.reason.startsWith('name') ? 'rewardNameNeeded' : 'rewardCostNeeded')
      return
    }
    setProblem(null)
    onSave({ ...result.value, emoji })
  }

  return (
    <form className="add-reward-form" onSubmit={handleSubmit}>
      <p className="confirm-title"><T k={titleKey} /></p>
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
      <p className="pick-emoji-label"><T k="pickRewardEmoji" /></p>
      <EmojiGrid
        options={emojiChoices(initialEmoji)}
        value={emoji}
        onChange={setEmoji}
        labelKey="rewardEmojiOption"
      />
      {problem && <p className="form-error"><T k={problem} /></p>}
      <div className="confirm-actions">
        <button className="preset-btn wide-btn collect-btn" type="submit"><T k={saveKey} /></button>
        <button className="preset-btn wide-btn" type="button" onClick={onCancel}><T k="cancelAdd" /></button>
      </div>
    </form>
  )
}
