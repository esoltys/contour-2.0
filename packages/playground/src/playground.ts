import { Pattern } from '@contour/core';
import loader from '@monaco-editor/loader';
import type * as Monaco from 'monaco-editor';
import { DebugPanel } from './ui/DebugPanel.js';
import { PatternPlayground } from './ui/PatternPlayground.js';
import { KeyboardShortcuts } from './ui/KeyboardShortcuts.js';
import { LoadingProgress } from './ui/LoadingProgress.js';
import {
  PlaygroundState,
  initUIElements,
  AudioManager,
  PatternManager,
  PianoRollVisualizer,
  KeyboardShortcutHandler
} from './modules/index.js';
import './ui/debug-panel.css';

// ============================================================================
// Application Instance
// ============================================================================

class PlaygroundApplication {
  private state: PlaygroundState;
  private elements: ReturnType<typeof initUIElements>;
  private audioManager: AudioManager;
  private patternManager: PatternManager;
  private visualizer: PianoRollVisualizer;
  private keyboardHandler: KeyboardShortcutHandler;

  constructor() {
    this.state = new PlaygroundState();
    this.elements = initUIElements();
    this.audioManager = new AudioManager(this.state, this.elements);
    this.patternManager = new PatternManager(this.state, this.audioManager);
    this.visualizer = new PianoRollVisualizer(
      this.state,
      this.elements.waveformCanvas
    );

    this.keyboardHandler = new KeyboardShortcutHandler(
      this.state,
      this.elements,
      {
        onTogglePad: (padId) => this.togglePad(padId),
        onOpenEditor: (padId) => this.openEditor(padId),
        onPlayPause: () => this.togglePlayback(),
        onStop: () => this.audioManager.pause(),
        onToggleSamples: () => this.toggleSamples(),
        onCloseEditor: () => this.closeEditor()
      }
    );

    this.audioManager.setVisualizationCallback(() => this.visualizer.start());
  }

  init(): void {
    console.log('[Contour] Initializing performance interface...');

    this.initGrid();
    this.initEventListeners();
    this.initDebugUI();
    this.keyboardHandler.attach();

    this.printBanner();
  }

  private initGrid(): void {
    this.elements.performanceGrid.innerHTML = '';

    this.state.pads.forEach((pad, padId) => {
      const padElement = document.createElement('div');
      padElement.className = 'pad';
      padElement.dataset.padId = padId;

      padElement.innerHTML = `
        <div class="pad-edit">Edit Pattern</div>
        <div class="pad-icon">${pad.preset.icon}</div>
        <div class="pad-name">${pad.preset.name}</div>
      `;

      padElement.addEventListener('click', (e) => {
        if ((e.target as HTMLElement).classList.contains('pad-edit')) {
          e.stopPropagation();
          this.openEditor(padId);
          return;
        }
        this.togglePad(padId);
      });

      padElement.addEventListener('mouseenter', () => {
        this.handlePadFocus(padId);
      });

      this.updatePadBadge(padId, pad.instrument || 'synth');
      this.elements.performanceGrid.appendChild(padElement);
    });
  }

  private initEventListeners(): void {
    // Transport controls
    this.elements.playBtn.addEventListener('click', () =>
      this.togglePlayback()
    );

    this.elements.bpmSlider.addEventListener('input', (e) => {
      const bpm = parseInt((e.target as HTMLInputElement).value);
      this.audioManager.setTempo(bpm);
    });

    this.elements.volumeSlider.addEventListener('input', (e) => {
      const volume = parseInt((e.target as HTMLInputElement).value);
      this.audioManager.setVolume(volume);
    });

    this.elements.clearAllBtn.addEventListener('click', () => this.clearAll());
    this.elements.demoBtn.addEventListener('click', () => this.playDemoJam());
    this.elements.toggleSamplesBtn.addEventListener('click', () =>
      this.toggleSamples()
    );

    this.elements.debugPanelBtn.addEventListener('click', () => {
      this.state.debugPanel?.toggle();
    });

    // Editor modal
    this.elements.closeEditorBtn.addEventListener('click', () =>
      this.closeEditor()
    );
    this.elements.cancelEditorBtn.addEventListener('click', () =>
      this.closeEditor()
    );
    this.elements.applyEditorBtn.addEventListener('click', () =>
      this.applyEditorChanges()
    );

    this.elements.editorModal.addEventListener('click', (e) => {
      if (e.target === this.elements.editorModal) {
        this.closeEditor();
      }
    });
  }

  private initDebugUI(): void {
    this.state.debugPanel = new DebugPanel({
      initialTab: 'transport',
      position: 'bottom',
      visible: false
    });

    this.state.patternPlayground = new PatternPlayground({
      onAddToGrid: (code: string, patternInstance: Pattern) => {
        console.log('[Contour] Adding pattern from playground to grid');
        alert('Pattern added! (Grid integration coming soon)');
      },
      onClose: () => console.log('[Contour] Playground closed')
    });

    this.state.keyboardShortcuts = new KeyboardShortcuts();
    this.state.loadingProgress = new LoadingProgress();

    console.log('[Contour] Debug UI initialized');
  }

  private async togglePad(padId: string): Promise<void> {
    await this.patternManager.togglePad(padId);
    this.updatePadVisual(padId);

    const pad = this.state.getPad(padId);
    if (pad?.isActive && !this.state.isPlaying) {
      this.audioManager.play();
      this.updateAllPadVisuals();
    }
  }

  private togglePlayback(): void {
    if (this.state.isPlaying) {
      this.audioManager.pause();
    } else {
      this.audioManager.play();
    }
    this.updateAllPadVisuals();
  }

  private clearAll(): void {
    this.audioManager.stop();
    this.updateAllPadVisuals();
  }

  private async toggleSamples(): Promise<void> {
    await this.audioManager.toggleSamples(
      () => this.patternManager.rescheduleActivePads(),
      (padId, instrument) => this.updatePadBadge(padId, instrument)
    );
  }

  private updatePadVisual(padId: string): void {
    const padElement = document.querySelector(`[data-pad-id="${padId}"]`);
    const pad = this.state.getPad(padId);

    if (!padElement || !pad) return;

    if (pad.isActive) {
      padElement.classList.add('active');
    } else {
      padElement.classList.remove('active');
    }
  }

  private updateAllPadVisuals(): void {
    this.state.pads.forEach((_, padId) => {
      this.updatePadVisual(padId);
    });
  }

  private updatePadBadge(padId: string, instrument: string): void {
    const padElement = document.querySelector(
      `[data-pad-id="${padId}"]`
    ) as HTMLElement;
    if (!padElement) return;

    const existingBadge = padElement.querySelector('.pad-badge');
    if (existingBadge) {
      existingBadge.remove();
    }

    const badge = document.createElement('div');
    badge.className = 'pad-badge';

    const isSampled =
      instrument && instrument !== 'synth' && instrument.includes(':');
    badge.classList.add(isSampled ? 'badge-sample' : 'badge-synth');

    let displayName = 'Synth';
    if (isSampled) {
      const parts = instrument.split(':');
      if (parts.length === 2) {
        displayName = parts[1].replace(/_/g, ' ');
        if (displayName.length > 12) {
          displayName = displayName.substring(0, 12) + '...';
        }
      }
    }

    badge.textContent = displayName;
    badge.title = instrument;
    padElement.appendChild(badge);
  }

  private handlePadFocus(padId: string): void {
    this.state.focusedPadId = padId;

    const pads = document.querySelectorAll('.pad');
    pads.forEach((pad) => pad.classList.remove('focused'));

    const padElement = document.querySelector(`[data-pad-id="${padId}"]`);
    if (padElement) {
      padElement.classList.add('focused');
    }
  }

  private async initMonaco(): Promise<void> {
    if (this.state.monaco) return;

    try {
      this.state.monaco = await loader.init();

      this.state.monaco.languages.typescript.typescriptDefaults.addExtraLib(
        `
        import { PatternBuilder } from '@contour/core';
        declare function pattern(): PatternBuilder;
      `,
        'ts:contour-runtime.d.ts'
      );

      this.state.editor = this.state.monaco.editor.create(
        this.elements.monacoEditor,
        {
          value: '',
          language: 'typescript',
          theme: 'vs-dark',
          minimap: { enabled: false },
          fontSize: 14,
          lineNumbers: 'off',
          scrollBeyondLastLine: false,
          automaticLayout: true,
          padding: { top: 16, bottom: 16 }
        }
      );

      this.state.editor.addCommand(
        this.state.monaco.KeyMod.CtrlCmd | this.state.monaco.KeyCode.Enter,
        () => this.applyEditorChanges()
      );

      console.log('[Contour] Monaco editor initialized');
    } catch (error) {
      console.error('[Contour] Failed to initialize Monaco:', error);
    }
  }

  private openEditor(padId: string): void {
    const pad = this.state.getPad(padId);
    if (!pad) return;

    this.state.currentEditingPad = padId;

    if (!this.state.editor) {
      this.initMonaco().then(() => {
        if (this.state.editor) {
          this.state.editor.setValue(pad.code);
        }
      });
    } else {
      this.state.editor.setValue(pad.code);
    }

    this.elements.editorTitle.textContent = `Edit Pattern: ${pad.preset.name}`;
    this.elements.editorModal.classList.add('active');

    setTimeout(() => this.state.editor?.focus(), 100);
  }

  private closeEditor(): void {
    this.elements.editorModal.classList.remove('active');
    this.state.currentEditingPad = null;
  }

  private applyEditorChanges(): void {
    if (!this.state.currentEditingPad || !this.state.editor) return;

    const newCode = this.state.editor.getValue();

    try {
      this.patternManager.updatePatternCode(
        this.state.currentEditingPad,
        newCode
      );
      this.closeEditor();
    } catch (error) {
      alert(
        `Failed to compile pattern:\n${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private async playDemoJam(): Promise<void> {
    if (this.state.isDemoRunning) return;

    this.state.isDemoRunning = true;
    this.elements.demoBtn.disabled = true;

    if (!this.audioManager.isAudioReady()) {
      await this.audioManager.initialize();
    }

    console.log('[Contour] Starting demo jam...');
    this.audioManager.pause();

    const demoSequence = [
      { padIndex: 0, delay: 500 },
      { padIndex: 2, delay: 2000 },
      { padIndex: 4, delay: 4000 },
      { padIndex: 8, delay: 6000 },
      { padIndex: 1, delay: 8000 },
      { padIndex: 9, delay: 10000 }
    ];

    this.togglePad('pad-0');

    for (let i = 1; i < demoSequence.length; i++) {
      const { padIndex, delay } = demoSequence[i];
      setTimeout(() => {
        this.togglePad(`pad-${padIndex}`);
      }, delay);
    }

    setTimeout(() => {
      this.state.isDemoRunning = false;
      this.elements.demoBtn.disabled = false;
    }, demoSequence[demoSequence.length - 1].delay + 1000);
  }

  private printBanner(): void {
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
}

// ============================================================================
// Application Entry Point
// ============================================================================

const app = new PlaygroundApplication();
app.init();

// Export for HMR
export function init(): void {
  const newApp = new PlaygroundApplication();
  newApp.init();
}
