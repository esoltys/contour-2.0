import * as Tone from 'tone';
import type { InstrumentAdapter } from './InstrumentAdapter.js';

/**
 * Adapter for Tone.js PolySynth.
 * Wraps a Tone.PolySynth to match the InstrumentAdapter interface.
 */
export class SynthAdapter implements InstrumentAdapter {
  private synth: Tone.PolySynth;

  /**
   * Create a SynthAdapter.
   *
   * @param synth - Optional Tone.PolySynth (creates AMSynth by default)
   */
  constructor(synth?: Tone.PolySynth) {
    this.synth = synth || new Tone.PolySynth(Tone.AMSynth, {
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.2, sustain: 0.3, release: 0.8 }
    }).toDestination();
  }

  playNote(note: string, duration: number, time: number, velocity: number): void {
    // Normalize velocity from MIDI (0-127) to Tone.js (0-1)
    const normalizedVelocity = velocity / 127;
    this.synth.triggerAttackRelease(note, duration, time, normalizedVelocity);
  }

  playChord(notes: string[], duration: number, time: number, velocity: number): void {
    // Normalize velocity from MIDI (0-127) to Tone.js (0-1)
    const normalizedVelocity = velocity / 127;
    this.synth.triggerAttackRelease(notes, duration, time, normalizedVelocity);
  }

  dispose(): void {
    this.synth.dispose();
  }

  getInstrument(): Tone.PolySynth {
    return this.synth;
  }
}
