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
   * Schedule a pattern to play.
   *
   * @param pattern - The pattern to schedule
   * @param startTime - When to start playing (in seconds from now)
   */
  schedule(pattern: Pattern, startTime: Seconds = Seconds(0)): void {
    if (!this.synth) {
      throw new Error('Scheduler has been disposed');
    }

    pattern.events.forEach(event => {
      const eventTime = startTime + event.time;

      if (event.type === 'note') {
        this.scheduleNoteEvent(event, eventTime);
      } else if (event.type === 'chord') {
        this.scheduleChordEvent(event, eventTime);
      }
      // Rests don't need scheduling - they're just gaps in time
    });
  }

  /**
   * Schedule a single note event.
   */
  private scheduleNoteEvent(event: NoteEvent, time: number): void {
    if (!this.synth) return;

    const id = Tone.Transport.schedule((audioTime) => {
      if (!this.synth) return;

      // Convert note to Tone.js format and trigger
      const noteName = event.note.name;
      const duration = event.duration;
      const velocity = event.velocity / 127; // Normalize to 0-1

      this.synth.triggerAttackRelease(noteName, duration, audioTime, velocity);
    }, time);

    this.scheduledEvents.push(id);
  }

  /**
   * Schedule a chord event (multiple simultaneous notes).
   */
  private scheduleChordEvent(event: ChordEvent, time: number): void {
    if (!this.synth) return;

    const id = Tone.Transport.schedule((audioTime) => {
      if (!this.synth) return;

      // Trigger all notes in the chord simultaneously
      const noteNames = event.notes.map(n => n.name);
      const duration = event.duration;
      const velocity = event.velocity / 127; // Normalize to 0-1

      this.synth.triggerAttackRelease(noteNames, duration, audioTime, velocity);
    }, time);

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
