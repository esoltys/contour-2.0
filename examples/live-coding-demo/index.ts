/**
 * Live Coding Demo - Showcasing Mini-Notation and Pattern Algebra
 *
 * This demo demonstrates the concise, expressive syntax enabled by Phase 6:
 * - Mini-notation for rapid pattern creation
 * - Pattern algebra operations
 * - Euclidean rhythms
 * - Real-time pattern transformation
 *
 * Run this with hot-reload enabled to experience live coding!
 */

import {
  pattern,
  Pattern,
  parseMiniNotation,
  Durations,
  Velocity,
} from '@contour/core';

// ============================================================================
// EXAMPLE 1: Mini-Notation Basics
// ============================================================================
console.log('=== Example 1: Mini-Notation Basics ===\n');

// Traditional verbose syntax
const verboseMelody = pattern()
  .note('C4', Durations.quarter)
  .note('E4', Durations.quarter)
  .note('G4', Durations.quarter)
  .note('C5', Durations.quarter)
  .build();

// Equivalent concise mini-notation syntax
const conciseMelody = pattern()
  .fromNotation('C4 E4 G4 C5')
  .build();

console.log(`Verbose: ${verboseMelody.events.length} events`);
console.log(`Concise: ${conciseMelody.events.length} events`);
console.log('Both produce the same result!\n');

// ============================================================================
// EXAMPLE 2: Rhythm Patterns with Repetition and Rests
// ============================================================================
console.log('=== Example 2: Rhythm Patterns ===\n');

// Kick drum pattern: "boom boom boom boom"
const kickPattern = pattern()
  .fromNotation('C2*4')
  .build();

// Snare pattern: "_ hit _ hit" (rests on beats 1 and 3)
const snarePattern = pattern()
  .fromNotation('~ C3 ~ C3')
  .build();

// Hi-hat pattern: 8 rapid hits
const hihatPattern = pattern()
  .fromNotation('C4*8')
  .withDuration(Durations.eighth)
  .build();

console.log(`Kick: ${kickPattern.events.length} events`);
console.log(`Snare: ${snarePattern.events.length} events`);
console.log(`Hi-hat: ${hihatPattern.events.length} events\n`);

// ============================================================================
// EXAMPLE 3: Subdivisions and Grouping
// ============================================================================
console.log('=== Example 3: Subdivisions ===\n');

// Complex rhythm with subdivisions: "C4 [E4 G4] C5"
// The [E4 G4] group is subdivided within one beat
const complexRhythm = pattern()
  .fromNotation('C4 [E4 G4] C5')
  .build();

console.log(`Complex rhythm: ${complexRhythm.events.length} events`);
console.log('Middle beat is subdivided into two notes\n');

// ============================================================================
// EXAMPLE 4: Octave Persistence
// ============================================================================
console.log('=== Example 4: Octave Persistence ===\n');

// Type the octave once, it persists!
const scale = pattern()
  .fromNotation('C4 D E F G A B C5')
  .build();

console.log('C major scale using octave persistence:');
scale.events.forEach((e, i) => {
  if (e.type === 'note') {
    console.log(`  ${i + 1}. ${e.note.name}`);
  }
});
console.log();

// ============================================================================
// EXAMPLE 5: Chord Symbols
// ============================================================================
console.log('=== Example 5: Chord Progressions ===\n');

// Jazz progression using chord symbols
const jazzChords = pattern()
  .fromNotation('Cmaj7 Dm7 G7 Cmaj7')
  .build();

console.log('Jazz chord progression (ii-V-I in C):');
jazzChords.events.forEach((e, i) => {
  if (e.type === 'chord') {
    console.log(`  ${i + 1}. ${e.notes.map(n => n.name).join(', ')}`);
  }
});
console.log();

// ============================================================================
// EXAMPLE 6: Pattern Algebra - Stack and Append
// ============================================================================
console.log('=== Example 6: Pattern Algebra (Stack & Append) ===\n');

// Create individual patterns
const melody1 = pattern().fromNotation('C4 E4 G4').build();
const melody2 = pattern().fromNotation('D4 F4 A4').build();
const bassline = pattern().fromNotation('C2@4').build(); // Long bass note

// Stack patterns (play simultaneously)
const harmonyStack = melody1.stack(bassline);
console.log(`Stacked (melody + bass): ${harmonyStack.events.length} events simultaneously`);

// Append patterns (play sequentially)
const melodicSequence = melody1.append(melody2);
console.log(`Appended (melody 1 then 2): ${melodicSequence.events.length} events in sequence\n`);

// ============================================================================
// EXAMPLE 7: Palindrome
// ============================================================================
console.log('=== Example 7: Palindrome ===\n');

const ascendingScale = pattern().fromNotation('C4 D E F').build();
const palindromeScale = ascendingScale.palindrome();

console.log('Palindrome (up then down):');
palindromeScale.events.forEach((e, i) => {
  if (e.type === 'note') {
    console.log(`  ${i + 1}. ${e.note.name}`);
  }
});
console.log();

// ============================================================================
// EXAMPLE 8: Euclidean Rhythms
// ============================================================================
console.log('=== Example 8: Euclidean Rhythms ===\n');

// Euclidean rhythm: distribute 5 pulses evenly across 16 steps
const euclideanRhythm = Pattern.euclidean(16, 5);

console.log('Euclidean(16, 5) - Classic clave rhythm:');
const rhythmVisualization = euclideanRhythm.events
  .map(e => e.type === 'note' ? 'X' : '.')
  .join(' ');
console.log(`  ${rhythmVisualization}`);
console.log();

// Different distributions
console.log('More Euclidean patterns:');
const patterns = [
  { steps: 8, pulses: 3, name: 'Tresillo' },
  { steps: 8, pulses: 5, name: 'Cinquillo' },
  { steps: 16, pulses: 9, name: 'Rumba' },
];

patterns.forEach(({ steps, pulses, name }) => {
  const p = Pattern.euclidean(steps, pulses);
  const viz = p.events.map(e => e.type === 'note' ? 'X' : '.').join(' ');
  console.log(`  ${name} (${steps}, ${pulses}): ${viz}`);
});
console.log();

// ============================================================================
// EXAMPLE 9: Euclidean Rhythm with Rotation
// ============================================================================
console.log('=== Example 9: Euclidean Rhythm Rotation ===\n');

const euclidean1 = Pattern.euclidean(8, 3, 0); // No rotation
const euclidean2 = Pattern.euclidean(8, 3, 2); // Rotate by 2

console.log('Euclidean(8, 3) - Different rotations:');
console.log(`  Original: ${euclidean1.events.map(e => e.type === 'note' ? 'X' : '.').join(' ')}`);
console.log(`  Rotated:  ${euclidean2.events.map(e => e.type === 'note' ? 'X' : '.').join(' ')}`);
console.log();

// ============================================================================
// EXAMPLE 10: Combining Everything - Live Coding Style
// ============================================================================
console.log('=== Example 10: Complete Generative Pattern ===\n');

// Create a generative, evolving pattern using all techniques
const evolving = (() => {
  // Melodic phrase with mini-notation
  const phrase = pattern()
    .fromNotation('C4 [E4 G4] C5/8*2 ~')
    .build();

  // Euclidean hi-hat rhythm
  const hihat = Pattern.euclidean(16, 11)
    .fast(0.5) // Stretch out
    .transpose(36); // Move to hi-hat range

  // Bass line with chords
  const bass = pattern()
    .fromNotation('Cmaj7@2 Fmaj7@2')
    .build()
    .slow(2); // Half speed

  // Combine everything
  return phrase
    .stack(hihat)
    .stack(bass);
})();

console.log(`Complex generative pattern: ${evolving.events.length} events total`);
console.log('Combining melody, euclidean rhythms, chords, and transformations!\n');

// ============================================================================
// EXAMPLE 11: Interactive Live Coding Pattern
// ============================================================================
console.log('=== Example 11: Live Coding Pattern (Modify and Hot-Reload!) ===\n');

// This is where the magic happens - change these patterns and see instant results!
const liveMelody = pattern()
  .fromNotation('C4 E4 G4 C5')
  .build()
  .fast(2)     // Try changing this!
  .transpose(0); // Try: 7 (perfect fifth), -12 (octave down)

const liveRhythm = Pattern.euclidean(16, 7) // Try different numbers!
  .map((e, i) => ({
    ...e,
    velocity: Velocity(40 + i * 5), // Crescendo
  }));

const liveCombined = liveMelody
  .stack(liveRhythm)
  .append(liveMelody.retrograde()); // Add a retrograde!

console.log('LIVE CODING PATTERN:');
console.log(`  Melody: ${liveMelody.events.length} events`);
console.log(`  Rhythm: ${liveRhythm.events.length} events`);
console.log(`  Combined: ${liveCombined.events.length} events`);
console.log('\n💡 TIP: Modify the values above and hot-reload to hear changes instantly!\n');

// ============================================================================
// EXAMPLE 12: TidalCycles-Style Complex Pattern
// ============================================================================
console.log('=== Example 12: TidalCycles-Inspired Pattern ===\n');

// Super concise, rhythmic mini-notation
const tidalPattern = pattern()
  .fromNotation('C4*4 [E4 G4]*2 ~ C5@2')
  .build()
  .fast(2)
  .palindrome();

console.log('TidalCycles-style pattern:');
console.log(`  Events: ${tidalPattern.events.length}`);
console.log(`  Duration: ${tidalPattern.duration} beats`);
console.log('  Structure: Fast repetitions, subdivisions, rests, holds, palindrome\n');

// ============================================================================
// SUMMARY
// ============================================================================
console.log('=== Summary ===\n');
console.log('✓ Mini-notation enables concise, readable patterns');
console.log('✓ Pattern algebra (stack, append, palindrome) for composition');
console.log('✓ Euclidean rhythms for algorithmic generation');
console.log('✓ Octave persistence reduces typing');
console.log('✓ Chord symbols via Tonal.js');
console.log('✓ All features compose beautifully!');
console.log('\n🎵 Contour is ready for live coding! 🎵\n');

export {
  verboseMelody,
  conciseMelody,
  kickPattern,
  snarePattern,
  hihatPattern,
  complexRhythm,
  scale,
  jazzChords,
  harmonyStack,
  melodicSequence,
  palindromeScale,
  euclideanRhythm,
  evolving,
  liveMelody,
  liveRhythm,
  liveCombined,
  tidalPattern,
};
