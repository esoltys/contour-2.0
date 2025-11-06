// packages/core/src/debug/Validator.ts

import type { Composition } from '../composition/Composition.js';
import type { Track } from '../composition/Track.js';
import type { Pattern } from '../patterns/Pattern.js';
import type { Event } from '../primitives/Event.js';
import { validatorLogger } from './Logger.js';

/**
 * Validation severity level.
 */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/**
 * Single validation issue.
 */
export interface ValidationIssue {
  severity: ValidationSeverity;
  code: string;
  message: string;
  location?: {
    trackName?: string;
    voiceIndex?: number;
    eventIndex?: number;
    time?: number;
  };
  suggestion?: string;
}

/**
 * Result of composition validation.
 */
export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
  };
}

/**
 * Composition Validator for static analysis.
 *
 * Performs comprehensive checks on Composition objects to detect
 * common mistakes and potential issues before playback.
 *
 * @example
 * ```typescript
 * const composition = new Composition('My Song', BPM(120))
 *   .addTrack(melodyTrack)
 *   .addTrack(harmonyTrack);
 *
 * const result = Validator.validate(composition);
 * if (!result.valid) {
 *   console.error('Validation failed:');
 *   for (const issue of result.issues) {
 *     console.error(`[${issue.severity}] ${issue.message}`);
 *   }
 * }
 * ```
 */
export class Validator {
  /**
   * Validate a composition.
   */
  static validate(composition: Composition, options?: {
    /** Maximum allowed polyphony (default: 100) */
    maxPolyphony?: number;
    /** Minimum valid MIDI note (default: 12 = C0) */
    minNote?: number;
    /** Maximum valid MIDI note (default: 108 = C8) */
    maxNote?: number;
  }): ValidationResult {
    const {
      maxPolyphony = 100,
      minNote = 12,
      maxNote = 108,
    } = options || {};

    const issues: ValidationIssue[] = [];

    validatorLogger.debug('Starting composition validation', {
      title: composition.title,
      trackCount: composition.trackCount,
    });

    // Check if composition is empty
    this.checkEmptyComposition(composition, issues);

    // Check tempo and time signature
    this.checkTempoAndTimeSignature(composition, issues);

    // Check each track
    for (const track of composition.tracks) {
      this.checkTrack(track, issues);
      this.checkNoteRange(track, minNote, maxNote, issues);
    }

    // Check for excessive polyphony
    this.checkPolyphony(composition, maxPolyphony, issues);

    // Calculate summary
    const summary = {
      errors: issues.filter(i => i.severity === 'error').length,
      warnings: issues.filter(i => i.severity === 'warning').length,
      info: issues.filter(i => i.severity === 'info').length,
    };

    const valid = summary.errors === 0;

    validatorLogger.debug('Validation complete', {
      valid,
      issues: issues.length,
      ...summary,
    });

    return { valid, issues, summary };
  }

  /**
   * Check if composition is empty.
   */
  private static checkEmptyComposition(
    composition: Composition,
    issues: ValidationIssue[]
  ): void {
    if (composition.isEmpty) {
      issues.push({
        severity: 'error',
        code: 'EMPTY_COMPOSITION',
        message: 'Composition has no tracks',
        suggestion: 'Add at least one track with .addTrack()',
      });
    }
  }

  /**
   * Check tempo and time signature validity.
   */
  private static checkTempoAndTimeSignature(
    composition: Composition,
    issues: ValidationIssue[]
  ): void {
    // Check tempo
    const tempo = composition.tempo as number;
    if (tempo <= 0 || tempo > 999) {
      issues.push({
        severity: 'error',
        code: 'INVALID_TEMPO',
        message: `Invalid tempo: ${tempo} BPM (must be between 1 and 999)`,
        suggestion: 'Use .withTempo(BPM(120)) to set a valid tempo',
      });
    } else if (tempo < 20) {
      issues.push({
        severity: 'warning',
        code: 'UNUSUALLY_SLOW_TEMPO',
        message: `Very slow tempo: ${tempo} BPM`,
        suggestion: 'Verify this is intentional',
      });
    } else if (tempo > 300) {
      issues.push({
        severity: 'warning',
        code: 'UNUSUALLY_FAST_TEMPO',
        message: `Very fast tempo: ${tempo} BPM`,
        suggestion: 'Verify this is intentional',
      });
    }

    // Check time signature
    const { numerator, denominator } = composition.timeSignature;

    if (numerator <= 0) {
      issues.push({
        severity: 'error',
        code: 'INVALID_TIME_SIGNATURE',
        message: `Invalid time signature numerator: ${numerator}`,
        suggestion: 'Numerator must be positive',
      });
    }

    // Check if denominator is power of 2
    if (denominator <= 0 || !Number.isInteger(Math.log2(denominator))) {
      issues.push({
        severity: 'error',
        code: 'INVALID_TIME_SIGNATURE',
        message: `Invalid time signature denominator: ${denominator}`,
        suggestion: 'Denominator must be power of 2 (2, 4, 8, 16, etc.)',
      });
    }
  }

  /**
   * Check track validity.
   */
  private static checkTrack(track: Track, issues: ValidationIssue[]): void {
    // Check for empty track
    if (track.voices.length === 0) {
      issues.push({
        severity: 'warning',
        code: 'EMPTY_TRACK',
        message: `Track "${track.name}" has no voices`,
        location: { trackName: track.name },
        suggestion: 'Remove empty track or add voices',
      });
      return;
    }

    // Check each voice
    for (let voiceIndex = 0; voiceIndex < track.voices.length; voiceIndex++) {
      const voice = track.voices[voiceIndex];
      this.checkPattern(voice.pattern, track.name, voiceIndex, issues);
    }

    // Check for silent tracks (all voices have no events)
    const hasAnyEvents = track.voices.some(v => v.pattern.events.length > 0);
    if (!hasAnyEvents) {
      issues.push({
        severity: 'warning',
        code: 'SILENT_TRACK',
        message: `Track "${track.name}" has no events in any voice`,
        location: { trackName: track.name },
        suggestion: 'Check if this track is needed',
      });
    }
  }

  /**
   * Check pattern validity.
   */
  private static checkPattern(
    pattern: Pattern,
    trackName: string,
    voiceIndex: number,
    issues: ValidationIssue[]
  ): void {
    // Check for empty pattern
    if (pattern.isEmpty) {
      issues.push({
        severity: 'warning',
        code: 'EMPTY_PATTERN',
        message: 'Pattern has no events',
        location: { trackName, voiceIndex },
        suggestion: 'Add events or remove this voice',
      });
      return;
    }

    // Check each event
    for (let eventIndex = 0; eventIndex < pattern.events.length; eventIndex++) {
      const event = pattern.events[eventIndex];

      // Check for zero duration
      if (event.duration === 0) {
        issues.push({
          severity: 'warning',
          code: 'ZERO_DURATION',
          message: 'Event has zero duration',
          location: { trackName, voiceIndex, eventIndex, time: event.time },
          suggestion: 'Set a positive duration',
        });
      }

      // Check for zero velocity (silent note)
      if (event.type === 'note' && event.velocity === 0) {
        issues.push({
          severity: 'info',
          code: 'SILENT_NOTE',
          message: 'Note has zero velocity',
          location: { trackName, voiceIndex, eventIndex, time: event.time },
          suggestion: 'Use a rest event instead of zero velocity note',
        });
      }
    }
  }

  /**
   * Check for notes out of valid range.
   */
  private static checkNoteRange(
    track: Track,
    minNote: number,
    maxNote: number,
    issues: ValidationIssue[]
  ): void {
    for (let voiceIndex = 0; voiceIndex < track.voices.length; voiceIndex++) {
      const voice = track.voices[voiceIndex];
      const pattern = voice.pattern;

      for (let eventIndex = 0; eventIndex < pattern.events.length; eventIndex++) {
        const event = pattern.events[eventIndex];

        const checkPitch = (pitch: number) => {
          if (pitch < minNote || pitch > maxNote) {
            issues.push({
              severity: 'error',
              code: 'NOTE_OUT_OF_RANGE',
              message: `Note MIDI ${pitch} out of range (${minNote}-${maxNote})`,
              location: { trackName: track.name, voiceIndex, eventIndex, time: event.time },
              suggestion: 'Use Pattern.transpose() to bring notes into valid range',
            });
          }
        };

        if (event.type === 'note') {
          checkPitch(event.pitch);
        } else if (event.type === 'chord') {
          for (const note of event.notes) {
            checkPitch(note.pitch);
          }
        }
      }
    }
  }

  /**
   * Check for excessive polyphony.
   */
  private static checkPolyphony(
    composition: Composition,
    maxPolyphony: number,
    issues: ValidationIssue[]
  ): void {
    // Collect all events with their track information
    const allEvents: Array<{
      event: Event;
      trackName: string;
      voiceIndex: number;
    }> = [];

    for (const track of composition.tracks) {
      for (let voiceIndex = 0; voiceIndex < track.voices.length; voiceIndex++) {
        const voice = track.voices[voiceIndex];
        for (const event of voice.pattern.events) {
          allEvents.push({ event, trackName: track.name, voiceIndex });
        }
      }
    }

    // Sort by time
    allEvents.sort((a, b) => a.event.time - b.event.time);

    // Track active notes at each point in time
    const activeNotes: Array<{ event: Event; endTime: number }> = [];
    let maxSimultaneous = 0;
    let maxTime = 0;

    for (const { event } of allEvents) {
      const time = event.time;
      const endTime = time + event.duration;

      // Remove ended notes
      const stillActive = activeNotes.filter(n => n.endTime > time);
      activeNotes.length = 0;
      activeNotes.push(...stillActive);

      // Add current note(s)
      if (event.type === 'note') {
        activeNotes.push({ event, endTime });
      } else if (event.type === 'chord') {
        // Each note in chord counts separately
        for (let i = 0; i < event.notes.length; i++) {
          activeNotes.push({ event, endTime });
        }
      }

      // Track maximum
      if (activeNotes.length > maxSimultaneous) {
        maxSimultaneous = activeNotes.length;
        maxTime = time;
      }
    }

    if (maxSimultaneous > maxPolyphony) {
      issues.push({
        severity: 'warning',
        code: 'EXCESSIVE_POLYPHONY',
        message: `Excessive polyphony: ${maxSimultaneous} simultaneous notes at time ${maxTime}s`,
        location: { time: maxTime },
        suggestion: `Reduce simultaneous notes (max recommended: ${maxPolyphony})`,
      });
    }
  }

  /**
   * Format validation result as human-readable string.
   */
  static formatResult(result: ValidationResult): string {
    const lines: string[] = [];

    if (result.valid) {
      lines.push('✓ Validation passed');
    } else {
      lines.push('✗ Validation failed');
    }

    lines.push('');
    lines.push(`Summary: ${result.summary.errors} errors, ${result.summary.warnings} warnings, ${result.summary.info} info`);

    if (result.issues.length > 0) {
      lines.push('');
      lines.push('Issues:');

      for (const issue of result.issues) {
        const icon = issue.severity === 'error' ? '✗' : issue.severity === 'warning' ? '⚠' : 'ℹ';
        let msg = `  ${icon} [${issue.code}] ${issue.message}`;

        if (issue.location) {
          const loc = issue.location;
          const parts: string[] = [];
          if (loc.trackName) parts.push(`track: ${loc.trackName}`);
          if (loc.voiceIndex !== undefined) parts.push(`voice: ${loc.voiceIndex}`);
          if (loc.eventIndex !== undefined) parts.push(`event: ${loc.eventIndex}`);
          if (loc.time !== undefined) parts.push(`time: ${loc.time}s`);
          if (parts.length > 0) {
            msg += ` (${parts.join(', ')})`;
          }
        }

        lines.push(msg);

        if (issue.suggestion) {
          lines.push(`    → ${issue.suggestion}`);
        }
      }
    }

    return lines.join('\n');
  }
}
