import { Duration, Interval } from './brands';

/**
 * Musical note letter names.
 */
export type NoteLetter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

/**
 * Accidentals (sharp, flat, natural).
 */
export type Accidental = '' | '#' | 'b';

/**
 * Octave number (scientific pitch notation).
 */
export type Octave = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';

/**
 * Complete note name with compile-time validation.
 * Examples: 'C4', 'F#5', 'Bb3'
 */
export type NoteName = `${NoteLetter}${Accidental}${Octave}`;

/**
 * Common duration constants.
 */
export const Durations = {
  whole: Duration(1),
  half: Duration(0.5),
  quarter: Duration(0.25),
  eighth: Duration(0.125),
  sixteenth: Duration(0.0625),
  thirtysecond: Duration(0.03125),

  // Dotted durations
  dottedHalf: Duration(0.75),
  dottedQuarter: Duration(0.375),
  dottedEighth: Duration(0.1875),
} as const;

/**
 * Common interval constants.
 */
export const Intervals = {
  unison: Interval(0),
  minorSecond: Interval(1),
  majorSecond: Interval(2),
  minorThird: Interval(3),
  majorThird: Interval(4),
  perfectFourth: Interval(5),
  augmentedFourth: Interval(6), // tritone
  perfectFifth: Interval(7),
  minorSixth: Interval(8),
  majorSixth: Interval(9),
  minorSeventh: Interval(10),
  majorSeventh: Interval(11),
  octave: Interval(12),
} as const;
