/**
 * PROTOTYPE: Sample Library Loading Test
 *
 * This is a proof-of-concept to validate:
 * 1. Can we load soundfonts using soundfont-player?
 * 2. How does it perform (load time, memory)?
 * 3. How does it integrate with our architecture?
 * 4. What's the developer experience like?
 */

import { PatternBuilder, Duration, Velocity } from '@contour/core';
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

  log('Playing improved Ode to Joy with dynamics and expression...');

  // First phrase - building energy with crescendo
  const phrase1 = new PatternBuilder()
    .note('E4', Duration(0.4), Velocity(60))
    .note('E4', Duration(0.4), Velocity(60))
    .note('F4', Duration(0.4), Velocity(60))
    .note('G4', Duration(0.4), Velocity(60))
    .build()
    .crescendo(Velocity(60), Velocity(85))
    .humanize({ timing: 0.02, velocity: 5 });

  // Second phrase - descending with diminuendo
  const phrase2 = new PatternBuilder()
    .note('G4', Duration(0.4), Velocity(85))
    .note('F4', Duration(0.4), Velocity(85))
    .note('E4', Duration(0.4), Velocity(85))
    .note('D4', Duration(0.4), Velocity(85))
    .build()
    .diminuendo(Velocity(85), Velocity(65))
    .humanize({ timing: 0.02, velocity: 5 });

  // Third phrase - gentle with slight crescendo
  const phrase3 = new PatternBuilder()
    .note('C4', Duration(0.4), Velocity(65))
    .note('C4', Duration(0.4), Velocity(65))
    .note('D4', Duration(0.4), Velocity(65))
    .note('E4', Duration(0.4), Velocity(65))
    .build()
    .crescendo(Velocity(65), Velocity(80))
    .humanize({ timing: 0.02, velocity: 5 });

  // Final cadence - with accent on the resolution and slight ritardando
  const phrase4 = new PatternBuilder()
    .note('E4', Duration(0.6), Velocity(80))
    .note('D4', Duration(0.3), Velocity(70))
    .note('D4', Duration(0.8), Velocity(65))
    .build()
    .accent([0], 15) // Accent the first note
    .humanize({ timing: 0.03, velocity: 5 }); // Slightly more timing variation for ritardando feel

  // Combine all phrases by extracting events and building a new pattern
  const allEvents = [
    ...phrase1.events,
    ...phrase2.events,
    ...phrase3.events,
    ...phrase4.events
  ];

  // Adjust event times to be sequential
  let currentTime = 0;
  const adjustedEvents = allEvents.map(event => {
    const adjustedEvent = { ...event, time: currentTime };
    currentTime += event.duration;
    return adjustedEvent;
  });

  // Create the full melody from the adjusted events
  const builder = new PatternBuilder();
  adjustedEvents.forEach(event => {
    if (event.type === 'note') {
      builder.note(event.note.name, Duration(event.duration), Velocity(event.velocity));
    } else if (event.type === 'rest') {
      builder.rest(Duration(event.duration));
    }
  });
  const fullMelody = builder.build();

  log('  • Applied crescendo and diminuendo for dynamics');
  log('  • Added humanization for natural timing variations');
  log('  • Accented the final phrase resolution');

  // Schedule and play
  const events = fullMelody.events;
  events.forEach((event) => {
    if (event.type === 'note') {
      const noteName = event.note.name;
      setTimeout(() => {
        currentInstrument.play(noteName, Tone.now(), {
          duration: event.duration,
          gain: event.velocity / 127 // Convert velocity to gain
        });
        highlightKey(noteName, event.duration * 1000);
        log(`  → ${noteName} (${event.duration.toFixed(2)}s, vel: ${event.velocity})`);
      }, event.time * 1000);
    }
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
