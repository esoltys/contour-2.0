# Tutorial Part 1: Basics

Learn the fundamentals of Contour: creating your first sounds, understanding core concepts, and building patterns.

**Contents:**
- [Hello World: Your First Sound](#hello-world-your-first-sound)
- [Understanding Core Concepts](#understanding-core-concepts)
- [Building Patterns](#building-patterns)

**Next:** [Part 2: Mini-Notation](02-notation.md)

---

## Hello World: Your First Sound

Let's start with the simplest possible example - making a single note play.

### Setup

First, make sure you have the project running:

```bash
cd contour-2.0
pnpm install
cd packages/playground
pnpm dev
```

Open http://localhost:3000 in your browser.

### Your First Note

Create a new file `my-first-composition.ts` in the `packages/playground/src` directory:

```typescript
import { Pattern, Voice, Composition, BPM } from '@contour/core';

// Create a single note: middle C
const pattern = new Pattern([
  {
    type: 'note',
    pitch: 60,        // MIDI note 60 = C4 (middle C)
    duration: 1,      // 1 beat long
    time: 0,          // Starts at beat 0
    velocity: 100     // Velocity (0-127)
  }
]);

// Wrap it in a Voice with a synth
const voice = new Voice(pattern, 'synth');

// Create a composition at 120 BPM
const composition = new Composition([voice], BPM(120));

// Play it!
await composition.play();
```

Congratulations! You've just created your first Contour composition.

### Understanding What Happened

1. **Pattern** - A collection of musical events (notes, chords, rests)
2. **Voice** - A pattern plus an instrument
3. **Composition** - One or more voices, with a tempo

Think of it like this:
- **Pattern** = the sheet music
- **Voice** = an instrument playing that music
- **Composition** = the complete performance

---

## Understanding Core Concepts

Before we dive deeper, let's understand Contour's fundamental building blocks.

### Events

Everything in Contour is an event. There are three types:

```typescript
// 1. Note event
{
  type: 'note',
  pitch: 60,        // MIDI pitch (60 = C4)
  duration: 0.5,    // How long it plays
  time: 0,          // When it starts
  velocity: 100     // How loud (0-127)
}

// 2. Chord event
{
  type: 'chord',
  notes: [
    { name: 'C4', pitch: 60 },
    { name: 'E4', pitch: 64 },
    { name: 'G4', pitch: 67 }
  ],
  duration: 1,
  time: 0,
  velocity: 80
}

// 3. Rest event
{
  type: 'rest',
  duration: 0.5,
  time: 1
}
```

### Branded Types: Type Safety for Music

Contour uses TypeScript's type system to prevent common mistakes:

```typescript
import { Hz, BPM, Seconds } from '@contour/core';

const frequency = Hz(440);      // Type: Hz
const tempo = BPM(120);          // Type: BPM
const duration = Seconds(2.5);   // Type: Seconds

// This won't compile - you can't mix units!
// const wrong = frequency + tempo;  ❌ Type error!
```

This prevents bugs like accidentally using Hz where BPM is expected.

### Immutability: Patterns Never Change

In Contour, patterns are immutable - they never change. Every transformation creates a *new* pattern:

```typescript
const original = pattern().fromNotation('C4 E4 G4').build();
const transposed = original.transpose(5);  // Creates NEW pattern

console.log(original.events[0].pitch);     // Still 60 (C4)
console.log(transposed.events[0].pitch);   // 65 (F4)
```

This is crucial for:
- **Hot-reload** - Your original patterns stay intact
- **Live coding** - You can experiment without breaking things
- **Debugging** - Patterns don't mysteriously change

---

## Building Patterns

There are several ways to create patterns. Let's explore them from simple to powerful.

### Method 1: Direct Construction

The most explicit way:

```typescript
const pattern = new Pattern([
  { type: 'note', pitch: 60, duration: 0.5, time: 0, velocity: 100 },
  { type: 'note', pitch: 64, duration: 0.5, time: 0.5, velocity: 100 },
  { type: 'note', pitch: 67, duration: 0.5, time: 1.0, velocity: 100 },
]);
```

This works, but it's verbose and error-prone.

### Method 2: PatternBuilder (Fluent API)

A more readable approach using method chaining:

```typescript
import { pattern, Durations, C, E, G } from '@contour/core';

const melody = pattern()
  .note(C('4'), Durations.quarter)
  .note(E('4'), Durations.quarter)
  .note(G('4'), Durations.quarter)
  .build();
```

The `pattern()` function creates a builder, and `build()` creates the final Pattern.

#### Common Durations

```typescript
import { Durations } from '@contour/core';

Durations.whole      // 4 beats
Durations.half       // 2 beats
Durations.quarter    // 1 beat
Durations.eighth     // 0.5 beats
Durations.sixteenth  // 0.25 beats
```

#### Note Helper Functions

Instead of remembering MIDI numbers:

```typescript
import { C, D, E, F, G, A, B } from '@contour/core';

const scale = pattern()
  .note(C('4'), Durations.quarter)  // Middle C
  .note(D('4'), Durations.quarter)
  .note(E('4'), Durations.quarter)
  .note(F('4'), Durations.quarter)
  .note(G('4'), Durations.quarter)
  .note(A('4'), Durations.quarter)
  .note(B('4'), Durations.quarter)
  .note(C('5'), Durations.quarter)  // High C
  .build();
```

Sharps and flats work too:

```typescript
import { Cs, Eb, Fs } from '@contour/core';

const melody = pattern()
  .note(Cs('4'), Durations.quarter)  // C#4
  .note(Eb('4'), Durations.quarter)  // Eb4
  .note(Fs('4'), Durations.quarter)  // F#4
  .build();
```

### Method 3: Array Shorthand

The simplest way for simple melodies:

```typescript
const melody = pattern(['C4', 'E4', 'G4', 'C5']);
```

This creates quarter notes by default. Super concise!

---

**Next:** [Part 2: Mini-Notation](02-notation.md) - Learn the concise pattern syntax
