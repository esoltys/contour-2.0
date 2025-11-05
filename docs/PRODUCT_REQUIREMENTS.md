# Contour: Product Requirements Document

**Version:** 2.0 (Complete Reboot)  
**Date:** November 2025  
**Status:** Planning Phase

## Executive Summary

Contour is a TypeScript-first music composition framework that enables developers and music theory enthusiasts to create music that transcends the limitations of physical instruments. Built on Tone.js, it provides functional composition patterns, algorithmic generation capabilities, and support for multiple musical notation systems. The goal is to make music composition feel like software development—composable, testable, and version-controlled—while enabling musical explorations impossible in traditional DAWs.

## Vision Statement

**"Make TypeScript the language of algorithmic and experimental music composition."**

Contour empowers developers to compose music using familiar programming patterns while enabling music theorists to explore microtonal systems, complex polyrhythms, and generative algorithms that physical instruments cannot produce. It's not just sheet music in code—it's a laboratory for musical experimentation.

## Target Audience

### Primary Users

#### 1. Developer-Musicians
**Profile:** Software developers who want to compose music using familiar tools and workflows
- Comfortable with TypeScript, Git, and hot-reload development
- May or may not have formal music training
- Want type safety and IntelliSense for musical concepts
- Appreciate functional composition patterns

**Needs:**
- Familiar development environment (VS Code, terminal, Git)
- Clear error messages at compile time
- Instant feedback via hot-reload
- Ability to version control musical ideas

#### 2. Music Theory Nerds
**Profile:** Musicians and theorists interested in algorithmic composition and computer-only music
- Deep music theory knowledge
- Interested in exploring microtonal tunings, complex time signatures, serialism
- Want to generate music impossible on physical instruments
- Curious about pattern transformations and generative algorithms

**Needs:**
- Access to non-12-TET tuning systems
- Ability to create irrational time signatures and polyrhythms
- Pattern algebra for musical transformations
- Generative and algorithmic composition tools

#### 3. Live Coders
**Profile:** Performers who create music in real-time by writing and modifying code
- Need instant feedback and hot-reload
- Want concise notation for rapid iteration
- Appreciate pattern-based composition (like TidalCycles)
- Perform in Algorave and live coding events

**Needs:**
- Sub-100ms hot-reload without audio glitches
- Concise mini-notation for rapid pattern creation
- Pattern transformations (fast, slow, reverse, every)
- Ability to layer and combine patterns live

### Secondary Users

#### 4. Educators
**Profile:** Music technology teachers and workshop facilitators
- Teaching algorithmic composition or music programming
- Need clear examples and progressive learning materials
- Want students to understand both code and music

#### 5. Game Developers
**Profile:** Indie game developers creating adaptive/generative music
- Need programmatic music generation
- Want music that responds to game state
- Prefer code-based composition over DAW workflows

## Core Value Propositions

### 1. Computer-Only Music Capabilities
**What physical instruments can't do:**
- **Microtonal tuning**: 31-TET, just intonation, Bohlen-Pierce scale
- **Irrational time**: 7:5:3 polyrhythms, metric modulation, non-integer divisions
- **Algorithmic generation**: Fractals, L-systems, cellular automata applied to music
- **Impossible speed**: Note sequences faster than human performance
- **Perfect synchronization**: Thousands of simultaneous voices without drift

### 2. Functional Composition Patterns
**Composable building blocks:**
- **Immutable transformations**: `pattern.transpose(5).retrograde().augment(2)`
- **Pattern algebra**: `pattern.fast(2).every(4, x => x.rev())`
- **Higher-order functions**: `pattern.map(transpose(3)).filter(inScale('C', 'major'))`
- **Combinator style**: `sequence(intro, verse, chorus).repeat(2)`

### 3. Multiple Notation Systems
**Support diverse musical backgrounds:**
- **Traditional notation**: Standard note names (C4, D#5, Bb3)
- **Chord symbols**: Jazz/pop notation (Cmaj7, Dm7♭5, G13♭9)
- **Programmatic patterns**: Algorithmic generation and transformations
- **Mini-notation**: Concise rhythm syntax ("bd*4 [sn sn] cp hh")

### 4. Type-Safe Musical Concepts
**Catch errors at compile time:**
- **Unit safety**: Can't add Hz to BPM
- **Note validation**: "H5" is a compile error
- **Musical correctness**: Type system enforces valid intervals, chords, scales
- **IntelliSense**: Autocomplete for note names, chord types, scale degrees

### 5. Hot-Reload Development
**Instant feedback loop:**
- Sub-100ms code-to-audio updates
- Graceful audio fadeout (no clicks/pops)
- Maintain playback position across reloads
- Pattern transformations applied live

## Product Goals

### Phase 1: Foundation (Weeks 1-3)
**Goal:** Establish core architecture and type system

**Deliverables:**
- Vite + TypeScript + pnpm monorepo setup
- Branded types for musical units (Hz, BPM, Seconds, MIDINote)
- Template literal types for note validation
- Note class with transpose/enharmonic operations
- Pattern class with immutable transformations
- 50+ passing unit tests

**Success Criteria:**
- TypeScript compilation prevents unit mixing at compile time
- Note("C#4") validates, Note("H5") is a type error
- Tests demonstrate immutability (original patterns unchanged by transforms)

### Phase 2: Pattern System (Weeks 4-5)
**Goal:** Implement pattern algebra and transformations

**Deliverables:**
- PatternBuilder with fluent API
- Core transformations: fast, slow, rev, every, transpose, retrograde
- Pattern combination: sequence, parallel, stack
- Mini-notation parser (optional): "bd*4 [sn sn]"
- 100+ tests including property-based tests (fast-check)

**Success Criteria:**
- `pattern.fast(2).every(4, x => x.rev())` works correctly
- Property test: `pattern.retrograde().retrograde() === pattern`
- Patterns are immutable (transformations return new instances)

### Phase 3: Tone.js Integration (Weeks 6-7)
**Goal:** Connect patterns to Tone.js audio engine

**Deliverables:**
- Four-layer architecture (Tone.js → wrappers → abstractions → DSL)
- Pattern scheduling to Tone.Transport
- Custom Vite HMR plugin for graceful audio reload
- Voice and Track classes for multi-voice management
- Integration tests validating Tone.js interaction

**Success Criteria:**
- Simple melody plays in browser via Vite dev server
- Hot-reload fades audio over 300ms (no clicks/pops)
- Multiple voices play simultaneously without drift
- Transport position can be maintained across reloads

### Phase 4: Composition System (Weeks 8-9)
**Goal:** Full multi-track compositions with tempo and time signatures

**Deliverables:**
- Composition class combining multiple tracks
- Tempo changes and curves (accelerando/ritardando)
- Time signature changes mid-composition
- Section management (intro, verse, chorus)
- Bach Invention No. 4 implementation as acceptance test

**Success Criteria:**
- Bach Invention No. 4 renders recognizably
- Two-voice counterpoint maintains independence
- Golden file test passes (99.9%+ audio similarity)
- Composition can be exported to audio file

### Phase 5: Plugin Architecture (Weeks 10-12)
**Goal:** Extensible renderer system for multiple output formats

**Deliverables:**
- RendererPlugin interface with type safety
- Audio renderer (MP3/WAV via Tone.Offline)
- MIDI renderer (Standard MIDI File export)
- Plugin registry with dependency resolution
- At least 3 working plugins

**Success Criteria:**
- Plugins can be added without modifying core
- Audio export matches live playback quality
- MIDI files import correctly to DAWs
- Plugin dependencies resolve in correct order

## User Stories

### Epic 1: Core Composition Workflow

#### US-1.1: Type-Safe Note Creation
**As a** developer  
**I want** to create notes with compile-time validation  
**So that** invalid note names are caught before runtime

**Acceptance Criteria:**
- `Note('C#4')` creates a valid note
- `Note('H5')` produces a TypeScript compile error
- Note instances are immutable
- Transpose and enharmonic operations return new instances

**Technical Notes:**
- Use template literal types: `NoteName = ${NoteLetter}${Accidental}${Octave}`
- Implement branded types for MIDI numbers
- Provide convenience functions: C4(), Db5(), etc.

#### US-1.2: Pattern Building with Fluent API
**As a** composer  
**I want** to build musical patterns with method chaining  
**So that** composition feels natural and reads like music

**Acceptance Criteria:**
- `pattern().notes(['C4', 'E4', 'G4']).transpose(2).build()` works
- All builder methods return `this` for chaining
- Build() returns immutable Pattern instance
- Pattern can be converted back to builder for modification

**Technical Notes:**
- PatternBuilder class with fluent interface
- Separate builder from immutable Pattern class
- Support both array and variadic arguments

#### US-1.3: Pattern Transformations
**As a** music theory enthusiast  
**I want** to transform patterns algebraically  
**So that** I can develop musical ideas through variation

**Acceptance Criteria:**
- `pattern.transpose(5)` shifts all notes up 5 semitones
- `pattern.retrograde()` reverses the pattern
- `pattern.fast(2)` doubles the speed
- `pattern.every(4, x => x.rev())` applies transformation conditionally
- Original pattern remains unchanged (immutability)

**Technical Notes:**
- All transformations return new Pattern instances
- Implement using pure functions
- Add property-based tests for algebraic laws

### Epic 2: Advanced Musical Features

#### US-2.1: Microtonal Tuning Systems
**As a** music theory nerd  
**I want** to use non-12-TET tuning systems  
**So that** I can explore just intonation and other temperaments

**Acceptance Criteria:**
- Can specify 31-TET (31 equal divisions per octave)
- Can define custom tuning tables
- Can use just intonation ratios (3/2, 5/4, etc.)
- Tone.js correctly renders microtonal frequencies

**Technical Notes:**
- Tuning class with frequency calculation methods
- Support for cents-based deviations
- Integration with Tone.js frequency parameters

#### US-2.2: Complex Polyrhythms
**As a** experimental composer  
**I want** to create irrational time signatures and polyrhythms  
**So that** I can explore rhythmic complexity impossible for humans

**Acceptance Criteria:**
- Can create 7:5:3 polyrhythm (7 notes against 5 against 3)
- Can specify non-integer time signatures (e.g., π/4)
- Patterns maintain synchronization across metric boundaries
- Swing and groove parameters work with polyrhythms

**Technical Notes:**
- Functional timing abstraction: `Behavior<T> = (time: Seconds) => T`
- Look-ahead scheduling with 0.1s buffer
- Quantization to arbitrary subdivisions

#### US-2.3: Algorithmic Pattern Generation
**As a** live coder  
**I want** to generate patterns algorithmically  
**So that** I can create complex musical structures efficiently

**Acceptance Criteria:**
- Can generate patterns from L-systems
- Can apply cellular automata rules to musical sequences
- Can use Euclidean rhythm generation
- Can create fractal melodic structures

**Technical Notes:**
- Pattern generators as pure functions
- Configurable parameters for generative algorithms
- Seed-based randomness for reproducibility

### Epic 3: Development Experience

#### US-3.1: Hot-Reload Without Audio Glitches
**As a** live coder  
**I want** hot-reload to update music instantly without clicks  
**So that** I can iterate rapidly during performances

**Acceptance Criteria:**
- Code changes reflect in audio within 100ms
- Audio fades out over 300ms on reload (no clicks/pops)
- Transport position can optionally be maintained
- Multiple rapid reloads don't cause audio queue buildup

**Technical Notes:**
- Custom Vite plugin for music-aware HMR
- Client-side fade out before accepting module update
- Proper Tone.Transport cleanup and restart

#### US-3.2: Clear Error Messages
**As a** developer  
**I want** clear, actionable error messages  
**So that** I can fix problems quickly

**Acceptance Criteria:**
- Musical errors show note position and context
- Type errors explain what was expected vs. received
- Runtime errors include stack traces with source maps
- Tone.js errors are wrapped with musical context

**Technical Notes:**
- Custom error classes: MusicalError, NotationError
- Error messages reference musical concepts
- Include "did you mean?" suggestions where applicable

#### US-3.3: Multiple Notation Input
**As a** musician with jazz background  
**I want** to use chord symbols instead of explicit note arrays  
**So that** I can compose in the notation I'm familiar with

**Acceptance Criteria:**
- `chord('Cmaj7')` resolves to ['C4', 'E4', 'G4', 'B4']
- `chord('Dm7♭5')` handles alterations correctly
- `chord('C13♭9')` includes extensions
- Slash chords work: `chord('C/E')` has E in bass

**Technical Notes:**
- Custom lightweight chord parser for common chord types
- Provide default voicing strategies
- Allow custom voicing overrides

### Epic 4: Output and Integration

#### US-4.1: High-Quality Audio Export
**As a** composer  
**I want** to export compositions as audio files  
**So that** I can share finished works

**Acceptance Criteria:**
- Export to WAV at 48kHz/24-bit
- Export to MP3 with configurable bitrate
- Rendering matches live playback quality
- Offline rendering is faster than real-time

**Technical Notes:**
- Use Tone.Offline for rendering
- Implement MP3 encoding (via lamejs or ffmpeg)
- Plugin architecture for extensibility

#### US-4.2: MIDI File Export
**As a** DAW user  
**I want** to export compositions as MIDI files  
**So that** I can continue production in my DAW

**Acceptance Criteria:**
- Export Standard MIDI File (SMF) Format 1
- Multi-track compositions maintain track separation
- Tempo and time signature changes included
- MIDI files import correctly to Logic Pro, Ableton, etc.

**Technical Notes:**
- Use existing MIDI library (don't build from scratch)
- Support General MIDI instrument mapping
- Include metadata (composition name, author)

#### US-4.3: Visualization Export
**As a** video creator  
**I want** to export visualizations of compositions  
**So that** I can create music videos

**Acceptance Criteria:**
- Render to Canvas showing note events
- Export as video file (MP4)
- Configurable visual styles
- Synchronized with audio

**Technical Notes:**
- Plugin architecture supports custom renderers
- Use FFmpeg for video encoding
- Provide template visualizer styles

## Non-Goals (Out of Scope)

### What We're NOT Building

1. **Full DAW Replacement**
   - Not competing with Ableton Live or Logic Pro
   - Focus on composition, not mixing/mastering/recording
   - No audio recording or editing capabilities

2. **Graphical Music Editor**
   - No drag-and-drop piano roll
   - No visual timeline editor
   - Code-first approach only

3. **Real-Time Audio Input**
   - No microphone recording
   - No live audio processing
   - MIDI input may come later, but not in v1

4. **Cloud Collaboration**
   - No real-time multi-user editing
   - Use Git for collaboration instead
   - No hosted service or accounts

5. **Sample Library Management**
   - No built-in sample browser
   - Users manage their own samples
   - Focus on synthesis over sampling

6. **Mobile Apps**
   - Desktop/web only
   - iOS/Android out of scope
   - Mobile browsers may work but not optimized

## Technical Requirements

### Performance Requirements

- **Hot-reload latency**: < 100ms from code save to audio update
- **Scheduling precision**: < 1ms timing jitter
- **Simultaneous voices**: Support 100+ voices without glitches
- **Memory usage**: < 500MB for typical composition
- **Build time**: < 5s for incremental builds
- **Test suite**: Complete in < 30s

### Browser Requirements

- **Chrome**: 90+ (primary target)
- **Firefox**: 90+ (secondary)
- **Safari**: 14+ (tertiary, known AudioContext limitations)
- **Edge**: 90+ (Chromium-based)

### Platform Requirements

- **Node.js**: 18+ LTS
- **TypeScript**: 5.3+
- **Operating Systems**: macOS, Windows, Linux

### Dependency Constraints

- **Tone.js**: 15.0+ (audio engine)
- **Vite**: 5.0+ (build tooling)
- **Vitest**: 1.0+ (testing)

## Success Metrics

### Acceptance Criteria

#### Primary Acceptance Test
**Bach Invention No. 4 in D Minor (BWV 775)**
- Can be implemented in Contour
- Renders recognizably as Bach Invention No. 4
- Two voices maintain independence
- Golden file test passes (>99.9% similarity to reference)

#### Secondary Acceptance Tests
1. **Scott Joplin - "The Entertainer" (Section A)**
   - Demonstrates ragtime syncopation
   - Stride bass pattern works correctly
   - Proves stylistic versatility

2. **Simple Algorithmic Piece**
   - Uses L-system or cellular automata
   - Demonstrates computer-only capabilities
   - Cannot be easily transcribed for human performance

### Technical Quality Metrics

- **Test coverage**: > 90% for core packages
- **Type safety**: 100% (strict TypeScript mode)
- **Build performance**: < 5s incremental builds
- **Documentation coverage**: All public APIs documented
- **Example compositions**: At least 5 diverse examples

### User Experience Metrics

- **Time to first composition**: < 10 minutes from install
- **Hot-reload latency**: < 100ms perceived delay
- **Error clarity**: No confusing "undefined" errors
- **Learning curve**: Non-musicians can create simple melodies

### Community Metrics (Post-Launch)

- **GitHub stars**: Track community interest
- **Issues opened**: Measure engagement
- **Contributions**: PRs from community members
- **Live coding performances**: Adoption in Algorave scene

## Risks and Mitigations

### Risk 1: Tone.js Limitations
**Risk:** Tone.js may not support all desired features  
**Impact:** High - core dependency  
**Mitigation:** 
- Keep abstraction layers clean so Tone.js could be swapped
- Contribute to Tone.js if features are missing
- Maintain escape hatch to raw Web Audio API

### Risk 2: Browser Audio Timing Inconsistencies
**Risk:** Different browsers have varying AudioContext timing  
**Impact:** Medium - affects precision  
**Mitigation:**
- Look-ahead scheduling with buffer
- Test across all major browsers
- Document known limitations per browser

### Risk 3: Learning Curve Too Steep
**Risk:** Users need both music AND programming knowledge  
**Impact:** Medium - limits adoption  
**Mitigation:**
- Excellent documentation with progressive examples
- Video tutorials for common patterns
- Pre-built templates for common use cases

### Risk 4: Performance Issues at Scale
**Risk:** Large compositions may cause audio glitches  
**Impact:** High - core functionality  
**Mitigation:**
- Profile early and optimize hot paths
- Implement voice limiting and prioritization
- Use Web Workers for heavy computation

### Risk 5: Scope Creep
**Risk:** Feature requests expand beyond core vision  
**Impact:** High - delayed launch  
**Mitigation:**
- Maintain strict focus on v1 goals
- Document future features in backlog
- Use plugin architecture to defer extensions

## Launch Strategy

### Phase 1: Private Alpha (Weeks 1-6)
- Core team development
- Daily iterations based on dogfooding
- No external communications

### Phase 2: Public Beta (Weeks 7-12)
- GitHub repository public
- Invite live coding community
- Gather feedback via issues
- Weekly demos and updates

### Phase 3: v1.0 Launch (Week 13+)
- npm package publication
- Website with interactive examples
- Documentation site
- Launch blog post
- Show HN / Product Hunt

### Post-Launch
- Monthly releases with new features
- Community engagement via Discord
- Live coding streams demonstrating capabilities
- Educational content (tutorials, videos)

## Future Enhancements (Post-v1)

These features are explicitly out of scope for v1 but may be added later:

### v1.1: Enhanced Notation
- MusicXML import/export
- Sheet music rendering
- Guitar tablature support
- Nashville number system

### v1.2: Collaboration Tools
- Operational transforms for real-time editing
- CRDT-based multi-user composition
- GitHub integration for composition reviews

### v1.3: Performance Features
- MIDI input integration
- Real-time parameter control
- Scene management for live performance
- Visual performance interface

### v1.4: AI Integration
- Claude MCP server for natural language composition
- AI-assisted melody generation
- Style transfer between compositions
- Automatic harmonization

### v2.0: Professional Production
- VST/AU plugin hosting
- Advanced mixing and mastering
- Multi-channel audio routing
- Integration with external hardware

## Conclusion

Contour aims to be the TypeScript of music composition—bringing type safety, functional programming patterns, and modern developer workflows to musical creation. By focusing on computer-only music capabilities and algorithmic composition, we differentiate from traditional DAWs and notation software. The plugin architecture ensures extensibility while maintaining a clean core focused on composition patterns.

Success is measured not just by features shipped, but by enabling musical creations that were previously impossible or impractical. When composers start sharing algorithmic pieces, microtonal experiments, and live coding performances built with Contour, we'll know we've succeeded in our mission to make TypeScript the language of experimental music composition.
