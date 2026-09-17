import { useEffect, useRef, useState } from 'react'
import { THEMES, DEFAULT_THEME, THEME_STORAGE_KEY } from './themes'
import { errorDetail } from './errorMessage.js'
import { tBoth } from './i18n.js'
import { loadStoredFamilyCode, storeFamilyCode } from './family.js'
import { watchKids, addKid, updateKidAvatar } from './kids.js'
import { watchActivities } from './activities.js'
import FamilySetupScreen from './FamilySetupScreen.jsx'
import KidPickerScreen from './KidPickerScreen.jsx'
import FocusBoard from './FocusBoard.jsx'
import StarJarScreen from './StarJarScreen.jsx'
import StarLogScreen from './StarLogScreen.jsx'
import RewardsScreen from './RewardsScreen.jsx'
import GrownUpScreen from './GrownUpScreen.jsx'
import EditAvatarScreen from './EditAvatarScreen.jsx'
import ActivitiesScreen from './ActivitiesScreen.jsx'
import './App.css'

// Navigation and the family's data — nothing about any one timer.
//
// Stages: 'family-setup' (no family code yet) -> 'board' (every kid,
// each with their own timer) -> the star screens, which always belong
// to whichever kid was tapped. Each timer lives entirely inside its own
// FocusCard, which is what lets several run at once without touching
// each other.

function loadStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return THEMES.some(t => t.id === stored) ? stored : DEFAULT_THEME
  } catch {
    return DEFAULT_THEME
  }
}

export default function App() {
  const [familyCode, setFamilyCode] = useState(loadStoredFamilyCode)
  const [stage, setStage] = useState(() => (loadStoredFamilyCode() ? 'loading-kids' : 'family-setup'))
  const [kids, setKids] = useState([])
  const [kidsLoaded, setKidsLoaded] = useState(false)
  const [kidsError, setKidsError] = useState('')
  // The family's focus tasks, watched once here rather than per card.
  const [activities, setActivities] = useState([])
  const [colorTheme, setColorTheme] = useState(loadStoredTheme)
  // Whose star screens are open. Unrelated to who is focusing — every
  // kid on the board can be doing that at once.
  const [openKidId, setOpenKidId] = useState(null)
  // Unlocking the grown-up PIN covers the whole star area, so a parent
  // adding stars and then re-pricing a reward types it once. Going back
  // to the board — where the kids take the iPad again — re-locks it.
  const [grownUpUnlocked, setGrownUpUnlocked] = useState(false)

  const openKidIdRef = useRef(null)
  useEffect(() => { openKidIdRef.current = openKidId }, [openKidId])

  // Subscribe to this family's kid list once we have a code, and
  // auto-advance out of the loading state the first time data arrives.
  useEffect(() => {
    if (!familyCode) return undefined
    return watchKids(
      familyCode,
      list => {
        setKids(list)
        setKidsLoaded(true)
        setKidsError('')
        setStage(prev => (prev === 'loading-kids' ? 'board' : prev))
      },
      err => {
        console.error('Failed to load kid profiles:', err)
        setKidsLoaded(true)
        setKidsError(tBoth('errLoadKids', { detail: errorDetail(err) }))
        setStage(prev => (prev === 'loading-kids' ? 'board' : prev))
      },
    )
  }, [familyCode])

  useEffect(() => {
    if (!familyCode) return undefined
    return watchActivities(familyCode, setActivities, err =>
      console.error('Failed to load focus tasks:', err),
    )
  }, [familyCode])

  // Apply the chosen color theme to the whole page and remember it.
  useEffect(() => {
    document.documentElement.dataset.colorTheme = colorTheme
    try {
      localStorage.setItem(THEME_STORAGE_KEY, colorTheme)
    } catch {
      // Storage can be unavailable (private browsing); theme just won't persist.
    }
  }, [colorTheme])

  function handleFamilyReady(code) {
    storeFamilyCode(code)
    setFamilyCode(code)
    setStage('loading-kids')
  }

  function backToBoard() {
    setGrownUpUnlocked(false)
    setStage('board')
  }

  function openKid(kidId, where) {
    setOpenKidId(kidId)
    setStage(where)
  }

  async function handleAddKid({ name, avatar }) {
    await addKid(familyCode, { name, avatar })
    setStage('board')
  }

  async function handleUpdateAvatar(avatar) {
    await updateKidAvatar(familyCode, openKidIdRef.current, avatar)
  }

  const starKid = kids.find(k => k.id === openKidId) ?? null

  if (stage === 'family-setup') {
    return (
      <div className="app">
        <FamilySetupScreen onFamilyReady={handleFamilyReady} />
      </div>
    )
  }

  if (stage === 'add-kid') {
    return (
      <div className="app">
        <KidPickerScreen
          kids={kids}
          kidsLoaded={kidsLoaded}
          loadError={kidsError}
          addOnly
          onSelectKid={() => setStage('board')}
          onAddKid={handleAddKid}
          onBack={() => setStage('board')}
        />
      </div>
    )
  }

  // Every star screen belongs to one kid; without one there's nothing
  // to show, so fall back to the board rather than rendering blank.
  if (starKid && stage !== 'board' && stage !== 'loading-kids') {
    if (stage === 'starjar') {
      return (
        <div className="app">
          <StarJarScreen
            kid={starKid}
            onBack={backToBoard}
            onViewLog={() => setStage('starlog')}
            onViewRewards={() => setStage('rewards')}
            onGrownUp={() => setStage('grownup')}
          />
        </div>
      )
    }

    if (stage === 'starlog') {
      return (
        <div className="app">
          <StarLogScreen familyCode={familyCode} kid={starKid} onBack={() => setStage('starjar')} />
        </div>
      )
    }

    if (stage === 'grownup') {
      return (
        <div className="app">
          <GrownUpScreen
            familyCode={familyCode}
            kid={starKid}
            unlocked={grownUpUnlocked}
            onUnlock={() => setGrownUpUnlocked(true)}
            onBack={() => setStage('starjar')}
            onManageActivities={() => setStage('activities')}
          />
        </div>
      )
    }

    if (stage === 'activities') {
      return (
        <div className="app">
          <ActivitiesScreen familyCode={familyCode} onBack={() => setStage('grownup')} />
        </div>
      )
    }

    if (stage === 'rewards') {
      return (
        <div className="app">
          <RewardsScreen
            familyCode={familyCode}
            kid={starKid}
            unlocked={grownUpUnlocked}
            onUnlock={() => setGrownUpUnlocked(true)}
            onBack={() => setStage('starjar')}
          />
        </div>
      )
    }

    if (stage === 'edit-avatar') {
      return (
        <div className="app">
          <EditAvatarScreen kid={starKid} onSave={handleUpdateAvatar} onBack={backToBoard} />
        </div>
      )
    }
  }

  return (
    <div className="app app-board">
      <FocusBoard
        familyCode={familyCode}
        kids={kids}
        activities={activities}
        kidsLoaded={kidsLoaded}
        loadError={kidsError}
        colorTheme={colorTheme}
        onColorThemeChange={setColorTheme}
        onViewStarJar={kidId => openKid(kidId, 'starjar')}
        onEditAvatar={kidId => openKid(kidId, 'edit-avatar')}
        onAddKid={() => setStage('add-kid')}
      />
    </div>
  )
}
