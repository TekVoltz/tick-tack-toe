import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

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

// Custom APIs for renderer
const api = {
  savePlayerPortrait: async (imageBase64: string): Promise<{ url: string }> => {
    return await electronAPI.ipcRenderer.invoke('portrait:save', { imageBase64 })
  },
  loadPlayerPortrait: async (): Promise<{ url: string | null }> => {
    return await electronAPI.ipcRenderer.invoke('portrait:load')
  },
  clearPlayerPortrait: async (): Promise<{ success: boolean }> => {
    return await electronAPI.ipcRenderer.invoke('portrait:clear')
  },
  getAppVersion: async (): Promise<string> => {
    return await electronAPI.ipcRenderer.invoke('app:get-version')
  },
  getUpdaterState: async (): Promise<UpdaterState> => {
    return await electronAPI.ipcRenderer.invoke('updater:get-state')
  },
  checkForUpdates: async (): Promise<{ started: boolean }> => {
    return await electronAPI.ipcRenderer.invoke('updater:check-for-updates')
  },
  quitAndInstallUpdate: (): void => {
    electronAPI.ipcRenderer.send('updater:quit-and-install')
  },
  onUpdaterStateChange: (callback: (state: UpdaterState) => void): (() => void) => {
    const listener = (_event: unknown, state: UpdaterState): void => {
      callback(state)
    }

    electronAPI.ipcRenderer.on('updater:state-changed', listener)

    return () => {
      electronAPI.ipcRenderer.removeListener('updater:state-changed', listener)
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
