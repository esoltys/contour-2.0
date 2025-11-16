/**
 * Lexer for mini-notation strings
 */

import { TokenType, Token, MiniNotationError } from './types.js';

/**
 * Lexer for mini-notation strings.
 */
export class MiniNotationLexer {
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
      if (
        char === '*' ||
        char === '@' ||
        char === '/' ||
        char === ' ' ||
        char === '\t' ||
        char === '[' ||
        char === ']'
      ) {
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
