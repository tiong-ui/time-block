import { useEffect, useRef, useState } from 'react'
import {
  watchActivities,
  seedDefaultActivities,
  addActivity,
  updateActivity,
  removeActivity,
  validateActivity,
  labelToText,
  labelHalves,
  emojiChoices,
  DEFAULT_ACTIVITY_EMOJI,
  HIIT_ACTIVITY,
  MAX_ACTIVITY_NAME,
} from './activities.js'
import { errorDetail } from './errorMessage.js'
import { tBoth, tZh, tEn } from './i18n.js'
import { T, Label } from './T.jsx'
import BackBar from './BackBar.jsx'
import EmojiGrid from './EmojiGrid.jsx'

// The family's focus tasks, kept behind the grown-up PIN like the
// rewards are. A household that does violin and 圍棋 rather than piano
// and drawing should be able to say so.
export default function ActivitiesScreen({ familyCode, onBack }) {
  const [activities, setActivities] = useState(null)
  const [error, setError] = useState(null)
  const seededRef = useRef(false)

  useEffect(() => {
    if (!familyCode) return undefined
    return watchActivities(familyCode, setActivities, err =>
      setError(tBoth('errLoadActivities', { detail: errorDetail(err) })),
    )
  }, [familyCode])

  useEffect(() => {
    if (seededRef.current || !familyCode || activities?.length !== 0) return
    seededRef.current = true
    seedDefaultActivities(familyCode).catch(err => console.error('Could not seed activities:', err))
  }, [familyCode, activities])

  function report(err) {
    console.error('Activity change failed:', err)
    setError(tBoth('errSaveActivity', { detail: errorDetail(err) }))
  }

  return (
    <ActivitiesView
      activities={activities}
      error={error}
      onAdd={async value => {
        try {
          await addActivity(familyCode, value)
        } catch (err) { report(err) }
      }}
      onEdit={async (activity, value) => {
        try {
          await updateActivity(familyCode, activity.id, value)
        } catch (err) { report(err) }
      }}
      onRemove={id => removeActivity(familyCode, id).catch(report)}
      onBack={onBack}
    />
  )
}

// Kept apart from the Firestore work so the screen can be rendered
// from a fixed list, which a test environment can reach.
export function ActivitiesView({ activities, error, onAdd, onEdit, onRemove, onBack }) {
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)

  return (
    <div className="screen rewards-screen">
      <BackBar onBack={onBack} />
      <div className="hero-icon" aria-hidden="true">🎯</div>
      <h1><T k="manageActivities" /></h1>
      <p className="subtitle"><T k="manageActivitiesWhy" /></p>

      {error && <p className="form-error">{error}</p>}
      {activities === null && !error && <p className="subtitle"><T k="loading" /></p>}
      {activities?.length === 0 && <p className="subtitle"><T k="noActivitiesYet" /></p>}

      <ul className="reward-list reward-list-managing">
        {(activities ?? []).map(activity => (
          <li className="reward-row" key={activity.id}>
            {editing === activity.id ? (
              <ActivityForm
                titleKey="editActivityTitle"
                saveKey="saveChanges"
                initialNames={labelHalves(activity.label)}
                initialEmoji={activity.emoji ?? DEFAULT_ACTIVITY_EMOJI}
                onCancel={() => setEditing(null)}
                onSave={async value => { await onEdit(activity, value); setEditing(null) }}
              />
            ) : (
              <>
                <span className="reward-emoji" aria-hidden="true">{activity.emoji}</span>
                <span className="reward-name"><Label value={activity.label} /></span>
                <span className="reward-tools">
                  <button
                    className="reward-remove"
                    onClick={() => setEditing(activity.id)}
                    aria-label={tBoth('editActivity', { name: labelToText(activity.label) })}
                    title={tBoth('editActivity', { name: labelToText(activity.label) })}
                  >
                    ✏️
                  </button>
                  <button
                    className="reward-remove"
                    onClick={() => onRemove(activity.id)}
                    aria-label={tBoth('removeActivity', { name: labelToText(activity.label) })}
                    title={tBoth('removeActivity', { name: labelToText(activity.label) })}
                  >
                    ✕
                  </button>
                </span>
              </>
            )}
          </li>
        ))}

        {/* HIIT is what switches the timer into work/rest rounds, so it
            isn't the family's to rename or remove — shown here so its
            absence from the list doesn't look like a bug. */}
        <li className="reward-row activity-builtin">
          <span className="reward-emoji" aria-hidden="true">{HIIT_ACTIVITY.emoji}</span>
          <span className="reward-name"><Label value={HIIT_ACTIVITY.label} /></span>
          <span className="reward-short"><T k="builtIn" /></span>
        </li>
      </ul>

      {adding
        ? <ActivityForm
            titleKey="newActivity"
            saveKey="saveReward"
            onCancel={() => setAdding(false)}
            onSave={async value => { await onAdd(value); setAdding(false) }}
          />
        : <button className="text-btn bi-inline" onClick={() => setAdding(true)}>
            <T k="addActivity" />
          </button>}

    </div>
  )
}

function ActivityForm({
  titleKey, saveKey,
  initialNames = { zh: '', en: '' },
  initialEmoji = DEFAULT_ACTIVITY_EMOJI,
  onSave, onCancel,
}) {
  const [zh, setZh] = useState(initialNames.zh)
  const [en, setEn] = useState(initialNames.en)
  const [emoji, setEmoji] = useState(initialEmoji)
  const [problem, setProblem] = useState(null)

  function handleSubmit(event) {
    event.preventDefault()
    const result = validateActivity({ zh, en })
    if (!result.ok) return setProblem('activityNameNeeded')
    setProblem(null)
    onSave({ ...result.value, emoji })
  }

  return (
    <form className="add-reward-form" onSubmit={handleSubmit}>
      <p className="confirm-title"><T k={titleKey} /></p>
      {/* Two boxes rather than one, because the app shows both
          languages — a task typed into a single box could only ever be
          half a label. Either one on its own is allowed. */}
      <input
        className="text-input"
        value={zh}
        onChange={e => setZh(e.target.value)}
        placeholder={tZh('activityNameZh')}
        lang="zh-Hant"
        maxLength={MAX_ACTIVITY_NAME}
      />
      <input
        className="text-input"
        value={en}
        onChange={e => setEn(e.target.value)}
        placeholder={tEn('activityNameEn')}
        lang="en"
        maxLength={MAX_ACTIVITY_NAME}
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
