/**
 * Lo-Fi Chill Composition
 *
 * A modern multi-track lo-fi composition featuring:
 * - Jazzy chord progressions with 7th/9th chords
 * - Laid-back drums with vinyl feel
 * - Warm electric piano (Rhodes)
 * - Smooth bass line
 * - Ambient textures with vibraphone
 * - Duration: 3+ minutes with intro/verse/chorus/outro structure
 *
 * Tempo: 78 BPM (classic lo-fi speed)
 * Key: D minor / F major (relative major)
 * Time: 4/4
 */

import {
  Composition,
  Track,
  Voice,
  Pattern,
  PatternBuilder,
  Note,
  BPM,
  Velocity,
  MIDINote,
} from '@contour/core';
import {
  CompositionScheduler,
  SampleLibraryManager,
  GMInstrument,
  SoundfontLibrary,
  createQualifiedName,
  Tone,
  MusicalSynth,
} from '@contour/tone-adapter';

/**
 * Create jazzy chord progression for lo-fi feel.
 * Progression: Dm7 - Gm7 - Cmaj7 - Fmaj7 (i-iv-VII-IV in D minor)
 */
function createChordProgression(): PatternBuilder {
  const pattern = new PatternBuilder();

  // Dm7 (D-F-A-C)
  pattern.chord([
    new Note('D3'),
    new Note('F3'),
    new Note('A3'),
    new Note('C4'),
  ], 2.0, Velocity(70));

  // Gm7 (G-Bb-D-F)
  pattern.chord([
    new Note('G3'),
    new Note('Bb3'),
    new Note('D4'),
    new Note('F4'),
  ], 2.0, Velocity(70));

  // Cmaj7 (C-E-G-B)
  pattern.chord([
    new Note('C3'),
    new Note('E3'),
    new Note('G3'),
    new Note('B3'),
  ], 2.0, Velocity(70));

  // Fmaj7 (F-A-C-E)
  pattern.chord([
    new Note('F3'),
    new Note('A3'),
    new Note('C4'),
    new Note('E4'),
  ], 2.0, Velocity(70));

  return pattern;
}

/**
 * Create bass line that follows the chord progression.
 */
function createBassLine(): PatternBuilder {
  const pattern = new PatternBuilder();

  // Dm7 - root and fifth
  pattern
    .note(new Note('D2'), 1.0, Velocity(75))
    .note(new Note('A2'), 0.5, Velocity(65))
    .note(new Note('D2'), 0.5, Velocity(70));

  // Gm7 - root and fifth
  pattern
    .note(new Note('G2'), 1.0, Velocity(75))
    .note(new Note('D3'), 0.5, Velocity(65))
    .note(new Note('G2'), 0.5, Velocity(70));

  // Cmaj7 - root and fifth
  pattern
    .note(new Note('C2'), 1.0, Velocity(75))
    .note(new Note('G2'), 0.5, Velocity(65))
    .note(new Note('C2'), 0.5, Velocity(70));

  // Fmaj7 - root and fifth
  pattern
    .note(new Note('F2'), 1.0, Velocity(75))
    .note(new Note('C3'), 0.5, Velocity(65))
    .note(new Note('F2'), 0.5, Velocity(70));

  return pattern;
}

/**
 * Create drum pattern with lo-fi feel.
 * Uses GM drum notes: Kick (C1/36), Snare (D1/38), Closed Hat (F#1/42), Open Hat (A#1/46)
 */
function createDrumPattern(): PatternBuilder {
  const pattern = new PatternBuilder();

  // Bar 1
  // Beat 1: Kick + Closed Hat
  pattern.chord([Note.fromMIDI(MIDINote(36)), Note.fromMIDI(MIDINote(42))], 0.25, Velocity(90));
  pattern.note(Note.fromMIDI(MIDINote(42)), 0.25, Velocity(50)); // Hat
  // Beat 2: Snare + Closed Hat
  pattern.chord([Note.fromMIDI(MIDINote(38)), Note.fromMIDI(MIDINote(42))], 0.25, Velocity(85));
  pattern.note(Note.fromMIDI(MIDINote(42)), 0.25, Velocity(50)); // Hat

  // Beat 3: Kick + Closed Hat
  pattern.chord([Note.fromMIDI(MIDINote(36)), Note.fromMIDI(MIDINote(42))], 0.25, Velocity(90));
  pattern.note(Note.fromMIDI(MIDINote(42)), 0.25, Velocity(50)); // Hat
  // Beat 4: Snare + Closed Hat
  pattern.chord([Note.fromMIDI(MIDINote(38)), Note.fromMIDI(MIDINote(42))], 0.25, Velocity(85));
  pattern.note(Note.fromMIDI(MIDINote(42)), 0.25, Velocity(50)); // Hat

  return pattern;
}

/**
 * Create melodic element with vibraphone - sparse and ambient.
 */
function createMelody(): PatternBuilder {
  const pattern = new PatternBuilder();

  // Sparse melodic notes over 8 beats
  pattern
    .note(new Note('F4'), 0.5, Velocity(60))
    .rest(0.5)
    .note(new Note('E4'), 0.5, Velocity(55))
    .rest(1.5)
    .note(new Note('D4'), 0.5, Velocity(60))
    .rest(0.5)
    .note(new Note('C4'), 0.5, Velocity(55))
    .rest(0.5)
    .note(new Note('A3'), 1.0, Velocity(65))
    .rest(2.0);

  return pattern;
}

/**
 * Create ambient pad pattern with long sustained notes.
 */
function createPadPattern(): PatternBuilder {
  const pattern = new PatternBuilder();

  // Long sustained chords
  // Dm chord
  pattern.chord([
    new Note('D4'),
    new Note('F4'),
    new Note('A4'),
  ], 4.0, Velocity(40));

  // Gm chord
  pattern.chord([
    new Note('G4'),
    new Note('Bb4'),
    new Note('D5'),
  ], 4.0, Velocity(40));

  return pattern;
}

/**
 * Create the full composition with structure.
 */
export async function createLoFiComposition(): Promise<{
  composition: Composition;
  scheduler: CompositionScheduler;
  sampleManager: SampleLibraryManager;
}> {
  console.log('🎵 Creating Lo-Fi Chill Composition');
  console.log('='.repeat(60));

  // Initialize sample library manager
  console.log('\n1. Initializing sample library manager...');
  const sampleManager = new SampleLibraryManager();
  await sampleManager.initialize(Tone.getContext().rawContext);
  console.log('   ✓ Sample library initialized');

  // Create patterns
  console.log('\n2. Creating musical patterns...');
  const chords = createChordProgression().build();
  const bass = createBassLine().build();
  const drums = createDrumPattern().build();
  const melody = createMelody().build();
  const pads = createPadPattern().build();
  console.log(`   ✓ Chords: ${chords.events.length} events`);
  console.log(`   ✓ Bass: ${bass.events.length} events`);
  console.log(`   ✓ Drums: ${drums.events.length} events`);
  console.log(`   ✓ Melody: ${melody.events.length} events`);
  console.log(`   ✓ Pads: ${pads.events.length} events`);

  // Build composition structure
  console.log('\n3. Building composition structure...');

  // Helper to repeat a pattern multiple times
  const repeatPattern = (pattern: Pattern, times: number): Pattern => {
    let result = pattern;
    for (let i = 1; i < times; i++) {
      result = result.append(pattern);
    }
    return result;
  };

  // Intro (16 bars = 4 cycles of 4-bar progression) - just chords and bass
  let fullChords = repeatPattern(chords, 4); // 4 cycles for intro
  let fullBass = repeatPattern(bass, 4);

  // A Section (32 bars = 8 cycles) - add drums, melody, pads
  fullChords = fullChords.append(repeatPattern(chords, 8));
  fullBass = fullBass.append(repeatPattern(bass, 8));
  const fullDrums = repeatPattern(drums, 48); // 48 bars of drums (A + B + A2)
  const fullMelody = repeatPattern(melody, 6) // 6 cycles of melody
    .append(repeatPattern(melody.transpose(5), 6)) // B section transposed up
    .append(repeatPattern(melody, 6)); // A2 section back to original
  let fullPads = repeatPattern(pads, 12); // 12 cycles of pads (A + B + A2)

  // B Section (32 bars = 8 cycles) - already included above
  fullChords = fullChords.append(repeatPattern(chords, 8));
  fullBass = fullBass.append(repeatPattern(bass, 8));

  // A Section Repeat (32 bars = 8 cycles) - already included above
  fullChords = fullChords.append(repeatPattern(chords, 8));
  fullBass = fullBass.append(repeatPattern(bass, 8));

  // Outro (16 bars = 4 cycles) - fade out, just chords and bass
  fullChords = fullChords.append(repeatPattern(chords, 4));
  fullBass = fullBass.append(repeatPattern(bass, 4));

  console.log('   ✓ Intro: 16 bars (chords + bass)');
  console.log('   ✓ A Section: 32 bars (+ drums + melody + pads)');
  console.log('   ✓ B Section: 32 bars (melody transposed)');
  console.log('   ✓ A Section (repeat): 32 bars');
  console.log('   ✓ Outro: 16 bars (chords + bass)');
  console.log(`   ✓ Total: 128 bars (~${(128 * 4 * 60 / 78).toFixed(0)} seconds at 78 BPM)`);

  // Create instruments using qualified names
  console.log('\n4. Configuring instruments...');
  const electricPiano = createQualifiedName(
    SoundfontLibrary.MusyngKite,
    GMInstrument.ElectricPiano1 // Rhodes-like sound
  );
  const electricBass = createQualifiedName(
    SoundfontLibrary.MusyngKite,
    GMInstrument.ElectricBassFinger
  );
  const vibes = createQualifiedName(
    SoundfontLibrary.MusyngKite,
    GMInstrument.Vibraphone
  );

  console.log(`   ✓ Electric Piano: ${electricPiano}`);
  console.log(`   ✓ Electric Bass: ${electricBass}`);
  console.log(`   ✓ Vibraphone: ${vibes}`);
  console.log('   ✓ Drums: Tone.js MembraneSynth + MetalSynth');
  console.log('   ✓ Pads: Tone.js PolySynth');

  // Create voices
  const chordVoice = new Voice(fullChords, electricPiano);
  const bassVoice = new Voice(fullBass, electricBass);
  const drumVoice = new Voice(fullDrums, 'drums'); // Special handling for drums
  const melodyVoice = new Voice(fullMelody, vibes);
  const padVoice = new Voice(fullPads, 'pad'); // Synth pad

  // Create composition
  const composition = new Composition('Lo-Fi Chill', BPM(78))
    .addTrack(new Track('Chords', [chordVoice]))
    .addTrack(new Track('Bass', [bassVoice]))
    .addTrack(new Track('Drums', [drumVoice]))
    .addTrack(new Track('Melody', [melodyVoice]))
    .addTrack(new Track('Pads', [padVoice]));

  console.log('\n5. Composition created!');
  console.log(`   Title: ${composition.title}`);
  console.log(`   Tempo: ${composition.tempo} BPM`);
  console.log(`   Tracks: ${composition.trackCount}`);
  console.log(`   Duration: ${composition.duration.toFixed(2)} seconds (~${(composition.duration / 60).toFixed(2)} minutes)`);

  // Create scheduler
  console.log('\n6. Setting up scheduler...');
  const scheduler = new CompositionScheduler();
  scheduler.setSampleLibraryManager(sampleManager);

  return { composition, scheduler, sampleManager };
}

/**
 * Add effects to enhance the lo-fi sound.
 */
async function setupEffects(scheduler: CompositionScheduler) {
  console.log('\n   Adding effects for lo-fi polish...');

  // Reverb for ambient space
  const reverb = new Tone.Reverb({
    decay: 3,
    wet: 0.3,
  }).toDestination();
  await reverb.generate(); // Must wait for impulse response

  // Lowpass filter for warmth
  const lowpass = new Tone.Filter({
    frequency: 3000,
    type: 'lowpass',
    rolloff: -12,
  });

  // Slight compression for glue
  const compressor = new Tone.Compressor({
    threshold: -20,
    ratio: 4,
    attack: 0.003,
    release: 0.25,
  });

  // Chain: lowpass -> reverb -> compressor -> destination
  lowpass.connect(reverb);
  reverb.connect(compressor);
  compressor.toDestination();

  console.log('   ✓ Effects chain: Lowpass Filter -> Reverb -> Compressor');

  return { reverb, lowpass, compressor };
}

/**
 * Play the lo-fi composition.
 */
export async function playLoFiComposition() {
  const { composition, scheduler, sampleManager } = await createLoFiComposition();

  try {
    console.log('\n7. Setting up effects chain...');
    const effects = await setupEffects(scheduler);
    console.log('   ✓ Effects ready');

    console.log('\n8. Scheduling composition...');
    await scheduler.scheduleComposition(composition);
    console.log('   ✓ Composition scheduled');

    console.log('\n9. Starting playback...');
    await scheduler.start();
    console.log('   ✓ Playback started!');
    console.log('\n   🎵 Enjoy the lo-fi vibes! 🎵');
    console.log(`   Duration: ~${(composition.duration / 60).toFixed(2)} minutes`);

    // Return composition info for browser use
    return {
      composition,
      scheduler,
      sampleManager,
      effects,
      duration: composition.duration as number,
    };

  } catch (error) {
    console.error('\n❌ Error during playback:', error);
    scheduler.stop();
    scheduler.dispose();
    sampleManager.dispose();
    throw error;
  }
}

/**
 * Export the composition to MIDI file (browser-compatible).
 */
export async function exportLoFiToMIDI(): Promise<Blob> {
  console.log('💾 Exporting Lo-Fi Composition to MIDI');
  console.log('='.repeat(60));

  const { composition, sampleManager } = await createLoFiComposition();

  try {
    // Dynamic import of MIDI renderer plugin
    const { MIDIRenderer } = await import('@contour/plugin-midi');

    console.log('\n7. Initializing MIDI renderer...');
    const renderer = new MIDIRenderer();
    await renderer.initialize({});
    console.log('   ✓ MIDI renderer initialized');

    console.log('\n8. Rendering composition to MIDI...');
    const result = await renderer.render(composition);

    console.log(`   ✓ Rendered ${result.metadata.trackCount} tracks`);
    console.log(`   Format: ${result.format}`);

    // Log track mapping for user
    console.log('\n   Track Mapping:');
    console.log('   Track 1: Electric Piano (Rhodes) - GM Instrument 5 (Electric Piano 1)');
    console.log('   Track 2: Electric Bass (Finger) - GM Instrument 34 (Electric Bass Finger)');
    console.log('   Track 3: Lo-Fi Drums - GM Drums (Channel 10)');
    console.log('   Track 4: Vibraphone - GM Instrument 12 (Vibraphone)');
    console.log('   Track 5: Synth Pad - GM Instrument 89 (Pad 2 - Warm)');

    await renderer.shutdown();
    sampleManager.dispose();

    console.log('\n✓ MIDI export complete');

    // Return as Blob for browser download
    return new Blob([result.data], { type: 'audio/midi' });

  } catch (error) {
    console.error('\n❌ Error during MIDI export:', error);
    throw error;
  }
}

/**
 * Export the composition to WAV file (browser-compatible).
 */
export async function exportLoFiToWAV(): Promise<Blob> {
  console.log('💾 Exporting Lo-Fi Composition to WAV');
  console.log('='.repeat(60));

  const { composition, sampleManager } = await createLoFiComposition();

  try {
    // Dynamic import of audio renderer plugin
    const { AudioRenderer } = await import('@contour/plugin-audio');

    console.log('\n7. Initializing audio renderer...');
    const renderer = new AudioRenderer();
    await renderer.initialize({});
    console.log('   ✓ Audio renderer initialized');

    console.log('\n8. Rendering composition to WAV...');
    console.log(`   (This may take ~${(composition.duration / 10).toFixed(0)} seconds)`);

    const result = await renderer.render(composition);

    console.log(`   ✓ Rendered ${result.metadata.duration} seconds of audio`);
    console.log(`   Format: ${result.format}`);

    await renderer.shutdown();
    sampleManager.dispose();

    console.log('\n✓ WAV export complete');

    // Return as Blob for browser download
    return new Blob([result.data], { type: 'audio/wav' });

  } catch (error) {
    console.error('\n❌ Error during WAV export:', error);
    throw error;
  }
}

// Run if called directly
if (typeof process !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  playLoFiComposition().catch(console.error);
}
