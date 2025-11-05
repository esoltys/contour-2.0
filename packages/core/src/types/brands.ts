/**
 * Branded types for type-safe musical units.
 *
 * These prevent mixing incompatible units at compile time.
 * Example: Can't add Hz to BPM.
 */

/**
 * Frequency in Hertz. Prevents mixing with other numeric types.
 */
export type Hz = number & { readonly __brand: 'Hz' };

/**
 * Tempo in beats per minute.
 */
export type BPM = number & { readonly __brand: 'BPM' };

/**
 * Time in seconds.
 */
export type Seconds = number & { readonly __brand: 'Seconds' };

/**
 * MIDI note number (0-127).
 */
export type MIDINote = number & { readonly __brand: 'MIDINote' };

/**
 * Musical velocity (0-127).
 */
export type Velocity = number & { readonly __brand: 'Velocity' };

/**
 * Musical duration as fraction of whole note.
 * 1 = whole, 0.5 = half, 0.25 = quarter, etc.
 */
export type Duration = number & { readonly __brand: 'Duration' };

/**
 * Musical interval in semitones.
 */
export type Interval = number & { readonly __brand: 'Interval' };

// Constructor functions with validation

export const Hz = (value: number): Hz => {
  if (value < 8 || value > 20000) {
    throw new RangeError(`Hz must be between 8 and 20000, got ${value}`);
  }
  return value as Hz;
};

export const BPM = (value: number): BPM => {
  if (value <= 0 || value > 999) {
    throw new RangeError(`BPM must be between 0 and 999, got ${value}`);
  }
  return value as BPM;
};

export const Seconds = (value: number): Seconds => {
  if (value < 0) {
    throw new RangeError(`Seconds cannot be negative, got ${value}`);
  }
  return value as Seconds;
};

export const MIDINote = (value: number): MIDINote => {
  if (!Number.isInteger(value) || value < 0 || value > 127) {
    throw new RangeError(`MIDI note must be integer 0-127, got ${value}`);
  }
  return value as MIDINote;
};

export const Velocity = (value: number): Velocity => {
  if (!Number.isInteger(value) || value < 0 || value > 127) {
    throw new RangeError(`Velocity must be integer 0-127, got ${value}`);
  }
  return value as Velocity;
};

export const Duration = (value: number): Duration => {
  if (value <= 0) {
    throw new RangeError(`Duration must be positive, got ${value}`);
  }
  return value as Duration;
};

export const Interval = (semitones: number): Interval => {
  return semitones as Interval;
};
