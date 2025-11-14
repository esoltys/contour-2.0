# Sample Library Integration - Executive Summary

**TL;DR:** Sample library loading extends `@contour/tone-adapter` (Layer 2) as a new musical wrapper alongside `MusicalSynth`. It's NOT a plugin—plugins are for outputs (renderers), not inputs (instruments). Compositions remain JSON-serializable.

---

## 1. Integration Plan: Where This Fits

### Current Architecture (Unchanged)
```
Layer 4: DSL Syntax ─────────────── User writes compositions
Layer 3: Composition ────────────── Track, Voice, Pattern (core)
Layer 2: Musical Wrappers ───────── MusicalSynth (tone-adapter)
Layer 1: Tone.js ────────────────── Audio engine (untouched)
```

### With Sample Libraries (Extension)
```
Layer 4: DSL Syntax
  │
  ├─ Voice(pattern, 'synth')                          // Existing
  └─ Voice(pattern, 'FluidR3:AcousticGrandPiano')     // NEW

Layer 3: Composition (@contour/core)
  │  Voice.instrument: InstrumentReference (string)   // No breaking changes!

Layer 2: Musical Wrappers (@contour/tone-adapter) *** EXTEND HERE ***
  │
  ├─ MusicalSynth (existing)
  ├─ MusicalSampler (NEW - wraps Tone.Sampler)
  └─ SampleLibraryManager (NEW - loads .sf2 files)

Layer 1: Tone.js
  ├─ Tone.Synth, Tone.PolySynth (existing)
  └─ Tone.Sampler (existing, underutilized)
```

**Key Insight:** The scheduler (`CompositionScheduler`) already creates instruments dynamically from string names. We extend this to recognize qualified names (`LibraryName:InstrumentName`) and create `MusicalSampler` instead of `Tone.PolySynth`.

---

## 2. TypeScript Interfaces

```typescript
// @contour/tone-adapter/src/samples/types.ts

/**
 * Sample library configuration - JSON-serializable!
 */
export interface SampleLibraryConfig {
  name: string;              // "FluidR3", "GeneralUserGS"
  format: 'soundfont';       // Extensible to 'sfz', 'custom'
  url: string;               // CDN or local path
  options?: {
    preload?: boolean;       // Load all samples upfront?
    quality?: 'low' | 'medium' | 'high';
  };
}

/**
 * Parsed instrument from library.
 */
export interface SampledInstrument {
  library: string;           // "FluidR3"
  name: string;              // "AcousticGrandPiano"
  qualifiedName: string;     // "FluidR3:AcousticGrandPiano"
  program?: number;          // MIDI program (for GM fonts)
  samples: Record<string, AudioBuffer>;  // Note → audio data
}

/**
 * Voice still uses string - but now supports qualified names!
 */
// No changes to @contour/core needed:
const voice = new Voice(pattern, 'FluidR3:AcousticGrandPiano');
//                               ^^^ Still a string, fully JSON-serializable
```

---

## 3. Usage Examples

### Example 1: Playground - Toggle Synth/Samples

```typescript
// packages/playground/src/main.ts

import { SampleLibraryManager } from '@contour/tone-adapter';

const sampleManager = new SampleLibraryManager();
let useSamples = false;

// Load samples on first toggle
async function toggleInstrumentMode() {
  if (!useSamples && !sampleManager.isLibraryLoaded('FluidR3')) {
    // Load lightweight GM SoundFont (15 MB)
    await sampleManager.loadLibrary({
      name: 'FluidR3',
      format: 'soundfont',
      url: 'https://cdn.jsdelivr.net/gh/gleitz/midi-js-soundfonts/FluidR3_GM/acoustic_grand_piano-mp3.js'
    });
  }

  useSamples = !useSamples;
  updateUI();
}

// Pattern stays the same - just change instrument reference
function createPattern() {
  const instrument = useSamples
    ? 'FluidR3:AcousticGrandPiano'
    : 'synth';

  return new Voice(melodyPattern, instrument);
}

// Pass manager to scheduler
scheduler.setSampleLibraryManager(sampleManager);
```

### Example 2: Programmatic Use - Classical Composition

```typescript
// examples/orchestral-demo.ts

import { Composition, Track, Voice, BPM } from '@contour/core';
import { SampleLibraryManager } from '@contour/tone-adapter';

// Setup
const manager = new SampleLibraryManager();
await manager.loadLibrary({
  name: 'GeneralUserGS',
  format: 'soundfont',
  url: 'https://example.com/GeneralUser-GS.sf2'
});

// Create orchestral composition
const composition = new Composition('Symphony No. 1', BPM(120))
  .addTrack(new Track('Violins', [
    new Voice(violinPattern, 'GeneralUserGS:Violin')
  ]))
  .addTrack(new Track('Cello', [
    new Voice(celloPattern, 'GeneralUserGS:Cello')
  ]))
  .addTrack(new Track('Bass (synth)', [
    new Voice(bassPattern, 'synth')  // Mix with synths!
  ]));

// Schedule and play
const scheduler = new CompositionScheduler();
scheduler.setSampleLibraryManager(manager);
scheduler.scheduleComposition(composition);
await scheduler.start();

// Export to MIDI - instrument names preserved via program numbers
const midiRenderer = new MIDIRenderer();
const result = await midiRenderer.render(composition);
await writeFile('symphony.mid', result.data);
```

### Example 3: Playground Grid - Extend Pattern Pads

```typescript
// packages/playground/src/performance.ts

import { SampleLibraryManager } from '@contour/tone-adapter';

class PerformanceGrid {
  private sampleManager = new SampleLibraryManager();
  private pads = new Map<number, PatternPad>();

  async loadSamples() {
    await this.sampleManager.loadLibrary({
      name: 'FluidR3',
      format: 'soundfont',
      url: 'https://cdn.example.com/FluidR3_GM.sf2'
    });
  }

  // Each pad can choose synth or sample
  createPad(index: number, preset: PatternPreset) {
    const instrument = preset.useSamples
      ? `FluidR3:${preset.gmInstrument}`  // e.g., "FluidR3:AcousticGrandPiano"
      : 'synth';

    const voice = new Voice(preset.pattern, instrument);
    const pad = new PatternPad(voice, this.sampleManager);

    this.pads.set(index, pad);
    return pad;
  }
}

// Pattern presets extended with GM instrument mapping
const PRESETS = [
  {
    name: 'Piano Arpeggio',
    pattern: pianoArp,
    useSamples: true,
    gmInstrument: 'AcousticGrandPiano'
  },
  {
    name: 'Synth Lead',
    pattern: synthLead,
    useSamples: false  // Use Tone.js synth
  },
  // ... 14 more presets
];
```

### Example 4: JSON-Serializable Compositions

```typescript
// Compositions with samples are fully serializable!
const composition = {
  name: 'My Song',
  tempo: 120,
  tracks: [
    {
      name: 'Piano',
      voices: [
        {
          pattern: { /* ... */ },
          instrument: 'FluidR3:AcousticGrandPiano'  // Just a string!
        }
      ]
    }
  ]
};

// Save to file
await writeFile('composition.json', JSON.stringify(composition, null, 2));

// Load and play
const loaded = JSON.parse(await readFile('composition.json'));
const comp = Composition.fromJSON(loaded);

// As long as library is loaded, it works
const manager = new SampleLibraryManager();
await manager.loadLibrary(/* FluidR3 config */);
scheduler.setSampleLibraryManager(manager);
scheduler.scheduleComposition(comp);
```

---

## 4. File Structure Changes

```diff
contour-2.0/
├── packages/
│   ├── core/                              # ZERO CHANGES (no deps added!)
│   │   └── src/
│   │       └── composition/
│   │           └── Voice.ts               # instrument: string (unchanged)
│   │
│   └── tone-adapter/                      # *** EXTEND HERE ***
│       ├── package.json                   # + ADD: "sf2-parser": "^1.3.0"
│       └── src/
│           ├── index.ts                   # + EXPORT: Sample APIs
│           ├── wrappers/
│           │   ├── MusicalSynth.ts       # (existing)
+           │   └── MusicalSampler.ts      # NEW: Tone.Sampler wrapper
│           ├── samples/                   # NEW DIRECTORY
+           │   ├── index.ts               # Public API
+           │   ├── types.ts               # Type definitions
+           │   ├── SoundFontLoader.ts     # .sf2 parser
+           │   └── SampleLibraryManager.ts # Main orchestrator
│           └── scheduling/
~               └── CompositionScheduler.ts # MODIFY: Support MusicalSampler
│
├── packages/playground/
│   └── src/
~       ├── main.ts                        # MODIFY: Add toggle button
~       ├── performance.ts                 # MODIFY: Grid support for samples
│       └── ui/
+           └── InstrumentSelector.ts      # NEW: Toggle component
│
└── docs/
+   ├── SAMPLE_LIBRARY_SPEC.md             # Full specification
+   ├── SAMPLE_LIBRARY_INTEGRATION_SUMMARY.md  # This document
+   └── SAMPLE_LIBRARY_GUIDE.md            # User guide (to be written)
```

**Summary:**
- **0 files modified** in `@contour/core` (zero coupling!)
- **2 files modified** in `@contour/tone-adapter` (index.ts, CompositionScheduler.ts)
- **4 new files** in `@contour/tone-adapter/src/samples/`
- **2 files modified** in `@contour/playground` (main.ts, performance.ts)
- **1 new file** in `@contour/playground/src/ui/`

---

## 5. Dependencies to Add

### Primary Dependency: sf2-parser

```json
// packages/tone-adapter/package.json
{
  "dependencies": {
    "tone": "^15.0.4",        // Existing
    "sf2-parser": "^1.3.0"    // NEW - SoundFont parsing
  }
}
```

**Why sf2-parser?**
- **Size:** ~20 KB (minified)
- **Format:** Parses binary .sf2 SoundFont files
- **Output:** JSON structure with instrument definitions and sample data
- **License:** MIT
- **Maturity:** 150+ GitHub stars, actively maintained

**Alternative Considered:** `soundfont-player`
- **Pros:** Higher-level API, includes player
- **Cons:** Less control over Tone.js integration (we want to use Tone.Sampler directly)
- **Decision:** Use `sf2-parser` for maximum flexibility

### No Additional Dependencies Needed!

**Tone.Sampler** already exists in Tone.js:
```typescript
import { Sampler } from 'tone';

const sampler = new Sampler({
  urls: {
    C4: "C4.mp3",
    "D#4": "Ds4.mp3",
    "F#4": "Fs4.mp3",
    A4: "A4.mp3",
  },
  baseUrl: "https://tonejs.github.io/audio/salamander/"
});
```

We just need to:
1. Parse .sf2 files with `sf2-parser`
2. Extract sample data as AudioBuffers
3. Pass to `Tone.Sampler`

**Total bundle size increase:** ~20 KB (sf2-parser only)

---

## 6. Leveraging Existing Plugin Infrastructure

### What We Can Reuse

#### ✅ Plugin Registry Pattern (Inspiration)
```typescript
// Similar to PluginRegistry, but for sample libraries
class SampleLibraryManager {
  private libraries = new Map<string, SampledInstrument[]>();

  register(library: SampleLibrary) { /* ... */ }
  get(name: string): SampledInstrument[] { /* ... */ }
}
```

#### ✅ Loading State Management
```typescript
// Similar to plugin loading states
type LoadingState =
  | { status: 'idle' }
  | { status: 'loading'; progress: number }
  | { status: 'loaded'; instrumentCount: number }
  | { status: 'error'; error: Error };
```

#### ✅ Dependency Validation
```typescript
// SampleLibraryManager checks if library is loaded before use
getInstrument(name: string): MusicalSampler {
  const [lib, inst] = name.split(':');
  if (!this.libraries.has(lib)) {
    throw new Error(
      `Library not loaded: ${lib}. ` +
      `Available: ${this.getLibraries().join(', ')}`
    );
  }
  // ...
}
```

#### ✅ MIDI Renderer Integration
```typescript
// MIDIRenderer already maps instrument names to MIDI program numbers!
// We can leverage this for SoundFont instrument selection

// When exporting with MIDIRenderer:
const voice = new Voice(pattern, 'FluidR3:AcousticGrandPiano');

// MIDIRenderer extracts program number from qualified name
const [library, instrumentName] = voice.instrument.split(':');
const program = GM_INSTRUMENT_MAP[instrumentName]; // 0 = Acoustic Grand Piano

// Result: MIDI file uses correct program numbers
// When imported into DAW, it loads corresponding sounds
```

### What We DON'T Reuse (and Why)

#### ❌ NOT a RendererPlugin
```typescript
// WRONG: Sample libraries are NOT plugins
class SampleLibraryPlugin implements RendererPlugin {
  render(composition: Composition): Promise<RenderResult> {
    // This doesn't make sense - libraries are INPUTS, not OUTPUTS
  }
}
```

**Why?** Plugins are for **outputs** (renderers: audio, MIDI, visuals). Sample libraries are **inputs** (instrument sources). Different concerns!

#### ✅ RIGHT: Layer 2 Wrapper
```typescript
// CORRECT: Sample libraries are Layer 2 musical wrappers
// Just like MusicalSynth wraps Tone.Synth

class MusicalSampler {
  constructor(private sampler: Tone.Sampler) {}
  playNote(note, duration, velocity) {
    // Musical API, same as MusicalSynth
  }
}
```

### Integration with Export Plugins

#### MIDI Renderer: Automatic Instrument Mapping
```typescript
// packages/plugins/midi/src/MIDIRenderer.ts

private getInstrumentProgram(instrumentRef: string): number {
  // Handle qualified names: "FluidR3:AcousticGrandPiano"
  const instrumentName = instrumentRef.includes(':')
    ? instrumentRef.split(':')[1]  // Extract "AcousticGrandPiano"
    : instrumentRef;               // Use as-is

  // Map to MIDI program number
  return GM_INSTRUMENT_MAP[instrumentName] || 0;
}
```

**Result:** Compositions with sampled instruments export to MIDI with correct program numbers!

#### Audio Renderer: Works Out of the Box
```typescript
// packages/plugins/audio/src/AudioRenderer.ts
// No changes needed!

// AudioRenderer uses Tone.Offline to render whatever's scheduled
// Since MusicalSampler uses Tone.Sampler, it renders automatically
```

**Result:** Audio exports include sampled sounds, not just synths!

---

## Decision Matrix

| Concern | Solution | Rationale |
|---------|----------|-----------|
| **Where to add?** | `@contour/tone-adapter` (Layer 2) | Musical wrappers, not core primitives |
| **Plugin or feature?** | Feature (not plugin) | Plugins = outputs, samples = inputs |
| **Breaking changes?** | Zero | `Voice.instrument` stays string-based |
| **JSON serializable?** | Yes | Qualified names are strings |
| **Dependencies?** | `sf2-parser` (~20 KB) | Only in tone-adapter, not core |
| **Tone.js integration?** | Use existing `Tone.Sampler` | Already in Tone.js, battle-tested |
| **Playground?** | Toggle button + extend grid | Non-breaking, opt-in feature |
| **MIDI export?** | Automatic via program numbers | Reuse existing GM mapping |
| **Audio export?** | Automatic via Tone.Offline | Works with any Tone.js instrument |

---

## Implementation Checklist

### Phase 1: Core (1-2 days)
- [ ] Add `sf2-parser` dependency to tone-adapter
- [ ] Implement `SoundFontLoader` class
- [ ] Implement `MusicalSampler` wrapper
- [ ] Add type definitions (`types.ts`)
- [ ] Unit tests for loader and sampler

### Phase 2: Manager (1-2 days)
- [ ] Implement `SampleLibraryManager`
- [ ] Modify `CompositionScheduler` to support samplers
- [ ] Integration tests (load library, create instruments)
- [ ] Error handling and validation

### Phase 3: Playground (1 day)
- [ ] Create `InstrumentSelector` component
- [ ] Add toggle button to `main.ts`
- [ ] Extend performance grid presets
- [ ] Test in browser (Chrome, Firefox, Safari)

### Phase 4: Documentation (1 day)
- [ ] Write user guide (`SAMPLE_LIBRARY_GUIDE.md`)
- [ ] Update README with sample library section
- [ ] Add code examples
- [ ] Update CLAUDE.md with new patterns

### Phase 5: Polish (1 day)
- [ ] Performance testing (loading times, memory)
- [ ] Browser compatibility testing
- [ ] Example composition (orchestral demo)
- [ ] Update screenshots/demos

**Total Estimate:** 5-7 days for full implementation

---

## Success Metrics

1. ✅ **Zero core changes** - `@contour/core` has no new dependencies
2. ✅ **Backward compatible** - All existing code works unchanged
3. ✅ **JSON serializable** - Compositions can be saved/loaded
4. ✅ **Plugin integration** - MIDI/Audio renderers work automatically
5. ✅ **Playground ready** - Toggle works in live demo
6. ✅ **Small bundle** - <30 KB increase (sf2-parser only)
7. ✅ **Type safe** - TypeScript autocomplete for GM instruments
8. ✅ **Fast loading** - <3 seconds for typical SoundFont (30 MB)

---

## Questions to Resolve Before Implementation

1. **CDN hosting?** Should we provide a default hosted SoundFont URL?
   - **Recommendation:** Yes, use jsdelivr CDN with FluidR3_GM

2. **Local files?** Support `file://` URLs for development?
   - **Recommendation:** Phase 2 feature, start with URLs only

3. **Bundle size?** What's acceptable increase for tone-adapter?
   - **Current:** ~500 KB (with Tone.js)
   - **With sf2-parser:** ~520 KB (+4%)

4. **Memory limits?** Max SoundFont size to support?
   - **Recommendation:** 50 MB limit, warn users about larger files

5. **Lazy loading?** Load samples on-demand vs. preload?
   - **Recommendation:** Default to preload, add lazy option in Phase 2

---

**End of Summary**

See full specification in `SAMPLE_LIBRARY_SPEC.md` for complete details.
