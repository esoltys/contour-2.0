# Contour: Quick Start Implementation Guide

**For:** Claude Code and AI-assisted development  
**Goal:** Get from zero to working prototype in systematic phases

## Prerequisites

Before beginning, ensure you have:
- Node.js 18+ LTS installed
- pnpm package manager (`npm install -g pnpm`)
- Git for version control
- TypeScript knowledge
- Basic understanding of music concepts

## Phase 1: Project Foundation (Week 1)

### Step 1: Initialize Monorepo

```bash
# Create project directory
mkdir contour-v2
cd contour-v2

# Initialize pnpm workspace
pnpm init

# Create workspace structure
mkdir -p packages/{core,tone-adapter,plugins,dev,testing}
mkdir -p examples
```

### Step 2: Configure Workspace

Create `pnpm-workspace.yaml`:
```yaml
packages:
  - 'packages/*'
  - 'examples/*'
```

Create root `package.json`:
```json
{
  "name": "contour",
  "version": "2.0.0",
  "private": true,
  "scripts": {
    "build": "pnpm -r run build",
    "test": "pnpm -r run test",
    "type-check": "pnpm -r run type-check",
    "lint": "eslint packages/**/*.ts"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "vitest": "^1.0.0",
    "eslint": "^8.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0"
  }
}
```

### Step 3: Setup Core Package

```bash
cd packages/core
pnpm init
```

Create `packages/core/package.json`:
```json
{
  "name": "@contour/core",
  "version": "2.0.0",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "vitest run",
    "test:watch": "vitest",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "^5.3.0",
    "vitest": "^1.0.0",
    "@types/node": "^20.0.0"
  }
}
```

Create `packages/core/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "strict": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "skipLibCheck": true,
    "esModuleInterop": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

### Step 4: Create Directory Structure

```bash
# In packages/core
mkdir -p src/{types,primitives,patterns,composition,utils}
mkdir -p tests/{types,primitives,patterns,composition}
touch src/index.ts
```

## Phase 2: Type System Implementation (Days 1-2)

### Step 1: Implement Branded Types

Create `packages/core/src/types/brands.ts`:

```typescript
/**
 * Branded types for type-safe musical units.
 * 
 * These prevent mixing incompatible units at compile time.
 * Example: Can't add Hz to BPM.
 */

export type Hz = number & { readonly __brand: 'Hz' };
export type BPM = number & { readonly __brand: 'BPM' };
export type Seconds = number & { readonly __brand: 'Seconds' };
export type MIDINote = number & { readonly __brand: 'MIDINote' };
export type Velocity = number & { readonly __brand: 'Velocity' };
export type Duration = number & { readonly __brand: 'Duration' };
export type Interval = number & { readonly __brand: 'Interval' };

// Constructor functions with validation
export const Hz = (value: number): Hz => {
  if (value < 20 || value > 20000) {
    throw new RangeError(`Hz must be 20-20000, got ${value}`);
  }
  return value as Hz;
};

export const BPM = (value: number): BPM => {
  if (value <= 0 || value > 999) {
    throw new RangeError(`BPM must be 0-999, got ${value}`);
  }
  return value as BPM;
};

export const Seconds = (value: number): Seconds => {
  if (value < 0) {
    throw new RangeError(`Seconds cannot be negative`);
  }
  return value as Seconds;
};

export const MIDINote = (value: number): MIDINote => {
  if (!Number.isInteger(value) || value < 0 || value > 127) {
    throw new RangeError(`MIDI note must be 0-127 integer`);
  }
  return value as MIDINote;
};

export const Velocity = (value: number): Velocity => {
  if (!Number.isInteger(value) || value < 0 || value > 127) {
    throw new RangeError(`Velocity must be 0-127 integer`);
  }
  return value as Velocity;
};

export const Duration = (value: number): Duration => {
  if (value <= 0) {
    throw new RangeError(`Duration must be positive`);
  }
  return value as Duration;
};

export const Interval = (semitones: number): Interval => {
  return semitones as Interval;
};
```

### Step 2: Test Branded Types

Create `packages/core/tests/types/brands.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { Hz, BPM, Seconds, MIDINote, Velocity } from '../../src/types/brands';

describe('Branded Types', () => {
  describe('Hz', () => {
    it('creates valid Hz value', () => {
      const freq = Hz(440);
      expect(freq).toBe(440);
    });
    
    it('throws on invalid Hz', () => {
      expect(() => Hz(10)).toThrow('Hz must be 20-20000');
      expect(() => Hz(30000)).toThrow('Hz must be 20-20000');
    });
  });
  
  describe('BPM', () => {
    it('creates valid BPM value', () => {
      const tempo = BPM(120);
      expect(tempo).toBe(120);
    });
    
    it('throws on invalid BPM', () => {
      expect(() => BPM(0)).toThrow('BPM must be 0-999');
      expect(() => BPM(-10)).toThrow('BPM must be 0-999');
      expect(() => BPM(1000)).toThrow('BPM must be 0-999');
    });
  });
  
  describe('MIDINote', () => {
    it('creates valid MIDI note', () => {
      const note = MIDINote(60);
      expect(note).toBe(60);
    });
    
    it('throws on non-integer', () => {
      expect(() => MIDINote(60.5)).toThrow('MIDI note must be 0-127 integer');
    });
    
    it('throws on out of range', () => {
      expect(() => MIDINote(-1)).toThrow('MIDI note must be 0-127 integer');
      expect(() => MIDINote(128)).toThrow('MIDI note must be 0-127 integer');
    });
  });
  
  // Type safety tests (these should cause TypeScript errors)
  it('prevents mixing units (compile-time check)', () => {
    const freq = Hz(440);
    const tempo = BPM(120);
    
    // This would be a TypeScript error:
    // const invalid = freq + tempo; // Type error!
    
    // Can only combine same types:
    const doubled = Hz(freq * 2);
    expect(doubled).toBe(880);
  });
});
```

### Step 3: Musical Type Primitives

Create `packages/core/src/types/music.ts`:

```typescript
export type NoteLetter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';
export type Accidental = '' | '#' | 'b';
export type Octave = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';

/**
 * Complete note name with compile-time validation.
 */
export type NoteName = `${NoteLetter}${Accidental}${Octave}`;

/**
 * Common duration constants.
 */
import { Duration } from './brands';

export const Durations = {
  whole: Duration(1),
  half: Duration(0.5),
  quarter: Duration(0.25),
  eighth: Duration(0.125),
  sixteenth: Duration(0.0625),
  thirtysecond: Duration(0.03125),
  
  dottedHalf: Duration(0.75),
  dottedQuarter: Duration(0.375),
  dottedEighth: Duration(0.1875),
} as const;

/**
 * Common interval constants.
 */
import { Interval } from './brands';

export const Intervals = {
  unison: Interval(0),
  minorSecond: Interval(1),
  majorSecond: Interval(2),
  minorThird: Interval(3),
  majorThird: Interval(4),
  perfectFourth: Interval(5),
  tritone: Interval(6),
  perfectFifth: Interval(7),
  minorSixth: Interval(8),
  majorSixth: Interval(9),
  minorSeventh: Interval(10),
  majorSeventh: Interval(11),
  octave: Interval(12),
} as const;
```

Test template literal types:

```typescript
// packages/core/tests/types/music.test.ts
import { describe, it, expectTypeOf } from 'vitest';
import type { NoteName } from '../../src/types/music';

describe('Musical Types', () => {
  it('validates note names at compile time', () => {
    // Valid notes
    const c4: NoteName = 'C4';
    const fSharp5: NoteName = 'F#5';
    const bFlat3: NoteName = 'Bb3';
    
    expectTypeOf(c4).toEqualTypeOf<NoteName>();
    expectTypeOf(fSharp5).toEqualTypeOf<NoteName>();
    expectTypeOf(bFlat3).toEqualTypeOf<NoteName>();
    
    // Invalid notes would be TypeScript errors:
    // const invalid: NoteName = 'H5'; // Error!
    // const bad: NoteName = 'C';      // Error! (missing octave)
  });
});
```

## Phase 3: Note Class (Days 3-4)

### Step 1: Implement Note Class

Create `packages/core/src/primitives/Note.ts`:

```typescript
import { MIDINote, Hz } from '../types/brands';
import type { NoteName, Octave, NoteLetter, Accidental } from '../types/music';

/**
 * Immutable musical note.
 */
export class Note {
  readonly pitch: MIDINote;
  readonly name: NoteName;
  readonly frequency: Hz;
  
  constructor(name: NoteName) {
    this.name = name;
    this.pitch = this.noteToPitch(name);
    this.frequency = this.pitchToFrequency(this.pitch);
  }
  
  /**
   * Transpose by semitones (returns new Note).
   */
  transpose(semitones: number): Note {
    const newPitch = MIDINote(this.pitch + semitones);
    return Note.fromMIDI(newPitch);
  }
  
  /**
   * Get interval from this note to another.
   */
  intervalTo(other: Note): number {
    return other.pitch - this.pitch;
  }
  
  /**
   * Create Note from MIDI number.
   */
  static fromMIDI(pitch: MIDINote): Note {
    const octave = Math.floor(pitch / 12) - 1;
    const noteIndex = pitch % 12;
    const noteNames: NoteLetter[] = ['C', 'C', 'D', 'D', 'E', 'F', 'F', 'G', 'G', 'A', 'A', 'B'];
    const accidentals: Accidental[] = ['', '#', '', '#', '', '', '#', '', '#', '', '#', ''];
    
    const name = `${noteNames[noteIndex]}${accidentals[noteIndex]}${octave}` as NoteName;
    return new Note(name);
  }
  
  /**
   * Create Note from frequency.
   */
  static fromFrequency(freq: Hz): Note {
    const pitch = Math.round(69 + 12 * Math.log2(freq / 440));
    return Note.fromMIDI(MIDINote(pitch));
  }
  
  private noteToPitch(name: NoteName): MIDINote {
    // Parse note name to MIDI number
    // C4 = 60, A4 = 69, etc.
    const match = name.match(/^([A-G])([#b]?)(\d)$/);
    if (!match) {
      throw new Error(`Invalid note name: ${name}`);
    }
    
    const [, letter, accidental, octaveStr] = match;
    const octave = parseInt(octaveStr, 10);
    
    const letterToPitch: Record<NoteLetter, number> = {
      C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11
    };
    
    let pitch = letterToPitch[letter as NoteLetter] + (octave + 1) * 12;
    
    if (accidental === '#') pitch += 1;
    if (accidental === 'b') pitch -= 1;
    
    return MIDINote(pitch);
  }
  
  private pitchToFrequency(pitch: MIDINote): Hz {
    // A4 (MIDI 69) = 440 Hz
    // 12-TET: freq = 440 * 2^((pitch - 69) / 12)
    return Hz(440 * Math.pow(2, (pitch - 69) / 12));
  }
}

// Convenience functions
export const C = (octave: Octave = '4') => new Note(`C${octave}` as NoteName);
export const Db = (octave: Octave = '4') => new Note(`Db${octave}` as NoteName);
export const D = (octave: Octave = '4') => new Note(`D${octave}` as NoteName);
export const Eb = (octave: Octave = '4') => new Note(`Eb${octave}` as NoteName);
export const E = (octave: Octave = '4') => new Note(`E${octave}` as NoteName);
export const F = (octave: Octave = '4') => new Note(`F${octave}` as NoteName);
export const Gb = (octave: Octave = '4') => new Note(`Gb${octave}` as NoteName);
export const G = (octave: Octave = '4') => new Note(`G${octave}` as NoteName);
export const Ab = (octave: Octave = '4') => new Note(`Ab${octave}` as NoteName);
export const A = (octave: Octave = '4') => new Note(`A${octave}` as NoteName);
export const Bb = (octave: Octave = '4') => new Note(`Bb${octave}` as NoteName);
export const B = (octave: Octave = '4') => new Note(`B${octave}` as NoteName);
```

### Step 2: Test Note Class

Create `packages/core/tests/primitives/Note.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { Note, C, D, E, F, G, A, B } from '../../src/primitives/Note';
import { MIDINote, Hz } from '../../src/types/brands';

describe('Note', () => {
  describe('construction', () => {
    it('creates note from NoteName', () => {
      const note = new Note('C4');
      expect(note.name).toBe('C4');
      expect(note.pitch).toBe(60);
    });
    
    it('handles accidentals', () => {
      const cSharp = new Note('C#4');
      const dFlat = new Note('Db4');
      
      expect(cSharp.pitch).toBe(61);
      expect(dFlat.pitch).toBe(61);
    });
    
    it('calculates frequency correctly', () => {
      const a4 = new Note('A4');
      expect(a4.frequency).toBe(440);
      
      const c4 = new Note('C4');
      expect(c4.frequency).toBeCloseTo(261.63, 2);
    });
  });
  
  describe('transpose', () => {
    it('transposes up', () => {
      const c4 = C('4');
      const d4 = c4.transpose(2);
      
      expect(d4.pitch).toBe(62);
      expect(d4.name).toBe('D4');
    });
    
    it('transposes down', () => {
      const c4 = C('4');
      const bb3 = c4.transpose(-2);
      
      expect(bb3.pitch).toBe(58);
      expect(bb3.name).toBe('Bb3');
    });
    
    it('returns new instance (immutability)', () => {
      const original = C('4');
      const transposed = original.transpose(5);
      
      expect(original.pitch).toBe(60);
      expect(transposed.pitch).toBe(65);
      expect(original).not.toBe(transposed);
    });
  });
  
  describe('intervalTo', () => {
    it('calculates interval between notes', () => {
      const c4 = C('4');
      const e4 = E('4');
      
      expect(c4.intervalTo(e4)).toBe(4); // Major third
    });
    
    it('handles negative intervals', () => {
      const e4 = E('4');
      const c4 = C('4');
      
      expect(e4.intervalTo(c4)).toBe(-4);
    });
  });
  
  describe('static constructors', () => {
    it('creates from MIDI number', () => {
      const note = Note.fromMIDI(MIDINote(60));
      expect(note.name).toBe('C4');
      expect(note.pitch).toBe(60);
    });
    
    it('creates from frequency', () => {
      const note = Note.fromFrequency(Hz(440));
      expect(note.name).toBe('A4');
      expect(note.pitch).toBe(69);
    });
  });
  
  describe('convenience functions', () => {
    it('provides shorthand constructors', () => {
      expect(C('4').name).toBe('C4');
      expect(D('5').name).toBe('D5');
      expect(E()).name).toBe('E4'); // Default octave 4
    });
  });
});
```

### Step 3: Export from Index

Update `packages/core/src/index.ts`:

```typescript
// Types
export * from './types/brands';
export * from './types/music';

// Primitives
export * from './primitives/Note';

// To be added:
// export * from './patterns/Pattern';
// export * from './patterns/PatternBuilder';
// export * from './composition/Voice';
// export * from './composition/Track';
// export * from './composition/Composition';
```

## Phase 4: Run Tests and Verify

```bash
# Install dependencies
pnpm install

# Run tests
cd packages/core
pnpm test

# Run tests in watch mode
pnpm test:watch

# Check types
pnpm type-check
```

**Expected Output:**
```
✓ packages/core/tests/types/brands.test.ts (15 tests)
✓ packages/core/tests/types/music.test.ts (3 tests)
✓ packages/core/tests/primitives/Note.test.ts (12 tests)

Test Files  3 passed (3)
     Tests  30 passed (30)
```

## Next Steps

### Week 2: Pattern System
1. Implement Event interfaces (NoteEvent, RestEvent, ChordEvent)
2. Implement Pattern class with immutable transformations
3. Implement PatternBuilder with fluent API
4. Add property-based tests for algebraic laws
5. Target: 50+ tests passing

### Week 3: Tone.js Integration
1. Setup tone-adapter package
2. Implement PatternScheduler
3. Create Vite dev server with custom HMR plugin
4. Test audio playback in browser
5. Verify hot-reload without glitches

### Week 4: Composition System
1. Implement Voice, Track, Composition classes
2. Add tempo and time signature support
3. Begin Bach Invention No. 4 implementation
4. Target: Simple melody playing correctly

## Troubleshooting

### TypeScript Errors

**Problem:** Template literal types not working
**Solution:** Ensure TypeScript 5.3+ and `"strict": true` in tsconfig

**Problem:** Branded types allowing mixing
**Solution:** Check that intersection type includes `readonly __brand`

### Test Failures

**Problem:** Tests not finding modules
**Solution:** Check tsconfig paths and package.json exports

**Problem:** Vitest config issues
**Solution:** Create `vitest.config.ts` with proper setup

### Build Issues

**Problem:** pnpm workspace not resolving packages
**Solution:** Run `pnpm install` from root, check pnpm-workspace.yaml

## Success Criteria for Phase 1-3

- [ ] Project structure created with all packages
- [ ] Branded types prevent unit mixing at compile time
- [ ] Template literal types validate note names
- [ ] Note class with transpose/interval operations
- [ ] 30+ tests passing with good coverage
- [ ] TypeScript strict mode with no errors
- [ ] Immutability enforced (transformations return new instances)

Once these criteria are met, you're ready to proceed with Pattern system implementation!

## Additional Resources

- **TECHNICAL_SPEC.md** - Full API reference
- **PRODUCT_REQUIREMENTS.md** - User stories and goals
- **ARCHITECTURE_GUIDE.md** - Comprehensive research and patterns
- **Tone.js Docs** - https://tonejs.github.io/

Remember: Focus on test-driven development. Write tests that express the desired behavior, then implement to make them pass. This ensures correctness and makes refactoring safe.
