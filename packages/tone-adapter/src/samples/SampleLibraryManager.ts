/**
 * SampleLibraryManager using soundfont-player for external sample loading.
 *
 * This manager handles loading and caching of soundfont instruments from CDN.
 * It uses soundfont-player which provides pre-rendered audio files for fast loading.
 *
 * Features:
 * - Type-safe instrument names via GMInstrument enum
 * - Automatic caching of loaded instruments
 * - Support for multiple soundfont libraries (MusyngKite, FluidR3_GM, FatBoy)
 * - Simple API for loading and accessing instruments
 */

import * as Soundfont from 'soundfont-player';
import type {
  SampleLibraryConfig,
  SoundfontInstrument,
  SoundfontLibrary,
  GMInstrument,
  QualifiedInstrumentName,
  SoundfontFormat,
} from './types.js';
import { parseQualifiedName, isQualifiedName } from './types.js';

/**
 * Manages loading and caching of soundfont instruments.
 *
 * @example
 * ```typescript
 * const manager = new SampleLibraryManager();
 * await manager.initialize(audioContext);
 *
 * // Load an instrument
 * await manager.loadInstrument({
 *   instrument: GMInstrument.AcousticGrandPiano,
 *   soundfont: SoundfontLibrary.MusyngKite,
 *   format: 'mp3'
 * });
 *
 * // Get the loaded instrument
 * const piano = manager.getInstrument('acoustic_grand_piano');
 * ```
 */
export class SampleLibraryManager {
  private instruments = new Map<string, SoundfontInstrument>();
  private audioContext: AudioContext | null = null;

  /**
   * Initialize the audio context
   */
  async initialize(audioContext: AudioContext): Promise<void> {
    this.audioContext = audioContext;
  }

  /**
   * Load an instrument from the soundfont CDN.
   *
   * @param config - Instrument configuration
   * @returns Promise resolving to the loaded instrument
   * @throws Error if AudioContext not initialized
   */
  async loadInstrument(config: SampleLibraryConfig): Promise<SoundfontInstrument> {
    if (!this.audioContext) {
      throw new Error('AudioContext not initialized. Call initialize() first.');
    }

    const { instrument, format = 'mp3', soundfont = 'MusyngKite' } = config;

    console.log(`[SampleLibraryManager] Loading ${instrument} from ${soundfont}...`);
    const startTime = performance.now();

    // Load instrument using soundfont-player
    // Note: soundfont-player doesn't have proper TS types, we cast to our interface
    const loadedInstrument = await (Soundfont.instrument as any)(
      this.audioContext,
      instrument,
      {
        format,
        soundfont,
      }
    ) as SoundfontInstrument;

    const loadTime = performance.now() - startTime;
    console.log(`[SampleLibraryManager] Loaded ${instrument} in ${loadTime.toFixed(2)}ms`);

    // Cache the instrument
    this.instruments.set(instrument, loadedInstrument);

    return loadedInstrument;
  }

  /**
   * Load an instrument using a qualified name.
   *
   * @param qualifiedName - Format: 'LibraryName:InstrumentName' (e.g., 'MusyngKite:acoustic_grand_piano')
   * @param format - Audio format (default: 'mp3')
   * @returns Promise resolving to the loaded instrument
   *
   * @example
   * ```typescript
   * await manager.loadInstrumentByQualifiedName('MusyngKite:acoustic_grand_piano', 'mp3');
   * ```
   */
  async loadInstrumentByQualifiedName(
    qualifiedName: QualifiedInstrumentName,
    format: SoundfontFormat = 'mp3'
  ): Promise<SoundfontInstrument> {
    const parsed = parseQualifiedName(qualifiedName);
    if (!parsed) {
      throw new Error(
        `Invalid qualified instrument name: ${qualifiedName}. ` +
        `Expected format: 'LibraryName:InstrumentName'`
      );
    }

    return this.loadInstrument({
      instrument: parsed.instrument,
      soundfont: parsed.library,
      format,
    });
  }

  /**
   * Get a loaded instrument by its simple name.
   *
   * @param name - Instrument name (e.g., 'acoustic_grand_piano')
   * @returns The loaded instrument
   * @throws Error if instrument not found
   */
  getInstrument(name: string): SoundfontInstrument {
    const instrument = this.instruments.get(name);
    if (!instrument) {
      const available = Array.from(this.instruments.keys());
      throw new Error(
        `Instrument not loaded: ${name}. ` +
        `Available instruments: ${available.length > 0 ? available.join(', ') : 'none'}`
      );
    }
    return instrument;
  }

  /**
   * Get a loaded instrument by qualified name, loading it if necessary.
   *
   * @param qualifiedName - Format: 'LibraryName:InstrumentName'
   * @param format - Audio format (default: 'mp3')
   * @returns Promise resolving to the instrument
   *
   * @example
   * ```typescript
   * const piano = await manager.getInstrumentByQualifiedName('MusyngKite:acoustic_grand_piano');
   * ```
   */
  async getInstrumentByQualifiedName(
    qualifiedName: QualifiedInstrumentName,
    format: SoundfontFormat = 'mp3'
  ): Promise<SoundfontInstrument> {
    const parsed = parseQualifiedName(qualifiedName);
    if (!parsed) {
      throw new Error(
        `Invalid qualified instrument name: ${qualifiedName}. ` +
        `Expected format: 'LibraryName:InstrumentName'`
      );
    }

    // Check if already loaded
    if (this.isLoaded(parsed.instrument)) {
      return this.getInstrument(parsed.instrument);
    }

    // Load if not cached
    return this.loadInstrumentByQualifiedName(qualifiedName, format);
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
