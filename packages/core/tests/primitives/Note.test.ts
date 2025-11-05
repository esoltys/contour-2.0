import { describe, it, expect } from 'vitest';
import { Note, C, Cs, D, Ds, E, F, Fs, G, Gs, A, As, B, Db, Eb, Gb, Ab, Bb } from '../../src/primitives/Note';
import { MIDINote, Hz } from '../../src/types/brands';

describe('Note', () => {
  describe('construction', () => {
    it('creates note from NoteName', () => {
      const note = new Note('C4');
      expect(note.name).toBe('C4');
      expect(note.pitch).toBe(60);
    });

    it('calculates correct MIDI pitch for C4', () => {
      const c4 = new Note('C4');
      expect(c4.pitch).toBe(60); // Middle C
    });

    it('calculates correct MIDI pitch for A4', () => {
      const a4 = new Note('A4');
      expect(a4.pitch).toBe(69); // Concert A
    });

    it('handles sharps correctly', () => {
      const cSharp = new Note('C#4');
      expect(cSharp.pitch).toBe(61);

      const fSharp = new Note('F#4');
      expect(fSharp.pitch).toBe(66);
    });

    it('handles flats correctly', () => {
      const dFlat = new Note('Db4');
      expect(dFlat.pitch).toBe(61);

      const bFlat = new Note('Bb4');
      expect(bFlat.pitch).toBe(70);
    });

    it('handles different octaves', () => {
      const c0 = new Note('C0');
      const c4 = new Note('C4');
      const c8 = new Note('C8');

      expect(c0.pitch).toBe(12);
      expect(c4.pitch).toBe(60);
      expect(c8.pitch).toBe(108);
    });

    it('calculates frequency correctly for A4', () => {
      const a4 = new Note('A4');
      expect(a4.frequency).toBe(440);
    });

    it('calculates frequency correctly for C4', () => {
      const c4 = new Note('C4');
      expect(c4.frequency).toBeCloseTo(261.63, 2);
    });

    it('calculates frequency correctly for C5', () => {
      const c5 = new Note('C5');
      expect(c5.frequency).toBeCloseTo(523.25, 2);
    });

    it('throws on invalid note name', () => {
      expect(() => new Note('H4' as any)).toThrow('Invalid note name');
      expect(() => new Note('C#' as any)).toThrow('Invalid note name');
    });
  });

  describe('transpose', () => {
    it('transposes up by semitones', () => {
      const c4 = C('4');
      const d4 = c4.transpose(2);

      expect(d4.pitch).toBe(62);
      expect(d4.name).toBe('D4');
    });

    it('transposes down by semitones', () => {
      const c4 = C('4');
      const transposed = c4.transpose(-2);

      expect(transposed.pitch).toBe(58);
      // fromMIDI prefers sharps, so MIDI 58 becomes A#3 (enharmonic to Bb3)
      expect(transposed.name).toBe('A#3');
    });

    it('transposes by an octave', () => {
      const c4 = C('4');
      const c5 = c4.transpose(12);

      expect(c5.pitch).toBe(72);
      expect(c5.name).toBe('C5');
    });

    it('transposes down by an octave', () => {
      const c4 = C('4');
      const c3 = c4.transpose(-12);

      expect(c3.pitch).toBe(48);
      expect(c3.name).toBe('C3');
    });

    it('returns new instance (immutability)', () => {
      const original = C('4');
      const transposed = original.transpose(5);

      expect(original.pitch).toBe(60);
      expect(transposed.pitch).toBe(65);
      expect(original).not.toBe(transposed);
    });

    it('handles transposing to sharps', () => {
      const c4 = C('4');
      const cSharp4 = c4.transpose(1);

      expect(cSharp4.pitch).toBe(61);
      expect(cSharp4.name).toBe('C#4');
    });

    it('handles multiple transpositions', () => {
      const c4 = C('4');
      const result = c4.transpose(2).transpose(2).transpose(3);

      expect(result.pitch).toBe(67); // C4 + 7 = G4
      expect(result.name).toBe('G4');
    });
  });

  describe('intervalTo', () => {
    it('calculates interval between notes', () => {
      const c4 = C('4');
      const e4 = E('4');

      const interval = c4.intervalTo(e4);
      expect(interval).toBe(4); // Major third
    });

    it('calculates perfect fifth interval', () => {
      const c4 = C('4');
      const g4 = G('4');

      expect(c4.intervalTo(g4)).toBe(7);
    });

    it('calculates octave interval', () => {
      const c4 = C('4');
      const c5 = C('5');

      expect(c4.intervalTo(c5)).toBe(12);
    });

    it('handles negative intervals', () => {
      const e4 = E('4');
      const c4 = C('4');

      expect(e4.intervalTo(c4)).toBe(-4);
    });

    it('handles unison', () => {
      const c4 = C('4');
      const c4Again = new Note('C4');

      expect(c4.intervalTo(c4Again)).toBe(0);
    });

    it('calculates interval with sharps and flats', () => {
      const c4 = C('4');
      const fSharp4 = Fs('4');

      expect(c4.intervalTo(fSharp4)).toBe(6); // Tritone
    });
  });

  describe('static constructors', () => {
    it('creates from MIDI number', () => {
      const note = Note.fromMIDI(MIDINote(60));
      expect(note.name).toBe('C4');
      expect(note.pitch).toBe(60);
    });

    it('creates A4 from MIDI 69', () => {
      const note = Note.fromMIDI(MIDINote(69));
      expect(note.name).toBe('A4');
      expect(note.pitch).toBe(69);
    });

    it('creates note with sharp from MIDI', () => {
      const note = Note.fromMIDI(MIDINote(61));
      expect(note.name).toBe('C#4');
      expect(note.pitch).toBe(61);
    });

    it('creates from frequency', () => {
      const note = Note.fromFrequency(Hz(440));
      expect(note.name).toBe('A4');
      expect(note.pitch).toBe(69);
    });

    it('creates from C4 frequency', () => {
      const note = Note.fromFrequency(Hz(261.63));
      expect(note.name).toBe('C4');
      expect(note.pitch).toBe(60);
    });

    it('rounds to nearest MIDI note from frequency', () => {
      const note = Note.fromFrequency(Hz(445)); // Slightly sharp A4
      expect(note.name).toBe('A4');
      expect(note.pitch).toBe(69);
    });
  });

  describe('convenience functions', () => {
    it('provides shorthand constructors', () => {
      expect(C('4').name).toBe('C4');
      expect(D('5').name).toBe('D5');
      expect(E('3').name).toBe('E3');
    });

    it('defaults to octave 4', () => {
      expect(C().name).toBe('C4');
      expect(D().name).toBe('D4');
      expect(E().name).toBe('E4');
    });

    it('provides all natural notes', () => {
      expect(C().pitch).toBe(60);
      expect(D().pitch).toBe(62);
      expect(E().pitch).toBe(64);
      expect(F().pitch).toBe(65);
      expect(G().pitch).toBe(67);
      expect(A().pitch).toBe(69);
      expect(B().pitch).toBe(71);
    });

    it('provides sharp constructors', () => {
      expect(Cs().name).toBe('C#4');
      expect(Ds().name).toBe('D#4');
      expect(Fs().name).toBe('F#4');
      expect(Gs().name).toBe('G#4');
      expect(As().name).toBe('A#4');
    });

    it('provides flat constructors', () => {
      expect(Db().name).toBe('Db4');
      expect(Eb().name).toBe('Eb4');
      expect(Gb().name).toBe('Gb4');
      expect(Ab().name).toBe('Ab4');
      expect(Bb().name).toBe('Bb4');
    });

    it('sharp and flat enharmonics have same pitch', () => {
      expect(Cs().pitch).toBe(Db().pitch);
      expect(Ds().pitch).toBe(Eb().pitch);
      expect(Fs().pitch).toBe(Gb().pitch);
      expect(Gs().pitch).toBe(Ab().pitch);
      expect(As().pitch).toBe(Bb().pitch);
    });
  });

  describe('musical scales', () => {
    it('can represent C major scale', () => {
      const scale = [C('4'), D('4'), E('4'), F('4'), G('4'), A('4'), B('4'), C('5')];

      expect(scale.map((n) => n.pitch)).toEqual([60, 62, 64, 65, 67, 69, 71, 72]);
    });

    it('can represent chromatic scale', () => {
      const chromatic = [
        C('4'),
        Cs('4'),
        D('4'),
        Ds('4'),
        E('4'),
        F('4'),
        Fs('4'),
        G('4'),
        Gs('4'),
        A('4'),
        As('4'),
        B('4'),
      ];

      const pitches = chromatic.map((n) => n.pitch);
      expect(pitches).toEqual([60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71]);
    });
  });

  describe('frequency calculations', () => {
    it('maintains frequency accuracy after transpose', () => {
      const a4 = A('4');
      const a5 = a4.transpose(12);

      expect(a4.frequency).toBe(440);
      expect(a5.frequency).toBeCloseTo(880, 2); // Octave up doubles frequency
    });

    it('calculates semitone frequency ratios correctly', () => {
      const c4 = C('4');
      const cs4 = c4.transpose(1);

      // Ratio between semitones in 12-TET is 2^(1/12) ≈ 1.059463
      const ratio = cs4.frequency / c4.frequency;
      expect(ratio).toBeCloseTo(Math.pow(2, 1 / 12), 5);
    });
  });

  describe('edge cases', () => {
    it('handles lowest MIDI note', () => {
      const note = Note.fromMIDI(MIDINote(0));
      expect(note.pitch).toBe(0);
      expect(note.name).toBe('C-1'); // Octave -1
    });

    it('handles highest MIDI note', () => {
      const note = Note.fromMIDI(MIDINote(127));
      expect(note.pitch).toBe(127);
      expect(note.name).toBe('G9');
    });

    it('immutability - original unchanged after transpose', () => {
      const c4 = C('4');
      const originalPitch = c4.pitch;
      const originalName = c4.name;

      c4.transpose(5);

      expect(c4.pitch).toBe(originalPitch);
      expect(c4.name).toBe(originalName);
    });
  });
});
