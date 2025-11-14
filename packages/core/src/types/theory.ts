/**
 * Type definitions for music theory concepts.
 *
 * Template literal types for mode names, scale names, and other theory concepts.
 */

import type { NoteLetter } from './music.js';

/**
 * Template literal type for mode names (Greek modes).
 */
export type ModeName =
  | 'Ionian'
  | 'Dorian'
  | 'Phrygian'
  | 'Lydian'
  | 'Mixolydian'
  | 'Aeolian'
  | 'Locrian';

/**
 * Template literal type for scale names.
 * Includes common scales and all modes.
 */
export type ScaleName =
  | 'major'
  | 'minor'
  | 'harmonicMinor'
  | 'melodicMinor'
  | 'majorPentatonic'
  | 'minorPentatonic'
  | 'chromatic'
  | 'wholeTone'
  | ModeName;

/**
 * Roman numeral degrees for chord progressions.
 * Uppercase = major, lowercase = minor.
 */
export type Degree =
  | 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII'
  | 'i' | 'ii' | 'iii' | 'iv' | 'v' | 'vi' | 'vii';

/**
 * Chord quality types.
 * Extends existing chord types from chordParser.ts.
 */
export type ChordQuality =
  // Triads
  | '' | 'maj' | 'M' | 'min' | 'm'
  | 'dim' | 'aug'
  | 'sus2' | 'sus4'
  // Seventh chords
  | 'maj7' | 'M7' | 'min7' | 'm7' | '7' | 'dim7'
  // Extended chords
  | 'maj9' | 'M9' | 'min9' | 'm9' | '9'
  | '11' | '13';
