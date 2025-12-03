# Tutorial Part 5: Advanced

Master advanced musical effects and algorithmic composition techniques.

**Previous:** [Part 4: Compositions](04-composition.md)
**Next:** [Part 6: Reference](06-reference.md)

---

## Advanced Effects & Articulations

Contour includes professional-grade effects for musical expression. All effects are immutable, composable, and type-safe.

### Articulation: Staccato

Shorten note durations for crisp, detached notes:

```typescript
const melody = pattern().fromNotation('C4 E4 G4 C5').build();
const staccato = melody.staccato(0.5); // 50% duration (default)
const veryStaccato = melody.staccato(0.25); // Very short, percussive
```

### Articulation: Legato

Extend notes to overlap for smooth, connected phrasing:

```typescript
const smooth = melody.legato(); // Default 0.1 beat overlap
const verySmooth = melody.legato(0.2); // Pronounced legato
```

### Dynamics: Crescendo & Diminuendo

Shape volume dynamically across a phrase:

```typescript
// Gradual increase (pp → ff)
const crescendo = melody.crescendo(Velocity(40), Velocity(110));

// Gradual decrease (ff → pp)
const diminuendo = melody.diminuendo(Velocity(110), Velocity(40));

// Use defaults (current range to max/min)
const natural = melody.crescendo();
```

### Accent

Emphasize specific beats:

```typescript
// Accent beats 1 and 3
const accented = pattern.accent([0, 2], 20); // +20 velocity

// Accent using predicate
const syncopated = pattern.accent((i) => i % 4 === 0);
```

### Humanize

Add natural performance variations:

```typescript
const human = pattern.humanize({
  timing: 0.03,   // ±0.03 beats timing variation
  velocity: 12,   // ±12 velocity variation
  seed: 42        // Optional: reproducible randomness
});
```

### Swing

Create jazz/shuffle feel:

```typescript
const swung = pattern.swing(0.5);  // Triplet swing (default)
const shuffle = pattern.swing(0.3); // Subtle shuffle
const extreme = pattern.swing(0.8); // Heavy swing
```

### Tremolo

Rapid note repetition:

```typescript
const tremolo = pattern.tremolo(8); // 32nd notes (8 per beat)
const measured = pattern.tremolo(4, 2); // 16th notes for 2 beats
```

### Arpeggiate

Break chords into melodic sequences:

```typescript
const chords = pattern().fromNotation('Cmaj7 Fmaj7').build();

const ascending = chords.arpeggiate('up');
const descending = chords.arpeggiate('down');
const harp = chords.arpeggiate('updown'); // Like a harp glissando
const random = chords.arpeggiate('random'); // Generative
```

### Delay

Rhythmic echo effect:

```typescript
const delayed = pattern.delay(
  Duration(0.5),  // Delay time (beats)
  0.6,            // Feedback (0-1, how much it decays)
  0.5             // Mix (0-1, dry/wet balance)
);
```

### Combining Effects

Effects are composable - chain them for complex expression:

```typescript
const expressive = melody
  .legato(0.1)                           // Smooth
  .crescendo(Velocity(50), Velocity(100)) // Build intensity
  .accent([0, 4], 15)                    // Phrase accents
  .humanize({ timing: 0.02, velocity: 8 }) // Natural feel
  .delay(Duration(0.75), 0.4, 0.3);      // Ambient space
```

### Musical Examples

**Expressive Piano:**
```typescript
const pianoPhrase = pattern()
  .fromNotation('C4 D E F G ~ G F E D C')
  .build()
  .legato(0.12)                          // Piano-style legato
  .crescendo(Velocity(55), Velocity(95)) // Dynamic shape
  .accent([0, 4], 18)                    // Phrase accents
  .humanize({ timing: 0.025, velocity: 10 });
```

**Jazz Drums:**
```typescript
const jazzHiHat = pattern()
  .fromNotation('F#4*8') // 8 hi-hat hits
  .build()
  .swing(0.55)                    // Jazz swing
  .accent([0, 4], 12)             // Downbeat accents
  .accent(i => i % 2 === 1, -8)   // Ghost note upbeats
  .humanize({ timing: 0.015, velocity: 6 });
```

**Ambient Soundscape:**
```typescript
const ambient = pattern()
  .fromNotation('C4@4 G3@4 E4@4')
  .build()
  .legato(1.0)                        // Very smooth
  .diminuendo(Velocity(90), Velocity(40)) // Fade
  .delay(Duration(2.0), 0.7, 0.8);    // Long, spacey delay
```

---

## Advanced Topics

### Live Coding

Contour is designed for live coding - writing and modifying music in real-time. With hot-reload, you can hear changes instantly.

#### Hot-Reload Workflow

1. Start the dev server:
   ```bash
   cd packages/playground
   bun run dev
   ```

2. Create a composition file that exports patterns
3. Modify the code - changes apply instantly
4. Graceful audio transitions prevent clicks and pops

#### Example Live Coding Session

```typescript
// Start with something simple
export const melody = pattern()
  .fromNotation('C4 E4 G4')
  .build();

// Save and hear it...

// Now make it more interesting
export const melody = pattern()
  .fromNotation('C4 E4 G4 C5')
  .build()
  .fast(2)           // Try changing this to 3
  .every(4, p => p.retrograde()); // Experiment!

// Add a bassline
export const bass = pattern()
  .fromNotation('C2@4')
  .build();

export const full = melody.stack(bass);
```

#### Live Coding Tips

**Start simple, build up:**
```typescript
// Start
let pattern = pattern().fromNotation('C4').build();

// Add more notes
let pattern = pattern().fromNotation('C4 E4 G4').build();

// Add transformations
let pattern = pattern()
  .fromNotation('C4 E4 G4')
  .build()
  .fast(2);

// Add complexity
let pattern = pattern()
  .fromNotation('C4 E4 G4 C5')
  .build()
  .fast(2)
  .every(4, p => p.retrograde());
```

**Use variables for experimentation:**
```typescript
const speed = 2;        // Try 1, 2, 3, 4
const transpose = 7;    // Try 0, 5, 7, 12
const rotation = 2;     // Try 0, 1, 2, 3

export const pattern = Pattern.euclidean(16, 7, rotation)
  .fast(speed)
  .transpose(60 + transpose);
```

### Interactive Performance Grid

The performance grid lets you trigger patterns live:

```bash
cd packages/playground
bun run dev
# Open http://localhost:3000/playground.html
```

Features:
- **4x4 grid** of triggerable patterns
- **Live editing** with Monaco editor
- **16 preset patterns** (drums, bass, melody, effects)
- **Keyboard shortcuts** for hands-free performance

#### Keyboard Shortcuts

Pattern triggers:
```
1 2 3 4
Q W E R
A S D F
Z X C V
```

Transport controls:
- **Space** - Play/Pause
- **Esc** - Stop all
- **Cmd/Ctrl + D** - Toggle debug panel
- **Cmd/Ctrl + K** - Pattern playground

### Debug Tools

Press **Cmd/Ctrl + D** to open the debug panel with four tabs:

#### Transport Inspector
Monitor playback state in real-time:
```typescript
import { getTransportDebugger } from '@contour/tone-adapter';

const debugger = getTransportDebugger();

// Track events
const id = debugger.trackScheduledEvent('0:0:0', callback);

// Detect conflicts
const conflicts = debugger.detectConflicts();
conflicts.forEach(c => console.warn(c.message));

// Full report
debugger.printReport();
```

#### Pattern Inspector
Analyze patterns:
- View note sequences
- Inspect transformations
- Track pattern lifecycles

#### Performance Monitor
Track resource usage:
- CPU and memory
- AudioNode allocation
- Memory leak detection
- Frame rate and latency

#### Console Log
Filtered, real-time logging

### Algorithmic Composition

Generate music procedurally:

```typescript
// Random walk melody
function randomWalk(startPitch, steps, maxInterval = 3) {
  const notes = [startPitch];

  for (let i = 0; i < steps - 1; i++) {
    const interval = Math.floor(Math.random() * maxInterval * 2) - maxInterval;
    notes.push(notes[i] + interval);
  }

  return new Pattern(notes.map((pitch, i) => ({
    type: 'note',
    pitch,
    duration: 0.25,
    time: i * 0.25,
    velocity: 80
  })));
}

const melody = randomWalk(60, 16, 5);
```

**Markov chains:**
```typescript
const transitions = {
  'C4': ['E4', 'G4', 'A4'],
  'E4': ['C4', 'G4', 'D4'],
  'G4': ['C4', 'E4', 'F4'],
  // etc.
};

function markovMelody(start, length) {
  const notes = [start];

  for (let i = 0; i < length - 1; i++) {
    const current = notes[i];
    const options = transitions[current];
    const next = options[Math.floor(Math.random() * options.length)];
    notes.push(next);
  }

  return pattern(notes);
}
```

**Cellular automata:**
```typescript
function ruleToBeat(rule, cell) {
  // Rule 110, 30, etc.
  const next = [];
  for (let i = 0; i < cell.length; i++) {
    const left = cell[(i - 1 + cell.length) % cell.length];
    const center = cell[i];
    const right = cell[(i + 1) % cell.length];
    const index = (left << 2) | (center << 1) | right;
    next[i] = (rule >> index) & 1;
  }
  return next;
}

let cells = [1, 0, 0, 0, 1, 0, 0, 0];
const generations = 16;

for (let i = 0; i < generations; i++) {
  const rhythm = new Pattern(cells.map((cell, index) =>
    cell ?
      { type: 'note', pitch: 60, duration: 0.25, time: index * 0.25, velocity: 100 } :
      { type: 'rest', duration: 0.25, time: index * 0.25 }
  ));

  cells = ruleToBeat(110, cells);
}
```

### Microtonal Music

Go beyond 12-tone equal temperament:

```typescript
// Just intonation intervals (frequency ratios)
const justIntervals = [
  1,      // Root
  9/8,    // Major second
  5/4,    // Major third
  4/3,    // Perfect fourth
  3/2,    // Perfect fifth
  5/3,    // Major sixth
  15/8,   // Major seventh
  2       // Octave
];

const baseFreq = Hz(261.63); // C4

const justScale = new Pattern(
  justIntervals.map((ratio, i) => ({
    type: 'note',
    frequency: Hz(baseFreq * ratio),
    duration: 0.5,
    time: i * 0.5,
    velocity: 100
  }))
);
```

**Equal divisions:**
```typescript
// 19-tone equal temperament
const divisions = 19;
const octave = 2;

const scale19 = new Pattern(
  Array.from({ length: divisions }, (_, i) => ({
    type: 'note',
    frequency: Hz(440 * Math.pow(octave, i / divisions)),
    duration: 0.25,
    time: i * 0.25,
    velocity: 100
  }))
);
```

---


---

**Next:** [Part 6: Reference](06-reference.md) - Quick reference and tool comparisons
