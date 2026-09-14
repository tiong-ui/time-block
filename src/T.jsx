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
