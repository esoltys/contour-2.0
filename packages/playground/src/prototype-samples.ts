/**
 * PROTOTYPE: Sample Library Loading Test
 *
 * This is a proof-of-concept to validate:
 * 1. Can we load soundfonts using soundfont-player?
 * 2. How does it perform (load time, memory)?
 * 3. How does it integrate with our architecture?
 * 4. What's the developer experience like?
 */

import { SampleLibraryManager, Tone } from '@contour/tone-adapter';

// Debug: Log successful import
console.log('[DEBUG] SampleLibraryManager:', SampleLibraryManager);
console.log('[DEBUG] Tone:', Tone);

// UI Elements
const instrumentSelect = document.getElementById('instrumentSelect') as HTMLSelectElement;
const loadBtn = document.getElementById('loadBtn') as HTMLButtonElement;
const unloadBtn = document.getElementById('unloadBtn') as HTMLButtonElement;
const status = document.getElementById('status') as HTMLDivElement;
const playScaleBtn = document.getElementById('playScaleBtn') as HTMLButtonElement;
const playChordBtn = document.getElementById('playChordBtn') as HTMLButtonElement;
const playMelodyBtn = document.getElementById('playMelodyBtn') as HTMLButtonElement;
const piano = document.getElementById('piano') as HTMLDivElement;
const logDiv = document.getElementById('log') as HTMLDivElement;

// Metrics
const loadTimeMetric = document.getElementById('loadTime') as HTMLDivElement;
const instrumentCountMetric = document.getElementById('instrumentCount') as HTMLDivElement;
const memoryMetric = document.getElementById('memoryUsage') as HTMLDivElement;
const statusMetric = document.getElementById('statusMetric') as HTMLDivElement;

// State
const manager = new SampleLibraryManager();
let currentInstrument: any = null;
let audioContextInitialized = false;
const keyElements = new Map<string, HTMLElement>();
const keyTimeouts = new Map<string, number>();

// Logging
function log(message: string, highlight = false) {
  const entry = document.createElement('div');
  entry.className = 'log-entry' + (highlight ? ' highlight' : '');
  const timestamp = new Date().toLocaleTimeString();
  entry.textContent = `[${timestamp}] ${message}`;
  logDiv.appendChild(entry);
  logDiv.scrollTop = logDiv.scrollHeight;
  console.log(message);
}

// Update status
function updateStatus(message: string, type: 'normal' | 'loading' | 'error' = 'normal') {
  status.textContent = message;
  status.className = 'status ' + type;

  if (type === 'error') {
    statusMetric.textContent = 'Error';
    statusMetric.style.color = '#ff0000';
  } else if (type === 'loading') {
    statusMetric.textContent = 'Loading...';
    statusMetric.style.color = '#ffaa00';
  } else {
    statusMetric.textContent = currentInstrument ? 'Ready' : 'Idle';
    statusMetric.style.color = '#00ff41';
  }
}

// Update metrics
function updateMetrics(loadTime?: number) {
  if (loadTime !== undefined) {
    loadTimeMetric.textContent = `${loadTime.toFixed(0)}ms`;
  }

  instrumentCountMetric.textContent = manager.getLoadedInstruments().length.toString();

  // Estimate memory (rough approximation)
  if (performance.memory) {
    const usedMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
    memoryMetric.textContent = `${usedMB} MB`;
  } else {
    memoryMetric.textContent = 'N/A';
  }
}

// Initialize audio context
async function initAudioContext() {
  if (!audioContextInitialized) {
    try {
      console.log('[DEBUG] Initializing Tone.js...');
      await Tone.start();
      console.log('[DEBUG] Tone.context:', Tone.context);
      console.log('[DEBUG] Tone.context.rawContext:', Tone.context.rawContext);

      await manager.initialize(Tone.context.rawContext as AudioContext);
      audioContextInitialized = true;
      log('✓ Audio context initialized', true);
    } catch (error) {
      console.error('[ERROR] Audio initialization failed:', error);
      log(`✗ Failed to initialize audio: ${error}`, true);
      throw error;
    }
  }
}

// Load instrument
async function loadInstrument() {
  const instrumentName = instrumentSelect.value;

  try {
    updateStatus(`Loading ${instrumentName}...`, 'loading');
    loadBtn.disabled = true;

    // Initialize audio context if needed
    await initAudioContext();

    // Measure load time
    const startTime = performance.now();
    log(`Loading instrument: ${instrumentName}...`);

    currentInstrument = await manager.loadInstrument({
      instrument: instrumentName,
      format: 'mp3',
      soundfont: 'MusyngKite', // High-quality soundfont
    });

    const loadTime = performance.now() - startTime;

    log(`✓ Loaded ${instrumentName} in ${loadTime.toFixed(0)}ms`, true);
    updateStatus(`Loaded ${instrumentName} successfully`, 'normal');
    updateMetrics(loadTime);

    // Enable play buttons
    playScaleBtn.disabled = false;
    playChordBtn.disabled = false;
    playMelodyBtn.disabled = false;
    unloadBtn.disabled = false;

  } catch (error) {
    console.error('[ERROR] Failed to load instrument:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';

    log(`✗ Failed to load instrument: ${errorMsg}`, true);
    if (errorStack) {
      console.error('[ERROR] Stack trace:', errorStack);
      log(`Stack: ${errorStack.split('\n').slice(0, 3).join(' | ')}`);
    }

    updateStatus(`Error: ${errorMsg}`, 'error');
  } finally {
    loadBtn.disabled = false;
  }
}

// Unload all instruments
function unloadAll() {
  manager.dispose();
  currentInstrument = null;

  playScaleBtn.disabled = true;
  playChordBtn.disabled = true;
  playMelodyBtn.disabled = true;
  unloadBtn.disabled = true;

  updateStatus('All instruments unloaded', 'normal');
  updateMetrics();
  log('All instruments unloaded');
}

// Highlight a key visually
function highlightKey(note: string, durationMs: number) {
  const key = keyElements.get(note);
  if (!key) return;

  // Clear any existing timeout for this key
  const existingTimeout = keyTimeouts.get(note);
  if (existingTimeout) {
    clearTimeout(existingTimeout);
  }

  // Add the active class (re-adding is safe and ensures it's active)
  key.classList.add('active');

  // Schedule removal of the active class with a tiny buffer for overlapping notes
  const timeoutId = window.setTimeout(() => {
    key.classList.remove('active');
    keyTimeouts.delete(note);
  }, durationMs + 10); // Add 10ms buffer to prevent flicker on back-to-back notes

  keyTimeouts.set(note, timeoutId);
}

// Play C major scale
async function playScale() {
  if (!currentInstrument) return;

  const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
  const duration = 0.3;

  log('Playing C major scale...');

  for (let i = 0; i < notes.length; i++) {
    setTimeout(() => {
      currentInstrument.play(notes[i], Tone.now(), { duration });
      highlightKey(notes[i], duration * 1000);
      log(`  → ${notes[i]}`);
    }, i * 300);
  }
}

// Play C major chord
async function playChord() {
  if (!currentInstrument) return;

  const notes = ['C4', 'E4', 'G4'];
  const duration = 1.5;

  log('Playing C major chord...');

  notes.forEach(note => {
    currentInstrument.play(note, Tone.now(), { duration });
    highlightKey(note, duration * 1000);
    log(`  → ${note}`);
  });
}

// Play simple melody (Ode to Joy)
async function playMelody() {
  if (!currentInstrument) return;

  const melody = [
    { note: 'E4', time: 0, duration: 0.4 },
    { note: 'E4', time: 0.5, duration: 0.4 },
    { note: 'F4', time: 1.0, duration: 0.4 },
    { note: 'G4', time: 1.5, duration: 0.4 },
    { note: 'G4', time: 2.0, duration: 0.4 },
    { note: 'F4', time: 2.5, duration: 0.4 },
    { note: 'E4', time: 3.0, duration: 0.4 },
    { note: 'D4', time: 3.5, duration: 0.4 },
    { note: 'C4', time: 4.0, duration: 0.4 },
    { note: 'C4', time: 4.5, duration: 0.4 },
    { note: 'D4', time: 5.0, duration: 0.4 },
    { note: 'E4', time: 5.5, duration: 0.4 },
    { note: 'E4', time: 6.0, duration: 0.6 },
    { note: 'D4', time: 6.7, duration: 0.3 },
    { note: 'D4', time: 7.0, duration: 0.8 },
  ];

  log('Playing Ode to Joy...');

  melody.forEach(({ note, time, duration }) => {
    setTimeout(() => {
      currentInstrument.play(note, Tone.now(), { duration });
      highlightKey(note, duration * 1000);
      log(`  → ${note} (${duration}s)`);
    }, time * 1000);
  });
}

// Create virtual piano
function createPiano() {
  const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];

  notes.forEach(note => {
    const key = document.createElement('div');
    key.className = 'key';
    key.dataset.note = note;

    const span = document.createElement('span');
    span.textContent = note;
    key.appendChild(span);

    key.addEventListener('click', () => {
      if (currentInstrument) {
        currentInstrument.play(note, Tone.now(), { duration: 0.8 });
        highlightKey(note, 800);
        log(`Played ${note}`);
      }
    });

    piano.appendChild(key);
    keyElements.set(note, key);
  });
}

// Event listeners
loadBtn.addEventListener('click', loadInstrument);
unloadBtn.addEventListener('click', unloadAll);
playScaleBtn.addEventListener('click', playScale);
playChordBtn.addEventListener('click', playChord);
playMelodyBtn.addEventListener('click', playMelody);

// Initialize
createPiano();
log('Sample Library Prototype initialized');
log('Select an instrument and click "Load Instrument" to begin');
updateMetrics();

// Log initial memory if available
if (performance.memory) {
  const initialMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
  log(`Initial memory usage: ${initialMB} MB`);
}
