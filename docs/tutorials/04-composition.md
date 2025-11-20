# Tutorial Part 4: Compositions

Learn how to build multi-track compositions and export your music to MIDI and audio files.

**Previous:** [Part 3: Transformations](03-transformations.md)
**Next:** [Part 5: Advanced](05-advanced.md)

---

## Creating Compositions

Now let's put everything together into full compositions.

### The Hierarchy

```
Composition
  └── Track (1 or more)
        └── Voice (1 or more)
              └── Pattern
```

- **Pattern** - Musical events (notes, chords, rests)
- **Voice** - Pattern + instrument
- **Track** - One or more voices (like a MIDI track)
- **Composition** - All tracks + tempo + metadata

### Simple Composition

```typescript
import { Composition, Track, Voice, pattern, BPM } from '@contour/core';

// 1. Create a pattern
const melody = pattern().fromNotation('C4 E4 G4 C5').build();

// 2. Create a voice with an instrument
const voice = new Voice(melody, 'synth');

// 3. Create a track
const track = new Track('Melody', [voice]);

// 4. Create a composition
const song = new Composition('My First Song', BPM(120))
  .addTrack(track);

// 5. Play it!
await song.play();
```

### Multi-Track Composition

```typescript
// Create multiple patterns
const melodyPattern = pattern().fromNotation('C4 E4 G4 C5 G4 E4').build();
const bassPattern = pattern().fromNotation('C2@2 F2@2 G2@2').build();
const drumPattern = Pattern.euclidean(16, 5);

// Create voices
const melodyVoice = new Voice(melodyPattern, 'piano');
const bassVoice = new Voice(bassPattern, 'bass');
const drumVoice = new Voice(drumPattern, 'drums');

// Create tracks
const melodyTrack = new Track('Melody', [melodyVoice]);
const bassTrack = new Track('Bass', [bassVoice]);
const drumTrack = new Track('Drums', [drumVoice]);

// Combine into composition
const song = new Composition('Full Band', BPM(120))
  .addTrack(melodyTrack)
  .addTrack(bassTrack)
  .addTrack(drumTrack);

await song.play();
```

### Multiple Voices Per Track

You can have multiple voices (instruments) in one track:

```typescript
// Two different synths playing different patterns
const synth1Pattern = pattern().fromNotation('C4 E4 G4').build();
const synth2Pattern = pattern().fromNotation('E4 G4 C5').build();

const voice1 = new Voice(synth1Pattern, 'synth1');
const voice2 = new Voice(synth2Pattern, 'synth2');

// Both voices in one track
const track = new Track('Synths', [voice1, voice2]);
```

### Counterpoint Example

Creating two independent melodic lines (like Bach):

```typescript
// Upper voice - melodic line 1
const upperLine = pattern()
  .fromNotation('D5 C# B4 A G F# E D')
  .build()
  .slow(0.5);  // Eighth notes

// Lower voice - melodic line 2 (starting later)
const lowerLine = pattern()
  .fromNotation('D4 E F# G A B C#5 D5')
  .build()
  .slow(0.5);

// Create voices
const soprano = new Voice(upperLine, 'flute');
const alto = new Voice(lowerLine, 'clarinet');

// Combine
const invention = new Composition('Two-Part Invention', BPM(100))
  .addTrack(new Track('Upper', [soprano]))
  .addTrack(new Track('Lower', [alto]));
```

### Dynamic Compositions

Use transformations to create variations:

```typescript
const theme = pattern().fromNotation('C4 E4 G4 C5').build();

// Verse: simple
const verseTrack = new Track('Verse', [
  new Voice(theme, 'piano')
]);

// Chorus: layered and fast
const chorusTrack = new Track('Chorus', [
  new Voice(theme.fast(2), 'synth'),
  new Voice(theme.transpose(7), 'synth'),
  new Voice(theme.transpose(-12), 'bass')
]);

// Build the song structure
const verse = new Composition('Verse', BPM(120)).addTrack(verseTrack);
const chorus = new Composition('Chorus', BPM(120)).addTrack(chorusTrack);

// Play verse, then chorus
await verse.play();
await chorus.play();
```

---

## Exporting Your Music

Contour can export to multiple formats using its plugin system.

### MIDI Export

Export your composition as a MIDI file:

```typescript
import { MIDIRenderer } from '@contour/plugin-midi';
import { writeFile } from 'fs/promises';

// Create your composition
const melody = pattern().fromNotation('C4 E4 G4 C5').build();
const voice = new Voice(melody, 'piano');
const track = new Track('Melody', [voice]);
const composition = new Composition('My Song', BPM(120)).addTrack(track);

// Initialize MIDI renderer
const renderer = new MIDIRenderer();
await renderer.initialize({
  format: 1,           // Format 1 = multi-track
  ticksPerBeat: 480    // High resolution
});

// Render to MIDI
const result = await renderer.render(composition);

// Write to file
await writeFile('my-song.mid', result.data);
console.log(`Exported ${result.data.length} bytes`);
console.log(`Track count: ${result.metadata.trackCount}`);

// Cleanup
await renderer.shutdown();
```

### Audio Export (WAV)

Export to audio format:

```typescript
import { AudioRenderer } from '@contour/plugins/audio';

const renderer = new AudioRenderer();
await renderer.initialize({
  format: 'wav',
  sampleRate: 44100,
  bitDepth: 16
});

const result = await renderer.render(composition);
await writeFile('my-song.wav', result.data);
```

### Plugin Registry

Use the plugin registry to manage multiple exporters:

```typescript
import { PluginRegistry } from '@contour/core';
import { MIDIRenderer } from '@contour/plugin-midi';

const registry = new PluginRegistry();

// Register plugins
const midiRenderer = new MIDIRenderer();
registry.register(midiRenderer);

// List registered plugins
for (const plugin of registry.getAll()) {
  console.log(`${plugin.name} v${plugin.version}`);
}

// Use a plugin
const renderer = registry.getPlugin('midi');
await renderer.initialize({});
const result = await renderer.render(composition);
```

### Complete Export Example

```typescript
async function exportComposition(composition, outputName) {
  const registry = new PluginRegistry();

  // Setup MIDI export
  const midiRenderer = new MIDIRenderer();
  registry.register(midiRenderer);

  await midiRenderer.initialize({
    format: 1,
    ticksPerBeat: 480
  });

  // Export
  const midiResult = await midiRenderer.render(composition);
  await writeFile(`${outputName}.mid`, midiResult.data);

  console.log(`✓ Exported MIDI: ${outputName}.mid`);
  console.log(`  Size: ${midiResult.data.length} bytes`);
  console.log(`  Tracks: ${midiResult.metadata.trackCount}`);

  await midiRenderer.shutdown();
}

// Usage
await exportComposition(mySong, 'my-composition');
```

---


---

**Next:** [Part 5: Advanced](05-advanced.md) - Master advanced effects and techniques
