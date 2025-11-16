/**
 * Lightweight interfaces for breaking circular dependencies between Scale and Pattern.
 *
 * These interfaces define the minimal contracts needed for cross-references,
 * allowing Scale and Pattern to depend on these interfaces instead of each other.
 */

import type { MIDINote, Duration, Velocity, Seconds } from './brands.js';
import type { NoteName } from './music.js';

/**
 * Minimal interface for Note-like objects.
 * Used to avoid circular dependencies while maintaining type safety.
 */
export interface NoteLike {
  readonly pitch: MIDINote;
  readonly name: NoteName;
  transpose(semitones: number): NoteLike;
}

/**
 * Minimal interface for Scale-like objects.
 * Defines the contract for objects that can provide scale notes and degrees.
 */
export interface ScaleLike {
  /**
   * Get all notes in the scale (one octave).
   * @returns Array of Note-like objects
   */
  getNotes(): NoteLike[];

  /**
   * Get note at specific scale degree (1-indexed).
   * @param degree - Scale degree (1 = tonic, 5 = dominant, etc.)
   * @returns Note-like object at the specified degree
   */
  degree(degree: number): NoteLike;
}

/**
 * Minimal interface for Pattern-like objects.
 * Defines the contract for objects that represent musical patterns.
 */
export interface PatternLike {
  readonly events: ReadonlyArray<{
    type: string;
    time: Seconds;
    duration: Duration;
    velocity: Velocity;
  }>;
  readonly duration: Duration;
}
