// Every user-facing string in both languages. The UI shows them
// together — Traditional Chinese leading, English underneath — so the
// kids read their own language first and pick up the English alongside
// it, rather than one hiding behind a language switch.
//
// Placeholders use {braces}, e.g. t('starJarTitle', { name: 'Emma' }).

export const STRINGS = {
  // Timer
  focusTime: { zh: '專注時間', en: 'Focus Time' },
  whatFocusingOn: { zh: '你要專心做什麼？（可以不選）', en: 'What are you focusing on? (optional)' },
  pickHowLong: { zh: '選擇要專心多久', en: 'Pick how long you want to focus' },
  minutes: { zh: '分鐘', en: 'min' },
  stayFocused: { zh: '保持專心！', en: 'Stay focused!' },
  paused: { zh: '暫停中', en: 'Paused' },
  peekHint: { zh: '👆 按住圓圈可以偷看剩下多久', en: 'Hold the circle to peek at the time' },
  pause: { zh: '暫停', en: 'Pause' },
  resume: { zh: '繼續', en: 'Resume' },
  stop: { zh: '停止', en: 'Stop' },

  // HIIT
  exerciseDuration: { zh: '運動多久', en: 'Exercise for' },
  restDuration: { zh: '休息多久', en: 'Rest for' },
  seconds: { zh: '{count} 秒', en: '{count}s' },
  workNow: { zh: '運動！', en: 'Work!' },
  restNow: { zh: '休息一下', en: 'Rest' },
  roundNumber: { zh: '第 {number} 回合', en: 'Round {number}' },
  totalLeft: { zh: '總共還剩 {time}', en: '{time} left in total' },

  // Done
  greatJob: { zh: '做得很棒！', en: 'Great job!' },
  niceWorkOn: { zh: '{activity}完成囉！', en: 'Nice work on {activity}!' },
  timeIsUp: { zh: '專注時間結束了', en: 'Your focus time is up.' },
  startAgain: { zh: '再來一次', en: 'Start Again' },
  addMyStars: { zh: '⭐ 把我的 {count} 顆星星放進去！', en: '⭐ Add my {count} stars!' },

  // Star Jar
  starJar: { zh: '星星罐', en: 'Star Jar' },
  starJarTitle: { zh: '{name}的星星罐', en: "{name}'s Star Jar" },
  totalStars: { zh: '總星星', en: 'Total Stars' },
  fullJars: { zh: '集滿的罐子', en: 'Full Jars' },
  starsInThisJar: { zh: '這罐有 {count}/{capacity} 顆星星', en: '{count}/{capacity} stars in this jar' },
  tapToShake: { zh: '👆 點一下罐子搖一搖', en: 'Tap the jar to shake it' },
  jarFull: { zh: '🎉 第 {number} 罐集滿了！', en: '🎉 Jar #{number} full!' },

  // Kids
  whosFocusing: { zh: '今天誰要專心？', en: "Who's focusing today?" },
  addAKid: { zh: '新增小孩', en: 'Add a kid' },
  nameAndAvatar: { zh: '輸入名字，選一個頭像', en: "What's their name, and pick an avatar" },
  namePlaceholder: { zh: '名字', en: 'Name' },
  add: { zh: '新增', en: 'Add' },
  adding: { zh: '新增中…', en: 'Adding…' },
  addAnotherKid: { zh: '＋ 新增另一個小孩', en: '+ Add another kid' },
  switchKid: { zh: '換人', en: 'Switch' },
  avatarTitle: { zh: '{name}的頭像', en: "{name}'s Avatar" },
  pickNewAvatar: { zh: '選一個新的頭像', en: 'Pick a new one' },
  changeAvatarOf: { zh: '更換{name}的頭像', en: "Change {name}'s avatar" },

  // Family setup
  setUpStarJar: { zh: '幫孩子建立星星罐，專心就能收集星星。', en: 'Set up a Star Jar your kids can fill as they focus.' },
  createFamily: { zh: '✨ 建立新家庭', en: '✨ Create a new family' },
  creating: { zh: '建立中…', en: 'Creating…' },
  haveACode: { zh: '🔑 我有家庭代碼', en: '🔑 I have a code' },
  familyCreated: { zh: '家庭建立完成！', en: 'Family created!' },
  useCodeElsewhere: { zh: '在孩子的其他裝置輸入這個代碼：', en: "Use this code on your kids' other devices too:" },
  continueBtn: { zh: '繼續', en: 'Continue' },
  joinFamily: { zh: '加入家庭', en: 'Join a family' },
  enterCode: { zh: '輸入另一台裝置上的代碼', en: 'Enter the code from your other device' },
  join: { zh: '加入', en: 'Join' },
  checking: { zh: '檢查中…', en: 'Checking…' },

  // Shared
  back: { zh: '返回', en: 'Back' },
  loading: { zh: '載入中…', en: 'Loading…' },
  retry: { zh: '重試', en: 'Retry' },
  cantConnect: { zh: '無法連線', en: "Couldn't connect" },
  activityLabel: { zh: '活動', en: 'Activity' },
  colorTheme: { zh: '顏色主題', en: 'Color theme' },
  avatarOption: { zh: '頭像 {emoji}', en: 'Avatar {emoji}' },
  timeRemaining: { zh: '剩餘時間', en: 'Time remaining' },
  jarHolding: { zh: '罐子裡有 {count}/{capacity} 顆星星', en: 'Jar holding {count} of {capacity} stars' },

  // Errors
  errCreateFamily: { zh: '目前無法建立家庭。{detail}請檢查網路後再試一次。', en: "Couldn't create a family right now.{detail} Check your connection and try again." },
  errCheckCode: { zh: '目前無法確認代碼。{detail}請檢查網路後再試一次。', en: "Couldn't check that code right now.{detail} Check your connection and try again." },
  errCodeNotFound: { zh: '找不到這個代碼，請再確認一次。', en: "We couldn't find that code. Double-check it and try again." },
  errAddKid: { zh: '目前無法新增。{detail}請檢查網路後再試一次。', en: "Couldn't add that right now.{detail} Check your connection and try again." },
  errLoadKids: { zh: '無法載入小孩的資料。{detail}請檢查網路後再試一次。', en: "Couldn't load your kids' profiles.{detail} Check your connection and try again." },
  errSaveAvatar: { zh: '目前無法儲存。{detail}請檢查網路後再試一次。', en: "Couldn't save that right now.{detail} Check your connection and try again." },
}

// A placeholder value can itself be bilingual ({ zh, en }) — an
// activity name dropped into a sentence should follow the language of
// the sentence around it.
function fill(template, vars, lang) {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    if (!(key in vars)) return match
    const value = vars[key]
    if (value && typeof value === 'object' && (lang in value)) return String(value[lang])
    return String(value)
  })
}

// Both languages as a plain string — for aria-labels, titles and
// anywhere markup can't go.
export function tBoth(key, vars) {
  const s = STRINGS[key]
  if (!s) return key
  return `${fill(s.zh, vars, 'zh')} / ${fill(s.en, vars, 'en')}`
}

export function tZh(key, vars) {
  const s = STRINGS[key]
  return s ? fill(s.zh, vars, 'zh') : key
}

export function tEn(key, vars) {
  const s = STRINGS[key]
  return s ? fill(s.en, vars, 'en') : key
}
