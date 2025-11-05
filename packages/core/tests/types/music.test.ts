import { describe, it, expect } from 'vitest';
import type { NoteName, NoteLetter, Accidental, Octave } from '../../src/types/music';
import { Durations, Intervals } from '../../src/types/music';

describe('Musical Types', () => {
  describe('NoteName type', () => {
    it('validates note names at compile time', () => {
      // These are valid notes
      const c4: NoteName = 'C4';
      const fSharp5: NoteName = 'F#5';
      const bFlat3: NoteName = 'Bb3';
      const a0: NoteName = 'A0';
      const g8: NoteName = 'G8';

      // Runtime verification that they're the correct values
      expect(c4).toBe('C4');
      expect(fSharp5).toBe('F#5');
      expect(bFlat3).toBe('Bb3');
      expect(a0).toBe('A0');
      expect(g8).toBe('G8');

      // Invalid notes would be TypeScript errors at compile time:
      // const invalid: NoteName = 'H5';    // Error: H is not a valid NoteLetter
      // const bad: NoteName = 'C';         // Error: missing octave
      // const wrong: NoteName = 'C#9';     // Error: 9 is not a valid Octave
      // const oops: NoteName = 'C##4';     // Error: ## is not a valid Accidental
    });

    it('handles all note letters', () => {
      const notes: NoteName[] = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'];
      expect(notes).toHaveLength(7);
    });

    it('handles sharps and flats', () => {
      const sharps: NoteName[] = ['C#4', 'D#4', 'F#4', 'G#4', 'A#4'];
      const flats: NoteName[] = ['Db4', 'Eb4', 'Gb4', 'Ab4', 'Bb4'];

      expect(sharps).toHaveLength(5);
      expect(flats).toHaveLength(5);
    });

    it('handles all octaves', () => {
      const octaves: NoteName[] = ['C0', 'C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8'];
      expect(octaves).toHaveLength(9);
    });
  });

  describe('NoteLetter type', () => {
    it('only accepts valid note letters', () => {
      const letters: NoteLetter[] = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
      expect(letters).toHaveLength(7);

      // TypeScript would prevent: const invalid: NoteLetter = 'H';
    });
  });

  describe('Accidental type', () => {
    it('only accepts valid accidentals', () => {
      const accidentals: Accidental[] = ['', '#', 'b'];
      expect(accidentals).toHaveLength(3);

      // TypeScript would prevent: const invalid: Accidental = '##';
    });
  });

  describe('Octave type', () => {
    it('only accepts valid octaves', () => {
      const octaves: Octave[] = ['0', '1', '2', '3', '4', '5', '6', '7', '8'];
      expect(octaves).toHaveLength(9);

      // TypeScript would prevent: const invalid: Octave = '9';
    });
  });

  describe('Durations', () => {
    it('provides standard duration values', () => {
      expect(Durations.whole).toBe(1);
      expect(Durations.half).toBe(0.5);
      expect(Durations.quarter).toBe(0.25);
      expect(Durations.eighth).toBe(0.125);
      expect(Durations.sixteenth).toBe(0.0625);
      expect(Durations.thirtysecond).toBe(0.03125);
    });

    it('provides dotted duration values', () => {
      expect(Durations.dottedHalf).toBe(0.75); // 0.5 * 1.5
      expect(Durations.dottedQuarter).toBe(0.375); // 0.25 * 1.5
      expect(Durations.dottedEighth).toBe(0.1875); // 0.125 * 1.5
    });

    it('is immutable', () => {
      // As const ensures the object is readonly
      // This would be a TypeScript error:
      // Durations.whole = 2;

      // Verify the values haven't changed
      expect(Durations.whole).toBe(1);
    });
  });

  describe('Intervals', () => {
    it('provides standard interval values', () => {
      expect(Intervals.unison).toBe(0);
      expect(Intervals.minorSecond).toBe(1);
      expect(Intervals.majorSecond).toBe(2);
      expect(Intervals.minorThird).toBe(3);
      expect(Intervals.majorThird).toBe(4);
      expect(Intervals.perfectFourth).toBe(5);
      expect(Intervals.augmentedFourth).toBe(6); // tritone
      expect(Intervals.perfectFifth).toBe(7);
      expect(Intervals.minorSixth).toBe(8);
      expect(Intervals.majorSixth).toBe(9);
      expect(Intervals.minorSeventh).toBe(10);
      expect(Intervals.majorSeventh).toBe(11);
      expect(Intervals.octave).toBe(12);
    });

    it('has musical intervals mapping to semitones', () => {
      // Verify common musical intervals
      expect(Intervals.perfectFifth).toBe(7); // C to G
      expect(Intervals.majorThird).toBe(4); // C to E
      expect(Intervals.octave).toBe(12); // C to C
    });

    it('is immutable', () => {
      // As const ensures the object is readonly
      // This would be a TypeScript error:
      // Intervals.octave = 13;

      // Verify the values haven't changed
      expect(Intervals.octave).toBe(12);
    });
  });

  describe('Real-world usage', () => {
    it('can represent a C major scale', () => {
      const cMajorScale: NoteName[] = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
      expect(cMajorScale).toHaveLength(8);
    });

    it('can represent a D minor scale with flats', () => {
      const dMinorScale: NoteName[] = ['D4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'C5', 'D5'];
      expect(dMinorScale).toHaveLength(8);
    });

    it('can represent chromatic notes', () => {
      const chromatic: NoteName[] = [
        'C4',
        'C#4',
        'D4',
        'D#4',
        'E4',
        'F4',
        'F#4',
        'G4',
        'G#4',
        'A4',
        'A#4',
        'B4',
      ];
      expect(chromatic).toHaveLength(12);
    });
  });
});
