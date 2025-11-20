# Claude Development Guide for Contour

This document guides AI pair programming for the Contour music composition system. Read this first to understand the project structure, documentation hierarchy, and development workflow.

## Project Vision

Contour is a TypeScript-first music composition framework built on Tone.js that enables:
- **Functional composition** - Build music using composable, immutable patterns
- **Music theory exploration** - Create music impossible on physical instruments (microtonal, complex polyrhythms, algorithmic generation)
- **Developer experience** - Hot-reload, type safety, familiar TypeScript patterns
- **Multiple notation systems** - Support traditional notation, chord symbols, programmatic patterns

## Documentation Hierarchy

Read documents in this order for full context:

### 1. Foundation Documents (Read First)
1. **CLAUDE.md** (this file) - Meta-guide and workflow
2. **docs/ARCHITECTURE_GUIDE.md** - Design patterns, lessons learned, and architectural insights
3. **docs/TUTORIAL.md** - Complete user guide from beginner to advanced topics

### 2. Living Documents (Update as Code Evolves)
- **README.md** - User-facing overview and quick start
- **API_CHANGELOG.md** - Track API changes and breaking updates

## Core Principles

### What We're Building On
- **Tone.js 15.0+** - Audio engine and scheduling (don't reinvent this)
- **Vite** - Build tooling with instant hot-reload
- **TypeScript 5.3+** - Full type safety for musical concepts

### What We're Creating
- **Pattern algebra** - Inspired by TidalCycles/Strudel (fast, slow, rev, every)
- **Hybrid architecture** - Declarative configs + functional composition
- **Four-layer system** - Tone.js primitives → musical wrappers → composition abstractions → DSL syntax
- **Plugin system** - Extensible renderers (MP3, MIDI, visualizers)

### What We're Avoiding
- **Reinventing playback** - This killed the original Contour
- **Scope creep on exports** - MusicXML was a distraction; focus on core composition first
- **Heavy dependencies** - Keep dependencies minimal; implement simple music theory utilities in-house
- **Tight coupling** - Keep layers independent and testable

## Development Workflow

### Phase 1: Foundation Setup ✅ COMPLETE
1. **Project scaffolding** - Vite + TypeScript + pnpm workspace
2. **Type system** - Branded types (Hz, BPM, Seconds, MIDINote, Velocity, Duration, Interval)
3. **Core primitives** - Note, Event classes with immutability

### Phase 2: Pattern System ✅ COMPLETE
1. **PatternBuilder** - Fluent API with transformations
2. **Pattern algebra** - fast(), slow(), retrograde(), every(), transpose()
3. **Pattern inspection** - Metrics, analysis, debugging utilities

### Phase 3: Tone.js Integration ✅ COMPLETE
1. **Layer 2 wrappers** - Musical terminology over Tone.js primitives (MusicalSynth)
2. **Scheduling system** - Pattern → Tone.Transport events (PatternScheduler, CompositionScheduler)
3. **Hot-reload handling** - Graceful audio fadeout on module updates (HMRHandler with 300ms fade)

### Phase 4: Composition System ✅ COMPLETE
1. **Track and Voice** - Multi-voice management with pattern + instrument pairing
2. **Composition class** - Combine tracks with tempo, time signature
3. **Basic renderer** - Audio playback via Tone.js

### Plugin Architecture: Plugin Architecture ✅ COMPLETE
1. **RendererPlugin interface** - Type-safe plugin contracts with dependency validation
2. **Audio renderer** - WAV export via Tone.Offline
3. **MIDI renderer** - Standard MIDI File Format 1 export

### Phase 6: Mini-Notation Parser ✅ COMPLETE
1. **Lexer and parser** - Concise pattern syntax: `"C4 E4 G4*2 [F4 A4]"`
2. **Chord parser** - Support for 20+ chord types: `Cmaj7`, `Dm7`, `Bdim`, `Aaug`, `Dsus4`
3. **Duration modifiers** - Dotted notes, tuplets, rests

### Core Diagnostics: Core Diagnostics ✅ COMPLETE
1. **Logger** - Musical event logging with filtering and formatting
2. **PatternInspector** - Pattern analysis, metrics, ASCII timeline visualization
3. **Validator** - Validation utilities for musical data
4. **TransportDebugger** - Tone.Transport introspection and scheduled events tracking
5. **MusicalError** - Enhanced error handling with codes, context, and suggestions

### Interactive Development UI: Interactive Development UI ✅ COMPLETE
1. **DebugPanel** - Multi-tab development panel (Cmd/Ctrl+D)
   - Transport Inspector - Real-time transport state, scheduled events
   - Pattern Inspector - Visual pattern timeline with note visualization
   - Performance Monitor - FPS, CPU, memory metrics with 60s history graphs
   - Console Log - Intercepted console with filtering
2. **PatternPlayground** - Monaco-based TypeScript pattern editor (Cmd/Ctrl+K)
3. **KeyboardShortcuts** - Help overlay (? key) with all development shortcuts
4. **Performance Grid** - 4×4 interactive pattern grid with 16 musical presets

## Code Generation Guidelines

### File Structure
```
contour/
├── packages/
│   ├── core/               # Musical primitives, patterns, composition (ZERO dependencies)
│   │   ├── src/
│   │   │   ├── types/      # Type system (branded types, template literals)
│   │   │   │   ├── brands.ts  # Hz, BPM, Seconds, MIDINote, Velocity, Duration, Interval
│   │   │   │   └── music.ts   # NoteName, Durations, Intervals
│   │   │   ├── primitives/ # Note, Event classes
│   │   │   ├── patterns/   # Pattern, PatternBuilder, MiniNotation, chordParser
│   │   │   ├── composition/# Track, Voice, Composition
│   │   │   ├── plugins/    # RendererPlugin interface, PluginRegistry
│   │   │   ├── debug/      # Logger, PatternInspector, Validator (Core Diagnostics)
│   │   │   ├── errors/     # MusicalError with error codes and context
│   │   │   └── index.ts
│   │   └── tests/          # 17 test files, 308+ passing tests
│   ├── tone-adapter/       # Tone.js integration layer
│   │   ├── src/
│   │   │   ├── wrappers/   # MusicalSynth
│   │   │   ├── scheduling/ # PatternScheduler, CompositionScheduler
│   │   │   ├── hmr/        # HMRHandler (300ms graceful fadeout)
│   │   │   └── debug/      # TransportDebugger (Core Diagnostics)
│   │   └── tests/
│   ├── plugins/            # Renderer plugins (separate packages)
│   │   ├── audio/          # @contour/plugin-audio - WAV export
│   │   │   ├── src/AudioRenderer.ts
│   │   │   └── tests/
│   │   └── midi/           # @contour/plugin-midi - MIDI File Format 1
│   │       ├── src/MIDIRenderer.ts
│   │       └── tests/
│   └── playground/         # @contour/playground - Interactive playground with debug tools
│       ├── src/
│       │   ├── main.ts         # Main dev entry point
│       │   ├── performance.ts  # 4×4 interactive pattern grid
│       │   ├── patterns/
│       │   │   └── presets.ts  # 16 musical presets
│       │   └── ui/             # Interactive development UI (Interactive Dev UI)
│       │       ├── DebugPanel.ts           # Multi-tab debug panel (Cmd/Ctrl+D)
│       │       ├── PatternInspector.ts     # Visual pattern timeline
│       │       ├── TransportInspector.ts   # Real-time transport state
│       │       ├── PerformanceMonitor.ts   # FPS, CPU, memory graphs
│       │       ├── ConsoleLog.ts           # Console interceptor
│       │       ├── KeyboardShortcuts.ts    # Help overlay (? key)
│       │       └── PatternPlayground.ts    # Monaco editor (Cmd/Ctrl+K)
│       ├── index.html          # Simple playback demo
│       ├── performance.html    # Interactive grid with 16 presets
│       └── vite.config.ts      # Custom musicHMRPlugin
├── examples/               # Demo compositions
│   ├── bach-invention-4/   # Primary acceptance test (Bach BWV 775)
│   └── live-coding-demo/   # Live coding demonstration
└── docs/                   # User documentation
    ├── ARCHITECTURE_GUIDE.md
    └── TUTORIAL.md
```

### TypeScript Patterns

#### Branded Types (Always Use These)
```typescript
// In packages/core/src/types/brands.ts
type Hz = number & { __brand: 'Hz' };
type BPM = number & { __brand: 'BPM' };
type Seconds = number & { __brand: 'Seconds' };
type MIDINote = number & { __brand: 'MIDINote' };

// Constructor functions
export const Hz = (value: number): Hz => value as Hz;
export const BPM = (value: number): BPM => value as BPM;
```

#### Template Literal Types for Musical Values
```typescript
// In packages/core/src/types/music.ts
type NoteLetter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';
type Accidental = '' | '#' | 'b';
type Octave = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';
type NoteName = `${NoteLetter}${Accidental}${Octave}`;

// Usage: TypeScript validates at compile time
const note: NoteName = 'C#4'; // ✓ Valid
const bad: NoteName = 'H5';   // ✗ Type error
```

#### Immutable Patterns (Critical for Hot-Reload)
```typescript
class Pattern {
  // Always return new instances
  transpose(semitones: number): Pattern {
    return new Pattern(
      this.events.map(e => ({ ...e, pitch: e.pitch + semitones }))
    );
  }
  
  // Never mutate existing state
  // This enables time-travel debugging and hot-reload
}
```

### Testing Requirements

#### Unit Tests (Jest/Vitest)
```typescript
// Test pure functions and transformations
describe('Pattern.transpose', () => {
  it('shifts all notes by semitones', () => {
    const pattern = new Pattern([note('C4'), note('E4')]);
    const transposed = pattern.transpose(2);
    
    expect(transposed.events[0].pitch).toBe(note('D4').pitch);
    expect(pattern.events[0].pitch).toBe(note('C4').pitch); // Original unchanged
  });
});
```

#### Property-Based Tests (fast-check)
```typescript
// Test algebraic properties
import fc from 'fast-check';

it('retrograde twice returns original', () => {
  fc.assert(
    fc.property(fc.array(fc.integer()), notes => {
      const pattern = new Pattern(notes);
      const doubled = pattern.retrograde().retrograde();
      expect(doubled).toEqual(pattern);
    })
  );
});
```

#### Golden File Tests (For Audio)
```typescript
// Compare rendered audio against reference
it('renders Bach Invention correctly', async () => {
  const composition = bachInvention4();
  const buffer = await render(composition);
  const reference = await loadReference('bach-invention-4.wav');
  
  expect(audioSimilarity(buffer, reference)).toBeGreaterThan(0.999);
});
```

### API Design Patterns

#### Fluent Interfaces (Method Chaining)
```typescript
// All builder methods return 'this' for chaining
class PatternBuilder {
  notes(notes: NoteName[]): this {
    this._notes.push(...notes);
    return this;
  }
  
  transpose(semitones: number): this {
    this._transpose = semitones;
    return this;
  }
  
  build(): Pattern {
    return new Pattern(/* ... */);
  }
}

// Usage
const pattern = new PatternBuilder()
  .notes(['C4', 'E4', 'G4'])
  .transpose(2)
  .build();
```

#### Hybrid Declarative-Functional
```typescript
// Declarative: JSON-serializable configs
interface InstrumentConfig {
  type: 'synth' | 'sampler';
  envelope: { attack: number; release: number };
  effects: EffectConfig[];
}

// Functional: Composable transformations
const melody = pattern(['C4', 'E4', 'G4'])
  .pipe(transpose(2))
  .pipe(retrograde())
  .pipe(fast(2));
```

### Four-Layer Architecture

#### Layer 1: Tone.js Primitives (Untouched)
```typescript
// Direct Tone.js - users can drop down to this
import * as Tone from 'tone';

const synth = new Tone.Synth().toDestination();
synth.triggerAttackRelease('C4', '8n');
```

#### Layer 2: Musical Wrappers
```typescript
// Thin adapters with musical terminology
class MusicalSynth {
  constructor(private synth: Tone.Synth) {}
  
  playNote(note: NoteName, duration: Duration) {
    this.synth.triggerAttackRelease(note, duration);
  }
  
  transpose(semitones: number) {
    // Handle transposition musically
  }
}
```

#### Layer 3: Composition Abstractions
```typescript
// High-level musical concepts
class Voice {
  constructor(public pattern: Pattern, public instrument: MusicalSynth) {}
  
  schedule(transport: Tone.Transport) {
    // Convert pattern to Tone.js events
  }
}

class Track {
  constructor(public voices: Voice[]) {}
}
```

#### Layer 4: DSL Syntax
```typescript
// User-facing API
export const track = (name: string) => new TrackBuilder(name);
export const sequence = (...patterns: Pattern[]) => new Sequence(patterns);
export const parallel = (...patterns: Pattern[]) => new Parallel(patterns);

// Usage
const song = composition('My Song')
  .addTrack(track('melody').pattern(/* ... */))
  .addTrack(track('harmony').pattern(/* ... */))
  .build();
```

## Common Pitfalls to Avoid

### 1. Audio Timing
❌ **Never use setTimeout/setInterval for scheduling**
```typescript
// WRONG: JavaScript timing is imprecise
setTimeout(() => playNote('C4'), 1000);
```

✅ **Always use Tone.Transport**
```typescript
// CORRECT: AudioContext time is sample-accurate
Tone.Transport.schedule((time) => {
  synth.triggerAttackRelease('C4', '8n', time);
}, '0:0:0');
```

### 2. Memory Leaks
❌ **Don't create AudioNodes without disposal**
```typescript
// WRONG: Leaks memory
for (let i = 0; i < 100; i++) {
  const synth = new Tone.Synth();
  synth.triggerAttackRelease('C4', '8n');
}
```

✅ **Always dispose of AudioNodes**
```typescript
// CORRECT: Proper cleanup
const synth = new Tone.Synth().toDestination();
synth.triggerAttackRelease('C4', '8n');
synth.dispose(); // Release resources
```

### 3. Type Safety Violations
❌ **Don't mix units**
```typescript
// WRONG: What units are these?
function setTempo(value: number) { /* ... */ }
setTempo(440); // Hz? BPM? Seconds?
```

✅ **Use branded types**
```typescript
// CORRECT: Type-safe units
function setTempo(bpm: BPM) { /* ... */ }
setTempo(BPM(120)); // ✓
setTempo(Hz(440));  // ✗ Type error!
```

### 4. Hot-Reload Audio Glitches
❌ **Don't stop audio abruptly**
```typescript
// WRONG: Creates clicks and pops
Tone.Transport.stop();
// ... reload module
```

✅ **Fade out gracefully**
```typescript
// CORRECT: Smooth transition
const master = Tone.getDestination();
master.volume.rampTo(-60, 0.3); // Fade out 300ms
setTimeout(() => {
  Tone.Transport.stop();
  // ... reload module
}, 300);
```

## Plugin Development

### RendererPlugin Interface
```typescript
interface RendererPlugin<TConfig = unknown> {
  name: string;
  version: string;
  dependencies?: string[]; // Other plugin names
  
  initialize(config: TConfig): Promise<void>;
  render(composition: Composition): Promise<RenderResult>;
  shutdown(): Promise<void>;
}

interface RenderResult {
  data: Buffer | Blob;
  format: string;
  metadata: Record<string, unknown>;
}
```

### Plugin Registry
```typescript
class PluginRegistry {
  register<T>(plugin: RendererPlugin<T>) {
    // Validate dependencies
    // Check version compatibility
    // Add to registry
  }
  
  getPlugin(name: string): RendererPlugin {
    // Resolve with dependency order
  }
}
```

## Documentation Maintenance

### When to Update Documents

#### README.md
- **When**: Adding major new features or changing Quick Start
- **What**: Update features list, examples, installation instructions
- **Verify**: All examples are executable and tested

#### docs/TUTORIAL.md
- **When**: Adding new capabilities that users should learn
- **What**: Add sections, update examples, maintain progression from beginner to advanced
- **Verify**: Tutorial examples work with current API

#### docs/ARCHITECTURE_GUIDE.md
- **When**: Making significant architectural changes or learning important lessons
- **What**: Document patterns, trade-offs, and insights for future development
- **Format**: Focus on "why" over "what"

#### API_CHANGELOG.md
- **When**: Any API change, especially breaking changes
- **What**: Version, date, changes, migration guide
- **Format**: Keep-a-Changelog format

### Document Synchronization Checklist
- [ ] Examples in docs are executable and tested
- [ ] Breaking changes documented in CHANGELOG
- [ ] README.md updated with new features
- [ ] TUTORIAL.md updated if user-facing capabilities changed
- [ ] ARCHITECTURE_GUIDE.md updated if significant patterns emerged

## Success Criteria

### Phase 1 Complete ✅
- [x] Project scaffolding works (Vite + TypeScript + pnpm)
- [x] Branded types prevent unit mixing at compile time
- [x] Note class with transpose/enharmonic works
- [x] 50+ passing tests for core primitives (308+ tests pass)

### Phase 2 Complete ✅
- [x] PatternBuilder supports method chaining
- [x] Pattern transformations (fast, slow, retrograde, every) work
- [x] Immutability enforced (original patterns unchanged)
- [x] 100+ passing tests including property-based tests

### Phase 3 Complete ✅
- [x] Tone.js scheduling works correctly
- [x] Hot-reload fades audio gracefully (no clicks/pops, 300ms fade)
- [x] Simple melody plays in browser with Vite dev server
- [x] Integration tests validate Tone.js interaction

### Phase 4 Complete ✅
- [x] Multi-track composition works
- [x] Bach Invention No. 4 can be implemented
- [x] Audio renders correctly without glitches
- [x] Bach Invention acceptance tests pass (27 tests)

### Plugin Architecture Complete ✅
- [x] Plugin system supports multiple renderers
- [x] WAV export works via Tone.Offline
- [x] MIDI export generates valid Standard MIDI Files (Format 1)
- [x] 2 plugins implemented and tested (Audio + MIDI renderers)

### Phase 6 Complete ✅ (Mini-Notation)
- [x] Lexer and parser for concise pattern syntax
- [x] Support for notes, chords, rests, repetition, duration modifiers
- [x] Chord parser supports 20+ chord types (maj7, m7, dim, aug, sus2/4, etc.)
- [x] Mini-notation integration with Pattern system

### Core Diagnostics Complete ✅ (Core Diagnostics)
- [x] Logger with musical event tracking
- [x] PatternInspector with metrics and ASCII visualization
- [x] Validator utilities for musical data
- [x] TransportDebugger for Tone.Transport introspection
- [x] MusicalError with error codes and contextual suggestions

### Interactive Development UI Complete ✅ (Interactive Development UI)
- [x] Multi-tab DebugPanel with Transport, Pattern, Performance, Console tabs
- [x] Pattern Playground with Monaco TypeScript editor
- [x] Keyboard shortcuts system with help overlay
- [x] Real-time performance monitoring (FPS, CPU, memory, audio nodes)
- [x] Interactive pattern grid with 16 musical presets
- [x] Visual pattern timeline with note visualization

### Phase 12A Complete ✅ (Sample Library Integration - Phase 1)
- [x] TypeScript type definitions (GMInstrument enum, SoundfontLibrary enum, typed interfaces)
- [x] MusicalSampler Tone.js wrapper for soundfont-player integration
- [x] CompositionScheduler integration with qualified instrument names ('Library:Instrument')
- [x] Automatic instrument loading via SampleLibraryManager
- [x] Support for mixing sampled instruments and Tone.js synths
- [x] Full Tone.js effects chain compatibility (reverb, delay, filters)
- [x] Demo example with simple melody and chord progression
- [x] Comprehensive usage documentation

## Acceptance Test: Bach Invention No. 4

The primary acceptance criteria is implementing Bach's Invention No. 4 in D Minor (BWV 775). This piece demonstrates:
- Two independent voices (counterpoint)
- Minor key with accidentals (D harmonic minor)
- Scalar passages in both hands
- Proper timing and voice independence

Success = composition renders to audio that is recognizable as Bach Invention No. 4.

**Status**: ✅ PASSING - Bach Invention No. 4 is fully implemented with 27 passing tests.

## Development Tools and Workflow

### Interactive Development Environment

The `@contour/playground` package provides a rich interactive development environment with multiple tools:

#### 1. Simple Playback Demo (`index.html`)
- Run: `pnpm dev` (opens http://localhost:3000)
- Basic pattern playback with start/stop controls
- Demonstrates core Pattern and Composition APIs

#### 2. Interactive Pattern Grid (`performance.html`)
- Run: `pnpm dev` and navigate to `/performance.html`
- 4×4 grid of 16 musical presets (scales, arpeggios, rhythms)
- Click cells to trigger patterns, multiple simultaneous patterns
- Real-time audio with visual feedback
- Demonstrates live coding capabilities

### Keyboard Shortcuts (Dev Server)

Press `?` to show/hide the keyboard shortcuts help overlay.

**Debug & Development**:
- `Cmd/Ctrl + D` - Toggle Debug Panel (4 tabs: Transport, Pattern, Performance, Console)
- `Cmd/Ctrl + K` - Open Pattern Playground (Monaco TypeScript editor)
- `?` - Show keyboard shortcuts help

**Playback Control**:
- `Space` - Play/Pause transport
- `R` - Restart transport from beginning
- `S` - Stop and reset transport

**Debug Panel Tabs**:
- **Transport Inspector**: Real-time transport state (BPM, position, state), scheduled events timeline
- **Pattern Inspector**: Select patterns to visualize, ASCII timeline with note visualization, pattern metrics
- **Performance Monitor**: FPS, CPU usage, memory usage, audio node count, 60-second history graphs with color-coded thresholds
- **Console Log**: Intercepted console output with filtering and formatting

### Pattern Playground

The Pattern Playground (`Cmd/Ctrl + K`) provides a Monaco-based TypeScript editor for live pattern editing:

```typescript
// Example: Create and preview a pattern
import { PatternBuilder, Note } from '@contour/core';

const pattern = new PatternBuilder()
  .addNote(Note.fromName('C4'), 0.25)
  .addNote(Note.fromName('E4'), 0.25)
  .addNote(Note.fromName('G4'), 0.25)
  .addRest(0.25)
  .build();

// Pattern will be visualized in the inspector
```

**Features**:
- Full TypeScript syntax highlighting and IntelliSense
- Live pattern preview and visualization
- Error display with line numbers
- Automatic pattern analysis and metrics

### Debugging Utilities (Programmatic)

When writing code, you can use the diagnostic tools from Phase 8A:

```typescript
import { Logger, PatternInspector, Validator } from '@contour/core';
import { TransportDebugger } from '@contour/tone-adapter';

// Log musical events
Logger.logNoteEvent({ pitch: 60, time: 0, duration: 0.25, velocity: 80 });

// Analyze patterns
const metrics = PatternInspector.analyzePattern(pattern);
console.log(`Pattern has ${metrics.noteCount} notes over ${metrics.duration} beats`);

// Visualize pattern as ASCII timeline
console.log(PatternInspector.visualizePattern(pattern));

// Debug Tone.Transport
const state = TransportDebugger.getTransportState();
console.log(`Transport at ${state.position}, BPM: ${state.bpm}`);
```

### Error Handling

Use `MusicalError` for enhanced error messages with context:

```typescript
import { MusicalError } from '@contour/core';

throw new MusicalError(
  'INVALID_NOTE_NAME',
  'Invalid note name: H5',
  {
    input: 'H5',
    validRange: 'C0-B8',
    suggestion: 'Use note names like C4, F#3, Bb5'
  }
);
```

### Performance Monitoring

The Performance Monitor tracks:
- **FPS**: Target 60fps, yellow <50fps, red <30fps
- **CPU**: Yellow >50%, red >80%
- **Memory**: Tracks heap usage trends
- **Audio Nodes**: Number of active Tone.js audio nodes

All metrics include 60-second history graphs with color-coded thresholds.

## Project Status

**Current State**: Contour 2.0 is substantially complete with all core features implemented:

- ✅ **Phases 1-6 Complete** - Foundation through mini-notation parser
- ✅ **Phase 8A & 8B Complete** - Diagnostics and interactive development UI
- ✅ **308+ Passing Tests** - Comprehensive test coverage across all packages
- ✅ **Bach Invention No. 4** - Primary acceptance test fully implemented and passing
- ✅ **Zero Dependencies** - Core package has no external dependencies
- ✅ **Plugin System** - Audio and MIDI renderers working
- ✅ **Interactive Dev Tools** - Debug panel, pattern playground, performance monitoring

### Current Focus Areas

When working on Contour, focus on:

1. **Enhancing existing features** - Improve performance, add more pattern transformations
2. **Adding examples** - Create more musical examples and compositions
3. **Documentation** - Keep docs synchronized with code
4. **Testing** - Maintain high test coverage for new features
5. **Bug fixes** - Address any issues found during use

### Future Phases (Not Yet Implemented)

- **Phase 7**: Advanced music theory utilities (scales, modes, chord progressions)
- **Phase 9**: Performance optimizations and caching
- **Phase 10**: Additional plugins (visualizers, notation export)
- **Phase 11**: Advanced live coding features (pattern morphing, probabilistic patterns)
- **Phase 12B**: Sample library enhancements (Phase 2+)
  - Load .sf2 SoundFont files from local paths (not just CDN)
  - Velocity layers and articulations
  - Custom sample pack support
  - Advanced: .sf2 parser for offline use (currently uses CDN-hosted pre-rendered samples)

## Quick Start for AI Assistants

### First Time Working with Contour?

1. **Read CLAUDE.md** (this file) - Overview and conventions
2. **Read docs/ARCHITECTURE_GUIDE.md** - Deep dive into design decisions
3. **Read docs/TUTORIAL.md** - User-facing guide and examples
4. **Run tests**: `pnpm test` - Verify everything works
5. **Start dev server**: `pnpm dev` - See the interactive tools

### Working on a Feature?

1. **Check existing code** - Look at similar features first
2. **Write tests first** - Follow TDD approach
3. **Maintain immutability** - All transformations return new instances
4. **Use branded types** - Prevent unit mixing (Hz, BPM, Seconds, etc.)
5. **Update docs** - Keep TECHNICAL_SPEC.md and CHANGELOG in sync

### Debugging?

1. **Use the Debug Panel** - `Cmd/Ctrl + D` in dev server
2. **Check Pattern Inspector** - Visualize pattern timelines
3. **Monitor Performance** - FPS, CPU, memory tracking
4. **Use diagnostic tools** - Logger, PatternInspector, TransportDebugger

## Questions or Uncertainties?

When encountering ambiguity:
1. **Check the TypeScript types** - They are the source of truth for API contracts
2. **Reference docs/ARCHITECTURE_GUIDE.md** for patterns and lessons learned
3. **Check docs/TUTORIAL.md** for user-facing examples and usage patterns
4. **Follow the test-driven approach** - write tests that express the desired behavior
5. **Maintain immutability** - when in doubt, return new instances
6. **Keep layers independent** - don't let Layer 4 directly call Tone.js (Layer 1)

Remember: The goal is a tool for music theory exploration and algorithmic composition, not just another MIDI export tool. Embrace the functional programming patterns that make live coding and generative music possible.
