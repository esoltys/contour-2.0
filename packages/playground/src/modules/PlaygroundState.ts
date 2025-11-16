import { Pattern } from '@contour/core';
import {
  PatternScheduler,
  SampleLibraryManager,
  DrumAdapter
} from '@contour/tone-adapter';
import type { PatternPreset } from '../patterns/presets.js';
import { PATTERN_PRESETS } from '../patterns/presets.js';
import type * as Monaco from 'monaco-editor';
import { DebugPanel } from '../ui/DebugPanel.js';
import { PatternPlayground } from '../ui/PatternPlayground.js';
import { KeyboardShortcuts } from '../ui/KeyboardShortcuts.js';
import { InstrumentSelector } from '../ui/InstrumentSelector.js';
import { SampleLibraryPanel } from '../ui/SampleLibraryPanel.js';
import { LoadingProgress } from '../ui/LoadingProgress.js';
import { DEFAULT_BPM } from '../constants.js';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface PadState {
  id: string;
  preset: PatternPreset;
  pattern: Pattern | null;
  scheduler: PatternScheduler | null;
  isActive: boolean;
  code: string;
  instrument?: string;
}

export interface InstrumentMap {
  bass: Record<string, string>;
  melody: Record<string, string>;
  effects: Record<string, string>;
}

export interface PlaygroundUIElements {
  // Transport controls
  playBtn: HTMLButtonElement;
  bpmSlider: HTMLInputElement;
  bpmValue: HTMLSpanElement;
  volumeSlider: HTMLInputElement;
  volumeValue: HTMLSpanElement;
  clearAllBtn: HTMLButtonElement;
  demoBtn: HTMLButtonElement;
  toggleSamplesBtn: HTMLButtonElement;
  debugPanelBtn: HTMLButtonElement;

  // Grid
  performanceGrid: HTMLDivElement;

  // Modal
  editorModal: HTMLDivElement;
  editorTitle: HTMLElement;
  monacoEditor: HTMLDivElement;
  closeEditorBtn: HTMLButtonElement;
  cancelEditorBtn: HTMLButtonElement;
  applyEditorBtn: HTMLButtonElement;

  // Visualization
  waveformCanvas: HTMLCanvasElement;
}

// ============================================================================
// State Management
// ============================================================================

export class PlaygroundState {
  pads: Map<string, PadState> = new Map();
  isAudioStarted = false;
  isPlaying = false;
  isDemoRunning = false;
  bpm = DEFAULT_BPM;
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
  drumAdapter: DrumAdapter | null = null;
  useSamples = true;

  // UI state
  focusedPadId: string | null = null;

  // Instrument mapping for each category
  instrumentMap: InstrumentMap = {
    bass: {
      'bass-groove': 'electric_bass_finger',
      'acid-bass': 'synth_bass_1',
      'walking-bass': 'acoustic_bass',
      'sub-bass': 'synth_bass_2'
    },
    melody: {
      arpeggio: 'acoustic_grand_piano',
      'melody-lead': 'lead_1_square',
      'fast-arp': 'electric_piano_1',
      pentatonic: 'acoustic_guitar_nylon'
    },
    effects: {
      'ambient-swell': 'pad_2_warm',
      'stab-chord': 'string_ensemble_1',
      texture: 'fx_5_brightness',
      riser: 'pad_4_choir'
    }
  };

  constructor() {
    this.initializePads();
  }

  private initializePads(): void {
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

  getPad(padId: string): PadState | undefined {
    return this.pads.get(padId);
  }

  setPadPattern(padId: string, pattern: Pattern): void {
    const pad = this.pads.get(padId);
    if (pad) {
      pad.pattern = pattern;
    }
  }

  setPadCode(padId: string, code: string): void {
    const pad = this.pads.get(padId);
    if (pad) {
      pad.code = code;
    }
  }

  setPadActive(padId: string, active: boolean): void {
    const pad = this.pads.get(padId);
    if (pad) {
      pad.isActive = active;
    }
  }

  setPadScheduler(padId: string, scheduler: PatternScheduler | null): void {
    const pad = this.pads.get(padId);
    if (pad) {
      pad.scheduler = scheduler;
    }
  }

  setPadInstrument(padId: string, instrument: string): void {
    const pad = this.pads.get(padId);
    if (pad) {
      pad.instrument = instrument;
    }
  }

  getActivePads(): PadState[] {
    return Array.from(this.pads.values()).filter((pad) => pad.isActive);
  }

  clearPadState(padId: string): void {
    const pad = this.pads.get(padId);
    if (pad) {
      pad.isActive = false;
      pad.pattern = null;
      if (pad.scheduler) {
        pad.scheduler.clear();
        pad.scheduler.dispose();
        pad.scheduler = null;
      }
    }
  }

  clearAllPads(): void {
    this.pads.forEach((pad) => {
      this.clearPadState(pad.id);
    });
  }
}

// ============================================================================
// UI Element Initialization
// ============================================================================

export function initUIElements(): PlaygroundUIElements {
  return {
    // Transport controls
    playBtn: document.getElementById('playBtn') as HTMLButtonElement,
    bpmSlider: document.getElementById('bpmSlider') as HTMLInputElement,
    bpmValue: document.getElementById('bpmValue') as HTMLSpanElement,
    volumeSlider: document.getElementById('volumeSlider') as HTMLInputElement,
    volumeValue: document.getElementById('volumeValue') as HTMLSpanElement,
    clearAllBtn: document.getElementById('clearAllBtn') as HTMLButtonElement,
    demoBtn: document.getElementById('demoBtn') as HTMLButtonElement,
    toggleSamplesBtn: document.getElementById(
      'toggleSamplesBtn'
    ) as HTMLButtonElement,
    debugPanelBtn: document.getElementById(
      'debugPanelBtn'
    ) as HTMLButtonElement,

    // Grid
    performanceGrid: document.getElementById(
      'performanceGrid'
    ) as HTMLDivElement,

    // Modal
    editorModal: document.getElementById('editorModal') as HTMLDivElement,
    editorTitle: document.getElementById('editorTitle') as HTMLElement,
    monacoEditor: document.getElementById('monacoEditor') as HTMLDivElement,
    closeEditorBtn: document.getElementById(
      'closeEditorBtn'
    ) as HTMLButtonElement,
    cancelEditorBtn: document.getElementById(
      'cancelEditorBtn'
    ) as HTMLButtonElement,
    applyEditorBtn: document.getElementById(
      'applyEditorBtn'
    ) as HTMLButtonElement,

    // Visualization
    waveformCanvas: document.getElementById(
      'waveformCanvas'
    ) as HTMLCanvasElement
  };
}
