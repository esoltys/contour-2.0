// packages/core/tests/errors/MusicalError.test.ts

import { describe, it, expect } from 'vitest';
import { MusicalError, ErrorCode } from '../../src/errors/MusicalError';
import { Seconds, MIDINote } from '../../src/types/brands';

describe('MusicalError', () => {
  describe('constructor', () => {
    it('should create error with message and code', () => {
      const error = new MusicalError(
        'Test error',
        ErrorCode.PATTERN_EMPTY
      );

      expect(error).toBeInstanceOf(Error);
      expect(error.name).toBe('MusicalError');
      expect(error.code).toBe(ErrorCode.PATTERN_EMPTY);
      expect(error.message).toContain('Test error');
      expect(error.message).toContain(ErrorCode.PATTERN_EMPTY);
    });

    it('should include context in message', () => {
      const error = new MusicalError(
        'Test error',
        ErrorCode.NOTE_OUT_OF_RANGE,
        {
          patternName: 'melody',
          timePosition: Seconds(2.5),
          note: 'C9',
        }
      );

      expect(error.message).toContain('pattern: "melody"');
      expect(error.message).toContain('time: 2.5s');
      expect(error.message).toContain('note: C9');
    });

    it('should include suggestion in message', () => {
      const error = new MusicalError(
        'Test error',
        ErrorCode.NOTE_OUT_OF_RANGE,
        undefined,
        'Use transpose() to fix this'
      );

      expect(error.message).toContain('Suggestion: Use transpose() to fix this');
    });

    it('should include documentation link', () => {
      const error = new MusicalError(
        'Test error',
        ErrorCode.NOTE_OUT_OF_RANGE
      );

      expect(error.message).toContain('Documentation:');
      expect(error.message).toContain(`errors/${ErrorCode.NOTE_OUT_OF_RANGE}`);
    });
  });

  describe('noteOutOfRange', () => {
    it('should create note out of range error', () => {
      const error = MusicalError.noteOutOfRange(
        'C9',
        MIDINote(108),
        { patternName: 'melody' }
      );

      expect(error.code).toBe(ErrorCode.NOTE_OUT_OF_RANGE);
      expect(error.message).toContain('C9');
      expect(error.message).toContain('108');
      expect(error.message).toContain('melody');
      expect(error.suggestion).toContain('transpose');
    });
  });

  describe('invalidNoteName', () => {
    it('should create invalid note name error', () => {
      const error = MusicalError.invalidNoteName('H5');

      expect(error.code).toBe(ErrorCode.NOTE_INVALID_NAME);
      expect(error.message).toContain('H5');
      expect(error.suggestion).toContain('[A-G]');
    });
  });

  describe('emptyPattern', () => {
    it('should create empty pattern error', () => {
      const error = MusicalError.emptyPattern('melody');

      expect(error.code).toBe(ErrorCode.PATTERN_EMPTY);
      expect(error.message).toContain('no events');
      expect(error.context?.patternName).toBe('melody');
    });

    it('should work without pattern name', () => {
      const error = MusicalError.emptyPattern();

      expect(error.code).toBe(ErrorCode.PATTERN_EMPTY);
      expect(error.context?.patternName).toBeUndefined();
    });
  });

  describe('invalidDuration', () => {
    it('should create invalid duration error', () => {
      const error = MusicalError.invalidDuration(-1, {
        patternName: 'melody',
      });

      expect(error.code).toBe(ErrorCode.PATTERN_INVALID_DURATION);
      expect(error.message).toContain('-1');
      expect(error.message).toContain('positive');
    });
  });

  describe('invalidTempo', () => {
    it('should create invalid tempo error', () => {
      const error = MusicalError.invalidTempo(0);

      expect(error.code).toBe(ErrorCode.COMPOSITION_INVALID_TEMPO);
      expect(error.message).toContain('0');
      expect(error.message).toContain('1 and 999');
    });
  });

  describe('invalidTimeSignature', () => {
    it('should create invalid time signature error', () => {
      const error = MusicalError.invalidTimeSignature(4, 3);

      expect(error.code).toBe(ErrorCode.COMPOSITION_INVALID_TIME_SIGNATURE);
      expect(error.message).toContain('4/3');
      expect(error.suggestion).toContain('power of 2');
    });
  });

  describe('scheduleOverlap', () => {
    it('should create schedule overlap error', () => {
      const error = MusicalError.scheduleOverlap(
        Seconds(1.0),
        Seconds(1.01),
        { patternName: 'melody' }
      );

      expect(error.code).toBe(ErrorCode.SCHEDULE_OVERLAP);
      expect(error.message).toContain('1');
      expect(error.message).toContain('1.01');
    });
  });

  describe('audioNodeLeak', () => {
    it('should create audio node leak error', () => {
      const error = MusicalError.audioNodeLeak(150);

      expect(error.code).toBe(ErrorCode.AUDIO_NODE_LEAK);
      expect(error.message).toContain('150');
      expect(error.suggestion).toContain('dispose()');
    });
  });

  describe('toJSON', () => {
    it('should serialize error to JSON', () => {
      const error = new MusicalError(
        'Test error',
        ErrorCode.NOTE_OUT_OF_RANGE,
        { patternName: 'melody' },
        'Fix it'
      );

      const json = error.toJSON();

      expect(json).toHaveProperty('name', 'MusicalError');
      expect(json).toHaveProperty('message');
      expect(json).toHaveProperty('code', ErrorCode.NOTE_OUT_OF_RANGE);
      expect(json).toHaveProperty('context', { patternName: 'melody' });
      expect(json).toHaveProperty('suggestion', 'Fix it');
      expect(json).toHaveProperty('stack');
    });
  });

  describe('context fields', () => {
    it('should support track name', () => {
      const error = new MusicalError(
        'Test',
        ErrorCode.PATTERN_EMPTY,
        { trackName: 'bass' }
      );

      expect(error.message).toContain('track: "bass"');
    });

    it('should support event index', () => {
      const error = new MusicalError(
        'Test',
        ErrorCode.NOTE_OUT_OF_RANGE,
        { eventIndex: 42 }
      );

      expect(error.message).toContain('event: #42');
    });

    it('should support pitch', () => {
      const error = new MusicalError(
        'Test',
        ErrorCode.NOTE_OUT_OF_RANGE,
        { pitch: MIDINote(60) }
      );

      expect(error.message).toContain('pitch: 60');
    });

    it('should combine multiple context fields', () => {
      const error = new MusicalError(
        'Test',
        ErrorCode.NOTE_OUT_OF_RANGE,
        {
          patternName: 'melody',
          trackName: 'lead',
          timePosition: Seconds(5.0),
          note: 'C4',
          eventIndex: 10,
        }
      );

      expect(error.message).toContain('pattern: "melody"');
      expect(error.message).toContain('track: "lead"');
      expect(error.message).toContain('time: 5s');
      expect(error.message).toContain('note: C4');
      expect(error.message).toContain('event: #10');
    });
  });
});
