
const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

let mainWindow;

// Constants for sidebar dimensions
const SIDEBAR_COLLAPSED_WIDTH = 24;
const SIDEBAR_EXPANDED_WIDTH = 340;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 20, // Allow very narrow width
    frame: false,   
    hasShadow: false, 
    transparent: false, 
    skipTaskbar: false, // Keep visible in taskbar so user can find it
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false // sometimes needed for local file loading in dev, can remove for prod if strict
    },
  });

  // Determine start URL: Env var (Dev) or File (Prod)
  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist/index.html')}`;
  mainWindow.loadURL(startUrl);

  // Open DevTools in dev mode
  if (process.env.ELECTRON_START_URL) {
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- Window Management IPC ---

// Helper to get the display where the window currently resides
function getCurrentDisplay() {
  const { x, y, width, height } = mainWindow.getBounds();
  // Find the display nearest to the center of the window
  return screen.getDisplayNearestPoint({ x: x + width / 2, y: y + height / 2 });
}

ipcMain.on('minimize-app', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('close-app', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.on('set-mode', (event, mode) => {
  if (!mainWindow) return;

  const currentDisplay = getCurrentDisplay();
  const { width: workAreaW, height: workAreaH, x: workAreaX, y: workAreaY } = currentDisplay.workArea;

  if (mode === 'window') {
    // Restore normal window
    mainWindow.setMinimumSize(800, 600);
    mainWindow.setSize(1200, 800);
    mainWindow.center();
    mainWindow.setAlwaysOnTop(false);
    mainWindow.setResizable(true);
  } else {
    // Switch to Sidebar Mode (Right side of CURRENT display)
    mainWindow.setMinimumSize(SIDEBAR_COLLAPSED_WIDTH, 200); 
    mainWindow.setResizable(false); // Disable manual resizing in sidebar mode
    mainWindow.setAlwaysOnTop(true, 'floating'); // Keep on top
    
    // Initial State: Collapsed on the right
    const xPos = workAreaX + workAreaW - SIDEBAR_COLLAPSED_WIDTH;
    mainWindow.setBounds({ 
      x: xPos, 
      y: workAreaY, 
      width: SIDEBAR_COLLAPSED_WIDTH, 
      height: workAreaH 
    });
    mainWindow.show(); // Ensure visible
  }
});

ipcMain.on('expand-sidebar', () => {
  if (!mainWindow) return;
  const [currentW] = mainWindow.getSize();
  
  // If already expanded, do nothing
  if (currentW >= SIDEBAR_EXPANDED_WIDTH) return;

  const currentDisplay = getCurrentDisplay();
  const { width: workAreaW, height: workAreaH, x: workAreaX, y: workAreaY } = currentDisplay.workArea;

  // Calculate position to grow to the LEFT relative to current display
  // The right edge stays pinned to (workAreaX + workAreaW)
  const newX = workAreaX + workAreaW - SIDEBAR_EXPANDED_WIDTH;

  mainWindow.setBounds({
    x: newX,
    y: workAreaY,
    width: SIDEBAR_EXPANDED_WIDTH,
    height: workAreaH
  });
});

ipcMain.on('collapse-sidebar', () => {
  if (!mainWindow) return;
  const [currentW] = mainWindow.getSize();

  // If already collapsed, do nothing
  if (currentW <= SIDEBAR_COLLAPSED_WIDTH) return;

  const currentDisplay = getCurrentDisplay();
  const { width: workAreaW, height: workAreaH, x: workAreaX, y: workAreaY } = currentDisplay.workArea;

  // Calculate position to shrink to the RIGHT relative to current display
  const newX = workAreaX + workAreaW - SIDEBAR_COLLAPSED_WIDTH;

  mainWindow.setBounds({
    x: newX,
    y: workAreaY,
    width: SIDEBAR_COLLAPSED_WIDTH,
    height: workAreaH
  });
});
