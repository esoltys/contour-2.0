/**
 * Tests for ChordVoicing class.
 */

import { describe, it, expect } from 'vitest';
import { ChordVoicing } from '../../src/theory/ChordVoicing';

describe('ChordVoicing', () => {
  describe('fromQuality', () => {
    it('creates major triad', () => {
      const chord = ChordVoicing.fromQuality('C4', 'maj');

      expect(chord.root).toBe('C4');
      expect(chord.quality).toBe('maj');
      expect(chord.notes).toHaveLength(3);
      expect(chord.notes.map((n) => n.name)).toEqual(['C4', 'E4', 'G4']);
    });

    it('creates minor triad', () => {
      const chord = ChordVoicing.fromQuality('D4', 'm');

      expect(chord.quality).toBe('m');
      expect(chord.notes.map((n) => n.name)).toEqual(['D4', 'F4', 'A4']);
    });

    it('creates major 7th chord', () => {
      const chord = ChordVoicing.fromQuality('C4', 'maj7');

      expect(chord.notes).toHaveLength(4);
      expect(chord.notes.map((n) => n.name)).toEqual(['C4', 'E4', 'G4', 'B4']);
    });

    it('creates minor 7th chord', () => {
      const chord = ChordVoicing.fromQuality('D4', 'm7');

      expect(chord.notes).toHaveLength(4);
      expect(chord.notes.map((n) => n.name)).toEqual(['D4', 'F4', 'A4', 'C5']);
    });

    it('creates dominant 7th chord', () => {
      const chord = ChordVoicing.fromQuality('G4', '7');

      expect(chord.notes).toHaveLength(4);
      expect(chord.notes.map((n) => n.name)).toEqual(['G4', 'B4', 'D5', 'F5']);
    });

    it('creates diminished triad', () => {
      const chord = ChordVoicing.fromQuality('B4', 'dim');

      expect(chord.notes).toHaveLength(3);
      expect(chord.notes.map((n) => n.name)).toEqual(['B4', 'D5', 'F5']);
    });

    it('creates augmented triad', () => {
      const chord = ChordVoicing.fromQuality('C4', 'aug');

      expect(chord.notes).toHaveLength(3);
      expect(chord.notes.map((n) => n.name)).toEqual(['C4', 'E4', 'G#4']);
    });

    it('creates sus2 chord', () => {
      const chord = ChordVoicing.fromQuality('D4', 'sus2');

      expect(chord.notes).toHaveLength(3);
      expect(chord.notes.map((n) => n.name)).toEqual(['D4', 'E4', 'A4']);
    });

    it('creates sus4 chord', () => {
      const chord = ChordVoicing.fromQuality('G4', 'sus4');

      expect(chord.notes).toHaveLength(3);
      expect(chord.notes.map((n) => n.name)).toEqual(['G4', 'C5', 'D5']);
    });

    it('works with empty quality (defaults to major)', () => {
      const chord = ChordVoicing.fromQuality('C4', '');

      expect(chord.notes.map((n) => n.name)).toEqual(['C4', 'E4', 'G4']);
    });

    it('works with sharps in root', () => {
      const chord = ChordVoicing.fromQuality('F#4', 'maj');

      expect(chord.root).toBe('F#4');
      expect(chord.notes[0].name).toBe('F#4');
    });

    it('works with flats in root', () => {
      const chord = ChordVoicing.fromQuality('Bb4', 'm');

      expect(chord.root).toBe('Bb4');
      expect(chord.notes[0].name).toBe('Bb4');
    });

    it('throws error for unknown quality', () => {
      expect(() => {
        ChordVoicing.fromQuality('C4', 'unknown' as any);
      }).toThrow('Unknown chord quality');
    });
  });

  describe('transpose', () => {
    it('transposes major chord up', () => {
      const cMajor = ChordVoicing.fromQuality('C4', 'maj');
      const dMajor = cMajor.transpose(2);

      expect(dMajor.root).toBe('D4');
      expect(dMajor.quality).toBe('maj');
      expect(dMajor.notes.map((n) => n.name)).toEqual(['D4', 'F#4', 'A4']);
    });

    it('transposes minor chord down', () => {
      const dMinor = ChordVoicing.fromQuality('D4', 'm');
      const cMinor = dMinor.transpose(-2);

      expect(cMinor.root).toBe('C4');
      // Note: Eb4 and D#4 are enharmonically equivalent
      const noteNames = cMinor.notes.map((n) => n.name);
      expect(noteNames[0]).toBe('C4');
      expect(['Eb4', 'D#4']).toContain(noteNames[1]);
      expect(noteNames[2]).toBe('G4');
    });

    it('transposes by octave', () => {
      const low = ChordVoicing.fromQuality('C3', 'maj');
      const high = low.transpose(12);

      expect(high.root).toBe('C4');
      expect(high.notes.map((n) => n.name)).toEqual(['C4', 'E4', 'G4']);
    });

    it('preserves chord quality when transposing', () => {
      const original = ChordVoicing.fromQuality('C4', 'm7');
      const transposed = original.transpose(5);

      expect(transposed.quality).toBe('m7');
      expect(transposed.notes).toHaveLength(original.notes.length);
    });
  });

  describe('invert', () => {
    it('creates first inversion', () => {
      const chord = ChordVoicing.fromQuality('C4', 'maj');
      const firstInversion = chord.invert(1);

      // C4, E4, G4 → E4, G4, C5
      expect(firstInversion.notes.map((n) => n.name)).toEqual([
        'E4',
        'G4',
        'C5',
      ]);
    });

    it('creates second inversion', () => {
      const chord = ChordVoicing.fromQuality('C4', 'maj');
      const secondInversion = chord.invert(2);

      // C4, E4, G4 → G4, C5, E5
      expect(secondInversion.notes.map((n) => n.name)).toEqual([
        'G4',
        'C5',
        'E5',
      ]);
    });

    it('inverts seventh chord', () => {
      const chord = ChordVoicing.fromQuality('C4', 'maj7');
      const firstInversion = chord.invert(1);

      // C4, E4, G4, B4 → E4, G4, B4, C5
      expect(firstInversion.notes.map((n) => n.name)).toEqual([
        'E4',
        'G4',
        'B4',
        'C5',
      ]);
    });

    it('handles multiple inversions', () => {
      const chord = ChordVoicing.fromQuality('C4', 'maj');
      const thirdInversion = chord.invert(3);

      // After 3 inversions of a triad, we're back to root position but octave higher
      expect(thirdInversion.notes.map((n) => n.name)).toEqual([
        'C5',
        'E5',
        'G5',
      ]);
    });

    it('invert(0) returns equivalent chord', () => {
      const chord = ChordVoicing.fromQuality('C4', 'maj');
      const same = chord.invert(0);

      expect(same.notes.map((n) => n.name)).toEqual(
        chord.notes.map((n) => n.name)
      );
    });

    it('throws error for negative inversions', () => {
      const chord = ChordVoicing.fromQuality('C4', 'maj');

      expect(() => chord.invert(-1)).toThrow(RangeError);
    });

    it('throws error for non-integer inversions', () => {
      const chord = ChordVoicing.fromQuality('C4', 'maj');

      expect(() => chord.invert(1.5)).toThrow(RangeError);
    });
  });

  describe('length', () => {
    it('returns correct length for triad', () => {
      const chord = ChordVoicing.fromQuality('C4', 'maj');
      expect(chord.length).toBe(3);
    });

    it('returns correct length for seventh chord', () => {
      const chord = ChordVoicing.fromQuality('C4', 'maj7');
      expect(chord.length).toBe(4);
    });

    it('returns correct length for ninth chord', () => {
      const chord = ChordVoicing.fromQuality('C4', 'maj9');
      expect(chord.length).toBe(5);
    });
  });

  describe('immutability', () => {
    it('does not modify original chord when transposing', () => {
      const original = ChordVoicing.fromQuality('C4', 'maj');
      const originalNotes = original.notes.map((n) => n.name);

      original.transpose(5);

      expect(original.notes.map((n) => n.name)).toEqual(originalNotes);
    });

    it('does not modify original chord when inverting', () => {
      const original = ChordVoicing.fromQuality('C4', 'maj');
      const originalNotes = original.notes.map((n) => n.name);

      original.invert(1);

      expect(original.notes.map((n) => n.name)).toEqual(originalNotes);
    });

    it('notes array is readonly', () => {
      const chord = ChordVoicing.fromQuality('C4', 'maj');

      expect(() => {
        // @ts-expect-error - Testing immutability at runtime
        chord.notes.push(null);
      }).toThrow();
    });
  });
});
