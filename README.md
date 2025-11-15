# Contour 2.0

**A TypeScript-first music composition framework for algorithmic and generative music**

Contour enables developers to compose music using functional patterns, explore advanced music theory concepts, and create compositions impossible on physical instruments.

## Features

- **Functional Composition** - Build music using composable, immutable patterns inspired by TidalCycles
- **Mini-Notation** - Concise, expressive syntax for rapid pattern creation including scale degree notation (`$1 $3 $5`)
- **Music Theory Integration** - Comprehensive support for scales (15 types), modes, chord voicings (20+ qualities), and progressions
- **Live Coding** - Perfect for performances with hot-reload and instant feedback
- **Euclidean Rhythms** - Generate algorithmically interesting patterns using Bjorklund's algorithm
- **Advanced Composition** - Create microtonal music, modal jazz, complex polyrhythms, and algorithmic compositions
- **Type Safety** - Branded types prevent unit mixing (Hz vs BPM) at compile time
- **Hot Module Reload** - Instant feedback with graceful audio transitions
- **Interactive Debug Tools** - Real-time transport inspector, pattern analyzer, and performance monitor
- **Multiple Export Formats** - Render to audio playback, WAV files, or MIDI
- **Plugin Architecture** - Extensible renderer system
- **Sample Library Support** - Load and use SoundFonts (.sf2) and external sample libraries (PLANNED)

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

```bash
# Clone the repository
git clone https://github.com/esoltys/contour-2.0.git
cd contour-2.0

# Install dependencies
pnpm install

# Run type checking
pnpm type-check

# Run tests
pnpm test
```

### Running the Demo

Start the development server with hot-reload:

```bash
cd packages/playground
pnpm dev
```

Open http://localhost:3000 in your browser. The demo includes an interactive example with playback controls.

### Running Examples

#### Bach Invention No. 4

The primary acceptance test - Bach's Invention No. 4 in D Minor (BWV 775):

```bash
cd examples/bach-invention-4
pnpm install

# Export to MIDI file (works in Node.js)
pnpm run export

# Run tests
pnpm test

# For audio playback, use the browser-based dev server instead:
cd ../../packages/playground
pnpm dev
# Then open http://localhost:3000
```

#### Interactive Playground

Explore live pattern composition with the interactive playground:

```bash
cd packages/playground
pnpm dev
# Open http://localhost:3000/performance.html
```

This demo showcases:
- 4x4 grid of triggerable pattern pads with real-time audio
- Live pattern editing with Monaco Editor
- 16 preset patterns (drums, bass, melody, effects)
- Global transport controls (play/pause, tempo, volume)
- Pattern algebra and mini-notation in action
- Keyboard shortcuts for quick triggering and editing

#### Plugin Examples

Export examples demonstrating the plugin architecture:

```bash
node examples/export-plugins.ts
```

### Development and Debugging Tools

Contour includes a comprehensive suite of development tools for debugging and monitoring your compositions in real-time:

#### Debug Panel

Press `Cmd/Ctrl + D` to toggle the interactive debug panel, which includes four powerful tabs:

**Transport Inspector**
- Real-time transport state (playing/stopped/paused)
- Current BPM, position, and timing
- Scheduled event monitoring
- Conflict detection for overlapping events

**Pattern Inspector**
- Analyze pattern structure and transformations
- View note sequences and timing
- Inspect pattern algebra operations
- Track pattern lifecycles

**Performance Monitor**
- CPU and memory usage tracking
- AudioNode allocation monitoring
- Memory leak detection
- Frame rate and latency metrics

**Console Log**
- Filtered console output
- Debug message categorization
- Real-time logging updates

#### Keyboard Shortcuts

Press `?` to view all keyboard shortcuts, including:

- **Space** - Play/Pause transport
- **Esc** - Stop all playback
- **Cmd/Ctrl + D** - Toggle debug panel
- **Cmd/Ctrl + K** - Open pattern playground
- **1-4, Q-R, A-F, Z-V** - Trigger pattern pads (in playground)
- **Shift + Pad Key** - Edit pattern

#### TransportDebugger API

For programmatic debugging, use the `TransportDebugger` class:

```typescript
import { getTransportDebugger } from '@contour/tone-adapter';

const debugger = getTransportDebugger();

// Track scheduled events
const eventId = debugger.trackScheduledEvent('0:0:0', myCallback);

// Detect scheduling conflicts
const conflicts = debugger.detectConflicts();
conflicts.forEach(c => console.warn(c.message));

// Check for memory leaks
const leaks = debugger.checkForLeaks();
if (leaks.length > 0) {
  console.error(`Found ${leaks.length} potential AudioNode leaks`);
}

// Generate full diagnostic report
debugger.printReport();
```

## Project Structure

```
contour/
├── packages/
│   ├── core/              # Musical primitives, patterns, composition system
│   ├── tone-adapter/      # Tone.js integration layer
│   ├── plugins/
│   │   ├── audio/         # WAV export renderer
│   │   └── midi/          # MIDI export renderer
│   └── playground/        # Interactive playground with debug tools
├── examples/
│   ├── bach-invention-4/  # Bach Invention No. 4 (primary acceptance test)
│   └── live-coding-demo/  # Console-based pattern demo
└── docs/                  # Complete documentation
```

## Core Concepts

### Branded Types

Type-safe units prevent common mistakes:

```typescript
const freq = Hz(440);      // Type: Hz
const tempo = BPM(120);    // Type: BPM
// freq + tempo            // ✗ Type error!
```

### Immutable Patterns

All transformations return new instances:

```typescript
const pattern = new Pattern([note('C4'), note('E4'), note('G4')]);
const transposed = pattern.transpose(5);  // New pattern
// pattern is unchanged
```

### Mini-Notation

Concise syntax for rapid pattern creation:

```typescript
// Verbose approach
pattern()
  .note('C4', Durations.quarter)
  .note('E4', Durations.quarter)
  .note('G4', Durations.quarter)
  .build();

// Mini-notation approach
pattern().fromNotation('C4 E4 G4').build();

// Advanced features
pattern().fromNotation('C4*4 ~ [E4 G4] C5@2').build();
// C4 repeated 4 times, rest, E4/G4 subdivision, C5 held longer

// Scale degree notation
const cMajor = new Scale('C4', 'major');
pattern()
  .withScale(cMajor)
  .fromNotation('$1 $3 $5 $8')  // C4, E4, G4, C5 (scale degrees)
  .build();

// Mix degrees with absolute notes and modifiers
pattern()
  .withScale(cMajor)
  .fromNotation('$1*2 E4 [$3 $5] $8@2')
  .build();
```

### Pattern Algebra

Compose patterns functionally:

```typescript
const melody = pattern(['C4', 'E4', 'G4'])
  .fast(2)                    // Double speed
  .every(4, p => p.rev())     // Reverse every 4th cycle
  .transpose(5);              // Up 5 semitones

// Combine patterns
const p1 = pattern().fromNotation('C4 E4').build();
const p2 = pattern().fromNotation('G4 C5').build();

p1.stack(p2);      // Play simultaneously
p1.append(p2);     // Play sequentially
p1.palindrome();   // Forward then reverse
```

### Music Theory

Contour includes comprehensive music theory utilities for scales, modes, chords, and progressions:

#### Scales and Modes

Create scales in any key with 15 built-in scale types:

```typescript
import { Scale } from '@contour/core';

// Major scale
const cMajor = new Scale('C4', 'major');
const notes = cMajor.getNotes();  // [C4, D4, E4, F4, G4, A4, B4, C5]

// Minor scales
const dMinor = new Scale('D4', 'minor');          // Natural minor
const aHarmonic = new Scale('A4', 'harmonicMinor'); // Harmonic minor

// Greek modes
const dDorian = new Scale('D4', 'Dorian');
const ePhrygian = new Scale('E4', 'Phrygian');
const fLydian = new Scale('F4', 'Lydian');
const gMixolydian = new Scale('G4', 'Mixolydian');
const aAeolian = new Scale('A4', 'Aeolian');
const bLocrian = new Scale('B4', 'Locrian');

// Pentatonic scales
const cPentatonic = new Scale('C4', 'majorPentatonic');
const aPentMinor = new Scale('A4', 'minorPentatonic');

// Get specific scale degrees
const third = cMajor.degree(3);   // E4
const fifth = cMajor.degree(5);   // G4
const octave = cMajor.degree(8);  // C5

// Transform scales
const transposed = cMajor.transpose(2);  // D major
```

#### Scale Degree Notation

Use `$n` syntax in mini-notation to reference scale degrees:

```typescript
import { PatternBuilder, Scale } from '@contour/core';

const cMajor = new Scale('C4', 'major');

// Create patterns using scale degrees (1-indexed)
const pattern = new PatternBuilder()
  .withScale(cMajor)
  .fromNotation('$1 $3 $5 $8')  // C4, E4, G4, C5
  .build();

// Full scale ascending
const scale = new PatternBuilder()
  .withScale(cMajor)
  .fromNotation('$1 $2 $3 $4 $5 $6 $7 $8')
  .build();

// Degrees support all mini-notation modifiers
const complex = new PatternBuilder()
  .withScale(cMajor)
  .fromNotation('$1*4 ~ [$3 $5] $8@2')
  .build();
  // Tonic repeated 4x, rest, third/fifth subdivision, octave held longer

// Mix with absolute notes
const mixed = new PatternBuilder()
  .withScale(cMajor)
  .fromNotation('$1 E4 $5 G4')  // Scale degrees mixed with absolute pitches
  .build();

// Works with any scale type
const dorian = new PatternBuilder()
  .withScale(new Scale('D4', 'Dorian'))
  .fromNotation('$1 $2 $3')  // D4, E4, F4 (natural 2nd, flat 3rd)
  .build();
```

#### Pattern Integration with Scales

Use the `.degrees()` method or convert scales directly to patterns:

```typescript
// Method 1: PatternBuilder.degrees()
const pattern = new PatternBuilder()
  .withScale(cMajor)
  .degrees([1, 3, 5, 8])  // Array of scale degrees
  .build();

// Method 2: Scale.pattern()
const scalePattern = cMajor.pattern([1, 2, 3, 4, 5, 6, 7, 8]);

// Quantize existing patterns to a scale
const chromaticMelody = pattern().fromNotation('C4 C#4 D4 D#4 E4').build();
const quantized = chromaticMelody.inScale(cMajor);
// Snaps all notes to nearest scale degree
```

#### Chord Voicings

Create and manipulate chord voicings with proper octave spanning:

```typescript
import { ChordVoicing } from '@contour/core';

// Create chords by quality
const cMaj7 = ChordVoicing.fromQuality('C4', 'maj7');  // C4, E4, G4, B4
const dm7 = ChordVoicing.fromQuality('D4', 'm7');      // D4, F4, A4, C5
const g7 = ChordVoicing.fromQuality('G4', '7');        // G4, B4, D5, F5

// Supported chord qualities: maj, maj7, m, m7, 7, dim, dim7, aug, sus2, sus4,
//   6, m6, 9, m9, 11, m11, 13, m13, add9, 7sus4, maj9, and more

// Get inversions
const firstInv = cMaj7.inversion(1);   // E4, G4, B4, C5
const secondInv = cMaj7.inversion(2);  // G4, B4, C5, E5

// Transform chords
const transposed = cMaj7.transpose(5);  // F maj7

// Convert to pattern (block chords or arpeggios)
const blockChord = cMaj7.toPattern(Durations.half, 'block');
const arpeggio = cMaj7.toPattern(Durations.quarter, 'arpeggio');
```

#### Chord Progressions

Create timed sequences of chords using Roman numeral notation:

```typescript
import { ChordProgression } from '@contour/core';

// Create progression with Roman numerals
const progression = ChordProgression.fromDegrees(
  cMajor,
  ['I', 'IV', 'V', 'I'],  // Uppercase = major, lowercase = minor
  Duration(1.0)            // Duration per chord
);

// Common progressions
const jazzTurnaround = ChordProgression.fromDegrees(
  cMajor,
  ['I', 'vi', 'ii', 'V'],  // I-vi-ii-V
  Duration(2.0)
);

// Minor key progression
const minorProg = ChordProgression.fromDegrees(
  new Scale('A4', 'minor'),
  ['i', 'iv', 'V', 'i'],   // i-iv-V-i in A minor
  Duration(1.5)
);

// Convert to pattern
const blockChords = progression.toPattern('block');      // Block chords
const arpeggiated = progression.toPattern('arpeggio');  // Arpeggiated

// Transform progressions
const transposed = progression.transpose(5);  // Up perfect 4th
const faster = progression.fast(2);           // Double speed
```

#### Practical Examples

**Modal Jazz Composition:**
```typescript
const dDorian = new Scale('D4', 'Dorian');

// Melody using scale degrees
const melody = new PatternBuilder()
  .withScale(dDorian)
  .fromNotation('$1/8 $2/8 $3/4 $2/8 $1/4 ~ $5/8 $3/4')
  .build();

// Chord progression in Dorian
const chords = ChordProgression.fromDegrees(
  dDorian,
  ['i', 'IV', 'i', 'IV'],  // i-IV vamp common in Dorian
  Duration(2.0)
).toPattern('block');
```

**Algorithmic Composition with Scales:**
```typescript
const cPentatonic = new Scale('C4', 'minorPentatonic');

// Generate random walk through pentatonic scale
const randomMelody = new PatternBuilder()
  .withScale(cPentatonic)
  .degrees([1, 3, 5, 3, 2, 5, 1])
  .build()
  .fast(2)
  .every(4, p => p.rev());

// Quantize generative patterns to scale
const euclideanMelody = Pattern.euclidean(16, 9)
  .transpose(60)  // Start at C4
  .inScale(cPentatonic);  // Snap to pentatonic notes
```

### Four-Layer Architecture

1. **Tone.js primitives** - Direct access to Tone.js when needed
2. **Musical wrappers** - Thin adapters with musical terminology
3. **Composition abstractions** - Pattern, Voice, Track, Composition
4. **DSL syntax** - User-facing fluent API

## Documentation

### Learning Contour

**New to Contour?** Start here:

- **[TUTORIAL.md](docs/TUTORIAL.md)** - Complete tutorial from "Hello World" to advanced topics
  - Beginner-friendly walkthrough
  - Progressive examples
  - Guides for users coming from TidalCycles, Sonic Pi, Overtone, Max/MSP, and more
  - Covers all features with practical examples

### Complete Documentation

- **[CLAUDE.md](CLAUDE.md)** - Development guide and workflow (project root)
- **[PRODUCT_REQUIREMENTS.md](docs/PRODUCT_REQUIREMENTS.md)** - Vision, goals, user stories
- **[ARCHITECTURE_GUIDE.md](docs/ARCHITECTURE_GUIDE.md)** - Research and lessons learned
- **[TECHNICAL_SPEC.md](docs/TECHNICAL_SPEC.md)** - API contracts and implementation details
- **[QUICK_START.md](docs/QUICK_START.md)** - Step-by-step implementation guide
- **[ARCHITECTURE_DECISIONS.md](docs/ARCHITECTURE_DECISIONS.md)** - Record of major decisions
- **[PLUGIN_ARCHITECTURE.md](docs/PLUGIN_ARCHITECTURE.md)** - Plugin architecture summary
- **[SAMPLE_LIBRARY_SPEC.md](docs/SAMPLE_LIBRARY_SPEC.md)** - Sample library loading specification (PLANNED)
- **[SAMPLE_LIBRARY_INTEGRATION_SUMMARY.md](docs/SAMPLE_LIBRARY_INTEGRATION_SUMMARY.md)** - Sample library integration summary (PLANNED)

## Examples

### Simple Melody

```typescript
import { Pattern, Voice, Composition, BPM } from '@contour/core';

// Create a pattern
const melody = new Pattern([
  { pitch: 60, duration: 0.5, time: 0 },    // C4
  { pitch: 64, duration: 0.5, time: 0.5 },  // E4
  { pitch: 67, duration: 0.5, time: 1.0 },  // G4
]);

// Create a composition
const song = new Composition([
  new Voice(melody, 'synth')
], BPM(120));

// Play it
await song.play();
```

### Pattern Transformations

```typescript
// Create and transform patterns
const base = pattern(['C4', 'E4', 'G4']);

const transformed = base
  .transpose(5)           // Up 5 semitones
  .retrograde()           // Reverse
  .fast(2);               // Double speed

// Conditional transformations
const conditional = base.every(4, p => p.rev());  // Reverse every 4th cycle
```

### Mini-Notation and Euclidean Rhythms

```typescript
// Concise pattern creation with mini-notation
const melody = pattern()
  .fromNotation('C4 E4 G4 C5')
  .build();

// Rhythm patterns with repetition, rests, and grouping
const drums = pattern()
  .fromNotation('C2*4 ~ [E3 G3] C4@2')
  .build();

// Scale degree notation for modal composition
const cMajor = new Scale('C4', 'major');
const modalMelody = pattern()
  .withScale(cMajor)
  .fromNotation('$1 $2 $3 $5 $8 $5 $3 $1')  // Scale-based melody
  .build();

// Euclidean rhythms for algorithmic composition
const rhythm = Pattern.euclidean(16, 5);  // 5 pulses in 16 steps
const shifted = Pattern.euclidean(8, 3, 2);  // With rotation

// Combine with transformations and scales
const generative = Pattern.euclidean(16, 11)
  .transpose(60)  // MIDI note C4
  .inScale(new Scale('C4', 'minorPentatonic'))  // Quantize to pentatonic
  .fast(2);
```

### Exporting

```typescript
import { MidiRenderer } from '@contour/plugins/midi';

// Export to MIDI
const renderer = new MidiRenderer();
await renderer.initialize({});
const result = await renderer.render(composition);

// Write to file
fs.writeFileSync('output.mid', result.data);
```

### Sample Libraries (PLANNED Feature)

Contour will support loading external sample libraries for realistic instrument sounds:

```typescript
import { SampleLibraryManager } from '@contour/tone-adapter';

// Load a SoundFont
const sampleManager = new SampleLibraryManager();
await sampleManager.loadLibrary({
  name: 'GeneralUserGS',
  format: 'soundfont',
  url: 'https://example.com/GeneralUser-GS.sf2'
});

// Use sampled instruments in compositions
const piano = new Voice(
  melodyPattern,
  'GeneralUserGS:AcousticGrandPiano'  // Sampled piano
);

const bass = new Voice(
  bassPattern,
  'synth'  // Mix with Tone.js synths
);

// Schedule and play
const scheduler = new CompositionScheduler();
scheduler.setSampleLibraryManager(sampleManager);
scheduler.scheduleComposition(composition);
```

**Features:**
- Load SoundFonts (.sf2) from URLs or local files
- Type-safe instrument names with autocomplete
- Mix sampled and synthesized instruments
- Zero impact on core package (optional feature)
- JSON-serializable composition format

See [SAMPLE_LIBRARY_SPEC.md](docs/SAMPLE_LIBRARY_SPEC.md) for full specification.

## Testing

Run the test suite:

```bash
# All tests
pnpm test

# Specific package
cd packages/core
pnpm test

# Type checking
pnpm type-check
```

Test coverage includes:
- Unit tests for musical primitives
- Property-based tests for algebraic laws
- Integration tests with Tone.js
- Golden file tests for audio rendering

## Technology Stack

- **[Tone.js](https://tonejs.github.io/)** - Web Audio synthesis and scheduling
- **[Vite](https://vitejs.dev/)** - Build tooling with instant HMR
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety and developer experience
- **[Vitest](https://vitest.dev/)** - Testing framework

## Contributing

This project is currently in active development.

### For Human Developers
See [CLAUDE.md](CLAUDE.md) for comprehensive development workflow, coding standards, and architectural patterns.

### For AI Assistants (GitHub Copilot, etc.)
See [.github/copilot-instructions.md](.github/copilot-instructions.md) for quick reference guidelines. This file references [CLAUDE.md](CLAUDE.md) as the primary source of truth for development conventions.

**Key resources for AI pair programming**:
1. **[.github/copilot-instructions.md](.github/copilot-instructions.md)** - Quick reference for AI assistants
2. **[CLAUDE.md](CLAUDE.md)** - Complete development guide with architecture and patterns
3. **[docs/TECHNICAL_SPEC.md](docs/TECHNICAL_SPEC.md)** - API contracts and type system

## License

MIT

## Inspiration

Contour draws inspiration from:
- **[TidalCycles](https://tidalcycles.org/)** - Pattern algebra for live coding
- **[Strudel](https://strudel.cc/)** - TypeScript TidalCycles implementation
- **[Sonic Pi](https://sonic-pi.net/)** - Live coding music synthesis
- **[Overtone](https://overtone.github.io/)** - Collaborative programmable music

## What Makes Contour Different?

Unlike traditional DAWs or notation software, Contour enables:

- **Computer-only music** - Microtonal scales, polyrhythms beyond human capability
- **Algorithmic composition** - L-systems, fractals, cellular automata
- **Type-safe abstractions** - Catch musical mistakes at compile time
- **Functional patterns** - Compose with immutability and transformations
- **Developer experience** - Hot-reload, TypeScript tooling, familiar patterns

**Music composition as code**
