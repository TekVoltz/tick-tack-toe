import { useState } from 'react'
import MainMenu from './components/MainMenu'
import StatusDashboard from './components/Dashboard/StatusDashboard'
import EnemySprite from './components/Enemy/EnemySprite'
import TicTacToeGame from './components/TicTacToe/TicTacToeGame'
import type { MatchOutcome, MatchRecord } from './types/game'

function App(): React.JSX.Element {
  const [view, setView] = useState<'menu' | 'game'>('menu')
  const [playerHealth, setPlayerHealth] = useState<number>(100)
  const [matchHistory, setMatchHistory] = useState<MatchRecord[]>([])

  const quitApp = (): void => {
    window.electron.ipcRenderer.send('app:quit')
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

  return (
    <main className="app-shell">
      <StatusDashboard playerHealth={playerHealth} matchHistory={matchHistory} />

      <EnemySprite playerHealth={playerHealth} />

      <section className="game-container">
        {view === 'menu' ? (
          <MainMenu
            onStart={() => {
              setView('game')
            }}
            onQuit={quitApp}
          />
        ) : (
          <TicTacToeGame
            onMatchEnd={handleMatchEnd}
            onBackToMenu={() => {
              setView('menu')
            }}
            onQuit={quitApp}
          />
        )}
      </section>
    </main>
  )
}

export default App
