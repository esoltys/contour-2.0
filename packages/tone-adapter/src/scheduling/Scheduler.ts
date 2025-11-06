import * as Tone from 'tone';
import type { Pattern, Event, NoteEvent, ChordEvent, RestEvent } from '@contour/core';
import { Seconds } from '@contour/core';

/**
 * Schedules Pattern events to Tone.Transport.
 *
 * CRITICAL: Uses Tone.Transport.schedule() for sample-accurate timing.
 * NEVER use setTimeout or setInterval for audio scheduling!
 */
export class PatternScheduler {
  private scheduledEvents: number[] = [];
  private synth: Tone.PolySynth | null = null;

  constructor() {
    // Create a polyphonic synth for playing multiple notes
    this.synth = new Tone.PolySynth(Tone.Synth).toDestination();
  }

  /**
   * Schedule a pattern to play on repeat.
   *
   * @param pattern - The pattern to schedule
   * @param startTime - When to start playing (in seconds from now)
   */
  schedule(pattern: Pattern, startTime: Seconds = Seconds(0)): void {
    if (!this.synth) {
      throw new Error('Scheduler has been disposed');
    }

    // Calculate pattern length (find the last event time + its duration)
    let patternLength = 0;
    pattern.events.forEach(event => {
      const eventEnd = event.time + event.duration;
      if (eventEnd > patternLength) {
        patternLength = eventEnd;
      }
    });

    // If pattern is empty or zero length, default to 1 measure (4 beats at 120 BPM = 2 seconds)
    if (patternLength === 0) {
      patternLength = 2;
    }

    console.log(`[Scheduler] Scheduling pattern with ${pattern.events.length} events, loop length: ${patternLength}s`);

    // Schedule pattern to loop indefinitely
    pattern.events.forEach(event => {
      if (event.type === 'note') {
        this.scheduleNoteEventLooping(event, startTime, patternLength);
      } else if (event.type === 'chord') {
        this.scheduleChordEventLooping(event, startTime, patternLength);
      }
      // Rests don't need scheduling - they're just gaps in time
    });
  }

  /**
   * Schedule a single note event to loop.
   */
  private scheduleNoteEventLooping(event: NoteEvent, startTime: number, loopLength: number): void {
    if (!this.synth) return;

    const id = Tone.Transport.scheduleRepeat((audioTime) => {
      if (!this.synth) return;

      // Convert note to Tone.js format and trigger
      const noteName = event.note.name;
      const duration = event.duration;
      const velocity = event.velocity / 127; // Normalize to 0-1

      this.synth.triggerAttackRelease(noteName, duration, audioTime, velocity);
    }, loopLength, startTime + event.time);

    this.scheduledEvents.push(id);
  }

  /**
   * Schedule a chord event to loop.
   */
  private scheduleChordEventLooping(event: ChordEvent, startTime: number, loopLength: number): void {
    if (!this.synth) return;

    const id = Tone.Transport.scheduleRepeat((audioTime) => {
      if (!this.synth) return;

      // Trigger all notes in the chord simultaneously
      const noteNames = event.notes.map(n => n.name);
      const duration = event.duration;
      const velocity = event.velocity / 127; // Normalize to 0-1

      this.synth.triggerAttackRelease(noteNames, duration, audioTime, velocity);
    }, loopLength, startTime + event.time);

    this.scheduledEvents.push(id);
  }

  /**
   * Clear all scheduled events.
   * Call this before scheduling a new pattern or on hot-reload.
   */
  clear(): void {
    this.scheduledEvents.forEach(id => {
      Tone.Transport.clear(id);
    });
    this.scheduledEvents = [];
  }

  /**
   * Start the Tone.Transport.
   * Note: Must be called after a user gesture due to browser autoplay policies.
   */
  start(): void {
    Tone.Transport.start();
  }

  /**
   * Stop the Tone.Transport.
   */
  stop(): void {
    Tone.Transport.stop();
  }

  /**
   * Pause the Tone.Transport.
   */
  pause(): void {
    Tone.Transport.pause();
  }

  /**
   * Set the tempo (BPM).
   */
  setTempo(bpm: number): void {
    Tone.Transport.bpm.value = bpm;
  }

  /**
   * Get current playback position in seconds.
   */
  get position(): number {
    return Tone.Transport.seconds;
  }

  /**
   * Dispose of all resources.
   * CRITICAL: Always call this to prevent memory leaks!
   */
  dispose(): void {
    this.clear();

    if (this.synth) {
      this.synth.dispose();
      this.synth = null;
    }
  }
}
