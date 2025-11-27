# Lo-Fi Chill - Modern Lo-Fi Composition

A warm, laid-back lo-fi composition built with Contour, showcasing sampled instruments, effects processing, and multiple export formats.

## Features

- **Duration**: ~3 minutes (64 bars)
- **Tempo**: 72 BPM (relaxed lo-fi speed)
- **Key**: F major (warm, happy key)
- **Structure**: Intro → Verse 1 → Chorus → Verse 2 → Outro
- **Tracks**: 5 multi-layered tracks with sampled instruments and drums

## Composition Structure

### Musical Elements

#### 1. **Electric Piano (Rhodes)** - `MusyngKite:electric_piano_1`
Jazzy chord progression with 7th chords:
- Dm7 → Gm7 → Cmaj7 → Fmaj7
- Warm, vintage Rhodes sound
- 70% velocity for laid-back feel

#### 2. **Electric Bass (Finger)** - `MusyngKite:electric_bass_finger`
Smooth, walking bass line:
- Follows chord roots and fifths
- Syncopated rhythm for groove
- 65-75% velocity range for dynamics

#### 3. **Lo-Fi Drums** - Synthesized
Classic lo-fi beat:
- Kick (C1/MIDI 36)
- Snare (D1/MIDI 38)
- Closed Hi-Hat (F#1/MIDI 42)
- Simple 4/4 groove with slight variations

#### 4. **Vibraphone** - `MusyngKite:vibraphone`
Sparse, ambient melody:
- Melodic fragments over chord changes
- Rests for breathing room
- 55-65% velocity for subtle presence

#### 5. **Synth Pad** - Tone.js PolySynth
Atmospheric texture:
- Long sustained chords
- 40% velocity for background ambience
- Adds depth and space

### Structure Timeline

```
0:00 - 0:24  │ Intro       │ 16 bars │ Chords + Bass
0:24 - 1:15  │ A Section   │ 32 bars │ + Drums + Melody + Pads
1:15 - 2:06  │ B Section   │ 32 bars │ Melody transposed up 4th
2:06 - 2:57  │ A Section   │ 32 bars │ Return to original
2:57 - 3:17  │ Outro       │ 16 bars │ Chords + Bass fadeout
```

## Effects Chain

The composition features a professional effects chain:

1. **Lowpass Filter** (3kHz) - Adds warmth and vintage feel
2. **Reverb** (3s decay, 30% wet) - Creates ambient space
3. **Compressor** (-20dB threshold, 4:1 ratio) - Glues the mix together

## MIDI Track Mapping

When exported to MIDI, the tracks map to General MIDI instruments:

| Track | Name | GM Instrument | Channel | Notes |
|-------|------|---------------|---------|-------|
| 1 | Electric Piano (Rhodes) | 5 - Electric Piano 1 | 1 | Chord progressions |
| 2 | Electric Bass (Finger) | 34 - Electric Bass (finger) | 2 | Bass line |
| 3 | Lo-Fi Drums | Drums | 10 | GM Drum Kit |
| 4 | Vibraphone | 12 - Vibraphone | 4 | Melody |
| 5 | Synth Pad | 89 - Pad 2 (warm) | 5 | Ambient texture |

### MIDI Compatibility

The exported MIDI file is Standard MIDI File Format 1, compatible with:
- DAWs (Logic Pro, Ableton Live, FL Studio, Pro Tools, etc.)
- Notation software (Sibelius, Finale, MuseScore, etc.)
- Hardware synthesizers and samplers
- Online MIDI players

You can import the MIDI file and map it to your preferred instruments while maintaining the same structure and performance.

## Usage

### Browser Playback

1. **Start the dev server:**
   ```bash
   cd examples/lofi-chill
   pnpm dev
   ```

2. **Open in browser:**
   ```
   http://localhost:3003
   ```

3. **Controls:**
   - **Play** - Load and play the composition with sampled instruments
   - **Stop** - Stop playback
   - **Export MIDI** - Download as Standard MIDI File (.mid)
   - **Export WAV** - Render and download as WAV audio (.wav)

### Programmatic Usage

```typescript
import { playLoFiComposition, exportLoFiToMIDI, exportLoFiToWAV } from './lofi-composition.js';

// Play in browser
const result = await playLoFiComposition();
console.log(`Playing for ${result.duration} seconds`);

// Export to MIDI
const midiBlob = await exportLoFiToMIDI();
// ... save or download blob

// Export to WAV
const wavBlob = await exportLoFiToWAV();
// ... save or download blob
```

### Node.js Usage

Run directly from the terminal:

```bash
node lofi-composition.ts
```

This will play the composition and then exit when finished.

## Technical Implementation

### Patterns

The composition uses Contour's `PatternBuilder` API for creating musical patterns:

```typescript
const pattern = new PatternBuilder()
  .addChord([Note.fromName('D3'), Note.fromName('F3'), Note.fromName('A3')], 2.0)
  .addNote(Note.fromName('D2'), 1.0, Velocity(75))
  .build();
```

### Pattern Transformations

- **`.repeat(n)`** - Repeat pattern n times
- **`.transpose(semitones)`** - Transpose pattern by semitones
- **`.offset(beats)`** - Delay pattern start by beats
- **`.concat(pattern)`** - Combine patterns sequentially

### Sampled Instruments

Uses `SampleLibraryManager` with soundfont-player for realistic instruments:

```typescript
const sampleManager = new SampleLibraryManager();
await sampleManager.initialize(audioContext);

const qualifiedName = createQualifiedName(
  SoundfontLibrary.MusyngKite,
  GMInstrument.ElectricPiano1
);

const voice = new Voice(pattern, qualifiedName);
```

### Type Safety

All musical values use branded types for compile-time safety:

- `BPM(78)` - Tempo in beats per minute
- `Note.fromName('C4')` - Note with octave
- `Velocity(75)` - MIDI velocity (0-127)

## Files

- `lofi-composition.ts` - Main composition logic
- `index.html` - Browser UI for playback and export
- `vite.config.ts` - Vite configuration
- `package.json` - Dependencies
- `README.md` - This file

## Dependencies

- `@contour/core` - Core music primitives and patterns
- `@contour/tone-adapter` - Tone.js integration and scheduling
- `@contour/plugin-midi` - MIDI export renderer
- `@contour/plugin-audio` - WAV export renderer
- `tone` - Web Audio framework (v15.0+)

## Performance Notes

- **Loading time**: ~2-3 seconds (loads sampled instruments from CDN)
- **Memory usage**: ~30-50MB (includes loaded samples)
- **WAV rendering**: ~20-30 seconds for full composition
- **MIDI export**: <1 second (instant)

## Customization Ideas

### Change the Key

Transpose all patterns:

```typescript
const pattern = createChordProgression().build().transpose(2); // Up 2 semitones
```

### Adjust Tempo

Change BPM:

```typescript
const composition = new Composition('Lo-Fi Chill', BPM(85)); // Faster
```

### Swap Instruments

Try different GM instruments:

```typescript
const organ = createQualifiedName(
  SoundfontLibrary.MusyngKite,
  GMInstrument.DrawbarOrgan
);
```

### Add More Effects

Extend the effects chain:

```typescript
const delay = new Tone.FeedbackDelay('8n', 0.3);
const chorus = new Tone.Chorus(4, 2.5, 0.5);
// ... connect to chain
```

## License

Part of the Contour example collection. See repository LICENSE for details.

## Learn More

- [Contour Documentation](../../docs/TUTORIAL.md)
- [Sample Library Integration](../sample-library-demo/README.md)
- [Pattern Transformations Tutorial](../../docs/tutorials/03-transformations.md)
- [Composition Guide](../../docs/tutorials/04-composition.md)
