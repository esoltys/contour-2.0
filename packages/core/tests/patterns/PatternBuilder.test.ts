import { describe, it, expect } from 'vitest';
import { PatternBuilder, pattern } from '../../src/patterns/PatternBuilder';
import type { NoteEvent, ChordEvent, RestEvent } from '../../src/primitives/Event';
import { C, D, E, G } from '../../src/primitives/Note';
import { Velocity } from '../../src/types/brands';
import { Durations } from '../../src/types/music';
import { Scale } from '../../src/theory/Scale';

describe('PatternBuilder', () => {
  describe('construction', () => {
    it('creates empty builder', () => {
      const builder = new PatternBuilder();
      const builtPattern = builder.build();

      expect(builtPattern.events.length).toBe(0);
      expect(builtPattern.isEmpty).toBe(true);
    });

    it('creates builder with factory function', () => {
      const builder = pattern();
      expect(builder).toBeInstanceOf(PatternBuilder);
    });

    it('factory function accepts optional name', () => {
      const builder = pattern('melody');
      expect(builder).toBeInstanceOf(PatternBuilder);
    });
  });

  describe('note()', () => {
    it('adds single note by name', () => {
      const builder = new PatternBuilder();
      builder.note('C4');
      const builtPattern = builder.build();

      expect(builtPattern.events.length).toBe(1);
      const event = builtPattern.events[0] as NoteEvent;
      expect(event.type).toBe('note');
      expect(event.note.name).toBe('C4');
      expect(event.time).toBe(0);
      expect(event.duration).toBe(0.25); // Default quarter note
    });

    it('adds note with Note object', () => {
      const builder = new PatternBuilder();
      builder.note(C('4'));
      const builtPattern = builder.build();

      expect(builtPattern.events.length).toBe(1);
      const event = builtPattern.events[0] as NoteEvent;
      expect(event.note.name).toBe('C4');
    });

    it('adds note with custom duration', () => {
      const builder = new PatternBuilder();
      builder.note('C4', Durations.half);
      const builtPattern = builder.build();

      const event = builtPattern.events[0] as NoteEvent;
      expect(event.duration).toBe(0.5);
    });

    it('adds note with custom velocity', () => {
      const builder = new PatternBuilder();
      builder.note('C4', Durations.quarter, Velocity(100));
      const builtPattern = builder.build();

      const event = builtPattern.events[0] as NoteEvent;
      expect(event.velocity).toBe(100);
    });

    it('advances time after adding note', () => {
      const builder = new PatternBuilder();
      builder.note('C4'); // 0 to 0.25
      builder.note('D4'); // 0.25 to 0.5
      const builtPattern = builder.build();

      expect(builtPattern.events[0].time).toBe(0);
      expect(builtPattern.events[1].time).toBe(0.25);
    });

    it('supports method chaining', () => {
      const builtPattern = new PatternBuilder()
        .note('C4')
        .note('D4')
        .note('E4')
        .build();

      expect(builtPattern.events.length).toBe(3);
    });
  });

  describe('notes()', () => {
    it('adds multiple notes sequentially', () => {
      const builder = new PatternBuilder();
      builder.notes(['C4', 'D4', 'E4']);
      const builtPattern = builder.build();

      expect(builtPattern.events.length).toBe(3);
      expect((builtPattern.events[0] as NoteEvent).note.name).toBe('C4');
      expect((builtPattern.events[1] as NoteEvent).note.name).toBe('D4');
      expect((builtPattern.events[2] as NoteEvent).note.name).toBe('E4');
    });

    it('adds notes with custom duration', () => {
      const builder = new PatternBuilder();
      builder.notes(['C4', 'D4'], Durations.eighth);
      const builtPattern = builder.build();

      expect(builtPattern.events[0].duration).toBe(0.125);
      expect(builtPattern.events[1].duration).toBe(0.125);
    });

    it('adds notes with custom velocity', () => {
      const builder = new PatternBuilder();
      builder.notes(['C4', 'D4'], Durations.quarter, Velocity(90));
      const builtPattern = builder.build();

      expect(builtPattern.events[0].velocity).toBe(90);
      expect(builtPattern.events[1].velocity).toBe(90);
    });

    it('accepts Note objects', () => {
      const builder = new PatternBuilder();
      builder.notes([C('4'), D('4'), E('4')]);
      const builtPattern = builder.build();

      expect(builtPattern.events.length).toBe(3);
      expect((builtPattern.events[0] as NoteEvent).note.name).toBe('C4');
    });

    it('supports method chaining', () => {
      const builtPattern = new PatternBuilder()
        .notes(['C4', 'D4'])
        .notes(['E4', 'F4'])
        .build();

      expect(builtPattern.events.length).toBe(4);
    });
  });

  describe('chord()', () => {
    it('adds chord with multiple notes', () => {
      const builder = new PatternBuilder();
      builder.chord(['C4', 'E4', 'G4']);
      const builtPattern = builder.build();

      expect(builtPattern.events.length).toBe(1);
      const event = builtPattern.events[0] as ChordEvent;
      expect(event.type).toBe('chord');
      expect(event.notes.length).toBe(3);
      expect(event.notes[0].name).toBe('C4');
      expect(event.notes[1].name).toBe('E4');
      expect(event.notes[2].name).toBe('G4');
    });

    it('all notes in chord have same start time', () => {
      const builder = new PatternBuilder();
      builder.chord(['C4', 'E4', 'G4']);
      const builtPattern = builder.build();

      const event = builtPattern.events[0] as ChordEvent;
      expect(event.time).toBe(0);
    });

    it('accepts Note objects', () => {
      const builder = new PatternBuilder();
      builder.chord([C('4'), E('4'), G('4')]);
      const builtPattern = builder.build();

      const event = builtPattern.events[0] as ChordEvent;
      expect(event.notes.length).toBe(3);
    });

    it('adds chord with custom duration', () => {
      const builder = new PatternBuilder();
      builder.chord(['C4', 'E4', 'G4'], Durations.half);
      const builtPattern = builder.build();

      const event = builtPattern.events[0] as ChordEvent;
      expect(event.duration).toBe(0.5);
    });

    it('adds chord with custom velocity', () => {
      const builder = new PatternBuilder();
      builder.chord(['C4', 'E4', 'G4'], Durations.quarter, Velocity(100));
      const builtPattern = builder.build();

      const event = builtPattern.events[0] as ChordEvent;
      expect(event.velocity).toBe(100);
    });

    it('advances time after adding chord', () => {
      const builder = new PatternBuilder();
      builder.chord(['C4', 'E4', 'G4']); // 0 to 0.25
      builder.note('C5'); // 0.25 to 0.5
      const builtPattern = builder.build();

      expect(builtPattern.events[0].time).toBe(0);
      expect(builtPattern.events[1].time).toBe(0.25);
    });

    it('supports method chaining', () => {
      const builtPattern = new PatternBuilder()
        .chord(['C4', 'E4', 'G4'])
        .chord(['F4', 'A4', 'C5'])
        .build();

      expect(builtPattern.events.length).toBe(2);
    });
  });

  describe('rest()', () => {
    it('adds rest with default duration', () => {
      const builder = new PatternBuilder();
      builder.rest();
      const builtPattern = builder.build();

      expect(builtPattern.events.length).toBe(1);
      const event = builtPattern.events[0] as RestEvent;
      expect(event.type).toBe('rest');
      expect(event.duration).toBe(0.25);
      expect(event.velocity).toBe(0);
    });

    it('adds rest with custom duration', () => {
      const builder = new PatternBuilder();
      builder.rest(Durations.half);
      const builtPattern = builder.build();

      const event = builtPattern.events[0] as RestEvent;
      expect(event.duration).toBe(0.5);
    });

    it('advances time after adding rest', () => {
      const builder = new PatternBuilder();
      builder.note('C4'); // 0 to 0.25
      builder.rest(); // 0.25 to 0.5
      builder.note('D4'); // 0.5 to 0.75
      const builtPattern = builder.build();

      expect(builtPattern.events[0].time).toBe(0);
      expect(builtPattern.events[1].time).toBe(0.25);
      expect(builtPattern.events[2].time).toBe(0.5);
    });

    it('supports method chaining', () => {
      const builtPattern = new PatternBuilder()
        .note('C4')
        .rest()
        .note('D4')
        .build();

      expect(builtPattern.events.length).toBe(3);
    });
  });

  describe('withDuration()', () => {
    it('sets default duration for subsequent notes', () => {
      const builder = new PatternBuilder();
      builder.withDuration(Durations.eighth);
      builder.note('C4');
      builder.note('D4');
      const builtPattern = builder.build();

      expect(builtPattern.events[0].duration).toBe(0.125);
      expect(builtPattern.events[1].duration).toBe(0.125);
    });

    it('does not affect previous notes', () => {
      const builder = new PatternBuilder();
      builder.note('C4'); // Default quarter
      builder.withDuration(Durations.eighth);
      builder.note('D4'); // Eighth
      const builtPattern = builder.build();

      expect(builtPattern.events[0].duration).toBe(0.25);
      expect(builtPattern.events[1].duration).toBe(0.125);
    });

    it('supports method chaining', () => {
      const builtPattern = new PatternBuilder()
        .withDuration(Durations.sixteenth)
        .note('C4')
        .note('D4')
        .build();

      expect(builtPattern.events[0].duration).toBe(0.0625);
      expect(builtPattern.events[1].duration).toBe(0.0625);
    });

    it('affects rests', () => {
      const builder = new PatternBuilder();
      builder.withDuration(Durations.half);
      builder.rest();
      const builtPattern = builder.build();

      expect(builtPattern.events[0].duration).toBe(0.5);
    });
  });

  describe('withVelocity()', () => {
    it('sets default velocity for subsequent notes', () => {
      const builder = new PatternBuilder();
      builder.withVelocity(Velocity(100));
      builder.note('C4');
      builder.note('D4');
      const builtPattern = builder.build();

      expect(builtPattern.events[0].velocity).toBe(100);
      expect(builtPattern.events[1].velocity).toBe(100);
    });

    it('does not affect previous notes', () => {
      const builder = new PatternBuilder();
      builder.note('C4'); // Default 80
      builder.withVelocity(Velocity(100));
      builder.note('D4'); // 100
      const builtPattern = builder.build();

      expect(builtPattern.events[0].velocity).toBe(80);
      expect(builtPattern.events[1].velocity).toBe(100);
    });

    it('supports method chaining', () => {
      const builtPattern = new PatternBuilder()
        .withVelocity(Velocity(120))
        .note('C4')
        .note('D4')
        .build();

      expect(builtPattern.events[0].velocity).toBe(120);
      expect(builtPattern.events[1].velocity).toBe(120);
    });
  });

  describe('crescendo()', () => {
    it('applies gradual velocity increase', () => {
      const builder = new PatternBuilder();
      builder.notes(['C4', 'D4', 'E4', 'F4', 'G4']);
      builder.crescendo(40, 120);
      const builtPattern = builder.build();

      expect(builtPattern.events[0].velocity).toBe(40);
      expect(builtPattern.events[1].velocity).toBe(60);
      expect(builtPattern.events[2].velocity).toBe(80);
      expect(builtPattern.events[3].velocity).toBe(100);
      expect(builtPattern.events[4].velocity).toBe(120);
    });

    it('applies diminuendo (velocity decrease)', () => {
      const builder = new PatternBuilder();
      builder.notes(['C4', 'D4', 'E4']);
      builder.crescendo(100, 40);
      const builtPattern = builder.build();

      expect(builtPattern.events[0].velocity).toBe(100);
      expect(builtPattern.events[1].velocity).toBe(70);
      expect(builtPattern.events[2].velocity).toBe(40);
    });

    it('handles single note', () => {
      const builder = new PatternBuilder();
      builder.note('C4');
      builder.crescendo(50, 100);
      const builtPattern = builder.build();

      expect(builtPattern.events[0].velocity).toBe(50);
    });

    it('handles empty pattern', () => {
      const builder = new PatternBuilder();
      expect(() => builder.crescendo(40, 120)).not.toThrow();
    });

    it('throws on invalid start velocity', () => {
      const builder = new PatternBuilder();
      builder.note('C4');
      expect(() => builder.crescendo(-10, 100)).toThrow('startVel must be 0-127');
      expect(() => builder.crescendo(200, 100)).toThrow('startVel must be 0-127');
    });

    it('throws on invalid end velocity', () => {
      const builder = new PatternBuilder();
      builder.note('C4');
      expect(() => builder.crescendo(40, -10)).toThrow('endVel must be 0-127');
      expect(() => builder.crescendo(40, 200)).toThrow('endVel must be 0-127');
    });

    it('supports method chaining', () => {
      const builtPattern = new PatternBuilder()
        .notes(['C4', 'D4', 'E4'])
        .crescendo(40, 100)
        .build();

      expect(builtPattern.events[0].velocity).toBe(40);
      expect(builtPattern.events[2].velocity).toBe(100);
    });
  });

  describe('humanize()', () => {
    it('adds timing variation', () => {
      const builder = new PatternBuilder();
      builder.notes(['C4', 'D4', 'E4', 'F4']);
      const originalTimes = [0, 0.25, 0.5, 0.75];

      builder.humanize(0.1, 0);
      const builtPattern = builder.build();

      // Check that times have changed (with some tolerance)
      let hasVariation = false;
      for (let i = 0; i < builtPattern.events.length; i++) {
        const timeDiff = Math.abs(builtPattern.events[i].time - originalTimes[i]);
        if (timeDiff > 0.001) {
          hasVariation = true;
          break;
        }
      }

      expect(hasVariation).toBe(true);
    });

    it('adds velocity variation', () => {
      const builder = new PatternBuilder();
      builder.notes(['C4', 'D4', 'E4', 'F4']);
      const originalVelocity = 80;

      builder.humanize(0, 0.2);
      const builtPattern = builder.build();

      // Check that velocities have changed
      let hasVariation = false;
      for (const event of builtPattern.events) {
        if (event.velocity !== originalVelocity) {
          hasVariation = true;
          break;
        }
      }

      expect(hasVariation).toBe(true);
    });

    it('keeps velocities in valid range', () => {
      const builder = new PatternBuilder();
      builder.withVelocity(Velocity(10));
      builder.notes(['C4', 'D4', 'E4']);

      builder.humanize(0, 0.5);
      const builtPattern = builder.build();

      for (const event of builtPattern.events) {
        expect(event.velocity).toBeGreaterThanOrEqual(1);
        expect(event.velocity).toBeLessThanOrEqual(127);
      }
    });

    it('keeps times non-negative', () => {
      const builder = new PatternBuilder();
      builder.notes(['C4', 'D4', 'E4']);

      builder.humanize(0.5, 0);
      const builtPattern = builder.build();

      for (const event of builtPattern.events) {
        expect(event.time).toBeGreaterThanOrEqual(0);
      }
    });

    it('throws on invalid timing amount', () => {
      const builder = new PatternBuilder();
      builder.note('C4');
      expect(() => builder.humanize(-0.1, 0)).toThrow('timingAmount must be 0-1');
      expect(() => builder.humanize(1.5, 0)).toThrow('timingAmount must be 0-1');
    });

    it('throws on invalid velocity amount', () => {
      const builder = new PatternBuilder();
      builder.note('C4');
      expect(() => builder.humanize(0, -0.1)).toThrow('velocityAmount must be 0-1');
      expect(() => builder.humanize(0, 1.5)).toThrow('velocityAmount must be 0-1');
    });

    it('supports method chaining', () => {
      const builtPattern = new PatternBuilder()
        .notes(['C4', 'D4', 'E4'])
        .humanize()
        .build();

      expect(builtPattern.events.length).toBe(3);
    });
  });

  describe('swing()', () => {
    it('delays odd-indexed events', () => {
      const builder = new PatternBuilder();
      builder.notes(['C4', 'D4', 'E4', 'F4']);
      const originalTime1 = 0.25;

      builder.swing(0.2);
      const builtPattern = builder.build();

      // Even indices (0, 2) should be unchanged
      expect(builtPattern.events[0].time).toBe(0);
      expect(builtPattern.events[2].time).toBe(0.5);

      // Odd indices (1, 3) should be delayed
      expect(builtPattern.events[1].time).toBeGreaterThan(originalTime1);
      expect(builtPattern.events[3].time).toBeGreaterThan(0.75);
    });

    it('swing amount affects delay magnitude', () => {
      const builder1 = new PatternBuilder();
      builder1.notes(['C4', 'D4']);
      builder1.swing(0.1);
      const pattern1 = builder1.build();

      const builder2 = new PatternBuilder();
      builder2.notes(['C4', 'D4']);
      builder2.swing(0.3);
      const pattern2 = builder2.build();

      const delay1 = pattern1.events[1].time - 0.25;
      const delay2 = pattern2.events[1].time - 0.25;

      expect(delay2).toBeGreaterThan(delay1);
    });

    it('throws on invalid amount', () => {
      const builder = new PatternBuilder();
      builder.note('C4');
      expect(() => builder.swing(-0.1)).toThrow('amount must be 0-1');
      expect(() => builder.swing(1.5)).toThrow('amount must be 0-1');
    });

    it('handles empty pattern', () => {
      const builder = new PatternBuilder();
      expect(() => builder.swing(0.15)).not.toThrow();
    });

    it('supports method chaining', () => {
      const builtPattern = new PatternBuilder()
        .notes(['C4', 'D4', 'E4', 'F4'])
        .swing(0.15)
        .build();

      expect(builtPattern.events.length).toBe(4);
    });
  });

  describe('build()', () => {
    it('returns immutable Pattern', () => {
      const builder = new PatternBuilder();
      builder.notes(['C4', 'D4', 'E4']);
      const builtPattern = builder.build();

      expect(Object.isFrozen(builtPattern.events)).toBe(true);
    });

    it('can be called multiple times', () => {
      const builder = new PatternBuilder();
      builder.notes(['C4', 'D4']);

      const pattern1 = builder.build();
      const pattern2 = builder.build();

      expect(pattern1.events.length).toBe(2);
      expect(pattern2.events.length).toBe(2);
    });

    it('returns independent Pattern instances', () => {
      const builder = new PatternBuilder();
      builder.notes(['C4', 'D4']);

      const pattern1 = builder.build();
      const pattern2 = builder.build();

      expect(pattern1).not.toBe(pattern2);
    });
  });

  describe('fromNotation()', () => {
    it('parses simple note sequence', () => {
      const builtPattern = new PatternBuilder()
        .fromNotation('C4 E4 G4')
        .build();

      expect(builtPattern.events.length).toBe(3);
      expect((builtPattern.events[0] as NoteEvent).note.name).toBe('C4');
      expect((builtPattern.events[1] as NoteEvent).note.name).toBe('E4');
      expect((builtPattern.events[2] as NoteEvent).note.name).toBe('G4');
    });

    it('respects default duration', () => {
      const builtPattern = new PatternBuilder()
        .withDuration(Durations.eighth)
        .fromNotation('C4 E4')
        .build();

      expect(builtPattern.events[0].duration).toBe(Durations.eighth);
      expect(builtPattern.events[1].duration).toBe(Durations.eighth);
    });

    it('respects default velocity', () => {
      const builtPattern = new PatternBuilder()
        .withVelocity(Velocity(100))
        .fromNotation('C4')
        .build();

      expect(builtPattern.events[0].velocity).toBe(100);
    });

    it('advances time correctly', () => {
      const builtPattern = new PatternBuilder()
        .note('C4', Durations.quarter)
        .fromNotation('E4 G4')
        .build();

      expect(builtPattern.events[0].time).toBe(0);
      expect(builtPattern.events[1].time).toBe(Durations.quarter);
      expect(builtPattern.events[2].time).toBe(Durations.quarter * 2);
    });

    it('parses repetition syntax', () => {
      const builtPattern = new PatternBuilder()
        .fromNotation('C4*4')
        .build();

      expect(builtPattern.events.length).toBe(4);
      expect(builtPattern.events.every(e => (e as NoteEvent).note?.name === 'C4')).toBe(true);
    });

    it('parses rest syntax', () => {
      const builtPattern = new PatternBuilder()
        .fromNotation('C4 ~ E4')
        .build();

      expect(builtPattern.events.length).toBe(3);
      expect(builtPattern.events[1].type).toBe('rest');
    });

    it('parses grouping syntax', () => {
      const builtPattern = new PatternBuilder()
        .fromNotation('[C4 E4 G4]')
        .build();

      expect(builtPattern.events.length).toBe(3);
    });

    it('parses chord symbols', () => {
      const builtPattern = new PatternBuilder()
        .fromNotation('Cmaj7')
        .build();

      expect(builtPattern.events.length).toBe(1);
      expect(builtPattern.events[0].type).toBe('chord');
    });

    it('combines with other builder methods', () => {
      const builtPattern = new PatternBuilder()
        .fromNotation('C4 E4')
        .note('G4')
        .fromNotation('C5 G4')
        .build();

      expect(builtPattern.events.length).toBe(5);
    });

    it('supports method chaining', () => {
      const builtPattern = new PatternBuilder()
        .fromNotation('C4 E4')
        .fromNotation('G4 C5')
        .build();

      expect(builtPattern.events.length).toBe(4);
    });

    it('parses complex TidalCycles-style patterns', () => {
      const builtPattern = new PatternBuilder()
        .fromNotation('C4*2 [E4 G4] ~ Cmaj7')
        .build();

      expect(builtPattern.events.length).toBeGreaterThan(4);
    });
  });

  describe('complex patterns', () => {
    it('creates C major scale', () => {
      const builtPattern = new PatternBuilder()
        .notes(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'])
        .build();

      expect(builtPattern.events.length).toBe(8);
      expect(builtPattern.duration).toBe(2.0); // 8 quarter notes
    });

    it('creates melody with varied rhythms', () => {
      const builtPattern = new PatternBuilder()
        .note('C4', Durations.quarter)
        .note('D4', Durations.eighth)
        .note('E4', Durations.eighth)
        .note('F4', Durations.half)
        .build();

      expect(builtPattern.events.length).toBe(4);
      expect(builtPattern.events[0].duration).toBe(0.25);
      expect(builtPattern.events[1].duration).toBe(0.125);
      expect(builtPattern.events[3].duration).toBe(0.5);
    });

    it('creates pattern with chords and melody', () => {
      const builtPattern = new PatternBuilder()
        .chord(['C4', 'E4', 'G4'], Durations.half)
        .note('C5', Durations.quarter)
        .note('B4', Durations.quarter)
        .chord(['F4', 'A4', 'C5'], Durations.half)
        .build();

      expect(builtPattern.events.length).toBe(4);
      expect(builtPattern.events[0].type).toBe('chord');
      expect(builtPattern.events[1].type).toBe('note');
    });

    it('creates pattern with dynamics and articulation', () => {
      const builtPattern = new PatternBuilder()
        .withVelocity(Velocity(60))
        .notes(['C4', 'D4', 'E4'])
        .withVelocity(Velocity(100))
        .notes(['F4', 'G4', 'A4'])
        .crescendo(60, 120)
        .build();

      // First note should have crescendo applied (not original 60)
      expect(builtPattern.events[0].velocity).toBe(60);
      expect(builtPattern.events[5].velocity).toBe(120);
    });

    it('creates swung eighth notes', () => {
      const builtPattern = new PatternBuilder()
        .withDuration(Durations.eighth)
        .notes(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'])
        .swing(0.2)
        .build();

      expect(builtPattern.events.length).toBe(8);
      // Odd indices should be delayed
      expect(builtPattern.events[1].time).toBeGreaterThan(0.125);
      expect(builtPattern.events[3].time).toBeGreaterThan(0.375);
    });
  });

  describe('withScale and degrees', () => {
    it('creates pattern from scale degrees', () => {
      const scale = new Scale('C4', 'major');

      const pattern = new PatternBuilder()
        .withScale(scale)
        .degrees([1, 3, 5, 8])
        .build();

      expect(pattern.events).toHaveLength(4);
      expect(pattern.events[0].note.name).toBe('C4');
      expect(pattern.events[1].note.name).toBe('E4');
      expect(pattern.events[2].note.name).toBe('G4');
      expect(pattern.events[3].note.name).toBe('C5');
    });

    it('throws error if degrees() called without withScale()', () => {
      expect(() => {
        new PatternBuilder().degrees([1, 3, 5]).build();
      }).toThrow('Must call withScale() before using degrees()');
    });

    it('uses custom durations with degrees', () => {
      const scale = new Scale('D4', 'Dorian');

      const pattern = new PatternBuilder()
        .withScale(scale)
        .degrees(
          [1, 2, 3],
          [Durations.half, Durations.quarter, Durations.eighth]
        )
        .build();

      expect(pattern.events[0].duration).toBe(0.5);
      expect(pattern.events[1].duration).toBe(0.25);
      expect(pattern.events[2].duration).toBe(0.125);
    });

    it('uses single duration for all degrees', () => {
      const scale = new Scale('E4', 'minorPentatonic');

      const pattern = new PatternBuilder()
        .withScale(scale)
        .degrees([1, 2, 3, 4, 5], Durations.sixteenth)
        .build();

      expect(pattern.events).toHaveLength(5);
      expect(pattern.events.every(e => e.duration === 0.0625)).toBe(true);
    });

    it('can chain with other builder methods', () => {
      const scale = new Scale('G4', 'major');

      const pattern = new PatternBuilder()
        .withDuration(Durations.eighth)
        .note('G4')
        .withScale(scale)
        .degrees([2, 3, 4])
        .rest()
        .note('D5', Durations.half)
        .build();

      expect(pattern.events).toHaveLength(6); // 1 note + 3 degrees + 1 rest + 1 note
    });

    it('works with different modes', () => {
      const phrygian = new Scale('E4', 'Phrygian');

      const pattern = new PatternBuilder()
        .withScale(phrygian)
        .degrees([1, 2, 3])
        .build();

      // Phrygian has b2 (F instead of F#)
      expect(pattern.events[1].note.name).toBe('F4');
    });
  });

  describe('fromNotation() with scale degrees', () => {
    it('parses degree notation with scale context', () => {
      const cMajor = new Scale('C4', 'major');
      const pattern = new PatternBuilder()
        .withScale(cMajor)
        .fromNotation('$1 $3 $5')
        .build();

      expect(pattern.events).toHaveLength(3);
      expect(pattern.events[0].note.name).toBe('C4');
      expect(pattern.events[1].note.name).toBe('E4');
      expect(pattern.events[2].note.name).toBe('G4');
    });

    it('parses full scale with degrees', () => {
      const gMajor = new Scale('G4', 'major');
      const pattern = new PatternBuilder()
        .withScale(gMajor)
        .fromNotation('$1 $2 $3 $4 $5 $6 $7 $8')
        .build();

      expect(pattern.events).toHaveLength(8);
      expect(pattern.events[0].note.name).toBe('G4');
      expect(pattern.events[7].note.name).toBe('G5');
    });

    it('supports repetition in degree notation', () => {
      const cMajor = new Scale('C4', 'major');
      const pattern = new PatternBuilder()
        .withScale(cMajor)
        .fromNotation('$1*4 $5*2')
        .build();

      expect(pattern.events).toHaveLength(6);
      // First 4 events are C4
      for (let i = 0; i < 4; i++) {
        expect(pattern.events[i].note.name).toBe('C4');
      }
      // Next 2 events are G4
      expect(pattern.events[4].note.name).toBe('G4');
      expect(pattern.events[5].note.name).toBe('G4');
    });

    it('supports extension in degree notation', () => {
      const cMajor = new Scale('C4', 'major');
      const pattern = new PatternBuilder()
        .withScale(cMajor)
        .fromNotation('$1@2')
        .build();

      expect(pattern.events).toHaveLength(1);
      expect(pattern.events[0].duration).toBe(Durations.quarter * 2);
    });

    it('supports duration modifiers in degree notation', () => {
      const cMajor = new Scale('C4', 'major');
      const pattern = new PatternBuilder()
        .withScale(cMajor)
        .fromNotation('$1/8 $3/16 $5/4')
        .build();

      expect(pattern.events).toHaveLength(3);
      expect(pattern.events[0].duration).toBe(1 / 8);
      expect(pattern.events[1].duration).toBe(1 / 16);
      expect(pattern.events[2].duration).toBe(1 / 4);
    });

    it('supports grouping with degrees', () => {
      const cMajor = new Scale('C4', 'major');
      const pattern = new PatternBuilder()
        .withScale(cMajor)
        .fromNotation('[$1 $3 $5]')
        .build();

      expect(pattern.events).toHaveLength(3);
      const expectedDuration = Durations.quarter / 3;
      pattern.events.forEach(e => {
        expect(e.duration).toBeCloseTo(expectedDuration, 5);
      });
    });

    it('mixes degrees with absolute notes', () => {
      const cMajor = new Scale('C4', 'major');
      const pattern = new PatternBuilder()
        .withScale(cMajor)
        .fromNotation('$1 E4 $5 G4')
        .build();

      expect(pattern.events).toHaveLength(4);
      expect(pattern.events[0].note.name).toBe('C4'); // $1
      expect(pattern.events[1].note.name).toBe('E4'); // absolute
      expect(pattern.events[2].note.name).toBe('G4'); // $5
      expect(pattern.events[3].note.name).toBe('G4'); // absolute
    });

    it('mixes degrees with rests and chords', () => {
      const cMajor = new Scale('C4', 'major');
      const pattern = new PatternBuilder()
        .withScale(cMajor)
        .fromNotation('$1 ~ Cmaj7 $5')
        .build();

      expect(pattern.events).toHaveLength(4);
      expect(pattern.events[0].type).toBe('note');
      expect(pattern.events[1].type).toBe('rest');
      expect(pattern.events[2].type).toBe('chord');
      expect(pattern.events[3].type).toBe('note');
      expect(pattern.events[3].note.name).toBe('G4');
    });

    it('works with different scales', () => {
      const dDorian = new Scale('D4', 'Dorian');
      const pattern = new PatternBuilder()
        .withScale(dDorian)
        .fromNotation('$1 $2 $3')
        .build();

      expect(pattern.events).toHaveLength(3);
      expect(pattern.events[0].note.name).toBe('D4');
      expect(pattern.events[1].note.name).toBe('E4');
      expect(pattern.events[2].note.name).toBe('F4'); // b3 in Dorian
    });

    it('works with pentatonic scales', () => {
      const cPentatonic = new Scale('C4', 'minorPentatonic');
      const pattern = new PatternBuilder()
        .withScale(cPentatonic)
        .fromNotation('$1 $2 $3 $4 $5')
        .build();

      expect(pattern.events).toHaveLength(5);
      expect(pattern.events[0].note.name).toBe('C4');
      // Minor pentatonic: C, Eb, F, G, Bb
      expect(['Eb4', 'D#4']).toContain(pattern.events[1].note.name);
    });

    it('can chain with other builder methods', () => {
      const cMajor = new Scale('C4', 'major');
      const pattern = new PatternBuilder()
        .note('B3')
        .withScale(cMajor)
        .fromNotation('$1 $3 $5')
        .rest()
        .note('C5')
        .build();

      expect(pattern.events).toHaveLength(6);
      expect(pattern.events[0].note.name).toBe('B3'); // Before scale
      expect(pattern.events[1].note.name).toBe('C4'); // $1
      expect(pattern.events[2].note.name).toBe('E4'); // $3
      expect(pattern.events[3].note.name).toBe('G4'); // $5
      expect(pattern.events[4].type).toBe('rest');
      expect(pattern.events[5].note.name).toBe('C5'); // After scale
    });

    it('throws error when degrees used without scale', () => {
      expect(() => {
        new PatternBuilder()
          .fromNotation('$1 $3 $5')
          .build();
      }).toThrow();
    });

    it('respects timing for degree sequences', () => {
      const cMajor = new Scale('C4', 'major');
      const pattern = new PatternBuilder()
        .withScale(cMajor)
        .fromNotation('$1 $3 $5')
        .build();

      expect(pattern.events[0].time).toBe(0);
      expect(pattern.events[1].time).toBe(Durations.quarter);
      expect(pattern.events[2].time).toBe(Durations.quarter * 2);
    });
  });
});
