type MainMenuProps = {
  onStart: () => void
  onQuit: () => void
}

function MainMenu({ onStart, onQuit }: MainMenuProps): React.JSX.Element {
  return (
    <section className="menu-card" aria-label="Main menu">
      <h1 className="title">Tick Tack Toe</h1>
      <p className="subtitle">Win rounds to pressure the enemy and protect your health.</p>
      <div className="menu-actions">
        <button className="btn primary" onClick={onStart} type="button">
          Play
        </button>
        <button className="btn" onClick={onQuit} type="button">
          Exit
        </button>
      </div>
    </section>
  )
}

export default MainMenu
