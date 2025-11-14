/**
 * PROTOTYPE: Minimal SampleLibraryManager using soundfont-player
 *
 * This is a quick proof-of-concept to validate:
 * 1. Can we load soundfonts in the browser?
 * 2. How do they integrate with Tone.js?
 * 3. What's the performance/memory impact?
 *
 * NOTE: soundfont-player uses pre-rendered audio files from CDN,
 * not raw .sf2 files. This is simpler for prototyping but we may
 * want to support actual .sf2 files later.
 */

import Soundfont from 'soundfont-player';

/**
 * Minimal configuration for prototype
 */
export interface SampleLibraryConfig {
  /** Instrument name (from soundfont-player library) */
  instrument: string;

  /** Format: 'mp3' or 'ogg' */
  format?: 'mp3' | 'ogg';

  /** Base URL for soundfont files */
  soundfont?: string;
}

/**
 * Simple wrapper around soundfont-player for prototype
 */
export class SampleLibraryManager {
  private instruments = new Map<string, any>();
  private audioContext: AudioContext | null = null;

  /**
   * Initialize the audio context
   */
  async initialize(audioContext: AudioContext): Promise<void> {
    this.audioContext = audioContext;
  }

  /**
   * Load an instrument from the soundfont CDN
   *
   * @param config - Instrument configuration
   * @returns Loaded instrument
   */
  async loadInstrument(config: SampleLibraryConfig): Promise<any> {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized. Call initialize() first.');
    }

    const { instrument, format = 'mp3', soundfont = 'MusyngKite' } = config;

    console.log(`[SampleLibraryManager] Loading ${instrument}...`);
    const startTime = performance.now();

    // Load instrument using soundfont-player
    // Note: soundfont-player doesn't have proper TS types, using any for prototype
    const loadedInstrument = await (Soundfont.instrument as any)(
      this.audioContext,
      instrument,
      {
        format,
        soundfont,
      }
    );

    const loadTime = performance.now() - startTime;
    console.log(`[SampleLibraryManager] Loaded ${instrument} in ${loadTime.toFixed(2)}ms`);

    // Cache the instrument
    this.instruments.set(instrument, loadedInstrument);

    return loadedInstrument;
  }

  /**
   * Get a loaded instrument
   */
  getInstrument(name: string): any {
    const instrument = this.instruments.get(name);
    if (!instrument) {
      throw new Error(
        `Instrument not loaded: ${name}. ` +
        `Available: ${Array.from(this.instruments.keys()).join(', ')}`
      );
    }
    return instrument;
  }

  /**
   * Check if instrument is loaded
   */
  isLoaded(name: string): boolean {
    return this.instruments.has(name);
  }

  /**
   * Get all loaded instruments
   */
  getLoadedInstruments(): string[] {
    return Array.from(this.instruments.keys());
  }

  /**
   * Dispose all instruments
   */
  dispose(): void {
    for (const instrument of this.instruments.values()) {
      if (instrument.stop) {
        instrument.stop();
      }
    }
    this.instruments.clear();
  }
}
