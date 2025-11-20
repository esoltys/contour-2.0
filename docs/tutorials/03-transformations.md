# Tutorial Part 3: Transformations

Learn how to transform patterns using functional operations, combine patterns with algebra, and generate rhythms with the Euclidean algorithm.

**Previous:** [Part 2: Mini-Notation](02-notation.md)
**Next:** [Part 4: Compositions](04-composition.md)

---

## Pattern Transformations

Patterns are immutable, but you can create *transformed* versions. This is where Contour gets powerful.

### Transpose

Move all notes up or down by semitones:

```typescript
const melody = pattern().fromNotation('C4 E4 G4').build();

const higher = melody.transpose(5);    // Up 5 semitones (perfect 4th)
const lower = melody.transpose(-12);   // Down an octave
```

Common intervals:
- `1` - semitone
- `2` - whole tone
- `5` - perfect 4th
- `7` - perfect 5th
- `12` - octave
- `-12` - octave down

### Fast and Slow

Change the speed of a pattern:

```typescript
const pattern = pattern().fromNotation('C4 E4 G4 C5').build();

const double = pattern.fast(2);    // Twice as fast (half durations)
const half = pattern.slow(2);      // Half as fast (double durations)
const triple = pattern.fast(3);    // Three times as fast
```

This is perfect for creating variations:

```typescript
const melody = pattern().fromNotation('C4 E4 G4').build();

const verse = melody;              // Normal speed
const chorus = melody.fast(2);     // Energetic
const outro = melody.slow(2);      // Calm
```

### Retrograde (Reverse)

Play the pattern backwards:

```typescript
const ascending = pattern().fromNotation('C4 D E F G').build();
const descending = ascending.retrograde();
// → G4 F4 E4 D4 C4
```

Great for creating musical mirrors:

```typescript
const theme = pattern().fromNotation('C4 E G C5').build();
const answer = theme.retrograde().transpose(-5);
```

### Map (Transform Each Event)

Apply a function to each event:

```typescript
import { Velocity } from '@contour/core';

const pattern = pattern().fromNotation('C4 E4 G4 C5').build();

// Crescendo: gradually increase velocity
const crescendo = pattern.map((event, index) => ({
  ...event,
  velocity: Velocity(50 + index * 20)
}));

// Diminuendo: gradually decrease
const diminuendo = pattern.map((event, index, total) => ({
  ...event,
  velocity: Velocity(127 - (index / total) * 77)
}));
```

---

## Pattern Algebra

Now we get to the really fun stuff - combining patterns in different ways.

### Stack (Play Simultaneously)

Play two patterns at the same time:

```typescript
const melody = pattern().fromNotation('C4 E4 G4 C5').build();
const bass = pattern().fromNotation('C2@4').build();

const harmony = melody.stack(bass);
// Both play together
```

Create full chords:

```typescript
const root = pattern().fromNotation('C4@4').build();
const third = pattern().fromNotation('E4@4').build();
const fifth = pattern().fromNotation('G4@4').build();

const chord = root.stack(third).stack(fifth);
// Full C major chord
```

### Append (Play Sequentially)

Play one pattern after another:

```typescript
const phrase1 = pattern().fromNotation('C4 E4 G4').build();
const phrase2 = pattern().fromNotation('D4 F4 A4').build();

const melody = phrase1.append(phrase2);
// phrase1, then phrase2
```

Build longer melodies:

```typescript
const intro = pattern().fromNotation('C4 C4').build();
const verse = pattern().fromNotation('C4 E4 G4 E4').build();
const chorus = pattern().fromNotation('G4 G4 E4 C4').build();

const song = intro.append(verse).append(chorus);
```

### Palindrome

Play forward, then backward:

```typescript
const rising = pattern().fromNotation('C4 D E F G').build();
const arc = rising.palindrome();
// → C4 D4 E4 F4 G4 F4 E4 D4 C4

// Create wave-like melodies
const wave = pattern()
  .fromNotation('C4 E G C5')
  .build()
  .palindrome();
```

### Every (Conditional Transformation)

Apply a transformation every N cycles:

```typescript
const melody = pattern().fromNotation('C4 E4 G4 C5').build();

// Reverse every 4th repetition
const varied = melody.every(4, p => p.retrograde());

// Transpose every 2nd repetition
const alternating = melody.every(2, p => p.transpose(7));

// Combine multiple transformations
const complex = melody
  .every(3, p => p.retrograde())
  .every(4, p => p.transpose(5));
```

This creates evolving, algorithmic patterns perfect for live coding!

### Combining Operations

The real power comes from chaining operations:

```typescript
const theme = pattern().fromNotation('C4 E4 G4').build();

// Create a complex variation
const variation = theme
  .transpose(5)           // Up a 4th
  .fast(2)                // Double speed
  .palindrome()           // Forward and back
  .append(theme.slow(2)); // Add slow version

// Harmony and rhythm
const melody = pattern().fromNotation('C4 E4 G4 C5').build();
const bass = pattern().fromNotation('C2@4').build();

const full = melody
  .stack(bass)            // Add bass
  .every(4, p => p.retrograde()) // Vary every 4th cycle
  .fast(1.5);             // Speed up
```

---

## Euclidean Rhythms

Euclidean rhythms are a mathematical way to generate interesting, "musical" rhythms. They distribute N pulses as evenly as possible across M steps.

### Basic Euclidean Patterns

```typescript
// 5 pulses in 16 steps - classic clave rhythm
const clave = Pattern.euclidean(16, 5);
// X . . X . . X . . X . . X . . .

// 3 pulses in 8 steps - Tresillo pattern
const tresillo = Pattern.euclidean(8, 3);
// X . . X . . X .

// 5 pulses in 8 steps - Cinquillo pattern
const cinquillo = Pattern.euclidean(8, 5);
// X . X . X . X X
```

Visualizing the pattern:

```typescript
const rhythm = Pattern.euclidean(16, 5);
const viz = rhythm.events
  .map(e => e.type === 'note' ? 'X' : '.')
  .join(' ');
console.log(viz);
// → X . . X . . X . . X . . X . . .
```

### Rotation

Shift the pattern by N steps:

```typescript
const original = Pattern.euclidean(8, 3, 0);  // No rotation
const rotated = Pattern.euclidean(8, 3, 2);   // Rotate 2 steps

console.log('Original:', visualize(original));
// → X . . X . . X .

console.log('Rotated:', visualize(rotated));
// → . X . . X . . X
```

### Musical Applications

Euclidean rhythms are great for:

**Drum patterns:**
```typescript
const kick = Pattern.euclidean(16, 4);     // 4-on-floor
const snare = Pattern.euclidean(16, 3, 8); // Off-beat snares
const hihat = Pattern.euclidean(16, 11);   // Dense hi-hats

const drums = kick
  .stack(snare.transpose(2))   // Different pitch
  .stack(hihat.transpose(4));  // Higher pitch
```

**Melodic sequences:**
```typescript
const rhythm = Pattern.euclidean(16, 9);
const melody = rhythm.map((event, i) => ({
  ...event,
  pitch: 60 + (i % 7) * 2  // Scale-based pitches
}));
```

**Polyrhythms:**
```typescript
const rhythm3 = Pattern.euclidean(16, 3);  // 3 against 16
const rhythm5 = Pattern.euclidean(16, 5);  // 5 against 16
const rhythm7 = Pattern.euclidean(16, 7);  // 7 against 16

const polyrhythm = rhythm3
  .stack(rhythm5.transpose(7))   // Perfect 5th
  .stack(rhythm7.transpose(12)); // Octave
```

### Combining with Transformations

```typescript
const euclidean = Pattern.euclidean(16, 7);

// Create variations
const verse = euclidean;
const chorus = euclidean.fast(2);
const bridge = euclidean.retrograde();

// Add melody
const melodic = euclidean.map((event, i) => ({
  ...event,
  pitch: [60, 64, 67, 72][i % 4]  // Arpeggiated chord
}));
```

---

**Next:** [Part 4: Compositions](04-composition.md) - Build multi-track compositions and export your music
