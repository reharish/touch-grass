const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  startSession: (workDuration, breakDuration, soundEnabled, zenModeEnabled, isPomodoro) => 
    ipcRenderer.send('start-session', { workDuration, breakDuration, soundEnabled, zenModeEnabled, isPomodoro }),
  pauseSession: () => ipcRenderer.send('pause-session'),
  resumeSession: () => ipcRenderer.send('resume-session'),
  stopSession: () => ipcRenderer.send('stop-session'),
  skipBreak: () => ipcRenderer.send('skip-break'),
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  onTimerTick: (callback) => ipcRenderer.on('timer-tick', (event, data) => callback(data)),
  onStateTransition: (callback) => ipcRenderer.on('state-transition', (event, data) => callback(data)),
  playSound: (callback) => ipcRenderer.on('play-sound', (event, type) => callback(type)),
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.send('save-config', config)
});
