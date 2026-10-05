// Kid avatar choices. Grouped so a longer list stays browsable — one
// screen of twelve was quick to scan but quick to exhaust, and a flat
// seventy would be a wall.
//
// Nothing here is a limit any more: the picker also takes whatever the
// device's own emoji keyboard can produce. These are the shortcuts, so
// the common case stays one tap.
export const AVATAR_GROUPS = [
  {
    key: 'emojiAnimals',
    emoji: [
      '🦊', '🐼', '🐯', '🐨', '🐰', '🦁',
      '🐸', '🐵', '🦄', '🐶', '🐱', '🐧',
      '🐢', '🦉', '🦋', '🐝', '🐬', '🐙',
      '🦖', '🦕', '🐳', '🦔', '🐥', '🦝',
    ],
  },
  {
    key: 'emojiPeople',
    emoji: [
      '🧒', '👦', '👧', '👶', '🧑', '👴',
      '🦸', '🦹', '🧙', '🧚', '🧜', '🥷',
      '👨‍🚀', '👩‍🍳', '👨‍🎨', '👩‍⚕️', '🤠', '🧑‍🎤',
      '🤖', '👽', '👻', '🎅', '🧝', '🤡',
    ],
  },
  {
    key: 'emojiThings',
    emoji: [
      '⭐', '🌈', '🚀', '⚽', '🏀', '🎸',
      '🎨', '📚', '🧩', '🎲', '🍎', '🍓',
      '🌻', '🌵', '🔥', '❄️', '⚡', '🌙',
      '🎈', '🎵', '🏆', '💎', '🛸', '🧁',
    ],
  },
]

// The flat list, for anything that just wants a default or to know
// whether an emoji is one of the built-ins.
export const AVATARS = AVATAR_GROUPS.flatMap(group => group.emoji)
