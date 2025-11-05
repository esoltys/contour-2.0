// packages/core/tests/patterns/PatternAlgebra.test.ts

import { describe, it, expect } from 'vitest';
import { Pattern } from '../../src/patterns/Pattern';
import { pattern } from '../../src/patterns/PatternBuilder';
import { Durations } from '../../src/types/music';
import { Velocity, Seconds, Duration, MIDINote } from '../../src/types/brands';
import fc from 'fast-check';

describe('Pattern Algebra', () => {
  describe('stack()', () => {
    it('layers patterns simultaneously', () => {
      const p1 = pattern()
        .note('C4', Durations.quarter)
        .note('E4', Durations.quarter)
        .build();

      const p2 = pattern()
        .note('G4', Durations.quarter)
        .note('B4', Durations.quarter)
        .build();

      const stacked = p1.stack(p2);

      expect(stacked.length).toBe(4);

      // Both patterns start at time 0
      const events = Array.from(stacked.events);
      expect(events.filter(e => e.time === 0).length).toBe(2);
    });

    it('preserves original patterns (immutability)', () => {
      const p1 = pattern().note('C4').build();
      const p2 = pattern().note('E4').build();

      const p1Length = p1.length;
      const p2Length = p2.length;

      p1.stack(p2);

      expect(p1.length).toBe(p1Length);
      expect(p2.length).toBe(p2Length);
    });

    it('stacks empty pattern', () => {
      const p1 = pattern().note('C4').build();
      const empty = new Pattern([]);

      const stacked = p1.stack(empty);
      expect(stacked.length).toBe(1);
    });
  });

  describe('append()', () => {
    it('sequences patterns one after another', () => {
      const p1 = pattern()
        .note('C4', Durations.quarter)
        .build();

      const p2 = pattern()
        .note('E4', Durations.quarter)
        .build();

      const appended = p1.append(p2);

      expect(appended.length).toBe(2);

      const events = Array.from(appended.events);
      expect(events[0].time).toBe(0);
      expect(events[1].time).toBe(Durations.quarter);
    });

    it('preserves original patterns (immutability)', () => {
      const p1 = pattern().note('C4').build();
      const p2 = pattern().note('E4').build();

      const p1Length = p1.length;
      const p2Length = p2.length;

      p1.append(p2);

      expect(p1.length).toBe(p1Length);
      expect(p2.length).toBe(p2Length);
    });

    it('appends multiple patterns', () => {
      const p1 = pattern().note('C4', Durations.quarter).build();
      const p2 = pattern().note('E4', Durations.quarter).build();
      const p3 = pattern().note('G4', Durations.quarter).build();

      const result = p1.append(p2).append(p3);

      expect(result.length).toBe(3);
      expect(result.duration).toBe(Durations.quarter * 3);
    });
  });

  describe('palindrome()', () => {
    it('creates pattern followed by its retrograde', () => {
      const p = pattern()
        .note('C4', Durations.quarter)
        .note('E4', Durations.quarter)
        .note('G4', Durations.quarter)
        .build();

      const palindrome = p.palindrome();

      expect(palindrome.length).toBe(6);

      // First half should match original
      const events = Array.from(palindrome.events);
      expect(events[0].note?.name).toBe('C4');
      expect(events[1].note?.name).toBe('E4');
      expect(events[2].note?.name).toBe('G4');

      // Second half should be reversed
      expect(events[3].note?.name).toBe('G4');
      expect(events[4].note?.name).toBe('E4');
      expect(events[5].note?.name).toBe('C4');
    });

    it('palindrome twice returns original followed by retrograde twice', () => {
      const p = pattern()
        .note('C4', Durations.quarter)
        .note('E4', Durations.quarter)
        .build();

      const palindrome = p.palindrome();
      const doublePalindrome = palindrome.palindrome();

      expect(doublePalindrome.length).toBe(8);
    });
  });

  describe('Pattern.euclidean()', () => {
    it('generates Euclidean rhythm', () => {
      const p = Pattern.euclidean(8, 3);

      expect(p.length).toBe(8);

      // Count pulses (non-rest events)
      const pulses = Array.from(p.events).filter(e => e.type === 'note');
      expect(pulses.length).toBe(3);

      // Count rests
      const rests = Array.from(p.events).filter(e => e.type === 'rest');
      expect(rests.length).toBe(5);
    });

    it('generates even distribution for common rhythms', () => {
      // Euclidean(8, 4) should be evenly distributed: x..x..x..x..
      const p = Pattern.euclidean(8, 4);
      const events = Array.from(p.events);

      // Every other event should be a pulse
      expect(events[0].type).toBe('note');
      expect(events[1].type).toBe('rest');
      expect(events[2].type).toBe('note');
      expect(events[3].type).toBe('rest');
    });

    it('handles rotation', () => {
      const p1 = Pattern.euclidean(8, 3, 0);
      const p2 = Pattern.euclidean(8, 3, 1);

      // Patterns should be different due to rotation
      const events1 = Array.from(p1.events);
      const events2 = Array.from(p2.events);

      // First event should be different
      expect(events1[0].type).not.toBe(events2[0].type);
    });

    it('generates all pulses when pulses === steps', () => {
      const p = Pattern.euclidean(4, 4);
      const events = Array.from(p.events);

      expect(events.every(e => e.type === 'note')).toBe(true);
    });

    it('generates all rests when pulses === 0', () => {
      const p = Pattern.euclidean(4, 0);
      const events = Array.from(p.events);

      expect(events.every(e => e.type === 'rest')).toBe(true);
    });

    it('throws on invalid parameters', () => {
      expect(() => Pattern.euclidean(0, 0)).toThrow(RangeError);
      expect(() => Pattern.euclidean(8, -1)).toThrow(RangeError);
      expect(() => Pattern.euclidean(8, 9)).toThrow(RangeError);
    });

    it('can be combined with other transformations', () => {
      const p = Pattern.euclidean(16, 5)
        .fast(2)
        .transpose(7);

      expect(p.length).toBe(16);

      // Check that transpose worked
      const noteEvents = Array.from(p.events).filter(e => e.type === 'note');
      expect(noteEvents[0].pitch).toBe(60 + 7); // C4 + perfect fifth
    });
  });

  describe('Pattern algebra properties', () => {
    it('stack is commutative in event count', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 60, max: 72 }), { minLength: 1, maxLength: 5 }),
          fc.array(fc.integer({ min: 60, max: 72 }), { minLength: 1, maxLength: 5 }),
          (pitches1, pitches2) => {
            const p1 = new Pattern(
              pitches1.map((pitch, i) => ({
                type: 'note' as const,
                time: i * 0.25,
                duration: 0.25,
                velocity: 80,
                pitch,
                note: null as any,
              }))
            );

            const p2 = new Pattern(
              pitches2.map((pitch, i) => ({
                type: 'note' as const,
                time: i * 0.25,
                duration: 0.25,
                velocity: 80,
                pitch,
                note: null as any,
              }))
            );

            const stacked1 = p1.stack(p2);
            const stacked2 = p2.stack(p1);

            return stacked1.length === stacked2.length;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('append is associative', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 60, max: 72 }), { minLength: 1, maxLength: 3 }),
          fc.array(fc.integer({ min: 60, max: 72 }), { minLength: 1, maxLength: 3 }),
          fc.array(fc.integer({ min: 60, max: 72 }), { minLength: 1, maxLength: 3 }),
          (pitches1, pitches2, pitches3) => {
            const p1 = new Pattern(
              pitches1.map((pitch, i) => ({
                type: 'note' as const,
                time: i * 0.25,
                duration: 0.25,
                velocity: 80,
                pitch,
                note: null as any,
              }))
            );

            const p2 = new Pattern(
              pitches2.map((pitch, i) => ({
                type: 'note' as const,
                time: i * 0.25,
                duration: 0.25,
                velocity: 80,
                pitch,
                note: null as any,
              }))
            );

            const p3 = new Pattern(
              pitches3.map((pitch, i) => ({
                type: 'note' as const,
                time: i * 0.25,
                duration: 0.25,
                velocity: 80,
                pitch,
                note: null as any,
              }))
            );

            const result1 = p1.append(p2).append(p3);
            const result2 = p1.append(p2.append(p3));

            return result1.length === result2.length;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('palindrome followed by retrograde equals double append', () => {
      const p = pattern()
        .note('C4', Durations.quarter)
        .note('E4', Durations.quarter)
        .build();

      const palindrome = p.palindrome();
      const doublePattern = p.append(p.retrograde());

      expect(palindrome.length).toBe(doublePattern.length);
      expect(palindrome.duration).toBe(doublePattern.duration);
    });
  });

  describe('Combining stack and append', () => {
    it('creates polyphonic sequences', () => {
      // Melody
      const melody = pattern()
        .note('C4', Durations.quarter)
        .note('E4', Durations.quarter)
        .build();

      // Harmony
      const harmony = pattern()
        .note('E3', Durations.quarter)
        .note('G3', Durations.quarter)
        .build();

      // Bass line
      const bass = pattern()
        .note('C2', Durations.half)
        .build();

      // Combine: melody and harmony stacked, then append bass
      const phrase1 = melody.stack(harmony);
      const phrase2 = bass;
      const composition = phrase1.append(phrase2);

      expect(composition.length).toBe(5); // 2 melody + 2 harmony + 1 bass
    });
  });
});
