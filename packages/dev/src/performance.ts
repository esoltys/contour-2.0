import { Pattern, pattern } from '@contour/core';
import { PatternScheduler, Tone } from '@contour/tone-adapter';
import { PATTERN_PRESETS, type PatternPreset } from './patterns/presets.js';
import loader from '@monaco-editor/loader';
import type * as Monaco from 'monaco-editor';
import { DebugPanel } from './ui/DebugPanel.js';
import { PatternPlayground } from './ui/PatternPlayground.js';
import { KeyboardShortcuts } from './ui/KeyboardShortcuts.js';
import './ui/debug-panel.css';

// ============================================================================
// State Management
// ============================================================================

interface PadState {
  id: string;
  preset: PatternPreset;
  pattern: Pattern | null;
  isActive: boolean;
  code: string;
}

class PerformanceState {
  scheduler: PatternScheduler | null = null;
  pads: Map<string, PadState> = new Map();
  isAudioStarted = false;
  isPlaying = false;
  isDemoRunning = false;
  bpm = 120;
  volume = 0;
  metronomeEnabled = false;
  waveformAnalyzer: Tone.Analyser | null = null;
  monaco: typeof Monaco | null = null;
  editor: Monaco.editor.IStandaloneCodeEditor | null = null;
  currentEditingPad: string | null = null;

  // Debug UI components
  debugPanel: DebugPanel | null = null;
  patternPlayground: PatternPlayground | null = null;
  keyboardShortcuts: KeyboardShortcuts | null = null;

  constructor() {
    // Initialize pads with presets
    PATTERN_PRESETS.forEach((preset, index) => {
      const padId = `pad-${index}`;
      this.pads.set(padId, {
        id: padId,
        preset,
        pattern: null,
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
  metronomeCheck: document.getElementById('metronomeCheck') as HTMLInputElement,
  clearAllBtn: document.getElementById('clearAllBtn') as HTMLButtonElement,
  demoBtn: document.getElementById('demoBtn') as HTMLButtonElement,

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

    // Create scheduler
    state.scheduler = new PatternScheduler();
    state.scheduler.setTempo(state.bpm);

    // Set initial volume
    Tone.getDestination().volume.value = state.volume;

    // Create waveform analyzer
    state.waveformAnalyzer = new Tone.Analyser('waveform', 512);
    Tone.getDestination().connect(state.waveformAnalyzer);

    // Update state
    state.isAudioStarted = true;

    // Enable controls
    enableControls();

    // Start visualization
    startVisualization();

    console.log('[Contour] Audio system ready!');
  } catch (error) {
    console.error('[Contour] Failed to initialize audio:', error);
    alert('Failed to start audio system. Please try again.');
  }
}

function enableControls() {
  elements.playBtn.disabled = false;
  elements.bpmSlider.disabled = false;
  elements.volumeSlider.disabled = false;
  elements.metronomeCheck.disabled = false;
  elements.clearAllBtn.disabled = false;
}

function setTempo(bpm: number) {
  state.bpm = bpm;
  if (state.scheduler) {
    state.scheduler.setTempo(bpm);
  }
  elements.bpmValue.textContent = bpm.toString();
}

function setVolume(db: number) {
  state.volume = db;
  Tone.getDestination().volume.value = db;
  elements.volumeValue.textContent = `${db}dB`;
}

function playAll() {
  if (!state.scheduler || state.isPlaying) return;

  console.log('[Contour] Starting playback...');
  state.isPlaying = true;

  // Schedule all active patterns
  state.pads.forEach(pad => {
    if (pad.isActive && pad.pattern) {
      state.scheduler!.schedule(pad.pattern);
    }
  });

  // Start transport
  state.scheduler.start();

  // Update UI
  elements.playBtn.textContent = '⏸';
  updatePadVisuals();
}

function stopAll() {
  if (!state.scheduler) return;

  console.log('[Contour] Stopping playback...');
  state.scheduler.stop();
  state.scheduler.clear();
  state.isPlaying = false;

  // Deactivate all pads
  state.pads.forEach(pad => {
    pad.isActive = false;
  });

  // Update UI
  elements.playBtn.textContent = '▶';
  updatePadVisuals();
}

function clearAll() {
  stopAll();
  state.pads.forEach(pad => {
    pad.isActive = false;
    pad.pattern = null;
  });
  updatePadVisuals();
}

// ============================================================================
// Pattern Management
// ============================================================================

async function togglePad(padId: string) {
  // Initialize audio if not started
  if (!state.isAudioStarted) {
    await initAudio();
  }

  const pad = state.pads.get(padId);
  if (!pad || !state.scheduler) return;

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

    // Register pattern with debug panel
    if (state.debugPanel) {
      const patternInspector = state.debugPanel.getPatternInspector();
      if (patternInspector) {
        patternInspector.registerPattern(padId, pad.preset.name, pad.pattern);
      }
    }

    // Auto-start playback if not already playing
    if (!state.isPlaying) {
      playAll();
    } else {
      // If already playing, schedule this pattern immediately
      state.scheduler.schedule(pad.pattern);
    }
  } else {
    // Unregister pattern from debug panel
    if (state.debugPanel) {
      const patternInspector = state.debugPanel.getPatternInspector();
      if (patternInspector) {
        patternInspector.unregisterPattern(padId);
      }
    }

    // If playing, we need to restart to remove this pattern
    if (state.isPlaying) {
      rescheduleActivePads();
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
  if (!state.scheduler) return;

  state.scheduler.stop();
  state.scheduler.clear();

  // Re-schedule all active patterns
  state.pads.forEach(pad => {
    if (pad.isActive && pad.pattern) {
      state.scheduler!.schedule(pad.pattern);
    }
  });

  state.scheduler.start();
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

      if (state.isAudioStarted) {
        togglePad(padId);
      }
    });

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
  if (!ctx || !state.waveformAnalyzer) return;

  function draw() {
    requestAnimationFrame(draw);

    if (!state.waveformAnalyzer) return;

    const waveform = state.waveformAnalyzer.getValue() as Float32Array;

    // Clear canvas
    ctx.fillStyle = '#0a0e27';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw waveform
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 2;
    ctx.beginPath();

    const sliceWidth = canvas.width / waveform.length;
    let x = 0;

    for (let i = 0; i < waveform.length; i++) {
      const v = (waveform[i] + 1) / 2; // Normalize from [-1, 1] to [0, 1]
      const y = v * canvas.height;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();
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
  const firstPad = state.pads.get('pad-0');
  if (firstPad) {
    // Compile pattern if needed
    if (!firstPad.pattern) {
      try {
        firstPad.pattern = compilePattern(firstPad.code);
      } catch (error) {
        console.error('[Contour] Failed to compile demo pattern:', error);
        return;
      }
    }

    // Set active AFTER stopAll() cleared it
    firstPad.isActive = true;
    updatePadVisual('pad-0');
    playAll();
  }

  // Add remaining pads while playing
  for (let i = 1; i < demoSequence.length; i++) {
    const { padIndex, delay } = demoSequence[i];
    setTimeout(() => {
      const padId = `pad-${padIndex}`;
      const pad = state.pads.get(padId);
      if (pad && !pad.isActive && state.isPlaying) {
        pad.isActive = true;
        if (!pad.pattern) {
          try {
            pad.pattern = compilePattern(pad.code);
          } catch (error) {
            console.error(`[Contour] Failed to compile pattern for ${padId}:`, error);
            return;
          }
        }
        // Schedule this new pattern
        if (state.scheduler) {
          state.scheduler.schedule(pad.pattern);
        }
        updatePadVisual(padId);
      }
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

  elements.metronomeCheck.addEventListener('change', (e) => {
    state.metronomeEnabled = (e.target as HTMLInputElement).checked;
    // TODO: Implement metronome
    console.log('[Contour] Metronome:', state.metronomeEnabled);
  });

  elements.clearAllBtn.addEventListener('click', clearAll);
  elements.demoBtn.addEventListener('click', playDemoJam);

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

  console.log('[Contour] Debug UI initialized');
  console.log('[Contour] Press ? for keyboard shortcuts, Cmd+D for debug panel, Cmd+K for playground');

  console.log(`
╔════════════════════════════════════════╗
║                                        ║
║   🎵 Contour Live Performance 🎵      ║
║                                        ║
║  Click pads or "Start Demo Jam"!       ║
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
