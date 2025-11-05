// packages/core/tests/patterns/MiniNotation.test.ts

import { describe, it, expect } from 'vitest';
import { parseMiniNotation, parseMiniNotationWithDefaults, MiniNotationError } from '../../src/patterns/MiniNotation';
import { Velocity, Duration } from '../../src/types/brands';
import { Durations } from '../../src/types/music';

describe('MiniNotation', () => {
  describe('Basic parsing', () => {
    it('parses simple note sequence', () => {
      const events = parseMiniNotation('C4 E4 G4');
      expect(events).toHaveLength(3);
      expect(events[0].type).toBe('note');
      expect(events[0].note?.name).toBe('C4');
      expect(events[1].note?.name).toBe('E4');
      expect(events[2].note?.name).toBe('G4');
    });

    it('parses empty string', () => {
      const events = parseMiniNotation('');
      expect(events).toHaveLength(0);
    });

    it('parses whitespace-only string', () => {
      const events = parseMiniNotation('   ');
      expect(events).toHaveLength(0);
    });

    it('parses notes with accidentals', () => {
      const events = parseMiniNotation('C#4 Db4');
      expect(events).toHaveLength(2);
      expect(events[0].note?.name).toBe('C#4');
      expect(events[1].note?.name).toBe('Db4');
    });
  });

  describe('Rests', () => {
    it('parses rest with ~', () => {
      const events = parseMiniNotation('C4 ~ E4');
      expect(events).toHaveLength(3);
      expect(events[0].type).toBe('note');
      expect(events[1].type).toBe('rest');
      expect(events[2].type).toBe('note');
    });

    it('parses rest with _', () => {
      const events = parseMiniNotation('C4 _ E4');
      expect(events).toHaveLength(3);
      expect(events[1].type).toBe('rest');
    });
  });

  describe('Repetition', () => {
    it('repeats note with *n syntax', () => {
      const events = parseMiniNotation('C4*4');
      expect(events).toHaveLength(4);
      expect(events.every(e => e.type === 'note' && e.note?.name === 'C4')).toBe(true);
    });

    it('repeats notes in sequence', () => {
      const events = parseMiniNotation('C4*2 E4*2');
      expect(events).toHaveLength(4);
      expect(events[0].note?.name).toBe('C4');
      expect(events[1].note?.name).toBe('C4');
      expect(events[2].note?.name).toBe('E4');
      expect(events[3].note?.name).toBe('E4');
    });

    it('repeats rest', () => {
      const events = parseMiniNotation('~*3');
      expect(events).toHaveLength(3);
      expect(events.every(e => e.type === 'rest')).toBe(true);
    });
  });

  describe('Extension (hold)', () => {
    it('extends note duration with @n', () => {
      const events = parseMiniNotation('C4@2');
      expect(events).toHaveLength(1);
      expect(events[0].duration).toBe(Durations.quarter * 2);
    });

    it('combines repetition and extension', () => {
      const events = parseMiniNotation('C4*2@2');
      expect(events).toHaveLength(2);
      expect(events[0].duration).toBe(Durations.quarter * 2);
      expect(events[1].duration).toBe(Durations.quarter * 2);
    });
  });

  describe('Duration', () => {
    it('parses explicit duration with /n', () => {
      const events = parseMiniNotation('C4/8');
      expect(events).toHaveLength(1);
      expect(events[0].duration).toBe(1 / 8);
    });

    it('parses multiple notes with durations', () => {
      const events = parseMiniNotation('C4/8 E4/16 G4/4');
      expect(events).toHaveLength(3);
      expect(events[0].duration).toBe(1 / 8);
      expect(events[1].duration).toBe(1 / 16);
      expect(events[2].duration).toBe(1 / 4);
    });
  });

  describe('Grouping (subdivision)', () => {
    it('subdivides notes in brackets', () => {
      const events = parseMiniNotation('[C4 E4 G4]');
      expect(events).toHaveLength(3);

      // Each note should be 1/3 of a quarter note
      const expectedDuration = Duration(Durations.quarter / 3);
      events.forEach(e => {
        expect(e.duration).toBeCloseTo(expectedDuration, 5);
      });
    });

    it('subdivides within larger pattern', () => {
      const events = parseMiniNotation('C4 [E4 G4]');
      expect(events).toHaveLength(3);

      // First note is full quarter
      expect(events[0].duration).toBe(Durations.quarter);

      // Group notes are subdivided within a quarter
      expect(events[1].duration).toBeCloseTo(Durations.quarter / 2, 5);
      expect(events[2].duration).toBeCloseTo(Durations.quarter / 2, 5);
    });

    it('handles nested grouping', () => {
      const events = parseMiniNotation('[C4 [E4 G4]]');
      expect(events).toHaveLength(3);

      // First note is half of group
      expect(events[0].duration).toBeCloseTo(Durations.quarter / 2, 5);

      // Nested notes are quarter of total
      expect(events[1].duration).toBeCloseTo(Durations.quarter / 4, 5);
      expect(events[2].duration).toBeCloseTo(Durations.quarter / 4, 5);
    });

    it('repeats groups', () => {
      const events = parseMiniNotation('[C4 E4]*2');
      expect(events).toHaveLength(4);
    });
  });

  describe('Octave persistence', () => {
    it('persists octave across notes', () => {
      const events = parseMiniNotation('C4 D E F');
      expect(events).toHaveLength(4);
      expect(events[0].note?.name).toBe('C4');
      expect(events[1].note?.name).toBe('D4');
      expect(events[2].note?.name).toBe('E4');
      expect(events[3].note?.name).toBe('F4');
    });

    it('updates octave on explicit octave', () => {
      const events = parseMiniNotation('C4 D E5 F');
      expect(events).toHaveLength(4);
      expect(events[0].note?.name).toBe('C4');
      expect(events[1].note?.name).toBe('D4');
      expect(events[2].note?.name).toBe('E5');
      expect(events[3].note?.name).toBe('F5'); // Octave updated to 5
    });

    it('persists octave with accidentals', () => {
      const events = parseMiniNotation('C#4 D# E');
      expect(events).toHaveLength(3);
      expect(events[0].note?.name).toBe('C#4');
      expect(events[1].note?.name).toBe('D#4');
      expect(events[2].note?.name).toBe('E4');
    });
  });

  describe('Chord symbols', () => {
    it('parses major chord', () => {
      const events = parseMiniNotation('Cmaj7');
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('chord');
      const chord = events[0] as any;
      expect(chord.notes).toBeDefined();
      expect(chord.notes.length).toBeGreaterThan(1);
    });

    it('parses minor chord', () => {
      const events = parseMiniNotation('Dm7');
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('chord');
    });

    it('parses chord sequence', () => {
      const events = parseMiniNotation('Cmaj7 Dm7 G7');
      expect(events).toHaveLength(3);
      expect(events.every(e => e.type === 'chord')).toBe(true);
    });
  });

  describe('Complex patterns', () => {
    it('parses TidalCycles-style rhythm', () => {
      const events = parseMiniNotation('C4*4 [E4 G4] ~ C4');
      expect(events.length).toBeGreaterThan(5);
    });

    it('combines all features', () => {
      const events = parseMiniNotation('C4/8*2 [E4 G4]@2 ~ Cmaj7');

      // C4 repeated twice as eighth notes
      expect(events[0].note?.name).toBe('C4');
      expect(events[0].duration).toBe(1 / 8);

      // Has rest
      expect(events.some(e => e.type === 'rest')).toBe(true);

      // Has chord
      expect(events.some(e => e.type === 'chord')).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('throws error on invalid character', () => {
      expect(() => parseMiniNotation('C4 $ E4')).toThrow(MiniNotationError);
    });

    it('throws error on unclosed bracket', () => {
      expect(() => parseMiniNotation('[C4 E4')).toThrow(MiniNotationError);
    });

    it('throws error on unopened bracket', () => {
      expect(() => parseMiniNotation('C4 E4]')).toThrow(MiniNotationError);
    });

    it('throws error on invalid repetition', () => {
      expect(() => parseMiniNotation('C4*')).toThrow(MiniNotationError);
    });

    it('provides position information in errors', () => {
      try {
        parseMiniNotation('C4 $ E4');
        expect.fail('Should have thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(MiniNotationError);
        expect((e as MiniNotationError).position).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Custom defaults', () => {
    it('uses custom default duration', () => {
      const events = parseMiniNotationWithDefaults('C4 E4', {
        defaultDuration: Durations.eighth,
      });
      expect(events).toHaveLength(2);
      expect(events[0].duration).toBe(Durations.eighth);
      expect(events[1].duration).toBe(Durations.eighth);
    });

    it('uses custom default velocity', () => {
      const events = parseMiniNotationWithDefaults('C4', {
        defaultVelocity: Velocity(100),
      });
      expect(events).toHaveLength(1);
      expect(events[0].velocity).toBe(100);
    });

    it('uses custom default octave', () => {
      const events = parseMiniNotationWithDefaults('C D E', {
        defaultOctave: '5',
      });
      expect(events).toHaveLength(3);
      expect(events[0].note?.name).toBe('C5');
      expect(events[1].note?.name).toBe('D5');
      expect(events[2].note?.name).toBe('E5');
    });
  });

  describe('Timing', () => {
    it('sequences events correctly in time', () => {
      const events = parseMiniNotation('C4 E4 G4');

      expect(events[0].time).toBe(0);
      expect(events[1].time).toBe(Durations.quarter);
      expect(events[2].time).toBe(Durations.quarter * 2);
    });

    it('handles subdivision timing', () => {
      const events = parseMiniNotation('C4 [E4 G4]');

      expect(events[0].time).toBe(0);
      expect(events[1].time).toBe(Durations.quarter);
      expect(events[2].time).toBeCloseTo(Durations.quarter + Durations.quarter / 2, 5);
    });
  });
});
