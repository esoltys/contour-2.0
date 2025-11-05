# Contour 2.0

**A TypeScript-first music composition framework for algorithmic and generative music**

Contour enables developers to compose music using functional patterns, explore advanced music theory concepts, and create compositions impossible on physical instruments.

## Features

- **Functional Composition** - Build music using composable, immutable patterns inspired by TidalCycles
- **Music Theory Exploration** - Create microtonal music, complex polyrhythms, and algorithmic compositions
- **Type Safety** - Branded types prevent unit mixing (Hz vs BPM) at compile time
- **Hot Module Reload** - Instant feedback with graceful audio transitions
- **Multiple Export Formats** - Render to audio playback, MP3/WAV files, or MIDI
- **Plugin Architecture** - Extensible renderer system

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
cd packages/dev
pnpm dev
```

Open http://localhost:5173 in your browser. The demo includes an interactive example with playback controls.

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
cd ../../packages/dev
pnpm dev
# Then open http://localhost:5173
```

#### Plugin Examples

Export examples demonstrating the plugin architecture:

```bash
node examples/export-plugins.ts
```

## Project Structure

```
contour/
├── packages/
│   ├── core/           # Musical primitives, patterns, composition system
│   ├── tone-adapter/   # Tone.js integration layer
│   ├── plugins/        # Renderer plugins (audio, MIDI)
│   └── dev/            # Vite dev server with HMR
├── examples/
│   ├── bach-invention-4/  # Bach Invention No. 4 example
│   └── export-plugins.ts  # Plugin demonstration
└── docs/               # Complete documentation
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

### Pattern Algebra

Compose patterns functionally:

```typescript
const melody = pattern(['C4', 'E4', 'G4'])
  .fast(2)                    // Double speed
  .every(4, p => p.rev())     // Reverse every 4th cycle
  .transpose(5);              // Up 5 semitones
```

### Four-Layer Architecture

1. **Tone.js primitives** - Direct access to Tone.js when needed
2. **Musical wrappers** - Thin adapters with musical terminology
3. **Composition abstractions** - Pattern, Voice, Track, Composition
4. **DSL syntax** - User-facing fluent API

## Documentation

Complete documentation is available in the `docs/` folder:

- **[CLAUDE.md](CLAUDE.md)** - Development guide and workflow (project root)
- **[PRODUCT_REQUIREMENTS.md](docs/PRODUCT_REQUIREMENTS.md)** - Vision, goals, user stories
- **[ARCHITECTURE_GUIDE.md](docs/ARCHITECTURE_GUIDE.md)** - Research and lessons learned
- **[TECHNICAL_SPEC.md](docs/TECHNICAL_SPEC.md)** - API contracts and implementation details
- **[QUICK_START.md](docs/QUICK_START.md)** - Step-by-step implementation guide
- **[ARCHITECTURE_DECISIONS.md](docs/ARCHITECTURE_DECISIONS.md)** - Record of major decisions
- **[PHASE_5_SUMMARY.md](docs/PHASE_5_SUMMARY.md)** - Plugin architecture summary

### Getting Started with Development

1. Read [CLAUDE.md](CLAUDE.md) for workflow and coding standards
2. Review [docs/PRODUCT_REQUIREMENTS.md](docs/PRODUCT_REQUIREMENTS.md) for project vision
3. Follow [docs/QUICK_START.md](docs/QUICK_START.md) for implementation steps
4. Reference [docs/TECHNICAL_SPEC.md](docs/TECHNICAL_SPEC.md) for API details

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
- **[Tonal.js](https://github.com/tonaljs/tonal)** - Music theory utilities
- **[Vite](https://vitejs.dev/)** - Build tooling with instant HMR
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety and developer experience
- **[Vitest](https://vitest.dev/)** - Testing framework

## Contributing

This project is currently in active development. See [CLAUDE.md](CLAUDE.md) for development workflow and coding standards.

## Development Status

- ✅ **Phase 1**: Foundation (type system, project structure)
- ✅ **Phase 2**: Pattern system (transformations, immutability)
- ✅ **Phase 3**: Tone.js integration (scheduling, HMR)
- ✅ **Phase 4**: Composition system (Voice, Track, Composition)
- ✅ **Phase 5**: Plugin architecture (audio, MIDI renderers)

### Acceptance Criteria

- ✅ Bach Invention No. 4 implementation (examples/bach-invention-4/)
- ✅ MIDI export functionality
- ✅ Audio playback with hot-reload
- ✅ Type-safe musical primitives
- ✅ Pattern transformations and algebra

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

Make TypeScript sing!
