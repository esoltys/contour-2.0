# Sample Library Architecture - Visual Overview

This document provides visual diagrams and flow charts for understanding how sample library loading integrates into Contour 2.0.

---

## High-Level Integration

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER CODE                                │
│                                                                 │
│  const composition = new Composition('My Song', BPM(120))       │
│    .addTrack(new Track('Piano', [                               │
│      new Voice(pattern, 'FluidR3:AcousticGrandPiano')          │
│    ]))                                                          │
│    .addTrack(new Track('Bass', [                                │
│      new Voice(bassPattern, 'synth')  // Mix!                  │
│    ]));                                                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    @contour/core                                │
│                   (No Changes!)                                 │
│                                                                 │
│  Voice { pattern: Pattern, instrument: string }                │
│  Track { voices: Voice[] }                                     │
│  Composition { tracks: Track[], tempo: BPM }                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                 @contour/tone-adapter                           │
│                  (Extended Here)                                │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │         CompositionScheduler                              │ │
│  │                                                           │ │
│  │  scheduleComposition(composition) {                       │ │
│  │    for (track of composition.tracks) {                    │ │
│  │      for (voice of track.voices) {                        │ │
│  │        const instrument = this.getOrCreateInstrument(     │ │
│  │          voice.instrument  // "FluidR3:Piano" or "synth" │ │
│  │        );                                                 │ │
│  │      }                                                    │ │
│  │    }                                                      │ │
│  │  }                                                        │ │
│  │                                                           │ │
│  │  getOrCreateInstrument(name: string) {                    │ │
│  │    if (name.includes(':')) {                              │ │
│  │      // Sample library reference                          │ │
│  │      return sampleManager.getInstrument(name);           │ │
│  │    } else {                                               │ │
│  │      // Tone.js synth                                     │ │
│  │      return new Tone.PolySynth();                        │ │
│  │    }                                                      │ │
│  │  }                                                        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                              ↓                                  │
│         ┌────────────────────┴──────────────────┐              │
│         ↓                                       ↓               │
│  ┌──────────────┐                      ┌─────────────────┐     │
│  │ MusicalSynth │                      │ MusicalSampler  │     │
│  │ (existing)   │                      │ (NEW)           │     │
│  │              │                      │                 │     │
│  │ wraps:       │                      │ wraps:          │     │
│  │ Tone.Synth   │                      │ Tone.Sampler    │     │
│  └──────────────┘                      └─────────────────┘     │
│                                                ↑                │
│                                                │                │
│                                  ┌─────────────┴────────────┐  │
│                                  │ SampleLibraryManager     │  │
│                                  │                          │  │
│                                  │ loadLibrary(config)      │  │
│                                  │ getInstrument(name)      │  │
│                                  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                         Tone.js                                 │
│                   (Web Audio API)                               │
│                                                                 │
│  Tone.Synth    Tone.PolySynth    Tone.Sampler                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Sample Library Loading Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER: Load sample library                               │
│                                                             │
│    const manager = new SampleLibraryManager();             │
│    await manager.loadLibrary({                             │
│      name: 'FluidR3',                                      │
│      format: 'soundfont',                                  │
│      url: 'https://cdn.example.com/FluidR3_GM.sf2'        │
│    });                                                      │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. SampleLibraryManager: Route to appropriate loader       │
│                                                             │
│    const loader = this.loaders.get('soundfont');          │
│    const instruments = await loader.load(config);          │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. SoundFontLoader: Fetch and parse .sf2 file             │
│                                                             │
│    // Fetch binary file                                    │
│    const arrayBuffer = await fetch(url).arrayBuffer();    │
│                                                             │
│    // Parse with sf2-parser                                │
│    const soundFont = parser.parse(arrayBuffer);           │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. SoundFontLoader: Extract instruments and samples        │
│                                                             │
│    for (preset of soundFont.presets) {                     │
│      const instrument = {                                  │
│        library: 'FluidR3',                                 │
│        name: preset.name,  // 'AcousticGrandPiano'        │
│        qualifiedName: 'FluidR3:AcousticGrandPiano',       │
│        program: preset.program,  // MIDI number           │
│        samples: extractSampleData(preset.zones)            │
│      };                                                    │
│      instruments.push(instrument);                         │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. SampleLibraryManager: Store in registry                 │
│                                                             │
│    this.libraries.set('FluidR3', instruments);            │
│    this.loadingStates.set('FluidR3', {                    │
│      status: 'loaded',                                     │
│      instrumentCount: 128                                  │
│    });                                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Instrument Creation Flow

```
┌─────────────────────────────────────────────────────────────┐
│ USER: Create voice with sampled instrument                 │
│                                                             │
│    const voice = new Voice(                                │
│      pattern,                                              │
│      'FluidR3:AcousticGrandPiano'                         │
│    );                                                       │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ CompositionScheduler: Schedule voice                       │
│                                                             │
│    scheduleVoice(voice) {                                  │
│      const instrument = this.getOrCreateInstrument(        │
│        voice.instrument                                    │
│      );                                                     │
│      // ... schedule events ...                            │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ CompositionScheduler: Detect sample library reference      │
│                                                             │
│    getOrCreateInstrument(name: string) {                   │
│      if (name.includes(':')) {                             │
│        // Qualified name: 'FluidR3:AcousticGrandPiano'    │
│        return this.sampleManager.getInstrument(name);     │
│      }                                                      │
│      // ... else create synth ...                          │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ SampleLibraryManager: Parse qualified name                 │
│                                                             │
│    getInstrument(qualifiedName) {                          │
│      const [library, instrument] = qualifiedName.split(':');│
│      // library = 'FluidR3'                                │
│      // instrument = 'AcousticGrandPiano'                  │
│                                                             │
│      if (!this.libraries.has(library)) {                   │
│        throw new Error(`Library not loaded: ${library}`);  │
│      }                                                      │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ SampleLibraryManager: Find instrument definition           │
│                                                             │
│    const instruments = this.libraries.get('FluidR3');     │
│    const def = instruments.find(                           │
│      i => i.name === 'AcousticGrandPiano'                 │
│    );                                                       │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ SampleLibraryManager: Create MusicalSampler               │
│                                                             │
│    const sampler = new MusicalSampler(def);               │
│    sampler.toDestination();                                │
│                                                             │
│    // Cache for reuse                                      │
│    this.cachedSamplers.set(qualifiedName, sampler);       │
│                                                             │
│    return sampler;                                         │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ MusicalSampler: Create Tone.Sampler                        │
│                                                             │
│    constructor(instrument: SampledInstrument) {            │
│      this.sampler = new Tone.Sampler({                    │
│        urls: instrument.samples,  // { C4: buffer, ... }  │
│        attack: 0.01,                                       │
│        release: 1                                          │
│      });                                                    │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ READY: MusicalSampler can play notes                      │
│                                                             │
│    sampler.playNote('C4', 0.5, Velocity(80));             │
│    // Triggers Tone.Sampler with correct sample           │
└─────────────────────────────────────────────────────────────┘
```

---

## Playground Toggle Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Playground starts in SYNTH mode                         │
│                                                             │
│    let currentMode = 'synth';                              │
│    const sampleManager = new SampleLibraryManager();      │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. USER: Click "Toggle Instrument" button                  │
│                                                             │
│    <button id="instrumentToggle">🎹 Synth</button>        │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. InstrumentSelector: First toggle loads samples          │
│                                                             │
│    async toggleMode() {                                    │
│      if (mode === 'synth' && !libraryLoaded) {            │
│        // Show loading indicator                           │
│        showLoading('Loading samples...');                  │
│                                                             │
│        // Load lightweight GM font (~15 MB)                │
│        await sampleManager.loadLibrary({                   │
│          name: 'FluidR3',                                  │
│          format: 'soundfont',                              │
│          url: 'https://cdn.jsdelivr.net/...'              │
│        });                                                  │
│                                                             │
│        libraryLoaded = true;                               │
│        hideLoading();                                      │
│      }                                                      │
│      currentMode = mode === 'synth' ? 'samples' : 'synth';│
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. InstrumentSelector: Map generic to GM instrument        │
│                                                             │
│    getInstrument(type: 'piano' | 'bass' | ...) {          │
│      if (currentMode === 'samples') {                      │
│        const mapping = {                                   │
│          piano: 'FluidR3:AcousticGrandPiano',             │
│          bass: 'FluidR3:AcousticBass',                    │
│          strings: 'FluidR3:StringEnsemble1',              │
│          // ...                                            │
│        };                                                   │
│        return mapping[type];                               │
│      }                                                      │
│      return 'synth';  // Default                          │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Recreate patterns with new instrument                   │
│                                                             │
│    const instrument = selector.getInstrument('piano');    │
│    // Returns: 'FluidR3:AcousticGrandPiano' or 'synth'   │
│                                                             │
│    const voice = new Voice(melodyPattern, instrument);    │
│    scheduler.setSampleLibraryManager(                      │
│      selector.getSampleManager()                           │
│    );                                                       │
│    scheduler.scheduleVoice(voice);                         │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. Update UI button text                                   │
│                                                             │
│    toggleBtn.textContent =                                 │
│      currentMode === 'synth' ? '🎹 Synth' : '🎼 Samples'; │
└─────────────────────────────────────────────────────────────┘
```

---

## MIDI Export with Samples

```
┌─────────────────────────────────────────────────────────────┐
│ Composition with sampled instruments                        │
│                                                             │
│    const comp = new Composition('Orchestra', BPM(90))      │
│      .addTrack(new Track('Violin', [                       │
│        new Voice(pattern, 'GeneralUserGS:Violin')         │
│      ]))                                                    │
│      .addTrack(new Track('Cello', [                        │
│        new Voice(pattern, 'GeneralUserGS:Cello')          │
│      ]));                                                   │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ MIDIRenderer: Extract program numbers from qualified names │
│                                                             │
│    for (track of composition.tracks) {                     │
│      for (voice of track.voices) {                         │
│        const instrumentName = voice.instrument.includes(':')│
│          ? voice.instrument.split(':')[1]                  │
│          : voice.instrument;                               │
│                                                             │
│        // 'Violin' -> MIDI program 40                      │
│        const program = GM_INSTRUMENT_MAP[instrumentName];  │
│                                                             │
│        midiTrack.setInstrument(program);                   │
│      }                                                      │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────────┐
│ Result: MIDI file with correct program changes             │
│                                                             │
│    Track 1: Program 40 (Violin)                            │
│    Track 2: Program 42 (Cello)                             │
│                                                             │
│    When imported into DAW:                                 │
│    ✅ Automatically loads violin and cello sounds          │
└─────────────────────────────────────────────────────────────┘
```

---

## Package Dependency Graph

```
┌─────────────────────────────────────────────────────────────┐
│                    @contour/core                            │
│                                                             │
│  Dependencies: NONE ✅                                      │
│                                                             │
│  Exports:                                                   │
│  - Pattern, Voice, Track, Composition                      │
│  - Branded types (Hz, BPM, Seconds, etc.)                  │
│  - PatternBuilder, MiniNotation                            │
└─────────────────────────────────────────────────────────────┘
                        ↓ (depends on)
┌─────────────────────────────────────────────────────────────┐
│                 @contour/tone-adapter                       │
│                                                             │
│  Dependencies:                                              │
│  - tone (existing)                                          │
│  - sf2-parser (NEW) ⭐                                      │
│                                                             │
│  Exports:                                                   │
│  - MusicalSynth (existing)                                 │
│  - MusicalSampler (NEW)                                    │
│  - SampleLibraryManager (NEW)                              │
│  - SoundFontLoader (NEW)                                   │
│  - CompositionScheduler (modified)                         │
└─────────────────────────────────────────────────────────────┘
                        ↓ (depends on)
┌─────────────────────────────────────────────────────────────┐
│                 @contour/playground                         │
│                                                             │
│  Dependencies:                                              │
│  - @contour/core                                           │
│  - @contour/tone-adapter                                   │
│  - monaco-editor                                            │
│                                                             │
│  Adds:                                                      │
│  - InstrumentSelector (NEW)                                │
│  - Updated main.ts (toggle button)                         │
│  - Updated performance.ts (grid support)                   │
└─────────────────────────────────────────────────────────────┘

Bundle size impact:
- @contour/core: 0 KB (no changes)
- @contour/tone-adapter: +20 KB (sf2-parser)
- @contour/playground: +5 KB (UI component)
Total: +25 KB (~5% increase)
```

---

## Type System Integration

```typescript
// @contour/core/src/types/brands.ts
// No changes needed! Still just a string
type InstrumentReference = string & { __brand: 'InstrumentReference' };

// But now supports two formats:

// Format 1: Simple synth name
type SynthInstrument = 'synth' | 'polySynth' | 'fmSynth';

// Format 2: Qualified sample library reference
type QualifiedInstrument = `${string}:${string}`;
//                           ^^^^^^^^  ^^^^^^^^
//                           Library   Instrument

// Examples:
const synth: InstrumentReference = 'synth';                     // ✅ Valid
const piano: InstrumentReference = 'FluidR3:AcousticGrandPiano'; // ✅ Valid
const invalid: InstrumentReference = 'synth:WithColon';         // ⚠️ Allowed (runtime check)

// Runtime validation in SampleLibraryManager:
getInstrument(name: InstrumentReference): MusicalSampler {
  if (!name.includes(':')) {
    throw new Error('Not a qualified instrument name');
  }
  const [library, instrument] = name.split(':');
  // ...
}
```

---

## JSON Serialization

```typescript
// Compositions remain fully JSON-serializable!

const composition = {
  name: 'My Song',
  tempo: 120,
  timeSignature: { numerator: 4, denominator: 4 },
  tracks: [
    {
      name: 'Piano',
      voices: [
        {
          pattern: {
            events: [
              { type: 'note', note: { name: 'C4', pitch: 60 }, time: 0, duration: 0.5 },
              // ...
            ]
          },
          instrument: 'FluidR3:AcousticGrandPiano'  // ✅ Just a string!
        }
      ]
    }
  ]
};

// Save to file
await fs.writeFile('song.json', JSON.stringify(composition, null, 2));

// Load and play (as long as library is loaded)
const loaded = JSON.parse(await fs.readFile('song.json', 'utf-8'));
const comp = Composition.fromJSON(loaded);

// User must ensure library is loaded before playback:
await sampleManager.loadLibrary({
  name: 'FluidR3',
  format: 'soundfont',
  url: '...'
});

scheduler.setSampleLibraryManager(sampleManager);
scheduler.scheduleComposition(comp);  // ✅ Works!
```

---

## Summary

**Key Integration Points:**

1. **Zero core changes** - `@contour/core` remains dependency-free
2. **Layer 2 extension** - Sample libraries added to `@contour/tone-adapter`
3. **String-based references** - `Voice.instrument` stays as string (JSON-serializable)
4. **Scheduler intelligence** - Detects qualified names and routes to appropriate instrument
5. **Plugin compatibility** - MIDI/Audio renderers work automatically
6. **Playground ready** - Toggle component enables live demo

**Bundle Impact:**
- Total increase: ~25 KB (+5%)
- Only affects users who `import` sample library features
- Core users unaffected (tree-shaking removes unused code)

**Implementation Time:**
- Phase 1 (Core): 1-2 days
- Phase 2 (Manager): 1-2 days
- Phase 3 (Playground): 1 day
- Phase 4 (Docs): 1 day
- Phase 5 (Polish): 1 day
- **Total: 5-7 days**

See [SAMPLE_LIBRARY_SPEC.md](SAMPLE_LIBRARY_SPEC.md) and [SAMPLE_LIBRARY_INTEGRATION_SUMMARY.md](SAMPLE_LIBRARY_INTEGRATION_SUMMARY.md) for complete details.
