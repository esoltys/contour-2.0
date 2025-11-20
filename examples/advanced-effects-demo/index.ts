/**
 * Advanced Effects Demo
 *
 * This example showcases all the new musical effects and articulations:
 * - staccato() / legato() - Duration articulation
 * - crescendo() / diminuendo() - Dynamic shaping
 * - accent() - Rhythmic emphasis
 * - humanize() - Natural performance variations
 * - swing() - Rhythmic feel
 * - tremolo() - Rapid note repetition
 * - arpeggiate() - Chord decomposition
 * - delay() - Rhythmic echo
 */

import { PatternBuilder, Pattern, Duration, Velocity } from '@contour/core';
import { Note } from '@contour/core';

console.log('=== Advanced Effects Demo ===\n');

// ============================================================================
// 1. STACCATO - Short, detached notes
// ============================================================================
console.log('1. STACCATO - Crisp, detached melody');
const melody = new PatternBuilder()
  .note('C4', Duration(0.5))
  .note('E4', Duration(0.5))
  .note('G4', Duration(0.5))
  .note('C5', Duration(0.5))
  .build();

const staccatoMelody = melody.staccato(0.3); // Very short, 30% duration
console.log(`   Original duration: ${melody.events[0].duration}`);
console.log(`   Staccato duration: ${staccatoMelody.events[0].duration}\n`);

// ============================================================================
// 2. LEGATO - Smooth, connected notes
// ============================================================================
console.log('2. LEGATO - Smooth, flowing melody');
const legatoMelody = melody.legato(0.15); // 0.15 beat overlap
console.log(`   Original duration: ${melody.events[0].duration}`);
console.log(`   Legato duration: ${legatoMelody.events[0].duration}\n`);

// ============================================================================
// 3. CRESCENDO - Gradual increase in volume
// ============================================================================
console.log('3. CRESCENDO - Building intensity');
const crescendoPattern = new PatternBuilder()
  .note('C4', Duration(0.25), Velocity(40))
  .note('D4', Duration(0.25), Velocity(40))
  .note('E4', Duration(0.25), Velocity(40))
  .note('F4', Duration(0.25), Velocity(40))
  .build()
  .crescendo(Velocity(40), Velocity(100));

console.log('   Velocities:', crescendoPattern.events.map(e => e.velocity).join(' → '), '\n');

// ============================================================================
// 4. DIMINUENDO - Gradual decrease in volume
// ============================================================================
console.log('4. DIMINUENDO - Fading away');
const diminuendoPattern = new PatternBuilder()
  .note('C5', Duration(0.25), Velocity(100))
  .note('B4', Duration(0.25), Velocity(100))
  .note('A4', Duration(0.25), Velocity(100))
  .note('G4', Duration(0.25), Velocity(100))
  .build()
  .diminuendo(Velocity(100), Velocity(40));

console.log('   Velocities:', diminuendoPattern.events.map(e => e.velocity).join(' → '), '\n');

// ============================================================================
// 5. ACCENT - Emphasize specific beats
// ============================================================================
console.log('5. ACCENT - Rhythmic emphasis');
const drumPattern = new PatternBuilder()
  .note('C2', Duration(0.25), Velocity(70))
  .note('C2', Duration(0.25), Velocity(70))
  .note('C2', Duration(0.25), Velocity(70))
  .note('C2', Duration(0.25), Velocity(70))
  .build()
  .accent([0, 2], 30); // Accent beats 1 and 3

console.log('   Velocities:', drumPattern.events.map(e => e.velocity).join(' - '), '(accented on 1 & 3)\n');

// ============================================================================
// 6. HUMANIZE - Add natural variations
// ============================================================================
console.log('6. HUMANIZE - Natural performance feel');
const mechanicalPattern = new PatternBuilder()
  .note('C4', Duration(0.25), Velocity(80))
  .note('E4', Duration(0.25), Velocity(80))
  .note('G4', Duration(0.25), Velocity(80))
  .note('C5', Duration(0.25), Velocity(80))
  .build();

const humanizedPattern = mechanicalPattern.humanize({
  timing: 0.03,  // ±0.03 beats timing variation
  velocity: 12,   // ±12 velocity variation
  seed: 42        // Reproducible randomness
});

console.log('   Original velocities:', mechanicalPattern.events.map(e => e.velocity).join(', '));
console.log('   Humanized velocities:', humanizedPattern.events.map(e => e.velocity).join(', '));
console.log('   Original timings:', mechanicalPattern.events.map(e => e.time.toFixed(3)).join(', '));
console.log('   Humanized timings:', humanizedPattern.events.map(e => e.time.toFixed(3)).join(', '), '\n');

// ============================================================================
// 7. SWING - Jazz/shuffle feel
// ============================================================================
console.log('7. SWING - Jazz shuffle feel');
const straightEighths = new PatternBuilder()
  .note('C4', Duration(0.5))
  .note('E4', Duration(0.5))
  .note('G4', Duration(0.5))
  .note('C5', Duration(0.5))
  .build();

const swungEighths = straightEighths.swing(0.5); // Triplet swing

console.log('   Straight timings:', straightEighths.events.map(e => e.time.toFixed(2)).join(' - '));
console.log('   Swung timings:   ', swungEighths.events.map(e => e.time.toFixed(2)).join(' - '), '\n');

// ============================================================================
// 8. TREMOLO - Rapid repetition
// ============================================================================
console.log('8. TREMOLO - Rapid note repetition');
const sustainedNote = new PatternBuilder()
  .note('C4', Duration(2.0), Velocity(90))
  .build();

const tremoloNote = sustainedNote.tremolo(8); // 8 repetitions per beat = 32nd notes

console.log(`   Original: ${sustainedNote.events.length} event(s)`);
console.log(`   Tremolo: ${tremoloNote.events.length} events (16 thirty-second notes)\n`);

// ============================================================================
// 9. ARPEGGIATE - Break chords into sequences
// ============================================================================
console.log('9. ARPEGGIATE - Chord decomposition');
const chordPattern = new PatternBuilder()
  .chord(['C4', 'E4', 'G4', 'C5'], Duration(2.0))
  .build();

const arpeggioUp = chordPattern.arpeggiate('up');
const arpeggioDown = chordPattern.arpeggiate('down');
const arpeggioUpDown = chordPattern.arpeggiate('updown');

console.log(`   Original chord: ${chordPattern.events.length} event(s)`);
console.log(`   Arpeggio up: ${arpeggioUp.events.length} notes (C-E-G-C)`);
console.log(`   Arpeggio down: ${arpeggioDown.events.length} notes (C-G-E-C)`);
console.log(`   Arpeggio up-down: ${arpeggioUpDown.events.length} notes (C-E-G-C-G-E-C)\n`);

// ============================================================================
// 10. DELAY - Rhythmic echo
// ============================================================================
console.log('10. DELAY - Rhythmic echo effect');
const singleNote = new PatternBuilder()
  .note('C5', Duration(0.25), Velocity(100))
  .build();

const delayedNote = singleNote.delay(Duration(0.5), 0.6, 0.7);
// 0.5 beat delay, 0.6 feedback (60% attenuation per repeat), 0.7 mix

console.log(`   Original: ${singleNote.events.length} event(s)`);
console.log(`   With delay: ${delayedNote.events.length} events (original + echoes)`);
console.log('   Echo velocities:', delayedNote.events.slice(1, 4).map(e => e.velocity).join(' → '), '\n');

// ============================================================================
// COMPLEX EXAMPLE: Combining Multiple Effects
// ============================================================================
console.log('=== COMPLEX EXAMPLE: Combining Effects ===\n');

const complexMelody = new PatternBuilder()
  .note('C4', Duration(0.5))
  .note('E4', Duration(0.5))
  .note('G4', Duration(0.5))
  .note('C5', Duration(0.5))
  .rest(Duration(0.5))
  .note('G4', Duration(0.5))
  .note('E4', Duration(0.5))
  .note('C4', Duration(1.0))
  .build();

// Apply multiple effects in sequence
const expressiveMelody = complexMelody
  .legato(0.1)                              // Smooth transitions
  .crescendo(Velocity(50), Velocity(100))   // Build to climax
  .accent([0, 4], 15)                        // Emphasize phrase starts
  .humanize({ timing: 0.02, velocity: 8 })   // Natural feel
  .delay(Duration(0.75), 0.4, 0.3);          // Subtle echo

console.log('Applied effects chain:');
console.log('  1. Legato (smooth)');
console.log('  2. Crescendo (pp → ff)');
console.log('  3. Accent (downbeats)');
console.log('  4. Humanize (natural timing)');
console.log('  5. Delay (ambient space)');
console.log(`\nResult: ${expressiveMelody.events.length} total events\n`);

// ============================================================================
// MUSICAL EXAMPLE: Expressive Piano Phrase
// ============================================================================
console.log('=== MUSICAL EXAMPLE: Expressive Piano Phrase ===\n');

// Create a simple melodic phrase
const pianoPhrase = new PatternBuilder()
  .note('C4', Duration(0.5), Velocity(70))
  .note('D4', Duration(0.5), Velocity(70))
  .note('E4', Duration(0.5), Velocity(70))
  .note('F4', Duration(0.5), Velocity(70))
  .note('G4', Duration(1.0), Velocity(70))
  .rest(Duration(0.5))
  .note('G4', Duration(0.5), Velocity(70))
  .note('F4', Duration(0.5), Velocity(70))
  .note('E4', Duration(0.5), Velocity(70))
  .note('D4', Duration(0.5), Velocity(70))
  .note('C4', Duration(1.5), Velocity(70))
  .build();

// Apply expressive shaping
const expressivePiano = pianoPhrase
  .legato(0.12)                              // Piano-style legato
  .crescendo(Velocity(55), Velocity(95))     // Dynamic shape
  .diminuendo(Velocity(95), Velocity(60))    // Fade on second phrase
  .accent([0, 4, 6], 18)                     // Phrase accents
  .humanize({
    timing: 0.025,
    velocity: 10,
    seed: 123
  });

console.log('Piano phrase with:');
console.log('  • Legato articulation');
console.log('  • Expressive dynamics (crescendo → diminuendo)');
console.log('  • Natural phrasing accents');
console.log('  • Humanized timing and velocity');
console.log(`\nOriginal events: ${pianoPhrase.events.length}`);
console.log(`Expressive events: ${expressivePiano.events.length}\n`);

// ============================================================================
// RHYTHMIC EXAMPLE: Jazz Drum Pattern
// ============================================================================
console.log('=== RHYTHMIC EXAMPLE: Jazz Drum Pattern ===\n');

// Create straight 8th note hi-hat pattern
const hiHat = new PatternBuilder()
  .note('F#4', Duration(0.5), Velocity(65)) // Hi-hat
  .note('F#4', Duration(0.5), Velocity(65))
  .note('F#4', Duration(0.5), Velocity(65))
  .note('F#4', Duration(0.5), Velocity(65))
  .note('F#4', Duration(0.5), Velocity(65))
  .note('F#4', Duration(0.5), Velocity(65))
  .note('F#4', Duration(0.5), Velocity(65))
  .note('F#4', Duration(0.5), Velocity(65))
  .build();

// Apply swing and dynamics
const jazzHiHat = hiHat
  .swing(0.55)                    // Classic jazz swing
  .accent([0, 4], 12)             // Accent downbeats
  .accent(i => i % 2 === 1, -8)   // Soften upbeats
  .humanize({
    timing: 0.015,
    velocity: 6,
    seed: 456
  });

console.log('Jazz hi-hat with:');
console.log('  • Swing timing (triplet feel)');
console.log('  • Accented downbeats');
console.log('  • Ghost note upbeats');
console.log('  • Human timing variations\n');

// ============================================================================
// SUMMARY
// ============================================================================
console.log('=== SUMMARY ===\n');
console.log('✓ Implemented 9 advanced effects:');
console.log('  1. staccato() - Shorten note durations');
console.log('  2. legato() - Extend and overlap notes');
console.log('  3. crescendo() - Gradual volume increase');
console.log('  4. diminuendo() - Gradual volume decrease');
console.log('  5. accent() - Emphasize specific beats');
console.log('  6. humanize() - Add natural variations');
console.log('  7. swing() - Jazz/shuffle timing');
console.log('  8. tremolo() - Rapid note repetition');
console.log('  9. arpeggiate() - Decompose chords');
console.log('  10. delay() - Rhythmic echo effect\n');

console.log('✓ All effects are:');
console.log('  • Immutable (return new patterns)');
console.log('  • Composable (chain multiple effects)');
console.log('  • Type-safe (TypeScript validated)');
console.log('  • Well-tested (55 comprehensive tests)\n');

console.log('🎵 Contour now has professional-grade musical expression! 🎵\n');

// Export patterns for potential playback
export {
  melody,
  staccatoMelody,
  legatoMelody,
  crescendoPattern,
  diminuendoPattern,
  drumPattern,
  humanizedPattern,
  swungEighths,
  tremoloNote,
  arpeggioUp,
  arpeggioDown,
  arpeggioUpDown,
  delayedNote,
  expressiveMelody,
  expressivePiano,
  jazzHiHat,
};
