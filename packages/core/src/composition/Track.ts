// packages/core/src/composition/Track.ts

import type { Voice } from './Voice.js';

/**
 * Track containing one or more voices.
 *
 * A Track represents a named collection of musical voices that play together.
 * Multiple voices in a track can create harmony, counterpoint, or layered textures.
 * Tracks are immutable - operations return new Track instances.
 *
 * @example
 * ```typescript
 * const melody = new Voice(melodyPattern, 'synth');
 * const harmony = new Voice(harmonyPattern, 'strings');
 *
 * const track = new Track('Main Theme', [melody, harmony]);
 * const transposed = track.transform(voice => voice.transform(p => p.transpose(2)));
 * ```
 */
export class Track {
  readonly name: string;
  readonly voices: ReadonlyArray<Voice>;

  constructor(name: string, voices: Voice[] = []) {
    this.name = name;
    this.voices = Object.freeze([...voices]);
  }

  /**
   * Add a voice to this track.
   * Returns a new Track with the voice added.
   *
   * @param voice - The voice to add
   * @returns New Track instance with the voice added
   *
   * @example
   * ```typescript
   * const track = new Track('Piano');
   * const withMelody = track.addVoice(new Voice(melody, 'piano'));
   * const withHarmony = withMelody.addVoice(new Voice(harmony, 'piano'));
   * ```
   */
  addVoice(voice: Voice): Track {
    return new Track(this.name, [...this.voices, voice]);
  }

  /**
   * Transform all voices in the track.
   * Returns a new Track with all voices transformed.
   *
   * @param fn - Transformation function to apply to each voice
   * @returns New Track instance with transformed voices
   *
   * @example
   * ```typescript
   * const track = new Track('Strings', [voice1, voice2]);
   *
   * // Transpose all voices up 7 semitones
   * const transposed = track.transform(v => v.transform(p => p.transpose(7)));
   *
   * // Make all voices twice as fast
   * const faster = track.transform(v => v.transform(p => p.fast(2)));
   * ```
   */
  transform(fn: (v: Voice) => Voice): Track {
    return new Track(this.name, this.voices.map(fn));
  }

  /**
   * Get the number of voices in this track.
   */
  get voiceCount(): number {
    return this.voices.length;
  }

  /**
   * Check if track has no voices.
   */
  get isEmpty(): boolean {
    return this.voices.length === 0;
  }
}
