// packages/core/tests/debug/Validator.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Validator } from '../../src/debug/Validator';
import { Composition } from '../../src/composition/Composition';
import { Track } from '../../src/composition/Track';
import { Voice } from '../../src/composition/Voice';
import { PatternBuilder } from '../../src/patterns/PatternBuilder';
import { Pattern } from '../../src/patterns/Pattern';
import { BPM, Seconds, Duration, Velocity, MIDINote } from '../../src/types/brands';
import { Note } from '../../src/primitives/Note';
import type { NoteEvent } from '../../src/primitives/Event';

describe('Validator', () => {
  beforeEach(() => {
    // Mock logger to avoid console output during tests
    vi.mock('../../src/debug/Logger', () => ({
      validatorLogger: {
        debug: vi.fn(),
      },
    }));
  });

  describe('validate - empty composition', () => {
    it('should detect empty composition', () => {
      const composition = new Composition('Empty', BPM(120));
      const result = Validator.validate(composition);

      expect(result.valid).toBe(false);
      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].code).toBe('EMPTY_COMPOSITION');
      expect(result.issues[0].severity).toBe('error');
    });
  });

  describe('validate - tempo', () => {
    it('should accept valid tempo', () => {
      const pattern = new PatternBuilder().notes(['C4']).build();
      const voice = new Voice(pattern);
      const track = new Track('Test', [voice]);
      const composition = new Composition('Test', BPM(120)).addTrack(track);

      const result = Validator.validate(composition);

      // Should not have tempo-related errors
      const tempoIssues = result.issues.filter(i => i.code.includes('TEMPO'));
      expect(tempoIssues).toHaveLength(0);
    });

    it('should detect unusually slow tempo', () => {
      const pattern = new PatternBuilder().notes(['C4']).build();
      const voice = new Voice(pattern);
      const track = new Track('Test', [voice]);
      const composition = new Composition('Test', BPM(10)).addTrack(track);

      const result = Validator.validate(composition);

      const slowTempoIssue = result.issues.find(i => i.code === 'UNUSUALLY_SLOW_TEMPO');
      expect(slowTempoIssue).toBeDefined();
      expect(slowTempoIssue?.severity).toBe('warning');
    });

    it('should detect unusually fast tempo', () => {
      const pattern = new PatternBuilder().notes(['C4']).build();
      const voice = new Voice(pattern);
      const track = new Track('Test', [voice]);
      const composition = new Composition('Test', BPM(350)).addTrack(track);

      const result = Validator.validate(composition);

      const fastTempoIssue = result.issues.find(i => i.code === 'UNUSUALLY_FAST_TEMPO');
      expect(fastTempoIssue).toBeDefined();
      expect(fastTempoIssue?.severity).toBe('warning');
    });
  });

  describe('validate - time signature', () => {
    it('should accept valid time signature', () => {
      const pattern = new PatternBuilder().notes(['C4']).build();
      const voice = new Voice(pattern);
      const track = new Track('Test', [voice]);
      const composition = new Composition('Test', BPM(120), { numerator: 4, denominator: 4 })
        .addTrack(track);

      const result = Validator.validate(composition);

      const tsIssues = result.issues.filter(i => i.code === 'INVALID_TIME_SIGNATURE');
      expect(tsIssues).toHaveLength(0);
    });

    it('should detect invalid numerator', () => {
      const pattern = new PatternBuilder().notes(['C4']).build();
      const voice = new Voice(pattern);
      const track = new Track('Test', [voice]);
      const composition = new Composition('Test', BPM(120), { numerator: 0, denominator: 4 })
        .addTrack(track);

      const result = Validator.validate(composition);

      const tsIssue = result.issues.find(i => i.code === 'INVALID_TIME_SIGNATURE');
      expect(tsIssue).toBeDefined();
      expect(tsIssue?.severity).toBe('error');
    });

    it('should detect invalid denominator', () => {
      const pattern = new PatternBuilder().notes(['C4']).build();
      const voice = new Voice(pattern);
      const track = new Track('Test', [voice]);
      const composition = new Composition('Test', BPM(120), { numerator: 4, denominator: 3 })
        .addTrack(track);

      const result = Validator.validate(composition);

      const tsIssue = result.issues.find(i => i.code === 'INVALID_TIME_SIGNATURE');
      expect(tsIssue).toBeDefined();
      expect(tsIssue?.suggestion).toContain('power of 2');
    });
  });

  describe('validate - tracks', () => {
    it('should detect empty track', () => {
      const track = new Track('Empty', []);
      const composition = new Composition('Test', BPM(120)).addTrack(track);

      const result = Validator.validate(composition);

      const emptyTrackIssue = result.issues.find(i => i.code === 'EMPTY_TRACK');
      expect(emptyTrackIssue).toBeDefined();
      expect(emptyTrackIssue?.severity).toBe('warning');
      expect(emptyTrackIssue?.location?.trackName).toBe('Empty');
    });

    it('should detect silent track', () => {
      const emptyPattern = new Pattern([]);
      const voice = new Voice(emptyPattern);
      const track = new Track('Silent', [voice]);
      const composition = new Composition('Test', BPM(120)).addTrack(track);

      const result = Validator.validate(composition);

      const silentIssue = result.issues.find(i => i.code === 'SILENT_TRACK');
      expect(silentIssue).toBeDefined();
      expect(silentIssue?.severity).toBe('warning');
    });
  });

  describe('validate - patterns', () => {
    it('should detect zero duration events', () => {
      const events: NoteEvent[] = [
        {
          type: 'note',
          time: Seconds(0),
          duration: Duration(0), // Zero duration!
          velocity: Velocity(80),
          pitch: MIDINote(60),
          note: new Note('C4'),
        },
      ];

      const pattern = new Pattern(events);
      const voice = new Voice(pattern);
      const track = new Track('Test', [voice]);
      const composition = new Composition('Test', BPM(120)).addTrack(track);

      const result = Validator.validate(composition);

      const zeroDurIssue = result.issues.find(i => i.code === 'ZERO_DURATION');
      expect(zeroDurIssue).toBeDefined();
      expect(zeroDurIssue?.severity).toBe('warning');
    });

    it('should detect silent notes (zero velocity)', () => {
      const events: NoteEvent[] = [
        {
          type: 'note',
          time: Seconds(0),
          duration: Duration(0.25),
          velocity: Velocity(0), // Zero velocity!
          pitch: MIDINote(60),
          note: new Note('C4'),
        },
      ];

      const pattern = new Pattern(events);
      const voice = new Voice(pattern);
      const track = new Track('Test', [voice]);
      const composition = new Composition('Test', BPM(120)).addTrack(track);

      const result = Validator.validate(composition);

      const silentNoteIssue = result.issues.find(i => i.code === 'SILENT_NOTE');
      expect(silentNoteIssue).toBeDefined();
      expect(silentNoteIssue?.severity).toBe('info');
    });
  });

  describe('validate - note range', () => {
    it('should detect notes below minimum', () => {
      const events: NoteEvent[] = [
        {
          type: 'note',
          time: Seconds(0),
          duration: Duration(0.25),
          velocity: Velocity(80),
          pitch: MIDINote(10), // Below C0 (12)
          note: new Note('A#-1'),
        },
      ];

      const pattern = new Pattern(events);
      const voice = new Voice(pattern);
      const track = new Track('Test', [voice]);
      const composition = new Composition('Test', BPM(120)).addTrack(track);

      const result = Validator.validate(composition);

      const rangeIssue = result.issues.find(i => i.code === 'NOTE_OUT_OF_RANGE');
      expect(rangeIssue).toBeDefined();
      expect(rangeIssue?.severity).toBe('error');
      expect(rangeIssue?.message).toContain('10');
    });

    it('should detect notes above maximum', () => {
      const events: NoteEvent[] = [
        {
          type: 'note',
          time: Seconds(0),
          duration: Duration(0.25),
          velocity: Velocity(80),
          pitch: MIDINote(110), // Above C8 (108)
          note: new Note('D9'),
        },
      ];

      const pattern = new Pattern(events);
      const voice = new Voice(pattern);
      const track = new Track('Test', [voice]);
      const composition = new Composition('Test', BPM(120)).addTrack(track);

      const result = Validator.validate(composition);

      const rangeIssue = result.issues.find(i => i.code === 'NOTE_OUT_OF_RANGE');
      expect(rangeIssue).toBeDefined();
      expect(rangeIssue?.severity).toBe('error');
    });

    it('should respect custom note range', () => {
      const pattern = new PatternBuilder().notes(['C4']).build(); // MIDI 60
      const voice = new Voice(pattern);
      const track = new Track('Test', [voice]);
      const composition = new Composition('Test', BPM(120)).addTrack(track);

      const result = Validator.validate(composition, {
        minNote: 70,
        maxNote: 80,
      });

      const rangeIssue = result.issues.find(i => i.code === 'NOTE_OUT_OF_RANGE');
      expect(rangeIssue).toBeDefined();
    });
  });

  describe('validate - polyphony', () => {
    it('should detect excessive polyphony', () => {
      // Create pattern with 150 simultaneous notes
      const events: NoteEvent[] = [];
      for (let i = 0; i < 150; i++) {
        events.push({
          type: 'note',
          time: Seconds(0), // All at same time
          duration: Duration(1),
          velocity: Velocity(80),
          pitch: MIDINote(60 + (i % 48)),
          note: new Note('C4'),
        });
      }

      const pattern = new Pattern(events);
      const voice = new Voice(pattern);
      const track = new Track('Test', [voice]);
      const composition = new Composition('Test', BPM(120)).addTrack(track);

      const result = Validator.validate(composition);

      const polyIssue = result.issues.find(i => i.code === 'EXCESSIVE_POLYPHONY');
      expect(polyIssue).toBeDefined();
      expect(polyIssue?.severity).toBe('warning');
      expect(polyIssue?.message).toContain('150');
    });

    it('should respect custom max polyphony', () => {
      const events: NoteEvent[] = [];
      for (let i = 0; i < 10; i++) {
        events.push({
          type: 'note',
          time: Seconds(0),
          duration: Duration(1),
          velocity: Velocity(80),
          pitch: MIDINote(60 + i),
          note: new Note('C4'),
        });
      }

      const pattern = new Pattern(events);
      const voice = new Voice(pattern);
      const track = new Track('Test', [voice]);
      const composition = new Composition('Test', BPM(120)).addTrack(track);

      const result = Validator.validate(composition, { maxPolyphony: 5 });

      const polyIssue = result.issues.find(i => i.code === 'EXCESSIVE_POLYPHONY');
      expect(polyIssue).toBeDefined();
    });
  });

  describe('summary', () => {
    it('should count errors, warnings, and info correctly', () => {
      const composition = new Composition('Test', BPM(120)); // Empty = 1 error

      const result = Validator.validate(composition);

      expect(result.summary.errors).toBe(1);
      expect(result.summary.warnings).toBe(0);
      expect(result.summary.info).toBe(0);
      expect(result.valid).toBe(false);
    });

    it('should mark composition valid when no errors', () => {
      const pattern = new PatternBuilder().notes(['C4', 'E4', 'G4']).build();
      const voice = new Voice(pattern);
      const track = new Track('Test', [voice]);
      const composition = new Composition('Test', BPM(120)).addTrack(track);

      const result = Validator.validate(composition);

      expect(result.summary.errors).toBe(0);
      expect(result.valid).toBe(true);
    });

    it('should mark composition invalid if warnings exist but valid is based on errors', () => {
      const pattern = new PatternBuilder().notes(['C4']).build();
      const voice = new Voice(pattern);
      const track = new Track('Test', [voice]);
      const composition = new Composition('Test', BPM(10)).addTrack(track); // Slow tempo = warning

      const result = Validator.validate(composition);

      expect(result.summary.warnings).toBeGreaterThan(0);
      expect(result.summary.errors).toBe(0);
      expect(result.valid).toBe(true); // Valid because no errors
    });
  });

  describe('formatResult', () => {
    it('should format validation passed', () => {
      const pattern = new PatternBuilder().notes(['C4']).build();
      const voice = new Voice(pattern);
      const track = new Track('Test', [voice]);
      const composition = new Composition('Test', BPM(120)).addTrack(track);

      const result = Validator.validate(composition);
      const formatted = Validator.formatResult(result);

      expect(formatted).toContain('✓ Validation passed');
    });

    it('should format validation failed', () => {
      const composition = new Composition('Test', BPM(120));
      const result = Validator.validate(composition);
      const formatted = Validator.formatResult(result);

      expect(formatted).toContain('✗ Validation failed');
      expect(formatted).toContain('EMPTY_COMPOSITION');
    });

    it('should include suggestions in formatted output', () => {
      const composition = new Composition('Test', BPM(120));
      const result = Validator.validate(composition);
      const formatted = Validator.formatResult(result);

      expect(formatted).toContain('→'); // Suggestion marker
    });

    it('should include location information', () => {
      const emptyPattern = new Pattern([]);
      const voice = new Voice(emptyPattern);
      const track = new Track('MyTrack', [voice]);
      const composition = new Composition('Test', BPM(120)).addTrack(track);

      const result = Validator.validate(composition);
      const formatted = Validator.formatResult(result);

      expect(formatted).toContain('MyTrack');
    });
  });
});
