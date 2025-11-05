import { describe, it, expect } from 'vitest';
import type { MusicalEvent, NoteEvent, RestEvent, ChordEvent, Event } from '../../src/primitives/Event';
import { Note, C, D, E, G } from '../../src/primitives/Note';
import { Seconds, Velocity } from '../../src/types/brands';
import { Durations } from '../../src/types/music';

describe('Event interfaces', () => {
  describe('NoteEvent', () => {
    it('creates a valid note event', () => {
      const note = C('4');
      const event: NoteEvent = {
        type: 'note',
        time: Seconds(0),
        duration: Durations.quarter,
        velocity: Velocity(80),
        pitch: note.pitch,
        note: note,
      };

      expect(event.type).toBe('note');
      expect(event.time).toBe(0);
      expect(event.duration).toBe(0.25);
      expect(event.velocity).toBe(80);
      expect(event.pitch).toBe(60);
      expect(event.note).toBe(note);
    });

    it('creates note event with different pitches', () => {
      const a4 = new Note('A4');
      const event: NoteEvent = {
        type: 'note',
        time: Seconds(1.5),
        duration: Durations.eighth,
        velocity: Velocity(100),
        pitch: a4.pitch,
        note: a4,
      };

      expect(event.pitch).toBe(69);
      expect(event.note.name).toBe('A4');
    });

    it('creates note event with various velocities', () => {
      const note = D('4');

      const soft: NoteEvent = {
        type: 'note',
        time: Seconds(0),
        duration: Durations.quarter,
        velocity: Velocity(40),
        pitch: note.pitch,
        note: note,
      };

      const loud: NoteEvent = {
        type: 'note',
        time: Seconds(0),
        duration: Durations.quarter,
        velocity: Velocity(120),
        pitch: note.pitch,
        note: note,
      };

      expect(soft.velocity).toBe(40);
      expect(loud.velocity).toBe(120);
    });

    it('creates note event with different durations', () => {
      const note = E('4');

      const whole: NoteEvent = {
        type: 'note',
        time: Seconds(0),
        duration: Durations.whole,
        velocity: Velocity(80),
        pitch: note.pitch,
        note: note,
      };

      const sixteenth: NoteEvent = {
        type: 'note',
        time: Seconds(0),
        duration: Durations.sixteenth,
        velocity: Velocity(80),
        pitch: note.pitch,
        note: note,
      };

      expect(whole.duration).toBe(1);
      expect(sixteenth.duration).toBe(0.0625);
    });
  });

  describe('RestEvent', () => {
    it('creates a valid rest event', () => {
      const event: RestEvent = {
        type: 'rest',
        time: Seconds(2),
        duration: Durations.quarter,
        velocity: Velocity(0),
      };

      expect(event.type).toBe('rest');
      expect(event.time).toBe(2);
      expect(event.duration).toBe(0.25);
      expect(event.velocity).toBe(0);
    });

    it('creates rest with different durations', () => {
      const halfRest: RestEvent = {
        type: 'rest',
        time: Seconds(0),
        duration: Durations.half,
        velocity: Velocity(0),
      };

      const wholeRest: RestEvent = {
        type: 'rest',
        time: Seconds(0),
        duration: Durations.whole,
        velocity: Velocity(0),
      };

      expect(halfRest.duration).toBe(0.5);
      expect(wholeRest.duration).toBe(1);
    });
  });

  describe('ChordEvent', () => {
    it('creates a valid chord event', () => {
      const notes = [C('4'), E('4'), G('4')];
      const event: ChordEvent = {
        type: 'chord',
        time: Seconds(0),
        duration: Durations.half,
        velocity: Velocity(90),
        notes: notes,
      };

      expect(event.type).toBe('chord');
      expect(event.notes.length).toBe(3);
      expect(event.notes[0].name).toBe('C4');
      expect(event.notes[1].name).toBe('E4');
      expect(event.notes[2].name).toBe('G4');
    });

    it('creates chord with different voicings', () => {
      const closeVoicing = [C('4'), E('4'), G('4')];
      const openVoicing = [C('3'), E('4'), G('5')];

      const close: ChordEvent = {
        type: 'chord',
        time: Seconds(0),
        duration: Durations.quarter,
        velocity: Velocity(80),
        notes: closeVoicing,
      };

      const open: ChordEvent = {
        type: 'chord',
        time: Seconds(1),
        duration: Durations.quarter,
        velocity: Velocity(80),
        notes: openVoicing,
      };

      expect(close.notes.map(n => n.pitch)).toEqual([60, 64, 67]);
      expect(open.notes.map(n => n.pitch)).toEqual([48, 64, 79]);
    });

    it('creates chord with two notes (dyad)', () => {
      const dyad: ChordEvent = {
        type: 'chord',
        time: Seconds(0),
        duration: Durations.quarter,
        velocity: Velocity(80),
        notes: [C('4'), G('4')],
      };

      expect(dyad.notes.length).toBe(2);
    });

    it('creates chord with many notes', () => {
      const bigChord: ChordEvent = {
        type: 'chord',
        time: Seconds(0),
        duration: Durations.quarter,
        velocity: Velocity(80),
        notes: [
          C('3'),
          E('3'),
          G('3'),
          C('4'),
          E('4'),
          G('4'),
        ],
      };

      expect(bigChord.notes.length).toBe(6);
    });
  });

  describe('Event union type', () => {
    it('accepts NoteEvent as Event', () => {
      const note = C('4');
      const event: Event = {
        type: 'note',
        time: Seconds(0),
        duration: Durations.quarter,
        velocity: Velocity(80),
        pitch: note.pitch,
        note: note,
      };

      expect(event.type).toBe('note');
    });

    it('accepts RestEvent as Event', () => {
      const event: Event = {
        type: 'rest',
        time: Seconds(0),
        duration: Durations.quarter,
        velocity: Velocity(0),
      };

      expect(event.type).toBe('rest');
    });

    it('accepts ChordEvent as Event', () => {
      const event: Event = {
        type: 'chord',
        time: Seconds(0),
        duration: Durations.quarter,
        velocity: Velocity(80),
        notes: [C('4'), E('4'), G('4')],
      };

      expect(event.type).toBe('chord');
    });
  });

  describe('Type guards', () => {
    it('distinguishes NoteEvent with type guard', () => {
      const note = C('4');
      const noteEvent: Event = {
        type: 'note',
        time: Seconds(0),
        duration: Durations.quarter,
        velocity: Velocity(80),
        pitch: note.pitch,
        note: note,
      };

      const restEvent: Event = {
        type: 'rest',
        time: Seconds(0),
        duration: Durations.quarter,
        velocity: Velocity(0),
      };

      if (noteEvent.type === 'note') {
        expect(noteEvent.pitch).toBe(60);
      }

      if (restEvent.type === 'rest') {
        expect(restEvent.velocity).toBe(0);
      }
    });

    it('distinguishes ChordEvent with type guard', () => {
      const chordEvent: Event = {
        type: 'chord',
        time: Seconds(0),
        duration: Durations.quarter,
        velocity: Velocity(80),
        notes: [C('4'), E('4')],
      };

      if (chordEvent.type === 'chord') {
        expect(chordEvent.notes.length).toBe(2);
      }
    });
  });

  describe('Event sequences', () => {
    it('creates a sequence of events at different times', () => {
      const events: Event[] = [
        {
          type: 'note',
          time: Seconds(0),
          duration: Durations.quarter,
          velocity: Velocity(80),
          pitch: C('4').pitch,
          note: C('4'),
        },
        {
          type: 'note',
          time: Seconds(0.25),
          duration: Durations.quarter,
          velocity: Velocity(80),
          pitch: D('4').pitch,
          note: D('4'),
        },
        {
          type: 'rest',
          time: Seconds(0.5),
          duration: Durations.quarter,
          velocity: Velocity(0),
        },
        {
          type: 'chord',
          time: Seconds(0.75),
          duration: Durations.quarter,
          velocity: Velocity(90),
          notes: [C('4'), E('4'), G('4')],
        },
      ];

      expect(events.length).toBe(4);
      expect(events[0].time).toBe(0);
      expect(events[1].time).toBe(0.25);
      expect(events[2].time).toBe(0.5);
      expect(events[3].time).toBe(0.75);
    });

    it('creates overlapping events', () => {
      const events: Event[] = [
        {
          type: 'note',
          time: Seconds(0),
          duration: Durations.half,
          velocity: Velocity(80),
          pitch: C('4').pitch,
          note: C('4'),
        },
        {
          type: 'note',
          time: Seconds(0.25),
          duration: Durations.quarter,
          velocity: Velocity(70),
          pitch: E('4').pitch,
          note: E('4'),
        },
      ];

      // First event: 0 to 0.5
      // Second event: 0.25 to 0.5
      // They overlap from 0.25 to 0.5
      const firstEnd = events[0].time + events[0].duration;
      const secondStart = events[1].time;

      expect(secondStart).toBeLessThan(firstEnd);
    });
  });

  describe('Immutability', () => {
    it('event properties are readonly', () => {
      const note = C('4');
      const event: NoteEvent = {
        type: 'note',
        time: Seconds(0),
        duration: Durations.quarter,
        velocity: Velocity(80),
        pitch: note.pitch,
        note: note,
      };

      // TypeScript compiler enforces readonly, but we can verify runtime behavior
      expect(event.time).toBe(0);
      expect(event.duration).toBe(0.25);

      // The following would cause TypeScript compile errors:
      // event.time = Seconds(1);
      // event.velocity = Velocity(100);
    });
  });
});
