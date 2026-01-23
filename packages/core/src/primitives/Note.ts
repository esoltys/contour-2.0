import { MIDINote, Hz, Interval } from '../types/brands';
import type { NoteName, Octave, NoteLetter, Accidental } from '../types/music';

// Performance: cache these mappings
const letterToPitch: Record<NoteLetter, number> = {
  C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11,
};

const sharpToFlat: Record<string, { letter: NoteLetter; octave: number }> = {
  'C#': { letter: 'D', octave: 0 },
  'D#': { letter: 'E', octave: 0 },
  'F#': { letter: 'G', octave: 0 },
  'G#': { letter: 'A', octave: 0 },
  'A#': { letter: 'B', octave: 0 },
};

const flatToSharp: Record<string, { letter: NoteLetter; octave: number }> = {
  'Db': { letter: 'C', octave: 0 },
  'Eb': { letter: 'D', octave: 0 },
  'Gb': { letter: 'F', octave: 0 },
  'Ab': { letter: 'G', octave: 0 },
  'Bb': { letter: 'A', octave: 0 },
};

const midiNoteNames: NoteLetter[] = ['C', 'C', 'D', 'D', 'E', 'F', 'F', 'G', 'G', 'A', 'A', 'B'];
const midiAccidentals: Accidental[] = ['', '#', '', '#', '', '', '#', '', '#', '', '#', ''];
const midiNoteNamesWithAccidentals = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const noteNameToMidiMap: { [key: string]: number } = {
  'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
  'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
  'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
};

/**
 * Immutable representation of a musical note.
 */
export class Note {
  readonly pitch: MIDINote;
  readonly name: NoteName;
  readonly frequency: Hz;

  constructor(name: NoteName) {
    this.name = name;
    this.pitch = this.noteToPitch(name);
    this.frequency = this.pitchToFrequency(this.pitch);
  }

  /**
   * Transpose by semitones (returns new Note).
   */
  transpose(semitones: number): Note {
    const newPitch = MIDINote(this.pitch + semitones);
    return Note.fromMIDI(newPitch);
  }

  /**
   * Get enharmonic equivalent (e.g., C# <-> Db).
   * Returns the alternate spelling of the same pitch.
   * - Sharp notes become flat (C# -> Db)
   * - Flat notes become sharp (Db -> C#)
   * - Natural notes return themselves (no alternate spelling)
   */
  enharmonic(): Note {
    const match = this.name.match(/^([A-G])([#b]?)(-?\d+)$/);
    if (!match) return this;

    const [, letter, accidental, octaveStr] = match;
    const octave = parseInt(octaveStr, 10);
    const noteWithAccidental = `${letter}${accidental}`;

    if (accidental === '#' && sharpToFlat[noteWithAccidental]) {
      const enharmonic = sharpToFlat[noteWithAccidental];
      const newOctave = octave + enharmonic.octave;
      return new Note(`${enharmonic.letter}b${newOctave}` as NoteName);
    }

    if (accidental === 'b' && flatToSharp[noteWithAccidental]) {
      const enharmonic = flatToSharp[noteWithAccidental];
      const newOctave = octave + enharmonic.octave;
      return new Note(`${enharmonic.letter}#${newOctave}` as NoteName);
    }

    // Natural notes - no enharmonic equivalent (could return E#/Fb for F/E, but that's rare)
    return this;
  }

  /**
   * Interval from this note to another.
   */
  intervalTo(other: Note): Interval {
    return Interval(other.pitch - this.pitch);
  }

  /**
   * Create Note from MIDI number.
   */
  static fromMIDI(pitch: MIDINote): Note {
    const octave = Math.floor(pitch / 12) - 1;
    const noteIndex = pitch % 12;

    const name = `${midiNoteNames[noteIndex]}${midiAccidentals[noteIndex]}${octave}` as NoteName;
    return new Note(name);
  }

  /**
   * Create Note from frequency.
   */
  static fromFrequency(freq: Hz): Note {
    // Convert frequency to MIDI note number using 12-TET formula
    // A4 = 440 Hz = MIDI 69
    // pitch = 69 + 12 * log2(freq / 440)
    const pitch = Math.round(69 + 12 * Math.log2(freq / 440));
    return Note.fromMIDI(MIDINote(pitch));
  }

  /**
   * Convert MIDI pitch number to note name string.
   * This is a utility function for display purposes.
   *
   * @param midi - MIDI note number (0-127)
   * @returns Note name string (e.g., "C4", "F#3", "Bb5")
   *
   * @example
   * ```typescript
   * Note.midiToNoteName(60);  // "C4"
   * Note.midiToNoteName(69);  // "A4"
   * Note.midiToNoteName(61);  // "C#4"
   * ```
   */
  static midiToNoteName(midi: number): string {
    const octave = Math.floor(midi / 12) - 1;
    const noteName = midiNoteNamesWithAccidentals[midi % 12];
    return `${noteName}${octave}`;
  }

  /**
   * Convert note name string to MIDI pitch number.
   * This is a utility function for parsing note names.
   *
   * @param name - Note name string (e.g., "C4", "F#3", "Db5")
   * @returns MIDI note number
   *
   * @example
   * ```typescript
   * Note.noteNameToMidi("C4");  // 60
   * Note.noteNameToMidi("A4");  // 69
   * Note.noteNameToMidi("C#4"); // 61
   * ```
   */
  static noteNameToMidi(name: string): number {
    const match = name.match(/^([A-G][#b]?)(-?\d+)$/);
    if (!match) return 60; // Default to C4

    const noteName = match[1];
    const octave = parseInt(match[2]);

    return (octave + 1) * 12 + (noteNameToMidiMap[noteName] || 0);
  }

  private noteToPitch(name: NoteName): MIDINote {
    // Parse note name to MIDI number
    // C4 = 60, A4 = 69, etc.
    // Support negative octaves for MIDI notes 0-11 (C-1 to B-1)
    const match = name.match(/^([A-G])([#b]?)(-?\d+)$/);
    if (!match) {
      throw new Error(`Invalid note name: ${name}`);
    }

    const [, letter, accidental, octaveStr] = match;
    const octave = parseInt(octaveStr, 10);

    let pitch = letterToPitch[letter as NoteLetter] + (octave + 1) * 12;

    if (accidental === '#') pitch += 1;
    if (accidental === 'b') pitch -= 1;

    return MIDINote(pitch);
  }

  private pitchToFrequency(pitch: MIDINote): Hz {
    // A4 (MIDI 69) = 440 Hz
    // 12-TET: freq = 440 * 2^((pitch - 69) / 12)
    const freq = 440 * Math.pow(2, (pitch - 69) / 12);
    return Hz(freq);
  }
}

/**
 * Convenience functions for common notes.
 * Default octave is 4 (middle octave).
 */
export const C = (octave: Octave = '4') => new Note(`C${octave}` as NoteName);
export const Cs = (octave: Octave = '4') => new Note(`C#${octave}` as NoteName);
export const Db = (octave: Octave = '4') => new Note(`Db${octave}` as NoteName);
export const D = (octave: Octave = '4') => new Note(`D${octave}` as NoteName);
export const Ds = (octave: Octave = '4') => new Note(`D#${octave}` as NoteName);
export const Eb = (octave: Octave = '4') => new Note(`Eb${octave}` as NoteName);
export const E = (octave: Octave = '4') => new Note(`E${octave}` as NoteName);
export const F = (octave: Octave = '4') => new Note(`F${octave}` as NoteName);
export const Fs = (octave: Octave = '4') => new Note(`F#${octave}` as NoteName);
export const Gb = (octave: Octave = '4') => new Note(`Gb${octave}` as NoteName);
export const G = (octave: Octave = '4') => new Note(`G${octave}` as NoteName);
export const Gs = (octave: Octave = '4') => new Note(`G#${octave}` as NoteName);
export const Ab = (octave: Octave = '4') => new Note(`Ab${octave}` as NoteName);
export const A = (octave: Octave = '4') => new Note(`A${octave}` as NoteName);
export const As = (octave: Octave = '4') => new Note(`A#${octave}` as NoteName);
export const Bb = (octave: Octave = '4') => new Note(`Bb${octave}` as NoteName);
export const B = (octave: Octave = '4') => new Note(`B${octave}` as NoteName);
