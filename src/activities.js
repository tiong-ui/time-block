export const ACTIVITIES = [
  { id: "sleep",     label: "Sleep",     emoji: "😴", color: "#7C83FD" },
  { id: "breakfast", label: "Breakfast", emoji: "🥞", color: "#FFA552" },
  { id: "school",    label: "School",    emoji: "🎒", color: "#52B3FF" },
  { id: "lunch",     label: "Lunch",     emoji: "🍱", color: "#FF7B7B" },
  { id: "play",      label: "Play",      emoji: "🎮", color: "#FFD166" },
  { id: "reading",   label: "Reading",   emoji: "📚", color: "#06D6A0" },
  { id: "sport",     label: "Sport",     emoji: "⚽", color: "#F72585" },
  { id: "art",       label: "Art",       emoji: "🎨", color: "#A855F7" },
  { id: "dinner",    label: "Dinner",    emoji: "🍽️", color: "#FF9A3C" },
  { id: "bath",      label: "Bath",      emoji: "🛁", color: "#4CC9F0" },
  { id: "tv",        label: "TV",        emoji: "📺", color: "#B5838D" },
  { id: "free",      label: "Free Time", emoji: "⭐", color: "#C9F299" },
];

export const ACTIVITY_MAP = Object.fromEntries(ACTIVITIES.map(a => [a.id, a]));

export const START_HOUR = 6;  // 6 AM
export const END_HOUR   = 22; // 10 PM
export const TOTAL_SLOTS = END_HOUR - START_HOUR; // 16 slots
