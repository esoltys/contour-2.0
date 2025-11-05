/**
 * MIDI Renderer Plugin
 *
 * Renders compositions to Standard MIDI File (SMF) Format 1.
 * Multi-track compositions maintain track separation in the MIDI file.
 */

import type {
  RendererPlugin,
  RenderResult,
  Composition,
  Track,
  Voice,
  Event,
  NoteEvent,
  ChordEvent,
  Seconds,
} from '@contour/core';
// @ts-ignore - jsmidgen doesn't have types
import jsmidgen from 'jsmidgen';

/**
 * Configuration for MIDI rendering.
 */
export interface MIDIRendererConfig {
  /** MIDI format (0 or 1). Format 1 supports multiple tracks. */
  format?: 0 | 1;

  /** Ticks per quarter note (resolution) */
  ticksPerBeat?: number;
}

/**
 * Default configuration for MIDI rendering.
 */
const DEFAULT_CONFIG: Required<MIDIRendererConfig> = {
  format: 1, // Format 1 = multi-track
  ticksPerBeat: 480, // Standard resolution
};

/**
 * MIDI renderer plugin for Standard MIDI File export.
 *
 * This plugin renders compositions to SMF files that can be imported
 * into any DAW or notation software.
 *
 * @example
 * ```typescript
 * const renderer = new MIDIRenderer();
 * await renderer.initialize({ format: 1, ticksPerBeat: 480 });
 * const result = await renderer.render(composition);
 * // result.data is a Buffer containing MIDI file data
 * ```
 */
export class MIDIRenderer implements RendererPlugin<MIDIRendererConfig> {
  readonly name = 'midi';
  readonly version = '1.0.0';
  readonly dependencies = undefined;

  private config: Required<MIDIRendererConfig> = DEFAULT_CONFIG;

  /**
   * Initialize the MIDI renderer with configuration.
   */
  async initialize(config: MIDIRendererConfig = {}): Promise<void> {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    // Validate config
    if (this.config.format !== 0 && this.config.format !== 1) {
      throw new Error('MIDI format must be 0 or 1');
    }

    if (this.config.ticksPerBeat <= 0) {
      throw new Error('Ticks per beat must be positive');
    }
  }

  /**
   * Render a composition to MIDI file.
   *
   * Creates a Standard MIDI File (SMF) Format 1 with separate tracks
   * for each voice in the composition.
   */
  async render(composition: Composition): Promise<RenderResult> {
    // Create MIDI file
    const file = new jsmidgen.File();

    // For each track in the composition
    for (const track of composition.tracks) {
      // For each voice in the track, create a separate MIDI track
      for (const voice of track.voices) {
        const midiTrack = new jsmidgen.Track();

        // Set tempo on first track
        if (file.tracks.length === 0) {
          midiTrack.setTempo(composition.tempo);
        }

        // Add track name
        midiTrack.setInstrument(0, this.getInstrumentNumber(voice.instrument));

        // Convert pattern events to MIDI events
        this.addEventsToTrack(midiTrack, voice, composition.tempo);

        // Add track to file
        file.addTrack(midiTrack);
      }
    }

    // Generate MIDI file buffer
    const midiData = Buffer.from(file.toBytes());

    return {
      data: midiData,
      format: 'midi',
      metadata: {
        duration: composition.duration,
        format: this.config.format,
        ticksPerBeat: this.config.ticksPerBeat,
        trackCount: file.tracks.length,
        tempo: composition.tempo,
      },
    };
  }

  /**
   * Add pattern events to a MIDI track.
   */
  private addEventsToTrack(midiTrack: any, voice: Voice, tempo: number): void {
    const pattern = voice.pattern;

    // Convert events to MIDI
    for (const event of pattern.events) {
      if (event.type === 'note') {
        this.addNoteEvent(midiTrack, event, tempo);
      } else if (event.type === 'chord') {
        this.addChordEvent(midiTrack, event, tempo);
      }
      // Rests don't generate MIDI events
    }
  }

  /**
   * Add a note event to MIDI track.
   */
  private addNoteEvent(midiTrack: any, event: NoteEvent, tempo: number): void {
    const midiNote = event.pitch;
    const velocity = event.velocity;

    // Convert duration from fraction of whole note to ticks
    // Duration is stored as fraction of whole note (0.25 = quarter note)
    // Formula: duration (in whole notes) * 4 (quarter notes per whole) * ticksPerBeat
    const durationTicks = Math.round(event.duration * 4 * this.config.ticksPerBeat);

    // Convert time from seconds to ticks
    // Formula: time (seconds) * tempo (BPM) / 60 (seconds per minute) * ticksPerBeat
    const timeTicks = Math.round((event.time * tempo * this.config.ticksPerBeat) / 60);

    // Add note at the event's time
    // jsmidgen expects: channel, pitch, duration (in ticks), time (in ticks), velocity
    midiTrack.addNote(
      0, // channel
      midiNote,
      durationTicks,
      timeTicks,
      velocity
    );
  }

  /**
   * Add a chord event to MIDI track.
   */
  private addChordEvent(midiTrack: any, event: ChordEvent, tempo: number): void {
    // For chords, add each note separately at the same time
    const velocity = event.velocity;

    // Convert duration from fraction of whole note to ticks
    const durationTicks = Math.round(event.duration * 4 * this.config.ticksPerBeat);

    // Convert time from seconds to ticks
    const timeTicks = Math.round((event.time * tempo * this.config.ticksPerBeat) / 60);

    for (const note of event.notes) {
      midiTrack.addNote(
        0, // channel
        note.pitch,
        durationTicks,
        timeTicks,
        velocity
      );
    }
  }

  /**
   * Map instrument name to GM MIDI instrument number.
   * This is a basic mapping - could be extended.
   */
  private getInstrumentNumber(instrumentName: string): number {
    const instrumentMap: Record<string, number> = {
      'piano': 0,
      'harpsichord': 6,
      'synth': 80,
      'strings': 48,
      'brass': 56,
      'woodwind': 64,
      'bass': 32,
      'guitar': 24,
      'default': 0,
    };

    return instrumentMap[instrumentName.toLowerCase()] ?? instrumentMap['default'];
  }

  /**
   * Cleanup resources (no-op for MIDI rendering).
   */
  async shutdown(): Promise<void> {
    // No resources to clean up
  }
}
