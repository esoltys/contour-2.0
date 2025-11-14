/**
 * ChordVoicing class - Chord with specific pitch instances.
 *
 * Represents a concrete voicing of a chord (not just intervals).
 * Can be transposed, inverted, and converted to patterns.
 */

import type { NoteName } from '../types/music.js';
import type { ChordQuality } from '../types/theory.js';
import { Note } from '../primitives/Note.js';
import { parseChord } from '../patterns/chordParser.js';

/**
 * Chord with specific pitch instances (not just intervals).
 * Represents a concrete voicing of a chord.
 */
export class ChordVoicing {
  readonly root: NoteName;
  readonly quality: ChordQuality;
  readonly notes: readonly Note[];

  constructor(root: NoteName, quality: ChordQuality, notes: Note[]) {
    this.root = root;
    this.quality = quality;
    this.notes = Object.freeze([...notes]);
  }

  /**
   * Create chord from quality (default voicing).
   *
   * @param root - Root note with octave (e.g., 'C4')
   * @param quality - Chord quality (e.g., 'maj7', 'min', 'dim')
   * @returns ChordVoicing instance
   *
   * @example
   * ```typescript
   * const chord = ChordVoicing.fromQuality('C4', 'maj7');
   * // C4, E4, G4, B4
   * ```
   */
  static fromQuality(root: NoteName, quality: ChordQuality): ChordVoicing {
    // Extract note name without octave and the octave separately
    const noteName = root.slice(0, -1);
    const octave = parseInt(root.slice(-1));

    // Parse chord using existing chord parser
    const chordData = parseChord(`${noteName}${quality}`);

    if (chordData.notes.length === 0) {
      throw new Error(`Unknown chord quality: ${quality}`);
    }

    // Add octave to each note, incrementing when we cross octave boundary
    const rootNote = new Note(root);
    const rootPitch = rootNote.pitch % 12; // Pitch class of root

    const notes = chordData.notes.map((n) => {
      // Create a note in the base octave
      const testNote = new Note(`${n}${octave}` as NoteName);
      const notePitchClass = testNote.pitch % 12;

      // If this note's pitch class is lower than root, it's in the next octave
      let actualOctave = octave;
      if (notePitchClass < rootPitch && n !== noteName) {
        actualOctave++;
      }

      return new Note(`${n}${actualOctave}` as NoteName);
    });

    return new ChordVoicing(root, quality, notes);
  }

  /**
   * Transpose the chord voicing.
   *
   * @param semitones - Number of semitones to transpose
   * @returns New ChordVoicing instance
   *
   * @example
   * ```typescript
   * const cMajor = ChordVoicing.fromQuality('C4', 'maj');
   * const dMajor = cMajor.transpose(2);
   * ```
   */
  transpose(semitones: number): ChordVoicing {
    const newNotes = this.notes.map((n) => n.transpose(semitones));
    const newRoot = new Note(this.root).transpose(semitones).name;
    return new ChordVoicing(newRoot, this.quality, newNotes);
  }

  /**
   * Invert the chord (move bottom note up an octave).
   *
   * @param times - Number of inversions (default 1)
   * @returns New ChordVoicing instance
   *
   * @example
   * ```typescript
   * const chord = ChordVoicing.fromQuality('C4', 'maj');
   * const firstInversion = chord.invert(1); // E4, G4, C5
   * const secondInversion = chord.invert(2); // G4, C5, E5
   * ```
   */
  invert(times: number = 1): ChordVoicing {
    if (times < 0 || !Number.isInteger(times)) {
      throw new RangeError('Inversion times must be a non-negative integer');
    }

    let notes = [...this.notes];

    for (let i = 0; i < times; i++) {
      const bottom = notes.shift()!;
      notes.push(bottom.transpose(12)); // Up one octave
    }

    return new ChordVoicing(this.root, this.quality, notes);
  }

  /**
   * Get the number of notes in the chord.
   */
  get length(): number {
    return this.notes.length;
  }
}
