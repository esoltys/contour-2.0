import * as Tone from 'tone';
import type { Pattern, Event, NoteEvent, ChordEvent, RestEvent } from '@contour/core';
import { Seconds } from '@contour/core';
import type { InstrumentAdapter } from '../wrappers/InstrumentAdapter.js';
import { SynthAdapter } from '../wrappers/SynthAdapter.js';
import { getTransportDebugger } from '../debug/TransportDebugger.js';

/**
 * Schedules Pattern events to Tone.Transport.
 *
 * CRITICAL: Uses Tone.Transport.schedule() for sample-accurate timing.
 * NEVER use setTimeout or setInterval for audio scheduling!
 *
 * Now supports both Tone.js synths AND soundfont instruments via adapter pattern.
 */
export class PatternScheduler {
  private scheduledEvents: number[] = [];
  private instrument: InstrumentAdapter;
  private isDisposed = false;

  /**
   * Create a PatternScheduler with optional custom instrument.
   *
   * @param instrument - Optional InstrumentAdapter (defaults to AMSynth if not provided)
   */
  constructor(instrument?: InstrumentAdapter) {
    // Default to AMSynth for backward compatibility
    this.instrument = instrument || new SynthAdapter();
  }

  /**
   * Set a different instrument.
   * Useful for switching between synth and samples dynamically.
   *
   * NOTE: This does NOT dispose of the old instrument, as instruments may be
   * shared across multiple schedulers. The caller is responsible for
   * managing instrument lifecycle.
   *
   * @param instrument - The new instrument adapter to use
   */
  setInstrument(instrument: InstrumentAdapter): void {
    // Don't dispose old instrument - caller manages instrument lifecycle
    this.instrument = instrument;
  }

  /**
   * Schedule a pattern to play on repeat.
   *
   * @param pattern - The pattern to schedule
   * @param startTime - When to start playing (in seconds from now)
   */
  schedule(pattern: Pattern, startTime: Seconds = Seconds(0)): void {
    if (this.isDisposed) {
      throw new Error('Scheduler has been disposed');
    }

    if (!this.instrument) {
      throw new Error('No instrument configured');
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
    if (!this.instrument) return;

    const id = Tone.Transport.scheduleRepeat((audioTime) => {
      if (!this.instrument) return;

      const noteName = event.note.name;
      const duration = event.duration;
      const velocity = event.velocity;

      this.instrument.playNote(noteName, duration, audioTime, velocity);
    }, loopLength, startTime + event.time);

    this.scheduledEvents.push(id);

    // Track event in debugger with note name as description
    const debugger_ = getTransportDebugger();
    debugger_.trackScheduledEvent(startTime + event.time, event.note.name);
  }

  /**
   * Schedule a chord event to loop.
   */
  private scheduleChordEventLooping(event: ChordEvent, startTime: number, loopLength: number): void {
    if (!this.instrument) return;

    const id = Tone.Transport.scheduleRepeat((audioTime) => {
      if (!this.instrument) return;

      const noteNames = event.notes.map(n => n.name);
      const duration = event.duration;
      const velocity = event.velocity;

      this.instrument.playChord(noteNames, duration, audioTime, velocity);
    }, loopLength, startTime + event.time);

    this.scheduledEvents.push(id);

    // Track event in debugger with chord name as description
    const debugger_ = getTransportDebugger();
    const chordName = event.notes.map(n => n.name).join('+');
    debugger_.trackScheduledEvent(startTime + event.time, chordName);
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

    // Note: Don't clear TransportDebugger events here as multiple schedulers
    // share the same singleton debugger. Events will be cleaned up when
    // the debugger is explicitly reset or when new events are tracked.
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
   *
   * NOTE: This does NOT dispose of the instrument, as instruments may be
   * shared across multiple schedulers. The caller is responsible for
   * managing instrument lifecycle.
   *
   * CRITICAL: Always call this to prevent memory leaks!
   */
  dispose(): void {
    this.clear();

    // Don't dispose the instrument - it may be shared by other schedulers
    // The caller is responsible for managing instrument lifecycle

    this.isDisposed = true;
  }
}
