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
  turnOffAlarm: { zh: '🔔 關掉鈴聲', en: '🔔 Turn Off the Alarm' },
  startAgain: { zh: '再來一次', en: 'Start Again' },
  addMyStars: { zh: '⭐ 把我的 {count} 顆星星放進去！', en: '⭐ Add my {count} stars!' },

  // Star Jar
  starJar: { zh: '星星罐', en: 'Star Jar' },
  starJarTitle: { zh: '{name}的星星罐', en: "{name}'s Star Jar" },
  totalStars: { zh: '總共賺到', en: 'Earned ever' },
  fullJars: { zh: '集滿的罐子', en: 'Full Jars' },
  starsInThisJar: { zh: '這罐有 {count}/{capacity} 顆星星', en: '{count}/{capacity} stars in this jar' },
  tapToShake: { zh: '👆 點一下罐子搖一搖', en: 'Tap the jar to shake it' },
  jarFull: { zh: '🎉 第 {number} 罐集滿了！', en: '🎉 Jar #{number} full!' },

  // Star Log
  starLog: { zh: '星星紀錄', en: 'Star Log' },
  starLogTitle: { zh: '{name}的星星紀錄', en: "{name}'s Star Log" },
  today: { zh: '今天', en: 'Today' },
  yesterday: { zh: '昨天', en: 'Yesterday' },
  daysAgo: { zh: '{count} 天前', en: '{count} days ago' },
  justFocus: { zh: '專心時間', en: 'Focus time' },
  noLogYet: { zh: '還沒有紀錄，去專心一下吧！', en: "Nothing here yet — go and focus!" },
  earnedSoFar: { zh: '賺到', en: 'Earned' },
  spentSoFar: { zh: '用掉', en: 'Spent' },

  // Used only to ask the browser for an English month name.
  localeEn: { zh: 'en', en: 'en' },
  viewList: { zh: '清單', en: 'List' },
  viewCalendar: { zh: '月曆', en: 'Calendar' },
  monthLabel: { zh: '{year} 年 {month} 月', en: '{monthName} {year}' },
  prevMonth: { zh: '上個月', en: 'Previous month' },
  nextMonth: { zh: '下個月', en: 'Next month' },
  noStarsThisMonth: { zh: '這個月還沒有星星', en: 'No stars this month yet' },
  starsOnDay: { zh: '{month}/{day} 得到 {count} 顆', en: '{count} stars on {month}/{day}' },
  sun: { zh: '日', en: 'Su' },
  mon: { zh: '一', en: 'Mo' },
  tue: { zh: '二', en: 'Tu' },
  wed: { zh: '三', en: 'We' },
  thu: { zh: '四', en: 'Th' },
  fri: { zh: '五', en: 'Fr' },
  sat: { zh: '六', en: 'Sa' },

  // Rewards
  rewards: { zh: '兌換獎勵', en: 'Rewards' },
  rewardsTitle: { zh: '{name}的獎勵', en: "{name}'s Rewards" },
  youHaveStars: { zh: '你有 {count} 顆星星可以用', en: 'You have {count} stars to spend' },
  redeem: { zh: '兌換', en: 'Redeem' },
  costStars: { zh: '{count} 顆星星', en: '{count} stars' },
  needMoreStars: { zh: '還差 {count} 顆', en: '{count} to go' },
  confirmRedeemTitle: { zh: '要換這個嗎？', en: 'Trade for this?' },
  confirmRedeemBody: { zh: '這會用掉 {cost} 顆星星，剩下 {left} 顆。', en: 'That spends {cost} stars, leaving {left}.' },
  askGrownUp: { zh: '記得先問問大人喔！', en: 'Check with a grown-up first!' },
  yesRedeem: { zh: '好，換！', en: 'Yes, trade!' },
  cancel: { zh: '再想想', en: 'Not yet' },
  cancelAdd: { zh: '取消', en: 'Cancel' },
  redeemed: { zh: '換到了！', en: 'Redeemed!' },
  redeemFailed: { zh: '兌換失敗，請再試一次。', en: "That didn't go through — please try again." },
  addReward: { zh: '＋ 新增獎勵', en: '+ Add a reward' },
  newReward: { zh: '新的獎勵', en: 'A new reward' },
  rewardNamePlaceholder: { zh: '獎勵名稱', en: 'Reward name' },
  rewardCostPlaceholder: { zh: '幾顆星星', en: 'Stars' },
  saveReward: { zh: '加進去', en: 'Add it' },
  removeReward: { zh: '刪掉{reward}', en: 'Remove {reward}' },
  noRewardsYet: { zh: '還沒有獎勵，新增一個吧！', en: 'No rewards yet — add one!' },
  rewardNameNeeded: { zh: '幫獎勵取個名字', en: 'Give the reward a name' },
  rewardCostNeeded: { zh: '星星數要是大於 0 的整數', en: 'Star cost must be a whole number above 0' },
  spendable: { zh: '可以用', en: 'To spend' },

  // Grown-up area
  grownUp: { zh: '大人專區', en: 'Grown-ups' },
  grownUpTitle: { zh: '幫{name}加星星', en: 'Add stars for {name}' },
  enterPin: { zh: '輸入大人密碼', en: 'Enter the grown-up PIN' },
  setPinTitle: { zh: '設定大人密碼', en: 'Set a grown-up PIN' },
  setPinWhy: { zh: '設一組 4 位數密碼，只有大人可以手動加星星。', en: 'Pick a 4-digit PIN so only a grown-up can add stars by hand.' },
  pinPlaceholder: { zh: '4 位數密碼', en: '4-digit PIN' },
  pinAgainPlaceholder: { zh: '再輸入一次', en: 'Type it again' },
  savePin: { zh: '設定密碼', en: 'Save PIN' },
  unlock: { zh: '解鎖', en: 'Unlock' },
  pinWrong: { zh: '密碼不對，還可以試 {count} 次', en: 'Wrong PIN — {count} tries left' },
  pinLocked: { zh: '試太多次了，請等 {count} 秒', en: 'Too many tries — wait {count}s' },
  pinNeedsFourDigits: { zh: '密碼要是 4 個數字', en: 'The PIN must be 4 digits' },
  pinMismatch: { zh: '兩次輸入不一樣', en: "Those two didn't match" },
  pinForgot: { zh: '忘記密碼了？在 Firebase 主控台刪掉家庭資料裡的 pinHash 就能重設。', en: 'Forgotten it? Delete pinHash on the family document in the Firebase console to reset.' },
  changePin: { zh: '換一組密碼', en: 'Change the PIN' },
  pinSaved: { zh: '密碼設好了', en: 'PIN saved' },

  // Manual stars
  howManyStars: { zh: '要加幾顆星星？', en: 'How many stars?' },
  awardNotePlaceholder: { zh: '為了什麼？', en: 'What for?' },
  giveStars: { zh: '給 {count} 顆星星', en: 'Give {count} stars' },
  starsGiven: { zh: '加好了！{name}現在有 {count} 顆可以用', en: 'Done! {name} now has {count} to spend' },
  manualStar: { zh: '大人加的星星', en: 'Added by a grown-up' },
  awardAmountInvalid: { zh: '要是 1 到 100 之間的整數', en: 'Must be a whole number from 1 to 100' },
  errSavePin: { zh: '密碼存不起來{detail}，請再試一次。', en: "Couldn't save the PIN{detail}. Please try again." },
  errGiveStars: { zh: '星星沒加成功{detail}，請再試一次。', en: "Couldn't add those stars{detail}. Please try again." },

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
  errSaveStars: { zh: '星星沒存起來{detail}，請檢查網路。下次連上線再完成一次就會補上。', en: "Those stars didn't save{detail}. Check your connection — finish another session once you're online." },
  errLogEntry: { zh: '星星有記到，但紀錄沒寫進去{detail}。請確認 Firestore 規則有涵蓋 ledger。', en: "The stars counted, but the log entry didn't save{detail}. Check that your Firestore rules cover the ledger." },
  errLoadLog: { zh: '讀不到星星紀錄{detail}，請檢查網路。', en: "Couldn't load the star log{detail}. Check your connection." },
  errLoadRewards: { zh: '讀不到獎勵清單{detail}，請檢查網路。', en: "Couldn't load the rewards{detail}. Check your connection." },
  errRedeem: { zh: '兌換沒有成功{detail}，請再試一次。', en: "That trade didn't go through{detail}. Please try again." },
  errAddReward: { zh: '新增獎勵失敗{detail}，請再試一次。', en: "Couldn't add that reward{detail}. Please try again." },
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
