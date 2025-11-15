// packages/core/src/patterns/MiniNotation.ts

import { Note } from '../primitives/Note.js';
import type { NoteName } from '../types/music.js';
import { Durations } from '../types/music.js';
import { Duration, Velocity, Seconds } from '../types/brands.js';
import type { Event, NoteEvent, RestEvent, ChordEvent } from '../primitives/Event.js';
import { parseChord } from './chordParser.js';

/**
 * Token types for mini-notation lexer.
 */
enum TokenType {
  NOTE = 'NOTE',           // C4, Db3, etc.
  CHORD = 'CHORD',         // Cmaj7, Dm7, etc.
  REST = 'REST',           // ~ or _
  DEGREE = 'DEGREE',       // $1, $3, $5, etc. (scale degrees)
  REPEAT = 'REPEAT',       // *n
  EXTEND = 'EXTEND',       // @n
  DURATION = 'DURATION',   // /n or suffix like 'q', 'h'
  LBRACKET = 'LBRACKET',   // [
  RBRACKET = 'RBRACKET',   // ]
  WHITESPACE = 'WHITESPACE',
  EOF = 'EOF',
}

/**
 * Token from lexer.
 */
interface Token {
  type: TokenType;
  value: string;
  position: number;
}

/**
 * Parse error with position information.
 */
export class MiniNotationError extends Error {
  constructor(message: string, public position: number) {
    super(`${message} at position ${position}`);
    this.name = 'MiniNotationError';
  }
}

/**
 * Parsed element from mini-notation.
 */
interface ParsedElement {
  type: 'note' | 'chord' | 'rest' | 'group' | 'degree';
  value?: string;           // Note name, chord symbol, or degree number
  children?: ParsedElement[]; // For groups
  repeat: number;           // Repetition factor
  extend: number;           // Extension factor (duration multiplier)
  duration?: Duration;      // Explicit duration
}

/**
 * Lexer for mini-notation strings.
 */
class MiniNotationLexer {
  private position = 0;
  private current = 0;

  constructor(private input: string) {}

  /**
   * Tokenize the input string.
   */
  tokenize(): Token[] {
    const tokens: Token[] = [];

    while (this.current < this.input.length) {
      const char = this.input[this.current];
      const position = this.current;

      if (char === ' ' || char === '\t') {
        tokens.push({ type: TokenType.WHITESPACE, value: char, position });
        this.current++;
      } else if (char === '[') {
        tokens.push({ type: TokenType.LBRACKET, value: char, position });
        this.current++;
      } else if (char === ']') {
        tokens.push({ type: TokenType.RBRACKET, value: char, position });
        this.current++;
      } else if (char === '~' || char === '_') {
        tokens.push({ type: TokenType.REST, value: char, position });
        this.current++;
      } else if (char === '$') {
        // Scale degree syntax: $1, $3, $5, etc.
        this.current++;
        const num = this.readNumber();
        tokens.push({ type: TokenType.DEGREE, value: num, position });
      } else if (char === '*') {
        this.current++;
        const num = this.readNumber();
        tokens.push({ type: TokenType.REPEAT, value: num, position });
      } else if (char === '@') {
        this.current++;
        const num = this.readNumber();
        tokens.push({ type: TokenType.EXTEND, value: num, position });
      } else if (char === '/') {
        this.current++;
        const num = this.readNumber();
        tokens.push({ type: TokenType.DURATION, value: num, position });
      } else if (this.isNoteLetter(char)) {
        const noteOrChord = this.readNoteOrChord();
        // Determine if it's a note or chord
        if (this.looksLikeChord(noteOrChord)) {
          tokens.push({ type: TokenType.CHORD, value: noteOrChord, position });
        } else {
          tokens.push({ type: TokenType.NOTE, value: noteOrChord, position });
        }
      } else {
        throw new MiniNotationError(`Unexpected character '${char}'`, position);
      }
    }

    tokens.push({ type: TokenType.EOF, value: '', position: this.current });
    return tokens;
  }

  private isNoteLetter(char: string): boolean {
    return /[A-Ga-g]/.test(char);
  }

  private readNumber(): string {
    const start = this.current;
    while (this.current < this.input.length && /[0-9.]/.test(this.input[this.current])) {
      this.current++;
    }
    if (start === this.current) {
      throw new MiniNotationError('Expected number', this.current);
    }
    return this.input.slice(start, this.current);
  }

  private readNoteOrChord(): string {
    const start = this.current;

    // Read note letter
    if (!this.isNoteLetter(this.input[this.current])) {
      throw new MiniNotationError('Expected note letter', this.current);
    }
    this.current++;

    // Read optional accidental
    if (this.current < this.input.length) {
      const char = this.input[this.current];
      if (char === '#' || char === 'b') {
        this.current++;
      }
    }

    // Read octave or chord quality
    while (this.current < this.input.length) {
      const char = this.input[this.current];
      // Stop at operators or whitespace
      if (char === '*' || char === '@' || char === '/' ||
          char === ' ' || char === '\t' || char === '[' || char === ']') {
        break;
      }
      this.current++;
    }

    return this.input.slice(start, this.current);
  }

  private looksLikeChord(str: string): boolean {
    // A note has format: Letter + optional accidental + octave number (0-6)
    // We limit to 0-6 because octaves 7-8 are rare, and G7/C7/etc are common chords
    // Examples: C4, F#5, Bb3
    const notePattern = /^[A-Ga-g][#b]?[0-6]$/;
    if (notePattern.test(str)) {
      return false; // It's a note
    }

    // A chord has format: Letter + optional accidental + chord quality
    // Chord qualities include: maj, min, m, M, dim, aug, sus, numbers (7, 9, 11, 13), etc.
    // Examples: Cmaj7, Dm7, G7, Asus4, C13
    const chordPattern = /^[A-Ga-g][#b]?(maj|min|dim|aug|sus|add|alt|m|M|\d)/;
    if (chordPattern.test(str)) {
      return true; // It's a chord
    }

    // If it has more characters after the note letter and accidental, assume chord
    // (This catches cases like "C13", "Eb9", etc.)
    if (str.length > 2 || (str.length > 1 && !/[#b]$/.test(str))) {
      return true;
    }

    return false; // Default to note
  }
}

/**
 * Parser for mini-notation.
 */
class MiniNotationParser {
  private position = 0;
  private tokens: Token[] = [];

  constructor(tokens: Token[]) {
    this.tokens = tokens.filter(t => t.type !== TokenType.WHITESPACE);
  }

  /**
   * Parse the tokens into a list of elements.
   */
  parse(): ParsedElement[] {
    const elements: ParsedElement[] = [];

    while (this.current().type !== TokenType.EOF) {
      elements.push(this.parseElement());
    }

    return elements;
  }

  private parseElement(): ParsedElement {
    const token = this.current();

    if (token.type === TokenType.NOTE) {
      return this.parseNote();
    } else if (token.type === TokenType.CHORD) {
      return this.parseChordElement();
    } else if (token.type === TokenType.REST) {
      return this.parseRest();
    } else if (token.type === TokenType.DEGREE) {
      return this.parseDegree();
    } else if (token.type === TokenType.LBRACKET) {
      return this.parseGroup();
    } else {
      throw new MiniNotationError(
        `Unexpected token type ${token.type}`,
        token.position
      );
    }
  }

  private parseNote(): ParsedElement {
    const token = this.advance();
    const element: ParsedElement = {
      type: 'note',
      value: token.value,
      repeat: 1,
      extend: 1,
    };

    // Check for modifiers
    this.parseModifiers(element);
    return element;
  }

  private parseChordElement(): ParsedElement {
    const token = this.advance();
    const element: ParsedElement = {
      type: 'chord',
      value: token.value,
      repeat: 1,
      extend: 1,
    };

    this.parseModifiers(element);
    return element;
  }

  private parseRest(): ParsedElement {
    this.advance();
    const element: ParsedElement = {
      type: 'rest',
      repeat: 1,
      extend: 1,
    };

    this.parseModifiers(element);
    return element;
  }

  private parseDegree(): ParsedElement {
    const token = this.advance();
    const element: ParsedElement = {
      type: 'degree',
      value: token.value,
      repeat: 1,
      extend: 1,
    };

    this.parseModifiers(element);
    return element;
  }

  private parseGroup(): ParsedElement {
    this.expect(TokenType.LBRACKET);

    const children: ParsedElement[] = [];
    while (this.current().type !== TokenType.RBRACKET && this.current().type !== TokenType.EOF) {
      children.push(this.parseElement());
    }

    this.expect(TokenType.RBRACKET);

    const element: ParsedElement = {
      type: 'group',
      children,
      repeat: 1,
      extend: 1,
    };

    this.parseModifiers(element);
    return element;
  }

  private parseModifiers(element: ParsedElement): void {
    while (true) {
      const token = this.current();

      if (token.type === TokenType.REPEAT) {
        this.advance();
        element.repeat = parseFloat(token.value);
      } else if (token.type === TokenType.EXTEND) {
        this.advance();
        element.extend = parseFloat(token.value);
      } else if (token.type === TokenType.DURATION) {
        this.advance();
        // Duration as fraction: /8 means eighth note
        const denominator = parseFloat(token.value);
        element.duration = Duration(1 / denominator);
      } else {
        break;
      }
    }
  }

  private current(): Token {
    return this.tokens[this.position] || { type: TokenType.EOF, value: '', position: -1 };
  }

  private advance(): Token {
    const token = this.current();
    this.position++;
    return token;
  }

  private expect(type: TokenType): Token {
    const token = this.current();
    if (token.type !== type) {
      throw new MiniNotationError(
        `Expected ${type}, got ${token.type}`,
        token.position
      );
    }
    return this.advance();
  }
}

/**
 * Context for event generation.
 */
interface GenerationContext {
  defaultOctave: string;
  defaultDuration: Duration;
  defaultVelocity: Velocity;
  currentTime: Seconds;
  scale?: any; // Scale for degree notation (avoid circular dependency)
}

/**
 * Generate events from parsed elements.
 */
class EventGenerator {
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
      throw new MiniNotationError(
        `Failed to parse chord ${chordStr}: ${error}`,
        0
      );
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
      throw new MiniNotationError(
        'Scale degree notation ($n) requires a scale context',
        0
      );
    }

    // Parse degree number (1-indexed)
    const degree = parseInt(degreeStr);
    if (isNaN(degree) || degree < 1) {
      throw new MiniNotationError(
        `Invalid scale degree: ${degreeStr}`,
        0
      );
    }

    // Get note from scale
    const note = this.context.scale.degree(degree);

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

/**
 * Parse mini-notation string into events.
 *
 * Syntax:
 * - Space-separated events: "bd sn bd sn"
 * - Repetition: "bd*4" (repeat bd 4 times)
 * - Grouping: "[bd sn]" (subdivision)
 * - Rests: "~" or "_"
 * - Hold/extend: "bd@2" (bd twice as long)
 * - Duration: "C4/8" (eighth note)
 * - Octave persistence: "C4 D E F" (all octave 4)
 * - Chord symbols: "Cmaj7 Dm7 G7"
 * - Scale degrees: "$1 $3 $5" (requires scale context via parseMiniNotationWithDefaults)
 *
 * @param notation - Mini-notation string
 * @returns Array of musical events
 */
export function parseMiniNotation(notation: string): Event[] {
  if (!notation || notation.trim().length === 0) {
    return [];
  }

  try {
    // Tokenize
    const lexer = new MiniNotationLexer(notation);
    const tokens = lexer.tokenize();

    // Parse
    const parser = new MiniNotationParser(tokens);
    const elements = parser.parse();

    // Generate events
    const generator = new EventGenerator();
    const events = generator.generate(elements);

    return events;
  } catch (error) {
    if (error instanceof MiniNotationError) {
      throw error;
    }
    throw new MiniNotationError(`Parse error: ${error}`, 0);
  }
}

/**
 * Parse mini-notation with custom defaults.
 */
export function parseMiniNotationWithDefaults(
  notation: string,
  options: {
    defaultOctave?: string;
    defaultDuration?: Duration;
    defaultVelocity?: Velocity;
    scale?: any; // Scale for degree notation (avoid circular dependency)
  } = {}
): Event[] {
  if (!notation || notation.trim().length === 0) {
    return [];
  }

  const lexer = new MiniNotationLexer(notation);
  const tokens = lexer.tokenize();
  const parser = new MiniNotationParser(tokens);
  const elements = parser.parse();

  const generator = new EventGenerator({
    defaultOctave: options.defaultOctave,
    defaultDuration: options.defaultDuration,
    defaultVelocity: options.defaultVelocity,
    scale: options.scale,
  });

  return generator.generate(elements);
}
