import { useState } from 'react'
import { ACTIVITIES, ACTIVITY_MAP, START_HOUR, END_HOUR } from './activities'
import './App.css'

function formatHour(h) {
  if (h === 12) return '12 PM'
  if (h === 0 || h === 24) return '12 AM'
  return h < 12 ? `${h} AM` : `${h - 12} PM`
}

const HOURS = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i)

export default function App() {
  const [selected, setSelected] = useState(null) // activity id being held
  const [slots, setSlots] = useState({})          // hour -> activity id
  const [dragOver, setDragOver] = useState(null)

  function pickActivity(id) {
    setSelected(prev => (prev === id ? null : id))
  }

  function placeOrRemove(hour) {
    if (slots[hour]) {
      // Click on filled slot removes it
      setSlots(prev => { const n = { ...prev }; delete n[hour]; return n })
    } else if (selected) {
      setSlots(prev => ({ ...prev, [hour]: selected }))
    }
  }

  function removeSlot(e, hour) {
    e.stopPropagation()
    setSlots(prev => { const n = { ...prev }; delete n[hour]; return n })
  }

  // Drag-and-drop from palette
  function onDragStart(e, id) {
    e.dataTransfer.setData('activityId', id)
    setSelected(id)
  }

  function onDrop(e, hour) {
    e.preventDefault()
    const id = e.dataTransfer.getData('activityId')
    if (id) setSlots(prev => ({ ...prev, [hour]: id }))
    setDragOver(null)
  }

  const selectedActivity = selected ? ACTIVITY_MAP[selected] : null

  return (
    <>
      <div className="header">
        <h1>🌈 My Day Planner</h1>
        <p>Plan your perfect day!</p>
      </div>

      <div className="instruction">
        {selectedActivity
          ? <>You picked: <span className="selected-name">{selectedActivity.emoji} {selectedActivity.label}</span> — now tap a time slot!</>
          : 'Pick an activity from the left, then tap a time slot to place it ✨'}
      </div>

      <div className="layout">
        {/* Activity Palette */}
        <div className="palette">
          <h2>Activities</h2>
          {ACTIVITIES.map(act => (
            <div
              key={act.id}
              className={`activity-card${selected === act.id ? ' selected' : ''}`}
              style={{ background: act.color }}
              onClick={() => pickActivity(act.id)}
              draggable
              onDragStart={e => onDragStart(e, act.id)}
            >
              <span className="emoji">{act.emoji}</span>
              <span className="name">{act.label}</span>
            </div>
          ))}
        </div>

        {/* Time Grid */}
        <div className="planner">
          <div className="planner-header">
            <h2>📅 Today&apos;s Schedule</h2>
            <button className="btn-clear" onClick={() => setSlots({})}>
              🗑️ Clear All
            </button>
          </div>

          <div className="time-grid">
            {HOURS.map(hour => {
              const actId = slots[hour]
              const act = actId ? ACTIVITY_MAP[actId] : null
              const isFilled = !!act

              return (
                <div key={hour} className="time-row">
                  <div className="time-label">{formatHour(hour)}</div>
                  <div
                    className={`time-slot ${isFilled ? 'filled' : 'empty'}${dragOver === hour ? ' drag-over' : ''}`}
                    style={act ? { background: act.color } : {}}
                    onClick={() => placeOrRemove(hour)}
                    onDragOver={e => { e.preventDefault(); setDragOver(hour) }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={e => onDrop(e, hour)}
                  >
                    {act ? (
                      <>
                        <span className="slot-emoji">{act.emoji}</span>
                        <span className="slot-label">{act.label}</span>
                        <button
                          className="slot-remove"
                          onClick={e => removeSlot(e, hour)}
                          title="Remove"
                        >✕</button>
                      </>
                    ) : (
                      <span className="slot-hint">tap to place</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </>
  )
}
