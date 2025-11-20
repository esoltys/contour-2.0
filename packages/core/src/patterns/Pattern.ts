// packages/core/src/patterns/Pattern.ts

import type { Event, NoteEvent, ChordEvent } from '../primitives/Event.js';
import { Seconds, MIDINote, Duration, Velocity } from '../types/brands.js';
import { Note } from '../primitives/Note.js';
import { PatternInspector, type PatternInspection } from '../debug/PatternInspector.js';
import type { ScaleLike, NoteLike } from '../types/interfaces.js';

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

  /**
   * Quantize pattern notes to a scale (snap to nearest scale degree).
   *
   * This method adjusts all note events to the nearest pitch in the given scale.
   * Useful for constraining melodic content to a specific scale or mode.
   *
   * @param scale - Scale to quantize to
   * @returns New Pattern with quantized notes
   *
   * @example
   * ```typescript
   * import { Scale, PatternBuilder } from '@contour/core';
   *
   * // Create a chromatic melody
   * const chromatic = new PatternBuilder()
   *   .notes(['C4', 'C#4', 'D4', 'D#4', 'E4'])
   *   .build();
   *
   * // Quantize to C major scale
   * const cMajor = new Scale('C4', 'major');
   * const quantized = chromatic.inScale(cMajor);
   * // C#4 becomes D4, D#4 becomes E4
   * ```
   */
  inScale(scale: ScaleLike): Pattern {
    const scaleNotes = scale.getNotes();

    return this.map((event) => {
      if (event.type === 'note') {
        const nearestNote = this.findNearestScaleNote(event.pitch, scaleNotes);
        return {
          ...event,
          note: nearestNote as Note,
          pitch: nearestNote.pitch,
        };
      }

      if (event.type === 'chord') {
        // Quantize each note in the chord
        const quantizedNotes = event.notes.map((note) =>
          this.findNearestScaleNote(note.pitch, scaleNotes)
        ) as Note[];

        return {
          ...event,
          notes: quantizedNotes,
        };
      }

      return event;
    });
  }

  /**
   * Find the nearest note in a scale to a given pitch.
   * In case of tie, prefers the higher note (upward snap).
   *
   * @param pitch - The pitch to quantize
   * @param scaleNotes - Array of notes in the scale
   * @returns The nearest scale note
   */
  private findNearestScaleNote(pitch: MIDINote, scaleNotes: NoteLike[]): NoteLike {
    let nearestNote = scaleNotes[0];
    let minDistance = Math.abs(scaleNotes[0].pitch - pitch);

    for (const scaleNote of scaleNotes) {
      const distance = Math.abs(scaleNote.pitch - pitch);
      // In case of tie, prefer the higher note (upward snap)
      if (distance < minDistance ||
          (distance === minDistance && scaleNote.pitch > nearestNote.pitch)) {
        minDistance = distance;
        nearestNote = scaleNote;
      }
    }

    return nearestNote;
  }

  // ============================================================================
  // ADVANCED EFFECTS & ARTICULATIONS
  // ============================================================================

  /**
   * Apply staccato articulation - shorten note durations.
   *
   * Creates detached, separated notes by reducing duration while maintaining spacing.
   * The gap between notes creates a crisp, articulated feel.
   *
   * @param factor - Duration multiplier (0-1). Default 0.5 (50% duration)
   * @returns New Pattern with shortened note durations
   *
   * @example
   * ```typescript
   * // Shorten notes to 50% of their original duration
   * const staccato = pattern().fromNotation('C4 E4 G4 C5').build().staccato();
   *
   * // Very short, percussive (25% duration)
   * const veryStaccato = pattern.staccato(0.25);
   * ```
   */
  staccato(factor: number = 0.5): Pattern {
    if (factor <= 0 || factor > 1) {
      throw new RangeError(`staccato factor must be between 0 and 1, got ${factor}`);
    }

    return this.map((event) => ({
      ...event,
      duration: Duration(event.duration * factor),
    }));
  }

  /**
   * Apply legato articulation - extend note durations to overlap.
   *
   * Creates smooth, connected notes by extending durations to reach or overlap
   * the next note. Produces a flowing, singing quality.
   *
   * @param overlap - Amount of overlap in beats. Default 0.1 (slight overlap)
   * @returns New Pattern with extended, overlapping note durations
   *
   * @example
   * ```typescript
   * // Smooth, connected notes
   * const legato = pattern().fromNotation('C4 E4 G4 C5').build().legato();
   *
   * // Strong overlap for very smooth transitions
   * const veryLegato = pattern.legato(0.2);
   * ```
   */
  legato(overlap: number = 0.1): Pattern {
    if (overlap < 0) {
      throw new RangeError(`legato overlap cannot be negative, got ${overlap}`);
    }

    const newEvents = this.events.map((event, i) => {
      // Find the next event's start time (as a number for calculation)
      let nextTime: number = this.duration;
      for (let j = i + 1; j < this.events.length; j++) {
        if (this.events[j].time > event.time) {
          nextTime = this.events[j].time;
          break;
        }
      }

      // Extend duration to reach next note plus overlap
      const newDuration = Duration(nextTime - event.time + overlap);

      return {
        ...event,
        duration: newDuration,
      };
    });

    return new Pattern(newEvents);
  }

  /**
   * Apply crescendo - gradual increase in velocity (volume).
   *
   * Creates a smooth ramp from quiet to loud across the pattern.
   * If no velocities specified, defaults from current range to maximum.
   *
   * @param fromVelocity - Starting velocity (default: pattern's minimum)
   * @param toVelocity - Ending velocity (default: 127)
   * @returns New Pattern with increasing velocities
   *
   * @example
   * ```typescript
   * // Gradual crescendo from pp to ff
   * const crescendo = pattern().fromNotation('C4 E4 G4 C5').build()
   *   .crescendo(Velocity(40), Velocity(110));
   *
   * // Natural crescendo from current velocities to maximum
   * const natural = pattern.crescendo();
   * ```
   */
  crescendo(fromVelocity?: Velocity, toVelocity: Velocity = Velocity(127)): Pattern {
    const noteEvents = this.events.filter(e => e.type === 'note' || e.type === 'chord');
    if (noteEvents.length === 0) return this;

    // Use pattern's minimum velocity if not specified
    const startVel = fromVelocity ??
      Velocity(Math.min(...noteEvents.map(e => e.velocity)));

    const velocityRange = toVelocity - startVel;

    // Track which note event we're processing
    let noteIndex = 0;

    return this.map((event) => {
      if (event.type === 'rest') return event;

      // Linear interpolation based on position among note/chord events
      const progress = noteEvents.length > 1 ? noteIndex / (noteEvents.length - 1) : 0;
      const newVelocity = Velocity(Math.round(startVel + velocityRange * progress));

      noteIndex++;

      return {
        ...event,
        velocity: newVelocity,
      };
    });
  }

  /**
   * Apply diminuendo (decrescendo) - gradual decrease in velocity (volume).
   *
   * Creates a smooth ramp from loud to quiet across the pattern.
   * If no velocities specified, defaults from maximum to current range.
   *
   * @param fromVelocity - Starting velocity (default: 127)
   * @param toVelocity - Ending velocity (default: pattern's minimum)
   * @returns New Pattern with decreasing velocities
   *
   * @example
   * ```typescript
   * // Gradual fade from ff to pp
   * const diminuendo = pattern().fromNotation('C4 E4 G4 C5').build()
   *   .diminuendo(Velocity(110), Velocity(40));
   *
   * // Natural fade to silence
   * const fade = pattern.diminuendo(Velocity(100), Velocity(20));
   * ```
   */
  diminuendo(fromVelocity: Velocity = Velocity(127), toVelocity?: Velocity): Pattern {
    const noteEvents = this.events.filter(e => e.type === 'note' || e.type === 'chord');
    if (noteEvents.length === 0) return this;

    // Use pattern's minimum velocity if not specified
    const endVel = toVelocity ??
      Velocity(Math.min(...noteEvents.map(e => e.velocity)));

    const velocityRange = fromVelocity - endVel;

    // Track which note event we're processing
    let noteIndex = 0;

    return this.map((event) => {
      if (event.type === 'rest') return event;

      // Linear interpolation based on position among note/chord events
      const progress = noteEvents.length > 1 ? noteIndex / (noteEvents.length - 1) : 0;
      const newVelocity = Velocity(Math.round(fromVelocity - velocityRange * progress));

      noteIndex++;

      return {
        ...event,
        velocity: newVelocity,
      };
    });
  }

  /**
   * Apply accent to specific beats or notes.
   *
   * Emphasizes selected notes by increasing their velocity.
   * Useful for creating rhythmic emphasis and syncopation.
   *
   * @param beats - Array of beat indices to accent, or predicate function
   * @param amount - Velocity increase (default: 20)
   * @returns New Pattern with accented notes
   *
   * @example
   * ```typescript
   * // Accent beats 1 and 3 (downbeats)
   * const accented = pattern().fromNotation('C4*8').build()
   *   .accent([0, 2]);
   *
   * // Accent every 4th note
   * const syncopated = pattern.accent((i) => i % 4 === 0);
   *
   * // Strong accents
   * const strong = pattern.accent([0, 4], 40);
   * ```
   */
  accent(
    beats: number[] | ((index: number) => boolean),
    amount: number = 20
  ): Pattern {
    const shouldAccent = Array.isArray(beats)
      ? (index: number) => beats.includes(index)
      : beats;

    return this.map((event, index) => {
      if (event.type === 'rest' || !shouldAccent(index)) {
        return event;
      }

      const newVelocity = Velocity(
        Math.min(127, event.velocity + amount)
      );

      return {
        ...event,
        velocity: newVelocity,
      };
    });
  }

  /**
   * Humanize timing and velocity - add natural performance variations.
   *
   * Introduces subtle randomness to timing and velocity to simulate
   * human performance. Makes mechanical patterns feel more organic.
   *
   * @param options - Humanization parameters
   * @param options.timing - Max timing deviation in beats (default: 0.02)
   * @param options.velocity - Max velocity deviation (default: 10)
   * @param options.seed - Random seed for reproducibility (optional)
   * @returns New Pattern with humanized timing and velocity
   *
   * @example
   * ```typescript
   * // Subtle humanization (default)
   * const human = pattern().fromNotation('C4*8').build().humanize();
   *
   * // More pronounced variations
   * const veryHuman = pattern.humanize({ timing: 0.05, velocity: 20 });
   *
   * // Reproducible randomness
   * const seeded = pattern.humanize({ seed: 12345 });
   * ```
   */
  humanize(options: {
    timing?: number;
    velocity?: number;
    seed?: number;
  } = {}): Pattern {
    const {
      timing = 0.02,    // ±0.02 beats (subtle)
      velocity = 10,    // ±10 velocity units
      seed,
    } = options;

    // Simple seeded random number generator (if seed provided)
    let randomState = seed ?? Math.random() * 2147483647;
    const random = (): number => {
      randomState = (randomState * 1103515245 + 12345) & 0x7fffffff;
      return randomState / 0x7fffffff;
    };

    const newEvents = this.events.map((event) => {
      if (event.type === 'rest') return event;

      // Random timing offset (centered around 0)
      const timingOffset = (random() - 0.5) * 2 * timing;
      const newTime = Seconds(Math.max(0, event.time + timingOffset));

      // Random velocity variation
      const velocityOffset = Math.round((random() - 0.5) * 2 * velocity);
      const newVelocity = Velocity(
        Math.max(1, Math.min(127, event.velocity + velocityOffset))
      );

      return {
        ...event,
        time: newTime,
        velocity: newVelocity,
      };
    });

    return new Pattern(newEvents);
  }

  /**
   * Apply swing timing - create a shuffle/swing rhythmic feel.
   *
   * Delays alternating notes to create a triplet-based groove.
   * Common in jazz, blues, and swing music.
   *
   * @param amount - Swing amount 0-1 (0=straight, 0.5=triplet swing, 1=extreme)
   * @param subdivision - Subdivision to swing (default: 2 = 8th notes)
   * @returns New Pattern with swing timing
   *
   * @example
   * ```typescript
   * // Classic jazz swing (triplet feel)
   * const swung = pattern().fromNotation('C4*8').build().swing(0.5);
   *
   * // Subtle shuffle
   * const shuffle = pattern.swing(0.3);
   *
   * // Extreme swing
   * const extreme = pattern.swing(0.8);
   *
   * // Swing 16th notes instead of 8ths
   * const sixteenthSwing = pattern.swing(0.5, 4);
   * ```
   */
  swing(amount: number = 0.5, subdivision: number = 2): Pattern {
    if (amount < 0 || amount > 1) {
      throw new RangeError(`swing amount must be between 0 and 1, got ${amount}`);
    }

    const beatDuration = 1 / subdivision;

    const newEvents = this.events.map((event, index) => {
      // Only swing alternating subdivisions (every other 8th note, etc.)
      const beatPosition = event.time / beatDuration;
      const isOffBeat = Math.round(beatPosition) % 2 === 1;

      if (!isOffBeat) {
        return event;
      }

      // Swing amount: 0.5 = triplet feel (2:1 ratio becomes 2.67:1.33)
      // Formula: delay = amount * beatDuration / 2
      const delay = amount * beatDuration / 2;
      const newTime = Seconds(event.time + delay);

      return {
        ...event,
        time: newTime,
      };
    });

    return new Pattern(newEvents);
  }

  /**
   * Apply tremolo - rapid repetition of notes.
   *
   * Repeats each note rapidly at a specified rate.
   * Creates a trembling, vibrating effect.
   *
   * @param rate - Repetitions per beat (e.g., 4 = 16th notes, 8 = 32nd notes)
   * @param beats - Duration in beats to repeat over (default: original note duration)
   * @returns New Pattern with tremolo repetitions
   *
   * @example
   * ```typescript
   * // 16th note tremolo
   * const tremolo = pattern().fromNotation('C4 E4 G4').build().tremolo(4);
   *
   * // Fast 32nd note tremolo
   * const fast = pattern.tremolo(8);
   *
   * // Tremolo for 2 beats regardless of original duration
   * const measured = pattern.tremolo(4, 2);
   * ```
   */
  tremolo(rate: number, beats?: number): Pattern {
    if (rate <= 0) {
      throw new RangeError(`tremolo rate must be positive, got ${rate}`);
    }

    const newEvents: Event[] = [];

    for (const event of this.events) {
      if (event.type === 'rest') {
        newEvents.push(event);
        continue;
      }

      // Duration to repeat over
      const repeatDuration = beats ?? event.duration;
      const noteDuration = Duration(1 / rate);
      const repetitions = Math.floor(repeatDuration * rate);

      // Create rapid repetitions
      for (let i = 0; i < repetitions; i++) {
        const newTime = Seconds(event.time + i * noteDuration);
        newEvents.push({
          ...event,
          time: newTime,
          duration: noteDuration,
        });
      }
    }

    return new Pattern(newEvents);
  }

  /**
   * Arpeggiate chords - break chords into melodic sequences.
   *
   * Converts chord events into sequences of individual notes.
   * Useful for creating arpeggiated accompaniment patterns.
   *
   * @param direction - Arpeggio direction ('up', 'down', 'updown', 'downup', 'random')
   * @returns New Pattern with arpeggiated chords
   *
   * @example
   * ```typescript
   * // Ascending arpeggio
   * const ascending = pattern().fromNotation('Cmaj7 Fmaj7').build()
   *   .arpeggiate('up');
   *
   * // Descending arpeggio
   * const descending = pattern.arpeggiate('down');
   *
   * // Up then down (like a harp)
   * const harp = pattern.arpeggiate('updown');
   *
   * // Random order (for generative patterns)
   * const random = pattern.arpeggiate('random');
   * ```
   */
  arpeggiate(
    direction: 'up' | 'down' | 'updown' | 'downup' | 'random' = 'up'
  ): Pattern {
    const newEvents: Event[] = [];

    for (const event of this.events) {
      // Pass through non-chord events
      if (event.type !== 'chord') {
        newEvents.push(event);
        continue;
      }

      const chordEvent = event as ChordEvent;
      let notes = [...chordEvent.notes];

      // Sort by pitch for ordered arpeggios
      if (direction !== 'random') {
        notes.sort((a, b) => a.pitch - b.pitch);
      }

      // Apply direction
      let arpNotes: Note[];
      switch (direction) {
        case 'down':
          arpNotes = notes.reverse();
          break;
        case 'updown':
          arpNotes = [...notes, ...notes.slice(0, -1).reverse()];
          break;
        case 'downup':
          arpNotes = [...notes.reverse(), ...notes.slice(1)];
          break;
        case 'random':
          arpNotes = notes.sort(() => Math.random() - 0.5);
          break;
        case 'up':
        default:
          arpNotes = notes;
      }

      // Create note events
      const noteDuration = Duration(chordEvent.duration / arpNotes.length);
      arpNotes.forEach((note, i) => {
        newEvents.push({
          type: 'note',
          time: Seconds(chordEvent.time + i * noteDuration),
          duration: noteDuration,
          velocity: chordEvent.velocity,
          pitch: note.pitch,
          note,
        } as Event);
      });
    }

    return new Pattern(newEvents);
  }

  /**
   * Apply delay/echo effect - create rhythmic repetitions with decay.
   *
   * Repeats the pattern with decreasing velocity to simulate echo.
   * Creates space and depth in the composition.
   *
   * @param time - Delay time in beats
   * @param feedback - Feedback amount 0-1 (how much the echo decays)
   * @param mix - Dry/wet mix 0-1 (default: 0.5)
   * @returns New Pattern with delay repetitions
   *
   * @example
   * ```typescript
   * // Quarter note delay with 50% feedback
   * const delayed = pattern().fromNotation('C4 E4 G4').build()
   *   .delay(Duration(1), 0.5);
   *
   * // Eighth note delay, quick decay
   * const slapback = pattern.delay(Duration(0.5), 0.3);
   *
   * // Long, spacey delay
   * const ambient = pattern.delay(Duration(2), 0.7, 0.7);
   * ```
   */
  delay(
    time: Duration,
    feedback: number,
    mix: number = 0.5
  ): Pattern {
    if (feedback < 0 || feedback > 1) {
      throw new RangeError(`delay feedback must be between 0 and 1, got ${feedback}`);
    }
    if (mix < 0 || mix > 1) {
      throw new RangeError(`delay mix must be between 0 and 1, got ${mix}`);
    }

    const delayedEvents: Event[] = [...this.events];
    const maxRepetitions = 10; // Prevent infinite loops

    // Generate delay taps
    for (let rep = 1; rep <= maxRepetitions; rep++) {
      const attenuation = Math.pow(feedback, rep);
      if (attenuation < 0.01) break; // Stop when echo becomes inaudible

      for (const event of this.events) {
        if (event.type === 'rest') continue;

        const delayedTime = Seconds(event.time + time * rep);
        const delayedVelocity = Velocity(
          Math.round(event.velocity * attenuation * mix)
        );

        delayedEvents.push({
          ...event,
          time: delayedTime,
          velocity: delayedVelocity,
        });
      }
    }

    return new Pattern(delayedEvents);
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
