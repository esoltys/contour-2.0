import { Pattern, pattern } from '@contour/core';
import {
  PatternScheduler,
  SampleAdapter,
  SynthAdapter,
  type InstrumentAdapter
} from '@contour/tone-adapter';
import { PlaygroundState, PadState } from './PlaygroundState.js';
import { AudioManager } from './AudioManager.js';

// ============================================================================
// Pattern Manager
// ============================================================================

export class PatternManager {
  private state: PlaygroundState;
  private audioManager: AudioManager;

  constructor(state: PlaygroundState, audioManager: AudioManager) {
    this.state = state;
    this.audioManager = audioManager;
  }

  compilePattern(code: string): Pattern {
    const patternFunc = new Function('pattern', `return ${code}`);
    const result = patternFunc(pattern);

    if (!result || typeof result.build !== 'function') {
      throw new Error('Pattern code must return a PatternBuilder');
    }

    return result.build();
  }

  async togglePad(padId: string): Promise<void> {
    if (!this.audioManager.isAudioReady()) {
      await this.audioManager.initialize();
    }

    const pad = this.state.getPad(padId);
    if (!pad) return;

    this.state.setPadActive(padId, !pad.isActive);

    if (!pad.isActive) {
      // Was inactive, now activating
      await this.activatePad(pad);
    } else {
      // Was active, now deactivating
      this.deactivatePad(pad);
    }
  }

  private async activatePad(pad: PadState): Promise<void> {
    if (!pad.pattern) {
      try {
        pad.pattern = this.compilePattern(pad.code);
      } catch (error) {
        console.error(
          `[Contour] Failed to compile pattern for ${pad.id}:`,
          error
        );
        this.state.setPadActive(pad.id, false);
        alert(
          `Failed to compile pattern: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        return;
      }
    }

    const instrument = this.createInstrumentAdapter(pad);
    const scheduler = new PatternScheduler(instrument);
    scheduler.setTempo(this.audioManager.getBPM());
    scheduler.schedule(pad.pattern);

    this.state.setPadScheduler(pad.id, scheduler);

    // Register with debug panel
    if (this.state.debugPanel) {
      const patternInspector = this.state.debugPanel.getPatternInspector();
      if (patternInspector) {
        patternInspector.registerPattern(pad.id, pad.preset.name, pad.pattern);
      }
    }

    console.log(`[Contour] Activated pad ${pad.id}: ${pad.preset.name}`);
  }

  private deactivatePad(pad: PadState): void {
    // Unregister from debug panel
    if (this.state.debugPanel) {
      const patternInspector = this.state.debugPanel.getPatternInspector();
      if (patternInspector) {
        patternInspector.unregisterPattern(pad.id);
      }
    }

    if (pad.scheduler) {
      pad.scheduler.clear();
      pad.scheduler.dispose();
      this.state.setPadScheduler(pad.id, null);
    }

    console.log(`[Contour] Deactivated pad ${pad.id}`);
  }

  private createInstrumentAdapter(pad: PadState): InstrumentAdapter {
    if (!this.audioManager.isUsingSamples()) {
      console.log(`[Contour] Using synth for ${pad.preset.name}`);
      return new SynthAdapter();
    }

    if (pad.preset.category === 'drums') {
      const drumAdapter = this.audioManager.getDrumAdapter();
      if (drumAdapter) {
        console.log(
          `[Contour] Using CR78 drum samples for ${pad.preset.name}`
        );
        return drumAdapter;
      }
      console.warn(
        `[Contour] Drum adapter not loaded, falling back to synth`
      );
      return new SynthAdapter();
    }

    // Melodic instrument
    const instrumentMap = this.state.instrumentMap;
    const categoryMap =
      instrumentMap[pad.preset.category as keyof typeof instrumentMap];

    if (!categoryMap) {
      console.warn(
        `[Contour] No category mapping for ${pad.preset.category}, falling back to synth`
      );
      return new SynthAdapter();
    }

    const instrumentName =
      categoryMap[pad.preset.id as keyof typeof categoryMap];
    const sampleLibraryManager = this.audioManager.getSampleLibraryManager();

    if (!instrumentName || !sampleLibraryManager) {
      console.warn(
        `[Contour] No instrument mapping for ${pad.preset.category}/${pad.preset.id}, falling back to synth`
      );
      return new SynthAdapter();
    }

    const soundfontInst = sampleLibraryManager.getInstrument(instrumentName);
    console.log(
      `[Contour] Using sample instrument: ${instrumentName} for ${pad.preset.name}`
    );

    return new SampleAdapter(soundfontInst, this.audioManager.getAudioContext());
  }

  rescheduleActivePads(): void {
    this.state.pads.forEach((pad) => {
      if (pad.isActive && pad.scheduler && pad.pattern) {
        pad.scheduler.clear();
        pad.scheduler.schedule(pad.pattern);
      }
    });
  }

  updatePatternCode(padId: string, code: string): void {
    const pad = this.state.getPad(padId);
    if (!pad) return;

    try {
      const newPattern = this.compilePattern(code);

      this.state.setPadCode(padId, code);
      this.state.setPadPattern(padId, newPattern);

      // Update pattern in debug panel
      if (this.state.debugPanel && pad.isActive) {
        const patternInspector = this.state.debugPanel.getPatternInspector();
        if (patternInspector) {
          patternInspector.updatePattern(padId, newPattern);
        }
      }

      if (pad.isActive && this.state.isPlaying) {
        this.rescheduleActivePads();
      }

      console.log(`[Contour] Pattern updated for ${padId}`);
    } catch (error) {
      console.error(`[Contour] Failed to update pattern for ${padId}:`, error);
      throw error;
    }
  }
}
