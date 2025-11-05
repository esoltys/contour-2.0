// packages/core/src/patterns/Pattern.ts

import type { Event, NoteEvent, ChordEvent } from '../primitives/Event.js';
import { Seconds, MIDINote, Duration } from '../types/brands.js';

/**
 * Immutable pattern of musical events.
 */
export class Pattern {
  readonly events: ReadonlyArray<Event>;
  readonly duration: Duration;

  constructor(events: Event[]) {
    this.events = Object.freeze([...events]);
    this.duration = this.calculateDuration();
  }

  /**
   * Transpose all notes by semitones (returns new Pattern).
   */
  transpose(semitones: number): Pattern {
    const newEvents = this.events.map((event) => {
      if (event.type === 'note') {
        return {
          ...event,
          note: event.note.transpose(semitones),
          pitch: MIDINote(event.pitch + semitones),
        };
      }
      if (event.type === 'chord') {
        return {
          ...event,
          notes: event.notes.map((n) => n.transpose(semitones)),
        };
      }
      return event;
    });
    return new Pattern(newEvents);
  }

  /**
   * Reverse the pattern (retrograde).
   */
  retrograde(): Pattern {
    const totalDuration = this.duration;
    const newEvents = [...this.events].reverse().map((event) => ({
      ...event,
      time: Seconds(totalDuration - event.time - event.duration),
    }));
    return new Pattern(newEvents);
  }

  /**
   * Change speed (fast multiplies speed, slow divides).
   */
  fast(factor: number): Pattern {
    if (factor <= 0) {
      throw new RangeError(`fast factor must be positive, got ${factor}`);
    }
    const newEvents = this.events.map((event) => ({
      ...event,
      time: Seconds(event.time / factor),
      duration: Duration(event.duration / factor),
    }));
    return new Pattern(newEvents);
  }

  /**
   * Slow down the pattern (inverse of fast).
   */
  slow(factor: number): Pattern {
    if (factor <= 0) {
      throw new RangeError(`slow factor must be positive, got ${factor}`);
    }
    return this.fast(1 / factor);
  }

  /**
   * Apply transformation every N cycles.
   *
   * @param n - Apply transformation every N cycles
   * @param transform - Transformation function to apply
   * @param currentCycle - Current cycle number (used internally)
   */
  every(
    n: number,
    transform: (p: Pattern) => Pattern,
    currentCycle: number = 0
  ): Pattern {
    if (n <= 0 || !Number.isInteger(n)) {
      throw new RangeError(`every n must be a positive integer, got ${n}`);
    }

    // Apply transformation if current cycle is divisible by n
    if (currentCycle % n === 0) {
      return transform(this);
    }
    return this;
  }

  /**
   * Functional map over events.
   */
  map<T extends Event>(fn: (event: Event, index: number) => T): Pattern {
    return new Pattern(this.events.map(fn));
  }

  /**
   * Functional filter.
   */
  filter(predicate: (event: Event, index: number) => boolean): Pattern {
    return new Pattern(this.events.filter(predicate));
  }

  /**
   * Get the number of events in this pattern.
   */
  get length(): number {
    return this.events.length;
  }

  /**
   * Check if pattern is empty.
   */
  get isEmpty(): boolean {
    return this.events.length === 0;
  }

  /**
   * Calculate the total duration of the pattern.
   */
  private calculateDuration(): Duration {
    if (this.events.length === 0) return Duration(0);

    // Find the event that ends last
    let maxEndTime = 0;
    for (const event of this.events) {
      const endTime = event.time + event.duration;
      if (endTime > maxEndTime) {
        maxEndTime = endTime;
      }
    }

    return Duration(maxEndTime);
  }
}
