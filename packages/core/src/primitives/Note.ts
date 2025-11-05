import { MIDINote, Hz, Interval } from '../types/brands';
import type { NoteName, Octave, NoteLetter, Accidental } from '../types/music';

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
   * For now, returns the same note as enharmonic handling is complex.
   * TODO: Implement proper enharmonic respelling
   */
  enharmonic(): Note {
    // Simplified implementation - just return this note for now
    // Full implementation would require music theory context
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

    // Note names for each chromatic pitch (prefer sharps)
    const noteNames: NoteLetter[] = ['C', 'C', 'D', 'D', 'E', 'F', 'F', 'G', 'G', 'A', 'A', 'B'];
    const accidentals: Accidental[] = ['', '#', '', '#', '', '', '#', '', '#', '', '#', ''];

    const name = `${noteNames[noteIndex]}${accidentals[noteIndex]}${octave}` as NoteName;
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

    // Map letter to pitch class (C=0, D=2, E=4, F=5, G=7, A=9, B=11)
    const letterToPitch: Record<NoteLetter, number> = {
      C: 0,
      D: 2,
      E: 4,
      F: 5,
      G: 7,
      A: 9,
      B: 11,
    };

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
