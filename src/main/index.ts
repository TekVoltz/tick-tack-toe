import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { promises as fs } from 'node:fs'
import { join } from 'path'
import { pathToFileURL } from 'node:url'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { autoUpdater } from 'electron-updater'
import icon from '../../resources/iconT.png?asset'

const PLAYER_PORTRAIT_FILE = 'player-portrait.png'

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

const CHECK_INTERVAL_MS = 1000 * 60 * 60

let updateCheckInterval: NodeJS.Timeout | null = null

let updaterState: UpdaterState = {
  status: 'idle',
  currentVersion: app.getVersion(),
  availableVersion: null,
  downloadedVersion: null,
  progressPercent: null,
  message: 'Updates are idle.',
  lastCheckedAt: null,
  error: null
}

function emitUpdaterState(): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send('updater:state-changed', updaterState)
  }
}

function updateUpdaterState(partial: Partial<UpdaterState>): void {
  updaterState = {
    ...updaterState,
    ...partial,
    currentVersion: app.getVersion()
  }

  emitUpdaterState()
}

function configureAutoUpdater(): void {
  if (!app.isPackaged) {
    updateUpdaterState({
      status: 'idle',
      message: 'Auto-update checks are enabled in packaged builds.',
      error: null
    })
    return
  }

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => {
    updateUpdaterState({
      status: 'checking',
      message: 'Checking for updates...',
      lastCheckedAt: Date.now(),
      progressPercent: null,
      error: null
    })
  })

  autoUpdater.on('update-available', (info) => {
    updateUpdaterState({
      status: 'available',
      availableVersion: info.version,
      downloadedVersion: null,
      message: `Update v${info.version} is available. Downloading now...`,
      progressPercent: 0,
      error: null
    })
  })

  autoUpdater.on('update-not-available', () => {
    updateUpdaterState({
      status: 'not-available',
      availableVersion: null,
      downloadedVersion: null,
      progressPercent: null,
      message: 'You are on the latest version.',
      error: null
    })
  })

  autoUpdater.on('download-progress', (progress) => {
    updateUpdaterState({
      status: 'downloading',
      progressPercent: progress.percent,
      message: `Downloading update... ${Math.round(progress.percent)}%`
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    updateUpdaterState({
      status: 'downloaded',
      availableVersion: info.version,
      downloadedVersion: info.version,
      progressPercent: 100,
      message: `Update v${info.version} is ready. Restart to install.`,
      error: null
    })
  })

  autoUpdater.on('error', (error) => {
    updateUpdaterState({
      status: 'error',
      message: 'Update check failed.',
      error: error == null ? 'Unknown update error.' : String(error),
      progressPercent: null
    })
  })

  autoUpdater.checkForUpdates().catch((error) => {
    updateUpdaterState({
      status: 'error',
      message: 'Unable to start update check.',
      error: error == null ? 'Unknown update error.' : String(error)
    })
  })

  updateCheckInterval = setInterval(() => {
    autoUpdater.checkForUpdates().catch((error) => {
      updateUpdaterState({
        status: 'error',
        message: 'Scheduled update check failed.',
        error: error == null ? 'Unknown update error.' : String(error)
      })
    })
  }, CHECK_INTERVAL_MS)
}

function getPortraitFilePath(): string {
  return join(app.getPath('userData'), 'portraits', PLAYER_PORTRAIT_FILE)
}

function toFileUrl(filePath: string): string {
  return `${pathToFileURL(filePath).toString()}?t=${Date.now()}`
}

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    icon: icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))
  ipcMain.on('app:quit', () => app.quit())
  ipcMain.on('updater:quit-and-install', () => {
    if (updaterState.status === 'downloaded') {
      autoUpdater.quitAndInstall()
    }
  })

  ipcMain.handle('app:get-version', () => {
    return app.getVersion()
  })

  ipcMain.handle('updater:get-state', () => {
    return updaterState
  })

  ipcMain.handle('updater:check-for-updates', async () => {
    if (!app.isPackaged) {
      updateUpdaterState({
        status: 'idle',
        message: 'Auto-update checks are enabled in packaged builds.',
        error: null
      })

      return { started: false }
    }

    await autoUpdater.checkForUpdates()
    return { started: true }
  })

  ipcMain.handle('portrait:save', async (_event, payload: { imageBase64: string }) => {
    const directoryPath = join(app.getPath('userData'), 'portraits')
    const filePath = getPortraitFilePath()

    await fs.mkdir(directoryPath, { recursive: true })
    await fs.writeFile(filePath, Buffer.from(payload.imageBase64, 'base64'))

    return { url: toFileUrl(filePath) }
  })

  ipcMain.handle('portrait:load', async () => {
    const filePath = getPortraitFilePath()

    try {
      await fs.access(filePath)
      return { url: toFileUrl(filePath) }
    } catch {
      return { url: null }
    }
  })

  ipcMain.handle('portrait:clear', async () => {
    const filePath = getPortraitFilePath()

    try {
      await fs.unlink(filePath)
    } catch {
      // Ignore when no custom portrait file exists.
    }

    return { success: true }
  })

  createWindow()
  configureAutoUpdater()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (updateCheckInterval !== null) {
    clearInterval(updateCheckInterval)
    updateCheckInterval = null
  }

  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
