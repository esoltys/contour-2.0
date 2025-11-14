# Contour Tutorial: From Hello World to Advanced Composition

Welcome to Contour! This tutorial will guide you from creating your first simple melody all the way to building complex, algorithmic compositions. Whether you're a musician learning to code or a developer exploring music, you'll find everything you need here.

## Table of Contents

1. [Hello World: Your First Sound](#hello-world-your-first-sound)
2. [Understanding Core Concepts](#understanding-core-concepts)
3. [Building Patterns](#building-patterns)
4. [Mini-Notation: The Concise Way](#mini-notation-the-concise-way)
5. [Pattern Transformations](#pattern-transformations)
6. [Pattern Algebra](#pattern-algebra)
7. [Euclidean Rhythms](#euclidean-rhythms)
8. [Creating Compositions](#creating-compositions)
9.  [Exporting Your Music](#exporting-your-music)
10.  [Advanced Topics](#advanced-topics)
11. [Coming From Other Tools](#coming-from-other-tools)

## Hello World: Your First Sound

Let's start with the simplest possible example - making a single note play.

### Setup

First, make sure you have the project running:

```bash
cd contour-2.0
pnpm install
cd packages/playground
pnpm dev
```

Open http://localhost:3000 in your browser.

### Your First Note

Create a new file `my-first-composition.ts` in the `packages/playground/src` directory:

```typescript
import { Pattern, Voice, Composition, BPM } from '@contour/core';

// Create a single note: middle C
const pattern = new Pattern([
  {
    type: 'note',
    pitch: 60,        // MIDI note 60 = C4 (middle C)
    duration: 1,      // 1 beat long
    time: 0,          // Starts at beat 0
    velocity: 100     // Velocity (0-127)
  }
]);

// Wrap it in a Voice with a synth
const voice = new Voice(pattern, 'synth');

// Create a composition at 120 BPM
const composition = new Composition([voice], BPM(120));

// Play it!
await composition.play();
```

Congratulations! You've just created your first Contour composition.

### Understanding What Happened

1. **Pattern** - A collection of musical events (notes, chords, rests)
2. **Voice** - A pattern plus an instrument
3. **Composition** - One or more voices, with a tempo

Think of it like this:
- **Pattern** = the sheet music
- **Voice** = an instrument playing that music
- **Composition** = the complete performance

---

## Understanding Core Concepts

Before we dive deeper, let's understand Contour's fundamental building blocks.

### Events

Everything in Contour is an event. There are three types:

```typescript
// 1. Note event
{
  type: 'note',
  pitch: 60,        // MIDI pitch (60 = C4)
  duration: 0.5,    // How long it plays
  time: 0,          // When it starts
  velocity: 100     // How loud (0-127)
}

// 2. Chord event
{
  type: 'chord',
  notes: [
    { name: 'C4', pitch: 60 },
    { name: 'E4', pitch: 64 },
    { name: 'G4', pitch: 67 }
  ],
  duration: 1,
  time: 0,
  velocity: 80
}

// 3. Rest event
{
  type: 'rest',
  duration: 0.5,
  time: 1
}
```

### Branded Types: Type Safety for Music

Contour uses TypeScript's type system to prevent common mistakes:

```typescript
import { Hz, BPM, Seconds } from '@contour/core';

const frequency = Hz(440);      // Type: Hz
const tempo = BPM(120);          // Type: BPM
const duration = Seconds(2.5);   // Type: Seconds

// This won't compile - you can't mix units!
// const wrong = frequency + tempo;  ❌ Type error!
```

This prevents bugs like accidentally using Hz where BPM is expected.

### Immutability: Patterns Never Change

In Contour, patterns are immutable - they never change. Every transformation creates a *new* pattern:

```typescript
const original = pattern().fromNotation('C4 E4 G4').build();
const transposed = original.transpose(5);  // Creates NEW pattern

console.log(original.events[0].pitch);     // Still 60 (C4)
console.log(transposed.events[0].pitch);   // 65 (F4)
```

This is crucial for:
- **Hot-reload** - Your original patterns stay intact
- **Live coding** - You can experiment without breaking things
- **Debugging** - Patterns don't mysteriously change

---

## Building Patterns

There are several ways to create patterns. Let's explore them from simple to powerful.

### Method 1: Direct Construction

The most explicit way:

```typescript
const pattern = new Pattern([
  { type: 'note', pitch: 60, duration: 0.5, time: 0, velocity: 100 },
  { type: 'note', pitch: 64, duration: 0.5, time: 0.5, velocity: 100 },
  { type: 'note', pitch: 67, duration: 0.5, time: 1.0, velocity: 100 },
]);
```

This works, but it's verbose and error-prone.

### Method 2: PatternBuilder (Fluent API)

A more readable approach using method chaining:

```typescript
import { pattern, Durations, C, E, G } from '@contour/core';

const melody = pattern()
  .note(C('4'), Durations.quarter)
  .note(E('4'), Durations.quarter)
  .note(G('4'), Durations.quarter)
  .build();
```

The `pattern()` function creates a builder, and `build()` creates the final Pattern.

#### Common Durations

```typescript
import { Durations } from '@contour/core';

Durations.whole      // 4 beats
Durations.half       // 2 beats
Durations.quarter    // 1 beat
Durations.eighth     // 0.5 beats
Durations.sixteenth  // 0.25 beats
```

#### Note Helper Functions

Instead of remembering MIDI numbers:

```typescript
import { C, D, E, F, G, A, B } from '@contour/core';

const scale = pattern()
  .note(C('4'), Durations.quarter)  // Middle C
  .note(D('4'), Durations.quarter)
  .note(E('4'), Durations.quarter)
  .note(F('4'), Durations.quarter)
  .note(G('4'), Durations.quarter)
  .note(A('4'), Durations.quarter)
  .note(B('4'), Durations.quarter)
  .note(C('5'), Durations.quarter)  // High C
  .build();
```

Sharps and flats work too:

```typescript
import { Cs, Eb, Fs } from '@contour/core';

const melody = pattern()
  .note(Cs('4'), Durations.quarter)  // C#4
  .note(Eb('4'), Durations.quarter)  // Eb4
  .note(Fs('4'), Durations.quarter)  // F#4
  .build();
```

### Method 3: Array Shorthand

The simplest way for simple melodies:

```typescript
const melody = pattern(['C4', 'E4', 'G4', 'C5']);
```

This creates quarter notes by default. Super concise!

---

## Mini-Notation: The Concise Way

Mini-notation is Contour's secret weapon for rapid pattern creation. It's inspired by TidalCycles and makes complex patterns incredibly concise.

### Basic Syntax

```typescript
// Simple notes separated by spaces
pattern().fromNotation('C4 E4 G4 C5').build();

// Equivalent to:
pattern()
  .note(C('4'), Durations.quarter)
  .note(E('4'), Durations.quarter)
  .note(G('4'), Durations.quarter)
  .note(C('5'), Durations.quarter)
  .build();
```

### Repetition with `*`

```typescript
// Repeat a note
pattern().fromNotation('C4*4').build();
// → C4 C4 C4 C4

// Four kick drums
pattern().fromNotation('C2*4').build();
```

### Rests with `~`

```typescript
// Rest is represented by tilde
pattern().fromNotation('C4 ~ E4 ~').build();
// → Play C4, rest, play E4, rest

// Classic snare pattern (on beats 2 and 4)
pattern().fromNotation('~ C3 ~ C3').build();
```

### Subdivisions with `[ ]`

```typescript
// Subdivide a beat
pattern().fromNotation('C4 [E4 G4] C5').build();
// → C4 for 1 beat, then E4 and G4 split the next beat, then C5

// Complex rhythm
pattern().fromNotation('C4 [E4 G4 B4] [C5 D5]').build();
```

### Longer Notes with `@`

```typescript
// Hold a note longer
pattern().fromNotation('C4@2 E4 G4').build();
// → C4 held for 2 beats, then E4, then G4

// Bass note held for 4 beats
pattern().fromNotation('C2@4').build();
```

### Octave Persistence

Type the octave once, and it persists:

```typescript
// Instead of typing '4' every time:
pattern().fromNotation('C4 D4 E4 F4 G4').build();

// Just type it once:
pattern().fromNotation('C4 D E F G').build();
// → C4 D4 E4 F4 G4

// Change octaves when needed:
pattern().fromNotation('C4 D E F G A B C5 D E').build();
// → C4 D4 E4 F4 G4 A4 B4 C5 D5 E5
```

### Chord Symbols

Use chord symbols directly:

```typescript
// Jazz progression
pattern().fromNotation('Cmaj7 Dm7 G7 Cmaj7').build();

// Common chords
pattern().fromNotation('C E G').build();      // C major triad
pattern().fromNotation('Cmaj7 Fmaj7').build(); // Major 7th chords
pattern().fromNotation('Am Dm Em Am').build(); // Minor progression
```

### Combining Everything

```typescript
// Complex drum pattern
const drums = pattern()
  .fromNotation('C2*4 ~ [E3 G3] ~ C4@2 [G3*4]')
  .build();

// Melodic pattern with subdivisions and rests
const melody = pattern()
  .fromNotation('C4 [E4 G4] ~ C5@2 [D5 C5 B4] A4')
  .build();
```

---

## Pattern Transformations

Patterns are immutable, but you can create *transformed* versions. This is where Contour gets powerful.

### Transpose

Move all notes up or down by semitones:

```typescript
const melody = pattern().fromNotation('C4 E4 G4').build();

const higher = melody.transpose(5);    // Up 5 semitones (perfect 4th)
const lower = melody.transpose(-12);   // Down an octave
```

Common intervals:
- `1` - semitone
- `2` - whole tone
- `5` - perfect 4th
- `7` - perfect 5th
- `12` - octave
- `-12` - octave down

### Fast and Slow

Change the speed of a pattern:

```typescript
const pattern = pattern().fromNotation('C4 E4 G4 C5').build();

const double = pattern.fast(2);    // Twice as fast (half durations)
const half = pattern.slow(2);      // Half as fast (double durations)
const triple = pattern.fast(3);    // Three times as fast
```

This is perfect for creating variations:

```typescript
const melody = pattern().fromNotation('C4 E4 G4').build();

const verse = melody;              // Normal speed
const chorus = melody.fast(2);     // Energetic
const outro = melody.slow(2);      // Calm
```

### Retrograde (Reverse)

Play the pattern backwards:

```typescript
const ascending = pattern().fromNotation('C4 D E F G').build();
const descending = ascending.retrograde();
// → G4 F4 E4 D4 C4
```

Great for creating musical mirrors:

```typescript
const theme = pattern().fromNotation('C4 E G C5').build();
const answer = theme.retrograde().transpose(-5);
```

### Map (Transform Each Event)

Apply a function to each event:

```typescript
import { Velocity } from '@contour/core';

const pattern = pattern().fromNotation('C4 E4 G4 C5').build();

// Crescendo: gradually increase velocity
const crescendo = pattern.map((event, index) => ({
  ...event,
  velocity: Velocity(50 + index * 20)
}));

// Diminuendo: gradually decrease
const diminuendo = pattern.map((event, index, total) => ({
  ...event,
  velocity: Velocity(127 - (index / total) * 77)
}));
```

---

## Pattern Algebra

Now we get to the really fun stuff - combining patterns in different ways.

### Stack (Play Simultaneously)

Play two patterns at the same time:

```typescript
const melody = pattern().fromNotation('C4 E4 G4 C5').build();
const bass = pattern().fromNotation('C2@4').build();

const harmony = melody.stack(bass);
// Both play together
```

Create full chords:

```typescript
const root = pattern().fromNotation('C4@4').build();
const third = pattern().fromNotation('E4@4').build();
const fifth = pattern().fromNotation('G4@4').build();

const chord = root.stack(third).stack(fifth);
// Full C major chord
```

### Append (Play Sequentially)

Play one pattern after another:

```typescript
const phrase1 = pattern().fromNotation('C4 E4 G4').build();
const phrase2 = pattern().fromNotation('D4 F4 A4').build();

const melody = phrase1.append(phrase2);
// phrase1, then phrase2
```

Build longer melodies:

```typescript
const intro = pattern().fromNotation('C4 C4').build();
const verse = pattern().fromNotation('C4 E4 G4 E4').build();
const chorus = pattern().fromNotation('G4 G4 E4 C4').build();

const song = intro.append(verse).append(chorus);
```

### Palindrome

Play forward, then backward:

```typescript
const rising = pattern().fromNotation('C4 D E F G').build();
const arc = rising.palindrome();
// → C4 D4 E4 F4 G4 F4 E4 D4 C4

// Create wave-like melodies
const wave = pattern()
  .fromNotation('C4 E G C5')
  .build()
  .palindrome();
```

### Every (Conditional Transformation)

Apply a transformation every N cycles:

```typescript
const melody = pattern().fromNotation('C4 E4 G4 C5').build();

// Reverse every 4th repetition
const varied = melody.every(4, p => p.retrograde());

// Transpose every 2nd repetition
const alternating = melody.every(2, p => p.transpose(7));

// Combine multiple transformations
const complex = melody
  .every(3, p => p.retrograde())
  .every(4, p => p.transpose(5));
```

This creates evolving, algorithmic patterns perfect for live coding!

### Combining Operations

The real power comes from chaining operations:

```typescript
const theme = pattern().fromNotation('C4 E4 G4').build();

// Create a complex variation
const variation = theme
  .transpose(5)           // Up a 4th
  .fast(2)                // Double speed
  .palindrome()           // Forward and back
  .append(theme.slow(2)); // Add slow version

// Harmony and rhythm
const melody = pattern().fromNotation('C4 E4 G4 C5').build();
const bass = pattern().fromNotation('C2@4').build();

const full = melody
  .stack(bass)            // Add bass
  .every(4, p => p.retrograde()) // Vary every 4th cycle
  .fast(1.5);             // Speed up
```

---

## Euclidean Rhythms

Euclidean rhythms are a mathematical way to generate interesting, "musical" rhythms. They distribute N pulses as evenly as possible across M steps.

### Basic Euclidean Patterns

```typescript
// 5 pulses in 16 steps - classic clave rhythm
const clave = Pattern.euclidean(16, 5);
// X . . X . . X . . X . . X . . .

// 3 pulses in 8 steps - Tresillo pattern
const tresillo = Pattern.euclidean(8, 3);
// X . . X . . X .

// 5 pulses in 8 steps - Cinquillo pattern
const cinquillo = Pattern.euclidean(8, 5);
// X . X . X . X X
```

Visualizing the pattern:

```typescript
const rhythm = Pattern.euclidean(16, 5);
const viz = rhythm.events
  .map(e => e.type === 'note' ? 'X' : '.')
  .join(' ');
console.log(viz);
// → X . . X . . X . . X . . X . . .
```

### Rotation

Shift the pattern by N steps:

```typescript
const original = Pattern.euclidean(8, 3, 0);  // No rotation
const rotated = Pattern.euclidean(8, 3, 2);   // Rotate 2 steps

console.log('Original:', visualize(original));
// → X . . X . . X .

console.log('Rotated:', visualize(rotated));
// → . X . . X . . X
```

### Musical Applications

Euclidean rhythms are great for:

**Drum patterns:**
```typescript
const kick = Pattern.euclidean(16, 4);     // 4-on-floor
const snare = Pattern.euclidean(16, 3, 8); // Off-beat snares
const hihat = Pattern.euclidean(16, 11);   // Dense hi-hats

const drums = kick
  .stack(snare.transpose(2))   // Different pitch
  .stack(hihat.transpose(4));  // Higher pitch
```

**Melodic sequences:**
```typescript
const rhythm = Pattern.euclidean(16, 9);
const melody = rhythm.map((event, i) => ({
  ...event,
  pitch: 60 + (i % 7) * 2  // Scale-based pitches
}));
```

**Polyrhythms:**
```typescript
const rhythm3 = Pattern.euclidean(16, 3);  // 3 against 16
const rhythm5 = Pattern.euclidean(16, 5);  // 5 against 16
const rhythm7 = Pattern.euclidean(16, 7);  // 7 against 16

const polyrhythm = rhythm3
  .stack(rhythm5.transpose(7))   // Perfect 5th
  .stack(rhythm7.transpose(12)); // Octave
```

### Combining with Transformations

```typescript
const euclidean = Pattern.euclidean(16, 7);

// Create variations
const verse = euclidean;
const chorus = euclidean.fast(2);
const bridge = euclidean.retrograde();

// Add melody
const melodic = euclidean.map((event, i) => ({
  ...event,
  pitch: [60, 64, 67, 72][i % 4]  // Arpeggiated chord
}));
```

---

## Creating Compositions

Now let's put everything together into full compositions.

### The Hierarchy

```
Composition
  └── Track (1 or more)
        └── Voice (1 or more)
              └── Pattern
```

- **Pattern** - Musical events (notes, chords, rests)
- **Voice** - Pattern + instrument
- **Track** - One or more voices (like a MIDI track)
- **Composition** - All tracks + tempo + metadata

### Simple Composition

```typescript
import { Composition, Track, Voice, pattern, BPM } from '@contour/core';

// 1. Create a pattern
const melody = pattern().fromNotation('C4 E4 G4 C5').build();

// 2. Create a voice with an instrument
const voice = new Voice(melody, 'synth');

// 3. Create a track
const track = new Track('Melody', [voice]);

// 4. Create a composition
const song = new Composition('My First Song', BPM(120))
  .addTrack(track);

// 5. Play it!
await song.play();
```

### Multi-Track Composition

```typescript
// Create multiple patterns
const melodyPattern = pattern().fromNotation('C4 E4 G4 C5 G4 E4').build();
const bassPattern = pattern().fromNotation('C2@2 F2@2 G2@2').build();
const drumPattern = Pattern.euclidean(16, 5);

// Create voices
const melodyVoice = new Voice(melodyPattern, 'piano');
const bassVoice = new Voice(bassPattern, 'bass');
const drumVoice = new Voice(drumPattern, 'drums');

// Create tracks
const melodyTrack = new Track('Melody', [melodyVoice]);
const bassTrack = new Track('Bass', [bassVoice]);
const drumTrack = new Track('Drums', [drumVoice]);

// Combine into composition
const song = new Composition('Full Band', BPM(120))
  .addTrack(melodyTrack)
  .addTrack(bassTrack)
  .addTrack(drumTrack);

await song.play();
```

### Multiple Voices Per Track

You can have multiple voices (instruments) in one track:

```typescript
// Two different synths playing different patterns
const synth1Pattern = pattern().fromNotation('C4 E4 G4').build();
const synth2Pattern = pattern().fromNotation('E4 G4 C5').build();

const voice1 = new Voice(synth1Pattern, 'synth1');
const voice2 = new Voice(synth2Pattern, 'synth2');

// Both voices in one track
const track = new Track('Synths', [voice1, voice2]);
```

### Counterpoint Example

Creating two independent melodic lines (like Bach):

```typescript
// Upper voice - melodic line 1
const upperLine = pattern()
  .fromNotation('D5 C# B4 A G F# E D')
  .build()
  .slow(0.5);  // Eighth notes

// Lower voice - melodic line 2 (starting later)
const lowerLine = pattern()
  .fromNotation('D4 E F# G A B C#5 D5')
  .build()
  .slow(0.5);

// Create voices
const soprano = new Voice(upperLine, 'flute');
const alto = new Voice(lowerLine, 'clarinet');

// Combine
const invention = new Composition('Two-Part Invention', BPM(100))
  .addTrack(new Track('Upper', [soprano]))
  .addTrack(new Track('Lower', [alto]));
```

### Dynamic Compositions

Use transformations to create variations:

```typescript
const theme = pattern().fromNotation('C4 E4 G4 C5').build();

// Verse: simple
const verseTrack = new Track('Verse', [
  new Voice(theme, 'piano')
]);

// Chorus: layered and fast
const chorusTrack = new Track('Chorus', [
  new Voice(theme.fast(2), 'synth'),
  new Voice(theme.transpose(7), 'synth'),
  new Voice(theme.transpose(-12), 'bass')
]);

// Build the song structure
const verse = new Composition('Verse', BPM(120)).addTrack(verseTrack);
const chorus = new Composition('Chorus', BPM(120)).addTrack(chorusTrack);

// Play verse, then chorus
await verse.play();
await chorus.play();
```

---

## Exporting Your Music

Contour can export to multiple formats using its plugin system.

### MIDI Export

Export your composition as a MIDI file:

```typescript
import { MIDIRenderer } from '@contour/plugin-midi';
import { writeFile } from 'fs/promises';

// Create your composition
const melody = pattern().fromNotation('C4 E4 G4 C5').build();
const voice = new Voice(melody, 'piano');
const track = new Track('Melody', [voice]);
const composition = new Composition('My Song', BPM(120)).addTrack(track);

// Initialize MIDI renderer
const renderer = new MIDIRenderer();
await renderer.initialize({
  format: 1,           // Format 1 = multi-track
  ticksPerBeat: 480    // High resolution
});

// Render to MIDI
const result = await renderer.render(composition);

// Write to file
await writeFile('my-song.mid', result.data);
console.log(`Exported ${result.data.length} bytes`);
console.log(`Track count: ${result.metadata.trackCount}`);

// Cleanup
await renderer.shutdown();
```

### Audio Export (WAV)

Export to audio format:

```typescript
import { AudioRenderer } from '@contour/plugins/audio';

const renderer = new AudioRenderer();
await renderer.initialize({
  format: 'wav',
  sampleRate: 44100,
  bitDepth: 16
});

const result = await renderer.render(composition);
await writeFile('my-song.wav', result.data);
```

### Plugin Registry

Use the plugin registry to manage multiple exporters:

```typescript
import { PluginRegistry } from '@contour/core';
import { MIDIRenderer } from '@contour/plugin-midi';

const registry = new PluginRegistry();

// Register plugins
const midiRenderer = new MIDIRenderer();
registry.register(midiRenderer);

// List registered plugins
for (const plugin of registry.getAll()) {
  console.log(`${plugin.name} v${plugin.version}`);
}

// Use a plugin
const renderer = registry.getPlugin('midi');
await renderer.initialize({});
const result = await renderer.render(composition);
```

### Complete Export Example

```typescript
async function exportComposition(composition, outputName) {
  const registry = new PluginRegistry();

  // Setup MIDI export
  const midiRenderer = new MIDIRenderer();
  registry.register(midiRenderer);

  await midiRenderer.initialize({
    format: 1,
    ticksPerBeat: 480
  });

  // Export
  const midiResult = await midiRenderer.render(composition);
  await writeFile(`${outputName}.mid`, midiResult.data);

  console.log(`✓ Exported MIDI: ${outputName}.mid`);
  console.log(`  Size: ${midiResult.data.length} bytes`);
  console.log(`  Tracks: ${midiResult.metadata.trackCount}`);

  await midiRenderer.shutdown();
}

// Usage
await exportComposition(mySong, 'my-composition');
```

---

## Advanced Topics

### Live Coding

Contour is designed for live coding - writing and modifying music in real-time. With hot-reload, you can hear changes instantly.

#### Hot-Reload Workflow

1. Start the dev server:
   ```bash
   cd packages/playground
   pnpm dev
   ```

2. Create a composition file that exports patterns
3. Modify the code - changes apply instantly
4. Graceful audio transitions prevent clicks and pops

#### Example Live Coding Session

```typescript
// Start with something simple
export const melody = pattern()
  .fromNotation('C4 E4 G4')
  .build();

// Save and hear it...

// Now make it more interesting
export const melody = pattern()
  .fromNotation('C4 E4 G4 C5')
  .build()
  .fast(2)           // Try changing this to 3
  .every(4, p => p.retrograde()); // Experiment!

// Add a bassline
export const bass = pattern()
  .fromNotation('C2@4')
  .build();

export const full = melody.stack(bass);
```

#### Live Coding Tips

**Start simple, build up:**
```typescript
// Start
let pattern = pattern().fromNotation('C4').build();

// Add more notes
let pattern = pattern().fromNotation('C4 E4 G4').build();

// Add transformations
let pattern = pattern()
  .fromNotation('C4 E4 G4')
  .build()
  .fast(2);

// Add complexity
let pattern = pattern()
  .fromNotation('C4 E4 G4 C5')
  .build()
  .fast(2)
  .every(4, p => p.retrograde());
```

**Use variables for experimentation:**
```typescript
const speed = 2;        // Try 1, 2, 3, 4
const transpose = 7;    // Try 0, 5, 7, 12
const rotation = 2;     // Try 0, 1, 2, 3

export const pattern = Pattern.euclidean(16, 7, rotation)
  .fast(speed)
  .transpose(60 + transpose);
```

### Interactive Performance Grid

The performance grid lets you trigger patterns live:

```bash
cd packages/playground
pnpm dev
# Open http://localhost:3000/performance.html
```

Features:
- **4x4 grid** of triggerable patterns
- **Live editing** with Monaco editor
- **16 preset patterns** (drums, bass, melody, effects)
- **Keyboard shortcuts** for hands-free performance

#### Keyboard Shortcuts

Pattern triggers:
```
1 2 3 4
Q W E R
A S D F
Z X C V
```

Transport controls:
- **Space** - Play/Pause
- **Esc** - Stop all
- **Cmd/Ctrl + D** - Toggle debug panel
- **Cmd/Ctrl + K** - Pattern playground

### Debug Tools

Press **Cmd/Ctrl + D** to open the debug panel with four tabs:

#### Transport Inspector
Monitor playback state in real-time:
```typescript
import { getTransportDebugger } from '@contour/tone-adapter';

const debugger = getTransportDebugger();

// Track events
const id = debugger.trackScheduledEvent('0:0:0', callback);

// Detect conflicts
const conflicts = debugger.detectConflicts();
conflicts.forEach(c => console.warn(c.message));

// Full report
debugger.printReport();
```

#### Pattern Inspector
Analyze patterns:
- View note sequences
- Inspect transformations
- Track pattern lifecycles

#### Performance Monitor
Track resource usage:
- CPU and memory
- AudioNode allocation
- Memory leak detection
- Frame rate and latency

#### Console Log
Filtered, real-time logging

### Algorithmic Composition

Generate music procedurally:

```typescript
// Random walk melody
function randomWalk(startPitch, steps, maxInterval = 3) {
  const notes = [startPitch];

  for (let i = 0; i < steps - 1; i++) {
    const interval = Math.floor(Math.random() * maxInterval * 2) - maxInterval;
    notes.push(notes[i] + interval);
  }

  return new Pattern(notes.map((pitch, i) => ({
    type: 'note',
    pitch,
    duration: 0.25,
    time: i * 0.25,
    velocity: 80
  })));
}

const melody = randomWalk(60, 16, 5);
```

**Markov chains:**
```typescript
const transitions = {
  'C4': ['E4', 'G4', 'A4'],
  'E4': ['C4', 'G4', 'D4'],
  'G4': ['C4', 'E4', 'F4'],
  // etc.
};

function markovMelody(start, length) {
  const notes = [start];

  for (let i = 0; i < length - 1; i++) {
    const current = notes[i];
    const options = transitions[current];
    const next = options[Math.floor(Math.random() * options.length)];
    notes.push(next);
  }

  return pattern(notes);
}
```

**Cellular automata:**
```typescript
function ruleToBeat(rule, cell) {
  // Rule 110, 30, etc.
  const next = [];
  for (let i = 0; i < cell.length; i++) {
    const left = cell[(i - 1 + cell.length) % cell.length];
    const center = cell[i];
    const right = cell[(i + 1) % cell.length];
    const index = (left << 2) | (center << 1) | right;
    next[i] = (rule >> index) & 1;
  }
  return next;
}

let cells = [1, 0, 0, 0, 1, 0, 0, 0];
const generations = 16;

for (let i = 0; i < generations; i++) {
  const rhythm = new Pattern(cells.map((cell, index) =>
    cell ?
      { type: 'note', pitch: 60, duration: 0.25, time: index * 0.25, velocity: 100 } :
      { type: 'rest', duration: 0.25, time: index * 0.25 }
  ));

  cells = ruleToBeat(110, cells);
}
```

### Microtonal Music

Go beyond 12-tone equal temperament:

```typescript
// Just intonation intervals (frequency ratios)
const justIntervals = [
  1,      // Root
  9/8,    // Major second
  5/4,    // Major third
  4/3,    // Perfect fourth
  3/2,    // Perfect fifth
  5/3,    // Major sixth
  15/8,   // Major seventh
  2       // Octave
];

const baseFreq = Hz(261.63); // C4

const justScale = new Pattern(
  justIntervals.map((ratio, i) => ({
    type: 'note',
    frequency: Hz(baseFreq * ratio),
    duration: 0.5,
    time: i * 0.5,
    velocity: 100
  }))
);
```

**Equal divisions:**
```typescript
// 19-tone equal temperament
const divisions = 19;
const octave = 2;

const scale19 = new Pattern(
  Array.from({ length: divisions }, (_, i) => ({
    type: 'note',
    frequency: Hz(440 * Math.pow(octave, i / divisions)),
    duration: 0.25,
    time: i * 0.25,
    velocity: 100
  }))
);
```

---

## What's Next?

You've learned:
- ✅ Creating patterns with PatternBuilder and mini-notation
- ✅ Transforming patterns (transpose, fast, slow, retrograde)
- ✅ Pattern algebra (stack, append, palindrome)
- ✅ Euclidean rhythms for algorithmic composition
- ✅ Building multi-track compositions
- ✅ Exporting to MIDI and audio
- ✅ Live coding and performance
- ✅ Advanced algorithmic techniques

### Explore Further

1. **Study the examples:**
   - `examples/bach-invention-4/` - Classical counterpoint
   - `examples/live-coding-demo/` - Pattern techniques
   - `examples/export-plugins.ts` - Plugin usage

2. **Read the docs:**
   - [TECHNICAL_SPEC.md](TECHNICAL_SPEC.md) - Complete API reference
   - [ARCHITECTURE_GUIDE.md](ARCHITECTURE_GUIDE.md) - Design patterns and internals

3. **Experiment:**
   - Create your own compositions
   - Try the performance grid
   - Write custom algorithms
   - Build your own plugins

4. **Join the community:**
   - Share your compositions
   - Contribute examples
   - Report issues on GitHub

---

## Quick Reference

### Common Patterns

```typescript
// Basic pattern creation
pattern().fromNotation('C4 E4 G4').build()

// Transformations
.transpose(5)      // Up 5 semitones
.fast(2)           // Double speed
.slow(2)           // Half speed
.retrograde()      // Reverse
.palindrome()      // Forward + reverse

// Combinations
.stack(otherPattern)   // Simultaneous
.append(otherPattern)  // Sequential

// Conditional
.every(4, p => p.retrograde())

// Euclidean
Pattern.euclidean(steps, pulses, rotation)
```

### Mini-Notation Syntax

```
C4 E4 G4         Notes
C4*4             Repetition
~                Rest
[E4 G4]          Subdivision
C4@2             Longer duration
Cmaj7            Chord symbol
```

### Common Imports

```typescript
import {
  pattern,
  Pattern,
  Voice,
  Track,
  Composition,
  BPM,
  Durations,
  C, D, E, F, G, A, B,
  Cs, Eb, Fs  // Sharps and flats
} from '@contour/core';

import { MIDIRenderer } from '@contour/plugin-midi';
```


---

## Coming From Other Tools

If you've used other music coding tools, this section will help you understand Contour in terms you already know.

### Coming from TidalCycles / Strudel

Contour is heavily inspired by TidalCycles! Here's how concepts map:

**Pattern Creation:**
```haskell
-- TidalCycles
d1 $ sound "bd sn bd sn"

-- Contour
pattern().fromNotation('C2 D2 C2 D2').build()
```

**Pattern Transformations:**
```haskell
-- TidalCycles
d1 $ fast 2 $ sound "bd sn"
d1 $ slow 2 $ sound "bd sn"
d1 $ rev $ sound "bd sn hh cp"

-- Contour
pattern().fromNotation('C2 D2').build().fast(2)
pattern().fromNotation('C2 D2').build().slow(2)
pattern().fromNotation('C2 D2 E2 F2').build().retrograde()
```

**Euclidean Rhythms:**
```haskell
-- TidalCycles
d1 $ euclid 5 16 $ sound "bd"

-- Contour
Pattern.euclidean(16, 5).transpose(36)  // C2
```

**Pattern Algebra:**
```haskell
-- TidalCycles
d1 $ stack [sound "bd*4", sound "hh*8"]
d1 $ cat [sound "bd", sound "sn"]

-- Contour
kick.stack(hihat)
pattern1.append(pattern2)
```

**Every N Cycles:**
```haskell
-- TidalCycles
d1 $ every 4 rev $ sound "bd sn hh cp"

-- Contour
pattern().fromNotation('C2 D2 E2 F2')
  .build()
  .every(4, p => p.retrograde())
```

**Key Differences:**
- Contour is TypeScript (type-safe at compile time)
- No sample playback yet (synths only)
- Explicit composition structure (Track/Voice/Pattern hierarchy)
- MIDI export built-in
- Hot-reload via Vite instead of ghci

**What's Familiar:**
- ✅ Mini-notation syntax
- ✅ Pattern transformations (fast, slow, rev)
- ✅ Euclidean rhythms
- ✅ Pattern stacking and sequencing
- ✅ Live coding workflow

### Coming from Sonic Pi

Sonic Pi users will find Contour more functional and less imperative, but many concepts translate:

**Playing Notes:**
```ruby
# Sonic Pi
play 60
sleep 1
play 64
sleep 1

# Contour (declarative instead of imperative)
pattern().fromNotation('C4 E4').build()
```

**Looping:**
```ruby
# Sonic Pi
live_loop :melody do
  play 60
  sleep 0.5
end

# Contour (patterns loop automatically)
const melody = pattern().fromNotation('C4').build();
// Pattern loops by default in playback
```

**Scales:**
```ruby
# Sonic Pi
play_pattern_timed scale(:c, :major), 0.5

# Contour
pattern().fromNotation('C4 D E F G A B C5').build()
```

**Effects and Synths:**
```ruby
# Sonic Pi
use_synth :beep
with_fx :reverb do
  play 60
end

# Contour (instrument specification)
new Voice(pattern, 'synth')
// Effects via Tone.js in browser
```

**Sample Playback:**
```ruby
# Sonic Pi
sample :bd_haus

# Contour
// Not yet implemented - use MIDI notes for drums
pattern().fromNotation('C2').build()  // Kick on C2
```

**Key Differences:**
- Contour is declarative, not imperative (no `sleep`, no sequential execution)
- Patterns are immutable (transformations create new patterns)
- TypeScript instead of Ruby
- Browser-based (Tone.js) instead of SuperCollider
- MIDI export built-in

**What's Familiar:**
- ✅ Live coding workflow
- ✅ Musical concepts (notes, scales, chords)
- ✅ Synth specification
- ✅ Hot-reload development

### Coming from Overtone

Overtone users will appreciate Contour's functional approach:

**Playing Notes:**
```clojure
; Overtone
(definst saw-wave [freq 440 amp 0.3]
  (* amp (saw freq)))

(saw-wave 440)

; Contour (Tone.js handles synthesis)
const pattern = new Pattern([
  { type: 'note', frequency: Hz(440), duration: 1, time: 0, velocity: 100 }
]);
```

**Patterns and Sequences:**
```clojure
; Overtone with leipzig
(play-note (phrase [1 1 1 1] [60 64 67 72]))

; Contour
pattern().fromNotation('C4 E4 G4 C5').build()
```

**Functional Transformations:**
```clojure
; Overtone
(map #(* % 2) [1 2 3 4])

; Contour (map over events)
pattern.map((event, i) => ({
  ...event,
  velocity: Velocity(event.velocity * 2)
}))
```

**Live Coding:**
```clojure
; Overtone
(defn melody []
  (play-note ...))

; Edit function and re-evaluate

; Contour (hot-reload)
export const melody = pattern()
  .fromNotation('C4 E4 G4')
  .build();
// Save file → instant audio update
```

**Key Differences:**
- TypeScript/JavaScript instead of Clojure
- Browser-based (Tone.js) instead of SuperCollider
- Immutable patterns (like Clojure data structures!)
- Visual dev tools (Monaco editor, debug panel)
- MIDI export built-in

**What's Familiar:**
- ✅ Functional programming paradigm
- ✅ Immutable data structures
- ✅ Pattern transformations
- ✅ REPL-style development
- ✅ Live coding workflow

### Coming from Max/MSP or Pure Data

Max/MSP and Pd users will find Contour quite different, but here's how to think about it:

**Patching vs. Coding:**
```
Max/MSP:  [Visual patching of objects]
Contour:  Code-based composition
```

**Objects vs. Functions:**
```
Max/MSP:  [metro] → [counter] → [select] → [makenote]
Contour:  pattern().fromNotation(...).build()
```

**Scheduling:**
```
Max/MSP:  [metro 500] (triggers every 500ms)
Contour:  Uses Tone.Transport (musical time, not clock time)
```

**Data Flow:**
```
Max/MSP:  Hot inlets (bang), cold inlets (store)
Contour:  Functional transformations (pattern.transpose(5))
```

**Key Differences:**
- Text-based, not visual patching
- Functional/declarative instead of dataflow
- Higher-level musical abstractions
- No low-level DSP (Tone.js handles that)
- Version control friendly (it's just code!)

**What Translates:**
- ✅ Musical timing and scheduling
- ✅ Synthesis and audio generation
- ✅ Live performance capability
- ✅ Modular, composable approach

### Coming from Web Audio API

If you've coded directly with Web Audio API:

**Creating Oscillators:**
```javascript
// Web Audio API
const audioCtx = new AudioContext();
const oscillator = audioCtx.createOscillator();
oscillator.frequency.value = 440;
oscillator.connect(audioCtx.destination);
oscillator.start();

// Contour (abstracted via Tone.js)
const pattern = new Pattern([
  { type: 'note', frequency: Hz(440), duration: 1, time: 0 }
]);
const voice = new Voice(pattern, 'synth');
await voice.play();
```

**Scheduling:**
```javascript
// Web Audio API
oscillator.start(audioCtx.currentTime + 1);
oscillator.stop(audioCtx.currentTime + 2);

// Contour (musical time via Tone.Transport)
const pattern = new Pattern([
  { type: 'note', pitch: 60, duration: 1, time: 0 }
]);
// Scheduling handled automatically
```

**Key Differences:**
- Contour uses Tone.js (built on Web Audio API)
- Musical abstractions instead of low-level nodes
- Automatic memory management (no manual node disposal in most cases)
- Musical time (beats) instead of audio time (seconds)
- Pattern-based composition

**What's Familiar:**
- ✅ Browser-based audio
- ✅ JavaScript/TypeScript
- ✅ AudioContext under the hood
- ✅ Synthesis and effects

### Coming from MIDI Sequencers (Ableton, FL Studio, Logic)

If you're used to DAWs and MIDI sequencers:

**Piano Roll → Patterns:**
```
DAW:       [Visual piano roll with notes placed on grid]
Contour:   pattern().fromNotation('C4 E4 G4 C5').build()
```

**Tracks → Tracks:**
```javascript
// Similar concept!
const track = new Track('Melody', [
  new Voice(melodyPattern, 'piano')
]);
```

**Arrangement → Composition:**
```javascript
const song = new Composition('My Song', BPM(120))
  .addTrack(melodyTrack)
  .addTrack(bassTrack)
  .addTrack(drumTrack);
```

**MIDI Effects:**
```
DAW MIDI FX:  [Transpose +7] → [Delay] → [Arpeggiator]
Contour:      pattern.transpose(7).map(...custom logic...)
```

**Automation:**
```
DAW:       Draw automation curves
Contour:   pattern.map((event, i) => ({
             ...event,
             velocity: Velocity(50 + i * 10)  // Crescendo
           }))
```

**Key Differences:**
- Text-based, not GUI
- Functional transformations instead of MIDI effects
- Version control friendly
- Algorithmic generation built-in
- Live coding support

**What's Familiar:**
- ✅ Track-based organization
- ✅ MIDI export
- ✅ Tempo and time signatures
- ✅ Multi-track compositions
- ✅ Piano roll concept (via mini-notation)

### Common Questions for New Users

**"Can I import MIDI files?"**
Not yet, but it's planned. Currently, you create patterns in code.

**"Can I use VST plugins?"**
No - Contour uses Tone.js synthesis in the browser. Export to MIDI and use your DAW for VST playback.

**"Can I record audio input?"**
Not built-in, but you can access microphone via Tone.js directly.

**"Is there a GUI?"**
Partially - there's a performance grid and debug panel, but composition is code-based.

**"Can I collaborate in real-time?"**
Not built-in, but since it's just code, use git, VS Code Live Share, etc.

**"What about sample playback?"**
Not yet implemented - synths only for now. Use MIDI export and load samples in your DAW.

---


---

Happy composing! 🎵

**Remember:** Music composition is about exploration and experimentation. Don't be afraid to try unusual combinations, break the rules, and create something unique. Contour gives you the tools - your creativity does the rest.
