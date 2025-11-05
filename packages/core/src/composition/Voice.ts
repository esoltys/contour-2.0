// packages/core/src/composition/Voice.ts

import type { Pattern } from '../patterns/Pattern.js';

/**
 * Single voice in a composition (one pattern + instrument).
 *
 * A Voice represents a single musical line or part, combining a Pattern
 * of musical events with an instrument identifier. Voices are immutable -
 * transformations return new Voice instances.
 *
 * @example
 * ```typescript
 * const melody = new PatternBuilder()
 *   .notes(['C4', 'E4', 'G4'])
 *   .build();
 *
 * const voice = new Voice(melody, 'synth');
 * const transposed = voice.transform(p => p.transpose(2));
 * ```
 */
export class Voice {
  readonly pattern: Pattern;
  readonly instrument: string; // Tone.js instrument identifier

  constructor(pattern: Pattern, instrument: string = 'synth') {
    this.pattern = pattern;
    this.instrument = instrument;
  }

  /**
   * Transform the voice's pattern.
   * Returns a new Voice with the transformed pattern.
   *
   * @param fn - Transformation function to apply to the pattern
   * @returns New Voice instance with transformed pattern
   *
   * @example
   * ```typescript
   * const voice = new Voice(pattern, 'piano');
   * const faster = voice.transform(p => p.fast(2));
   * const transposed = voice.transform(p => p.transpose(5));
   * ```
   */
  transform(fn: (p: Pattern) => Pattern): Voice {
    return new Voice(fn(this.pattern), this.instrument);
  }
}
