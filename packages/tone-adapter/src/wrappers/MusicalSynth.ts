import * as Tone from 'tone';
import type { Note, Duration, NoteName } from '@contour/core';
import { Velocity } from '@contour/core';

/**
 * Musical wrapper around Tone.Synth.
 *
 * This is a Layer 2 wrapper that provides musical terminology
 * over Tone.js primitives. Users can still drop down to the
 * underlying Tone.Synth if they need fine control.
 */
export class MusicalSynth {
  private synth: Tone.Synth;

  constructor(synth?: Tone.Synth) {
    this.synth = synth ?? new Tone.Synth();
  }

  /**
   * Play a note with musical parameters.
   *
   * @param note - Note object or note name string
   * @param duration - Duration in seconds
   * @param velocity - Velocity (0-127)
   * @param time - When to play (AudioContext time)
   */
  playNote(
    note: Note | NoteName,
    duration: Duration,
    velocity: Velocity = Velocity(80),
    time?: number
  ): void {
    const noteName = typeof note === 'string' ? note : note.name;
    const normalizedVelocity = velocity / 127; // Convert to 0-1 range

    this.synth.triggerAttackRelease(noteName, duration, time, normalizedVelocity);
  }

  /**
   * Start a note (attack phase).
   */
  noteOn(note: Note | NoteName, velocity: Velocity = Velocity(80), time?: number): void {
    const noteName = typeof note === 'string' ? note : note.name;
    const normalizedVelocity = velocity / 127;

    this.synth.triggerAttack(noteName, time, normalizedVelocity);
  }

  /**
   * End a note (release phase).
   */
  noteOff(time?: number): void {
    this.synth.triggerRelease(time);
  }

  /**
   * Connect to a destination (Tone.js node or AudioNode).
   */
  connect(destination: Tone.ToneAudioNode | AudioNode): this {
    this.synth.connect(destination);
    return this;
  }

  /**
   * Connect to the main output.
   */
  toDestination(): this {
    this.synth.toDestination();
    return this;
  }

  /**
   * Set the volume in decibels.
   */
  setVolume(db: number): this {
    this.synth.volume.value = db;
    return this;
  }

  /**
   * Access the underlying Tone.Synth for advanced control.
   * This maintains the principle that users can drop down to
   * any layer when they need fine control.
   */
  get toneSynth(): Tone.Synth {
    return this.synth;
  }

  /**
   * Dispose of the synth and release resources.
   * CRITICAL: Always call this to prevent memory leaks!
   */
  dispose(): void {
    this.synth.dispose();
  }
}
