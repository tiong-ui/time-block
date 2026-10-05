import { useEffect, useRef, useState } from 'react'
import { AVATAR_GROUPS } from './avatars.js'
import { toSingleEmoji, leadingEmoji, loadCustomEmoji, rememberCustomEmoji } from './emoji.js'
import { tBoth } from './i18n.js'
import { T } from './T.jsx'

// A grid of emoji to pick one from. Used for kid avatars and for the
// picture on a reward — the same interaction, so the same component
// rather than two that drift apart.
//
// The groups are shortcuts, not the whole alphabet: the last tile
// hands over to the device's own emoji keyboard, which knows every
// emoji the device can draw and is kept up to date by the people who
// ship it. What a family picks that way is remembered, so the ones
// they actually use become one tap like everything else.
export default function EmojiGrid({ groups = AVATAR_GROUPS, value, onChange, labelKey = 'avatarOption' }) {
  const [custom, setCustom] = useState(loadCustomEmoji)
  const [typing, setTyping] = useState(false)

  const leading = leadingEmoji({ value, groups, custom })

  const tabs = [
    ...(leading.length ? [{ key: 'emojiYours', emoji: leading }] : []),
    ...groups,
  ]
  const [tab, setTab] = useState(tabs[0].key)
  const shown = tabs.find(t => t.key === tab) ?? tabs[0]

  function choose(emoji) {
    onChange(emoji)
    setTyping(false)
  }

  function chooseCustom(emoji) {
    setCustom(rememberCustomEmoji(emoji))
    // Move to where it just landed. Without this the grid carries on
    // showing whichever tab was open, so a kid who picks a moose from
    // the keyboard watches nothing happen in front of them.
    setTab('emojiYours')
    choose(emoji)
  }

  return (
    <div className="emoji-picker">
      {tabs.length > 1 && (
        <div className="emoji-tabs">
          {tabs.map(t => (
            <button
              key={t.key}
              type="button"
              className={`emoji-tab${t.key === shown.key ? ' emoji-tab-active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              <T k={t.key} />
            </button>
          ))}
        </div>
      )}

      <div className="emoji-grid">
        {shown.emoji.map(emoji => (
          <button
            key={emoji}
            type="button"
            className={`emoji-btn${value === emoji ? ' active' : ''}`}
            onClick={() => choose(emoji)}
            aria-pressed={value === emoji}
            aria-label={tBoth(labelKey, { emoji })}
          >
            {emoji}
          </button>
        ))}
        <button
          type="button"
          className={`emoji-btn emoji-more${typing ? ' active' : ''}`}
          onClick={() => setTyping(t => !t)}
          aria-expanded={typing}
          aria-label={tBoth('anyEmoji')}
        >
          ＋
        </button>
      </div>

      {typing && <CustomEmojiField onPick={chooseCustom} />}
    </div>
  )
}

// One character's worth of text input, which is all it takes: tapping
// it opens the keyboard, and the emoji key on that keyboard is the
// picker. A phone or tablet has that key; a desktop browser hides the
// same thing behind a shortcut, so the hint names both.
function CustomEmojiField({ onPick }) {
  const [text, setText] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Accepted the moment it is one emoji, so there is no second button
  // to find — and no way to end up holding two.
  function handleChange(next) {
    setText(next)
    const emoji = toSingleEmoji(next)
    if (emoji) onPick(emoji)
  }

  return (
    <div className="emoji-custom">
      <input
        ref={inputRef}
        className="text-input emoji-custom-input"
        value={text}
        onChange={e => handleChange(e.target.value)}
        aria-label={tBoth('anyEmoji')}
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
      />
      <p className="peek-hint">
        <T k={text && !toSingleEmoji(text) ? 'oneEmojiOnly' : 'anyEmojiHint'} />
      </p>
    </div>
  )
}
