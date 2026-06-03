// Renderer Process for Take-A-Break Fullscreen Overlay

// --- DOM Elements ---
const overlayWrapper = document.getElementById('overlayWrapper');
const breakDigits = document.getElementById('breakDigits');
const breakProgressRing = document.getElementById('breakProgressRing');
const skipBreakBtn = document.getElementById('skipBreakBtn');

// --- SVG Ring Calculations ---
const CIRCUMFERENCE = 2 * Math.PI * 120; // Radius is 120 in overlay CSS

// Initialize Ring Progress
breakProgressRing.style.strokeDasharray = CIRCUMFERENCE;
breakProgressRing.style.strokeDashoffset = CIRCUMFERENCE;

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
    console.error('Failed to play chime in overlay:', err);
  }
}



// --- Skip Button Handler ---
skipBreakBtn.addEventListener('click', () => {
  // Restore focus mode
  window.api.skipBreak();
});

// --- Listen to Tick Updates from Main ---
window.api.onTimerTick((data) => {
  if (data.state !== 'BREAKING') return;

  // Format MM:SS
  const minutes = Math.floor(data.timeLeft / 60).toString().padStart(2, '0');
  const seconds = (data.timeLeft % 60).toString().padStart(2, '0');
  breakDigits.textContent = `${minutes}:${seconds}`;

  // Update ring progress offset
  const ratio = data.timeLeft / data.totalDuration;
  const offset = CIRCUMFERENCE * (1 - ratio);
  breakProgressRing.style.strokeDashoffset = offset;
});

// --- Listen to State/Config Changes ---
window.api.onStateTransition((data) => {
  if (data.zenModeEnabled) {
    overlayWrapper.classList.add('zen-mode');
  } else {
    overlayWrapper.classList.remove('zen-mode');
  }
  
  // Update details immediately on transitions
  if (data.state === 'BREAKING') {
    // Sync text digits
    const minutes = Math.floor(data.timeLeft / 60).toString().padStart(2, '0');
    const seconds = (data.timeLeft % 60).toString().padStart(2, '0');
    breakDigits.textContent = `${minutes}:${seconds}`;
    breakProgressRing.style.strokeDashoffset = CIRCUMFERENCE;
  }
});

// Listen to play sound events (reliable since overlay is visible and focused)
window.api.playSound((type) => {
  playChime(type);
});

// Request initial state on load by fetching configuration
window.api.getConfig().then((config) => {
  if (config.zenModeEnabled) {
    overlayWrapper.classList.add('zen-mode');
  }
  // Immediately play the chime when overlay is loaded
  if (config.soundEnabled) {
    playChime('break-start');
  }
});

// --- Double Escape Keypress Handler to Skip Break ---
let escCount = 0;
let escTimeout = null;

window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    escCount++;
    if (escCount === 2) {
      window.api.skipBreak();
      escCount = 0;
      if (escTimeout) clearTimeout(escTimeout);
    } else {
      if (escTimeout) clearTimeout(escTimeout);
      escTimeout = setTimeout(() => {
        escCount = 0;
      }, 1000); // Reset count after 1 second if second ESC is not pressed
    }
  }
});
