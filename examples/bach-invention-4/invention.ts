/**
 * Bach Invention No. 4 in D minor (BWV 775)
 *
 * This is the PRIMARY ACCEPTANCE TEST for Phase 4.
 * Demonstrates:
 * - Two independent voices (counterpoint)
 * - D minor key with accidentals
 * - Proper timing and voice independence
 * - Multi-track composition
 * - Modulation to relative major (F major)
 *
 * Implementation of the first 16 bars (out of 52 total).
 * The piece modulates from D minor through sequential development
 * to F major (the relative major key).
 */

import {
  Composition,
  Track,
  Voice,
  PatternBuilder,
  BPM,
  D, E, F, G, A, Bb, C,
  Durations,
} from '@contour/core';

/**
 * Creates the upper voice (right hand) - first 16 bars.
 *
 * The invention opens with a characteristic sixteenth-note figure
 * that ascends and descends the D minor scale, then develops through
 * sequential patterns toward F major (the relative major).
 */
function createUpperVoice(): Voice {
  const pattern = new PatternBuilder()
    // Bar 1: Opening motif - ascending D minor scale fragment
    .note(D('5'), Durations.sixteenth)
    .note(C('5'), Durations.sixteenth)
    .note(D('5'), Durations.sixteenth)
    .note(E('5'), Durations.sixteenth)
    .note(F('5'), Durations.sixteenth)
    .note(E('5'), Durations.sixteenth)
    .note(F('5'), Durations.sixteenth)
    .note(G('5'), Durations.sixteenth)

    // Bar 2: Continuation with descending motion
    .note(A('5'), Durations.sixteenth)
    .note(G('5'), Durations.sixteenth)
    .note(F('5'), Durations.sixteenth)
    .note(E('5'), Durations.sixteenth)
    .note(D('5'), Durations.sixteenth)
    .note(C('5'), Durations.sixteenth)
    .note(Bb('4'), Durations.sixteenth)
    .note(A('4'), Durations.sixteenth)

    // Bar 3: Sequence in new register
    .note(Bb('4'), Durations.sixteenth)
    .note(A('4'), Durations.sixteenth)
    .note(Bb('4'), Durations.sixteenth)
    .note(C('5'), Durations.sixteenth)
    .note(D('5'), Durations.sixteenth)
    .note(C('5'), Durations.sixteenth)
    .note(D('5'), Durations.sixteenth)
    .note(E('5'), Durations.sixteenth)

    // Bar 4: Scalar passage
    .note(F('5'), Durations.sixteenth)
    .note(E('5'), Durations.sixteenth)
    .note(D('5'), Durations.sixteenth)
    .note(C('5'), Durations.sixteenth)
    .note(Bb('4'), Durations.sixteenth)
    .note(A('4'), Durations.sixteenth)
    .note(G('4'), Durations.sixteenth)
    .note(F('4'), Durations.sixteenth)

    // Bar 5: Return to upper register
    .note(G('4'), Durations.sixteenth)
    .note(F('4'), Durations.sixteenth)
    .note(G('4'), Durations.sixteenth)
    .note(A('4'), Durations.sixteenth)
    .note(Bb('4'), Durations.sixteenth)
    .note(A('4'), Durations.sixteenth)
    .note(Bb('4'), Durations.sixteenth)
    .note(C('5'), Durations.sixteenth)

    // Bar 6: Development
    .note(D('5'), Durations.sixteenth)
    .note(E('5'), Durations.sixteenth)
    .note(F('5'), Durations.sixteenth)
    .note(G('5'), Durations.sixteenth)
    .note(A('5'), Durations.sixteenth)
    .note(Bb('5'), Durations.sixteenth)
    .note(A('5'), Durations.sixteenth)
    .note(G('5'), Durations.sixteenth)

    // Bar 7: Descending sequence
    .note(F('5'), Durations.sixteenth)
    .note(E('5'), Durations.sixteenth)
    .note(F('5'), Durations.sixteenth)
    .note(D('5'), Durations.sixteenth)
    .note(E('5'), Durations.sixteenth)
    .note(C('5'), Durations.sixteenth)
    .note(D('5'), Durations.sixteenth)
    .note(Bb('4'), Durations.sixteenth)

    // Bar 8: Cadential approach
    .note(C('5'), Durations.sixteenth)
    .note(A('4'), Durations.sixteenth)
    .note(Bb('4'), Durations.sixteenth)
    .note(G('4'), Durations.sixteenth)
    .note(A('4'), Durations.quarter)
    .rest(Durations.quarter)

    // Bar 9: Sequential development - motif transposed up a third
    .note(F('5'), Durations.sixteenth)
    .note(E('5'), Durations.sixteenth)
    .note(F('5'), Durations.sixteenth)
    .note(G('5'), Durations.sixteenth)
    .note(A('5'), Durations.sixteenth)
    .note(G('5'), Durations.sixteenth)
    .note(A('5'), Durations.sixteenth)
    .note(Bb('5'), Durations.sixteenth)

    // Bar 10: Continuation toward F major
    .note(C('6'), Durations.sixteenth)
    .note(Bb('5'), Durations.sixteenth)
    .note(A('5'), Durations.sixteenth)
    .note(G('5'), Durations.sixteenth)
    .note(F('5'), Durations.sixteenth)
    .note(E('5'), Durations.sixteenth)
    .note(D('5'), Durations.sixteenth)
    .note(C('5'), Durations.sixteenth)

    // Bar 11: Sequence continuation
    .note(D('5'), Durations.sixteenth)
    .note(C('5'), Durations.sixteenth)
    .note(D('5'), Durations.sixteenth)
    .note(E('5'), Durations.sixteenth)
    .note(F('5'), Durations.sixteenth)
    .note(E('5'), Durations.sixteenth)
    .note(F('5'), Durations.sixteenth)
    .note(G('5'), Durations.sixteenth)

    // Bar 12: Ascending scalar passage
    .note(A('5'), Durations.sixteenth)
    .note(Bb('5'), Durations.sixteenth)
    .note(C('6'), Durations.sixteenth)
    .note(D('6'), Durations.sixteenth)
    .note(E('6'), Durations.sixteenth)
    .note(F('6'), Durations.sixteenth)
    .note(E('6'), Durations.sixteenth)
    .note(D('6'), Durations.sixteenth)

    // Bar 13: High register development
    .note(C('6'), Durations.sixteenth)
    .note(Bb('5'), Durations.sixteenth)
    .note(C('6'), Durations.sixteenth)
    .note(A('5'), Durations.sixteenth)
    .note(Bb('5'), Durations.sixteenth)
    .note(G('5'), Durations.sixteenth)
    .note(A('5'), Durations.sixteenth)
    .note(F('5'), Durations.sixteenth)

    // Bar 14: Descending sequence
    .note(G('5'), Durations.sixteenth)
    .note(F('5'), Durations.sixteenth)
    .note(E('5'), Durations.sixteenth)
    .note(D('5'), Durations.sixteenth)
    .note(C('5'), Durations.sixteenth)
    .note(Bb('4'), Durations.sixteenth)
    .note(A('4'), Durations.sixteenth)
    .note(G('4'), Durations.sixteenth)

    // Bar 15: Approach to cadence in F major
    .note(A('4'), Durations.sixteenth)
    .note(G('4'), Durations.sixteenth)
    .note(A('4'), Durations.sixteenth)
    .note(Bb('4'), Durations.sixteenth)
    .note(C('5'), Durations.sixteenth)
    .note(Bb('4'), Durations.sixteenth)
    .note(C('5'), Durations.sixteenth)
    .note(D('5'), Durations.sixteenth)

    // Bar 16: Cadence in F major
    .note(E('5'), Durations.sixteenth)
    .note(D('5'), Durations.sixteenth)
    .note(C('5'), Durations.sixteenth)
    .note(Bb('4'), Durations.sixteenth)
    .note(A('4'), Durations.sixteenth)
    .note(C('5'), Durations.sixteenth)
    .note(F('5'), Durations.quarter)
    .build();

  return new Voice(pattern, 'harpsichord');
}

/**
 * Creates the lower voice (left hand) - first 16 bars.
 *
 * The lower voice enters after a rest, providing harmonic support
 * and creating two-voice counterpoint with the upper voice through
 * imitative entries and independent melodic lines.
 */
function createLowerVoice(): Voice {
  const pattern = new PatternBuilder()
    // Bar 1: Rest while upper voice introduces motif
    .rest(Durations.half)

    // Bar 2: Lower voice enters with motif answer
    .note(D('4'), Durations.sixteenth)
    .note(C('4'), Durations.sixteenth)
    .note(D('4'), Durations.sixteenth)
    .note(E('4'), Durations.sixteenth)
    .note(F('4'), Durations.sixteenth)
    .note(E('4'), Durations.sixteenth)
    .note(F('4'), Durations.sixteenth)
    .note(G('4'), Durations.sixteenth)

    // Bar 3: Continuation
    .note(A('4'), Durations.sixteenth)
    .note(G('4'), Durations.sixteenth)
    .note(F('4'), Durations.sixteenth)
    .note(E('4'), Durations.sixteenth)
    .note(D('4'), Durations.sixteenth)
    .note(C('4'), Durations.sixteenth)
    .note(Bb('3'), Durations.sixteenth)
    .note(A('3'), Durations.sixteenth)

    // Bar 4: Counterpoint against upper voice
    .note(Bb('3'), Durations.sixteenth)
    .note(C('4'), Durations.sixteenth)
    .note(D('4'), Durations.sixteenth)
    .note(E('4'), Durations.sixteenth)
    .note(F('4'), Durations.sixteenth)
    .note(G('4'), Durations.sixteenth)
    .note(A('4'), Durations.sixteenth)
    .note(Bb('4'), Durations.sixteenth)

    // Bar 5: Scalar descent
    .note(C('5'), Durations.sixteenth)
    .note(Bb('4'), Durations.sixteenth)
    .note(A('4'), Durations.sixteenth)
    .note(G('4'), Durations.sixteenth)
    .note(F('4'), Durations.sixteenth)
    .note(E('4'), Durations.sixteenth)
    .note(D('4'), Durations.sixteenth)
    .note(C('4'), Durations.sixteenth)

    // Bar 6: Lower register movement
    .note(Bb('3'), Durations.sixteenth)
    .note(A('3'), Durations.sixteenth)
    .note(Bb('3'), Durations.sixteenth)
    .note(C('4'), Durations.sixteenth)
    .note(D('4'), Durations.sixteenth)
    .note(C('4'), Durations.sixteenth)
    .note(D('4'), Durations.sixteenth)
    .note(E('4'), Durations.sixteenth)

    // Bar 7: Approach to cadence
    .note(F('4'), Durations.sixteenth)
    .note(G('4'), Durations.sixteenth)
    .note(A('4'), Durations.sixteenth)
    .note(F('4'), Durations.sixteenth)
    .note(G('4'), Durations.sixteenth)
    .note(E('4'), Durations.sixteenth)
    .note(F('4'), Durations.sixteenth)
    .note(D('4'), Durations.sixteenth)

    // Bar 8: Cadence
    .note(E('4'), Durations.sixteenth)
    .note(C('4'), Durations.sixteenth)
    .note(D('4'), Durations.sixteenth)
    .note(Bb('3'), Durations.sixteenth)
    .note(A('3'), Durations.quarter)
    .rest(Durations.quarter)

    // Bar 9: Counterpoint against upper voice sequence
    .note(D('3'), Durations.sixteenth)
    .note(E('3'), Durations.sixteenth)
    .note(F('3'), Durations.sixteenth)
    .note(G('3'), Durations.sixteenth)
    .note(A('3'), Durations.sixteenth)
    .note(Bb('3'), Durations.sixteenth)
    .note(C('4'), Durations.sixteenth)
    .note(D('4'), Durations.sixteenth)

    // Bar 10: Contrary motion to upper voice
    .note(E('4'), Durations.sixteenth)
    .note(F('4'), Durations.sixteenth)
    .note(G('4'), Durations.sixteenth)
    .note(A('4'), Durations.sixteenth)
    .note(Bb('4'), Durations.sixteenth)
    .note(A('4'), Durations.sixteenth)
    .note(G('4'), Durations.sixteenth)
    .note(F('4'), Durations.sixteenth)

    // Bar 11: Imitative response - motif variant
    .note(Bb('3'), Durations.sixteenth)
    .note(A('3'), Durations.sixteenth)
    .note(Bb('3'), Durations.sixteenth)
    .note(C('4'), Durations.sixteenth)
    .note(D('4'), Durations.sixteenth)
    .note(C('4'), Durations.sixteenth)
    .note(D('4'), Durations.sixteenth)
    .note(E('4'), Durations.sixteenth)

    // Bar 12: Lower register support
    .note(F('4'), Durations.sixteenth)
    .note(E('4'), Durations.sixteenth)
    .note(D('4'), Durations.sixteenth)
    .note(C('4'), Durations.sixteenth)
    .note(Bb('3'), Durations.sixteenth)
    .note(A('3'), Durations.sixteenth)
    .note(G('3'), Durations.sixteenth)
    .note(F('3'), Durations.sixteenth)

    // Bar 13: Sequential development
    .note(E('3'), Durations.sixteenth)
    .note(F('3'), Durations.sixteenth)
    .note(G('3'), Durations.sixteenth)
    .note(A('3'), Durations.sixteenth)
    .note(Bb('3'), Durations.sixteenth)
    .note(C('4'), Durations.sixteenth)
    .note(D('4'), Durations.sixteenth)
    .note(E('4'), Durations.sixteenth)

    // Bar 14: Ascending toward cadence
    .note(F('4'), Durations.sixteenth)
    .note(G('4'), Durations.sixteenth)
    .note(A('4'), Durations.sixteenth)
    .note(Bb('4'), Durations.sixteenth)
    .note(C('5'), Durations.sixteenth)
    .note(Bb('4'), Durations.sixteenth)
    .note(A('4'), Durations.sixteenth)
    .note(G('4'), Durations.sixteenth)

    // Bar 15: Harmonic support for upper voice
    .note(F('4'), Durations.sixteenth)
    .note(E('4'), Durations.sixteenth)
    .note(F('4'), Durations.sixteenth)
    .note(G('4'), Durations.sixteenth)
    .note(A('4'), Durations.sixteenth)
    .note(G('4'), Durations.sixteenth)
    .note(F('4'), Durations.sixteenth)
    .note(E('4'), Durations.sixteenth)

    // Bar 16: Cadence in F major (tonic-dominant-tonic)
    .note(D('4'), Durations.sixteenth)
    .note(C('4'), Durations.sixteenth)
    .note(Bb('3'), Durations.sixteenth)
    .note(A('3'), Durations.sixteenth)
    .note(G('3'), Durations.sixteenth)
    .note(Bb('3'), Durations.sixteenth)
    .note(F('3'), Durations.quarter)
    .build();

  return new Voice(pattern, 'harpsichord');
}

/**
 * Create the complete composition.
 *
 * Bach's tempo marking would be around 96 BPM for this invention.
 * Time signature is 4/4 (common time).
 */
export function createBachInvention4(): Composition {
  const upperVoice = createUpperVoice();
  const lowerVoice = createLowerVoice();

  // Create a single track with two voices (traditional two-voice counterpoint)
  const track = new Track('Two-Voice Invention', [upperVoice, lowerVoice]);

  // Create the composition
  return new Composition('Invention No. 4 in D minor (BWV 775)', BPM(96))
    .addTrack(track);
}

// Export for easy import
export default createBachInvention4;
