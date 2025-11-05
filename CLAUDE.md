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
2. **docs/PRODUCT_REQUIREMENTS.md** - Vision, goals, user stories, success criteria
3. **docs/ARCHITECTURE_GUIDE.md** - The comprehensive research document with lessons learned and patterns

### 2. Technical Specifications (Implementation Reference)
4. **docs/TECHNICAL_SPEC.md** - API contracts, type system, architecture layers
5. **docs/QUICK_START.md** - First implementation steps and priorities

### 3. Living Documents (Update as Code Evolves)
- **docs/ARCHITECTURE_DECISIONS.md** - Record major decisions with rationale
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

### Phase 1: Foundation Setup
1. **Project scaffolding** - Vite + TypeScript + pnpm workspace
2. **Type system** - Branded types (Hz, BPM, Seconds), template literal types for notes
3. **Core primitives** - Note, Pattern, Voice classes with immutability

### Phase 2: Pattern System
1. **PatternBuilder** - Fluent API with transformations
2. **Pattern algebra** - fast(), slow(), rev(), every(), transpose()
3. **Mini-notation parser** - Optional concise syntax like "bd*4 [sn sn]"

### Phase 3: Tone.js Integration
1. **Layer 2 wrappers** - Musical terminology over Tone.js primitives
2. **Scheduling system** - Pattern → Tone.Transport events
3. **Hot-reload handling** - Graceful audio fadeout on module updates

### Phase 4: Composition System
1. **Track and Voice** - Multi-voice management
2. **Composition class** - Combine tracks with tempo, time signature
3. **Basic renderer** - Audio playback via Tone.js

### Phase 5: Plugin Architecture
1. **RendererPlugin interface** - Type-safe plugin contracts
2. **MP3/WAV renderer** - Tone.Offline + encoding
3. **MIDI renderer** - Export to Standard MIDI File format

## Code Generation Guidelines

### File Structure
```
contour/
├── packages/
│   ├── core/               # Musical primitives, patterns, composition
│   │   ├── src/
│   │   │   ├── types/      # Type system (branded types, template literals)
│   │   │   ├── primitives/ # Note, Duration, Velocity classes
│   │   │   ├── patterns/   # Pattern, PatternBuilder
│   │   │   ├── composition/# Track, Voice, Composition
│   │   │   └── index.ts
│   │   └── tests/
│   ├── tone-adapter/       # Tone.js integration layer
│   │   ├── src/
│   │   │   ├── wrappers/   # Musical wrappers over Tone.js
│   │   │   ├── scheduling/ # Pattern → Transport scheduling
│   │   │   └── hmr/        # Hot-reload audio handling
│   │   └── tests/
│   ├── plugins/            # Renderer plugins
│   │   ├── audio/          # Audio rendering (Tone.Offline)
│   │   ├── midi/           # MIDI export
│   │   └── visualizer/     # Future: visualizations
│   └── dev/                # Vite dev server with HMR
└── examples/               # Demo compositions
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

#### docs/TECHNICAL_SPEC.md
- **When**: Adding new public APIs, changing interfaces
- **What**: Update API signatures, add examples
- **Verify**: TypeScript interfaces match spec exactly

#### docs/ARCHITECTURE_DECISIONS.md
- **When**: Making significant architectural choices
- **What**: Document decision, alternatives considered, rationale
- **Format**: Use ADR (Architecture Decision Record) template

#### API_CHANGELOG.md
- **When**: Any API change, especially breaking changes
- **What**: Version, date, changes, migration guide
- **Format**: Keep-a-Changelog format

### Document Synchronization Checklist
- [ ] TypeScript interfaces match docs/TECHNICAL_SPEC.md
- [ ] Examples in docs are executable and tested
- [ ] Breaking changes documented in CHANGELOG
- [ ] Architecture decisions recorded with rationale
- [ ] README.md updated with new features

## Success Criteria

### Phase 1 Complete When:
- [ ] Project scaffolding works (Vite + TypeScript + pnpm)
- [ ] Branded types prevent unit mixing at compile time
- [ ] Note class with transpose/enharmonic works
- [ ] 50+ passing tests for core primitives

### Phase 2 Complete When:
- [ ] PatternBuilder supports method chaining
- [ ] Pattern transformations (fast, slow, rev, every) work
- [ ] Immutability enforced (original patterns unchanged)
- [ ] 100+ passing tests including property-based tests

### Phase 3 Complete When:
- [ ] Tone.js scheduling works correctly
- [ ] Hot-reload fades audio gracefully (no clicks/pops)
- [ ] Simple melody plays in browser with Vite dev server
- [ ] Integration tests validate Tone.js interaction

### Phase 4 Complete When:
- [ ] Multi-track composition works
- [ ] Bach Invention No. 4 can be implemented
- [ ] Audio renders correctly without glitches
- [ ] Golden file tests pass for reference composition

### Phase 5 Complete When:
- [ ] Plugin system supports multiple renderers
- [ ] MP3/WAV export works via Tone.Offline
- [ ] MIDI export generates valid Standard MIDI Files
- [ ] At least 3 plugins implemented and tested

## Acceptance Test: Bach Invention No. 4

The primary acceptance criteria is implementing Bach's Invention No. 4 in D Minor (BWV 775). This piece demonstrates:
- Two independent voices (counterpoint)
- Minor key with accidentals (D harmonic minor)
- Scalar passages in both hands
- Proper timing and voice independence

Success = composition renders to audio that is recognizable as Bach Invention No. 4.

## Next Steps for Claude Code

1. **Read docs/PRODUCT_REQUIREMENTS.md** - Understand the vision and user stories
2. **Read docs/ARCHITECTURE_GUIDE.md** - Comprehensive research and lessons learned
3. **Read docs/TECHNICAL_SPEC.md** - API contracts and type system details
4. **Read docs/QUICK_START.md** - Begin Phase 1 implementation
5. **Create initial project structure** following the file layout above
6. **Implement branded types** as the foundation
7. **Build Note class** with tests demonstrating TDD approach
8. **Continue with PatternBuilder** following the technical spec

## Questions or Uncertainties?

When encountering ambiguity:
1. **Check docs/TECHNICAL_SPEC.md** first for API contracts
2. **Reference docs/ARCHITECTURE_GUIDE.md** for patterns and lessons learned
3. **Follow the test-driven approach** - write tests that express the desired behavior
4. **Maintain immutability** - when in doubt, return new instances
5. **Keep layers independent** - don't let Layer 4 directly call Tone.js (Layer 1)

Remember: The goal is a tool for music theory exploration and algorithmic composition, not just another MIDI export tool. Embrace the functional programming patterns that make live coding and generative music possible.
