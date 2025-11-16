/**
 * ChordProgression class - A timed sequence of chords.
 *
 * Behaves like a Pattern but for harmonic changes.
 * Supports transformations (transpose, fast, slow) and conversion to patterns.
 */

import type { Duration, Seconds, Velocity } from '../types/brands.js';
import type { Degree } from '../types/theory.js';
import { Seconds as SecondsConstructor, Duration as DurationConstructor, Velocity as VelocityConstructor } from '../types/brands.js';
import { ChordVoicing } from './ChordVoicing.js';
import { Scale } from './Scale.js';
import type { Event, NoteEvent, ChordEvent } from '../primitives/Event.js';
import { Pattern } from '../patterns/Pattern.js';
import type { PatternLike } from '../types/interfaces.js';

/**
 * A timed chord change in a progression.
 */
export interface ChordChange {
  chord: ChordVoicing;
  time: Seconds;
  duration: Duration;
}

/**
 * A timed sequence of chords.
 * Behaves like a Pattern but for harmonic changes.
 */
export class ChordProgression {
  readonly changes: readonly ChordChange[];
  readonly scale?: Scale;

  constructor(changes: ChordChange[], scale?: Scale) {
    this.changes = Object.freeze([...changes]);
    this.scale = scale;
  }

  /**
   * Transpose the entire progression.
   *
   * @param semitones - Number of semitones to transpose
   * @returns New ChordProgression instance
   *
   * @example
   * ```typescript
   * const cMajorProg = ChordProgression.fromDegrees(
   *   new Scale('C4', 'major'),
   *   ['I', 'IV', 'V', 'I'],
   *   Duration(1.0)
   * );
   * const gMajorProg = cMajorProg.transpose(7);
   * ```
   */
  transpose(semitones: number): ChordProgression {
    const newChanges = this.changes.map((c) => ({
      ...c,
      chord: c.chord.transpose(semitones),
    }));
    const newScale = this.scale?.transpose(semitones);
    return new ChordProgression(newChanges, newScale);
  }

  /**
   * Speed up the progression.
   *
   * @param factor - Speed multiplier (2 = twice as fast)
   * @returns New ChordProgression instance
   */
  fast(factor: number): ChordProgression {
    if (factor <= 0) {
      throw new RangeError(`fast factor must be positive, got ${factor}`);
    }
    const newChanges = this.changes.map((c) => ({
      ...c,
      time: SecondsConstructor(c.time / factor),
      duration: DurationConstructor(c.duration / factor),
    }));
    return new ChordProgression(newChanges, this.scale);
  }

  /**
   * Slow down the progression (inverse of fast).
   *
   * @param factor - Slow factor (2 = half as fast)
   * @returns New ChordProgression instance
   */
  slow(factor: number): ChordProgression {
    if (factor <= 0) {
      throw new RangeError(`slow factor must be positive, got ${factor}`);
    }
    return this.fast(1 / factor);
  }

  /**
   * Append another progression sequentially.
   *
   * @param other - ChordProgression to append
   * @returns New ChordProgression instance
   */
  append(other: ChordProgression): ChordProgression {
    // Calculate end time of this progression
    const thisEnd = this.changes.reduce(
      (max, c) => Math.max(max, c.time + c.duration),
      0
    );

    // Shift other progression's times
    const shiftedChanges = other.changes.map((c) => ({
      ...c,
      time: SecondsConstructor(c.time + thisEnd),
    }));

    return new ChordProgression(
      [...this.changes, ...shiftedChanges],
      this.scale
    );
  }

  /**
   * Get the total duration of the progression.
   */
  get duration(): Duration {
    if (this.changes.length === 0) return DurationConstructor(0);

    const maxEndTime = this.changes.reduce(
      (max, c) => Math.max(max, c.time + c.duration),
      0
    );

    return DurationConstructor(maxEndTime);
  }

  /**
   * Convert progression to playable Pattern.
   *
   * @param style - 'block' for block chords, 'arpeggio' for arpeggiated chords
   * @returns Pattern instance
   *
   * @example
   * ```typescript
   * const prog = ChordProgression.fromDegrees(
   *   new Scale('C4', 'major'),
   *   ['I', 'IV', 'V'],
   *   Duration(2.0)
   * );
   *
   * const blockChords = prog.toPattern('block');
   * const arpeggios = prog.toPattern('arpeggio');
   * ```
   */
  toPattern(style: 'block' | 'arpeggio' = 'block'): PatternLike {
    if (style === 'block') {
      // Stack all chords at their times (simultaneous notes)
      const events = this.changes.flatMap((c) => {
        // Create chord events for each chord change
        return c.chord.notes.map((note, i) => ({
          type: 'note' as const,
          time: SecondsConstructor(c.time),
          duration: c.duration,
          velocity: VelocityConstructor(80),
          pitch: note.pitch,
          note: note,
        }));
      });
      return new Pattern(events);
    } else {
      // Arpeggio each chord
      const events = this.changes.flatMap((c) => {
        const noteCount = c.chord.notes.length;
        const noteDuration = DurationConstructor(c.duration / noteCount);

        return c.chord.notes.map((note, i) => ({
          type: 'note' as const,
          time: SecondsConstructor(c.time + i * noteDuration),
          duration: noteDuration,
          velocity: VelocityConstructor(80),
          pitch: note.pitch,
          note: note,
        }));
      });
      return new Pattern(events);
    }
  }

  /**
   * Create progression from Roman numeral degrees.
   *
   * @param scale - Parent scale for the progression
   * @param degrees - Array of Roman numeral degrees
   * @param duration - Duration for each chord
   * @returns New ChordProgression instance
   *
   * @example
   * ```typescript
   * const scale = new Scale('C4', 'major');
   * const prog = ChordProgression.fromDegrees(
   *   scale,
   *   ['I', 'vi', 'IV', 'V'],
   *   Duration(2.0)
   * );
   * ```
   */
  static fromDegrees(
    scale: Scale,
    degrees: Degree[],
    duration: Duration
  ): ChordProgression {
    const changes: ChordChange[] = degrees.map((degree, i) => {
      const isMinor = degree.toLowerCase() === degree;
      const degreeNum = romanToNumber(degree.toUpperCase() as Uppercase<Degree>);
      const quality = isMinor ? 'm' : 'maj';

      // Get the root note for this degree
      const rootNote = scale.degree(degreeNum);

      // Create chord voicing
      const chord = ChordVoicing.fromQuality(rootNote.name, quality);

      return {
        chord,
        time: SecondsConstructor(i * duration),
        duration,
      };
    });

    return new ChordProgression(changes, scale);
  }
}

/**
 * Convert Roman numeral to degree number.
 */
function romanToNumber(roman: string): number {
  const map: Record<string, number> = {
    I: 1,
    II: 2,
    III: 3,
    IV: 4,
    V: 5,
    VI: 6,
    VII: 7,
  };
  return map[roman] ?? 1;
}
