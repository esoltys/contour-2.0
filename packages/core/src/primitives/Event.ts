// packages/core/src/primitives/Event.ts

import type { Seconds, Velocity, Duration, MIDINote } from '../types/brands.js';
import type { Note } from './Note.js';

/**
 * Musical event in time.
 */
export interface MusicalEvent {
  readonly time: Seconds;
  readonly duration: Duration;
  readonly velocity: Velocity;
}

/**
 * Note event (extends MusicalEvent).
 */
export interface NoteEvent extends MusicalEvent {
  readonly type: 'note';
  readonly pitch: MIDINote;
  readonly note: Note;
}

/**
 * Rest event.
 */
export interface RestEvent extends MusicalEvent {
  readonly type: 'rest';
}

/**
 * Chord event (multiple simultaneous notes).
 */
export interface ChordEvent extends MusicalEvent {
  readonly type: 'chord';
  readonly notes: Note[];
}

/**
 * Union type of all musical events.
 */
export type Event = NoteEvent | RestEvent | ChordEvent;
