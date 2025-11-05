# Architecture Decision Records

This document records significant architectural decisions made during Contour development. Each decision includes context, options considered, and rationale.

## Format

Each ADR follows this structure:
- **Date**: When the decision was made
- **Status**: Proposed | Accepted | Superseded | Deprecated
- **Context**: The situation requiring a decision
- **Decision**: What we decided to do
- **Consequences**: Implications of the decision
- **Alternatives Considered**: Other options we evaluated

---

## ADR-001: Use Tone.js as Audio Foundation

**Date**: November 2025  
**Status**: Accepted

### Context
The original Contour implemented a custom multi-voice playback system, which became a maintenance burden and distracted from core composition features. We needed a robust audio engine that handles scheduling, synthesis, and effects without reinventing the wheel.

### Decision
Use Tone.js 14.8+ as the foundational audio library. Build a four-layer architecture on top:
1. Tone.js primitives (unchanged)
2. Musical wrappers (thin adapters with musical terminology)
3. Composition abstractions (Voice, Track, Pattern)
4. DSL syntax (user-facing API)

### Consequences

**Positive:**
- Proven, battle-tested audio scheduling and synthesis
- Active maintenance and community support
- Web Audio API best practices built-in
- Sample-accurate timing without custom implementation
- Rich ecosystem of effects and instruments

**Negative:**
- Dependency on external library (risk of breaking changes)
- Learning curve for developers unfamiliar with Tone.js
- Some limitations in Tone.js may constrain features
- Additional bundle size (~200KB minified)

**Mitigation:**
- Keep abstraction layers clean so Tone.js could theoretically be swapped
- Maintain escape hatch to raw Tone.js for power users
- Contribute upstream to Tone.js if needed features are missing

### Alternatives Considered

1. **Web Audio API directly**
   - Pro: No dependencies, full control
   - Con: Massive implementation burden, timing complexity
   - Rejected: This is what killed original Contour

2. **Howler.js**
   - Pro: Simple API, good for basic audio
   - Con: Not designed for musical scheduling/synthesis
   - Rejected: Insufficient for our needs

3. **AudioWorklet + custom scheduler**
   - Pro: Maximum performance and control
   - Con: Complex implementation, browser support issues
   - Rejected: Premature optimization

---

## ADR-002: Vite for Build Tooling

**Date**: November 2025  
**Status**: Accepted

### Context
Development experience requires instant feedback for musical iteration. Traditional bundlers (webpack) have multi-second startup and reload times. Music composition needs to feel live and interactive.

### Decision
Use Vite for development server and build tooling, with custom HMR plugin for graceful audio reload.

### Consequences

**Positive:**
- Sub-second dev server startup
- <100ms hot module replacement
- Native ESM support (no bundling in dev)
- Simple configuration
- Rich plugin ecosystem (Rollup)

**Negative:**
- Relatively new compared to webpack (less battle-tested)
- Some edge cases in HMR behavior
- Need custom plugin for audio-aware reloading

**Implementation Notes:**
- Custom Vite plugin intercepts music file changes
- Client-side handler fades audio out before accepting update
- Transport position can be maintained across reloads
- Multiple rapid reloads are debounced

### Alternatives Considered

1. **Webpack**
   - Pro: Most mature, huge ecosystem
   - Con: Slow dev startup (5-30s), slow HMR (1-5s)
   - Rejected: Development experience unacceptable for music

2. **esbuild only**
   - Pro: Fastest builds
   - Con: No HMR support, DIY plugin system
   - Rejected: Too much custom infrastructure needed

3. **Rollup only**
   - Pro: Excellent for libraries
   - Con: No dev server, no HMR
   - Rejected: Missing development features

---

## ADR-003: Branded Types for Unit Safety

**Date**: November 2025  
**Status**: Accepted

### Context
Musical code involves many numeric types with different units (Hz, BPM, Seconds, MIDI notes). Without type safety, it's easy to accidentally mix units (e.g., adding Hz to BPM), leading to subtle bugs.

### Decision
Use TypeScript branded types (intersection with unique symbol) to prevent unit mixing at compile time.

```typescript
type Hz = number & { readonly __brand: 'Hz' };
type BPM = number & { readonly __brand: 'BPM' };

const freq = Hz(440);
const tempo = BPM(120);
const invalid = freq + tempo; // ✗ TypeScript error!
```

### Consequences

**Positive:**
- Catch unit mixing errors at compile time
- Self-documenting code (types show intent)
- Zero runtime overhead (types erased)
- IntelliSense shows unit types
- Prevents entire category of bugs

**Negative:**
- Slightly more verbose (need constructor functions)
- Learning curve for developers unfamiliar with pattern
- Type assertions needed occasionally
- Can't use literal numbers directly

**Best Practices:**
- Always use constructor functions (Hz, BPM, etc.)
- Validate ranges in constructors (e.g., MIDI 0-127)
- Provide type-safe arithmetic operations where needed

### Alternatives Considered

1. **Plain numbers with JSDoc comments**
   - Pro: Simple, no learning curve
   - Con: No compile-time safety, easy to ignore comments
   - Rejected: Doesn't prevent bugs

2. **Class wrappers (Hz class, BPM class)**
   - Pro: Strong encapsulation
   - Con: Runtime overhead, more verbose
   - Rejected: Unnecessary complexity for numeric types

3. **Enums for units**
   - Pro: Runtime representation
   - Con: Awkward API, doesn't prevent mixing
   - Rejected: Doesn't solve the problem

---

## ADR-004: Immutable Patterns

**Date**: November 2025  
**Status**: Accepted

### Context
Musical patterns need to be transformed (transpose, retrograde, fast, etc.). Mutable patterns lead to bugs where transformations unexpectedly modify original patterns, especially problematic with hot-reload and live coding.

### Decision
All Pattern instances are immutable. Transformations return new Pattern instances. Use `Object.freeze()` and `ReadonlyArray` to enforce immutability.

```typescript
class Pattern {
  readonly events: ReadonlyArray<Event>;
  
  transpose(semitones: number): Pattern {
    return new Pattern(/* new events */);
  }
}
```

### Consequences

**Positive:**
- Transformations can't accidentally modify originals
- Time-travel debugging possible
- Hot-reload safe (no state corruption)
- Easier to reason about code
- Enables undo/redo trivially

**Negative:**
- More memory usage (new instances for each transform)
- Performance cost for large patterns
- Can't do in-place optimizations
- Requires different mental model than mutable state

**Optimizations:**
- Structural sharing where possible
- Lazy evaluation for chained transforms
- Object pooling for high-frequency events

### Alternatives Considered

1. **Mutable patterns with copy-on-write**
   - Pro: Performance optimization possible
   - Con: Complex implementation, easy to get wrong
   - Rejected: Complexity not worth it

2. **Immutable.js or Immer**
   - Pro: Battle-tested immutability libraries
   - Con: Additional dependencies, learning curve
   - Rejected: Can implement simply with native JS

3. **Persistent data structures**
   - Pro: Optimal memory sharing
   - Con: Complex implementation, library dependency
   - Deferred: Consider if performance becomes issue

---

## ADR-005: Four-Layer Architecture

**Date**: November 2025  
**Status**: Accepted

### Context
Need balance between high-level musical abstraction and low-level control. Systems that hide too much become inflexible; systems that expose too much are hard to use.

### Decision
Implement four distinct layers:
1. **Layer 1**: Tone.js primitives (unchanged, direct access)
2. **Layer 2**: Musical wrappers (thin adapters with musical terminology)
3. **Layer 3**: Composition abstractions (Voice, Track, Pattern)
4. **Layer 4**: DSL syntax (user-facing convenience API)

Users can drop to any layer when they need fine control.

### Consequences

**Positive:**
- Progressive disclosure of complexity
- Beginners use Layer 4, experts use Layer 1-2
- Each layer has clear responsibility
- Layers can be tested independently
- Can optimize or replace layers without affecting others

**Negative:**
- More code to maintain
- Need to keep layers in sync
- Potential for abstraction leaks
- Learning curve to understand all layers

**Guidelines:**
- Layer 4 should never directly import Layer 1 (Tone.js)
- Each layer should be usable independently
- Document which layer each API belongs to
- Provide examples showing how to drop down layers

### Alternatives Considered

1. **Single monolithic abstraction**
   - Pro: Simpler architecture
   - Con: Inflexible, can't access low-level features
   - Rejected: Too constraining

2. **Expose Tone.js directly everywhere**
   - Pro: Maximum flexibility
   - Con: Steep learning curve, inconsistent API
   - Rejected: Too low-level for target audience

3. **Two layers (high/low)**
   - Pro: Simpler than four
   - Con: Not enough granularity
   - Rejected: Doesn't meet our needs

---

## ADR-006: Plugin Architecture for Renderers

**Date**: November 2025  
**Status**: Accepted

### Context
Need to support multiple output formats (audio, MIDI, visualizations) without bloating core library. Want extensibility for future formats.

### Decision
Implement type-safe plugin system with `RendererPlugin<TConfig>` interface. Plugins register with PluginRegistry, declare dependencies, and implement `initialize`, `render`, `shutdown` lifecycle.

### Consequences

**Positive:**
- Core library stays focused
- Third-party renderers possible
- Each renderer can have unique config
- Type-safe plugin configurations
- Dependency resolution automatic

**Negative:**
- More architectural complexity
- Plugin API needs careful design
- Versioning and compatibility concerns
- Potential for dependency conflicts

**Plugin Types:**
- Audio renderers (WAV, MP3, OGG)
- MIDI renderer (Standard MIDI File)
- Visualizers (Canvas, WebGL, video)
- Analysis tools (harmony analysis, etc.)

### Alternatives Considered

1. **Built-in renderers only**
   - Pro: Simpler, no plugin system needed
   - Con: Core library grows, less flexible
   - Rejected: Want extensibility

2. **Untyped plugin system**
   - Pro: Maximum flexibility
   - Con: No type safety, runtime errors
   - Rejected: TypeScript benefits lost

3. **Separate packages, no plugin system**
   - Pro: Complete independence
   - Con: No shared infrastructure, duplication
   - Rejected: Poor developer experience

---

## ADR-007: Test-Driven Development with Multiple Test Types

**Date**: November 2025  
**Status**: Accepted

### Context
Musical code is complex and subtle. Need confidence that transformations are correct, timing is precise, and audio quality is maintained. Different aspects require different testing approaches.

### Decision
Implement multi-level testing strategy:
1. **Unit tests**: Pure functions, music theory
2. **Property-based tests**: Algebraic laws (e.g., `retrograde(retrograde(x)) = x`)
3. **Snapshot tests**: Event structure changes
4. **Golden file tests**: Audio similarity to reference recordings
5. **Integration tests**: Tone.js scheduling behavior

### Consequences

**Positive:**
- High confidence in correctness
- Catch regressions quickly
- Test different aspects appropriately
- Documentation through examples
- Safe refactoring

**Negative:**
- More tests to maintain
- Golden file tests brittle
- Slow test suite if not careful
- Need reference recordings

**Test Coverage Goals:**
- 90%+ code coverage for core packages
- All algebraic properties tested
- Reference compositions as golden files

### Alternatives Considered

1. **Unit tests only**
   - Pro: Simple, fast
   - Con: Insufficient for musical correctness
   - Rejected: Doesn't catch enough bugs

2. **Manual testing only**
   - Pro: No test infrastructure
   - Con: Time-consuming, unreliable
   - Rejected: Unsustainable

3. **Integration tests only**
   - Pro: High-level confidence
   - Con: Slow, hard to debug failures
   - Rejected: Need granular tests too

---

## Future ADRs

As development progresses, document decisions about:
- Microtonal tuning system design
- Mini-notation parser implementation
- MIDI import/export format choices
- Visualization renderer design
- Collaborative editing (if implemented)
- Mobile/browser compatibility trade-offs

---

## Using ADRs

When making a significant architectural decision:
1. Copy the ADR template
2. Fill in all sections thoughtfully
3. Discuss with team/community if applicable
4. Update Status when decision is accepted
5. Reference ADR in code comments where relevant
6. Supersede ADR if decision is later reversed

ADRs are living documents. Update them if circumstances change or new information emerges.
