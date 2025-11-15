/**
 * Sample Library Demo - Simple Melody
 *
 * This example demonstrates using sampled instruments from soundfont-player
 * instead of Tone.js synthesizers.
 *
 * Features demonstrated:
 * - Loading a sampled piano instrument
 * - Creating a simple melody with the sampled instrument
 * - Mixing sampled instruments with Tone.js synths
 * - Type-safe instrument names with GMInstrument enum
 */

import {
  Composition,
  Track,
  Voice,
  PatternBuilder,
  Note,
  BPM,
} from '@contour/core';
import {
  CompositionScheduler,
  SampleLibraryManager,
  GMInstrument,
  SoundfontLibrary,
  createQualifiedName,
  Tone,
} from '@contour/tone-adapter';

/**
 * Create a simple melody using a sampled piano.
 */
async function createSampledPianoMelody() {
  console.log('🎹 Sample Library Demo - Simple Melody');
  console.log('='.repeat(50));

  // Step 1: Create the sample library manager
  console.log('\n1. Initializing sample library manager...');
  const sampleManager = new SampleLibraryManager();
  await sampleManager.initialize(Tone.getContext().rawContext);
  console.log('   ✓ Sample library manager initialized');

  // Step 2: Create a simple melody pattern
  console.log('\n2. Creating melody pattern...');
  const melody = new PatternBuilder()
    .addNote(Note.fromName('C4'), 0.5)
    .addNote(Note.fromName('D4'), 0.5)
    .addNote(Note.fromName('E4'), 0.5)
    .addNote(Note.fromName('F4'), 0.5)
    .addNote(Note.fromName('G4'), 0.5)
    .addNote(Note.fromName('A4'), 0.5)
    .addNote(Note.fromName('B4'), 0.5)
    .addNote(Note.fromName('C5'), 1.0)
    .build();
  console.log(`   ✓ Melody created (${melody.events.length} notes)`);

  // Step 3: Create a voice with a SAMPLED piano (using qualified name)
  console.log('\n3. Creating voice with sampled piano...');
  const qualifiedPianoName = createQualifiedName(
    SoundfontLibrary.MusyngKite,
    GMInstrument.AcousticGrandPiano
  );
  console.log(`   Using: ${qualifiedPianoName}`);

  const sampledPianoVoice = new Voice(melody, qualifiedPianoName);
  console.log('   ✓ Voice created with sampled instrument');

  // Step 4: Create a second voice with a Tone.js synth for comparison
  console.log('\n4. Creating voice with Tone.js synth...');
  const synthVoice = new Voice(
    melody.transpose(7), // Transpose up a fifth for harmony
    'synth' // Simple name = Tone.js synth
  );
  console.log('   ✓ Voice created with Tone.js synth');

  // Step 5: Create the composition
  console.log('\n5. Creating composition...');
  const composition = new Composition('Sample Library Demo', BPM(120))
    .addTrack(new Track('Sampled Piano', [sampledPianoVoice]))
    .addTrack(new Track('Synth Harmony', [synthVoice]));

  console.log(`   Title: ${composition.title}`);
  console.log(`   Tempo: ${composition.tempo} BPM`);
  console.log(`   Tracks: ${composition.trackCount}`);
  console.log(`   Duration: ${composition.duration.toFixed(2)} seconds`);

  // Step 6: Schedule the composition
  console.log('\n6. Scheduling composition...');
  const scheduler = new CompositionScheduler();
  scheduler.setSampleLibraryManager(sampleManager);

  console.log('   Loading instruments and scheduling events...');
  await scheduler.scheduleComposition(composition);
  console.log('   ✓ Composition scheduled');

  // Step 7: Start playback
  console.log('\n7. Starting playback...');
  console.log('   (Note: Requires user gesture in browser environment)');

  await scheduler.start();

  console.log('   ✓ Playback started!');
  console.log(`   Position: ${scheduler.position.toFixed(2)}s`);
  console.log(`   State: ${scheduler.state}`);
  console.log('\n   🎵 Listen for the difference between sampled piano and synth!');

  // Wait for composition to finish
  const duration = composition.duration as number;
  await new Promise(resolve => setTimeout(resolve, (duration + 1) * 1000));

  console.log('\n✓ Playback complete');

  // Cleanup
  scheduler.stop();
  scheduler.dispose();
  sampleManager.dispose();

  console.log('✓ Resources cleaned up');
}

/**
 * Create a chord progression using sampled instruments.
 */
async function createSampledChordProgression() {
  console.log('\n\n🎹 Sample Library Demo - Chord Progression');
  console.log('='.repeat(50));

  // Initialize sample library manager
  console.log('\n1. Initializing sample library manager...');
  const sampleManager = new SampleLibraryManager();
  await sampleManager.initialize(Tone.getContext().rawContext);
  console.log('   ✓ Initialized');

  // Create chord progression: C - Am - F - G
  console.log('\n2. Creating chord progression...');

  const chordPattern = new PatternBuilder()
    // C Major
    .addChord([
      Note.fromName('C3'),
      Note.fromName('E3'),
      Note.fromName('G3'),
    ], 1.0)
    // A Minor
    .addChord([
      Note.fromName('A2'),
      Note.fromName('C3'),
      Note.fromName('E3'),
    ], 1.0)
    // F Major
    .addChord([
      Note.fromName('F2'),
      Note.fromName('A2'),
      Note.fromName('C3'),
    ], 1.0)
    // G Major
    .addChord([
      Note.fromName('G2'),
      Note.fromName('B2'),
      Note.fromName('D3'),
    ], 1.0)
    .build();

  console.log(`   ✓ Created ${chordPattern.events.length} chords`);

  // Create voice with sampled acoustic bass
  console.log('\n3. Creating voice with sampled acoustic bass...');
  const qualifiedBassName = createQualifiedName(
    SoundfontLibrary.MusyngKite,
    GMInstrument.AcousticBass
  );

  const bassVoice = new Voice(chordPattern, qualifiedBassName);
  console.log(`   Using: ${qualifiedBassName}`);

  // Create composition
  const composition = new Composition('Chord Progression', BPM(80))
    .addTrack(new Track('Bass', [bassVoice]));

  // Schedule and play
  console.log('\n4. Scheduling and playing...');
  const scheduler = new CompositionScheduler();
  scheduler.setSampleLibraryManager(sampleManager);

  await scheduler.scheduleComposition(composition);
  await scheduler.start();

  console.log('   ✓ Playing chord progression with sampled acoustic bass!');

  // Wait for completion
  const duration = composition.duration as number;
  await new Promise(resolve => setTimeout(resolve, (duration + 1) * 1000));

  // Cleanup
  scheduler.stop();
  scheduler.dispose();
  sampleManager.dispose();

  console.log('\n✓ Demo complete');
}

/**
 * Main demo function - runs both examples.
 */
async function main() {
  try {
    // Example 1: Simple melody with sampled piano + synth harmony
    await createSampledPianoMelody();

    // Wait a bit between examples
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Example 2: Chord progression with sampled bass
    await createSampledChordProgression();

    console.log('\n\n✨ All demos completed successfully!');
    console.log('\nKey takeaways:');
    console.log('  • Qualified names like "MusyngKite:acoustic_grand_piano" load samples');
    console.log('  • Simple names like "synth" use Tone.js synthesizers');
    console.log('  • Both can be mixed in the same composition');
    console.log('  • Type-safe instrument selection with GMInstrument enum');
    console.log('  • Automatic instrument loading via CompositionScheduler');

  } catch (error) {
    console.error('\n❌ Error during demo:', error);
    process.exit(1);
  }
}

export { createSampledPianoMelody, createSampledChordProgression, main };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
