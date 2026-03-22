import type { MatchRecord } from '../../types/game'
import DateTimeDisplay from './DateTimeDisplay'
import HealthChart from './HealthChart'

type StatusDashboardProps = {
  playerHealth: number
  matchHistory: MatchRecord[]
}

function StatusDashboard({ playerHealth, matchHistory }: StatusDashboardProps): React.JSX.Element {
  const wins = matchHistory.filter((match) => match.outcome === 'O').length
  const losses = matchHistory.filter((match) => match.outcome === 'X').length
  const draws = matchHistory.filter((match) => match.outcome === 'draw').length
  const latestMatch = matchHistory[0]

  return (
    <section className="dashboard-panel" aria-label="Status dashboard">
      <h2 className="panel-title">Status Dashboard</h2>
      <DateTimeDisplay />
      <HealthChart playerHealth={playerHealth} />

      <div className="stats-grid">
        <article className="stat-card">
          <h3>Health</h3>
          <p>{playerHealth}%</p>
        </article>
        <article className="stat-card">
          <h3>Matches</h3>
          <p>{matchHistory.length}</p>
        </article>
        <article className="stat-card">
          <h3>Record</h3>
          <p>
            {wins}W / {losses}L / {draws}D
          </p>
        </article>
      </div>

      <p className="latest-match">
        Last result: {latestMatch ? `${latestMatch.outcome.toUpperCase()} at ${latestMatch.playedAt}` : 'No games yet'}
      </p>
    </section>
  )
}

export default StatusDashboard
