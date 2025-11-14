# Contour 2.0

**A TypeScript-first music composition framework for algorithmic and generative music**

Contour enables developers to compose music using functional patterns, explore advanced music theory concepts, and create compositions impossible on physical instruments.

## Features

- **Functional Composition** - Build music using composable, immutable patterns inspired by TidalCycles
- **Mini-Notation** - Concise, expressive syntax for rapid pattern creation
- **Live Coding** - Perfect for performances with hot-reload and instant feedback
- **Euclidean Rhythms** - Generate algorithmically interesting patterns using Bjorklund's algorithm
- **Music Theory Exploration** - Create microtonal music, complex polyrhythms, and algorithmic compositions
- **Type Safety** - Branded types prevent unit mixing (Hz vs BPM) at compile time
- **Hot Module Reload** - Instant feedback with graceful audio transitions
- **Interactive Debug Tools** - Real-time transport inspector, pattern analyzer, and performance monitor
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
cd ../../packages/dev
pnpm dev
# Then open http://localhost:3000
```

#### Interactive Performance Grid

Explore live pattern performance with the interactive grid interface:

```bash
cd packages/dev
pnpm dev
# Open http://localhost:3000/performance.html
```

This demo showcases:
- 4x4 grid of triggerable pattern pads with real-time audio
- Live pattern editing with Monaco Editor
- 16 preset patterns (drums, bass, melody, effects)
- Global transport controls (play/pause, tempo, volume)
- Pattern algebra and mini-notation in action
- Keyboard shortcuts for hands-free performance

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
- **1-4, Q-R, A-F, Z-V** - Trigger pattern pads (in performance grid)
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
│   ├── core/           # Musical primitives, patterns, composition system
│   ├── tone-adapter/   # Tone.js integration layer
│   ├── plugins/        # Renderer plugins (audio, MIDI)
│   └── dev/            # Vite dev server with HMR and performance grid
├── examples/
│   ├── bach-invention-4/  # Bach Invention No. 4 example
│   ├── live-coding-demo/  # Console-based pattern demo
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

// Euclidean rhythms for algorithmic composition
const rhythm = Pattern.euclidean(16, 5);  // 5 pulses in 16 steps
const shifted = Pattern.euclidean(8, 3, 2);  // With rotation

// Combine with transformations
const generative = Pattern.euclidean(16, 11)
  .transpose(60)  // MIDI note C4
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
