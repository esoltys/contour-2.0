// packages/core/src/composition/Composition.ts

import type { BPM, Seconds } from '../types/brands.js';
import { BPM as createBPM, Seconds as createSeconds } from '../types/brands.js';
import type { Track } from './Track.js';

/**
 * Time signature representation.
 */
export interface TimeSignature {
  numerator: number;
  denominator: number;
}

/**
 * Complete composition with multiple tracks.
 *
 * A Composition is the top-level container for a complete musical piece,
 * combining multiple tracks with global properties like tempo and time signature.
 * Compositions are immutable - all operations return new instances.
 *
 * @example
 * ```typescript
 * const melody = new Track('Melody', [melodyVoice]);
 * const harmony = new Track('Harmony', [harmonyVoice]);
 *
 * const composition = new Composition('My Song', BPM(120))
 *   .addTrack(melody)
 *   .addTrack(harmony);
 *
 * console.log(composition.duration); // Total duration in seconds
 * ```
 */
export class Composition {
  readonly title: string;
  readonly tempo: BPM;
  readonly timeSignature: TimeSignature;
  readonly tracks: ReadonlyArray<Track>;

  constructor(
    title: string,
    tempo: BPM = createBPM(120),
    timeSignature: TimeSignature = { numerator: 4, denominator: 4 }
  ) {
    this.title = title;
    this.tempo = tempo;
    this.timeSignature = timeSignature;
    this.tracks = Object.freeze([]);
  }

  /**
   * Add a track to the composition.
   * Returns a new Composition with the track added.
   *
   * @param track - The track to add
   * @returns New Composition instance with the track added
   *
   * @example
   * ```typescript
   * const composition = new Composition('Symphony No. 1', BPM(120))
   *   .addTrack(new Track('Strings'))
   *   .addTrack(new Track('Brass'))
   *   .addTrack(new Track('Woodwinds'));
   * ```
   */
  addTrack(track: Track): Composition {
    const comp = Object.create(Composition.prototype);
    comp.title = this.title;
    comp.tempo = this.tempo;
    comp.timeSignature = this.timeSignature;
    comp.tracks = Object.freeze([...this.tracks, track]);
    return comp;
  }

  /**
   * Change tempo (returns new Composition).
   *
   * @param tempo - New tempo in beats per minute
   * @returns New Composition instance with updated tempo
   *
   * @example
   * ```typescript
   * const slow = composition.withTempo(BPM(60));
   * const fast = composition.withTempo(BPM(180));
   * ```
   */
  withTempo(tempo: BPM): Composition {
    const comp = Object.create(Composition.prototype);
    comp.title = this.title;
    comp.tempo = tempo;
    comp.timeSignature = this.timeSignature;
    comp.tracks = this.tracks;
    return comp;
  }

  /**
   * Change time signature (returns new Composition).
   *
   * @param timeSignature - New time signature
   * @returns New Composition instance with updated time signature
   *
   * @example
   * ```typescript
   * const waltz = composition.withTimeSignature({ numerator: 3, denominator: 4 });
   * const fiveFour = composition.withTimeSignature({ numerator: 5, denominator: 4 });
   * ```
   */
  withTimeSignature(timeSignature: TimeSignature): Composition {
    const comp = Object.create(Composition.prototype);
    comp.title = this.title;
    comp.tempo = this.tempo;
    comp.timeSignature = timeSignature;
    comp.tracks = this.tracks;
    return comp;
  }

  /**
   * Calculate total duration from all tracks.
   * Returns the duration of the longest track.
   *
   * @returns Duration in seconds
   */
  get duration(): Seconds {
    if (this.tracks.length === 0) {
      return createSeconds(0);
    }

    const maxDuration = Math.max(
      ...this.tracks.flatMap(track =>
        track.voices.map(voice => voice.pattern.duration as number)
      )
    );

    return createSeconds(maxDuration);
  }

  /**
   * Get the number of tracks in this composition.
   */
  get trackCount(): number {
    return this.tracks.length;
  }

  /**
   * Check if composition has no tracks.
   */
  get isEmpty(): boolean {
    return this.tracks.length === 0;
  }
}
