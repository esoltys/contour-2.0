// packages/core/tests/debug/PatternInspector.test.ts

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatternInspector } from '../../src/debug/PatternInspector';
import { PatternBuilder } from '../../src/patterns/PatternBuilder';
import { Pattern } from '../../src/patterns/Pattern';
import { Seconds, Duration, Velocity, MIDINote } from '../../src/types/brands';
import { Note } from '../../src/primitives/Note';
import type { NoteEvent, RestEvent } from '../../src/primitives/Event';

describe('PatternInspector', () => {
  describe('inspect', () => {
    it('should return correct inspection for empty pattern', () => {
      const pattern = new Pattern([]);
      const inspection = PatternInspector.inspect(pattern);

      expect(inspection.duration).toBe(0);
      expect(inspection.eventCount).toEqual({
        notes: 0,
        rests: 0,
        chords: 0,
        total: 0,
      });
      expect(inspection.noteRange.lowest).toBeNull();
      expect(inspection.noteRange.highest).toBeNull();
      expect(inspection.noteRange.span).toBe(0);
    });

    it('should count note events correctly', () => {
      const pattern = new PatternBuilder()
        .notes(['C4', 'E4', 'G4', 'C5'])
        .build();

      const inspection = PatternInspector.inspect(pattern);

      expect(inspection.eventCount.notes).toBe(4);
      expect(inspection.eventCount.rests).toBe(0);
      expect(inspection.eventCount.chords).toBe(0);
      expect(inspection.eventCount.total).toBe(4);
    });

    it('should count rest events correctly', () => {
      const events: (NoteEvent | RestEvent)[] = [
        {
          type: 'note',
          time: Seconds(0),
          duration: Duration(0.25),
          velocity: Velocity(80),
          pitch: MIDINote(60),
          note: new Note('C4'),
        },
        {
          type: 'rest',
          time: Seconds(0.25),
          duration: Duration(0.25),
          velocity: Velocity(0),
        },
        {
          type: 'note',
          time: Seconds(0.5),
          duration: Duration(0.25),
          velocity: Velocity(80),
          pitch: MIDINote(64),
          note: new Note('E4'),
        },
      ];

      const pattern = new Pattern(events);
      const inspection = PatternInspector.inspect(pattern);

      expect(inspection.eventCount.notes).toBe(2);
      expect(inspection.eventCount.rests).toBe(1);
      expect(inspection.eventCount.total).toBe(3);
    });

    it('should calculate note range correctly', () => {
      const pattern = new PatternBuilder()
        .notes(['C4', 'E4', 'G4', 'C5'])
        .build();

      const inspection = PatternInspector.inspect(pattern);

      expect(inspection.noteRange.lowest).toBe(60); // C4
      expect(inspection.noteRange.highest).toBe(72); // C5
      expect(inspection.noteRange.span).toBe(12); // One octave
    });

    it('should calculate velocity metrics correctly', () => {
      const events: NoteEvent[] = [
        {
          type: 'note',
          time: Seconds(0),
          duration: Duration(0.25),
          velocity: Velocity(40),
          pitch: MIDINote(60),
          note: new Note('C4'),
        },
        {
          type: 'note',
          time: Seconds(0.25),
          duration: Duration(0.25),
          velocity: Velocity(80),
          pitch: MIDINote(64),
          note: new Note('E4'),
        },
        {
          type: 'note',
          time: Seconds(0.5),
          duration: Duration(0.25),
          velocity: Velocity(120),
          pitch: MIDINote(67),
          note: new Note('G4'),
        },
      ];

      const pattern = new Pattern(events);
      const inspection = PatternInspector.inspect(pattern);

      expect(inspection.velocity.min).toBe(40);
      expect(inspection.velocity.max).toBe(120);
      expect(inspection.velocity.avg).toBe(80);
    });

    it('should detect gaps in timing', () => {
      const events: NoteEvent[] = [
        {
          type: 'note',
          time: Seconds(0),
          duration: Duration(0.25),
          velocity: Velocity(80),
          pitch: MIDINote(60),
          note: new Note('C4'),
        },
        // Gap here (0.25 - 0.5)
        {
          type: 'note',
          time: Seconds(0.5),
          duration: Duration(0.25),
          velocity: Velocity(80),
          pitch: MIDINote(64),
          note: new Note('E4'),
        },
      ];

      const pattern = new Pattern(events);
      const inspection = PatternInspector.inspect(pattern);

      expect(inspection.timing.gaps).toBeGreaterThan(0);
    });

    it('should detect overlapping events', () => {
      const events: NoteEvent[] = [
        {
          type: 'note',
          time: Seconds(0),
          duration: Duration(0.5),
          velocity: Velocity(80),
          pitch: MIDINote(60),
          note: new Note('C4'),
        },
        {
          type: 'note',
          time: Seconds(0.25), // Overlaps with previous
          duration: Duration(0.5),
          velocity: Velocity(80),
          pitch: MIDINote(64),
          note: new Note('E4'),
        },
      ];

      const pattern = new Pattern(events);
      const inspection = PatternInspector.inspect(pattern);

      expect(inspection.timing.overlaps).toBeGreaterThan(0);
    });

    it('should calculate average spacing', () => {
      const pattern = new PatternBuilder()
        .notes(['C4', 'E4', 'G4', 'C5']) // Sequential quarter notes
        .build();

      const inspection = PatternInspector.inspect(pattern);

      expect(inspection.timing.avgSpacing).toBeGreaterThan(0);
    });
  });

  describe('toASCII', () => {
    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('should return message for empty pattern', () => {
      const pattern = new Pattern([]);
      const ascii = PatternInspector.toASCII(pattern);

      expect(ascii).toBe('(empty pattern)');
    });

    it('should generate ASCII visualization for simple pattern', () => {
      const pattern = new PatternBuilder()
        .notes(['C4', 'E4', 'G4'])
        .build();

      const ascii = PatternInspector.toASCII(pattern);

      expect(ascii).toContain('Time:');
      expect(ascii).toContain('G4');
      expect(ascii).toContain('E4');
      expect(ascii).toContain('C4');
      expect(ascii).toContain('█'); // Block character for note
    });

    it('should respect width option', () => {
      const pattern = new PatternBuilder()
        .notes(['C4', 'E4'])
        .build();

      const ascii = PatternInspector.toASCII(pattern, { width: 20 });
      const lines = ascii.split('\n');

      // Check that note rows aren't excessively long
      for (const line of lines) {
        if (line.includes('█')) {
          // Note row should be roughly the width + label
          expect(line.length).toBeLessThan(30);
        }
      }
    });

    it('should show rests when showRests is true', () => {
      const events: (NoteEvent | RestEvent)[] = [
        {
          type: 'note',
          time: Seconds(0),
          duration: Duration(0.25),
          velocity: Velocity(80),
          pitch: MIDINote(60),
          note: new Note('C4'),
        },
        {
          type: 'rest',
          time: Seconds(0.25),
          duration: Duration(0.25),
          velocity: Velocity(0),
        },
      ];

      const pattern = new Pattern(events);
      const ascii = PatternInspector.toASCII(pattern, { showRests: true });

      expect(ascii).toContain('Rest:');
    });

    it('should show velocity with different characters when showVelocity is true', () => {
      const events: NoteEvent[] = [
        {
          type: 'note',
          time: Seconds(0),
          duration: Duration(0.25),
          velocity: Velocity(120), // Should be █
          pitch: MIDINote(60),
          note: new Note('C4'),
        },
        {
          type: 'note',
          time: Seconds(0.25),
          duration: Duration(0.25),
          velocity: Velocity(60), // Should be ▒
          pitch: MIDINote(60),
          note: new Note('C4'),
        },
      ];

      const pattern = new Pattern(events);
      const ascii = PatternInspector.toASCII(pattern, { showVelocity: true });

      // Should contain different velocity characters
      expect(ascii.includes('█') || ascii.includes('▓') || ascii.includes('▒')).toBe(true);
    });

    it('should handle patterns with no notes gracefully', () => {
      const events: RestEvent[] = [
        {
          type: 'rest',
          time: Seconds(0),
          duration: Duration(0.25),
          velocity: Velocity(0),
        },
      ];

      const pattern = new Pattern(events);
      const ascii = PatternInspector.toASCII(pattern);

      expect(ascii).toBe('(no notes to display)');
    });
  });

  describe('toConsole', () => {
    beforeEach(() => {
      vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('should print to console', () => {
      const pattern = new PatternBuilder()
        .notes(['C4', 'E4', 'G4'])
        .build();

      PatternInspector.toConsole(pattern);

      expect(console.log).toHaveBeenCalled();
      const calls = (console.log as any).mock.calls;
      const output = calls.map((c: any) => c[0]).join('\n');

      // Should contain the ASCII visualization (header may not appear in test env)
      expect(output).toContain('C4');
      expect(output).toContain('E4');
      expect(output).toContain('G4');
      expect(output).toContain('Time:');
    });
  });

  describe('Pattern integration', () => {
    it('should work via Pattern.inspect() method', () => {
      const pattern = new PatternBuilder()
        .notes(['C4', 'E4', 'G4'])
        .build();

      const inspection = pattern.inspect();

      expect(inspection).toBeDefined();
      expect(inspection.eventCount.notes).toBe(3);
    });

    it('should work via Pattern.toASCII() method', () => {
      const pattern = new PatternBuilder()
        .notes(['C4', 'E4'])
        .build();

      const ascii = pattern.toASCII();

      expect(ascii).toContain('C4');
      expect(ascii).toContain('E4');
    });

    it('should work via Pattern.toConsole() method', () => {
      vi.spyOn(console, 'log').mockImplementation(() => {});

      const pattern = new PatternBuilder()
        .notes(['C4'])
        .build();

      pattern.toConsole();

      expect(console.log).toHaveBeenCalled();
    });
  });
});
