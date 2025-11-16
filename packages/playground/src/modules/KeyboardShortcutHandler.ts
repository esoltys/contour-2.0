import { PlaygroundState, PlaygroundUIElements } from './PlaygroundState.js';

// ============================================================================
// Types
// ============================================================================

export interface KeyboardHandlerCallbacks {
  onTogglePad: (padId: string) => void;
  onOpenEditor: (padId: string) => void;
  onPlayPause: () => void;
  onStop: () => void;
  onToggleSamples: () => void;
  onCloseEditor: () => void;
}

interface KeyCodeMap {
  [code: string]: number;
}

// ============================================================================
// Keyboard Shortcut Handler
// ============================================================================

export class KeyboardShortcutHandler {
  private state: PlaygroundState;
  private elements: PlaygroundUIElements;
  private callbacks: KeyboardHandlerCallbacks;
  private boundHandler: (e: KeyboardEvent) => void;

  // Map keyboard codes to pad indices
  private static PAD_KEY_MAP: KeyCodeMap = {
    Digit1: 0,
    Digit2: 1,
    Digit3: 2,
    Digit4: 3,
    KeyQ: 4,
    KeyW: 5,
    KeyE: 6,
    KeyR: 7,
    KeyA: 8,
    KeyS: 9,
    KeyD: 10,
    KeyF: 11,
    KeyZ: 12,
    KeyX: 13,
    KeyC: 14,
    KeyV: 15
  };

  constructor(
    state: PlaygroundState,
    elements: PlaygroundUIElements,
    callbacks: KeyboardHandlerCallbacks
  ) {
    this.state = state;
    this.elements = elements;
    this.callbacks = callbacks;
    this.boundHandler = this.handleKeyDown.bind(this);
  }

  attach(): void {
    document.addEventListener('keydown', this.boundHandler);
  }

  detach(): void {
    document.removeEventListener('keydown', this.boundHandler);
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Handle help overlay toggle
    if (this.handleHelpShortcut(e)) return;

    // Handle debug panel toggle
    if (this.handleDebugPanelShortcut(e)) return;

    // Handle pattern playground toggle
    if (this.handlePlaygroundShortcut(e)) return;

    // Handle escape key
    if (this.handleEscapeKey(e)) return;

    // Skip if typing in input or modal is open
    if (this.shouldIgnoreInput(e)) return;

    // Handle playback controls
    if (this.handlePlaybackShortcuts(e)) return;

    // Handle instrument selection
    if (this.handleInstrumentShortcut(e)) return;

    // Handle sample library panel
    if (this.handleSampleLibraryShortcut(e)) return;

    // Handle samples toggle
    if (this.handleSamplesToggleShortcut(e)) return;

    // Handle pad shortcuts
    this.handlePadShortcuts(e);
  }

  private handleHelpShortcut(e: KeyboardEvent): boolean {
    if (e.key === '?' && !e.shiftKey) {
      e.preventDefault();
      if (this.state.keyboardShortcuts) {
        this.state.keyboardShortcuts.toggle();
      }
      return true;
    }
    return false;
  }

  private handleDebugPanelShortcut(e: KeyboardEvent): boolean {
    if ((e.metaKey || e.ctrlKey) && e.key === 'd') {
      e.preventDefault();
      if (this.state.debugPanel) {
        this.state.debugPanel.toggle();
      }
      return true;
    }
    return false;
  }

  private handlePlaygroundShortcut(e: KeyboardEvent): boolean {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if (this.state.patternPlayground) {
        this.state.patternPlayground.show();
      }
      return true;
    }
    return false;
  }

  private handleEscapeKey(e: KeyboardEvent): boolean {
    if (e.key !== 'Escape') return false;

    if (this.elements.editorModal.classList.contains('active')) {
      this.callbacks.onCloseEditor();
      return true;
    }

    if (this.state.keyboardShortcuts?.isVisible()) {
      this.state.keyboardShortcuts.hide();
      return true;
    }

    if (this.state.patternPlayground?.isVisible()) {
      this.state.patternPlayground.hide();
      return true;
    }

    this.callbacks.onStop();
    return true;
  }

  private shouldIgnoreInput(e: KeyboardEvent): boolean {
    return (
      this.elements.editorModal.classList.contains('active') ||
      e.target instanceof HTMLInputElement
    );
  }

  private handlePlaybackShortcuts(e: KeyboardEvent): boolean {
    if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      this.callbacks.onPlayPause();
      return true;
    }
    return false;
  }

  private handleInstrumentShortcut(e: KeyboardEvent): boolean {
    if (
      (e.key === 'i' || e.key === 'I') &&
      !e.shiftKey &&
      !e.metaKey &&
      !e.ctrlKey
    ) {
      e.preventDefault();
      if (this.state.focusedPadId && this.state.instrumentSelector) {
        const padData = this.state.getPad(this.state.focusedPadId);
        this.state.instrumentSelector.show(
          this.state.focusedPadId,
          padData?.instrument
        );
      }
      return true;
    }
    return false;
  }

  private handleSampleLibraryShortcut(e: KeyboardEvent): boolean {
    if (
      (e.key === 'l' || e.key === 'L') &&
      !e.shiftKey &&
      !e.metaKey &&
      !e.ctrlKey
    ) {
      e.preventDefault();
      if (this.state.sampleLibraryPanel) {
        this.state.sampleLibraryPanel.toggle();
      }
      return true;
    }
    return false;
  }

  private handleSamplesToggleShortcut(e: KeyboardEvent): boolean {
    if (e.shiftKey && e.code === 'KeyS') {
      e.preventDefault();
      this.callbacks.onToggleSamples();
      return true;
    }
    return false;
  }

  private handlePadShortcuts(e: KeyboardEvent): void {
    const padIndex = KeyboardShortcutHandler.PAD_KEY_MAP[e.code];
    if (padIndex === undefined) return;

    const padId = `pad-${padIndex}`;

    if (e.shiftKey) {
      e.preventDefault();
      this.callbacks.onOpenEditor(padId);
    } else {
      this.callbacks.onTogglePad(padId);
    }
  }
}
