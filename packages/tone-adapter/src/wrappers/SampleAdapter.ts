import type { InstrumentAdapter } from './InstrumentAdapter.js';
import type { SoundfontInstrument } from '../samples/types.js';

/**
 * Adapter for soundfont-player instruments.
 * Wraps the soundfont-player API to match the InstrumentAdapter interface.
 */
export class SampleAdapter implements InstrumentAdapter {
  private instrument: SoundfontInstrument;
  private audioContext: AudioContext;

  /**
   * Create a SampleAdapter.
   *
   * @param instrument - soundfont-player instrument instance
   * @param audioContext - Web Audio API context
   */
  constructor(instrument: SoundfontInstrument, audioContext: AudioContext) {
    this.instrument = instrument;
    this.audioContext = audioContext;
  }

  playNote(note: string, duration: number, time: number, velocity: number): void {
    // Convert velocity from MIDI (0-127) to gain (0-1)
    const gain = velocity / 127;

    // soundfont-player API: play(note, time, options)
    this.instrument.play(note, time, { duration, gain });
  }

  playChord(notes: string[], duration: number, time: number, velocity: number): void {
    // Convert velocity from MIDI (0-127) to gain (0-1)
    const gain = velocity / 127;

    // Play each note in the chord simultaneously
    notes.forEach(note => {
      this.instrument.play(note, time, { duration, gain });
    });
  }

  dispose(): void {
    // soundfont-player instruments have a .stop() method
    if (this.instrument && typeof this.instrument.stop === 'function') {
      this.instrument.stop();
    }
  }

  getInstrument(): SoundfontInstrument {
    return this.instrument;
  }
}
