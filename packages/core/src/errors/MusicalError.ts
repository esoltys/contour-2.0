// packages/core/src/errors/MusicalError.ts

import type { Seconds, MIDINote } from '../types/brands.js';

/**
 * Error codes for documentation lookup.
 */
export enum ErrorCode {
  // Pattern errors (1xxx)
  PATTERN_EMPTY = 'E1001',
  PATTERN_INVALID_DURATION = 'E1002',
  PATTERN_INVALID_TRANSFORM = 'E1003',

  // Note errors (2xxx)
  NOTE_OUT_OF_RANGE = 'E2001',
  NOTE_INVALID_NAME = 'E2002',
  NOTE_INVALID_PITCH = 'E2003',

  // Composition errors (3xxx)
  COMPOSITION_EMPTY = 'E3001',
  COMPOSITION_INVALID_TEMPO = 'E3002',
  COMPOSITION_INVALID_TIME_SIGNATURE = 'E3003',

  // Scheduling errors (4xxx)
  SCHEDULE_OVERLAP = 'E4001',
  SCHEDULE_INVALID_TIME = 'E4002',

  // Audio errors (5xxx)
  AUDIO_NODE_LEAK = 'E5001',
  AUDIO_CONTEXT_ERROR = 'E5002',
}

/**
 * Musical context for errors.
 */
export interface MusicalContext {
  /** Pattern name or identifier */
  patternName?: string;

  /** Time position where error occurred */
  timePosition?: Seconds;

  /** Note or pitch involved */
  note?: string;
  pitch?: MIDINote;

  /** Track name */
  trackName?: string;

  /** Event index */
  eventIndex?: number;

  /** Additional context */
  [key: string]: unknown;
}

/**
 * Enhanced error class with musical context.
 *
 * Provides detailed error messages with musical information,
 * error codes for documentation lookup, and suggestions for fixes.
 *
 * @example
 * ```typescript
 * throw new MusicalError(
 *   'Note C9 exceeds maximum C8',
 *   ErrorCode.NOTE_OUT_OF_RANGE,
 *   { patternName: 'melody', timePosition: Seconds(2.5), note: 'C9' },
 *   'Use Note.transpose() to bring notes into valid range (C0-C8)'
 * );
 * ```
 */
export class MusicalError extends Error {
  readonly code: ErrorCode;
  readonly context?: MusicalContext;
  readonly suggestion?: string;

  constructor(
    message: string,
    code: ErrorCode,
    context?: MusicalContext,
    suggestion?: string
  ) {
    // Build enhanced message
    const enhancedMessage = MusicalError.buildMessage(message, code, context, suggestion);
    super(enhancedMessage);

    this.name = 'MusicalError';
    this.code = code;
    this.context = context;
    this.suggestion = suggestion;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MusicalError);
    }
  }

  /**
   * Build enhanced error message with all context.
   */
  private static buildMessage(
    message: string,
    code: ErrorCode,
    context?: MusicalContext,
    suggestion?: string
  ): string {
    const parts: string[] = [`[${code}] ${message}`];

    // Add context information
    if (context) {
      const contextParts: string[] = [];

      if (context.patternName) {
        contextParts.push(`pattern: "${context.patternName}"`);
      }

      if (context.trackName) {
        contextParts.push(`track: "${context.trackName}"`);
      }

      if (context.timePosition !== undefined) {
        contextParts.push(`time: ${context.timePosition}s`);
      }

      if (context.note) {
        contextParts.push(`note: ${context.note}`);
      }

      if (context.pitch !== undefined) {
        contextParts.push(`pitch: ${context.pitch}`);
      }

      if (context.eventIndex !== undefined) {
        contextParts.push(`event: #${context.eventIndex}`);
      }

      if (contextParts.length > 0) {
        parts.push(`Context: ${contextParts.join(', ')}`);
      }
    }

    // Add suggestion
    if (suggestion) {
      parts.push(`Suggestion: ${suggestion}`);
    }

    // Add documentation link
    parts.push(`Documentation: https://docs.contour.dev/errors/${code}`);

    return parts.join('\n');
  }

  /**
   * Convert error to JSON for logging/serialization.
   */
  toJSON(): object {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      context: this.context,
      suggestion: this.suggestion,
      stack: this.stack,
    };
  }

  /**
   * Create error for note out of range.
   */
  static noteOutOfRange(
    note: string,
    pitch: MIDINote,
    context?: MusicalContext
  ): MusicalError {
    return new MusicalError(
      `Note ${note} (MIDI ${pitch}) is out of valid range (C0-C8 / MIDI 12-108)`,
      ErrorCode.NOTE_OUT_OF_RANGE,
      { ...context, note, pitch },
      'Use Note.transpose() to bring notes into valid range, or check your input data'
    );
  }

  /**
   * Create error for invalid note name.
   */
  static invalidNoteName(
    noteName: string,
    context?: MusicalContext
  ): MusicalError {
    return new MusicalError(
      `Invalid note name: "${noteName}"`,
      ErrorCode.NOTE_INVALID_NAME,
      { ...context, note: noteName },
      'Note names must follow format: [A-G][#b]?[0-8] (e.g., "C4", "F#5", "Bb3")'
    );
  }

  /**
   * Create error for empty pattern.
   */
  static emptyPattern(patternName?: string): MusicalError {
    return new MusicalError(
      'Pattern has no events',
      ErrorCode.PATTERN_EMPTY,
      { patternName },
      'Add events using PatternBuilder or check your pattern source'
    );
  }

  /**
   * Create error for invalid duration.
   */
  static invalidDuration(
    duration: number,
    context?: MusicalContext
  ): MusicalError {
    return new MusicalError(
      `Invalid duration: ${duration} (must be positive)`,
      ErrorCode.PATTERN_INVALID_DURATION,
      context,
      'Ensure all durations are positive numbers'
    );
  }

  /**
   * Create error for invalid tempo.
   */
  static invalidTempo(tempo: number): MusicalError {
    return new MusicalError(
      `Invalid tempo: ${tempo} BPM (must be between 1 and 999)`,
      ErrorCode.COMPOSITION_INVALID_TEMPO,
      { tempo },
      'Use BPM() constructor with a valid tempo value'
    );
  }

  /**
   * Create error for invalid time signature.
   */
  static invalidTimeSignature(
    numerator: number,
    denominator: number
  ): MusicalError {
    return new MusicalError(
      `Invalid time signature: ${numerator}/${denominator}`,
      ErrorCode.COMPOSITION_INVALID_TIME_SIGNATURE,
      { numerator, denominator },
      'Time signature numerator must be positive, denominator must be power of 2'
    );
  }

  /**
   * Create error for scheduling overlap.
   */
  static scheduleOverlap(
    time1: Seconds,
    time2: Seconds,
    context?: MusicalContext
  ): MusicalError {
    return new MusicalError(
      `Schedule overlap detected at times ${time1}s and ${time2}s`,
      ErrorCode.SCHEDULE_OVERLAP,
      { ...context, time1, time2 },
      'Check for duplicate events or overlapping patterns'
    );
  }

  /**
   * Create error for audio node leak.
   */
  static audioNodeLeak(nodeCount: number): MusicalError {
    return new MusicalError(
      `Potential audio node leak detected: ${nodeCount} nodes created`,
      ErrorCode.AUDIO_NODE_LEAK,
      { nodeCount },
      'Ensure all AudioNodes are disposed with .dispose() when no longer needed'
    );
  }
}
