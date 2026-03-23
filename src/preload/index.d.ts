import { ElectronAPI } from '@electron-toolkit/preload'

type UpdaterStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'not-available'
  | 'downloading'
  | 'downloaded'
  | 'error'

type UpdaterState = {
  status: UpdaterStatus
  currentVersion: string
  availableVersion: string | null
  downloadedVersion: string | null
  progressPercent: number | null
  message: string
  lastCheckedAt: number | null
  error: string | null
}

type AppApi = {
  savePlayerPortrait: (imageBase64: string) => Promise<{ url: string }>
  loadPlayerPortrait: () => Promise<{ url: string | null }>
  clearPlayerPortrait: () => Promise<{ success: boolean }>
  getAppVersion: () => Promise<string>
  getUpdaterState: () => Promise<UpdaterState>
  checkForUpdates: () => Promise<{ started: boolean }>
  quitAndInstallUpdate: () => void
  onUpdaterStateChange: (callback: (state: UpdaterState) => void) => () => void
}

declare global {
  interface Window {
    electron: ElectronAPI
    api: AppApi
  }
}
