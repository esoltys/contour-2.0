# AI Assistant Instructions for Contour 2.0

> **Primary Reference**: See [CLAUDE.md](../CLAUDE.md) for comprehensive development guidelines

This repository contains Contour 2.0, a TypeScript-first music composition framework built on Tone.js. Before contributing, please read the main development guide.

## Quick Reference

### Essential Reading (in order)
1. **[CLAUDE.md](../CLAUDE.md)** - Complete development guide with architecture, patterns, and workflows
2. **[docs/ARCHITECTURE_GUIDE.md](../docs/ARCHITECTURE_GUIDE.md)** - Deep dive into design decisions and lessons learned
3. **[docs/TECHNICAL_SPEC.md](../docs/TECHNICAL_SPEC.md)** - API contracts, type system specifications

### Project Structure
- **`packages/core/`** - Core musical primitives (ZERO dependencies)
- **`packages/tone-adapter/`** - Tone.js integration layer
- **`packages/plugins/`** - Audio and MIDI renderer plugins
- **`packages/playground/`** - Interactive development environment with debug tools
- **`examples/`** - Example compositions including Bach Invention No. 4
- **`docs/`** - Comprehensive documentation

### Key Conventions

#### 1. Type Safety (ALWAYS Follow)
```typescript
// ✅ CORRECT: Use branded types to prevent unit mixing
import { Hz, BPM, Seconds, MIDINote } from '@contour/core';

function setTempo(bpm: BPM) { /* ... */ }
setTempo(BPM(120)); // ✓ Valid
setTempo(440);      // ✗ Type error!

// ✅ CORRECT: Template literal types for note names
type NoteName = `${NoteLetter}${Accidental}${Octave}`;
const note: NoteName = 'C#4'; // ✓ Valid
const bad: NoteName = 'H5';   // ✗ Type error
```

#### 2. Immutability (CRITICAL for Hot-Reload)
```typescript
// ✅ CORRECT: Always return new instances
class Pattern {
  transpose(semitones: number): Pattern {
    return new Pattern(
      this.events.map(e => ({ ...e, pitch: e.pitch + semitones }))
    );
  }
}

// ❌ WRONG: Never mutate existing state
class Pattern {
  transpose(semitones: number): void {
    this.events.forEach(e => e.pitch += semitones); // DON'T DO THIS
  }
}
```

#### 3. Audio Timing (NEVER Use JavaScript Timers)
```typescript
// ✅ CORRECT: Use Tone.Transport for sample-accurate timing
Tone.Transport.schedule((time) => {
  synth.triggerAttackRelease('C4', '8n', time);
}, '0:0:0');

// ❌ WRONG: JavaScript timing is imprecise
setTimeout(() => playNote('C4'), 1000);
```

#### 4. Memory Management
```typescript
// ✅ CORRECT: Always dispose of AudioNodes
const synth = new Tone.Synth().toDestination();
synth.triggerAttackRelease('C4', '8n');
synth.dispose(); // Release resources

// ❌ WRONG: Creates memory leaks
for (let i = 0; i < 100; i++) {
  new Tone.Synth().triggerAttackRelease('C4', '8n');
}
```

### Four-Layer Architecture

**IMPORTANT**: Keep layers independent. Don't let high-level code (Layer 4) directly access low-level primitives (Layer 1).

1. **Layer 1**: Tone.js primitives (direct Tone.js API)
2. **Layer 2**: Musical wrappers (`MusicalSynth`, `PatternScheduler`)
3. **Layer 3**: Composition abstractions (`Pattern`, `Track`, `Composition`)
4. **Layer 4**: DSL syntax (`PatternBuilder` fluent API, mini-notation)

### Development Workflow

#### Running Tests
```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm test --filter @contour/core
```

#### Starting Dev Server
```bash
# Start interactive dev environment
pnpm dev

# Opens http://localhost:3000
# Navigate to /performance.html for interactive pattern grid
```

#### Development Shortcuts (in browser)
- **`Cmd/Ctrl + D`** - Toggle Debug Panel (Transport, Pattern, Performance, Console tabs)
- **`Cmd/Ctrl + K`** - Open Pattern Playground (Monaco TypeScript editor)
- **`?`** - Show keyboard shortcuts help
- **`Space`** - Play/Pause
- **`R`** - Restart from beginning
- **`S`** - Stop and reset

### Diagnostic Tools

```typescript
// Logger - Musical event logging
import { Logger } from '@contour/core';
Logger.logNoteEvent({ pitch: 60, time: 0, duration: 0.25, velocity: 80 });

// PatternInspector - Analyze and visualize patterns
import { PatternInspector } from '@contour/core';
const metrics = PatternInspector.analyzePattern(pattern);
console.log(PatternInspector.visualizePattern(pattern)); // ASCII timeline

// TransportDebugger - Tone.Transport introspection
import { TransportDebugger } from '@contour/tone-adapter';
const state = TransportDebugger.getTransportState();

// MusicalError - Enhanced error handling
import { MusicalError } from '@contour/core';
throw new MusicalError('INVALID_NOTE_NAME', 'Invalid note: H5', {
  input: 'H5',
  suggestion: 'Use C4, F#3, Bb5, etc.'
});
```

### Testing Patterns

#### Unit Tests (Vitest)
```typescript
describe('Pattern.transpose', () => {
  it('returns new instance without mutating original', () => {
    const pattern = new Pattern([note('C4'), note('E4')]);
    const transposed = pattern.transpose(2);

    expect(transposed.events[0].pitch).toBe(note('D4').pitch);
    expect(pattern.events[0].pitch).toBe(note('C4').pitch); // Original unchanged
  });
});
```

#### Property-Based Tests (fast-check)
```typescript
import fc from 'fast-check';

it('retrograde twice returns original', () => {
  fc.assert(
    fc.property(fc.array(fc.integer()), notes => {
      const pattern = new Pattern(notes);
      expect(pattern.retrograde().retrograde()).toEqual(pattern);
    })
  );
});
```

### Common Pitfalls to Avoid

❌ **Don't**: Mix units without branded types
❌ **Don't**: Mutate existing state (breaks hot-reload)
❌ **Don't**: Use `setTimeout`/`setInterval` for audio scheduling
❌ **Don't**: Create AudioNodes without disposal
❌ **Don't**: Stop audio abruptly (use 300ms fade)
❌ **Don't**: Skip tests for new features
❌ **Don't**: Reinvent audio playback (use Tone.js)

✅ **Do**: Use branded types (Hz, BPM, Seconds, etc.)
✅ **Do**: Return new instances for all transformations
✅ **Do**: Use Tone.Transport for all scheduling
✅ **Do**: Dispose of AudioNodes properly
✅ **Do**: Fade audio gracefully on hot-reload
✅ **Do**: Write tests first (TDD approach)
✅ **Do**: Leverage Tone.js for audio primitives

### Project Status

**Current State**: Substantially complete
- ✅ All core phases implemented (1-6, 8A, 8B)
- ✅ 308+ passing tests
- ✅ Bach Invention No. 4 acceptance test passing
- ✅ Plugin system with Audio and MIDI renderers
- ✅ Interactive development tools with debug panel

**Focus Areas**:
1. Enhancing existing features
2. Adding more musical examples
3. Performance optimizations
4. Advanced pattern transformations
5. Additional plugins (visualizers, notation)

### Documentation Updates

When making changes, update:
- **docs/TECHNICAL_SPEC.md** - For API changes
- **docs/ARCHITECTURE_DECISIONS.md** - For architectural decisions
- **API_CHANGELOG.md** - For any breaking changes
- **README.md** - For user-facing features

### Getting Help

- **Questions about architecture?** → See [docs/ARCHITECTURE_GUIDE.md](../docs/ARCHITECTURE_GUIDE.md)
- **Questions about APIs?** → See [docs/TECHNICAL_SPEC.md](../docs/TECHNICAL_SPEC.md)
- **Questions about workflow?** → See [CLAUDE.md](../CLAUDE.md)
- **Unsure about approach?** → Check existing code for similar patterns

## Summary

This is a **music composition framework** for TypeScript developers who want to:
- Explore music theory computationally
- Create algorithmic/generative music
- Build compositions with type safety
- Live code musical patterns

**Remember**: The goal is music theory exploration and functional composition, not just MIDI export. Embrace immutability, type safety, and functional programming patterns that make live coding possible.

---

**For complete details, conventions, and examples, always refer to [CLAUDE.md](../CLAUDE.md)**
