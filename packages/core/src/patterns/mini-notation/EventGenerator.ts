/**
 * Event generator for mini-notation parsed elements
 */

import { Note } from '../../primitives/Note.js';
import type { NoteName } from '../../types/music.js';
import { Durations } from '../../types/music.js';
import { Duration, Velocity, Seconds } from '../../types/brands.js';
import type { Event, NoteEvent, RestEvent, ChordEvent } from '../../primitives/Event.js';
import type { ScaleLike } from '../../types/interfaces.js';
import { parseChord } from '../chordParser.js';
import { ParsedElement, MiniNotationError } from './types.js';

/**
 * Context for event generation.
 */
export interface GenerationContext {
  defaultOctave: string;
  defaultDuration: Duration;
  defaultVelocity: Velocity;
  currentTime: Seconds;
  scale?: ScaleLike;
}

/**
 * Generate events from parsed elements.
 */
export class EventGenerator {
  private context: GenerationContext;

  constructor(options: Partial<GenerationContext> = {}) {
    this.context = {
      defaultOctave: options.defaultOctave ?? '4',
      defaultDuration: options.defaultDuration ?? Durations.quarter,
      defaultVelocity: options.defaultVelocity ?? Velocity(80),
      currentTime: options.currentTime ?? Seconds(0),
      scale: options.scale,
    };
  }

  generate(elements: ParsedElement[]): Event[] {
    const events: Event[] = [];

    for (const element of elements) {
      events.push(...this.generateFromElement(element));
    }

    return events;
  }

  private generateFromElement(element: ParsedElement): Event[] {
    const events: Event[] = [];
    const baseDuration = element.duration || this.context.defaultDuration;
    const duration = Duration(baseDuration * element.extend);

    // Generate repeated events
    for (let i = 0; i < element.repeat; i++) {
      if (element.type === 'note') {
        events.push(this.createNoteEvent(element.value!, duration));
      } else if (element.type === 'chord') {
        events.push(this.createChordEvent(element.value!, duration));
      } else if (element.type === 'rest') {
        events.push(this.createRestEvent(duration));
      } else if (element.type === 'degree') {
        events.push(this.createDegreeEvent(element.value!, duration));
      } else if (element.type === 'group') {
        // Subdivide group into available time
        const groupDuration = duration;
        const childDuration = Duration(groupDuration / element.children!.length);
        const savedTime = this.context.currentTime;

        for (const child of element.children!) {
          const childElement = { ...child, duration: child.duration || childDuration };
          events.push(...this.generateFromElement(childElement));
        }

        // Reset time to end of group
        this.context.currentTime = Seconds(savedTime + groupDuration);
        continue; // Don't advance time again below
      }

      this.context.currentTime = Seconds(this.context.currentTime + duration);
    }

    return events;
  }

  private createNoteEvent(noteStr: string, duration: Duration): NoteEvent {
    // Parse note with octave persistence
    const note = this.parseNoteWithOctave(noteStr);

    const event: NoteEvent = {
      type: 'note',
      time: this.context.currentTime,
      duration,
      velocity: this.context.defaultVelocity,
      pitch: note.pitch,
      note,
    };

    return event;
  }

  private createChordEvent(chordStr: string, duration: Duration): ChordEvent {
    // Parse chord symbol
    try {
      const chordData = parseChord(chordStr);
      if (!chordData.notes || chordData.notes.length === 0) {
        throw new Error(`Invalid chord: ${chordStr}`);
      }

      // Add default octave to notes
      const notes = chordData.notes.map((noteName: string) => {
        // If note doesn't have octave, add default
        if (!/\d$/.test(noteName)) {
          return new Note(`${noteName}${this.context.defaultOctave}` as NoteName);
        }
        return new Note(noteName as NoteName);
      });

      const event: ChordEvent = {
        type: 'chord',
        time: this.context.currentTime,
        duration,
        velocity: this.context.defaultVelocity,
        notes,
      };

      return event;
    } catch (error) {
      throw new MiniNotationError(`Failed to parse chord ${chordStr}: ${error}`, 0);
    }
  }

  private createRestEvent(duration: Duration): RestEvent {
    const event: RestEvent = {
      type: 'rest',
      time: this.context.currentTime,
      duration,
      velocity: Velocity(0),
    };

    return event;
  }

  private createDegreeEvent(degreeStr: string, duration: Duration): NoteEvent {
    if (!this.context.scale) {
      throw new MiniNotationError('Scale degree notation ($n) requires a scale context', 0);
    }

    // Parse degree number (1-indexed)
    const degree = parseInt(degreeStr);
    if (isNaN(degree) || degree < 1) {
      throw new MiniNotationError(`Invalid scale degree: ${degreeStr}`, 0);
    }

    // Get note from scale (cast to Note since we know ScaleLike.degree() returns a Note in practice)
    const noteLike = this.context.scale.degree(degree);
    const note = noteLike as Note;

    const event: NoteEvent = {
      type: 'note',
      time: this.context.currentTime,
      duration,
      velocity: this.context.defaultVelocity,
      pitch: note.pitch,
      note,
    };

    return event;
  }

  private parseNoteWithOctave(noteStr: string): Note {
    // Check if note has explicit octave
    if (/\d$/.test(noteStr)) {
      // Update default octave for octave persistence
      const octave = noteStr.match(/\d$/)![0];
      this.context.defaultOctave = octave;
      return new Note(noteStr as NoteName);
    } else {
      // Use default octave (octave persistence)
      const noteWithOctave = `${noteStr}${this.context.defaultOctave}` as NoteName;
      return new Note(noteWithOctave);
    }
  }
}
