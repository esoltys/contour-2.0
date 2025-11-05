import { describe, it, expect } from 'vitest';
import { Hz, BPM, Seconds, MIDINote, Velocity, Duration, Interval } from '../../src/types/brands';

describe('Branded Types', () => {
  describe('Hz', () => {
    it('creates valid Hz value', () => {
      const freq = Hz(440);
      expect(freq).toBe(440);
    });

    it('accepts values at boundaries', () => {
      expect(Hz(8)).toBe(8);
      expect(Hz(20000)).toBe(20000);
    });

    it('throws on invalid Hz below range', () => {
      expect(() => Hz(7)).toThrow('Hz must be between 8 and 20000');
      expect(() => Hz(5)).toThrow('Hz must be between 8 and 20000');
    });

    it('throws on invalid Hz above range', () => {
      expect(() => Hz(20001)).toThrow('Hz must be between 8 and 20000');
      expect(() => Hz(30000)).toThrow('Hz must be between 8 and 20000');
    });

    it('handles decimal values', () => {
      const freq = Hz(440.5);
      expect(freq).toBe(440.5);
    });
  });

  describe('BPM', () => {
    it('creates valid BPM value', () => {
      const tempo = BPM(120);
      expect(tempo).toBe(120);
    });

    it('accepts values at boundaries', () => {
      expect(BPM(0.1)).toBeCloseTo(0.1);
      expect(BPM(999)).toBe(999);
    });

    it('throws on invalid BPM', () => {
      expect(() => BPM(0)).toThrow('BPM must be between 0 and 999');
      expect(() => BPM(-10)).toThrow('BPM must be between 0 and 999');
      expect(() => BPM(1000)).toThrow('BPM must be between 0 and 999');
    });

    it('handles decimal BPM values', () => {
      const tempo = BPM(120.5);
      expect(tempo).toBe(120.5);
    });
  });

  describe('Seconds', () => {
    it('creates valid Seconds value', () => {
      const time = Seconds(2.5);
      expect(time).toBe(2.5);
    });

    it('accepts zero', () => {
      expect(Seconds(0)).toBe(0);
    });

    it('throws on negative values', () => {
      expect(() => Seconds(-1)).toThrow('Seconds cannot be negative');
      expect(() => Seconds(-0.001)).toThrow('Seconds cannot be negative');
    });

    it('handles very small positive values', () => {
      const time = Seconds(0.001);
      expect(time).toBe(0.001);
    });
  });

  describe('MIDINote', () => {
    it('creates valid MIDI note', () => {
      const note = MIDINote(60);
      expect(note).toBe(60);
    });

    it('accepts boundary values', () => {
      expect(MIDINote(0)).toBe(0);
      expect(MIDINote(127)).toBe(127);
    });

    it('throws on non-integer', () => {
      expect(() => MIDINote(60.5)).toThrow('MIDI note must be integer 0-127');
      expect(() => MIDINote(60.1)).toThrow('MIDI note must be integer 0-127');
    });

    it('throws on out of range', () => {
      expect(() => MIDINote(-1)).toThrow('MIDI note must be integer 0-127');
      expect(() => MIDINote(128)).toThrow('MIDI note must be integer 0-127');
    });
  });

  describe('Velocity', () => {
    it('creates valid Velocity value', () => {
      const vel = Velocity(80);
      expect(vel).toBe(80);
    });

    it('accepts boundary values', () => {
      expect(Velocity(0)).toBe(0);
      expect(Velocity(127)).toBe(127);
    });

    it('throws on non-integer', () => {
      expect(() => Velocity(80.5)).toThrow('Velocity must be integer 0-127');
    });

    it('throws on out of range', () => {
      expect(() => Velocity(-1)).toThrow('Velocity must be integer 0-127');
      expect(() => Velocity(128)).toThrow('Velocity must be integer 0-127');
    });
  });

  describe('Duration', () => {
    it('creates valid Duration value', () => {
      const dur = Duration(0.25);
      expect(dur).toBe(0.25);
    });

    it('accepts positive values', () => {
      expect(Duration(1)).toBe(1);
      expect(Duration(0.0001)).toBe(0.0001);
    });

    it('throws on zero', () => {
      expect(() => Duration(0)).toThrow('Duration must be positive');
    });

    it('throws on negative values', () => {
      expect(() => Duration(-1)).toThrow('Duration must be positive');
      expect(() => Duration(-0.001)).toThrow('Duration must be positive');
    });
  });

  describe('Interval', () => {
    it('creates valid Interval value', () => {
      const interval = Interval(5);
      expect(interval).toBe(5);
    });

    it('accepts negative intervals', () => {
      expect(Interval(-5)).toBe(-5);
    });

    it('accepts zero', () => {
      expect(Interval(0)).toBe(0);
    });

    it('handles large intervals', () => {
      expect(Interval(24)).toBe(24); // Two octaves
      expect(Interval(-12)).toBe(-12); // Octave down
    });
  });

  // Type safety tests (compile-time checks demonstrated at runtime)
  describe('Type Safety', () => {
    it('prevents mixing units with same underlying type', () => {
      const freq = Hz(440);
      const tempo = BPM(120);

      // At runtime, we can demonstrate the values are different
      expect(freq).toBe(440);
      expect(tempo).toBe(120);

      // TypeScript would prevent: const invalid = freq + tempo;
      // This is caught at compile time, not runtime
    });

    it('can combine same types', () => {
      const freq1 = Hz(440);
      const freq2 = Hz(880);

      // Can perform arithmetic on raw values
      const doubled = Hz(freq1 * 2);
      expect(doubled).toBe(880);
      expect(doubled).toBe(freq2);
    });

    it('preserves type through transformations', () => {
      const time1 = Seconds(2.5);
      const time2 = Seconds(time1 * 2);

      expect(time2).toBe(5);
    });
  });

  describe('Real-world musical values', () => {
    it('handles common musical frequencies', () => {
      expect(Hz(261.63)).toBeCloseTo(261.63); // C4
      expect(Hz(440)).toBe(440); // A4
      expect(Hz(523.25)).toBeCloseTo(523.25); // C5
    });

    it('handles common tempo values', () => {
      expect(BPM(60)).toBe(60); // Largo
      expect(BPM(120)).toBe(120); // Moderato
      expect(BPM(180)).toBe(180); // Presto
    });

    it('handles common MIDI notes', () => {
      expect(MIDINote(21)).toBe(21); // A0 (lowest piano key)
      expect(MIDINote(60)).toBe(60); // C4 (middle C)
      expect(MIDINote(108)).toBe(108); // C8 (highest piano key)
    });

    it('handles common durations', () => {
      expect(Duration(1)).toBe(1); // Whole note
      expect(Duration(0.5)).toBe(0.5); // Half note
      expect(Duration(0.25)).toBe(0.25); // Quarter note
      expect(Duration(0.125)).toBe(0.125); // Eighth note
    });

    it('handles common intervals', () => {
      expect(Interval(0)).toBe(0); // Unison
      expect(Interval(7)).toBe(7); // Perfect fifth
      expect(Interval(12)).toBe(12); // Octave
      expect(Interval(-5)).toBe(-5); // Perfect fourth down
    });
  });
});
