import { useEffect, useState } from 'react'
import MainMenu from './components/MainMenu'
import StatusDashboard from './components/Dashboard/StatusDashboard'
import EnemySprite from './components/Enemy/EnemySprite'
import TicTacToeGame from './components/TicTacToe/TicTacToeGame'
import type { MatchOutcome, MatchRecord } from './types/game'
import { INITIAL_UPDATER_STATE, type UpdaterState } from './types/updater'

function App(): React.JSX.Element {
  const [view, setView] = useState<'menu' | 'game'>('menu')
  const [playerHealth, setPlayerHealth] = useState<number>(100)
  const [matchHistory, setMatchHistory] = useState<MatchRecord[]>([])
  const [appVersion, setAppVersion] = useState<string>('0.0.0')
  const [updaterState, setUpdaterState] = useState<UpdaterState>(INITIAL_UPDATER_STATE)

  useEffect(() => {
    let isMounted = true

    const loadUpdaterContext = async (): Promise<void> => {
      const [version, state] = await Promise.all([
        window.api.getAppVersion(),
        window.api.getUpdaterState()
      ])

      if (!isMounted) {
        return
      }

      setAppVersion(version)
      setUpdaterState(state)
    }

    loadUpdaterContext().catch((error) => {
      if (!isMounted) {
        return
      }

      setUpdaterState((current) => ({
        ...current,
        status: 'error',
        error: error == null ? 'Unknown update error.' : String(error),
        message: 'Failed to load updater state.'
      }))
    })

    const unsubscribe = window.api.onUpdaterStateChange((state) => {
      setUpdaterState(state)
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  const checkForUpdates = async (): Promise<void> => {
    try {
      await window.api.checkForUpdates()
    } catch (error) {
      setUpdaterState((current) => ({
        ...current,
        status: 'error',
        error: error == null ? 'Unknown update error.' : String(error),
        message: 'Manual update check failed.'
      }))
    }
  }

  const installDownloadedUpdate = (): void => {
    window.api.quitAndInstallUpdate()
  }

  const quitApp = (): void => {
    setPlayerHealth(100)
    setMatchHistory([])
    window.electron.ipcRenderer.send('app:quit')
  }

  const returnToMenu = (): void => {
    setPlayerHealth(100)
    setMatchHistory([])
    setView('menu')
  }

  const applyHealthChange = (outcome: MatchOutcome): void => {
    if (outcome === 'O') {
      setPlayerHealth((current) => Math.min(100, current + 5))
      return
    }

    if (outcome === 'X') {
      setPlayerHealth((current) => Math.max(0, current - 20))
      return
    }

    setPlayerHealth((current) => Math.max(0, current - 5))
  }

  const handleMatchEnd = (outcome: MatchOutcome): void => {
    applyHealthChange(outcome)

    const playedAt = new Date().toLocaleTimeString()
    setMatchHistory((current) => [{ id: current.length + 1, outcome, playedAt }, ...current])
  }

  if (view === 'menu') {
    return (
      <main className="menu-screen">
        <MainMenu
          onStart={() => {
            setView('game')
          }}
          onQuit={quitApp}
          appVersion={appVersion}
          updaterState={updaterState}
          onCheckForUpdates={checkForUpdates}
          onInstallUpdate={installDownloadedUpdate}
        />
      </main>
    )
  }

  return (
    <main className="app-shell">
      <StatusDashboard playerHealth={playerHealth} matchHistory={matchHistory} />

      <aside className="side-panel-stack" aria-label="Character panels">
        <EnemySprite playerHealth={playerHealth} />
      </aside>

      <section className="game-container">
        <TicTacToeGame
          onMatchEnd={handleMatchEnd}
          onBackToMenu={returnToMenu}
          onQuit={quitApp}
          appVersion={appVersion}
        />
      </section>
    </main>
  )
}

export default App
