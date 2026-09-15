import { STRINGS, tZh, tEn } from './i18n.js'

// Renders both languages stacked: Chinese on top, English beneath in a
// smaller, softer style (sized in `em` so it scales with whatever it
// sits inside — a heading, a button, a caption).
export function T({ k, vars }) {
  if (!STRINGS[k]) return k
  return (
    <>
      <span className="t-zh" lang="zh-Hant">{tZh(k, vars)}</span>
      <span className="t-en" lang="en">{tEn(k, vars)}</span>
    </>
  )
}

// A label that may or may not be bilingual: the rewards shipped with
// the app carry both languages, while one a family typed in is in
// whichever language they typed it, and should be shown exactly as
// written rather than stacked against a blank.
export function Label({ value }) {
  if (value && typeof value === 'object') {
    return (
      <>
        <span className="t-zh" lang="zh-Hant">{value.zh}</span>
        <span className="t-en" lang="en">{value.en}</span>
      </>
    )
  }
  return <span className="t-solo">{value}</span>
}
