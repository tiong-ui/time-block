// Color themes kids can pick from. Each id maps to a CSS block in App.css
// (see `[data-color-theme="..."]`) — this list only drives the picker UI.
export const THEMES = [
  { id: 'indigo', name: 'Indigo', swatch: '#7C83FD' },
  { id: 'ocean', name: 'Ocean', swatch: '#22B8C8' },
  { id: 'berry', name: 'Berry', swatch: '#E0559F' },
  { id: 'forest', name: 'Forest', swatch: '#3FAE68' },
  { id: 'sunset', name: 'Sunset', swatch: '#FF8A3D' },
]

export const DEFAULT_THEME = 'indigo'
export const THEME_STORAGE_KEY = 'focus-timer-color-theme'
