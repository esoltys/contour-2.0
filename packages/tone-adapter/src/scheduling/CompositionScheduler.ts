import * as Tone from 'tone';
import type { Composition, Track, Voice, Event, NoteEvent, ChordEvent } from '@contour/core';
import { Seconds } from '@contour/core';

/**
 * Instrument instance with its Tone.js synth.
 */
interface InstrumentInstance {
  name: string;
  synth: Tone.PolySynth;
}

/**
 * Schedules Composition events to Tone.Transport with multi-voice support.
 *
 * This scheduler can handle:
 * - Multiple tracks playing simultaneously
 * - Multiple voices within each track
 * - Different instruments for each voice
 * - Sample-accurate timing via Tone.Transport
 *
 * CRITICAL: Uses Tone.Transport.schedule() for sample-accurate timing.
 * NEVER use setTimeout or setInterval for audio scheduling!
 *
 * @example
 * ```typescript
 * const scheduler = new CompositionScheduler();
 * scheduler.scheduleComposition(composition);
 * await scheduler.start(); // Requires user gesture
 * ```
 */
export class CompositionScheduler {
  private scheduledEvents: number[] = [];
  private instruments = new Map<string, InstrumentInstance>();

  /**
   * Schedule a complete composition with all tracks and voices.
   *
   * @param composition - The composition to schedule
   * @param startTime - When to start playing (in seconds from now)
   */
  scheduleComposition(composition: Composition, startTime: Seconds = Seconds(0)): void {
    // Set the tempo
    Tone.Transport.bpm.value = composition.tempo;

    // Schedule each track
    for (const track of composition.tracks) {
      this.scheduleTrack(track, startTime);
    }
  }

  /**
   * Schedule a single track with all its voices.
   *
   * @param track - The track to schedule
   * @param startTime - When to start playing
   */
  scheduleTrack(track: Track, startTime: Seconds = Seconds(0)): void {
    // Schedule each voice in the track
    for (const voice of track.voices) {
      this.scheduleVoice(voice, startTime);
    }
  }

  /**
   * Schedule a single voice.
   * Each voice gets its own instrument instance if needed.
   *
   * @param voice - The voice to schedule
   * @param startTime - When to start playing
   */
  scheduleVoice(voice: Voice, startTime: Seconds = Seconds(0)): void {
    // Get or create instrument for this voice
    const synth = this.getOrCreateInstrument(voice.instrument);

    // Schedule each event in the voice's pattern
    voice.pattern.events.forEach(event => {
      const eventTime = Seconds(startTime + event.time);

      if (event.type === 'note') {
        this.scheduleNoteEvent(event, eventTime, synth);
      } else if (event.type === 'chord') {
        this.scheduleChordEvent(event, eventTime, synth);
      }
      // Rests don't need scheduling - they're just gaps in time
    });
  }

  /**
   * Get or create an instrument instance.
   * Reuses existing instruments to save resources.
   */
  private getOrCreateInstrument(instrumentName: string): Tone.PolySynth {
    let instance = this.instruments.get(instrumentName);

    if (!instance) {
      // Create new instrument
      const synth = new Tone.PolySynth(Tone.Synth).toDestination();

      instance = {
        name: instrumentName,
        synth,
      };

      this.instruments.set(instrumentName, instance);
    }

    return instance.synth;
  }

  /**
   * Schedule a single note event.
   */
  private scheduleNoteEvent(event: NoteEvent, time: number, synth: Tone.PolySynth): void {
    const id = Tone.Transport.schedule((audioTime) => {
      // Convert note to Tone.js format and trigger
      const noteName = event.note.name;
      const duration = event.duration;
      const velocity = event.velocity / 127; // Normalize to 0-1

      synth.triggerAttackRelease(noteName, duration, audioTime, velocity);
    }, time);

    this.scheduledEvents.push(id);
  }

  /**
   * Schedule a chord event (multiple simultaneous notes).
   */
  private scheduleChordEvent(event: ChordEvent, time: number, synth: Tone.PolySynth): void {
    const id = Tone.Transport.schedule((audioTime) => {
      // Trigger all notes in the chord simultaneously
      const noteNames = event.notes.map(n => n.name);
      const duration = event.duration;
      const velocity = event.velocity / 127; // Normalize to 0-1

      synth.triggerAttackRelease(noteNames, duration, audioTime, velocity);
    }, time);

    this.scheduledEvents.push(id);
  }

  /**
   * Clear all scheduled events.
   * Call this before scheduling a new composition or on hot-reload.
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
   *
   * @returns Promise that resolves when audio context is ready
   */
  async start(): Promise<void> {
    await Tone.start(); // Initialize audio context
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
   * This overrides the tempo from the composition.
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
   * Get the current state of the transport.
   */
  get state(): 'started' | 'stopped' | 'paused' {
    return Tone.Transport.state;
  }

  /**
   * Set volume for a specific instrument.
   *
   * @param instrumentName - Name of the instrument
   * @param db - Volume in decibels
   */
  setInstrumentVolume(instrumentName: string, db: number): void {
    const instance = this.instruments.get(instrumentName);
    if (instance) {
      instance.synth.volume.value = db;
    }
  }

  /**
   * Get all active instruments.
   */
  getInstruments(): string[] {
    return Array.from(this.instruments.keys());
  }

  /**
   * Dispose of all resources.
   * CRITICAL: Always call this to prevent memory leaks!
   */
  dispose(): void {
    this.clear();

    // Dispose all instruments
    for (const instance of this.instruments.values()) {
      instance.synth.dispose();
    }

    this.instruments.clear();
  }
}
