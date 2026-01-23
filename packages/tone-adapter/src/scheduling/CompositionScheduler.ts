import * as Tone from 'tone';
import type { Composition, Track, Voice, Event, NoteEvent, ChordEvent } from '@contour/core';
import { Seconds } from '@contour/core';
import { SampleLibraryManager } from '../samples/SampleLibraryManager.js';
import { MusicalSampler } from '../wrappers/MusicalSampler.js';
import { isQualifiedName } from '../samples/types.js';

/**
 * Instrument instance - can be either a Tone.js synth or a sampled instrument.
 */
interface InstrumentInstance {
  name: string;
  instrument: Tone.PolySynth | MusicalSampler;
  type: 'synth' | 'sampler';
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
  private instrumentLoaders = new Map<string, Promise<InstrumentInstance>>();
  private sampleLibraryManager: SampleLibraryManager | null = null;

  /**
   * Schedule a complete composition with all tracks and voices.
   *
   * @param composition - The composition to schedule
   * @param startTime - When to start playing (in seconds from now)
   * @returns Promise that resolves when all instruments are loaded and scheduled
   */
  async scheduleComposition(composition: Composition, startTime: Seconds = Seconds(0)): Promise<void> {
    // Set the tempo
    Tone.Transport.bpm.value = composition.tempo;

    // Schedule each track (await to ensure instruments are loaded)
    await Promise.all(
      composition.tracks.map(track => this.scheduleTrack(track, startTime))
    );
  }

  /**
   * Schedule a single track with all its voices.
   *
   * @param track - The track to schedule
   * @param startTime - When to start playing
   * @returns Promise that resolves when all voices are scheduled
   */
  async scheduleTrack(track: Track, startTime: Seconds = Seconds(0)): Promise<void> {
    // Schedule each voice in the track (await to ensure instruments are loaded)
    await Promise.all(
      track.voices.map(voice => this.scheduleVoice(voice, startTime))
    );
  }

  /**
   * Schedule a single voice.
   * Each voice gets its own instrument instance if needed.
   *
   * @param voice - The voice to schedule
   * @param startTime - When to start playing
   * @returns Promise that resolves when voice is scheduled
   */
  async scheduleVoice(voice: Voice, startTime: Seconds = Seconds(0)): Promise<void> {
    // Get or create instrument for this voice (await since loading samples is async)
    const instrument = await this.getOrCreateInstrument(voice.instrument);

    // Schedule each event in the voice's pattern
    voice.pattern.events.forEach(event => {
      const eventTime = Seconds(startTime + event.time);

      if (event.type === 'note') {
        this.scheduleNoteEvent(event, eventTime, instrument);
      } else if (event.type === 'chord') {
        this.scheduleChordEvent(event, eventTime, instrument);
      }
      // Rests don't need scheduling - they're just gaps in time
    });
  }

  /**
   * Set the sample library manager.
   * Must be called before scheduling compositions with sampled instruments.
   *
   * @param manager - The sample library manager instance
   *
   * @example
   * ```typescript
   * const manager = new SampleLibraryManager();
   * await manager.initialize(Tone.getContext().rawContext);
   *
   * scheduler.setSampleLibraryManager(manager);
   * ```
   */
  setSampleLibraryManager(manager: SampleLibraryManager): void {
    this.sampleLibraryManager = manager;
  }

  /**
   * Get or create an instrument instance.
   * Reuses existing instruments to save resources.
   *
   * Supports both Tone.js synths and sampled instruments:
   * - Simple names (e.g., 'synth', 'piano') → Tone.js PolySynth
   * - Qualified names (e.g., 'MusyngKite:acoustic_grand_piano') → Sampled instrument
   *
   * @param instrumentName - Simple or qualified instrument name
   * @returns Promise resolving to the instrument (Tone.PolySynth or MusicalSampler)
   */
  private async getOrCreateInstrument(
    instrumentName: string
  ): Promise<Tone.PolySynth | MusicalSampler> {
    // Fast path: already loaded
    const existing = this.instruments.get(instrumentName);
    if (existing) {
      return existing.instrument;
    }

    // Check if already being loaded
    let loader = this.instrumentLoaders.get(instrumentName);
    if (!loader) {
      // Create new loader
      loader = this.createInstrumentInstance(instrumentName);
      this.instrumentLoaders.set(instrumentName, loader);
    }

    try {
      const instance = await loader;
      // Make sure we didn't double-set
      if (!this.instruments.has(instrumentName)) {
        this.instruments.set(instrumentName, instance);
      }
      return instance.instrument;
    } finally {
      this.instrumentLoaders.delete(instrumentName);
    }
  }

  /**
   * Helper to create an instrument instance.
   */
  private async createInstrumentInstance(instrumentName: string): Promise<InstrumentInstance> {
    // Check if it's a qualified sample library reference (contains ':')
    if (isQualifiedName(instrumentName)) {
      // Sampled instrument: 'LibraryName:InstrumentName'
      if (!this.sampleLibraryManager) {
        throw new Error(
          `Sample library manager not configured. ` +
          `Call setSampleLibraryManager() before using sampled instruments like '${instrumentName}'.`
        );
      }

      console.log(`[CompositionScheduler] Loading sampled instrument: ${instrumentName}`);

      // Load instrument via SampleLibraryManager
      const sfInstrument = await this.sampleLibraryManager.getInstrumentByQualifiedName(
        instrumentName as any
      );

      // Wrap in MusicalSampler for Tone.js integration
      const sampler = new MusicalSampler(sfInstrument);
      sampler.toDestination();

      return {
        name: instrumentName,
        instrument: sampler,
        type: 'sampler',
      };
    } else {
      // Default Tone.js synth
      console.log(`[CompositionScheduler] Creating Tone.js synth: ${instrumentName}`);

      const synth = new Tone.PolySynth(Tone.Synth).toDestination();

      return {
        name: instrumentName,
        instrument: synth,
        type: 'synth',
      };
    }
  }

  /**
   * Schedule a single note event.
   * Works with both Tone.js synths and MusicalSampler instruments.
   */
  private scheduleNoteEvent(
    event: NoteEvent,
    time: number,
    instrument: Tone.PolySynth | MusicalSampler
  ): void {
    const id = Tone.Transport.schedule((audioTime) => {
      // Convert note to format and trigger
      const noteName = event.note.name;
      const duration = event.duration;
      const velocity = event.velocity / 127; // Normalize to 0-1

      instrument.triggerAttackRelease(noteName, duration, audioTime, velocity);
    }, time);

    this.scheduledEvents.push(id);
  }

  /**
   * Schedule a chord event (multiple simultaneous notes).
   * Works with both Tone.js synths and MusicalSampler instruments.
   */
  private scheduleChordEvent(
    event: ChordEvent,
    time: number,
    instrument: Tone.PolySynth | MusicalSampler
  ): void {
    const id = Tone.Transport.schedule((audioTime) => {
      // Trigger all notes in the chord simultaneously
      const noteNames = event.notes.map(n => n.name);
      const duration = event.duration;
      const velocity = event.velocity / 127; // Normalize to 0-1

      // Check if instrument supports chord playback
      if (instrument instanceof MusicalSampler) {
        // MusicalSampler has a dedicated chord method
        instrument.triggerAttackReleaseChord(noteNames, duration, audioTime, velocity);
      } else {
        // Tone.PolySynth supports array of notes directly
        instrument.triggerAttackRelease(noteNames, duration, audioTime, velocity);
      }
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
      instance.instrument.volume.value = db;
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

    // Dispose all instruments (both synths and samplers)
    for (const instance of this.instruments.values()) {
      instance.instrument.dispose();
    }

    this.instruments.clear();
  }
}
