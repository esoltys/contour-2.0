/**
 * Scale class - Immutable scale representation.
 *
 * A scale is a sequence of intervals from a root note.
 * Scales can generate patterns, transpose, and provide access to scale degrees.
 */

import type { NoteName } from '../types/music.js';
import type { Interval, Duration } from '../types/brands.js';
import type { ScaleName, ChordQuality } from '../types/theory.js';
import { Interval as IntervalConstructor } from '../types/brands.js';
import { Note } from '../primitives/Note.js';
import { PatternBuilder } from '../patterns/PatternBuilder.js';

/**
 * Immutable scale representation.
 */
export class Scale {
  readonly root: NoteName;
  readonly name: ScaleName;
  readonly intervals: readonly Interval[];

  constructor(root: NoteName, name: ScaleName) {
    this.root = root;
    this.name = name;
    this.intervals = Object.freeze([...SCALE_INTERVALS[name]]);
  }

  /**
   * Get all notes in the scale (one octave).
   *
   * @returns Array of Note objects in the scale
   *
   * @example
   * ```typescript
   * const cMajor = new Scale('C4', 'major');
   * const notes = cMajor.getNotes();
   * // [C4, D4, E4, F4, G4, A4, B4, C5]
   * ```
   */
  getNotes(): Note[] {
    const rootNote = new Note(this.root);
    return this.intervals.map(interval => rootNote.transpose(interval));
  }

  /**
   * Get note at specific scale degree (1-indexed).
   *
   * @param degree - Scale degree (1 = tonic, 5 = dominant, etc.)
   * @returns Note at the specified degree
   *
   * @example
   * ```typescript
   * const scale = new Scale('G4', 'major');
   * scale.degree(1); // G4 (tonic)
   * scale.degree(5); // D5 (dominant)
   * ```
   */
  degree(degree: number): Note {
    if (degree < 1 || degree > this.intervals.length) {
      throw new RangeError(
        `Degree must be 1-${this.intervals.length}, got ${degree}`
      );
    }
    const rootNote = new Note(this.root);
    return rootNote.transpose(this.intervals[degree - 1]);
  }

  /**
   * Transpose the scale to a new root.
   *
   * @param semitones - Number of semitones to transpose
   * @returns New Scale instance with transposed root
   *
   * @example
   * ```typescript
   * const cMajor = new Scale('C4', 'major');
   * const dMajor = cMajor.transpose(2);
   * // D major scale
   * ```
   */
  transpose(semitones: number): Scale {
    const rootNote = new Note(this.root);
    const newRoot = rootNote.transpose(semitones).name;
    return new Scale(newRoot, this.name);
  }

  /**
   * Get the number of notes in the scale.
   */
  get length(): number {
    return this.intervals.length;
  }

  /**
   * Create a pattern from scale degrees.
   *
   * @param degrees - Array of scale degrees (1-indexed)
   * @param durations - Optional array of durations (one per degree, or single duration for all)
   * @returns Pattern instance
   *
   * @example
   * ```typescript
   * const cMajor = new Scale('C4', 'major');
   * const arpeggio = cMajor.pattern([1, 3, 5, 8]); // C4, E4, G4, C5
   * const withDurations = cMajor.pattern(
   *   [1, 3, 5],
   *   [Durations.quarter, Durations.eighth, Durations.half]
   * );
   * ```
   */
  pattern(degrees: number[], durations?: Duration | Duration[]): any {
    const builder = new PatternBuilder().withScale(this);
    return builder.degrees(degrees, durations).build();
  }
}

/**
 * Scale interval patterns (in semitones from root).
 *
 * Each scale is represented as an array of intervals.
 * The last interval is always the octave (12 semitones).
 */
const SCALE_INTERVALS: Record<ScaleName, Interval[]> = {
  // Major and modes
  major: [0, 2, 4, 5, 7, 9, 11, 12].map(IntervalConstructor),
  Ionian: [0, 2, 4, 5, 7, 9, 11, 12].map(IntervalConstructor),
  Dorian: [0, 2, 3, 5, 7, 9, 10, 12].map(IntervalConstructor),
  Phrygian: [0, 1, 3, 5, 7, 8, 10, 12].map(IntervalConstructor),
  Lydian: [0, 2, 4, 6, 7, 9, 11, 12].map(IntervalConstructor),
  Mixolydian: [0, 2, 4, 5, 7, 9, 10, 12].map(IntervalConstructor),
  Aeolian: [0, 2, 3, 5, 7, 8, 10, 12].map(IntervalConstructor),
  Locrian: [0, 1, 3, 5, 6, 8, 10, 12].map(IntervalConstructor),

  // Minor scales
  minor: [0, 2, 3, 5, 7, 8, 10, 12].map(IntervalConstructor), // Natural minor (same as Aeolian)
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11, 12].map(IntervalConstructor),
  melodicMinor: [0, 2, 3, 5, 7, 9, 11, 12].map(IntervalConstructor),

  // Pentatonic
  majorPentatonic: [0, 2, 4, 7, 9, 12].map(IntervalConstructor),
  minorPentatonic: [0, 3, 5, 7, 10, 12].map(IntervalConstructor),

  // Other
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(IntervalConstructor),
  wholeTone: [0, 2, 4, 6, 8, 10, 12].map(IntervalConstructor),
};
