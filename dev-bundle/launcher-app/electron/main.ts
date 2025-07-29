import { app, BrowserWindow, ipcMain, shell } from 'electron'
import path from 'path'
import { spawn } from 'child_process'
import Store from 'electron-store'

const store = new Store()
let mainWindow: BrowserWindow | null = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: 'hiddenInset',
    icon: path.join(__dirname, '../assets/icon.png'),
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// IPC Handlers
ipcMain.handle('get-projects', async () => {
  return store.get('projects', [])
})

ipcMain.handle('save-project', async (_, project) => {
  const projects = store.get('projects', []) as any[]
  projects.push(project)
  store.set('projects', projects)
  return { success: true }
})

ipcMain.handle('run-command', async (_, command: string, args: string[], cwd?: string) => {
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, {
      cwd,
      shell: true,
      env: { ...process.env },
    })

    let output = ''
    let error = ''

    process.stdout.on('data', (data) => {
      output += data.toString()
    })

    process.stderr.on('data', (data) => {
      error += data.toString()
    })

    process.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, output })
      } else {
        reject({ success: false, error, code })
      }
    })
  })
})

ipcMain.handle('open-in-vscode', async (_, path: string) => {
  shell.openExternal(`vscode://file/${path}`)
})

ipcMain.handle('open-in-browser', async (_, url: string) => {
  shell.openExternal(url)
})

ipcMain.handle('select-directory', async () => {
  const { dialog } = require('electron')
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory']
  })
  return result.filePaths[0]
})