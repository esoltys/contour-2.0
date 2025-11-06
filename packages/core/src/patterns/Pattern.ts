// packages/core/src/patterns/Pattern.ts

import type { Event, NoteEvent, ChordEvent } from '../primitives/Event.js';
import { Seconds, MIDINote, Duration, Velocity } from '../types/brands.js';
import { Note } from '../primitives/Note.js';
import { PatternInspector, type PatternInspection } from '../debug/PatternInspector.js';

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
   * Stack patterns simultaneously (layer them).
   * All patterns start at time 0.
   */
  stack(other: Pattern): Pattern {
    return new Pattern([...this.events, ...other.events]);
  }

  /**
   * Append pattern sequentially (one after another).
   * The other pattern starts after this pattern ends.
   */
  append(other: Pattern): Pattern {
    const thisEnd = this.duration;
    const shiftedEvents = other.events.map(event => ({
      ...event,
      time: Seconds(event.time + thisEnd),
    }));
    return new Pattern([...this.events, ...shiftedEvents]);
  }

  /**
   * Create a palindrome: pattern followed by its retrograde.
   */
  palindrome(): Pattern {
    return this.append(this.retrograde());
  }

  /**
   * Generate Euclidean rhythm pattern.
   * Distributes pulses as evenly as possible across steps.
   *
   * @param steps - Total number of steps
   * @param pulses - Number of pulses to distribute
   * @param rotation - Optional rotation offset
   * @returns Pattern with Euclidean rhythm
   */
  static euclidean(
    steps: number,
    pulses: number,
    rotation: number = 0
  ): Pattern {
    if (steps <= 0 || pulses < 0 || pulses > steps) {
      throw new RangeError(
        `Invalid Euclidean parameters: steps=${steps}, pulses=${pulses}`
      );
    }

    // Bjorklund's algorithm for Euclidean rhythms
    const pattern = euclideanRhythm(steps, pulses);

    // Apply rotation
    if (rotation !== 0) {
      const rot = ((rotation % steps) + steps) % steps; // Handle negative rotation
      pattern.push(...pattern.splice(0, rot));
    }

    // Convert to events (use rests for non-pulse positions)
    const stepDuration = Duration(1 / steps);
    const events: Event[] = pattern.map((isPulse, i) => {
      const time = Seconds(i * stepDuration);
      if (isPulse) {
        // Create a simple note event (user can override by mapping)
        const note = Note.fromMIDI(MIDINote(60)); // Middle C
        return {
          type: 'note',
          time,
          duration: stepDuration,
          velocity: Velocity(80),
          pitch: MIDINote(60),
          note,
        } as Event;
      } else {
        return {
          type: 'rest',
          time,
          duration: stepDuration,
          velocity: Velocity(0),
        } as Event;
      }
    });

    return new Pattern(events);
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

  /**
   * Inspect pattern and return detailed metrics.
   *
   * @returns PatternInspection object with duration, event counts, note range, timing, and velocity analysis
   *
   * @example
   * ```typescript
   * const pattern = new PatternBuilder()
   *   .notes(['C4', 'E4', 'G4', 'C5'])
   *   .durations([0.25, 0.25, 0.25, 0.25])
   *   .build();
   *
   * const inspection = pattern.inspect();
   * console.log(inspection.duration); // 1.0
   * console.log(inspection.eventCount.notes); // 4
   * console.log(inspection.noteRange); // { lowest: 60, highest: 72, span: 12 }
   * ```
   */
  inspect(): PatternInspection {
    return PatternInspector.inspect(this);
  }

  /**
   * Generate ASCII visualization of the pattern.
   *
   * Shows notes on a timeline with time on the horizontal axis.
   * Useful for debugging and understanding pattern structure.
   *
   * @param options - Visualization options
   * @returns ASCII string representation
   *
   * @example
   * ```typescript
   * const pattern = new PatternBuilder()
   *   .notes(['C5', 'G4', 'E4', 'C4'])
   *   .durations([0.25, 0.25, 0.25, 0.25])
   *   .build();
   *
   * console.log(pattern.toASCII());
   * // Output:
   * // Time:  0.0   0.25  0.5   0.75
   * // C5:    █     .     .     .
   * // G4:    .     █     .     .
   * // E4:    .     .     █     .
   * // C4:    .     .     .     █
   * ```
   */
  toASCII(options?: {
    width?: number;
    showVelocity?: boolean;
    showRests?: boolean;
  }): string {
    return PatternInspector.toASCII(this, options);
  }

  /**
   * Print pattern visualization to console.
   *
   * @param options - Visualization options
   */
  toConsole(options?: { showVelocity?: boolean }): void {
    PatternInspector.toConsole(this, options);
  }
}

/**
 * Bjorklund's algorithm for generating Euclidean rhythms.
 * Returns an array of booleans where true represents a pulse.
 */
function euclideanRhythm(steps: number, pulses: number): boolean[] {
  if (pulses === 0) {
    return Array(steps).fill(false);
  }
  if (pulses === steps) {
    return Array(steps).fill(true);
  }

  // Build initial groups
  const groups: boolean[][] = [];
  const remainder = steps - pulses;

  // Initial groups: pulses are [true], rests are [false]
  for (let i = 0; i < pulses; i++) {
    groups.push([true]);
  }
  for (let i = 0; i < remainder; i++) {
    groups.push([false]);
  }

  // Apply Bjorklund's algorithm
  let left = pulses;
  let right = remainder;

  while (right > 1) {
    const minCount = Math.min(left, right);

    // Combine groups
    for (let i = 0; i < minCount; i++) {
      groups[i] = [...groups[i], ...groups[left + i]];
    }

    // Remove combined groups
    groups.splice(left, minCount);

    // Update counts
    if (left > right) {
      left -= right;
    } else {
      right -= left;
      // Swap left and right to continue combining the smaller group into the larger.
      // This maintains the correct structure for the next iteration of the algorithm.
      [left, right] = [right, left];
    }
  }

  // Flatten groups
  return groups.flat();
}
