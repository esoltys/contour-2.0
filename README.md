# Contour 2.0

**A TypeScript-first music composition framework for algorithmic and generative music**

Build music using functional patterns, explore advanced music theory concepts, and create compositions impossible on physical instruments.

## Features

- **Functional Composition** - Build music using composable, immutable patterns inspired by TidalCycles
- **Mini-Notation** - Concise, expressive syntax for rapid pattern creation including scale degree notation (`$1 $3 $5`)
- **Music Theory Integration** - Comprehensive support for scales (15 types), modes, chord voicings (20+ qualities), and progressions
- **Advanced Musical Effects** - Staccato, legato, dynamics, humanization, swing, tremolo, arpeggiation, and delay
- **Sample Library** - 128+ GM instruments with realistic sounds via CDN-hosted soundfonts
- **Live Coding** - Hot-reload with instant feedback and graceful audio transitions
- **Euclidean Rhythms** - Generate algorithmically interesting patterns using Bjorklund's algorithm
- **Type Safety** - Branded types prevent unit mixing (Hz vs BPM) at compile time
- **Interactive Debug Tools** - Real-time transport inspector, pattern analyzer, and performance monitor
- **Multiple Export Formats** - Render to audio playback, WAV files, or MIDI
- **Plugin Architecture** - Extensible renderer system

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/esoltys/contour-2.0.git
cd contour-2.0

# Install dependencies
pnpm install

# Run tests
pnpm test
```

### Running the Demos

```bash
cd packages/playground
pnpm dev
# Open http://localhost:3000
```

**Three interactive demos included:**
- **Contour Live** (`/playground.html`) - 4×4 interactive pattern grid with 16 musical presets
- **Sample Library** (`/prototype-samples.html`) - 128+ GM instruments with realistic sounds
- **Advanced Effects** (`/advanced-effects.html`) - 8 interactive musical expression demonstrations

**Keyboard shortcuts:**
- `Space` - Play/Pause
- `Cmd/Ctrl + D` - Toggle debug panel
- `Cmd/Ctrl + K` - Open pattern playground
- `?` - Show all shortcuts

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

### Mini-Notation

```typescript
import { pattern, Scale } from '@contour/core';

// Concise pattern syntax
const drums = pattern()
  .fromNotation('C2*4 ~ [E3 G3] C4@2')
  .build();
// C2 repeated 4x, rest, E3/G3 subdivision, C4 held longer

// Scale degree notation
const cMajor = new Scale('C4', 'major');
const melody = pattern()
  .withScale(cMajor)
  .fromNotation('$1 $3 $5 $8')  // C4, E4, G4, C5
  .build();
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
const evolving = base.every(4, p => p.rev());  // Reverse every 4th cycle
```

### Euclidean Rhythms

```typescript
// Algorithmic rhythm generation
const rhythm = Pattern.euclidean(16, 5);  // 5 pulses in 16 steps

// Combine with transformations and scales
const generative = Pattern.euclidean(16, 11)
  .transpose(60)  // MIDI note C4
  .inScale(new Scale('C4', 'minorPentatonic'))
  .fast(2);
```

### Music Theory

```typescript
import { Scale, ChordVoicing, ChordProgression, Duration } from '@contour/core';

// Scales and modes
const dDorian = new Scale('D4', 'Dorian');
const notes = dDorian.getNotes();  // [D4, E4, F4, G4, A4, B4, C5, D5]

// Chord voicings
const cMaj7 = ChordVoicing.fromQuality('C4', 'maj7');
const firstInversion = cMaj7.inversion(1);

// Chord progressions
const jazzTurnaround = ChordProgression.fromDegrees(
  new Scale('C4', 'major'),
  ['I', 'vi', 'ii', 'V'],
  Duration(2.0)
).toPattern('arpeggio');
```

### Advanced Musical Effects

```typescript
import { pattern, Velocity } from '@contour/core';

// Expressive piano phrase
const phrase = pattern()
  .fromNotation('C4 D4 E4 F4 G4')
  .legato(0.12)                    // Smooth, connected notes
  .crescendo(Velocity(55), Velocity(95))  // Gradual volume increase
  .humanize({                      // Natural timing variations
    timing: 0.025,
    velocity: 10,
    seed: 42
  })
  .build();

// Rhythmic effects
const drums = pattern()
  .fromNotation('C2 C2 C2 C2')
  .accent([0, 2], 30)              // Emphasize beats 1 and 3
  .swing(0.55);                    // Jazz shuffle feel

// Advanced techniques
const arpeggio = pattern()
  .chord(['C4', 'E4', 'G4', 'C5'])
  .arpeggiate('up')                // Break chord into sequence
  .delay(Duration(0.5), 0.6, 0.7); // Add rhythmic echo
```

### Sample Library

```typescript
import { Track, pattern } from '@contour/core';

// Use realistic instrument sounds
const piano = new Track('piano');
piano.instrument = 'MuseScore:acoustic_grand_piano';
piano.pattern = pattern()
  .fromNotation('Cmaj7 Dm7 G7 Cmaj7')
  .arpeggiate('up')
  .build();

// Mix multiple instruments
const guitar = new Track('guitar');
guitar.instrument = 'MuseScore:acoustic_guitar_steel';

const drums = new Track('drums');
drums.instrument = 'MuseScore:standard_kit';

// 128+ GM instruments available:
// Pianos, Guitars, Strings, Brass, Woodwinds, Synths, Drums, etc.
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

## Documentation

**New to Contour?** Start with the [Tutorial](docs/TUTORIAL.md) - a complete guide split into 6 focused parts:
1. [Basics](docs/tutorials/01-basics.md) - Hello World and core concepts
2. [Mini-Notation](docs/tutorials/02-notation.md) - Concise pattern syntax
3. [Transformations](docs/tutorials/03-transformations.md) - Pattern operations and algorithms
4. [Compositions](docs/tutorials/04-composition.md) - Multi-track music and exporting
5. [Advanced](docs/tutorials/05-advanced.md) - Effects and techniques
6. [Reference](docs/tutorials/06-reference.md) - Quick reference and comparisons

**Additional resources:**
- [FAQ](docs/FAQ.md) - Frequently asked questions
- [Claude Development Guide](CLAUDE.md) - AI pair programming guide for contributors

## Technology Stack

- **[Tone.js](https://tonejs.github.io/)** - Web Audio synthesis and scheduling
- **[Vite](https://vitejs.dev/)** - Build tooling with instant HMR
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety and developer experience
- **[Vitest](https://vitest.dev/)** - Testing framework

## Contributing

See [CLAUDE.md](CLAUDE.md) for development workflow, coding standards, and architectural patterns.

For AI assistants: See [.github/copilot-instructions.md](.github/copilot-instructions.md) for quick reference guidelines.

## License

MIT

## Inspiration

- **[TidalCycles](https://tidalcycles.org/)** - Pattern algebra for live coding
- **[Strudel](https://strudel.cc/)** - TypeScript TidalCycles implementation
- **[Sonic Pi](https://sonic-pi.net/)** - Live coding music synthesis
- **[Overtone](https://overtone.github.io/)** - Collaborative programmable music

## Sample Sources

Contour uses high-quality audio samples from the following sources:

### Drum Samples
- **[Tone.js Drum Samples](https://tonejs.github.io/audio/drum-samples/)** - Curated collection of drum machine samples
  - CR78 (Roland CR-78)
  - Techno
  - Acoustic Kit
  - LINN (LinnDrum)
  - KPR77 (Korg KPR-77)
  - Source: [Web Audio Samples](https://github.com/cwilso/web-audio-samples)

### Melodic Instruments
- **[MIDI.js Soundfonts](https://gleitz.github.io/midi-js-soundfonts/)** - General MIDI soundfont library
  - MusyngKite soundfont collection
  - 127 GM instruments (pianos, strings, brass, synths, etc.)
  - Source: [midi-js-soundfonts](https://github.com/gleitz/midi-js-soundfonts)
