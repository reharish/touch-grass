// Renderer Process for Take-A-Break Dashboard

// --- DOM Elements ---
const setupScreen = document.getElementById('setupScreen');
const runningScreen = document.getElementById('runningScreen');
const modePomodoroBtn = document.getElementById('modePomodoroBtn');
const modeCustomBtn = document.getElementById('modeCustomBtn');
const workDurationGroup = document.getElementById('workDurationGroup');
const breakDurationGroup = document.getElementById('breakDurationGroup');
const workDurationInput = document.getElementById('workDurationInput');
const breakDurationInput = document.getElementById('breakDurationInput');
const workValDisplay = document.getElementById('workValDisplay');
const breakValDisplay = document.getElementById('breakValDisplay');
const soundToggle = document.getElementById('soundToggle');
const zenToggle = document.getElementById('zenToggle');
const startSessionBtn = document.getElementById('startSessionBtn');
const timerDigits = document.getElementById('timerDigits');
const timerLabel = document.getElementById('timerLabel');
const pauseResumeBtn = document.getElementById('pauseResumeBtn');
const pauseBtnText = document.getElementById('pauseBtnText');
const stopSessionBtn = document.getElementById('stopSessionBtn');
const runningStatusText = document.getElementById('runningStatusText');
const statusBanner = document.getElementById('statusBanner');
const timerProgressRing = document.getElementById('timerProgressRing');
const winMinimizeBtn = document.getElementById('winMinimizeBtn');
const winCloseBtn = document.getElementById('winCloseBtn');

// --- State Variables ---
let currentMode = 'POMODORO'; // 'POMODORO' | 'CUSTOM'
let currentTimerState = 'IDLE'; // 'IDLE' | 'WORKING' | 'PAUSED' | 'BREAKING'
const CIRCUMFERENCE = 2 * Math.PI * 96; // Radius is 96 in CSS

// Initialize Ring Progress
timerProgressRing.style.strokeDasharray = CIRCUMFERENCE;
timerProgressRing.style.strokeDashoffset = CIRCUMFERENCE;

// --- Web Audio Zen Chime Synth ---
function playChime(type) {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    const playNote = (frequency, startTime, duration, volume = 0.25) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, startTime);
      
      // Gentle exponential decay for bell effect
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.04);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    if (type === 'break-start') {
      // Gentle dual-tone zen chime (E5 -> A5)
      playNote(659.25, now, 2.0, 0.2); // E5
      playNote(880.00, now + 0.25, 2.5, 0.25); // A5
    } else if (type === 'work-start') {
      // Ascending motivation chime (A4 -> E5 -> A5)
      playNote(440.00, now, 0.6, 0.15); // A4
      playNote(659.25, now + 0.2, 0.6, 0.2); // E5
      playNote(880.00, now + 0.4, 2.0, 0.25); // A5
    }
  } catch (err) {
    console.error('Failed to synthesize chime:', err);
  }
}

// --- Window Custom Controls ---
winMinimizeBtn.addEventListener('click', () => {
  window.api.minimizeWindow();
});

winCloseBtn.addEventListener('click', () => {
  window.api.closeWindow();
});

// --- Mode Switch Selection ---
function setMode(mode) {
  currentMode = mode;
  if (mode === 'POMODORO') {
    modePomodoroBtn.classList.add('active');
    modeCustomBtn.classList.remove('active');
    workDurationGroup.classList.add('disabled');
    breakDurationGroup.classList.add('disabled');
    
    // Set typical values for display
    workValDisplay.textContent = '25 mins';
    breakValDisplay.textContent = '5 mins';
  } else {
    modePomodoroBtn.classList.remove('active');
    modeCustomBtn.classList.add('active');
    workDurationGroup.classList.remove('disabled');
    breakDurationGroup.classList.remove('disabled');
    
    // Refresh customized displays
    workValDisplay.textContent = `${workDurationInput.value} mins`;
    breakValDisplay.textContent = `${breakDurationInput.value} mins`;
  }
}

modePomodoroBtn.addEventListener('click', () => setMode('POMODORO'));
modeCustomBtn.addEventListener('click', () => setMode('CUSTOM'));

// --- Slider Display Updates ---
workDurationInput.addEventListener('input', (e) => {
  if (currentMode === 'CUSTOM') {
    workValDisplay.textContent = `${e.target.value} mins`;
  }
});

breakDurationInput.addEventListener('input', (e) => {
  if (currentMode === 'CUSTOM') {
    breakValDisplay.textContent = `${e.target.value} mins`;
  }
});

// --- Settings Load & Save ---
async function initApp() {
  try {
    const config = await window.api.getConfig();
    
    // Set UI elements based on config
    workDurationInput.value = Math.round(config.workDuration / 60);
    breakDurationInput.value = Math.round(config.breakDuration / 60);
    soundToggle.checked = config.soundEnabled;
    zenToggle.checked = config.zenModeEnabled;
    
    if (config.isPomodoro) {
      setMode('POMODORO');
    } else {
      setMode('CUSTOM');
    }
  } catch (err) {
    console.error('Failed to load settings:', err);
  }
}

// --- Session Controls ---
startSessionBtn.addEventListener('click', () => {
  let workMin = 25;
  let breakMin = 5;
  
  if (currentMode === 'CUSTOM') {
    workMin = parseInt(workDurationInput.value, 10);
    breakMin = parseInt(breakDurationInput.value, 10);
  }
  
  const workDuration = workMin * 60;
  const breakDuration = breakMin * 60;
  const soundEnabled = soundToggle.checked;
  const zenModeEnabled = zenToggle.checked;
  const isPomodoro = currentMode === 'POMODORO';

  window.api.startSession(workDuration, breakDuration, soundEnabled, zenModeEnabled, isPomodoro);
});

pauseResumeBtn.addEventListener('click', () => {
  if (currentTimerState === 'WORKING') {
    window.api.pauseSession();
  } else if (currentTimerState === 'PAUSED') {
    window.api.resumeSession();
  }
});

stopSessionBtn.addEventListener('click', () => {
  window.api.stopSession();
});

// --- Incoming IPC Events ---
window.api.onTimerTick((data) => {
  // Format TimeMM:SS
  const minutes = Math.floor(data.timeLeft / 60).toString().padStart(2, '0');
  const seconds = (data.timeLeft % 60).toString().padStart(2, '0');
  timerDigits.textContent = `${minutes}:${seconds}`;

  // Update ring progress offset
  const ratio = data.timeLeft / data.totalDuration;
  const offset = CIRCUMFERENCE * (1 - ratio);
  timerProgressRing.style.strokeDashoffset = offset;
});

window.api.onStateTransition((data) => {
  currentTimerState = data.state;
  if (data.state === 'IDLE') {
    setupScreen.classList.add('active');
    runningScreen.classList.remove('active');
  } else {
    setupScreen.classList.remove('active');
    runningScreen.classList.add('active');
    
    // Adapt details based on focus status
    if (data.state === 'WORKING') {
      runningStatusText.textContent = 'Focus Time';
      timerLabel.textContent = 'remaining';
      pauseBtnText.textContent = 'Pause';
      statusBanner.classList.remove('paused');
      timerProgressRing.style.stroke = '#10B981'; // green for work
      
      // Pause button SVG to show pause bars
      pauseResumeBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
        </svg>
        <span id="pauseBtnText">Pause</span>
      `;
    } else if (data.state === 'PAUSED') {
      runningStatusText.textContent = 'Focus Paused';
      timerLabel.textContent = 'paused';
      statusBanner.classList.add('paused');
      
      // Pause button SVG to show play triangle
      pauseResumeBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
        <span id="pauseBtnText">Resume</span>
      `;
    }
  }
});

// Listen for play sound chime triggers
window.api.playSound((type) => {
  playChime(type);
});

// --- Initialize App ---
initApp();
