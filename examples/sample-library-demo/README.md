# Sample Library Demo

This example demonstrates Contour's **Phase 1 Sample Library Integration**, which enables using sampled instruments from soundfont-player alongside Tone.js synthesizers.

## Features Demonstrated

✅ **Loading sampled instruments** from CDN-hosted soundfonts
✅ **Type-safe instrument selection** using GMInstrument enum
✅ **Mixing samples and synths** in the same composition
✅ **Qualified instrument names** (e.g., `'MusyngKite:acoustic_grand_piano'`)
✅ **Automatic instrument loading** via CompositionScheduler

## Quick Start

### Run the Demo

```bash
# From the root of the repository
cd examples/sample-library-demo
bun install
bun run play
```

### What You'll Hear

The demo creates two examples:

1. **Simple Melody** - A C major scale played twice:
   - **Sampled piano** (MusyngKite soundfont)
   - **Tone.js synth** (harmonized a fifth higher)

2. **Chord Progression** - C → Am → F → G:
   - **Sampled acoustic bass** (MusyngKite soundfont)

## Code Walkthrough

### Example 1: Using a Sampled Piano

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

// 1. Initialize the sample library manager
const sampleManager = new SampleLibraryManager();
await sampleManager.initialize(Tone.getContext().rawContext);

// 2. Create a melody pattern
const melody = new PatternBuilder()
  .addNote(Note.fromName('C4'), 0.5)
  .addNote(Note.fromName('D4'), 0.5)
  .addNote(Note.fromName('E4'), 0.5)
  // ... more notes
  .build();

// 3. Create a qualified instrument name (Library:Instrument)
const qualifiedName = createQualifiedName(
  SoundfontLibrary.MusyngKite,
  GMInstrument.AcousticGrandPiano
);
// Result: 'MusyngKite:acoustic_grand_piano'

// 4. Create a voice with the sampled instrument
const sampledVoice = new Voice(melody, qualifiedName);

// 5. Create composition
const composition = new Composition('My Song', BPM(120))
  .addTrack(new Track('Piano', [sampledVoice]));

// 6. Schedule with sample library manager
const scheduler = new CompositionScheduler();
scheduler.setSampleLibraryManager(sampleManager);
await scheduler.scheduleComposition(composition);

// 7. Play!
await scheduler.start();
```

### Example 2: Mixing Samples and Synths

```typescript
// Sampled piano voice
const sampledPiano = new Voice(
  melody,
  'MusyngKite:acoustic_grand_piano' // Qualified name → loads samples
);

// Tone.js synth voice (for comparison)
const synthVoice = new Voice(
  melody.transpose(7),
  'synth' // Simple name → uses Tone.js synth
);

// Both in the same composition!
const composition = new Composition('Hybrid', BPM(120))
  .addTrack(new Track('Sampled Piano', [sampledPiano]))
  .addTrack(new Track('Synth Harmony', [synthVoice]));
```

## Available Instruments

### Soundfont Libraries

- **MusyngKite** (default) - High-quality GM soundfont
- **FluidR3_GM** - Open-source GM soundfont
- **FatBoy** - Alternative GM soundfont

### General MIDI Instruments (via GMInstrument enum)

All 128 General MIDI instruments are available with full TypeScript autocomplete:

**Pianos:**
- `GMInstrument.AcousticGrandPiano`
- `GMInstrument.BrightAcousticPiano`
- `GMInstrument.ElectricGrandPiano`
- ... (8 piano types)

**Strings:**
- `GMInstrument.Violin`
- `GMInstrument.Viola`
- `GMInstrument.Cello`
- `GMInstrument.Contrabass`
- ... (8 string types)

**Brass:**
- `GMInstrument.Trumpet`
- `GMInstrument.Trombone`
- `GMInstrument.FrenchHorn`
- ... (8 brass types)

**And 104 more instruments!** See `packages/tone-adapter/src/samples/types.ts` for the complete list.

## How It Works

### Qualified Names

The system uses **qualified names** to distinguish between sampled instruments and Tone.js synths:

```
LibraryName:InstrumentName
    ↓           ↓
MusyngKite:acoustic_grand_piano
```

- **Contains `:`** → Load from sample library
- **No `:`** → Use Tone.js synth

### Automatic Loading

When you schedule a composition with a qualified name:

1. **CompositionScheduler** detects the `:` in the instrument name
2. **Checks** if SampleLibraryManager is configured (via `setSampleLibraryManager()`)
3. **Loads** the instrument from CDN via soundfont-player
4. **Wraps** it in MusicalSampler for Tone.js compatibility
5. **Connects** to the Tone.js routing system (enables effects!)
6. **Caches** the instrument for reuse

All of this happens automatically when you call `await scheduleComposition()`.

## Architecture

```
┌─────────────────────────────────────────────────┐
│ Your Code                                       │
│  Voice(pattern, 'MusyngKite:acoustic_...piano')│
└────────────────┬────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────┐
│ CompositionScheduler                            │
│  • Detects ':' in instrument name               │
│  • Calls SampleLibraryManager                   │
└────────────────┬────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────┐
│ SampleLibraryManager                            │
│  • Loads from soundfont-player                  │
│  • Returns SoundfontInstrument                  │
└────────────────┬────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────┐
│ MusicalSampler (Tone.js wrapper)                │
│  • Wraps soundfont-player instrument            │
│  • Connects to Tone.js routing                  │
│  • Enables effects chain                        │
└────────────────┬────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────┐
│ Tone.js / Web Audio API                         │
│  🔊 Audio Output                                │
└─────────────────────────────────────────────────┘
```

## Performance Notes

- **First load**: ~200-500ms per instrument (downloads from CDN)
- **Subsequent uses**: Instant (cached in SampleLibraryManager)
- **Memory**: ~5-10 MB per loaded instrument
- **Audio quality**: High-quality pre-rendered samples

## Type Safety

The integration is fully type-safe:

```typescript
// ✅ Valid - autocompletes available instruments
const piano = GMInstrument.AcousticGrandPiano;

// ✅ Valid - autocompletes available libraries
const lib = SoundfontLibrary.MusyngKite;

// ✅ Valid - type-safe qualified name
const name: QualifiedInstrumentName = createQualifiedName(lib, piano);

// ❌ Invalid - TypeScript error
const bad = GMInstrument.NotARealInstrument; // Type error!
```

## Troubleshooting

### "Sample library manager not configured"

Make sure to call `setSampleLibraryManager()` before scheduling:

```typescript
const scheduler = new CompositionScheduler();
scheduler.setSampleLibraryManager(sampleManager); // Don't forget this!
await scheduler.scheduleComposition(composition);
```

### "Instrument not loaded"

The instrument loads automatically when you schedule the composition. If you see this error, ensure:

1. You're using `await scheduler.scheduleComposition()` (not just `scheduler.scheduleComposition()`)
2. The instrument name is correct (check `GMInstrument` enum)
3. You have an internet connection (samples load from CDN)

### No sound / audio glitches

- Ensure you call `await Tone.start()` after a user gesture (browser requirement)
- Check that `await scheduler.start()` is called after scheduling
- Verify the SampleLibraryManager is initialized with the correct AudioContext

## Next Steps

- Try different instruments from the `GMInstrument` enum
- Mix multiple sampled instruments in one composition
- Add Tone.js effects (reverb, delay) to sampled instruments
- Export compositions with sampled instruments to MIDI
- Create your own musical examples!

## Related Examples

- **Bach Invention No. 4** (`examples/bach-invention-4/`) - Can use sampled piano
- **Playground** (`packages/playground/`) - Interactive demos (coming soon)

## Learn More

- **Technical Spec**: `docs/SAMPLE_LIBRARY_SPEC.md`
- **Prototype Findings**: `docs/SAMPLE_LIBRARY_PROTOTYPE_FINDINGS.md`
- **Architecture Guide**: `docs/ARCHITECTURE_GUIDE.md`
