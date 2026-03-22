type GameControlsProps = {
  onReset: () => void
  onBackToMenu: () => void
  onQuit: () => void
}

function GameControls({ onReset, onBackToMenu, onQuit }: GameControlsProps): React.JSX.Element {
  return (
    <div className="actions-row">
      <button className="btn primary" onClick={onReset} type="button">
        Reset
      </button>
      <button className="btn" onClick={onBackToMenu} type="button">
        Main Menu
      </button>
      <button className="btn" onClick={onQuit} type="button">
        Quit
      </button>
    </div>
  )
}

export default GameControls
