import { Pattern, pattern } from '@contour/core';
import {
  PatternScheduler,
  Tone,
  SampleLibraryManager,
  SampleAdapter,
  SynthAdapter,
  DrumAdapter,
  type InstrumentAdapter
} from '@contour/tone-adapter';
import { PATTERN_PRESETS, type PatternPreset } from './patterns/presets.js';
import loader from '@monaco-editor/loader';
import type * as Monaco from 'monaco-editor';
import { DebugPanel } from './ui/DebugPanel.js';
import { PatternPlayground } from './ui/PatternPlayground.js';
import { KeyboardShortcuts } from './ui/KeyboardShortcuts.js';
import { InstrumentSelector } from './ui/InstrumentSelector.js';
import { SampleLibraryPanel } from './ui/SampleLibraryPanel.js';
import { LoadingProgress } from './ui/LoadingProgress.js';
import './ui/debug-panel.css';

// ============================================================================
// State Management
// ============================================================================

interface PadState {
  id: string;
  preset: PatternPreset;
  pattern: Pattern | null;
  scheduler: PatternScheduler | null;
  isActive: boolean;
  code: string;
  instrument?: string; // Qualified instrument name (e.g., 'MusyngKite:acoustic_grand_piano') or null for synth
}

class PerformanceState {
  pads: Map<string, PadState> = new Map();
  isAudioStarted = false;
  isPlaying = false;
  isDemoRunning = false;
  bpm = 120;
  volume = 0;
  monaco: typeof Monaco | null = null;
  editor: Monaco.editor.IStandaloneCodeEditor | null = null;
  currentEditingPad: string | null = null;

  // Debug UI components
  debugPanel: DebugPanel | null = null;
  patternPlayground: PatternPlayground | null = null;
  keyboardShortcuts: KeyboardShortcuts | null = null;
  instrumentSelector: InstrumentSelector | null = null;
  sampleLibraryPanel: SampleLibraryPanel | null = null;
  loadingProgress: LoadingProgress | null = null;

  // Sample library
  sampleLibraryManager: SampleLibraryManager | null = null;
  useSamples = true; // Start with samples by default

  // UI state
  focusedPadId: string | null = null;

  // Instrument mapping for each category
  instrumentMap = {
    bass: {
      'bass-groove': 'electric_bass_finger',
      'acid-bass': 'synth_bass_1',
      'walking-bass': 'acoustic_bass',
      'sub-bass': 'synth_bass_2'
    },
    melody: {
      'arpeggio': 'acoustic_grand_piano',
      'melody-lead': 'lead_1_square',
      'fast-arp': 'electric_piano_1',
      'pentatonic': 'acoustic_guitar_nylon'
    },
    effects: {
      'ambient-swell': 'pad_2_warm',
      'stab-chord': 'string_ensemble_1',
      'texture': 'fx_5_brightness',
      'riser': 'pad_4_choir'
    }
  };

  constructor() {
    // Initialize pads with presets
    PATTERN_PRESETS.forEach((preset, index) => {
      const padId = `pad-${index}`;
      this.pads.set(padId, {
        id: padId,
        preset,
        pattern: null,
        scheduler: null,
        isActive: false,
        code: preset.code
      });
    });
  }
}

const state = new PerformanceState();

// ============================================================================
// UI Elements
// ============================================================================

const elements = {
  // Transport controls
  playBtn: document.getElementById('playBtn') as HTMLButtonElement,
  bpmSlider: document.getElementById('bpmSlider') as HTMLInputElement,
  bpmValue: document.getElementById('bpmValue') as HTMLSpanElement,
  volumeSlider: document.getElementById('volumeSlider') as HTMLInputElement,
  volumeValue: document.getElementById('volumeValue') as HTMLSpanElement,
  clearAllBtn: document.getElementById('clearAllBtn') as HTMLButtonElement,
  demoBtn: document.getElementById('demoBtn') as HTMLButtonElement,
  toggleSamplesBtn: document.getElementById('toggleSamplesBtn') as HTMLButtonElement,
  debugPanelBtn: document.getElementById('debugPanelBtn') as HTMLButtonElement,

  // Grid
  performanceGrid: document.getElementById('performanceGrid') as HTMLDivElement,

  // Modal
  editorModal: document.getElementById('editorModal') as HTMLDivElement,
  editorTitle: document.getElementById('editorTitle') as HTMLElement,
  monacoEditor: document.getElementById('monacoEditor') as HTMLDivElement,
  closeEditorBtn: document.getElementById('closeEditorBtn') as HTMLButtonElement,
  cancelEditorBtn: document.getElementById('cancelEditorBtn') as HTMLButtonElement,
  applyEditorBtn: document.getElementById('applyEditorBtn') as HTMLButtonElement,

  // Visualization
  waveformCanvas: document.getElementById('waveformCanvas') as HTMLCanvasElement
};

// ============================================================================
// Audio System
// ============================================================================

async function initAudio() {
  try {
    console.log('[Contour] Initializing audio system...');

    // Start Tone.js
    await Tone.start();

    // Set initial volume
    Tone.getDestination().volume.value = state.volume;

    // Update state
    state.isAudioStarted = true;

    // Enable controls
    enableControls();

    // Start visualization
    startVisualization();

    console.log('[Contour] Audio system ready!');

    // Auto-load sample instruments if in sample mode
    if (state.useSamples) {
      await loadSampleInstruments();
    }
  } catch (error) {
    console.error('[Contour] Failed to initialize audio:', error);
    alert('Failed to start audio system. Please try again.');
  }
}

function enableControls() {
  elements.playBtn.disabled = false;
  elements.bpmSlider.disabled = false;
  elements.volumeSlider.disabled = false;
  elements.clearAllBtn.disabled = false;
  elements.demoBtn.disabled = false;
  elements.toggleSamplesBtn.disabled = false;
}

function setTempo(bpm: number) {
  state.bpm = bpm;
  // Update tempo on all active pad schedulers
  state.pads.forEach(pad => {
    if (pad.scheduler) {
      pad.scheduler.setTempo(bpm);
    }
  });
  elements.bpmValue.textContent = bpm.toString();
}

function setVolume(db: number) {
  state.volume = db;
  Tone.getDestination().volume.value = db;
  elements.volumeValue.textContent = `${db}dB`;
}

function playAll() {
  if (state.isPlaying) return;

  console.log('[Contour] Starting playback...');
  state.isPlaying = true;

  // Start the global transport (all scheduled events will play)
  Tone.Transport.start();

  // Update UI
  elements.playBtn.textContent = 'Pause';
  updatePadVisuals();
}

function stopAll() {
  console.log('[Contour] Pausing playback...');
  state.isPlaying = false;

  // Stop the global transport (only need to do this once)
  Tone.Transport.stop();

  // Note: We keep pads active and their schedulers so they can resume when Play is pressed again
  // Update UI
  elements.playBtn.textContent = 'Play';
  updatePadVisuals();
}

function clearAll() {
  console.log('[Contour] Clearing all patterns...');
  state.isPlaying = false;

  // Stop the global transport
  Tone.Transport.stop();

  // Deactivate all pads and dispose their schedulers
  state.pads.forEach(pad => {
    if (pad.scheduler) {
      pad.scheduler.clear();
      pad.scheduler.dispose();
      pad.scheduler = null;
    }
    pad.isActive = false;
    pad.pattern = null;
  });
  updatePadVisuals();
}

// ============================================================================
// Pattern Management
// ============================================================================

/**
 * Update pad instrument and reschedule if active.
 */
function updatePadInstrument(padId: string, instrument: string): void {
  const padData = state.pads.get(padId);
  if (!padData) return;

  // Update pad data
  padData.instrument = instrument;

  // Update badge
  updatePadBadge(padId, instrument);

  // Reschedule if playing
  if (padData.isActive) {
    reschedulePattern(padId);
  }

  console.log(`[Contour] Updated pad ${padId} instrument to ${instrument}`);
}

/**
 * Update the visual badge on a pad to show instrument type.
 */
function updatePadBadge(padId: string, instrument: string): void {
  const padElement = document.querySelector(`[data-pad-id="${padId}"]`) as HTMLElement;
  if (!padElement) return;

  // Remove existing badge
  const existingBadge = padElement.querySelector('.pad-badge');
  if (existingBadge) {
    existingBadge.remove();
  }

  // Create new badge
  const badge = document.createElement('div');
  badge.className = 'pad-badge';

  const isSampled = instrument && instrument !== 'synth' && instrument.includes(':');
  badge.classList.add(isSampled ? 'badge-sample' : 'badge-synth');

  // Extract display name
  let displayName = 'Synth';
  if (isSampled) {
    const parts = instrument.split(':');
    if (parts.length === 2) {
      displayName = parts[1].replace(/_/g, ' ');
      // Truncate if too long
      if (displayName.length > 12) {
        displayName = displayName.substring(0, 12) + '...';
      }
    }
  }

  badge.textContent = displayName;
  badge.title = instrument; // Full name in tooltip

  padElement.appendChild(badge);
}

/**
 * Handle pad focus for keyboard shortcuts.
 */
function handlePadFocus(padId: string): void {
  state.focusedPadId = padId;

  // Add visual focus indicator
  const pads = document.querySelectorAll('.pad');
  pads.forEach(pad => pad.classList.remove('focused'));

  const padElement = document.querySelector(`[data-pad-id="${padId}"]`);
  if (padElement) {
    padElement.classList.add('focused');
  }
}

/**
 * Load sample instruments for all presets.
 */
async function loadSampleInstruments(): Promise<void> {
  try {
    // Initialize sample library manager if needed
    if (!state.sampleLibraryManager) {
      state.sampleLibraryManager = new SampleLibraryManager();
      await state.sampleLibraryManager.initialize(Tone.context.rawContext as AudioContext);

      // Initialize sample library UI components after manager is ready
      if (!state.instrumentSelector) {
        state.instrumentSelector = new InstrumentSelector(
          state.sampleLibraryManager,
          Tone.context.rawContext as AudioContext,
          (padId: string, instrument: string) => {
            updatePadInstrument(padId, instrument);
          }
        );
      }

      if (!state.sampleLibraryPanel) {
        state.sampleLibraryPanel = new SampleLibraryPanel(state.sampleLibraryManager);
      }
    }

    // Show loading progress
    state.loadingProgress?.show('Loading sample instruments...');

    // Collect unique instrument names from the mapping
    const instrumentNames = new Set<string>();

    Object.entries(state.instrumentMap).forEach(([category, categoryMap]) => {
      Object.entries(categoryMap).forEach(([presetId, instrumentName]) => {
        if (instrumentName && typeof instrumentName === 'string') {
          instrumentNames.add(instrumentName);
        }
      });
    });

    // Filter out any undefined/null values
    const validInstrumentNames = Array.from(instrumentNames).filter(name => {
      return name && typeof name === 'string' && name !== 'undefined';
    });

    console.log('[Contour] Loading instruments:', validInstrumentNames);

    // Load instruments one at a time to show progress
    // +1 for drum kit
    const total = validInstrumentNames.length + 1;
    let loaded = 0;
    let failed = 0;
    const failedInstruments: string[] = [];

    // Load melodic instruments
    for (const name of validInstrumentNames) {
      state.loadingProgress?.updateProgress(loaded, total, name);
      try {
        await state.sampleLibraryManager!.loadInstrument({ instrument: name });
        loaded++;
      } catch (error) {
        failed++;
        failedInstruments.push(name);
        console.error(`[Contour] Failed to load instrument ${name}:`, error);
      }
    }

    // Load drum kit
    state.loadingProgress?.updateProgress(loaded, total, 'CR78 drum kit');
    try {
      const drumAdapter = new DrumAdapter('CR78');
      await drumAdapter.waitForLoad();
      // Store for reuse - avoid creating new instances for each drum pad
      (state as any).drumAdapter = drumAdapter;
      loaded++;
    } catch (error) {
      failed++;
      failedInstruments.push('CR78 drum kit');
      console.error('[Contour] Failed to load CR78 drum kit:', error);
    }

    // Update progress to show final count
    state.loadingProgress?.updateProgress(loaded, total);

    if (failed > 0) {
      state.loadingProgress?.showError(`Loaded ${loaded}/${total} instruments. Failed: ${failedInstruments.join(', ')}`);
    } else {
      state.loadingProgress?.showSuccess(`All ${total} instruments loaded!`);
    }

    console.log('[Contour] Sample instruments loaded');

    // Update all pad badges to show sample mode
    state.pads.forEach((pad) => {
      // Get the instrument name for this pad
      const categoryMap = state.instrumentMap[pad.preset.category as keyof typeof state.instrumentMap];
      let instrumentName = 'synth';

      if (pad.preset.category === 'drums') {
        instrumentName = 'MusyngKite:drums'; // Placeholder for drum kit
      } else if (categoryMap) {
        const gmInstrument = categoryMap[pad.preset.id as keyof typeof categoryMap];
        if (gmInstrument) {
          instrumentName = `MusyngKite:${gmInstrument}`;
        }
      }

      updatePadBadge(pad.id, instrumentName);
    });
  } catch (error) {
    console.error('[Contour] Failed to load sample instruments:', error);
    state.loadingProgress?.showError(error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

/**
 * Toggle between synthesized and sampled instruments.
 */
async function toggleSamples() {
  if (!state.isAudioStarted) {
    await initAudio();
  }

  const toggleBtn = document.getElementById('toggleSamplesBtn') as HTMLButtonElement;

  if (state.useSamples) {
    // Switching to synths
    state.useSamples = false;
    toggleBtn.textContent = '🎻 Use Samples';
    console.log('[Contour] Switched to synthesized instruments');

    // Update all pad badges
    state.pads.forEach((pad) => {
      updatePadBadge(pad.id, 'synth');
    });
  } else {
    // Switching to samples - load soundfonts
    try {
      toggleBtn.disabled = true;

      // Pause playback during loading
      const wasPlaying = state.isPlaying;
      if (wasPlaying) {
        stopAll();
      }

      // Load sample instruments
      await loadSampleInstruments();

      state.useSamples = true;
      toggleBtn.textContent = '🎹 Use Synths';
      console.log('[Contour] Switched to sampled instruments');

      // Resume playback if it was playing before
      if (wasPlaying) {
        rescheduleActivePads();
        playAll();
      }
    } catch (error) {
      console.error('[Contour] Failed to load samples:', error);
      toggleBtn.textContent = '🎻 Use Samples';
      return;
    } finally {
      toggleBtn.disabled = false;
    }
  }

  // Reschedule active pads with new instruments
  if (state.isPlaying) {
    rescheduleActivePads();
  }
}

async function togglePad(padId: string) {
  // Initialize audio if not started
  if (!state.isAudioStarted) {
    await initAudio();
  }

  const pad = state.pads.get(padId);
  if (!pad) return;

  pad.isActive = !pad.isActive;

  if (pad.isActive) {
    // Compile pattern if not already compiled
    if (!pad.pattern) {
      try {
        pad.pattern = compilePattern(pad.code);
      } catch (error) {
        console.error(`[Contour] Failed to compile pattern for ${padId}:`, error);
        pad.isActive = false;
        alert(`Failed to compile pattern: ${error instanceof Error ? error.message : 'Unknown error'}`);
        return;
      }
    }

    // Create instrument adapter based on mode and category
    let instrument: InstrumentAdapter;

    if (state.useSamples) {
      // Use samples - either drums or melodic instruments
      if (pad.preset.category === 'drums') {
        // Use pre-loaded drum samples (CR78 kit)
        if ((state as any).drumAdapter) {
          instrument = (state as any).drumAdapter;
        } else {
          // Fallback: create new adapter if not pre-loaded
          instrument = new DrumAdapter('CR78');
        }
        console.log(`[Contour] Using CR78 drum samples for ${pad.preset.name}`);
      } else {
        // Use melodic samples for bass, melody, effects
        const categoryMap = state.instrumentMap[pad.preset.category as keyof typeof state.instrumentMap];

        if (!categoryMap) {
          console.warn(`[Contour] No category mapping for ${pad.preset.category}, falling back to synth`);
          instrument = new SynthAdapter();
        } else {
          const instrumentName = categoryMap[pad.preset.id as keyof typeof categoryMap];

          if (!instrumentName || !state.sampleLibraryManager) {
            console.warn(`[Contour] No instrument mapping for ${pad.preset.category}/${pad.preset.id}, falling back to synth`);
            instrument = new SynthAdapter();
          } else {
            const soundfontInst = state.sampleLibraryManager.getInstrument(instrumentName);
            instrument = new SampleAdapter(soundfontInst, Tone.context.rawContext as AudioContext);
            console.log(`[Contour] Using sample instrument: ${instrumentName} for ${pad.preset.name}`);
          }
        }
      }
    } else {
      // Use synth when samples disabled
      instrument = new SynthAdapter();
      console.log(`[Contour] Using synth for ${pad.preset.name}`);
    }

    // Create a new scheduler for this pad with its instrument
    pad.scheduler = new PatternScheduler(instrument);
    pad.scheduler.setTempo(state.bpm);
    pad.scheduler.schedule(pad.pattern);

    // Register pattern with debug panel
    if (state.debugPanel) {
      const patternInspector = state.debugPanel.getPatternInspector();
      if (patternInspector) {
        patternInspector.registerPattern(padId, pad.preset.name, pad.pattern);
      }
    }

    // Auto-start playback if not already playing
    // Note: If already playing, the newly scheduled events will play automatically
    if (!state.isPlaying) {
      playAll();
    }
  } else {
    // Unregister pattern from debug panel
    if (state.debugPanel) {
      const patternInspector = state.debugPanel.getPatternInspector();
      if (patternInspector) {
        patternInspector.unregisterPattern(padId);
      }
    }

    // Clear and dispose this pad's scheduler
    // Note: Don't call stop() - that stops the global transport!
    if (pad.scheduler) {
      pad.scheduler.clear();
      pad.scheduler.dispose();
      pad.scheduler = null;
    }
  }

  updatePadVisual(padId);
}

function compilePattern(code: string): Pattern {
  // Create a safe evaluation context
  const patternFunc = new Function('pattern', `return ${code}`);
  const result = patternFunc(pattern);

  if (!result || typeof result.build !== 'function') {
    throw new Error('Pattern code must return a PatternBuilder');
  }

  return result.build();
}

function rescheduleActivePads() {
  // Clear and reschedule each pad's own scheduler
  // Note: Don't call stop()/start() - those control the global transport
  state.pads.forEach(pad => {
    if (pad.isActive && pad.scheduler && pad.pattern) {
      pad.scheduler.clear();
      pad.scheduler.schedule(pad.pattern);
      // No need to call start() - if transport is playing, events will fire automatically
    }
  });
}

function updatePatternCode(padId: string, code: string) {
  const pad = state.pads.get(padId);
  if (!pad) return;

  try {
    // Compile new pattern
    const newPattern = compilePattern(code);

    // Update pad state
    pad.code = code;
    pad.pattern = newPattern;

    // Update pattern in debug panel
    if (state.debugPanel && pad.isActive) {
      const patternInspector = state.debugPanel.getPatternInspector();
      if (patternInspector) {
        patternInspector.updatePattern(padId, newPattern);
      }
    }

    // If pad is active and playing, reschedule
    if (pad.isActive && state.isPlaying) {
      rescheduleActivePads();
    }

    console.log(`[Contour] Pattern updated for ${padId}`);
  } catch (error) {
    console.error(`[Contour] Failed to update pattern for ${padId}:`, error);
    throw error;
  }
}

// ============================================================================
// UI Rendering
// ============================================================================

function initGrid() {
  elements.performanceGrid.innerHTML = '';

  state.pads.forEach((pad, padId) => {
    const padElement = document.createElement('div');
    padElement.className = 'pad';
    padElement.dataset.padId = padId;

    // Pad content
    padElement.innerHTML = `
      <div class="pad-edit">Edit Pattern</div>
      <div class="pad-icon">${pad.preset.icon}</div>
      <div class="pad-name">${pad.preset.name}</div>
    `;

    // Click to toggle
    padElement.addEventListener('click', (e) => {
      // Don't toggle if clicking edit button
      if ((e.target as HTMLElement).classList.contains('pad-edit')) {
        e.stopPropagation();
        openEditor(padId);
        return;
      }

      // Toggle pad (will initialize audio if needed)
      togglePad(padId);
    });

    // Hover to track focus for keyboard shortcuts
    padElement.addEventListener('mouseenter', () => {
      handlePadFocus(padId);
    });

    // Initialize badge
    updatePadBadge(padId, pad.instrument || 'synth');

    elements.performanceGrid.appendChild(padElement);
  });
}

function updatePadVisuals() {
  state.pads.forEach((pad, padId) => {
    updatePadVisual(padId);
  });
}

function updatePadVisual(padId: string) {
  const padElement = document.querySelector(`[data-pad-id="${padId}"]`);
  const pad = state.pads.get(padId);

  if (!padElement || !pad) return;

  if (pad.isActive) {
    padElement.classList.add('active');
  } else {
    padElement.classList.remove('active');
  }
}

// ============================================================================
// Pattern Editor
// ============================================================================

async function initMonaco() {
  if (state.monaco) return;

  try {
    state.monaco = await loader.init();

    // Add TypeScript definitions for the runtime context
    state.monaco.languages.typescript.typescriptDefaults.addExtraLib(`
      import { PatternBuilder } from '@contour/core';
      declare function pattern(): PatternBuilder;
    `, 'ts:contour-runtime.d.ts');

    // Create editor instance
    state.editor = state.monaco.editor.create(elements.monacoEditor, {
      value: '',
      language: 'typescript',
      theme: 'vs-dark',
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: 'off',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      padding: { top: 16, bottom: 16 }
    });

    // Add keyboard shortcut for apply (Cmd/Ctrl + Enter)
    state.editor.addCommand(
      state.monaco.KeyMod.CtrlCmd | state.monaco.KeyCode.Enter,
      () => applyEditorChanges()
    );

    console.log('[Contour] Monaco editor initialized');
  } catch (error) {
    console.error('[Contour] Failed to initialize Monaco:', error);
  }
}

function openEditor(padId: string) {
  const pad = state.pads.get(padId);
  if (!pad) return;

  state.currentEditingPad = padId;

  // Initialize Monaco if needed
  if (!state.editor) {
    initMonaco().then(() => {
      if (state.editor) {
        state.editor.setValue(pad.code);
      }
    });
  } else {
    state.editor.setValue(pad.code);
  }

  // Update modal title
  elements.editorTitle.textContent = `Edit Pattern: ${pad.preset.name}`;

  // Show modal
  elements.editorModal.classList.add('active');

  // Focus editor
  setTimeout(() => state.editor?.focus(), 100);
}

function closeEditor() {
  elements.editorModal.classList.remove('active');
  state.currentEditingPad = null;
}

function applyEditorChanges() {
  if (!state.currentEditingPad || !state.editor) return;

  const newCode = state.editor.getValue();

  try {
    updatePatternCode(state.currentEditingPad, newCode);
    closeEditor();
  } catch (error) {
    alert(`Failed to compile pattern:\n${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// ============================================================================
// Visualization
// ============================================================================

function startVisualization() {
  const canvas = elements.waveformCanvas;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    console.warn('[Contour] Cannot start visualization: no canvas context');
    return;
  }

  console.log('[Contour] Starting piano roll visualization');

  const OCTAVES = 5; // Show 5 octaves (C1-C6)
  const LOWEST_NOTE = 24; // MIDI C1 (includes sub-bass range)
  const TOTAL_NOTES = OCTAVES * 12 + 1; // +1 to include C6 (61 notes total)
  const NOTE_HEIGHT = canvas.height / TOTAL_NOTES; // Exactly fit all notes
  const TIME_SCALE = 60; // Pixels per beat

  function draw() {
    requestAnimationFrame(draw);

    // Clear canvas with dark background
    ctx.fillStyle = '#0a0a0b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines for octaves
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= OCTAVES; i++) {
      const y = (i * 12) * NOTE_HEIGHT;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Draw beat lines
    const beatsToShow = Math.ceil(canvas.width / TIME_SCALE);
    for (let i = 0; i <= beatsToShow; i++) {
      const x = i * TIME_SCALE;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }

    if (!state.isPlaying) return;

    // Get current transport position in beats
    const currentBeat = Tone.Transport.seconds * (state.bpm / 60);

    // Find the longest pattern length among active pads (in beats)
    let maxPatternLengthBeats = 4; // Default 4 beats
    state.pads.forEach((pad) => {
      if (!pad.isActive || !pad.pattern || pad.pattern.events.length === 0) return;
      const lastEvent = pad.pattern.events[pad.pattern.events.length - 1];
      const patternEndBeats = (lastEvent.time + lastEvent.duration) * (state.bpm / 60);
      maxPatternLengthBeats = Math.max(maxPatternLengthBeats, patternEndBeats);
    });

    // Use the pattern length for both playhead and notes
    // Scale to fit the pattern in the visible canvas width
    const pixelsPerBeat = canvas.width / maxPatternLengthBeats;

    // Draw playhead - wraps based on pattern length, not canvas width
    const playheadX = (currentBeat % maxPatternLengthBeats) * pixelsPerBeat;
    ctx.strokeStyle = '#00fff5';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, canvas.height);
    ctx.stroke();

    // Draw active notes from all active pads
    const colors = [
      'rgba(0, 255, 245, 0.6)',   // Cyan
      'rgba(255, 0, 255, 0.6)',   // Magenta
      'rgba(0, 255, 127, 0.6)',   // Spring green
      'rgba(255, 127, 0, 0.6)',   // Orange
    ];
    let colorIndex = 0;

    state.pads.forEach((pad) => {
      if (!pad.isActive || !pad.pattern) return;

      const color = colors[colorIndex % colors.length];
      colorIndex++;

      // Draw notes at their static positions within the pattern
      // The playhead moves over them, not the other way around
      pad.pattern.events.forEach((event) => {
        if (event.type === 'rest') return;

        const notes = event.type === 'note' ? [event.note] : event.notes;

        notes.forEach((note) => {
          const midi = note.pitch;
          if (midi < LOWEST_NOTE || midi >= LOWEST_NOTE + TOTAL_NOTES) return;

          const noteIndex = midi - LOWEST_NOTE;
          const y = (TOTAL_NOTES - noteIndex - 1) * NOTE_HEIGHT;

          // Convert event time (seconds) to beats and position statically
          const eventStartBeat = event.time * (state.bpm / 60);
          const eventDurationBeats = event.duration * (state.bpm / 60);

          // Position using the same scale as the playhead
          const x = eventStartBeat * pixelsPerBeat;
          const width = eventDurationBeats * pixelsPerBeat;

          ctx.fillStyle = color;
          ctx.fillRect(x, y, Math.max(width, 2), NOTE_HEIGHT - 1);
        });
      });
    });
  }

  draw();
}

// ============================================================================
// Demo Scene
// ============================================================================

async function playDemoJam() {
  // Prevent running demo multiple times
  if (state.isDemoRunning) return;

  state.isDemoRunning = true;
  elements.demoBtn.disabled = true;

  // Initialize audio if not started
  if (!state.isAudioStarted) {
    await initAudio();
  }

  console.log('[Contour] Starting demo jam...');

  // Stop everything first
  stopAll();

  // Demo sequence: gradually bring in different elements
  const demoSequence = [
    { padIndex: 0, delay: 500 },    // Kick
    { padIndex: 2, delay: 2000 },   // Hat
    { padIndex: 4, delay: 4000 },   // Bass
    { padIndex: 8, delay: 6000 },   // Arp
    { padIndex: 1, delay: 8000 },   // Snare
    { padIndex: 9, delay: 10000 },  // Melody
  ];

  // Activate first pad and start playback immediately
  togglePad('pad-0');

  // Add remaining pads while playing
  for (let i = 1; i < demoSequence.length; i++) {
    const { padIndex, delay } = demoSequence[i];
    setTimeout(() => {
      const padId = `pad-${padIndex}`;
      togglePad(padId);
    }, delay);
  }

  // Re-enable button after demo completes
  setTimeout(() => {
    state.isDemoRunning = false;
    elements.demoBtn.disabled = false;
  }, demoSequence[demoSequence.length - 1].delay + 1000);
}

// ============================================================================
// Event Listeners
// ============================================================================

function initEventListeners() {
  // Transport controls
  elements.playBtn.addEventListener('click', () => {
    if (state.isPlaying) {
      stopAll();
    } else {
      playAll();
    }
  });

  elements.bpmSlider.addEventListener('input', (e) => {
    const bpm = parseInt((e.target as HTMLInputElement).value);
    setTempo(bpm);
  });

  elements.volumeSlider.addEventListener('input', (e) => {
    const volume = parseInt((e.target as HTMLInputElement).value);
    setVolume(volume);
  });


  elements.clearAllBtn.addEventListener('click', clearAll);
  elements.demoBtn.addEventListener('click', playDemoJam);
  elements.toggleSamplesBtn.addEventListener('click', toggleSamples);

  // Debug panel toggle button
  elements.debugPanelBtn.addEventListener('click', () => {
    if (state.debugPanel) {
      state.debugPanel.toggle();
    }
  });

  // Editor modal
  elements.closeEditorBtn.addEventListener('click', closeEditor);
  elements.cancelEditorBtn.addEventListener('click', closeEditor);
  elements.applyEditorBtn.addEventListener('click', applyEditorChanges);

  // Close modal on background click
  elements.editorModal.addEventListener('click', (e) => {
    if (e.target === elements.editorModal) {
      closeEditor();
    }
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    // Question mark: show keyboard shortcuts help
    if (e.key === '?' && !e.shiftKey) {
      e.preventDefault();
      if (state.keyboardShortcuts) {
        state.keyboardShortcuts.toggle();
      }
      return;
    }

    // Cmd/Ctrl + D: toggle debug panel
    if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
      e.preventDefault();
      if (state.debugPanel) {
        state.debugPanel.toggle();
      }
      return;
    }

    // Cmd/Ctrl + K: open pattern playground
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (state.patternPlayground) {
        state.patternPlayground.show();
      }
      return;
    }

    // Escape: close modal or stop
    if (e.key === 'Escape') {
      if (elements.editorModal.classList.contains('active')) {
        closeEditor();
      } else if (state.keyboardShortcuts?.isVisible()) {
        state.keyboardShortcuts.hide();
      } else if (state.patternPlayground?.isVisible()) {
        state.patternPlayground.hide();
      } else {
        stopAll();
      }
      return;
    }

    // Don't handle shortcuts if modal is open or typing in input
    if (elements.editorModal.classList.contains('active') ||
        e.target instanceof HTMLInputElement) {
      return;
    }

    // Space: play/pause
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      if (state.isPlaying) {
        stopAll();
      } else {
        playAll();
      }
      return;
    }

    // I key: select instrument for focused pad
    if ((e.key === 'i' || e.key === 'I') && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      if (state.focusedPadId && state.instrumentSelector) {
        const padData = state.pads.get(state.focusedPadId);
        state.instrumentSelector.show(state.focusedPadId, padData?.instrument);
      }
      return;
    }

    // L key: toggle sample library panel
    if ((e.key === 'l' || e.key === 'L') && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      if (state.sampleLibraryPanel) {
        state.sampleLibraryPanel.toggle();
      }
      return;
    }

    // Shift+S: toggle samples/synths
    if (e.shiftKey && e.code === 'KeyS') {
      e.preventDefault();
      toggleSamples();
      return;
    }

    // Number keys 1-9 and Q-I: trigger pads 0-15
    // Use e.code instead of e.key to handle Shift properly
    const codeMap: { [code: string]: number } = {
      'Digit1': 0, 'Digit2': 1, 'Digit3': 2, 'Digit4': 3,
      'KeyQ': 4, 'KeyW': 5, 'KeyE': 6, 'KeyR': 7,
      'KeyA': 8, 'KeyS': 9, 'KeyD': 10, 'KeyF': 11,
      'KeyZ': 12, 'KeyX': 13, 'KeyC': 14, 'KeyV': 15
    };

    const padIndex = codeMap[e.code];
    if (padIndex !== undefined) {
      const padId = `pad-${padIndex}`;

      // Shift + key: edit pattern
      if (e.shiftKey) {
        e.preventDefault(); // Prevent default browser behavior
        openEditor(padId);
      } else {
        togglePad(padId);
      }
    }
  });
}

// ============================================================================
// Initialization
// ============================================================================

function init() {
  console.log('[Contour] Initializing performance interface...');

  initGrid();
  initEventListeners();

  // Initialize debug UI components
  state.debugPanel = new DebugPanel({
    initialTab: 'transport',
    position: 'bottom',
    visible: false
  });

  state.patternPlayground = new PatternPlayground({
    onAddToGrid: (code: string, patternInstance: Pattern) => {
      console.log('[Contour] Adding pattern from playground to grid');
      // TODO: Add functionality to create a new pad with this pattern
      alert('Pattern added! (Grid integration coming soon)');
    },
    onClose: () => {
      console.log('[Contour] Playground closed');
    }
  });

  state.keyboardShortcuts = new KeyboardShortcuts();

  // Initialize loading progress component
  state.loadingProgress = new LoadingProgress();

  console.log('[Contour] Debug UI initialized');
  console.log('[Contour] Press ? for keyboard shortcuts, Cmd+D for debug panel, Cmd+K for playground');

  console.log(`
╔════════════════════════════════════════╗
║                                        ║
║      🎵 Contour Playground 🎵          ║
║                                        ║
║  Click pads or "Start Playground"!     ║
║  Audio will initialize automatically.  ║
║                                        ║
║  Press ? for keyboard shortcuts        ║
║  Press Cmd+D for debug panel           ║
║  Press Cmd+K for pattern playground    ║
║                                        ║
╚════════════════════════════════════════╝
  `);
}

// Start the app
init();

// Export for HMR
export { init };
