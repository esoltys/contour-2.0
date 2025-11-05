/**
 * Bach Invention No. 4 in D minor (BWV 775)
 *
 * This is the PRIMARY ACCEPTANCE TEST for Phase 4.
 * Demonstrates:
 * - Two independent voices (counterpoint)
 * - D minor key with accidentals
 * - Proper timing and voice independence
 * - Multi-track composition
 *
 * This is a simplified version of the opening measures.
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
 * Creates the upper voice (right hand) - first 8 bars simplified.
 *
 * The invention opens with a characteristic sixteenth-note figure
 * that ascends and descends the D minor scale.
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
    .build();

  return new Voice(pattern, 'harpsichord');
}

/**
 * Creates the lower voice (left hand) - first 8 bars simplified.
 *
 * The lower voice enters after a rest, providing harmonic support
 * and creating two-voice counterpoint with the upper voice.
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
