# Tutorial Part 2: Mini-Notation

Learn Contour's concise pattern syntax inspired by TidalCycles - create complex patterns with minimal code.

**Previous:** [Part 1: Basics](01-basics.md)
**Next:** [Part 3: Transformations](03-transformations.md)

---

## Mini-Notation: The Concise Way

Mini-notation is Contour's secret weapon for rapid pattern creation. It's inspired by TidalCycles and makes complex patterns incredibly concise.

### Basic Syntax

```typescript
// Simple notes separated by spaces
pattern().fromNotation('C4 E4 G4 C5').build();

// Equivalent to:
pattern()
  .note(C('4'), Durations.quarter)
  .note(E('4'), Durations.quarter)
  .note(G('4'), Durations.quarter)
  .note(C('5'), Durations.quarter)
  .build();
```

### Repetition with `*`

```typescript
// Repeat a note
pattern().fromNotation('C4*4').build();
// → C4 C4 C4 C4

// Four kick drums
pattern().fromNotation('C2*4').build();
```

### Rests with `~`

```typescript
// Rest is represented by tilde
pattern().fromNotation('C4 ~ E4 ~').build();
// → Play C4, rest, play E4, rest

// Classic snare pattern (on beats 2 and 4)
pattern().fromNotation('~ C3 ~ C3').build();
```

### Subdivisions with `[ ]`

```typescript
// Subdivide a beat
pattern().fromNotation('C4 [E4 G4] C5').build();
// → C4 for 1 beat, then E4 and G4 split the next beat, then C5

// Complex rhythm
pattern().fromNotation('C4 [E4 G4 B4] [C5 D5]').build();
```

### Longer Notes with `@`

```typescript
// Hold a note longer
pattern().fromNotation('C4@2 E4 G4').build();
// → C4 held for 2 beats, then E4, then G4

// Bass note held for 4 beats
pattern().fromNotation('C2@4').build();
```

### Octave Persistence

Type the octave once, and it persists:

```typescript
// Instead of typing '4' every time:
pattern().fromNotation('C4 D4 E4 F4 G4').build();

// Just type it once:
pattern().fromNotation('C4 D E F G').build();
// → C4 D4 E4 F4 G4

// Change octaves when needed:
pattern().fromNotation('C4 D E F G A B C5 D E').build();
// → C4 D4 E4 F4 G4 A4 B4 C5 D5 E5
```

### Chord Symbols

Use chord symbols directly:

```typescript
// Jazz progression
pattern().fromNotation('Cmaj7 Dm7 G7 Cmaj7').build();

// Common chords
pattern().fromNotation('C E G').build();      // C major triad
pattern().fromNotation('Cmaj7 Fmaj7').build(); // Major 7th chords
pattern().fromNotation('Am Dm Em Am').build(); // Minor progression
```

### Combining Everything

```typescript
// Complex drum pattern
const drums = pattern()
  .fromNotation('C2*4 ~ [E3 G3] ~ C4@2 [G3*4]')
  .build();

// Melodic pattern with subdivisions and rests
const melody = pattern()
  .fromNotation('C4 [E4 G4] ~ C5@2 [D5 C5 B4] A4')
  .build();
```

---

**Next:** [Part 3: Transformations](03-transformations.md) - Transform patterns with functional operations
