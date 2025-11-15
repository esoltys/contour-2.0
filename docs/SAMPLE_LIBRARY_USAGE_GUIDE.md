# Sample Library Usage Guide

**Phase 1 Implementation Complete** ✅

This guide shows you how to use sampled instruments in Contour compositions using the Phase 1 sample library integration.

## Quick Start (5 minutes)

### 1. Install Dependencies

The sample library integration is built into `@contour/tone-adapter` (no additional dependencies needed in your project):

```bash
npm install @contour/core @contour/tone-adapter
```

### 2. Basic Usage

```typescript
import {
  Composition,
  Track,
  Voice,
  PatternBuilder,
  Note,
  BPM,
} from '@contour/core';
import {
  CompositionScheduler,
  SampleLibraryManager,
  GMInstrument,
  SoundfontLibrary,
  createQualifiedName,
  Tone,
} from '@contour/tone-adapter';

// Initialize sample library manager
const sampleManager = new SampleLibraryManager();
await sampleManager.initialize(Tone.getContext().rawContext);

// Create a pattern
const pattern = new PatternBuilder()
  .addNote(Note.fromName('C4'), 0.5)
  .addNote(Note.fromName('E4'), 0.5)
  .addNote(Note.fromName('G4'), 1.0)
  .build();

// Create a voice with a SAMPLED instrument (note the qualified name)
const voice = new Voice(
  pattern,
  'MusyngKite:acoustic_grand_piano' // ← Qualified name = sampled instrument
);

// Create composition
const composition = new Composition('My Song', BPM(120))
  .addTrack(new Track('Piano', [voice]));

// Schedule with sample library manager
const scheduler = new CompositionScheduler();
scheduler.setSampleLibraryManager(sampleManager); // ← Required!
await scheduler.scheduleComposition(composition); // ← Must await!

// Play
await scheduler.start();
```

## Instrument Names

### Qualified Names (Sampled Instruments)

Use the format `'Library:Instrument'`:

```typescript
// Format: 'LibraryName:InstrumentName'
const sampledPiano = new Voice(pattern, 'MusyngKite:acoustic_grand_piano');
const sampledViolin = new Voice(pattern, 'FluidR3_GM:violin');
const sampledTrumpet = new Voice(pattern, 'MusyngKite:trumpet');
```

### Simple Names (Tone.js Synths)

Use plain names without `:`:

```typescript
// Simple names use Tone.js synthesizers
const synthVoice = new Voice(pattern, 'synth');
const bassVoice = new Voice(pattern, 'bass');
```

### Type-Safe Names (Recommended)

Use the `GMInstrument` enum and `createQualifiedName()` for autocomplete:

```typescript
import { GMInstrument, SoundfontLibrary, createQualifiedName } from '@contour/tone-adapter';

// Type-safe with autocomplete!
const qualifiedName = createQualifiedName(
  SoundfontLibrary.MusyngKite,
  GMInstrument.AcousticGrandPiano
);
// Result: 'MusyngKite:acoustic_grand_piano'

const voice = new Voice(pattern, qualifiedName);
```

## Available Instruments

### Soundfont Libraries

Three libraries are available via CDN:

```typescript
enum SoundfontLibrary {
  MusyngKite = 'MusyngKite',     // High-quality (recommended)
  FluidR3GM = 'FluidR3_GM',       // Open-source
  FatBoy = 'FatBoy',              // Alternative
}
```

### General MIDI Instruments

All 128 General MIDI instruments available via `GMInstrument` enum:

```typescript
// Pianos (0-7)
GMInstrument.AcousticGrandPiano
GMInstrument.BrightAcousticPiano
GMInstrument.ElectricGrandPiano
// ... 5 more

// Strings (40-47)
GMInstrument.Violin
GMInstrument.Viola
GMInstrument.Cello
GMInstrument.Contrabass
// ... 4 more

// Brass (56-63)
GMInstrument.Trumpet
GMInstrument.Trombone
GMInstrument.Tuba
GMInstrument.FrenchHorn
// ... 4 more

// And 104 more instruments!
```

See `packages/tone-adapter/src/samples/types.ts` for the complete list.

## Common Patterns

### Pattern 1: Mix Samples and Synths

```typescript
// Sampled piano for melody
const piano = new Voice(
  melodyPattern,
  'MusyngKite:acoustic_grand_piano'
);

// Tone.js synth for bass
const bass = new Voice(
  bassPattern,
  'synth'
);

const composition = new Composition('Hybrid', BPM(120))
  .addTrack(new Track('Piano', [piano]))
  .addTrack(new Track('Bass', [bass]));
```

### Pattern 2: Multiple Sampled Instruments

```typescript
const piano = new Voice(pattern1, 'MusyngKite:acoustic_grand_piano');
const violin = new Voice(pattern2, 'MusyngKite:violin');
const cello = new Voice(pattern3, 'MusyngKite:cello');

const composition = new Composition('Orchestra', BPM(90))
  .addTrack(new Track('Piano', [piano]))
  .addTrack(new Track('Violin', [violin]))
  .addTrack(new Track('Cello', [cello]));
```

### Pattern 3: Different Libraries

```typescript
// Use MusyngKite for piano
const piano = new Voice(pattern, 'MusyngKite:acoustic_grand_piano');

// Use FluidR3_GM for strings
const strings = new Voice(pattern, 'FluidR3_GM:string_ensemble_1');

// Both work together!
```

### Pattern 4: Reusing Sample Library Manager

```typescript
// Create once
const sampleManager = new SampleLibraryManager();
await sampleManager.initialize(Tone.getContext().rawContext);

// Use for multiple schedulers
const scheduler1 = new CompositionScheduler();
scheduler1.setSampleLibraryManager(sampleManager);

const scheduler2 = new CompositionScheduler();
scheduler2.setSampleLibraryManager(sampleManager); // Same manager!
```

## API Reference

### SampleLibraryManager

```typescript
class SampleLibraryManager {
  // Initialize with AudioContext
  async initialize(audioContext: AudioContext): Promise<void>

  // Load a specific instrument (usually automatic)
  async loadInstrument(config: SampleLibraryConfig): Promise<SoundfontInstrument>

  // Load by qualified name
  async loadInstrumentByQualifiedName(
    qualifiedName: QualifiedInstrumentName,
    format?: 'mp3' | 'ogg'
  ): Promise<SoundfontInstrument>

  // Get loaded instrument or load if needed
  async getInstrumentByQualifiedName(
    qualifiedName: QualifiedInstrumentName,
    format?: 'mp3' | 'ogg'
  ): Promise<SoundfontInstrument>

  // Check if loaded
  isLoaded(name: string): boolean

  // Get loaded instrument names
  getLoadedInstruments(): string[]

  // Clean up
  dispose(): void
}
```

### CompositionScheduler (Updated)

```typescript
class CompositionScheduler {
  // NEW: Set sample library manager (required for sampled instruments)
  setSampleLibraryManager(manager: SampleLibraryManager): void

  // UPDATED: Now async to handle instrument loading
  async scheduleComposition(
    composition: Composition,
    startTime?: Seconds
  ): Promise<void>

  // Existing methods unchanged
  async start(): Promise<void>
  stop(): void
  pause(): void
  dispose(): void
  // ...
}
```

### Helper Functions

```typescript
// Create qualified name with type safety
function createQualifiedName(
  library: SoundfontLibrary | string,
  instrument: GMInstrument | string
): QualifiedInstrumentName

// Parse qualified name
function parseQualifiedName(qualifiedName: string): {
  library: string;
  instrument: string;
} | null

// Check if name is qualified (contains ':')
function isQualifiedName(name: string): boolean
```

## Performance Considerations

### Loading Times

- **First load**: 200-500ms per instrument (downloads from CDN)
- **Cached**: Instant (instruments cached in SampleLibraryManager)
- **Network**: Requires internet connection (CDN-hosted)

### Memory Usage

- **Per instrument**: ~5-10 MB
- **Multiple instruments**: Additive (3 instruments ≈ 15-30 MB)
- **Disposal**: Call `sampleManager.dispose()` to free memory

### Best Practices

1. **Initialize once**: Create one `SampleLibraryManager` and reuse it
2. **Preload if needed**: Manually load instruments before scheduling if needed
3. **Dispose properly**: Always call `dispose()` when done
4. **Use appropriate quality**: Default `mp3` format is good balance

## Troubleshooting

### Error: "Sample library manager not configured"

**Cause**: Forgot to call `setSampleLibraryManager()`

**Fix**:
```typescript
const scheduler = new CompositionScheduler();
scheduler.setSampleLibraryManager(sampleManager); // ← Add this!
await scheduler.scheduleComposition(composition);
```

### Error: "Instrument not loaded"

**Cause**: Instrument name typo or not awaiting async methods

**Fix**:
```typescript
// Make sure to await!
await scheduler.scheduleComposition(composition); // ← await is critical

// Check instrument name spelling
const correct = 'MusyngKite:acoustic_grand_piano';
const wrong = 'MusyngKite:piano'; // ✗ Wrong instrument name
```

### Error: "AudioContext not initialized"

**Cause**: Forgot to initialize SampleLibraryManager

**Fix**:
```typescript
const sampleManager = new SampleLibraryManager();
await sampleManager.initialize(Tone.getContext().rawContext); // ← Add this!
```

### No Sound

**Possible causes:**

1. **Browser autoplay policy**: Call `await Tone.start()` after user gesture
2. **Not started**: Call `await scheduler.start()`
3. **Volume too low**: Check `Tone.getDestination().volume.value`

**Fix**:
```typescript
// After a button click or user interaction:
await Tone.start(); // Required by browsers
await scheduler.scheduleComposition(composition);
await scheduler.start(); // Start playback
```

### Slow Loading

**Cause**: Network latency downloading samples from CDN

**Options:**
1. **Accept the delay**: First load is always slower (200-500ms)
2. **Preload**: Load instruments before scheduling
3. **Show loading indicator**: Display progress to user
4. **Use local server**: Host soundfont files locally (advanced)

## Migration Guide

### From Tone.js Synths to Sampled Instruments

**Before (Tone.js synth):**
```typescript
const voice = new Voice(pattern, 'synth');
```

**After (sampled instrument):**
```typescript
// Add sample library manager
const sampleManager = new SampleLibraryManager();
await sampleManager.initialize(Tone.getContext().rawContext);

// Use qualified name
const voice = new Voice(pattern, 'MusyngKite:acoustic_grand_piano');

// Pass to scheduler
scheduler.setSampleLibraryManager(sampleManager);
```

### From Prototype to Production

If you used the prototype (`packages/playground/prototype-samples.html`):

**Prototype code:**
```typescript
const instrument = await manager.loadInstrument({
  instrument: 'acoustic_grand_piano',
  soundfont: 'MusyngKite'
});
instrument.play('C4', audioContext.currentTime, { duration: 1, gain: 0.8 });
```

**Production code:**
```typescript
const voice = new Voice(pattern, 'MusyngKite:acoustic_grand_piano');
const composition = new Composition('Song', BPM(120))
  .addTrack(new Track('Piano', [voice]));

const scheduler = new CompositionScheduler();
scheduler.setSampleLibraryManager(sampleManager);
await scheduler.scheduleComposition(composition);
await scheduler.start();
```

## Examples

See working examples in:

- **`examples/sample-library-demo/`** - Simple melody and chord progression demos
- **`examples/bach-invention-4/`** - Can be modified to use sampled piano
- **`packages/playground/`** - Interactive demos (coming soon)

## Next Steps

- ✅ Phase 1 complete (TypeScript types, Tone.js wrapper, CompositionScheduler integration)
- ⏳ Phase 2: Playground UI integration (toggle button)
- ⏳ Phase 3: Additional features (velocity layers, custom samples)
- ⏳ Phase 4: Performance optimizations

## Learn More

- **Technical Specification**: `docs/SAMPLE_LIBRARY_SPEC.md`
- **Prototype Findings**: `docs/SAMPLE_LIBRARY_PROTOTYPE_FINDINGS.md`
- **Architecture Guide**: `docs/ARCHITECTURE_GUIDE.md`
- **Type Definitions**: `packages/tone-adapter/src/samples/types.ts`

## Feedback

Found a bug or have a feature request? Please open an issue on the project repository.
