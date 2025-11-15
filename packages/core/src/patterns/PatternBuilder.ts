// packages/core/src/patterns/PatternBuilder.ts

import { Pattern } from './Pattern.js';
import type { Event, NoteEvent, RestEvent, ChordEvent } from '../primitives/Event.js';
import { Note } from '../primitives/Note.js';
import type { NoteName } from '../types/music.js';
import { Seconds, Velocity, Duration } from '../types/brands.js';
import { Durations } from '../types/music.js';
import { parseMiniNotationWithDefaults } from './MiniNotation.js';

/**
 * Fluent builder for constructing patterns.
 */
export class PatternBuilder {
  private events: Event[] = [];
  private currentTime: Seconds = Seconds(0);
  private defaultDuration: Duration = Durations.quarter;
  private defaultVelocity: Velocity = Velocity(80);
  private activeScale?: any; // Scale type (avoid circular dependency)

  /**
   * Add a single note.
   */
  note(
    note: Note | NoteName,
    duration?: Duration,
    velocity?: Velocity
  ): this {
    const noteObj = typeof note === 'string' ? new Note(note) : note;
    const dur = duration ?? this.defaultDuration;
    const vel = velocity ?? this.defaultVelocity;

    const noteEvent: NoteEvent = {
      type: 'note',
      time: this.currentTime,
      duration: dur,
      velocity: vel,
      pitch: noteObj.pitch,
      note: noteObj,
    };

    this.events.push(noteEvent);
    this.currentTime = Seconds(this.currentTime + dur);
    return this;
  }

  /**
   * Add multiple notes sequentially.
   */
  notes(
    notes: (Note | NoteName)[],
    duration?: Duration,
    velocity?: Velocity
  ): this {
    for (const note of notes) {
      this.note(note, duration, velocity);
    }
    return this;
  }

  /**
   * Add a chord (simultaneous notes).
   */
  chord(
    notes: (Note | NoteName)[],
    duration?: Duration,
    velocity?: Velocity
  ): this {
    const noteObjs = notes.map((n) =>
      typeof n === 'string' ? new Note(n) : n
    );
    const dur = duration ?? this.defaultDuration;
    const vel = velocity ?? this.defaultVelocity;

    const chordEvent: ChordEvent = {
      type: 'chord',
      time: this.currentTime,
      duration: dur,
      velocity: vel,
      notes: noteObjs,
    };

    this.events.push(chordEvent);
    this.currentTime = Seconds(this.currentTime + dur);
    return this;
  }

  /**
   * Add a rest.
   */
  rest(duration?: Duration): this {
    const dur = duration ?? this.defaultDuration;

    const restEvent: RestEvent = {
      type: 'rest',
      time: this.currentTime,
      duration: dur,
      velocity: Velocity(0),
    };

    this.events.push(restEvent);
    this.currentTime = Seconds(this.currentTime + dur);
    return this;
  }

  /**
   * Set default duration for subsequent notes.
   */
  withDuration(duration: Duration): this {
    this.defaultDuration = duration;
    return this;
  }

  /**
   * Set default velocity for subsequent notes.
   */
  withVelocity(velocity: Velocity): this {
    this.defaultVelocity = velocity;
    return this;
  }

  /**
   * Apply crescendo (gradual velocity increase) to existing events.
   */
  crescendo(startVel: number, endVel: number): this {
    if (startVel < 0 || startVel > 127) {
      throw new RangeError(`startVel must be 0-127, got ${startVel}`);
    }
    if (endVel < 0 || endVel > 127) {
      throw new RangeError(`endVel must be 0-127, got ${endVel}`);
    }

    const numEvents = this.events.length;
    if (numEvents === 0) return this;

    this.events = this.events.map((event, i) => {
      // Handle single event case
      const interpolatedVel = numEvents === 1
        ? startVel
        : startVel + (endVel - startVel) * (i / (numEvents - 1));
      return {
        ...event,
        velocity: Velocity(Math.round(interpolatedVel)),
      };
    });
    return this;
  }

  /**
   * Apply humanization (slight timing and velocity randomness).
   *
   * @param timingAmount - Amount of timing randomness (0-1), default 0.05 (5%)
   * @param velocityAmount - Amount of velocity randomness (0-1), default 0.1 (10%)
   */
  humanize(timingAmount: number = 0.05, velocityAmount: number = 0.1): this {
    if (timingAmount < 0 || timingAmount > 1) {
      throw new RangeError(`timingAmount must be 0-1, got ${timingAmount}`);
    }
    if (velocityAmount < 0 || velocityAmount > 1) {
      throw new RangeError(`velocityAmount must be 0-1, got ${velocityAmount}`);
    }

    this.events = this.events.map((event) => {
      // Randomize timing (within ±timingAmount of original time)
      const timingJitter = (Math.random() - 0.5) * 2 * timingAmount * event.duration;
      const newTime = Math.max(0, event.time + timingJitter);

      // Randomize velocity (within ±velocityAmount of original velocity)
      const velocityJitter = (Math.random() - 0.5) * 2 * velocityAmount * event.velocity;
      const newVelocity = Math.max(1, Math.min(127, Math.round(event.velocity + velocityJitter)));

      return {
        ...event,
        time: Seconds(newTime),
        velocity: Velocity(newVelocity),
      };
    });
    return this;
  }

  /**
   * Apply swing rhythm (delays every other note).
   *
   * @param amount - Amount of swing (0-1), default 0.15 (15%)
   */
  swing(amount: number = 0.15): this {
    if (amount < 0 || amount > 1) {
      throw new RangeError(`amount must be 0-1, got ${amount}`);
    }

    // Apply swing by delaying odd-indexed events
    this.events = this.events.map((event, i) => {
      if (i % 2 === 1 && i > 0) {
        // Delay odd events by amount * previous event duration
        const prevEvent = this.events[i - 1];
        const delay = amount * prevEvent.duration;
        return {
          ...event,
          time: Seconds(event.time + delay),
        };
      }
      return event;
    });

    return this;
  }

  /**
   * Parse mini-notation string and add events.
   *
   * Syntax:
   * - Space-separated events: "C4 E4 G4"
   * - Repetition: "C4*4" (repeat C4 4 times)
   * - Grouping: "[C4 E4]" (subdivision)
   * - Rests: "~" or "_"
   * - Hold/extend: "C4@2" (C4 twice as long)
   * - Duration: "C4/8" (eighth note)
   * - Octave persistence: "C4 D E F" (all octave 4)
   * - Chord symbols: "Cmaj7 Dm7 G7"
   * - Scale degrees: "$1 $3 $5" (requires withScale to be called first)
   *
   * @param notation - Mini-notation string
   * @returns this for chaining
   *
   * @example
   * ```typescript
   * const cMajor = new Scale('C4', 'major');
   * const pattern = new PatternBuilder()
   *   .withScale(cMajor)
   *   .fromNotation('$1 $3 $5 $8') // C4, E4, G4, C5
   *   .build();
   * ```
   */
  fromNotation(notation: string): this {
    const events = parseMiniNotationWithDefaults(notation, {
      defaultDuration: this.defaultDuration,
      defaultVelocity: this.defaultVelocity,
      scale: this.activeScale,
    });

    // Adjust event times based on current time
    const adjustedEvents = events.map(event => ({
      ...event,
      time: Seconds(event.time + this.currentTime),
    }));

    this.events.push(...adjustedEvents);

    // Update current time to end of notation
    if (adjustedEvents.length > 0) {
      const lastEvent = adjustedEvents[adjustedEvents.length - 1];
      this.currentTime = Seconds(lastEvent.time + lastEvent.duration);
    }

    return this;
  }

  /**
   * Set active scale context for degree-based notation.
   *
   * After calling this, you can use the degrees() method to add notes
   * by scale degree instead of absolute pitch.
   *
   * @param scale - Scale to use for degree-based notation
   * @returns this for chaining
   *
   * @example
   * ```typescript
   * import { Scale, PatternBuilder } from '@contour/core';
   *
   * const cMajor = new Scale('C4', 'major');
   * const pattern = new PatternBuilder()
   *   .withScale(cMajor)
   *   .degrees([1, 3, 5, 8]) // C4, E4, G4, C5
   *   .build();
   * ```
   */
  withScale(scale: any): this {
    this.activeScale = scale;
    return this;
  }

  /**
   * Add notes by scale degree (requires withScale to be called first).
   *
   * Scale degrees are 1-indexed: 1 = tonic, 3 = third, 5 = fifth, etc.
   *
   * @param degrees - Array of scale degrees (1-indexed)
   * @param durations - Optional array of durations (one per degree, or single duration for all)
   * @param velocity - Optional velocity for all notes
   * @returns this for chaining
   *
   * @example
   * ```typescript
   * const dDorian = new Scale('D4', 'Dorian');
   * const pattern = new PatternBuilder()
   *   .withScale(dDorian)
   *   .degrees([1, 2, 3, 4, 5, 6, 7, 8]) // D Dorian scale
   *   .build();
   * ```
   */
  degrees(
    degrees: number[],
    durations?: Duration | Duration[],
    velocity?: Velocity
  ): this {
    if (!this.activeScale) {
      throw new Error('Must call withScale() before using degrees()');
    }

    degrees.forEach((deg, i) => {
      const note = this.activeScale.degree(deg);

      // Handle durations: single value or array
      let duration: Duration | undefined;
      if (durations) {
        duration = Array.isArray(durations) ? durations[i] : durations;
      }

      this.note(note, duration, velocity);
    });

    return this;
  }

  /**
   * Build immutable Pattern.
   */
  build(): Pattern {
    return new Pattern(this.events);
  }
}

/**
 * Factory function for creating patterns.
 */
export const pattern = (): PatternBuilder => {
  return new PatternBuilder();
};
