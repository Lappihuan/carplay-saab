import { app, shell, BrowserWindow, ipcMain, session, IpcMainEvent } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import * as fs from 'fs'
import { ExtraConfig, KeyBindings } from './Globals'
import icon from '../../resources/icon.png?asset'

let mainWindow: BrowserWindow | null = null
let config: ExtraConfig | null = null

const appPath: string = app.getPath('userData')
const configPath: string = join(appPath, 'config.json')

const DEFAULT_CONFIG: Partial<ExtraConfig> = {
  fps: 60,
  width: 1080,
  height: 1920,
  iBoxVersion: 2,
  mediaDelay: 100,
  phoneWorkMode: 0,
  kiosk: false,
  camera: '',
  microphone: '',
  piMost: false,
  canbus: false,
  bindings: {
    left: 'ArrowLeft',
    right: 'ArrowRight',
    selectDown: 'Space',
    back: 'Backspace',
    down: 'ArrowDown',
    home: 'KeyH',
    play: 'KeyP',
    pause: 'KeyO',
    next: 'KeyN',
    prev: 'KeyV'
  } as KeyBindings
}

const loadSettings = (): void => {
  try {
    if (!fs.existsSync(appPath)) {
      fs.mkdirSync(appPath, { recursive: true })
    }
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath).toString())
    } else {
      config = DEFAULT_CONFIG as ExtraConfig
      fs.writeFileSync(configPath, JSON.stringify(DEFAULT_CONFIG))
    }
  } catch (error) {
    console.error('Failed to load settings:', error)
    config = DEFAULT_CONFIG as ExtraConfig
  }
}

const saveSettings = (_: IpcMainEvent, updatedConfig: Partial<ExtraConfig>): void => {
  try {
    config = { ...config, ...updatedConfig } as ExtraConfig
    fs.writeFileSync(configPath, JSON.stringify(config))
    mainWindow?.webContents.send('settings-updated', config)
  } catch (error) {
    console.error('Failed to save settings:', error)
  }
}

const getSettings = (_: IpcMainEvent): void => {
  mainWindow?.webContents.send('settings', config)
}

function createWindow(): void {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 1080,
    height: 1920,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  mainWindow = win

  win.on('ready-to-show', () => {
    win.show()
  })

  win.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // USB Device Permission Handlers
  win.webContents.session.setPermissionCheckHandler(() => {
    return true
  })

  win.webContents.session.setDevicePermissionHandler((details) => {
    // Allow Carlinkit dongle (vendor ID 4884)
    if (details.device.vendorId === 4884) {
      return true
    }
    return false
  })

  // Auto-select Carlinkit USB device when requested
  win.webContents.session.on('select-usb-device', (event, details, callback) => {
    event.preventDefault()
    const selectedDevice = details.deviceList.find((device) => {
      return device.vendorId === 4884 && (device.productId === 5408 || device.productId === 5408)
    })
    callback(selectedDevice?.deviceId)
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    win.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'))
  }

  // Set CORS headers for WebUSB and SharedArrayBuffer support
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Cross-Origin-Opener-Policy': 'same-origin',
        'Cross-Origin-Embedder-Policy': 'require-corp'
      }
    })
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required')
app.commandLine.appendSwitch('disable-webusb-security', 'true')

app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Load settings before creating window
  loadSettings()

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC handlers for settings
  ipcMain.on('get-settings', getSettings)
  ipcMain.on('save-settings', saveSettings)
  ipcMain.on('quit', () => app.quit())

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
