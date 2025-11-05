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
    // Create MIDI file with configured ticks per beat
    const file = new jsmidgen.File({
      ticks: this.config.ticksPerBeat
    });

    // For each track in the composition
    for (const track of composition.tracks) {
      // For each voice in the track, create a separate MIDI track
      for (const voice of track.voices) {
        const midiTrack = new jsmidgen.Track();

        // Set tempo and key signature on first track
        if (file.tracks.length === 0) {
          midiTrack.setTempo(composition.tempo);
          // Set key signature: D minor (1 flat, minor mode)
          // Key signature format: sf = -1 (1 flat), mi = 1 (minor)
          midiTrack.setKeySignature(-1, 1);
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
    // toBytes() returns a string, but we need to convert it to raw bytes
    // using 'binary' encoding to avoid UTF-8 interpretation
    const midiData = Buffer.from(file.toBytes(), 'binary');

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

    // Collect all MIDI events (note on/off) with absolute times
    interface MidiNoteEvent {
      time: number;  // Absolute time in ticks
      type: 'on' | 'off';
      pitch: number;
      velocity: number;
    }

    const midiEvents: MidiNoteEvent[] = [];

    // Convert pattern events to MIDI note on/off events
    for (const event of pattern.events) {
      if (event.type === 'note') {
        const startTimeTicks = Math.round((event.time as number) * 4 * this.config.ticksPerBeat);
        const durationTicks = Math.round((event.duration as number) * 4 * this.config.ticksPerBeat);
        const endTimeTicks = startTimeTicks + durationTicks;

        midiEvents.push({
          time: startTimeTicks,
          type: 'on',
          pitch: event.pitch,
          velocity: event.velocity,
        });
        midiEvents.push({
          time: endTimeTicks,
          type: 'off',
          pitch: event.pitch,
          velocity: event.velocity,
        });
      } else if (event.type === 'chord') {
        const startTimeTicks = Math.round((event.time as number) * 4 * this.config.ticksPerBeat);
        const durationTicks = Math.round((event.duration as number) * 4 * this.config.ticksPerBeat);
        const endTimeTicks = startTimeTicks + durationTicks;

        for (const note of event.notes) {
          midiEvents.push({
            time: startTimeTicks,
            type: 'on',
            pitch: note.pitch,
            velocity: event.velocity,
          });
          midiEvents.push({
            time: endTimeTicks,
            type: 'off',
            pitch: note.pitch,
            velocity: event.velocity,
          });
        }
      }
      // Rests don't generate MIDI events
    }

    // Sort events by time
    midiEvents.sort((a, b) => a.time - b.time);

    // Convert absolute times to delta times and add to track
    let lastTime = 0;
    for (const event of midiEvents) {
      const deltaTime = event.time - lastTime;

      if (event.type === 'on') {
        midiTrack.addNoteOn(0, event.pitch, deltaTime, event.velocity);
      } else {
        midiTrack.addNoteOff(0, event.pitch, deltaTime, event.velocity);
      }

      lastTime = event.time;
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
