import { PatternBuilder, Durations, Velocity } from '@contour/core';
import { PatternScheduler, Tone } from '@contour/tone-adapter';

// Global scheduler instance
let scheduler: PatternScheduler | null = null;
let isPlaying = false;

// UI Elements
const startBtn = document.getElementById('startBtn') as HTMLButtonElement;
const playBtn = document.getElementById('playBtn') as HTMLButtonElement;
const stopBtn = document.getElementById('stopBtn') as HTMLButtonElement;
const status = document.getElementById('status') as HTMLDivElement;

/**
 * Initialize the audio system.
 * MUST be called after a user gesture due to browser autoplay policies.
 */
async function initAudio() {
  try {
    // Start Tone.js (required before any audio playback)
    await Tone.start();
    console.log('[Contour] Audio context started');

    // Create scheduler
    scheduler = new PatternScheduler();
    scheduler.setTempo(120);

    // Update UI
    startBtn.disabled = true;
    playBtn.disabled = false;
    stopBtn.disabled = false;
    updateStatus('Audio System: Ready');

    console.log('[Contour] Scheduler initialized');
  } catch (error) {
    console.error('[Contour] Failed to initialize audio:', error);
    updateStatus('Error: Failed to start audio');
  }
}

/**
 * Create and play a simple melody.
 * Try modifying this while audio is playing to test hot-reload!
 */
function playMelody() {
  if (!scheduler) {
    console.error('[Contour] Scheduler not initialized');
    return;
  }

  // Clear any existing scheduled events
  scheduler.clear();

  // Create a simple melody - try changing these notes!
  const melody = new PatternBuilder()
    .withDuration(Durations.eighth)
    .withVelocity(Velocity(80))
    // First phrase
    .note('C4')
    .note('D4')
    .note('E4')
    .note('F4')
    .note('G4')
    .rest()
    // Second phrase
    .note('G4')
    .note('F4')
    .note('E4')
    .note('D4')
    .note('C4')
    .rest()
    // Chord ending
    .withDuration(Durations.half)
    .chord(['C4', 'E4', 'G4'], Durations.half, Velocity(90))
    .build();

  console.log('[Contour] Scheduling melody...');
  scheduler.schedule(melody);

  // Start playback
  scheduler.start();
  isPlaying = true;

  // Update UI
  playBtn.disabled = true;
  updateStatus('Playing...', true);

  // Auto-stop after the pattern completes (2 seconds for this melody)
  setTimeout(() => {
    if (isPlaying && scheduler) {
      stopPlayback();
    }
  }, 3000);
}

/**
 * Stop playback.
 */
function stopPlayback() {
  if (!scheduler) return;

  scheduler.stop();
  scheduler.clear();
  isPlaying = false;

  // Update UI
  playBtn.disabled = false;
  updateStatus('Audio System: Ready');

  console.log('[Contour] Playback stopped');
}

/**
 * Update status display.
 */
function updateStatus(message: string, playing: boolean = false) {
  status.textContent = message;
  status.className = 'status ' + (playing ? 'playing' : 'stopped');
}

// Event listeners
startBtn.addEventListener('click', initAudio);
playBtn.addEventListener('click', playMelody);
stopBtn.addEventListener('click', stopPlayback);

// Export init function for HMR
export async function init() {
  console.log('[Contour] Reinitializing after HMR...');

  // If scheduler exists, dispose of it
  if (scheduler) {
    scheduler.dispose();
  }

  // Only reinitialize if audio was already started
  if (startBtn.disabled) {
    await initAudio();
  }
}

// Welcome message
console.log(`
╔════════════════════════════════════════╗
║                                        ║
║     🎵 Contour 2.0 Dev Server 🎵      ║
║                                        ║
║  Try editing this file while playing!  ║
║  Hot-reload will fade audio smoothly.  ║
║                                        ║
╚════════════════════════════════════════╝
`);
