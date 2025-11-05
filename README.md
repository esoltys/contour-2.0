# Contour v2.0 Documentation Package

**Complete documentation for rebooting Contour as a TypeScript music composition framework**

This package contains everything needed to build Contour from scratch using AI-assisted development (Claude Code) or human developers.

## 📚 Document Overview

### 1. **CLAUDE.md** - Start Here!
**Purpose:** Meta-guide for AI-assisted development  
**Read First:** Yes - explains how to use all other documents  
**Key Content:**
- Project vision and principles
- Documentation hierarchy
- Development workflow and phases
- Code generation guidelines
- Testing requirements
- Common pitfalls to avoid

### 2. **PRODUCT_REQUIREMENTS.md**
**Purpose:** What we're building and why  
**Audience:** Product understanding, user stories  
**Key Content:**
- Vision: "Make TypeScript the language of algorithmic music"
- Target users (developers, music theory nerds, live coders)
- Core value propositions (computer-only music, functional patterns)
- User stories and acceptance criteria
- Success metrics (Bach Invention No. 4 as acceptance test)

### 3. **ARCHITECTURE_GUIDE.md**
**Purpose:** Comprehensive research and lessons learned  
**Audience:** Deep architectural understanding  
**Key Content:**
- What went wrong with original Contour
- How existing systems work (TidalCycles, Sonic Pi, Strudel)
- Public domain compositions for testing
- Multi-notation system support
- Build tooling decisions (Vite vs webpack)
- Plugin architecture patterns
- Testing strategies

### 4. **TECHNICAL_SPEC.md**
**Purpose:** API contracts and implementation details  
**Audience:** Implementation reference  
**Key Content:**
- Type system (branded types, template literals)
- Core classes (Note, Pattern, PatternBuilder)
- Composition system (Voice, Track, Composition)
- Plugin architecture
- Tone.js integration layer
- Testing utilities
- All interfaces are normative (must match exactly)

### 5. **QUICK_START.md**
**Purpose:** First implementation steps  
**Audience:** Getting started with development  
**Key Content:**
- Phase 1: Project foundation setup
- Phase 2: Type system implementation
- Phase 3: Note class development
- Step-by-step with code examples
- Test-driven development workflow
- Success criteria for each phase

### 6. **ARCHITECTURE_DECISIONS.md**
**Purpose:** Record of major technical decisions  
**Audience:** Understanding rationale behind choices  
**Key Content:**
- ADR format and usage
- Existing decisions (Tone.js, Vite, branded types, etc.)
- Context, consequences, and alternatives
- Living document (update as decisions are made)

## 🚀 How to Use This Package

### For Claude Code (AI-Assisted Development)

1. **Initialize your coding session** by referencing `CLAUDE.md` first
2. **Understand the vision** by reading `PRODUCT_REQUIREMENTS.md`
3. **Review architecture patterns** in `ARCHITECTURE_GUIDE.md`
4. **Reference API contracts** in `TECHNICAL_SPEC.md` during implementation
5. **Follow implementation steps** in `QUICK_START.md`
6. **Document decisions** in `ARCHITECTURE_DECISIONS.md` as you make them

**Key Principle:** CLAUDE.md explains the workflow and coding standards. Always consult it when uncertain about patterns or practices.

### For Human Developers

**Day 1: Understanding**
- Read PRODUCT_REQUIREMENTS.md for vision and goals
- Skim ARCHITECTURE_GUIDE.md for research findings
- Read CLAUDE.md for development workflow

**Day 2-3: Setup**
- Follow QUICK_START.md to set up project structure
- Implement branded types and Note class
- Get first tests passing

**Week 2+: Development**
- Use TECHNICAL_SPEC.md as API reference
- Implement Pattern system following TDD
- Consult ARCHITECTURE_GUIDE.md for design patterns

**Ongoing:**
- Update ARCHITECTURE_DECISIONS.md when making significant choices
- Reference acceptance criteria in PRODUCT_REQUIREMENTS.md
- Keep CLAUDE.md updated with new patterns discovered

### Document Reading Order by Role

**Product Manager / Stakeholder:**
1. PRODUCT_REQUIREMENTS.md (complete)
2. ARCHITECTURE_GUIDE.md (skim for context)
3. Success metrics in PRD

**Technical Lead / Architect:**
1. CLAUDE.md (workflow understanding)
2. ARCHITECTURE_GUIDE.md (complete)
3. TECHNICAL_SPEC.md (complete)
4. ARCHITECTURE_DECISIONS.md (review all ADRs)

**Developer (New to Project):**
1. CLAUDE.md (sections: Vision, Principles, Workflow)
2. PRODUCT_REQUIREMENTS.md (User Stories section)
3. QUICK_START.md (complete, hands-on)
4. TECHNICAL_SPEC.md (reference as needed)

**AI Assistant (Claude Code):**
1. CLAUDE.md (complete - your operating manual)
2. All documents available for reference
3. Maintain context from multiple docs simultaneously

## 🎯 Quick Reference

### What Makes Contour Different?
- **Functional composition** inspired by TidalCycles/Strudel
- **Music theory exploration** (microtonal, polyrhythms, algorithmic)
- **Type-safe musical concepts** (branded types prevent unit mixing)
- **Hot-reload without audio glitches** (instant feedback)
- **Multiple notation systems** (traditional, chords, programmatic)

### Core Technologies
- **Tone.js 14.8+** - Audio engine (don't reinvent this!)
- **Vite** - Build tooling with <100ms HMR
- **Tonal.js** - Music theory utilities
- **TypeScript 5.3+** - Full type safety

### Architecture Pattern
Four-layer system:
1. Tone.js primitives (unchanged)
2. Musical wrappers (thin adapters)
3. Composition abstractions (Voice, Track, Pattern)
4. DSL syntax (user-facing API)

### Acceptance Criteria
**Primary:** Bach Invention No. 4 in D Minor (BWV 775)
- Two-voice counterpoint
- Recognizable as Bach
- Golden file test passes (>99.9% similarity)

**Secondary:**
- Scott Joplin "The Entertainer" (Section A)
- Simple algorithmic piece (demonstrates computer-only music)

### Testing Strategy
- **Unit tests**: Pure functions, music theory
- **Property-based**: Algebraic laws (fast-check)
- **Snapshot**: Event structure
- **Golden file**: Audio similarity
- **Integration**: Tone.js behavior

### Common Pitfalls (Avoid!)
❌ Never use `setTimeout` for audio scheduling  
❌ Don't create AudioNodes without disposal  
❌ Don't mix units without type safety  
❌ Don't stop audio abruptly (causes clicks)  
❌ Don't mutate patterns (immutability required)

## 📖 Key Concepts

### Branded Types
```typescript
type Hz = number & { readonly __brand: 'Hz' };
type BPM = number & { readonly __brand: 'BPM' };

const freq = Hz(440);
const tempo = BPM(120);
// freq + tempo // ✗ Type error!
```

### Immutable Patterns
```typescript
const pattern = new Pattern(events);
const transposed = pattern.transpose(5); // Returns NEW pattern
// pattern is unchanged
```

### Pattern Algebra
```typescript
pattern
  .fast(2)           // Double speed
  .every(4, p => p.rev())  // Reverse every 4th cycle
  .transpose(5);     // Up 5 semitones
```

### Four Layers
```typescript
// Layer 4: DSL
const melody = pattern(['C4', 'E4', 'G4']).transpose(2);

// Layer 3: Abstractions
const voice = new Voice(melody, 'synth');

// Layer 2: Musical wrappers
const synth = new MusicalSynth(new Tone.Synth());

// Layer 1: Tone.js (direct access when needed)
const rawSynth = new Tone.Synth();
```

## 🔧 Development Phases

### Phase 1: Foundation (Week 1)
- Project structure and monorepo
- Branded types and type system
- Note class with tests
- **Goal:** 30+ tests passing

### Phase 2: Patterns (Week 2)
- Pattern and PatternBuilder
- Transformations (transpose, retrograde, fast, slow)
- Property-based tests
- **Goal:** 50+ additional tests

### Phase 3: Tone.js Integration (Week 3)
- Scheduling layer
- Custom Vite HMR plugin
- Audio playback in browser
- **Goal:** Simple melody playing

### Phase 4: Composition (Week 4)
- Voice, Track, Composition
- Tempo and time signatures
- Bach Invention No. 4 implementation
- **Goal:** Acceptance test passes

### Phase 5: Plugins (Weeks 5-6)
- Plugin architecture
- Audio renderer (MP3/WAV)
- MIDI renderer
- **Goal:** Multiple output formats

## 📝 Documentation Maintenance

### When to Update Documents

**TECHNICAL_SPEC.md**
- Adding new public APIs
- Changing interface signatures
- New classes or types

**ARCHITECTURE_DECISIONS.md**
- Making significant technical choices
- Changing architectural patterns
- Learning important lessons

**QUICK_START.md**
- Discovering better workflows
- Adding helpful troubleshooting
- Phase completion criteria changes

**PRODUCT_REQUIREMENTS.md**
- New user stories
- Changed success criteria
- Shifted priorities

### Document Ownership

| Document | Primary Maintainer | Update Frequency |
|----------|-------------------|------------------|
| CLAUDE.md | Tech Lead | Per major pattern |
| PRODUCT_REQUIREMENTS.md | Product Manager | Per sprint |
| ARCHITECTURE_GUIDE.md | Architect | Rarely (foundational) |
| TECHNICAL_SPEC.md | Tech Lead | Per API change |
| QUICK_START.md | Developer Onboarding | Per phase |
| ARCHITECTURE_DECISIONS.md | Tech Lead | Per major decision |

## 🎵 Musical Context

### Why This Matters
Music composition software typically forces you into either:
1. **DAWs** (Ableton, Logic) - Great for production, poor for algorithmic work
2. **Notation software** (Sibelius, Finale) - Great for sheet music, limited programming
3. **Max/MSP, Pure Data** - Powerful but visual patching, not code
4. **SuperCollider, Chuck** - Powerful but steep learning curve, custom syntax

**Contour's niche:** TypeScript developers who want functional composition patterns, music theorists who want algorithmic exploration, and live coders who need instant feedback.

### What "Computer-Only Music" Means
- **Microtonal**: 31 notes per octave instead of 12
- **Polyrhythms**: 7 notes against 5 against 3 simultaneously
- **Algorithmic**: L-systems, fractals, cellular automata generating melodies
- **Speed**: Note sequences faster than human capability
- **Precision**: Perfect synchronization of hundreds of voices

### The TidalCycles Inspiration
TidalCycles pioneered pattern algebra for live coding:
```haskell
d1 $ sound "bd sn bd sn"
  # fast 2
  # every 4 rev
```

Contour brings this to TypeScript with full type safety and Tone.js power.

## 🚦 Status Indicators

### Document Maturity

| Document | Status | Completeness |
|----------|--------|--------------|
| CLAUDE.md | ✅ Complete | 100% |
| PRODUCT_REQUIREMENTS.md | ✅ Complete | 100% |
| ARCHITECTURE_GUIDE.md | ✅ Complete | 100% |
| TECHNICAL_SPEC.md | ✅ Complete | 100% |
| QUICK_START.md | ✅ Complete | 100% |
| ARCHITECTURE_DECISIONS.md | 🔄 Living | Initial ADRs |

### Implementation Status
- ⬜ **Phase 1**: Not Started
- ⬜ **Phase 2**: Not Started
- ⬜ **Phase 3**: Not Started
- ⬜ **Phase 4**: Not Started
- ⬜ **Phase 5**: Not Started

*Update these as development progresses*

## 💡 Tips for Success

### For AI-Assisted Development
- Keep CLAUDE.md open in context at all times
- Reference TECHNICAL_SPEC.md for exact API signatures
- Use ARCHITECTURE_DECISIONS.md to understand "why"
- Follow test-driven development strictly
- Verify immutability in all transformations

### For Human Developers
- Don't skip the type system - it catches bugs
- Write tests before implementation (TDD)
- Keep layers independent (don't skip layers)
- Consult ADRs when tempted to do it differently
- Use Bach Invention as continuous integration test

### For Product/Management
- Trust the architecture - it's research-backed
- Focus on user stories in PRD, not implementation
- Success = Bach Invention renders correctly
- Expect phases to take full time (don't compress)
- Quality over speed (immutability, tests, type safety)

## 🔗 External Resources

- **Tone.js Documentation**: https://tonejs.github.io/
- **Tonal.js Documentation**: https://github.com/tonaljs/tonal
- **Vite Documentation**: https://vitejs.dev/
- **TidalCycles**: https://tidalcycles.org/ (pattern inspiration)
- **Strudel**: https://strudel.cc/ (TypeScript TidalCycles)
- **IMSLP**: https://imslp.org/ (public domain sheet music)

## 📬 Questions?

This documentation package is complete and self-contained. If you encounter ambiguity:

1. **Check CLAUDE.md first** - answers most workflow questions
2. **Consult TECHNICAL_SPEC.md** - for API contract questions
3. **Review ADRs** - for understanding past decisions
4. **Reference ARCHITECTURE_GUIDE.md** - for pattern examples

Remember: **The goal is a tool for music theory exploration, not just another MIDI export tool.** Keep the vision of computer-only music capabilities central to all decisions.

---

**Ready to begin?** Start with `CLAUDE.md` and follow the development phases in `QUICK_START.md`. The path is clear, the pitfalls are documented, and the architecture is proven. Build methodically, test continuously, and ship iteratively.

🎵 **Make TypeScript sing!** 🎵
