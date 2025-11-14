/**
 * Tests for Scale class.
 */

import { describe, it, expect } from 'vitest';
import { Scale } from '../../src/theory/Scale';
import type { NoteName } from '../../src/types/music';

describe('Scale', () => {
  describe('constructor', () => {
    it('creates a major scale', () => {
      const scale = new Scale('C4', 'major');
      expect(scale.root).toBe('C4');
      expect(scale.name).toBe('major');
      expect(scale.intervals).toHaveLength(8);
    });

    it('creates a minor scale', () => {
      const scale = new Scale('A4', 'minor');
      expect(scale.root).toBe('A4');
      expect(scale.name).toBe('minor');
    });

    it('creates a Dorian mode', () => {
      const scale = new Scale('D4', 'Dorian');
      expect(scale.name).toBe('Dorian');
    });
  });

  describe('getNotes', () => {
    it('generates correct notes for C major scale', () => {
      const scale = new Scale('C4', 'major');
      const notes = scale.getNotes();

      expect(notes).toHaveLength(8);
      expect(notes.map((n) => n.name)).toEqual([
        'C4',
        'D4',
        'E4',
        'F4',
        'G4',
        'A4',
        'B4',
        'C5',
      ]);
    });

    it('generates correct notes for D Dorian mode', () => {
      const scale = new Scale('D4', 'Dorian');
      const notes = scale.getNotes();

      // Dorian: whole, half, whole, whole, whole, half, whole
      // D, E, F, G, A, B, C, D
      expect(notes.map((n) => n.name)).toEqual([
        'D4',
        'E4',
        'F4',
        'G4',
        'A4',
        'B4',
        'C5',
        'D5',
      ]);
    });

    it('generates correct notes for E Phrygian mode', () => {
      const scale = new Scale('E4', 'Phrygian');
      const notes = scale.getNotes();

      // Phrygian: half, whole, whole, whole, half, whole, whole
      // E, F, G, A, B, C, D, E
      expect(notes.map((n) => n.name)).toEqual([
        'E4',
        'F4',
        'G4',
        'A4',
        'B4',
        'C5',
        'D5',
        'E5',
      ]);
    });

    it('generates correct notes for A harmonic minor', () => {
      const scale = new Scale('A4', 'harmonicMinor');
      const notes = scale.getNotes();

      // Harmonic minor has raised 7th degree
      // A, B, C, D, E, F, G#, A
      expect(notes.map((n) => n.name)).toEqual([
        'A4',
        'B4',
        'C5',
        'D5',
        'E5',
        'F5',
        'G#5',
        'A5',
      ]);
    });

    it('generates correct notes for pentatonic scales', () => {
      const majorPent = new Scale('C4', 'majorPentatonic');
      const minorPent = new Scale('A4', 'minorPentatonic');

      expect(majorPent.getNotes()).toHaveLength(6); // 5 notes + octave
      expect(minorPent.getNotes()).toHaveLength(6);
    });

    it('generates chromatic scale with all 12 pitches', () => {
      const chromatic = new Scale('C4', 'chromatic');
      const notes = chromatic.getNotes();

      expect(notes).toHaveLength(13); // 12 semitones + octave
    });
  });

  describe('degree', () => {
    it('returns correct scale degree for major scale', () => {
      const scale = new Scale('G4', 'major');

      expect(scale.degree(1).name).toBe('G4'); // Tonic
      expect(scale.degree(5).name).toBe('D5'); // Dominant
      expect(scale.degree(8).name).toBe('G5'); // Octave
    });

    it('returns correct scale degree for minor scale', () => {
      const scale = new Scale('E4', 'minor');

      expect(scale.degree(1).name).toBe('E4'); // Tonic
      expect(scale.degree(3).name).toBe('G4'); // Minor third
      expect(scale.degree(5).name).toBe('B4'); // Perfect fifth
    });

    it('throws error for invalid degree', () => {
      const scale = new Scale('C4', 'major');

      expect(() => scale.degree(0)).toThrow(RangeError);
      expect(() => scale.degree(9)).toThrow(RangeError);
      expect(() => scale.degree(-1)).toThrow(RangeError);
    });
  });

  describe('transpose', () => {
    it('transposes scale up by semitones', () => {
      const cMajor = new Scale('C4', 'major');
      const dMajor = cMajor.transpose(2);

      expect(dMajor.root).toBe('D4');
      expect(dMajor.name).toBe('major');
      expect(dMajor.getNotes()[0].name).toBe('D4');
    });

    it('transposes scale down by semitones', () => {
      const dMajor = new Scale('D4', 'major');
      const cMajor = dMajor.transpose(-2);

      expect(cMajor.root).toBe('C4');
      expect(cMajor.getNotes()[0].name).toBe('C4');
    });

    it('preserves scale intervals when transposing', () => {
      const original = new Scale('C4', 'Dorian');
      const transposed = original.transpose(5);

      expect(transposed.name).toBe('Dorian');
      expect(transposed.intervals).toEqual(original.intervals);
    });

    it('transposes by octave', () => {
      const low = new Scale('C3', 'major');
      const high = low.transpose(12);

      expect(high.root).toBe('C4');
    });
  });

  describe('length', () => {
    it('returns correct length for major scale', () => {
      const scale = new Scale('C4', 'major');
      expect(scale.length).toBe(8);
    });

    it('returns correct length for pentatonic scale', () => {
      const scale = new Scale('C4', 'majorPentatonic');
      expect(scale.length).toBe(6);
    });

    it('returns correct length for chromatic scale', () => {
      const scale = new Scale('C4', 'chromatic');
      expect(scale.length).toBe(13);
    });
  });

  describe('mode relationships', () => {
    it('Ionian is equivalent to major', () => {
      const major = new Scale('C4', 'major');
      const ionian = new Scale('C4', 'Ionian');

      expect(major.getNotes().map((n) => n.pitch)).toEqual(
        ionian.getNotes().map((n) => n.pitch)
      );
    });

    it('Aeolian is equivalent to natural minor', () => {
      const minor = new Scale('A4', 'minor');
      const aeolian = new Scale('A4', 'Aeolian');

      expect(minor.getNotes().map((n) => n.pitch)).toEqual(
        aeolian.getNotes().map((n) => n.pitch)
      );
    });
  });

  describe('edge cases', () => {
    it('works with sharps in root note', () => {
      const scale = new Scale('F#4', 'major');
      expect(scale.root).toBe('F#4');
      expect(scale.getNotes()[0].name).toBe('F#4');
    });

    it('works with flats in root note', () => {
      const scale = new Scale('Bb4', 'major');
      expect(scale.root).toBe('Bb4');
      // Note: The note might be enharmonically equivalent (A# vs Bb)
      const firstNote = scale.getNotes()[0].name;
      expect(['Bb4', 'A#4']).toContain(firstNote);
    });

    it('works in different octaves', () => {
      const low = new Scale('C2', 'major');
      const high = new Scale('C7', 'major');

      expect(low.getNotes()[0].pitch).toBeLessThan(
        high.getNotes()[0].pitch
      );
    });
  });

  describe('immutability', () => {
    it('does not modify original scale when transposing', () => {
      const original = new Scale('C4', 'major');
      const originalRoot = original.root;
      const originalNotes = original.getNotes();

      original.transpose(5);

      expect(original.root).toBe(originalRoot);
      expect(original.getNotes()).toEqual(originalNotes);
    });

    it('intervals are readonly', () => {
      const scale = new Scale('C4', 'major');

      expect(() => {
        // @ts-expect-error - Testing immutability at runtime
        scale.intervals.push(0);
      }).toThrow();
    });
  });
});
