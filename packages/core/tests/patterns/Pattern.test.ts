import { describe, it, expect } from 'vitest';
import { Pattern } from '../../src/patterns/Pattern';
import type { NoteEvent, RestEvent, ChordEvent, Event } from '../../src/primitives/Event';
import { Note, C, D, E, F, G } from '../../src/primitives/Note';
import { Seconds, Velocity, MIDINote, Duration } from '../../src/types/brands';
import * as fc from 'fast-check';

// Helper function to create note events
function createNoteEvent(
  note: Note,
  time: number,
  duration: number,
  velocity: number = 80
): NoteEvent {
  return {
    type: 'note',
    time: Seconds(time),
    duration: Duration(duration),
    velocity: Velocity(velocity),
    pitch: note.pitch,
    note: note,
  };
}

// Helper function to create rest events
function createRestEvent(time: number, duration: number): RestEvent {
  return {
    type: 'rest',
    time: Seconds(time),
    duration: Duration(duration),
    velocity: Velocity(0),
  };
}

// Helper function to create chord events
function createChordEvent(
  notes: Note[],
  time: number,
  duration: number,
  velocity: number = 80
): ChordEvent {
  return {
    type: 'chord',
    time: Seconds(time),
    duration: Duration(duration),
    velocity: Velocity(velocity),
    notes: notes,
  };
}

describe('Pattern', () => {
  describe('construction', () => {
    it('creates empty pattern', () => {
      const pattern = new Pattern([]);
      expect(pattern.events.length).toBe(0);
      expect(pattern.duration).toBe(0);
      expect(pattern.isEmpty).toBe(true);
    });

    it('creates pattern with single note', () => {
      const event = createNoteEvent(C('4'), 0, 0.25);
      const pattern = new Pattern([event]);

      expect(pattern.events.length).toBe(1);
      expect(pattern.duration).toBe(0.25);
      expect(pattern.isEmpty).toBe(false);
    });

    it('creates pattern with multiple notes', () => {
      const events = [
        createNoteEvent(C('4'), 0, 0.25),
        createNoteEvent(D('4'), 0.25, 0.25),
        createNoteEvent(E('4'), 0.5, 0.25),
      ];
      const pattern = new Pattern(events);

      expect(pattern.events.length).toBe(3);
      expect(pattern.duration).toBe(0.75);
    });

    it('creates pattern with mixed event types', () => {
      const events: Event[] = [
        createNoteEvent(C('4'), 0, 0.25),
        createRestEvent(0.25, 0.25),
        createChordEvent([C('4'), E('4'), G('4')], 0.5, 0.5),
      ];
      const pattern = new Pattern(events);

      expect(pattern.events.length).toBe(3);
      expect(pattern.events[0].type).toBe('note');
      expect(pattern.events[1].type).toBe('rest');
      expect(pattern.events[2].type).toBe('chord');
    });

    it('freezes events array (immutability)', () => {
      const event = createNoteEvent(C('4'), 0, 0.25);
      const pattern = new Pattern([event]);

      expect(Object.isFrozen(pattern.events)).toBe(true);
    });

    it('calculates duration correctly for overlapping events', () => {
      const events = [
        createNoteEvent(C('4'), 0, 1.0), // 0 to 1.0
        createNoteEvent(E('4'), 0.5, 0.5), // 0.5 to 1.0
      ];
      const pattern = new Pattern(events);

      expect(pattern.duration).toBe(1.0);
    });

    it('calculates duration from latest ending event', () => {
      const events = [
        createNoteEvent(C('4'), 0, 0.5),
        createNoteEvent(D('4'), 0.25, 1.0), // Ends at 1.25
        createNoteEvent(E('4'), 0.5, 0.25),
      ];
      const pattern = new Pattern(events);

      expect(pattern.duration).toBe(1.25);
    });
  });

  describe('transpose', () => {
    it('transposes all notes up by semitones', () => {
      const events = [
        createNoteEvent(C('4'), 0, 0.25),
        createNoteEvent(E('4'), 0.25, 0.25),
      ];
      const pattern = new Pattern(events);
      const transposed = pattern.transpose(2);

      expect((transposed.events[0] as NoteEvent).note.name).toBe('D4');
      expect((transposed.events[1] as NoteEvent).note.name).toBe('F#4');
    });

    it('transposes all notes down by semitones', () => {
      const events = [
        createNoteEvent(C('4'), 0, 0.25),
        createNoteEvent(E('4'), 0.25, 0.25),
      ];
      const pattern = new Pattern(events);
      const transposed = pattern.transpose(-3);

      expect((transposed.events[0] as NoteEvent).pitch).toBe(57); // A3
      expect((transposed.events[1] as NoteEvent).pitch).toBe(61); // C#4
    });

    it('transposes chords', () => {
      const events: Event[] = [
        createChordEvent([C('4'), E('4'), G('4')], 0, 0.5),
      ];
      const pattern = new Pattern(events);
      const transposed = pattern.transpose(2);

      const chord = transposed.events[0] as ChordEvent;
      expect(chord.notes[0].name).toBe('D4');
      expect(chord.notes[1].name).toBe('F#4');
      expect(chord.notes[2].name).toBe('A4');
    });

    it('does not transpose rests', () => {
      const events: Event[] = [
        createNoteEvent(C('4'), 0, 0.25),
        createRestEvent(0.25, 0.25),
      ];
      const pattern = new Pattern(events);
      const transposed = pattern.transpose(5);

      expect(transposed.events[1].type).toBe('rest');
      expect(transposed.events[1].time).toBe(0.25);
    });

    it('returns new Pattern (immutability)', () => {
      const events = [createNoteEvent(C('4'), 0, 0.25)];
      const original = new Pattern(events);
      const transposed = original.transpose(2);

      expect(original).not.toBe(transposed);
      expect((original.events[0] as NoteEvent).note.name).toBe('C4');
      expect((transposed.events[0] as NoteEvent).note.name).toBe('D4');
    });
  });

  describe('retrograde', () => {
    it('reverses pattern with single note', () => {
      const events = [createNoteEvent(C('4'), 0, 0.25)];
      const pattern = new Pattern(events);
      const retro = pattern.retrograde();

      expect(retro.events.length).toBe(1);
      expect(retro.events[0].time).toBe(0);
    });

    it('reverses pattern with multiple notes', () => {
      const events = [
        createNoteEvent(C('4'), 0, 0.25), // 0 to 0.25
        createNoteEvent(D('4'), 0.25, 0.25), // 0.25 to 0.5
        createNoteEvent(E('4'), 0.5, 0.25), // 0.5 to 0.75
      ];
      const pattern = new Pattern(events);
      const retro = pattern.retrograde();

      // Original C D E becomes E D C
      expect((retro.events[0] as NoteEvent).note.name).toBe('E4');
      expect((retro.events[1] as NoteEvent).note.name).toBe('D4');
      expect((retro.events[2] as NoteEvent).note.name).toBe('C4');

      // Check timing is reversed
      expect(retro.events[0].time).toBeCloseTo(0, 5);
      expect(retro.events[1].time).toBeCloseTo(0.25, 5);
      expect(retro.events[2].time).toBeCloseTo(0.5, 5);
    });

    it('preserves duration', () => {
      const events = [
        createNoteEvent(C('4'), 0, 0.25),
        createNoteEvent(D('4'), 0.25, 0.5),
      ];
      const pattern = new Pattern(events);
      const retro = pattern.retrograde();

      expect(retro.duration).toBeCloseTo(pattern.duration, 5);
    });

    it('returns new Pattern (immutability)', () => {
      const events = [
        createNoteEvent(C('4'), 0, 0.25),
        createNoteEvent(D('4'), 0.25, 0.25),
      ];
      const original = new Pattern(events);
      const retro = original.retrograde();

      expect(original).not.toBe(retro);
      expect((original.events[0] as NoteEvent).note.name).toBe('C4');
      expect((retro.events[0] as NoteEvent).note.name).toBe('D4');
    });
  });

  describe('fast', () => {
    it('doubles speed (halves durations)', () => {
      const events = [
        createNoteEvent(C('4'), 0, 0.5),
        createNoteEvent(D('4'), 0.5, 0.5),
      ];
      const pattern = new Pattern(events);
      const faster = pattern.fast(2);

      expect(faster.events[0].time).toBe(0);
      expect(faster.events[0].duration).toBe(0.25);
      expect(faster.events[1].time).toBe(0.25);
      expect(faster.events[1].duration).toBe(0.25);
      expect(faster.duration).toBe(0.5);
    });

    it('quadruples speed', () => {
      const events = [createNoteEvent(C('4'), 0, 1.0)];
      const pattern = new Pattern(events);
      const faster = pattern.fast(4);

      expect(faster.events[0].duration).toBe(0.25);
      expect(faster.duration).toBe(0.25);
    });

    it('throws on zero factor', () => {
      const pattern = new Pattern([createNoteEvent(C('4'), 0, 0.25)]);
      expect(() => pattern.fast(0)).toThrow('fast factor must be positive');
    });

    it('throws on negative factor', () => {
      const pattern = new Pattern([createNoteEvent(C('4'), 0, 0.25)]);
      expect(() => pattern.fast(-2)).toThrow('fast factor must be positive');
    });

    it('returns new Pattern (immutability)', () => {
      const events = [createNoteEvent(C('4'), 0, 0.5)];
      const original = new Pattern(events);
      const faster = original.fast(2);

      expect(original).not.toBe(faster);
      expect(original.events[0].duration).toBe(0.5);
      expect(faster.events[0].duration).toBe(0.25);
    });
  });

  describe('slow', () => {
    it('halves speed (doubles durations)', () => {
      const events = [
        createNoteEvent(C('4'), 0, 0.25),
        createNoteEvent(D('4'), 0.25, 0.25),
      ];
      const pattern = new Pattern(events);
      const slower = pattern.slow(2);

      expect(slower.events[0].time).toBe(0);
      expect(slower.events[0].duration).toBe(0.5);
      expect(slower.events[1].time).toBe(0.5);
      expect(slower.events[1].duration).toBe(0.5);
      expect(slower.duration).toBe(1.0);
    });

    it('quarters speed', () => {
      const events = [createNoteEvent(C('4'), 0, 0.25)];
      const pattern = new Pattern(events);
      const slower = pattern.slow(4);

      expect(slower.events[0].duration).toBe(1.0);
      expect(slower.duration).toBe(1.0);
    });

    it('throws on zero factor', () => {
      const pattern = new Pattern([createNoteEvent(C('4'), 0, 0.25)]);
      expect(() => pattern.slow(0)).toThrow('slow factor must be positive');
    });

    it('throws on negative factor', () => {
      const pattern = new Pattern([createNoteEvent(C('4'), 0, 0.25)]);
      expect(() => pattern.slow(-2)).toThrow('slow factor must be positive');
    });

    it('is inverse of fast', () => {
      const events = [createNoteEvent(C('4'), 0, 0.25)];
      const pattern = new Pattern(events);

      const result1 = pattern.fast(2).slow(2);
      const result2 = pattern.slow(3).fast(3);

      expect(result1.events[0].duration).toBeCloseTo(pattern.events[0].duration, 5);
      expect(result2.events[0].duration).toBeCloseTo(pattern.events[0].duration, 5);
    });
  });

  describe('every', () => {
    it('applies transformation on matching cycle', () => {
      const events = [createNoteEvent(C('4'), 0, 0.25)];
      const pattern = new Pattern(events);

      // Cycle 0: apply transformation (0 % 2 === 0)
      const result = pattern.every(2, (p) => p.transpose(2), 0);

      expect((result.events[0] as NoteEvent).note.name).toBe('D4');
    });

    it('skips transformation on non-matching cycle', () => {
      const events = [createNoteEvent(C('4'), 0, 0.25)];
      const pattern = new Pattern(events);

      // Cycle 1: skip transformation (1 % 2 !== 0)
      const result = pattern.every(2, (p) => p.transpose(2), 1);

      expect((result.events[0] as NoteEvent).note.name).toBe('C4');
    });

    it('applies every 3rd cycle', () => {
      const events = [createNoteEvent(C('4'), 0, 0.25)];
      const pattern = new Pattern(events);

      expect((pattern.every(3, (p) => p.transpose(1), 0).events[0] as NoteEvent).note.name).toBe('C#4');
      expect((pattern.every(3, (p) => p.transpose(1), 1).events[0] as NoteEvent).note.name).toBe('C4');
      expect((pattern.every(3, (p) => p.transpose(1), 2).events[0] as NoteEvent).note.name).toBe('C4');
      expect((pattern.every(3, (p) => p.transpose(1), 3).events[0] as NoteEvent).note.name).toBe('C#4');
    });

    it('throws on non-integer n', () => {
      const pattern = new Pattern([createNoteEvent(C('4'), 0, 0.25)]);
      expect(() => pattern.every(2.5, (p) => p, 0)).toThrow(
        'every n must be a positive integer'
      );
    });

    it('throws on zero n', () => {
      const pattern = new Pattern([createNoteEvent(C('4'), 0, 0.25)]);
      expect(() => pattern.every(0, (p) => p, 0)).toThrow(
        'every n must be a positive integer'
      );
    });

    it('throws on negative n', () => {
      const pattern = new Pattern([createNoteEvent(C('4'), 0, 0.25)]);
      expect(() => pattern.every(-2, (p) => p, 0)).toThrow(
        'every n must be a positive integer'
      );
    });
  });

  describe('map', () => {
    it('maps over all events', () => {
      const events = [
        createNoteEvent(C('4'), 0, 0.25, 80),
        createNoteEvent(D('4'), 0.25, 0.25, 80),
      ];
      const pattern = new Pattern(events);

      const mapped = pattern.map((event) => ({
        ...event,
        velocity: Velocity(100),
      }));

      expect(mapped.events[0].velocity).toBe(100);
      expect(mapped.events[1].velocity).toBe(100);
    });

    it('provides index to map function', () => {
      const events = [
        createNoteEvent(C('4'), 0, 0.25),
        createNoteEvent(D('4'), 0.25, 0.25),
        createNoteEvent(E('4'), 0.5, 0.25),
      ];
      const pattern = new Pattern(events);

      const mapped = pattern.map((event, index) => ({
        ...event,
        velocity: Velocity(index * 10),
      }));

      expect(mapped.events[0].velocity).toBe(0);
      expect(mapped.events[1].velocity).toBe(10);
      expect(mapped.events[2].velocity).toBe(20);
    });

    it('returns new Pattern (immutability)', () => {
      const events = [createNoteEvent(C('4'), 0, 0.25, 80)];
      const original = new Pattern(events);
      const mapped = original.map((event) => ({
        ...event,
        velocity: Velocity(100),
      }));

      expect(original).not.toBe(mapped);
      expect(original.events[0].velocity).toBe(80);
      expect(mapped.events[0].velocity).toBe(100);
    });
  });

  describe('filter', () => {
    it('filters events by predicate', () => {
      const events: Event[] = [
        createNoteEvent(C('4'), 0, 0.25),
        createRestEvent(0.25, 0.25),
        createNoteEvent(D('4'), 0.5, 0.25),
      ];
      const pattern = new Pattern(events);

      const filtered = pattern.filter((event) => event.type === 'note');

      expect(filtered.events.length).toBe(2);
      expect(filtered.events[0].type).toBe('note');
      expect(filtered.events[1].type).toBe('note');
    });

    it('filters by index', () => {
      const events = [
        createNoteEvent(C('4'), 0, 0.25),
        createNoteEvent(D('4'), 0.25, 0.25),
        createNoteEvent(E('4'), 0.5, 0.25),
        createNoteEvent(F('4'), 0.75, 0.25),
      ];
      const pattern = new Pattern(events);

      // Keep only even indices
      const filtered = pattern.filter((_, index) => index % 2 === 0);

      expect(filtered.events.length).toBe(2);
      expect((filtered.events[0] as NoteEvent).note.name).toBe('C4');
      expect((filtered.events[1] as NoteEvent).note.name).toBe('E4');
    });

    it('returns empty pattern when nothing matches', () => {
      const events: Event[] = [
        createNoteEvent(C('4'), 0, 0.25),
        createNoteEvent(D('4'), 0.25, 0.25),
      ];
      const pattern = new Pattern(events);

      const filtered = pattern.filter((event) => event.type === 'rest');

      expect(filtered.events.length).toBe(0);
      expect(filtered.isEmpty).toBe(true);
    });

    it('returns new Pattern (immutability)', () => {
      const events: Event[] = [
        createNoteEvent(C('4'), 0, 0.25),
        createRestEvent(0.25, 0.25),
      ];
      const original = new Pattern(events);
      const filtered = original.filter((event) => event.type === 'note');

      expect(original).not.toBe(filtered);
      expect(original.events.length).toBe(2);
      expect(filtered.events.length).toBe(1);
    });
  });

  describe('properties', () => {
    it('exposes length property', () => {
      const pattern1 = new Pattern([]);
      const pattern2 = new Pattern([createNoteEvent(C('4'), 0, 0.25)]);
      const pattern3 = new Pattern([
        createNoteEvent(C('4'), 0, 0.25),
        createNoteEvent(D('4'), 0.25, 0.25),
        createNoteEvent(E('4'), 0.5, 0.25),
      ]);

      expect(pattern1.length).toBe(0);
      expect(pattern2.length).toBe(1);
      expect(pattern3.length).toBe(3);
    });

    it('exposes isEmpty property', () => {
      const empty = new Pattern([]);
      const notEmpty = new Pattern([createNoteEvent(C('4'), 0, 0.25)]);

      expect(empty.isEmpty).toBe(true);
      expect(notEmpty.isEmpty).toBe(false);
    });
  });

  describe('chaining transformations', () => {
    it('chains multiple transformations', () => {
      const events = [
        createNoteEvent(C('4'), 0, 0.5),
        createNoteEvent(D('4'), 0.5, 0.5),
      ];
      const pattern = new Pattern(events);

      const result = pattern.transpose(2).fast(2).retrograde();

      // Original: C4 D4, transposed: D4 E4, fast: half duration, retrograde: reverse
      expect((result.events[0] as NoteEvent).note.name).toBe('E4');
      expect((result.events[1] as NoteEvent).note.name).toBe('D4');
      expect(result.events[0].duration).toBe(0.25);
    });

    it('chains map and filter', () => {
      const events: Event[] = [
        createNoteEvent(C('4'), 0, 0.25, 50),
        createNoteEvent(D('4'), 0.25, 0.25, 80),
        createRestEvent(0.5, 0.25),
      ];
      const pattern = new Pattern(events);

      const result = pattern
        .filter((event) => event.type === 'note')
        .map((event) => ({ ...event, velocity: Velocity(100) }));

      expect(result.events.length).toBe(2);
      expect(result.events[0].velocity).toBe(100);
      expect(result.events[1].velocity).toBe(100);
    });
  });

  describe('Property-based tests', () => {
    it('retrograde twice returns original pattern', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 60, max: 72 }), { minLength: 1, maxLength: 10 }),
          (pitches) => {
            const events = pitches.map((pitch, i) =>
              createNoteEvent(Note.fromMIDI(MIDINote(pitch)), i * 0.25, 0.25)
            );
            const pattern = new Pattern(events);
            const doubled = pattern.retrograde().retrograde();

            expect(doubled.events.length).toBe(pattern.events.length);
            for (let i = 0; i < pattern.events.length; i++) {
              const original = pattern.events[i] as NoteEvent;
              const result = doubled.events[i] as NoteEvent;
              expect(result.pitch).toBe(original.pitch);
              expect(result.time).toBeCloseTo(original.time, 5);
            }
          }
        )
      );
    });

    it('fast(n).slow(n) returns original pattern', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 60, max: 72 }), { minLength: 1, maxLength: 5 }),
          fc.integer({ min: 2, max: 10 }),
          (pitches, factor) => {
            const events = pitches.map((pitch, i) =>
              createNoteEvent(Note.fromMIDI(MIDINote(pitch)), i * 0.25, 0.25)
            );
            const pattern = new Pattern(events);
            const result = pattern.fast(factor).slow(factor);

            expect(result.events.length).toBe(pattern.events.length);
            for (let i = 0; i < pattern.events.length; i++) {
              expect(result.events[i].time).toBeCloseTo(pattern.events[i].time, 5);
              expect(result.events[i].duration).toBeCloseTo(pattern.events[i].duration, 5);
            }
          }
        )
      );
    });

    it('transpose is associative', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 60, max: 72 }), { minLength: 1, maxLength: 5 }),
          fc.integer({ min: -12, max: 12 }),
          fc.integer({ min: -12, max: 12 }),
          (pitches, n1, n2) => {
            const events = pitches.map((pitch, i) =>
              createNoteEvent(Note.fromMIDI(MIDINote(pitch)), i * 0.25, 0.25)
            );
            const pattern = new Pattern(events);

            const result1 = pattern.transpose(n1).transpose(n2);
            const result2 = pattern.transpose(n1 + n2);

            for (let i = 0; i < result1.events.length; i++) {
              expect((result1.events[i] as NoteEvent).pitch).toBe(
                (result2.events[i] as NoteEvent).pitch
              );
            }
          }
        )
      );
    });

    it('filter then map equals map then filter', () => {
      fc.assert(
        fc.property(
          fc.array(fc.boolean(), { minLength: 3, maxLength: 10 }),
          (bools) => {
            const events = bools.map((isNote, i) => {
              if (isNote) {
                return createNoteEvent(C('4'), i * 0.25, 0.25, 80);
              } else {
                return createRestEvent(i * 0.25, 0.25);
              }
            });
            const pattern = new Pattern(events);

            const filterThenMap = pattern
              .filter((e) => e.type === 'note')
              .map((e) => ({ ...e, velocity: Velocity(100) }));

            const mapThenFilter = pattern
              .map((e) => ({ ...e, velocity: Velocity(100) }))
              .filter((e) => e.type === 'note');

            expect(filterThenMap.events.length).toBe(mapThenFilter.events.length);
            for (let i = 0; i < filterThenMap.events.length; i++) {
              expect(filterThenMap.events[i].type).toBe(mapThenFilter.events[i].type);
              expect(filterThenMap.events[i].velocity).toBe(100);
            }
          }
        )
      );
    });

    it('immutability: original unchanged after any transformation', () => {
      fc.assert(
        fc.property(
          fc.array(fc.integer({ min: 60, max: 72 }), { minLength: 1, maxLength: 5 }),
          (pitches) => {
            const events = pitches.map((pitch, i) =>
              createNoteEvent(Note.fromMIDI(MIDINote(pitch)), i * 0.25, 0.25)
            );
            const pattern = new Pattern(events);
            const originalFirstPitch = (pattern.events[0] as NoteEvent).pitch;
            const originalLength = pattern.events.length;

            // Apply various transformations
            pattern.transpose(5);
            pattern.retrograde();
            pattern.fast(2);
            pattern.map((e) => ({ ...e, velocity: Velocity(100) }));
            pattern.filter((e) => e.type === 'note');

            // Original should be unchanged
            expect((pattern.events[0] as NoteEvent).pitch).toBe(originalFirstPitch);
            expect(pattern.events.length).toBe(originalLength);
          }
        )
      );
    });
  });
});
