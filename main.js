const { app, BrowserWindow, screen } = require('electron')
const { spawn } = require('child_process')
const path = require('path')

let pyProcess = null
let mainWindow = null

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  mainWindow = new BrowserWindow({
    minWidth: width * 0.5,
    minHeight: height,
    maximizable: true,
    fullscreenable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: false
    }
  })
  mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'))
  mainWindow.maximize();
  mainWindow.focus();
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