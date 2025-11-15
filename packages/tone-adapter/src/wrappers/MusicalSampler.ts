/**
 * MusicalSampler - Tone.js-compatible wrapper for soundfont-player instruments.
 *
 * This wrapper bridges soundfont-player instruments with Tone.js, enabling:
 * - Tone.js effects chain (reverb, delay, filter, etc.)
 * - Routing to Tone.Transport
 * - Consistent API with Tone.PolySynth
 * - Proper disposal and memory management
 *
 * The key innovation is connecting soundfont-player's output AudioNode
 * to Tone.js's routing system, making samples work seamlessly with
 * the rest of Contour's architecture.
 */

import * as Tone from 'tone';
import type { SoundfontInstrument } from '../samples/types.js';

/**
 * MusicalSampler wraps a soundfont-player instrument with a Tone.js-compatible API.
 *
 * Instead of extending ToneAudioNode (which requires implementing input/output),
 * this wrapper contains Tone.js nodes internally and provides a compatible interface.
 *
 * @example
 * ```typescript
 * // Load instrument via SampleLibraryManager
 * const sfInstrument = await manager.getInstrument('acoustic_grand_piano');
 *
 * // Wrap in MusicalSampler
 * const sampler = new MusicalSampler(sfInstrument);
 *
 * // Use like any Tone.js instrument
 * sampler.toDestination();
 * sampler.connect(reverb);
 *
 * // Play notes
 * sampler.triggerAttackRelease('C4', 0.5, audioTime, 0.8);
 * ```
 */
export class MusicalSampler {
  readonly name = 'MusicalSampler';

  /**
   * The wrapped soundfont-player instrument.
   */
  private instrument: SoundfontInstrument;

  /**
   * Output gain node for volume control and routing.
   */
  private outputGain: Tone.Gain;

  /**
   * Volume control (Tone.js Param).
   */
  public volume: Tone.Param<'gain'>;

  /**
   * Create a MusicalSampler.
   *
   * @param instrument - Loaded soundfont-player instrument
   */
  constructor(instrument: SoundfontInstrument) {
    this.instrument = instrument;

    // Create output gain node for volume control and Tone.js routing
    this.outputGain = new Tone.Gain({ gain: 1 });

    // Expose volume parameter
    this.volume = this.outputGain.gain;

    // Connect soundfont-player output to Tone.js
    // soundfont-player instruments have an 'out' property that's a Web Audio GainNode
    if (instrument.out) {
      // Connect soundfont-player's output to our Tone.js gain node
      // This bridges the raw Web Audio API with Tone.js
      instrument.out.connect(this.outputGain.input);
    } else {
      console.warn('[MusicalSampler] soundfont-player instrument has no output node');
    }
  }

  /**
   * Play a note with attack and release.
   *
   * @param note - Note name (e.g., 'C4', 'F#3')
   * @param duration - Note duration in seconds
   * @param time - AudioContext time when to play (default: now)
   * @param velocity - Normalized velocity 0-1 (default: 0.8)
   */
  triggerAttackRelease(
    note: string,
    duration: number,
    time?: number,
    velocity: number = 0.8
  ): void {
    // Convert time - use AudioContext time, defaulting to now
    const when = time !== undefined ? time : Tone.getContext().currentTime;

    // soundfont-player uses gain (0-1) instead of velocity
    this.instrument.play(note, when, {
      duration,
      gain: velocity,
    });
  }

  /**
   * Play multiple notes simultaneously (chord).
   *
   * @param notes - Array of note names
   * @param duration - Chord duration in seconds
   * @param time - AudioContext time when to play
   * @param velocity - Normalized velocity 0-1
   */
  triggerAttackReleaseChord(
    notes: string[],
    duration: number,
    time?: number,
    velocity: number = 0.8
  ): void {
    const when = time !== undefined ? time : Tone.getContext().currentTime;

    // Trigger all notes simultaneously
    notes.forEach(note => {
      this.instrument.play(note, when, {
        duration,
        gain: velocity,
      });
    });
  }

  /**
   * Start a note (attack phase).
   * Note: soundfont-player doesn't separate attack/release,
   * so we use a long duration and rely on stop() for release.
   *
   * @param note - Note name
   * @param time - AudioContext time when to play
   * @param velocity - Normalized velocity 0-1
   */
  triggerAttack(note: string, time?: number, velocity: number = 0.8): void {
    const when = time !== undefined ? time : Tone.getContext().currentTime;

    // Use a very long duration - user must call stop() to release
    this.instrument.play(note, when, {
      duration: 10, // 10 seconds - long enough for most use cases
      gain: velocity,
    });
  }

  /**
   * Release a note.
   * Note: soundfont-player doesn't support individual note release,
   * so this stops ALL playing notes.
   *
   * @param time - When to release (ignored - immediate)
   */
  triggerRelease(time?: number): void {
    // soundfont-player doesn't support per-note release
    // This will stop all playing notes
    this.instrument.stop();
  }

  /**
   * Stop all playing notes immediately.
   */
  releaseAll(): void {
    this.instrument.stop();
  }

  /**
   * Set volume (gain value).
   *
   * @param gain - Volume as gain (0-1 typical, can go higher)
   * @param rampTime - Time to ramp to new value (default: 0)
   * @returns this for method chaining
   */
  setVolume(gain: number, rampTime: number = 0): this {
    if (rampTime > 0) {
      this.volume.rampTo(gain, rampTime);
    } else {
      this.volume.value = gain;
    }
    return this;
  }

  /**
   * Connect to Tone.js destination (speakers).
   *
   * @returns this for method chaining
   */
  toDestination(): this {
    this.outputGain.toDestination();
    return this;
  }

  /**
   * Connect to another Tone.js node.
   *
   * @param destination - Tone.js node to connect to
   * @returns this for method chaining
   */
  connect(destination: Tone.InputNode): this {
    this.outputGain.connect(destination);
    return this;
  }

  /**
   * Disconnect from all destinations.
   *
   * @returns this for method chaining
   */
  disconnect(): this {
    this.outputGain.disconnect();
    return this;
  }

  /**
   * Get the underlying soundfont-player instrument.
   * For advanced use cases that need direct access.
   */
  getSoundfontInstrument(): SoundfontInstrument {
    return this.instrument;
  }

  /**
   * Dispose of resources and clean up.
   * CRITICAL: Always call this to prevent memory leaks!
   */
  dispose(): void {
    // Stop all playing notes
    this.instrument.stop();

    // Disconnect and dispose Tone.js nodes
    this.outputGain.disconnect();
    this.outputGain.dispose();
  }
}
