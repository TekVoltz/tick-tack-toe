type EnemySpriteProps = {
  playerHealth: number
}

function EnemySprite({ playerHealth }: EnemySpriteProps): React.JSX.Element {
  const mood = playerHealth >= 70 ? 'calm' : playerHealth >= 40 ? 'alert' : 'aggressive'

  return (
    <section className="enemy-panel" aria-label="Enemy status">
      <h2 className="panel-title">Enemy</h2>
      <div className={`enemy-sprite ${mood}`} aria-live="polite" aria-label={`Enemy mood ${mood}`}>
        <span className="enemy-eye left" />
        <span className="enemy-eye right" />
        <span className="enemy-mouth" />
      </div>
      <p className="enemy-caption">Mood: {mood}</p>
    </section>
  )
}

export default EnemySprite
