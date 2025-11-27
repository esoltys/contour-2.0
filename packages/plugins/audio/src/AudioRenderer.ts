/**
 * Audio Renderer Plugin
 *
 * Renders compositions to audio files (WAV format) using Tone.Offline.
 * Uses offline rendering for faster-than-real-time export.
 *
 * CRITICAL: This uses Tone.Offline, NOT real-time playback!
 */

import * as Tone from 'tone';
import type {
  RendererPlugin,
  RenderResult,
  Composition,
  Seconds,
} from '@contour/core';
import audioBufferToWav from 'audiobuffer-to-wav';

/**
 * Progress callback for audio rendering.
 */
export type RenderProgressCallback = (progress: number, stage: string) => void;

/**
 * Configuration for audio rendering.
 */
export interface AudioRendererConfig {
  /** Sample rate in Hz (e.g., 44100, 48000) */
  sampleRate: number;

  /** Bit depth (16, 24, or 32) */
  bitDepth: 16 | 24 | 32;

  /** Output format (currently only WAV supported) */
  format: 'wav';

  /** Master volume in decibels (default: 0) */
  masterVolume?: number;

  /** Progress callback for tracking render progress */
  onProgress?: RenderProgressCallback;
}

/**
 * Default configuration for audio rendering.
 */
const DEFAULT_CONFIG: AudioRendererConfig = {
  sampleRate: 44100,
  bitDepth: 16,
  format: 'wav',
  masterVolume: 0,
};

/**
 * Audio renderer plugin for offline audio export.
 *
 * This plugin renders compositions to WAV files using Tone.Offline,
 * which renders faster than real-time and produces consistent output.
 *
 * @example
 * ```typescript
 * const renderer = new AudioRenderer();
 * await renderer.initialize({ sampleRate: 48000, bitDepth: 24, format: 'wav' });
 * const result = await renderer.render(composition);
 * // result.data is a Buffer containing WAV file data
 * ```
 */
export class AudioRenderer implements RendererPlugin<AudioRendererConfig> {
  readonly name = 'audio';
  readonly version = '1.0.0';
  readonly dependencies = undefined;

  private config: AudioRendererConfig = DEFAULT_CONFIG;

  /**
   * Initialize the audio renderer with configuration.
   */
  async initialize(config: Partial<AudioRendererConfig>): Promise<void> {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

    // Validate config
    if (this.config.sampleRate <= 0) {
      throw new Error('Sample rate must be positive');
    }

    if (![16, 24, 32].includes(this.config.bitDepth)) {
      throw new Error('Bit depth must be 16, 24, or 32');
    }

    if (this.config.format !== 'wav') {
      throw new Error('Only WAV format is currently supported');
    }
  }

  /**
   * Render a composition to audio buffer.
   *
   * Uses Tone.Offline for sample-accurate, faster-than-real-time rendering.
   */
  async render(composition: Composition): Promise<RenderResult> {
    const duration = composition.duration;
    const onProgress = this.config.onProgress;

    // Add small buffer to ensure all notes finish
    const renderDuration = duration + 1;

    onProgress?.(0, 'Scheduling events...');

    // Count total events for progress tracking
    let totalEvents = 0;
    for (const track of composition.tracks) {
      for (const voice of track.voices) {
        totalEvents += voice.pattern.events.length;
      }
    }

    let processedEvents = 0;

    // Use Tone.Offline to render offline
    const buffer = await Tone.Offline(
      (context) => {
        // Set the tempo
        context.transport.bpm.value = composition.tempo;

        // Create instruments for each voice
        const instruments = new Map<string, Tone.PolySynth>();

        // Get or create instrument
        const getOrCreateInstrument = (name: string): Tone.PolySynth => {
          let synth = instruments.get(name);
          if (!synth) {
            synth = new Tone.PolySynth(Tone.Synth).toDestination();
            // Apply master volume if configured
            if (this.config.masterVolume !== undefined) {
              synth.volume.value = this.config.masterVolume;
            }
            instruments.set(name, synth);
          }
          return synth;
        };

        // Schedule all tracks and voices
        for (const track of composition.tracks) {
          for (const voice of track.voices) {
            const synth = getOrCreateInstrument(voice.instrument);

            // Schedule each event
            for (const event of voice.pattern.events) {
              if (event.type === 'note') {
                context.transport.schedule((time) => {
                  const noteName = event.note.name;
                  const eventDuration = event.duration;
                  const velocity = event.velocity / 127; // Normalize to 0-1

                  synth.triggerAttackRelease(noteName, eventDuration, time, velocity);
                }, event.time);
              } else if (event.type === 'chord') {
                context.transport.schedule((time) => {
                  const noteNames = event.notes.map((n) => n.name);
                  const eventDuration = event.duration;
                  const velocity = event.velocity / 127;

                  synth.triggerAttackRelease(noteNames, eventDuration, time, velocity);
                }, event.time);
              }
              // Rests don't need scheduling

              // Update progress during scheduling (0-10%)
              processedEvents++;
              if (onProgress && processedEvents % 100 === 0) {
                const scheduleProgress = (processedEvents / totalEvents) * 10;
                onProgress(scheduleProgress, 'Scheduling events...');
              }
            }
          }
        }

        onProgress?.(10, 'Rendering audio...');

        // Track render progress using transport position
        // Schedule progress updates at regular intervals through the composition
        const progressIntervalSec = Math.max(renderDuration / 50, 0.5); // ~50 updates or every 0.5s
        for (let t = progressIntervalSec; t < renderDuration; t += progressIntervalSec) {
          const progressTime = t;
          context.transport.schedule(() => {
            if (onProgress) {
              // Progress from 10% to 85% during render
              const renderProgress = (progressTime / renderDuration) * 75;
              onProgress(10 + renderProgress, 'Rendering audio...');
            }
          }, t);
        }

        // Start the transport
        context.transport.start(0);
      },
      renderDuration,
      1, // Number of channels: Hardcoded to mono for simplicity. Tone.js internally uses stereo processing, but we export as mono to reduce file size.
      this.config.sampleRate
    );

    onProgress?.(85, 'Encoding WAV...');

    // Convert AudioBuffer to WAV
    const wavData = this.encodeToWav(buffer);

    onProgress?.(100, 'Complete!');

    return {
      data: wavData,
      format: this.config.format,
      metadata: {
        duration,
        sampleRate: this.config.sampleRate,
        bitDepth: this.config.bitDepth,
        channels: buffer.numberOfChannels,
      },
    };
  }

  /**
   * Cleanup resources (no-op for offline rendering).
   */
  async shutdown(): Promise<void> {
    // No resources to clean up for offline rendering
  }

  /**
   * Convert AudioBuffer to WAV format.
   */
  private encodeToWav(buffer: Tone.ToneAudioBuffer): ArrayBuffer | Buffer {
    // Convert Tone.ToneAudioBuffer to standard AudioBuffer
    const audioBuffer = buffer.get() as AudioBuffer;

    // Use audiobuffer-to-wav library to encode
    const wavArrayBuffer = audioBufferToWav(audioBuffer);

    // Return ArrayBuffer in browser, Buffer in Node.js
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(wavArrayBuffer);
    }
    return wavArrayBuffer;
  }
}
