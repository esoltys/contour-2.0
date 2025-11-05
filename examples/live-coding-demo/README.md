# Live Coding Demo - Contour Mini-Notation

This example showcases the powerful mini-notation system and pattern algebra introduced in Phase 6 of Contour.

## Features Demonstrated

### 1. **Mini-Notation Syntax**
Concise, expressive notation inspired by TidalCycles:

```typescript
// Before (verbose)
pattern()
  .note('C4', Durations.quarter)
  .note('E4', Durations.quarter)
  .note('G4', Durations.quarter)
  .build();

// After (mini-notation)
pattern().fromNotation('C4 E4 G4').build();
```

### 2. **Rhythm Patterns**
- **Repetition**: `C4*4` (repeat C4 four times)
- **Rests**: `C4 ~ E4` (C4, rest, E4)
- **Grouping**: `[E4 G4]` (subdivide into group)
- **Extension**: `C4@2` (hold C4 twice as long)
- **Duration**: `C4/8` (eighth note)

### 3. **Octave Persistence**
Type the octave once, it persists across notes:

```typescript
pattern().fromNotation('C4 D E F G A B C5').build();
// D, E, F, G, A, B are all in octave 4
```

### 4. **Chord Symbols**
Use chord symbols powered by Tonal.js:

```typescript
pattern().fromNotation('Cmaj7 Dm7 G7').build();
```

### 5. **Pattern Algebra**

```typescript
const p1 = pattern().fromNotation('C4 E4').build();
const p2 = pattern().fromNotation('G4 C5').build();

// Stack (simultaneous)
p1.stack(p2);

// Append (sequential)
p1.append(p2);

// Palindrome (forward + reverse)
p1.palindrome();
```

### 6. **Euclidean Rhythms**
Generate algorithmically interesting rhythms:

```typescript
// Distribute 5 pulses evenly across 16 steps
Pattern.euclidean(16, 5);

// With rotation
Pattern.euclidean(8, 3, 2);
```

## Running the Demo

```bash
# From the project root, install all dependencies first
pnpm install

# Navigate to the demo directory
cd examples/live-coding-demo

# Run the demo
pnpm start

# Run with hot-reload for live coding
pnpm dev
```

## Live Coding Experience

With hot-reload enabled (`pnpm dev`), you can modify patterns in `index.ts` and see results instantly. Try changing:

- Euclidean rhythm parameters
- Transpose values
- Pattern transformations (fast, slow, retrograde)
- Mini-notation strings

Example:

```typescript
// Original
const pattern = Pattern.euclidean(16, 5);

// Try modifying to
const pattern = Pattern.euclidean(16, 7); // Different rhythm!
```

## Pattern Examples

### Basic Drumbeat
```typescript
const kick = pattern().fromNotation('C2*4').build();
const snare = pattern().fromNotation('~ C3 ~ C3').build();
const hihat = pattern().fromNotation('C4*8').withDuration(Durations.eighth).build();

const drumbeat = kick.stack(snare).stack(hihat);
```

### Melodic Sequence
```typescript
const melody = pattern()
  .fromNotation('C4 [E4 G4] C5/8*2 ~')
  .build()
  .fast(2)
  .palindrome();
```

### Generative Rhythm
```typescript
const rhythm = Pattern.euclidean(16, 11)
  .fast(0.5)
  .transpose(36);
```

## Why This Matters

1. **Concise**: Write patterns 5-10x faster
2. **Readable**: Code looks rhythmic and musical
3. **Expressive**: Complex patterns in few lines
4. **Composable**: Combine transformations elegantly
5. **Live-codable**: Perfect for performance and experimentation

## Next Steps

- Try combining multiple patterns
- Experiment with different Euclidean rhythm distributions
- Create your own generative algorithms
- Build a live-coded composition!

## Resources

- [TidalCycles](https://tidalcycles.org/) - Original inspiration
- [Strudel](https://strudel.tidalcycles.org/) - JavaScript live coding
- [Euclidean Rhythms](https://en.wikipedia.org/wiki/Euclidean_rhythm) - The algorithm

---

**Happy Live Coding! 🎵**
