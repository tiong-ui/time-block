// What kids can tag a focus session with. Optional — the timer works
// fine with none selected. Labels carry both languages so they can be
// shown together, and dropped into bilingual sentences.
export const ACTIVITIES = [
  { id: 'homework', label: { zh: '作業', en: 'Homework' }, emoji: '📝' },
  { id: 'reading', label: { zh: '閱讀', en: 'Reading' }, emoji: '📚' },
  { id: 'piano', label: { zh: '鋼琴', en: 'Piano' }, emoji: '🎹' },
  { id: 'drawing', label: { zh: '畫畫', en: 'Drawing' }, emoji: '🎨' },
  { id: 'tidy', label: { zh: '整理房間', en: 'Tidy Up' }, emoji: '🧹' },
  { id: 'mealtime', label: { zh: '吃飯', en: 'Mealtime' }, emoji: '🍽️' },
  { id: 'quietplay', label: { zh: '安靜玩', en: 'Quiet Play' }, emoji: '🧩' },
]

export const ACTIVITY_STORAGE_KEY = 'focus-timer-last-activity'
