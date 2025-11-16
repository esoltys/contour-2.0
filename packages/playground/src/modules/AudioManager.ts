import {
  Tone,
  SampleLibraryManager,
  DrumAdapter
} from '@contour/tone-adapter';
import { PlaygroundState, PlaygroundUIElements } from './PlaygroundState.js';
import { InstrumentSelector } from '../ui/InstrumentSelector.js';
import { SampleLibraryPanel } from '../ui/SampleLibraryPanel.js';

// ============================================================================
// Audio Manager
// ============================================================================

export class AudioManager {
  private state: PlaygroundState;
  private elements: PlaygroundUIElements;
  private visualizationCallback: (() => void) | null = null;

  constructor(state: PlaygroundState, elements: PlaygroundUIElements) {
    this.state = state;
    this.elements = elements;
  }

  setVisualizationCallback(callback: () => void): void {
    this.visualizationCallback = callback;
  }

  async initialize(): Promise<void> {
    try {
      console.log('[Contour] Initializing audio system...');

      await Tone.start();
      Tone.getDestination().volume.value = this.state.volume;

      this.state.isAudioStarted = true;
      this.enableControls();

      if (this.visualizationCallback) {
        this.visualizationCallback();
      }

      console.log('[Contour] Audio system ready!');

      if (this.state.useSamples) {
        await this.loadSampleInstruments();
      }
    } catch (error) {
      console.error('[Contour] Failed to initialize audio:', error);
      alert('Failed to start audio system. Please try again.');
    }
  }

  private enableControls(): void {
    this.elements.playBtn.disabled = false;
    this.elements.bpmSlider.disabled = false;
    this.elements.volumeSlider.disabled = false;
    this.elements.clearAllBtn.disabled = false;
    this.elements.demoBtn.disabled = false;
    this.elements.toggleSamplesBtn.disabled = false;
  }

  setTempo(bpm: number): void {
    this.state.bpm = bpm;
    this.state.pads.forEach((pad) => {
      if (pad.scheduler) {
        pad.scheduler.setTempo(bpm);
      }
    });
    this.elements.bpmValue.textContent = bpm.toString();
  }

  setVolume(db: number): void {
    this.state.volume = db;
    Tone.getDestination().volume.value = db;
    this.elements.volumeValue.textContent = `${db}dB`;
  }

  play(): void {
    if (this.state.isPlaying) return;

    console.log('[Contour] Starting playback...');
    this.state.isPlaying = true;

    Tone.Transport.start();
    this.elements.playBtn.textContent = 'Pause';
  }

  pause(): void {
    console.log('[Contour] Pausing playback...');
    this.state.isPlaying = false;

    Tone.Transport.stop();
    this.elements.playBtn.textContent = 'Play';
  }

  stop(): void {
    console.log('[Contour] Clearing all patterns...');
    this.state.isPlaying = false;

    Tone.Transport.stop();
    this.state.clearAllPads();
  }

  async loadSampleInstruments(): Promise<void> {
    try {
      if (!this.state.sampleLibraryManager) {
        this.state.sampleLibraryManager = new SampleLibraryManager();
        await this.state.sampleLibraryManager.initialize(
          Tone.context.rawContext as AudioContext
        );

        if (!this.state.instrumentSelector) {
          this.state.instrumentSelector = new InstrumentSelector(
            this.state.sampleLibraryManager,
            Tone.context.rawContext as AudioContext,
            (padId: string, instrument: string) => {
              this.updatePadInstrument(padId, instrument);
            }
          );
        }

        if (!this.state.sampleLibraryPanel) {
          this.state.sampleLibraryPanel = new SampleLibraryPanel(
            this.state.sampleLibraryManager
          );
        }
      }

      this.state.loadingProgress?.show('Loading sample instruments...');

      const instrumentNames = this.collectInstrumentNames();
      const validInstrumentNames = instrumentNames.filter(
        (name) => name && typeof name === 'string' && name !== 'undefined'
      );

      console.log('[Contour] Loading instruments:', validInstrumentNames);

      const total = validInstrumentNames.length + 1; // +1 for drum kit
      let loaded = 0;
      const failedInstruments: string[] = [];

      // Load melodic instruments
      for (const name of validInstrumentNames) {
        this.state.loadingProgress?.updateProgress(loaded, total, name);
        try {
          await this.state.sampleLibraryManager.loadInstrument({
            instrument: name
          });
          loaded++;
        } catch (error) {
          failedInstruments.push(name);
          console.error(
            `[Contour] Failed to load instrument ${name}:`,
            error
          );
        }
      }

      // Load drum kit
      this.state.loadingProgress?.updateProgress(loaded, total, 'CR78 drum kit');
      try {
        const drumAdapter = new DrumAdapter('CR78');
        await drumAdapter.waitForLoad();
        this.state.drumAdapter = drumAdapter;
        loaded++;
      } catch (error) {
        failedInstruments.push('CR78 drum kit');
        console.error('[Contour] Failed to load CR78 drum kit:', error);
      }

      this.state.loadingProgress?.updateProgress(loaded, total);

      if (failedInstruments.length > 0) {
        this.state.loadingProgress?.showError(
          `Loaded ${loaded}/${total} instruments. Failed: ${failedInstruments.join(', ')}`
        );
      } else {
        this.state.loadingProgress?.showSuccess(`All ${total} instruments loaded!`);
      }

      console.log('[Contour] Sample instruments loaded');
    } catch (error) {
      console.error('[Contour] Failed to load sample instruments:', error);
      this.state.loadingProgress?.showError(
        error instanceof Error ? error.message : 'Unknown error'
      );
      throw error;
    }
  }

  private collectInstrumentNames(): string[] {
    const instrumentNames = new Set<string>();

    Object.entries(this.state.instrumentMap).forEach(([, categoryMap]) => {
      Object.entries(categoryMap).forEach(([, instrumentName]) => {
        if (instrumentName && typeof instrumentName === 'string') {
          instrumentNames.add(instrumentName);
        }
      });
    });

    return Array.from(instrumentNames);
  }

  updatePadInstrument(padId: string, instrument: string): void {
    const padData = this.state.getPad(padId);
    if (!padData) return;

    this.state.setPadInstrument(padId, instrument);
    console.log(`[Contour] Updated pad ${padId} instrument to ${instrument}`);
  }

  async toggleSamples(
    rescheduleCallback: () => void,
    updateBadgeCallback: (padId: string, instrument: string) => void
  ): Promise<void> {
    if (!this.state.isAudioStarted) {
      await this.initialize();
    }

    const toggleBtn = this.elements.toggleSamplesBtn;

    if (this.state.useSamples) {
      // Switching to synths
      this.state.useSamples = false;
      toggleBtn.textContent = '🎻 Use Samples';
      console.log('[Contour] Switched to synthesized instruments');

      this.state.pads.forEach((pad) => {
        updateBadgeCallback(pad.id, 'synth');
      });
    } else {
      // Switching to samples
      try {
        toggleBtn.disabled = true;

        const wasPlaying = this.state.isPlaying;
        if (wasPlaying) {
          this.pause();
        }

        await this.loadSampleInstruments();

        this.state.useSamples = true;
        toggleBtn.textContent = '🎹 Use Synths';
        console.log('[Contour] Switched to sampled instruments');

        // Update badges
        this.state.pads.forEach((pad) => {
          const instrumentName = this.getInstrumentForPad(pad);
          updateBadgeCallback(pad.id, instrumentName);
        });

        if (wasPlaying) {
          rescheduleCallback();
          this.play();
        }
      } catch (error) {
        console.error('[Contour] Failed to load samples:', error);
        toggleBtn.textContent = '🎻 Use Samples';
        return;
      } finally {
        toggleBtn.disabled = false;
      }
    }

    if (this.state.isPlaying) {
      rescheduleCallback();
    }
  }

  getInstrumentForPad(
    pad: { preset: { category: string; id: string } }
  ): string {
    const categoryMap =
      this.state.instrumentMap[
        pad.preset.category as keyof typeof this.state.instrumentMap
      ];

    if (pad.preset.category === 'drums') {
      return 'MusyngKite:drums';
    }

    if (categoryMap) {
      const gmInstrument = categoryMap[pad.preset.id as keyof typeof categoryMap];
      if (gmInstrument) {
        return `MusyngKite:${gmInstrument}`;
      }
    }

    return 'synth';
  }

  getAudioContext(): AudioContext {
    return Tone.context.rawContext as AudioContext;
  }

  isAudioReady(): boolean {
    return this.state.isAudioStarted;
  }

  getSampleLibraryManager(): SampleLibraryManager | null {
    return this.state.sampleLibraryManager;
  }

  getDrumAdapter(): DrumAdapter | null {
    return this.state.drumAdapter;
  }

  isUsingSamples(): boolean {
    return this.state.useSamples;
  }

  getBPM(): number {
    return this.state.bpm;
  }
}
