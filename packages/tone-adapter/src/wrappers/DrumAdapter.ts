import * as Tone from 'tone';
import type { InstrumentAdapter } from './InstrumentAdapter.js';

/**
 * Available drum kits from Tone.js CDN
 */
export type DrumKit = 'CR78' | 'Techno' | 'acoustic-kit' | 'LINN' | 'KPR77';

/**
 * Drum kit configurations
 */
const DRUM_KIT_URLS: Record<DrumKit, string> = {
  'CR78': 'https://tonejs.github.io/audio/drum-samples/CR78/',
  'Techno': 'https://tonejs.github.io/audio/drum-samples/Techno/',
  'acoustic-kit': 'https://tonejs.github.io/audio/drum-samples/acoustic-kit/',
  'LINN': 'https://tonejs.github.io/audio/drum-samples/LINN/',
  'KPR77': 'https://tonejs.github.io/audio/drum-samples/KPR77/',
};

/**
 * Note mapping for drum samples
 * Maps MIDI note names to sample filenames
 * Note: Not all kits have all samples - missing samples will be skipped
 */
const DRUM_NOTE_MAP: Record<string, string> = {
  'C1': 'kick',      // MIDI 36 - Bass Drum
  'D1': 'snare',     // MIDI 38 - Snare Drum
  'E1': 'tom1',      // MIDI 40 - Low Tom
  'F#1': 'hihat',    // MIDI 42 - Closed Hi-Hat
  'G1': 'tom2',      // MIDI 43 - Mid Tom
  'A1': 'tom3',      // MIDI 45 - High Tom
  // Note: crash.mp3 is missing from CR78 kit, so we skip it
  // 'A#1': 'crash',    // MIDI 46 - Open Hi-Hat / Crash
};

/**
 * DrumAdapter - Wraps Tone.Sampler for drum sample playback
 *
 * Uses high-quality drum samples from the Tone.js CDN instead of synthesized drums.
 * Supports multiple drum kits (CR78, Techno, acoustic, etc.)
 */
export class DrumAdapter implements InstrumentAdapter {
  private sampler: Tone.Sampler;
  private kit: DrumKit;
  private isLoaded = false;
  private loadError: string | null = null;

  /**
   * Create a DrumAdapter with a specific drum kit
   *
   * @param kit - The drum kit to use (default: 'CR78' for classic 808-style drums)
   */
  constructor(kit: DrumKit = 'CR78') {
    this.kit = kit;
    const baseUrl = DRUM_KIT_URLS[kit];

    // Build URLs object for Tone.Sampler
    const urls: Record<string, string> = {};
    Object.entries(DRUM_NOTE_MAP).forEach(([note, filename]) => {
      urls[note] = `${filename}.mp3`;
    });

    console.log(`[Contour] Creating ${kit} drum kit with samples from ${baseUrl}`);
    console.log(`[Contour] Sample URLs:`, urls);

    // Create sampler with drum samples
    this.sampler = new Tone.Sampler({
      urls,
      baseUrl,
      onload: () => {
        this.isLoaded = true;
        console.log(`[Contour] Loaded ${kit} drum kit with samples: ${Object.keys(urls).join(', ')}`);
      },
      onerror: (error: unknown) => {
        // Tone.js error objects are sometimes empty or non-standard
        console.error(`[Contour] Raw error object:`, error);
        console.error(`[Contour] Error type:`, typeof error);
        console.error(`[Contour] Error constructor:`, error?.constructor?.name);

        let errorMessage = 'Unknown error';
        if (error instanceof Error) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else if (error && typeof error === 'object') {
          const errObj = error as Record<string, unknown>;
          // Try to extract any useful info from the error object
          errorMessage = (errObj.message as string) ||
                        (errObj.statusText as string) ||
                        (errObj.type as string) ||
                        (typeof errObj.toString === 'function' && errObj.toString() !== '[object Object]'
                          ? errObj.toString()
                          : `Failed to fetch samples from ${baseUrl}`);
        }
        this.loadError = errorMessage;
        console.error(`[Contour] Error loading ${kit} drum kit: ${errorMessage}`);
        // Set isLoaded so waitForLoad() can detect the error and throw
        this.isLoaded = true;
      }
    }).toDestination();
  }

  /**
   * Play a single drum hit
   *
   * @param note - Note name (e.g., 'C1' for kick, 'D1' for snare)
   * @param duration - Note duration in seconds (not used for drums, but required by interface)
   * @param time - When to trigger the note (in audio context time)
   * @param velocity - Hit velocity (0-127), controls volume
   */
  playNote(note: string, duration: number, time: number, velocity: number): void {
    // Don't play if samples aren't loaded yet
    if (!this.isLoaded) {
      return;
    }

    // Don't play if sampler has been disposed
    if (!this.sampler || this.sampler.disposed) {
      console.warn(`[DrumAdapter] Cannot play note ${note}: sampler is disposed`);
      return;
    }

    // Normalize velocity to 0-1 range
    const gain = velocity / 127;

    // Trigger drum sample
    // Note: Duration is ignored for drums - they play to completion
    try {
      this.sampler.triggerAttack(note, time, gain);
    } catch (error) {
      console.warn(`[DrumAdapter] Failed to play note ${note}:`, error);
    }
  }

  /**
   * Play multiple drum hits simultaneously (e.g., kick + snare)
   *
   * @param notes - Array of note names
   * @param duration - Note duration (not used for drums)
   * @param time - When to trigger the notes
   * @param velocity - Hit velocity
   */
  playChord(notes: string[], duration: number, time: number, velocity: number): void {
    // Don't play if samples aren't loaded yet
    if (!this.isLoaded) {
      return;
    }

    // Don't play if sampler has been disposed
    if (!this.sampler || this.sampler.disposed) {
      console.warn(`[DrumAdapter] Cannot play chord: sampler is disposed`);
      return;
    }

    // Normalize velocity
    const gain = velocity / 127;

    // Trigger all drum samples simultaneously
    notes.forEach(note => {
      try {
        this.sampler.triggerAttack(note, time, gain);
      } catch (error) {
        console.warn(`[DrumAdapter] Failed to play note ${note}:`, error);
      }
    });
  }

  /**
   * Dispose of the sampler and release resources
   */
  dispose(): void {
    if (this.sampler) {
      this.sampler.dispose();
    }
  }

  /**
   * Get the underlying Tone.Sampler instance
   */
  getInstrument(): Tone.Sampler {
    return this.sampler;
  }

  /**
   * Get the current drum kit name
   */
  getKit(): DrumKit {
    return this.kit;
  }

  /**
   * Check if samples are loaded
   */
  loaded(): boolean {
    return this.isLoaded;
  }

  /**
   * Wait for samples to finish loading
   * Returns a promise that resolves when all samples are loaded
   * Throws if there was a loading error
   */
  async waitForLoad(): Promise<void> {
    if (this.isLoaded) {
      if (this.loadError) {
        throw new Error(`${this.kit} drum kit loaded with errors: ${this.loadError}`);
      }
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const checkLoaded = () => {
        if (this.isLoaded) {
          if (this.loadError) {
            reject(new Error(`${this.kit} drum kit loaded with errors: ${this.loadError}`));
          } else {
            resolve();
          }
        } else {
          setTimeout(checkLoaded, 100);
        }
      };

      // Start checking
      checkLoaded();

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!this.isLoaded) {
          reject(new Error(`Timeout loading ${this.kit} drum kit`));
        }
      }, 10000);
    });
  }

  /**
   * Check if there were loading errors
   */
  hasLoadError(): boolean {
    return this.loadError !== null;
  }

  /**
   * Get the load error message if any
   */
  getLoadError(): string | null {
    return this.loadError;
  }
}
