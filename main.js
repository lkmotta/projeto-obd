const { app, BrowserWindow } = require('electron')
const { spawn } = require('child_process')
const path = require('path')

let pyProcess = null
let mainWindow = null

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200, height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: true,
      webSecurity: false
    }
  })
  mainWindow.loadFile('index.html')
  mainWindow.webContents.openDevTools() // pra debug
}

app.whenReady().then(() => {
  console.log('Iniciando backend Python...')
  pyProcess = spawn('python', ['backend/backend.py'], {
    stdio: 'pipe',
    cwd: __dirname
  })

  pyProcess.stdout.on('data', (data) => console.log(`[Python]: ${data}`))
  pyProcess.stderr.on('data', (data) => console.error(`[Python err]: ${data}`))

  setTimeout(createWindow, 2000) // espera Python subir
})

app.on('window-all-closed', () => {
  if (pyProcess) pyProcess.kill()
  app.quit()
})