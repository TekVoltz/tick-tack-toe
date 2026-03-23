import { useMemo, useState } from 'react'
import type { UpdaterState } from '../types/updater'

type MainMenuProps = {
  onStart: () => void
  onQuit: () => void
  appVersion: string
  updaterState: UpdaterState
  onCheckForUpdates: () => Promise<void>
  onInstallUpdate: () => void
}

function MainMenu({
  onStart,
  onQuit,
  appVersion,
  updaterState,
  onCheckForUpdates,
  onInstallUpdate
}: MainMenuProps): React.JSX.Element {
  const [isUpdatePanelOpen, setIsUpdatePanelOpen] = useState<boolean>(false)

  const hasUpdateAlert = useMemo(() => {
    return (
      updaterState.status === 'available' ||
      updaterState.status === 'downloading' ||
      updaterState.status === 'downloaded'
    )
  }, [updaterState.status])

  const updateActionLabel = useMemo(() => {
    if (updaterState.status === 'downloaded') {
      return 'Restart and Install'
    }

    return 'Check for Updates'
  }, [updaterState.status])

  const handleUpdateAction = async (): Promise<void> => {
    if (updaterState.status === 'downloaded') {
      onInstallUpdate()
      return
    }

    await onCheckForUpdates()
  }

  return (
    <section className="menu-card" aria-label="Main menu">
      <div className="menu-header">
        <h1 className="title">Tick Tack Toe</h1>
        <button
          className={`update-bell ${hasUpdateAlert ? 'has-alert' : ''}`}
          type="button"
          aria-label="Updater notifications"
          onClick={() => {
            setIsUpdatePanelOpen((current) => !current)
          }}
        >
          <span aria-hidden="true">🔔</span>
          {hasUpdateAlert && <span className="bell-dot" aria-hidden="true" />}
        </button>
      </div>

      {isUpdatePanelOpen && (
        <section className="update-panel" aria-label="Updater status">
          <p className="update-status">{updaterState.message}</p>
          {updaterState.error && <p className="update-error">{updaterState.error}</p>}
          {updaterState.progressPercent !== null && updaterState.status === 'downloading' && (
            <p className="update-progress">Progress: {Math.round(updaterState.progressPercent)}%</p>
          )}
          <button className="btn" type="button" onClick={handleUpdateAction}>
            {updateActionLabel}
          </button>
        </section>
      )}

      <p className="subtitle">Win rounds to pressure the enemy and protect your health.</p>
      <div className="menu-actions">
        <button className="btn primary" onClick={onStart} type="button">
          Play
        </button>
        <button className="btn" onClick={onQuit} type="button">
          Quit
        </button>
      </div>
      <p className="version-indicator version-menu">v{appVersion}</p>
    </section>
  )
}

export default MainMenu
