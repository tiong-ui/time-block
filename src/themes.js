// Color themes kids can pick from. Each id maps to a CSS block in App.css
// (see `[data-color-theme="..."]`) — this list only drives the picker UI.
export const THEMES = [
  { id: 'indigo', name: { zh: '靛藍', en: 'Indigo' }, swatch: '#7C83FD' },
  { id: 'ocean', name: { zh: '海洋', en: 'Ocean' }, swatch: '#22B8C8' },
  { id: 'berry', name: { zh: '莓果', en: 'Berry' }, swatch: '#E0559F' },
  { id: 'forest', name: { zh: '森林', en: 'Forest' }, swatch: '#3FAE68' },
  { id: 'sunset', name: { zh: '夕陽', en: 'Sunset' }, swatch: '#FF8A3D' },
]

export const DEFAULT_THEME = 'indigo'
export const THEME_STORAGE_KEY = 'focus-timer-color-theme'
