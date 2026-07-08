const { app, BrowserWindow, ipcMain, Tray, Menu, screen, nativeImage } = require('electron');
const path = require('path');
const fs = require('fs');

// Set application name for Linux desktop integration
app.name = 'Touch Grass';

// --- Configuration Persistence ---
const configPath = path.join(app.getPath('userData'), 'config.json');

const defaultSettings = {
  workDuration: 25 * 60, // 25 minutes
  breakDuration: 5 * 60,  // 5 minutes
  soundEnabled: true,
  zenModeEnabled: false,
  isPomodoro: true
};

let settings = { ...defaultSettings };

function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath, 'utf8');
      const loaded = JSON.parse(data);
      settings = { ...defaultSettings, ...loaded };
      console.log('Loaded config:', settings);
    } else {
      saveConfig(settings);
    }
  } catch (err) {
    console.error('Error loading config, using defaults:', err);
  }
}

function saveConfig(newConfig) {
  try {
    settings = { ...settings, ...newConfig };
    fs.writeFileSync(configPath, JSON.stringify(settings, null, 2), 'utf8');
    console.log('Saved config:', settings);
  } catch (err) {
    console.error('Error saving config:', err);
  }
}

// --- Timer State Machine ---
let timerState = 'IDLE'; // 'IDLE' | 'WORKING' | 'PAUSED' | 'BREAKING'
let timeLeft = 0;
let workDuration = defaultSettings.workDuration;
let breakDuration = defaultSettings.breakDuration;
let soundEnabled = defaultSettings.soundEnabled;
let zenModeEnabled = defaultSettings.zenModeEnabled;
let isPomodoro = defaultSettings.isPomodoro;
let timerInterval = null;

let mainWindow = null;
let overlayWindows = [];
let tray = null;

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 680,
    resizable: false,
    maximizable: false,
    frame: false,
    transparent: false,
    backgroundColor: '#121212',
    title: 'Touch Grass',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile('index.html');
  
  // Set window icon explicitly (increases reliability on Linux taskbars)
  mainWindow.setIcon(path.join(__dirname, 'icon.png'));

  // Stream renderer console messages to Node terminal
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[MainWindow Console] Line ${line}: ${message}`);
  });

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createOverlayWindow() {
  if (overlayWindows.length > 0) return;

  const displays = screen.getAllDisplays();

  displays.forEach((display) => {
    const { x, y, width, height } = display.bounds;

    const overlay = new BrowserWindow({
      x,
      y,
      width,
      height,
      transparent: true,
      frame: false,
      alwaysOnTop: true,
      fullscreen: true,
      skipTaskbar: true,
      resizable: false,
      enableLargerThanScreen: true,
      hasShadow: false,
      webPreferences: {
        preload: path.join(__dirname, 'preload.js'),
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    overlay.setAlwaysOnTop(true, 'screen-saver');
    overlay.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    
    // Disable click-through completely (always block input, skip button works natively)
    overlay.setIgnoreMouseEvents(false);

    overlay.loadFile('overlay.html');
    
    // Force focus to receive keyboard events immediately
    overlay.focus();

    // Stream renderer console messages to Node terminal
    overlay.webContents.on('console-message', (event, level, message, line, sourceId) => {
      console.log(`[OverlayWindow Console] Line ${line}: ${message}`);
    });

    overlay.on('closed', () => {
      overlayWindows = overlayWindows.filter(win => win !== overlay);
    });

    overlayWindows.push(overlay);
  });
}

// --- Tray Management ---
function updateTray() {
  if (!tray) return;

  const stateLabels = {
    'IDLE': 'Ready to focus',
    'WORKING': 'Focusing',
    'PAUSED': 'Paused',
    'BREAKING': 'Taking a break'
  };

  const minutes = Math.floor(timeLeft / 60).toString().padStart(2, '0');
  const seconds = (timeLeft % 60).toString().padStart(2, '0');
  const statusStr = timerState === 'IDLE' ? stateLabels[timerState] : `${stateLabels[timerState]} (${minutes}:${seconds})`;
  
  tray.setToolTip(`Touch Grass\nStatus: ${statusStr}`);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: `Touch Grass (${stateLabels[timerState]})`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Open Dashboard',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        } else {
          createMainWindow();
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Start Focus Session',
      visible: timerState === 'IDLE',
      click: () => {
        loadConfig();
        startSession(settings);
      }
    },
    {
      label: 'Take a Break Now',
      visible: timerState === 'WORKING',
      click: () => transitionToBreak()
    },
    {
      label: 'Pause Focus',
      visible: timerState === 'WORKING',
      click: () => pauseSession()
    },
    {
      label: 'Resume Focus',
      visible: timerState === 'PAUSED',
      click: () => resumeSession()
    },
    {
      label: 'Skip Break',
      visible: timerState === 'BREAKING',
      click: () => skipBreak()
    },
    {
      label: 'Stop Session',
      visible: timerState !== 'IDLE',
      click: () => stopSession()
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
}

function createTray() {
  const iconPath = path.join(__dirname, 'icon-tray.png');
  let trayImage = nativeImage.createFromPath(iconPath);

  tray = new Tray(trayImage);
  updateTray();

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
    } else {
      createMainWindow();
    }
  });
}

// --- Timer Loop Logic ---
function tick() {
  if (timeLeft > 0) {
    timeLeft--;
    sendTimerUpdate();
    updateTray();
  } else {
    // Current period finished
    if (timerState === 'WORKING') {
      transitionToBreak();
    } else if (timerState === 'BREAKING') {
      transitionToWork();
    }
  }
}

function sendTimerUpdate() {
  const updateData = {
    state: timerState,
    timeLeft,
    totalDuration: timerState === 'WORKING' ? workDuration : (timerState === 'BREAKING' ? breakDuration : 0),
    soundEnabled,
    zenModeEnabled,
    isPomodoro
  };

  if (mainWindow) {
    mainWindow.webContents.send('timer-tick', updateData);
  }
  overlayWindows.forEach(win => {
    win.webContents.send('timer-tick', updateData);
  });
}

function sendStateTransition() {
  const stateData = {
    state: timerState,
    timeLeft,
    workDuration,
    breakDuration,
    soundEnabled,
    zenModeEnabled,
    isPomodoro
  };

  if (mainWindow) {
    mainWindow.webContents.send('state-transition', stateData);
  }
  overlayWindows.forEach(win => {
    win.webContents.send('state-transition', stateData);
  });
}

function transitionToBreak() {
  stopInterval();
  timerState = 'BREAKING';
  timeLeft = breakDuration;
  
  // Create overlay window
  createOverlayWindow();
  
  // Play transition sound (triggered via overlay renderer once loaded or main window)
  if (soundEnabled) {
    if (mainWindow) {
      mainWindow.webContents.send('play-sound', 'break-start');
    }
  }

  sendStateTransition();
  startInterval();
  updateTray();
}

function transitionToWork() {
  stopInterval();
  timerState = 'WORKING';
  timeLeft = workDuration;

  // Close all overlays if open
  overlayWindows.forEach(win => win.close());
  overlayWindows = [];

  // Play transition sound
  if (soundEnabled && mainWindow) {
    mainWindow.webContents.send('play-sound', 'work-start');
  }

  sendStateTransition();
  startInterval();
  updateTray();
}

function startInterval() {
  if (!timerInterval) {
    timerInterval = setInterval(tick, 1000);
  }
}

function stopInterval() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// --- Session Controls ---
function startSession(data) {
  loadConfig(); // make sure we align settings
  workDuration = data.workDuration;
  breakDuration = data.breakDuration;
  soundEnabled = data.soundEnabled;
  zenModeEnabled = data.zenModeEnabled;
  isPomodoro = data.isPomodoro;

  // Persist settings
  saveConfig({
    workDuration,
    breakDuration,
    soundEnabled,
    zenModeEnabled,
    isPomodoro
  });

  timerState = 'WORKING';
  timeLeft = workDuration;

  // Hide dashboard window per user choices
  if (mainWindow) {
    mainWindow.hide();
  }

  sendStateTransition();
  startInterval();
  updateTray();
}

function pauseSession() {
  if (timerState === 'WORKING') {
    stopInterval();
    timerState = 'PAUSED';
    sendStateTransition();
    updateTray();
  }
}

function resumeSession() {
  if (timerState === 'PAUSED') {
    timerState = 'WORKING';
    sendStateTransition();
    startInterval();
    updateTray();
  }
}

function stopSession() {
  stopInterval();
  timerState = 'IDLE';
  timeLeft = 0;

  // Close all overlays if open
  overlayWindows.forEach(win => win.close());
  overlayWindows = [];

  if (mainWindow) {
    mainWindow.show();
  }

  sendStateTransition();
  updateTray();
}

function skipBreak() {
  if (timerState === 'BREAKING') {
    transitionToWork();
  }
}

// --- IPC Listeners ---
ipcMain.on('start-session', (event, data) => {
  startSession(data);
});

ipcMain.on('pause-session', () => {
  pauseSession();
});

ipcMain.on('resume-session', () => {
  resumeSession();
});

ipcMain.on('stop-session', () => {
  stopSession();
});

ipcMain.on('skip-break', () => {
  skipBreak();
});



ipcMain.handle('get-config', () => {
  loadConfig();
  return settings;
});

ipcMain.on('window-minimize', () => {
  if (mainWindow) {
    mainWindow.minimize();
  }
});

ipcMain.on('window-close', () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.on('save-config', (event, newConfig) => {
  saveConfig(newConfig);
});

// --- App Event Handlers ---
app.whenReady().then(() => {
  loadConfig();
  createMainWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
