/**
 * Common interface for all playable instruments.
 * Provides a unified API for PatternScheduler regardless of underlying technology.
 *
 * This abstraction allows seamless switching between Tone.js synths and
 * soundfont-player instruments without changing scheduler code.
 */
export interface InstrumentAdapter {
  /**
   * Play a single note at a specific time.
   *
   * @param note - Note name (e.g., 'C4', 'F#5')
   * @param duration - Note duration in seconds
   * @param time - AudioContext time when to play
   * @param velocity - MIDI velocity (0-127)
   */
  playNote(
    note: string,
    duration: number,
    time: number,
    velocity: number
  ): void;

  /**
   * Play multiple notes simultaneously (chord).
   *
   * @param notes - Array of note names
   * @param duration - Chord duration in seconds
   * @param time - AudioContext time when to play
   * @param velocity - MIDI velocity (0-127)
   */
  playChord(
    notes: string[],
    duration: number,
    time: number,
    velocity: number
  ): void;

  /**
   * Dispose of resources.
   * Should be called when instrument is no longer needed.
   */
  dispose(): void;

  /**
   * Get the underlying instrument for advanced use.
   * Type depends on implementation (Tone.PolySynth, soundfont instrument, etc.)
   */
  getInstrument(): unknown;
}
