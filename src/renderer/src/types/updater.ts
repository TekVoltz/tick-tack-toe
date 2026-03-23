export type UpdaterStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error'

export type UpdaterState = {
  status: UpdaterStatus
  currentVersion: string
  availableVersion: string | null
  downloadedVersion: string | null
  progressPercent: number | null
  message: string
  lastCheckedAt: number | null
  error: string | null
}

export const INITIAL_UPDATER_STATE: UpdaterState = {
  status: 'idle',
  currentVersion: '0.0.0',
  availableVersion: null,
  downloadedVersion: null,
  progressPercent: null,
  message: 'Checking updater status...',
  lastCheckedAt: null,
  error: null
}
