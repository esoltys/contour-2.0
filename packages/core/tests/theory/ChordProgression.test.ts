/**
 * Tests for ChordProgression class.
 */

import { describe, it, expect } from 'vitest';
import { ChordProgression } from '../../src/theory/ChordProgression';
import { ChordVoicing } from '../../src/theory/ChordVoicing';
import { Scale } from '../../src/theory/Scale';
import { Duration, Seconds } from '../../src/types/brands';

describe('ChordProgression', () => {
  describe('constructor', () => {
    it('creates progression from chord changes', () => {
      const changes = [
        {
          chord: ChordVoicing.fromQuality('C4', 'maj'),
          time: Seconds(0),
          duration: Duration(1),
        },
        {
          chord: ChordVoicing.fromQuality('F4', 'maj'),
          time: Seconds(1),
          duration: Duration(1),
        },
      ];

      const prog = new ChordProgression(changes);

      expect(prog.changes).toHaveLength(2);
      expect(prog.changes[0].chord.root).toBe('C4');
      expect(prog.changes[1].chord.root).toBe('F4');
    });

    it('accepts optional scale parameter', () => {
      const scale = new Scale('C4', 'major');
      const changes = [
        {
          chord: ChordVoicing.fromQuality('C4', 'maj'),
          time: Seconds(0),
          duration: Duration(1),
        },
      ];

      const prog = new ChordProgression(changes, scale);

      expect(prog.scale).toBe(scale);
    });
  });

  describe('fromDegrees', () => {
    it('creates I-IV-V-I progression in major', () => {
      const scale = new Scale('C4', 'major');
      const prog = ChordProgression.fromDegrees(
        scale,
        ['I', 'IV', 'V', 'I'],
        Duration(1.0)
      );

      expect(prog.changes).toHaveLength(4);
      expect(prog.changes[0].chord.root).toBe('C4'); // I
      expect(prog.changes[1].chord.root).toBe('F4'); // IV
      expect(prog.changes[2].chord.root).toBe('G4'); // V
      expect(prog.changes[3].chord.root).toBe('C4'); // I
    });

    it('creates minor chords from lowercase degrees', () => {
      const scale = new Scale('C4', 'major');
      const prog = ChordProgression.fromDegrees(
        scale,
        ['i', 'iv', 'v'],
        Duration(1.0)
      );

      expect(prog.changes[0].chord.quality).toBe('m');
      expect(prog.changes[1].chord.quality).toBe('m');
      expect(prog.changes[2].chord.quality).toBe('m');
    });

    it('creates major chords from uppercase degrees', () => {
      const scale = new Scale('C4', 'major');
      const prog = ChordProgression.fromDegrees(
        scale,
        ['I', 'IV', 'V'],
        Duration(1.0)
      );

      expect(prog.changes[0].chord.quality).toBe('maj');
      expect(prog.changes[1].chord.quality).toBe('maj');
      expect(prog.changes[2].chord.quality).toBe('maj');
    });

    it('spaces chords by duration', () => {
      const scale = new Scale('C4', 'major');
      const prog = ChordProgression.fromDegrees(
        scale,
        ['I', 'V'],
        Duration(2.0)
      );

      expect(prog.changes[0].time).toBe(0);
      expect(prog.changes[1].time).toBe(2.0);
    });

    it('sets chord duration correctly', () => {
      const scale = new Scale('C4', 'major');
      const prog = ChordProgression.fromDegrees(
        scale,
        ['I', 'V'],
        Duration(1.5)
      );

      expect(prog.changes[0].duration).toBe(1.5);
      expect(prog.changes[1].duration).toBe(1.5);
    });

    it('stores parent scale', () => {
      const scale = new Scale('C4', 'major');
      const prog = ChordProgression.fromDegrees(
        scale,
        ['I', 'V'],
        Duration(1.0)
      );

      expect(prog.scale).toBe(scale);
    });

    it('works with different scales', () => {
      const dMinor = new Scale('D4', 'minor');
      const prog = ChordProgression.fromDegrees(
        dMinor,
        ['i', 'iv', 'v'],
        Duration(1.0)
      );

      expect(prog.changes[0].chord.root).toBe('D4');
      expect(prog.changes[1].chord.root).toBe('G4');
      expect(prog.changes[2].chord.root).toBe('A4');
    });
  });

  describe('transpose', () => {
    it('transposes all chords in progression', () => {
      const scale = new Scale('C4', 'major');
      const prog = ChordProgression.fromDegrees(
        scale,
        ['I', 'IV', 'V'],
        Duration(1.0)
      );

      const transposed = prog.transpose(2); // Up to D major

      expect(transposed.changes[0].chord.root).toBe('D4');
      expect(transposed.changes[1].chord.root).toBe('G4');
      expect(transposed.changes[2].chord.root).toBe('A4');
    });

    it('transposes parent scale', () => {
      const cMajor = new Scale('C4', 'major');
      const prog = ChordProgression.fromDegrees(
        cMajor,
        ['I', 'V'],
        Duration(1.0)
      );

      const transposed = prog.transpose(7); // Up to G major

      expect(transposed.scale?.root).toBe('G4');
    });

    it('preserves timing when transposing', () => {
      const scale = new Scale('C4', 'major');
      const prog = ChordProgression.fromDegrees(
        scale,
        ['I', 'V'],
        Duration(1.0)
      );

      const transposed = prog.transpose(5);

      expect(transposed.changes[0].time).toBe(prog.changes[0].time);
      expect(transposed.changes[1].time).toBe(prog.changes[1].time);
    });
  });

  describe('fast', () => {
    it('doubles speed with factor 2', () => {
      const scale = new Scale('C4', 'major');
      const prog = ChordProgression.fromDegrees(
        scale,
        ['I', 'V'],
        Duration(2.0)
      );

      const faster = prog.fast(2);

      expect(faster.changes[0].duration).toBe(1.0);
      expect(faster.changes[1].duration).toBe(1.0);
      expect(faster.changes[1].time).toBe(1.0);
    });

    it('preserves chord content when speeding up', () => {
      const scale = new Scale('C4', 'major');
      const prog = ChordProgression.fromDegrees(
        scale,
        ['I', 'V'],
        Duration(1.0)
      );

      const faster = prog.fast(2);

      expect(faster.changes[0].chord.root).toBe(prog.changes[0].chord.root);
    });

    it('throws error for non-positive factor', () => {
      const scale = new Scale('C4', 'major');
      const prog = ChordProgression.fromDegrees(
        scale,
        ['I'],
        Duration(1.0)
      );

      expect(() => prog.fast(0)).toThrow(RangeError);
      expect(() => prog.fast(-1)).toThrow(RangeError);
    });
  });

  describe('slow', () => {
    it('halves speed with factor 2', () => {
      const scale = new Scale('C4', 'major');
      const prog = ChordProgression.fromDegrees(
        scale,
        ['I', 'V'],
        Duration(1.0)
      );

      const slower = prog.slow(2);

      expect(slower.changes[0].duration).toBe(2.0);
      expect(slower.changes[1].duration).toBe(2.0);
      expect(slower.changes[1].time).toBe(2.0);
    });

    it('throws error for non-positive factor', () => {
      const scale = new Scale('C4', 'major');
      const prog = ChordProgression.fromDegrees(
        scale,
        ['I'],
        Duration(1.0)
      );

      expect(() => prog.slow(0)).toThrow(RangeError);
      expect(() => prog.slow(-1)).toThrow(RangeError);
    });
  });

  describe('append', () => {
    it('concatenates two progressions', () => {
      const scale = new Scale('C4', 'major');
      const prog1 = ChordProgression.fromDegrees(
        scale,
        ['I', 'IV'],
        Duration(1.0)
      );
      const prog2 = ChordProgression.fromDegrees(
        scale,
        ['V', 'I'],
        Duration(1.0)
      );

      const combined = prog1.append(prog2);

      expect(combined.changes).toHaveLength(4);
      expect(combined.changes[0].chord.root).toBe('C4'); // I
      expect(combined.changes[1].chord.root).toBe('F4'); // IV
      expect(combined.changes[2].chord.root).toBe('G4'); // V
      expect(combined.changes[3].chord.root).toBe('C4'); // I
    });

    it('adjusts timing of appended progression', () => {
      const scale = new Scale('C4', 'major');
      const prog1 = ChordProgression.fromDegrees(
        scale,
        ['I', 'IV'],
        Duration(2.0)
      );
      const prog2 = ChordProgression.fromDegrees(
        scale,
        ['V'],
        Duration(1.0)
      );

      const combined = prog1.append(prog2);

      // First prog ends at 4.0 (2 chords * 2 duration)
      expect(combined.changes[2].time).toBe(4.0);
    });
  });

  describe('duration', () => {
    it('calculates total duration', () => {
      const scale = new Scale('C4', 'major');
      const prog = ChordProgression.fromDegrees(
        scale,
        ['I', 'V', 'vi', 'IV'],
        Duration(2.0)
      );

      expect(prog.duration).toBe(8.0); // 4 chords * 2 duration
    });

    it('returns 0 for empty progression', () => {
      const prog = new ChordProgression([]);

      expect(prog.duration).toBe(0);
    });

    it('accounts for gaps in timing', () => {
      const changes = [
        {
          chord: ChordVoicing.fromQuality('C4', 'maj'),
          time: Seconds(0),
          duration: Duration(1),
        },
        {
          chord: ChordVoicing.fromQuality('G4', 'maj'),
          time: Seconds(5), // Gap at 1-5
          duration: Duration(2),
        },
      ];

      const prog = new ChordProgression(changes);

      expect(prog.duration).toBe(7.0); // 5 + 2
    });
  });

  describe('immutability', () => {
    it('does not modify original when transposing', () => {
      const scale = new Scale('C4', 'major');
      const original = ChordProgression.fromDegrees(
        scale,
        ['I', 'V'],
        Duration(1.0)
      );
      const originalRoot = original.changes[0].chord.root;

      original.transpose(5);

      expect(original.changes[0].chord.root).toBe(originalRoot);
    });

    it('does not modify original when speeding up', () => {
      const scale = new Scale('C4', 'major');
      const original = ChordProgression.fromDegrees(
        scale,
        ['I', 'V'],
        Duration(2.0)
      );
      const originalDuration = original.changes[0].duration;

      original.fast(2);

      expect(original.changes[0].duration).toBe(originalDuration);
    });

    it('does not modify original when appending', () => {
      const scale = new Scale('C4', 'major');
      const original = ChordProgression.fromDegrees(
        scale,
        ['I', 'V'],
        Duration(1.0)
      );
      const originalLength = original.changes.length;

      const other = ChordProgression.fromDegrees(
        scale,
        ['IV'],
        Duration(1.0)
      );

      original.append(other);

      expect(original.changes.length).toBe(originalLength);
    });

    it('changes array is readonly', () => {
      const scale = new Scale('C4', 'major');
      const prog = ChordProgression.fromDegrees(
        scale,
        ['I', 'V'],
        Duration(1.0)
      );

      expect(() => {
        // @ts-expect-error - Testing immutability at runtime
        prog.changes.push(null);
      }).toThrow();
    });
  });

  describe('toPattern', () => {
    it('converts to block chord pattern', () => {
      const scale = new Scale('C4', 'major');
      const prog = ChordProgression.fromDegrees(
        scale,
        ['I', 'V'],
        Duration(2.0)
      );

      const pattern = prog.toPattern('block');

      expect(pattern.events.length).toBeGreaterThan(0);
      // Block chords: all notes start at the same time for each chord
      const firstChordEvents = pattern.events.filter(e => e.time === 0);
      expect(firstChordEvents.length).toBe(3); // I chord has 3 notes (C, E, G)
    });

    it('converts to arpeggio pattern', () => {
      const scale = new Scale('C4', 'major');
      const prog = ChordProgression.fromDegrees(
        scale,
        ['I'],
        Duration(1.0)
      );

      const pattern = prog.toPattern('arpeggio');

      expect(pattern.events.length).toBeGreaterThan(0);
      // Arpeggio: notes are sequential, not simultaneous
      const times = pattern.events.map(e => e.time);
      const uniqueTimes = new Set(times);
      expect(uniqueTimes.size).toBeGreaterThan(1);
    });

    it('defaults to block style', () => {
      const scale = new Scale('C4', 'major');
      const prog = ChordProgression.fromDegrees(
        scale,
        ['I'],
        Duration(1.0)
      );

      const pattern = prog.toPattern();

      expect(pattern.events).toBeDefined();
    });

    it('handles multiple chords in progression', () => {
      const scale = new Scale('C4', 'major');
      const prog = ChordProgression.fromDegrees(
        scale,
        ['I', 'IV', 'V'],
        Duration(1.0)
      );

      const pattern = prog.toPattern('block');

      // Should have events from all three chords
      expect(pattern.events.length).toBeGreaterThan(6); // 3 chords × ~3 notes each
    });
  });
});
