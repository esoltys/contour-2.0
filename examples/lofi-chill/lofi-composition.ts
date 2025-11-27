/**
 * Lo-Fi Chill Composition
 *
 * A warm, laid-back lo-fi composition featuring:
 * - Smooth jazzy chord progressions with 9th chords
 * - Mellow Rhodes electric piano
 * - Warm acoustic bass (upright feel)
 * - Laid-back drums with swing
 * - Soft kalimba melodic touches
 * - Warm string pad for atmosphere
 *
 * Tempo: 72 BPM (relaxed lo-fi speed)
 * Key: F major (warm, happy key)
 * Time: 4/4 with swing feel
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
} from '@contour/tone-adapter';

// Store references for cleanup
let currentScheduler: CompositionScheduler | null = null;
let currentSampleManager: SampleLibraryManager | null = null;

/**
 * Stop and cleanup any currently playing composition.
 */
export function stopPlayback() {
  console.log('Stopping playback...');

  // Stop Tone.js transport
  Tone.Transport.stop();
  Tone.Transport.cancel();

  // Cleanup scheduler
  if (currentScheduler) {
    currentScheduler.stop();
    currentScheduler.dispose();
    currentScheduler = null;
  }

  // Cleanup sample manager
  if (currentSampleManager) {
    currentSampleManager.dispose();
    currentSampleManager = null;
  }

  console.log('Playback stopped and cleaned up');
}

// ============================================================================
// CHORD PROGRESSIONS - Multiple variations for interest
// ============================================================================

/**
 * Main chord progression - Fmaj9 - Dm9 - Bbmaj7 - C9
 * Classic warm lo-fi progression in F major
 */
function createMainChords(): PatternBuilder {
  const pattern = new PatternBuilder();

  // Fmaj9 - warm, dreamy (F-A-C-E-G) - voiced in middle register
  pattern.chord([
    new Note('F3'),
    new Note('A3'),
    new Note('E4'),
    new Note('G4'),
  ], 2.0, Velocity(55));

  // Dm9 - melancholic touch (D-F-A-C-E)
  pattern.chord([
    new Note('D3'),
    new Note('F3'),
    new Note('C4'),
    new Note('E4'),
  ], 2.0, Velocity(55));

  // Bbmaj7 - warm resolution (Bb-D-F-A)
  pattern.chord([
    new Note('Bb2'),
    new Note('D3'),
    new Note('F3'),
    new Note('A3'),
  ], 2.0, Velocity(55));

  // C9 - leading back (C-E-G-Bb-D)
  pattern.chord([
    new Note('C3'),
    new Note('E3'),
    new Note('Bb3'),
    new Note('D4'),
  ], 2.0, Velocity(55));

  return pattern;
}

/**
 * Variation chord progression - more movement
 */
function createVariationChords(): PatternBuilder {
  const pattern = new PatternBuilder();

  // Am7 - relative minor touch
  pattern.chord([
    new Note('A2'),
    new Note('C3'),
    new Note('E3'),
    new Note('G3'),
  ], 2.0, Velocity(50));

  // Gm9 - smooth transition
  pattern.chord([
    new Note('G2'),
    new Note('Bb2'),
    new Note('D3'),
    new Note('A3'),
  ], 2.0, Velocity(50));

  // Fmaj7/A - first inversion for bass movement
  pattern.chord([
    new Note('A2'),
    new Note('C3'),
    new Note('E3'),
    new Note('F3'),
  ], 2.0, Velocity(50));

  // Bbmaj7 - resolution
  pattern.chord([
    new Note('Bb2'),
    new Note('D3'),
    new Note('F3'),
    new Note('A3'),
  ], 2.0, Velocity(50));

  return pattern;
}

// ============================================================================
// BASS LINES - Warm and melodic
// ============================================================================

/**
 * Main bass line - smooth walking bass feel
 */
function createMainBass(): PatternBuilder {
  const pattern = new PatternBuilder();

  // Over Fmaj9 - F with melodic movement
  pattern
    .note(new Note('F2'), 1.5, Velocity(70))
    .note(new Note('A2'), 0.5, Velocity(60))

  // Over Dm9 - D with pickup
  pattern
    .note(new Note('D2'), 1.0, Velocity(70))
    .note(new Note('E2'), 0.5, Velocity(55))
    .note(new Note('F2'), 0.5, Velocity(60))

  // Over Bbmaj7 - Bb with walk up
  pattern
    .note(new Note('Bb1'), 1.0, Velocity(70))
    .note(new Note('C2'), 0.5, Velocity(55))
    .note(new Note('D2'), 0.5, Velocity(60))

  // Over C9 - C with chromatic approach
  pattern
    .note(new Note('C2'), 1.0, Velocity(70))
    .note(new Note('D2'), 0.5, Velocity(55))
    .note(new Note('E2'), 0.5, Velocity(60))

  return pattern;
}

/**
 * Variation bass - more syncopated
 */
function createVariationBass(): PatternBuilder {
  const pattern = new PatternBuilder();

  // More rhythmic variation
  pattern
    .note(new Note('A1'), 0.75, Velocity(70))
    .rest(0.25)
    .note(new Note('A2'), 0.5, Velocity(55))
    .note(new Note('G2'), 0.5, Velocity(60))

  pattern
    .note(new Note('G1'), 0.75, Velocity(70))
    .rest(0.25)
    .note(new Note('Bb1'), 0.5, Velocity(55))
    .note(new Note('A1'), 0.5, Velocity(60))

  pattern
    .note(new Note('A1'), 1.0, Velocity(70))
    .note(new Note('G1'), 0.5, Velocity(55))
    .note(new Note('F1'), 0.5, Velocity(60))

  pattern
    .note(new Note('Bb1'), 1.0, Velocity(70))
    .note(new Note('A1'), 0.5, Velocity(55))
    .note(new Note('G1'), 0.5, Velocity(60))

  return pattern;
}

// ============================================================================
// DRUM PATTERNS - Lo-fi with swing and variation
// ============================================================================

/**
 * Main drum pattern - laid back with swing
 * Kick: MIDI 36, Snare: 38, Closed Hat: 42, Open Hat: 46, Rim: 37
 */
function createMainDrums(): PatternBuilder {
  const pattern = new PatternBuilder();

  // Beat 1: Kick
  pattern.note(Note.fromMIDI(MIDINote(36)), 0.5, Velocity(75));
  // Swung hat
  pattern.note(Note.fromMIDI(MIDINote(42)), 0.25, Velocity(35));
  pattern.rest(0.25);

  // Beat 2: Snare (soft, lo-fi)
  pattern.note(Note.fromMIDI(MIDINote(38)), 0.5, Velocity(60));
  pattern.note(Note.fromMIDI(MIDINote(42)), 0.5, Velocity(30));

  // Beat 3: Kick + hat
  pattern.chord([Note.fromMIDI(MIDINote(36)), Note.fromMIDI(MIDINote(42))], 0.5, Velocity(70));
  pattern.note(Note.fromMIDI(MIDINote(42)), 0.25, Velocity(35));
  pattern.rest(0.25);

  // Beat 4: Snare
  pattern.note(Note.fromMIDI(MIDINote(38)), 0.5, Velocity(55));
  pattern.note(Note.fromMIDI(MIDINote(42)), 0.5, Velocity(30));

  return pattern;
}

/**
 * Variation drum pattern - with fills
 */
function createDrumFill(): PatternBuilder {
  const pattern = new PatternBuilder();

  // Beat 1: Kick
  pattern.note(Note.fromMIDI(MIDINote(36)), 0.5, Velocity(75));
  pattern.note(Note.fromMIDI(MIDINote(42)), 0.5, Velocity(35));

  // Beat 2: Snare
  pattern.note(Note.fromMIDI(MIDINote(38)), 0.5, Velocity(60));
  pattern.note(Note.fromMIDI(MIDINote(42)), 0.5, Velocity(35));

  // Beat 3: Fill - snare rolls
  pattern.note(Note.fromMIDI(MIDINote(38)), 0.25, Velocity(45));
  pattern.note(Note.fromMIDI(MIDINote(38)), 0.25, Velocity(50));
  pattern.note(Note.fromMIDI(MIDINote(38)), 0.25, Velocity(55));
  pattern.note(Note.fromMIDI(MIDINote(38)), 0.25, Velocity(60));

  // Beat 4: Open hat -> closed hat
  pattern.note(Note.fromMIDI(MIDINote(46)), 0.5, Velocity(50));
  pattern.note(Note.fromMIDI(MIDINote(42)), 0.5, Velocity(40));

  return pattern;
}

/**
 * Sparse drums for intro/outro
 */
function createSparseDrums(): PatternBuilder {
  const pattern = new PatternBuilder();

  // Just hats, very soft
  pattern.note(Note.fromMIDI(MIDINote(42)), 0.5, Velocity(25));
  pattern.rest(0.5);
  pattern.note(Note.fromMIDI(MIDINote(42)), 0.5, Velocity(20));
  pattern.rest(0.5);
  pattern.note(Note.fromMIDI(MIDINote(42)), 0.5, Velocity(25));
  pattern.rest(0.5);
  pattern.note(Note.fromMIDI(MIDINote(42)), 0.5, Velocity(30));
  pattern.rest(0.5);

  return pattern;
}

// ============================================================================
// MELODIC ELEMENTS - Warm and sparse
// ============================================================================

/**
 * Kalimba melody - pentatonic, dreamy
 */
function createMelodyA(): PatternBuilder {
  const pattern = new PatternBuilder();

  // F major pentatonic melody - very sparse and airy
  pattern
    .rest(0.5)
    .note(new Note('C5'), 0.75, Velocity(50))
    .rest(0.75)
    .note(new Note('A4'), 0.5, Velocity(45))
    .rest(0.5)
    .note(new Note('G4'), 1.0, Velocity(50))
    .rest(4.0); // Long rest for breathing room

  return pattern;
}

/**
 * Variation melody - response phrase
 */
function createMelodyB(): PatternBuilder {
  const pattern = new PatternBuilder();

  pattern
    .rest(2.0)
    .note(new Note('F4'), 0.5, Velocity(45))
    .note(new Note('G4'), 0.5, Velocity(50))
    .note(new Note('A4'), 1.0, Velocity(55))
    .rest(1.0)
    .note(new Note('C5'), 0.5, Velocity(45))
    .note(new Note('A4'), 1.0, Velocity(50))
    .rest(1.5);

  return pattern;
}

/**
 * High melodic sparkle
 */
function createMelodyC(): PatternBuilder {
  const pattern = new PatternBuilder();

  pattern
    .rest(3.0)
    .note(new Note('F5'), 0.5, Velocity(40))
    .rest(0.5)
    .note(new Note('E5'), 0.5, Velocity(35))
    .note(new Note('C5'), 1.0, Velocity(40))
    .rest(2.5);

  return pattern;
}

// ============================================================================
// PAD/STRINGS - Warm atmosphere
// ============================================================================

/**
 * Warm string pad - very soft and sustained
 */
function createWarmPad(): PatternBuilder {
  const pattern = new PatternBuilder();

  // F major pad - high register, very soft
  pattern.chord([
    new Note('C4'),
    new Note('F4'),
    new Note('A4'),
  ], 8.0, Velocity(25));

  return pattern;
}

/**
 * Create the full composition with rich structure.
 */
export async function createLoFiComposition(): Promise<{
  composition: Composition;
  scheduler: CompositionScheduler;
  sampleManager: SampleLibraryManager;
}> {
  console.log('Creating Lo-Fi Chill Composition');
  console.log('='.repeat(60));

  // Initialize sample library manager
  console.log('\n1. Initializing sample library manager...');
  const sampleManager = new SampleLibraryManager();
  await sampleManager.initialize(Tone.getContext().rawContext);
  console.log('   Sample library initialized');

  // Create all pattern variations
  console.log('\n2. Creating musical patterns...');

  const mainChords = createMainChords().build();
  const varChords = createVariationChords().build();
  const mainBass = createMainBass().build();
  const varBass = createVariationBass().build();
  const mainDrums = createMainDrums().build();
  const drumFill = createDrumFill().build();
  const sparseDrums = createSparseDrums().build();
  const melodyA = createMelodyA().build();
  const melodyB = createMelodyB().build();
  const melodyC = createMelodyC().build();
  const warmPad = createWarmPad().build();

  // Helper to repeat patterns
  const repeat = (pattern: Pattern, times: number): Pattern => {
    let result = pattern;
    for (let i = 1; i < times; i++) {
      result = result.append(pattern);
    }
    return result;
  };

  // ========================================================================
  // COMPOSITION STRUCTURE (approx 3+ minutes at 72 BPM)
  // ========================================================================
  // Pattern durations:
  // - mainChords/varChords: 8 beats (2 bars)
  // - mainBass/varBass: 8 beats (2 bars)
  // - mainDrums/drumFill/sparseDrums: 4 beats (1 bar)
  // - melodyA/B/C: 8 beats (2 bars)
  // - warmPad: 8 beats (2 bars)
  // ========================================================================
  console.log('\n3. Building composition structure...');

  // INTRO - 8 bars: Just Rhodes chords + bass, very sparse drums
  let fullChords = repeat(mainChords, 4); // 4 x 2 bars = 8 bars
  let fullBass = repeat(mainBass, 4); // 4 x 2 bars = 8 bars
  let fullDrums = repeat(sparseDrums, 8); // 8 x 1 bar = 8 bars
  let fullMelody = repeat(melodyA, 4); // 4 x 2 bars = 8 bars
  let fullPad = repeat(warmPad, 4); // 4 x 2 bars = 8 bars

  // VERSE 1 - 16 bars: Add main drums, more melodic activity
  fullChords = fullChords.append(repeat(mainChords, 8)); // 8 x 2 bars = 16 bars
  fullBass = fullBass.append(repeat(mainBass, 8)); // 8 x 2 bars = 16 bars
  // Drums: 3 bars main + 1 fill, repeated 4 times = 16 bars
  fullDrums = fullDrums.append(repeat(mainDrums, 3)).append(drumFill);
  fullDrums = fullDrums.append(repeat(mainDrums, 3)).append(drumFill);
  fullDrums = fullDrums.append(repeat(mainDrums, 3)).append(drumFill);
  fullDrums = fullDrums.append(repeat(mainDrums, 3)).append(drumFill);
  // Melody: alternate patterns, 8 x 2 bars = 16 bars
  fullMelody = fullMelody.append(melodyA).append(melodyB).append(melodyA).append(melodyC);
  fullMelody = fullMelody.append(melodyB).append(melodyA).append(melodyC).append(melodyB);
  fullPad = fullPad.append(repeat(warmPad, 8)); // 8 x 2 bars = 16 bars

  // CHORUS - 16 bars: Variation chords for contrast
  fullChords = fullChords.append(repeat(varChords, 4)).append(repeat(mainChords, 4)); // 16 bars
  fullBass = fullBass.append(repeat(varBass, 4)).append(repeat(mainBass, 4)); // 16 bars
  // Drums: same pattern with fills
  fullDrums = fullDrums.append(repeat(mainDrums, 3)).append(drumFill);
  fullDrums = fullDrums.append(repeat(mainDrums, 3)).append(drumFill);
  fullDrums = fullDrums.append(repeat(mainDrums, 3)).append(drumFill);
  fullDrums = fullDrums.append(repeat(mainDrums, 3)).append(drumFill);
  // Melody: more active
  fullMelody = fullMelody.append(melodyB).append(melodyC).append(melodyA).append(melodyB);
  fullMelody = fullMelody.append(melodyC).append(melodyA).append(melodyB).append(melodyC);
  fullPad = fullPad.append(repeat(warmPad, 8)); // 16 bars

  // VERSE 2 - 16 bars: Back to main progression
  fullChords = fullChords.append(repeat(mainChords, 8)); // 16 bars
  fullBass = fullBass.append(repeat(mainBass, 8)); // 16 bars
  // Drums with fills
  fullDrums = fullDrums.append(repeat(mainDrums, 3)).append(drumFill);
  fullDrums = fullDrums.append(repeat(mainDrums, 4));
  fullDrums = fullDrums.append(repeat(mainDrums, 3)).append(drumFill);
  fullDrums = fullDrums.append(repeat(mainDrums, 4));
  // Melody
  fullMelody = fullMelody.append(melodyC).append(melodyA).append(melodyB).append(melodyC);
  fullMelody = fullMelody.append(melodyA).append(melodyB).append(melodyA).append(melodyC);
  fullPad = fullPad.append(repeat(warmPad, 8)); // 16 bars

  // OUTRO - 8 bars: Fade out, sparse
  fullChords = fullChords.append(repeat(mainChords, 4)); // 8 bars
  fullBass = fullBass.append(repeat(mainBass, 4)); // 8 bars
  fullDrums = fullDrums.append(repeat(sparseDrums, 8)); // 8 bars
  fullMelody = fullMelody.append(repeat(melodyA, 4)); // 8 bars
  fullPad = fullPad.append(repeat(warmPad, 4)); // 8 bars

  console.log('   Intro: 8 bars');
  console.log('   Verse 1: 16 bars');
  console.log('   Chorus: 16 bars');
  console.log('   Verse 2: 16 bars');
  console.log('   Outro: 8 bars');
  console.log('   Total: 64 bars');

  // ========================================================================
  // INSTRUMENTS - Warm, lo-fi appropriate sounds
  // ========================================================================
  console.log('\n4. Configuring instruments...');

  // Rhodes - warm electric piano
  const rhodes = createQualifiedName(
    SoundfontLibrary.MusyngKite,
    GMInstrument.ElectricPiano2 // EP2 is warmer than EP1
  );

  // Acoustic bass - warmer than electric
  const bass = createQualifiedName(
    SoundfontLibrary.MusyngKite,
    GMInstrument.AcousticBass
  );

  // Kalimba for melody - warm, organic sound
  const kalimba = createQualifiedName(
    SoundfontLibrary.MusyngKite,
    GMInstrument.Kalimba
  );

  // String ensemble for pad - soft and warm
  const strings = createQualifiedName(
    SoundfontLibrary.MusyngKite,
    GMInstrument.StringEnsemble1
  );

  console.log(`   Rhodes: ${rhodes}`);
  console.log(`   Acoustic Bass: ${bass}`);
  console.log(`   Kalimba: ${kalimba}`);
  console.log(`   Strings: ${strings}`);
  console.log('   Drums: Synthesized');

  // Create voices
  const chordVoice = new Voice(fullChords, rhodes);
  const bassVoice = new Voice(fullBass, bass);
  const drumVoice = new Voice(fullDrums, 'drums');
  const melodyVoice = new Voice(fullMelody, kalimba);
  const padVoice = new Voice(fullPad, strings);

  // Create composition at relaxed tempo
  const composition = new Composition('Lo-Fi Chill', BPM(72))
    .addTrack(new Track('Rhodes Piano', [chordVoice]))
    .addTrack(new Track('Acoustic Bass', [bassVoice]))
    .addTrack(new Track('Lo-Fi Drums', [drumVoice]))
    .addTrack(new Track('Kalimba', [melodyVoice]))
    .addTrack(new Track('String Pad', [padVoice]));

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
async function setupEffects() {
  console.log('\n   Adding effects for lo-fi warmth...');

  // Warm reverb
  const reverb = new Tone.Reverb({
    decay: 2.5,
    wet: 0.25,
  }).toDestination();
  await reverb.generate();

  // Lowpass filter for that warm, muffled lo-fi sound
  const lowpass = new Tone.Filter({
    frequency: 2500,
    type: 'lowpass',
    rolloff: -12,
  });

  // Gentle compression
  const compressor = new Tone.Compressor({
    threshold: -18,
    ratio: 3,
    attack: 0.01,
    release: 0.3,
  });

  // Connect chain
  lowpass.connect(reverb);
  compressor.connect(lowpass);
  compressor.toDestination();

  console.log('   Effects: Lowpass (2.5kHz) -> Reverb -> Compressor');

  return { reverb, lowpass, compressor };
}

/**
 * Play the lo-fi composition.
 */
export async function playLoFiComposition() {
  // Stop any existing playback first
  stopPlayback();

  const { composition, scheduler, sampleManager } = await createLoFiComposition();

  // Store references for cleanup
  currentScheduler = scheduler;
  currentSampleManager = sampleManager;

  try {
    console.log('\n7. Setting up effects chain...');
    const effects = await setupEffects();
    console.log('   Effects ready');

    console.log('\n8. Scheduling composition...');
    await scheduler.scheduleComposition(composition);
    console.log('   Composition scheduled');

    console.log('\n9. Starting playback...');
    await scheduler.start();
    console.log('   Playback started!');
    console.log(`\n   Enjoy the lo-fi vibes!`);
    console.log(`   Duration: ~${(composition.duration / 60).toFixed(2)} minutes`);

    return {
      composition,
      scheduler,
      sampleManager,
      effects,
      duration: composition.duration as number,
      stop: stopPlayback,
    };

  } catch (error) {
    console.error('\nError during playback:', error);
    stopPlayback();
    throw error;
  }
}

/**
 * Export the composition to MIDI file.
 */
export async function exportLoFiToMIDI(): Promise<Blob> {
  console.log('Exporting Lo-Fi Composition to MIDI');
  console.log('='.repeat(60));

  const { composition, sampleManager } = await createLoFiComposition();

  try {
    const { MIDIRenderer } = await import('@contour/plugin-midi');

    console.log('\n7. Initializing MIDI renderer...');
    const renderer = new MIDIRenderer();
    await renderer.initialize({});
    console.log('   MIDI renderer initialized');

    console.log('\n8. Rendering composition to MIDI...');
    const result = await renderer.render(composition);

    console.log(`   Rendered ${result.metadata.trackCount} tracks`);
    console.log(`   Format: ${result.format}`);

    console.log('\n   Track Mapping:');
    console.log('   Track 1: Rhodes Piano - GM 6 (Electric Piano 2)');
    console.log('   Track 2: Acoustic Bass - GM 33 (Acoustic Bass)');
    console.log('   Track 3: Lo-Fi Drums - GM Drums (Channel 10)');
    console.log('   Track 4: Kalimba - GM 109 (Kalimba)');
    console.log('   Track 5: String Pad - GM 49 (String Ensemble 1)');

    await renderer.shutdown();
    sampleManager.dispose();

    console.log('\nMIDI export complete');

    return new Blob([result.data], { type: 'audio/midi' });

  } catch (error) {
    console.error('\nError during MIDI export:', error);
    throw error;
  }
}

/**
 * Export the composition to WAV file with progress callback.
 */
export async function exportLoFiToWAV(
  onProgress?: (progress: number, stage: string) => void
): Promise<Blob> {
  console.log('Exporting Lo-Fi Composition to WAV');
  console.log('='.repeat(60));

  onProgress?.(0, 'Initializing...');

  const { composition, sampleManager } = await createLoFiComposition();

  onProgress?.(10, 'Loading samples...');

  try {
    const { AudioRenderer } = await import('@contour/plugin-audio');

    console.log('\n7. Initializing audio renderer...');
    const renderer = new AudioRenderer();

    // Pass progress callback to renderer config - it will track actual render progress
    await renderer.initialize({
      onProgress: onProgress ? (progress, stage) => {
        // Scale renderer progress (0-100) to our range (20-100)
        // First 20% is for composition creation
        const scaledProgress = 20 + (progress * 0.8);
        onProgress(scaledProgress, stage);
      } : undefined,
    });
    console.log('   Audio renderer initialized');

    console.log('\n8. Rendering composition to WAV...');

    const result = await renderer.render(composition);

    console.log(`   Rendered ${result.metadata.duration} seconds of audio`);
    console.log(`   Format: ${result.format}`);

    await renderer.shutdown();
    sampleManager.dispose();

    console.log('\nWAV export complete');

    return new Blob([result.data], { type: 'audio/wav' });

  } catch (error) {
    console.error('\nError during WAV export:', error);
    throw error;
  }
}

// Run if called directly
if (typeof process !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  playLoFiComposition().catch(console.error);
}
