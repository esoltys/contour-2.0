/**
 * Type definitions for mini-notation parser
 */

import type { Duration } from '../../types/brands.js';

/**
 * Token types for mini-notation lexer.
 */
export enum TokenType {
  NOTE = 'NOTE', // C4, Db3, etc.
  CHORD = 'CHORD', // Cmaj7, Dm7, etc.
  REST = 'REST', // ~ or _
  DEGREE = 'DEGREE', // $1, $3, $5, etc. (scale degrees)
  REPEAT = 'REPEAT', // *n
  EXTEND = 'EXTEND', // @n
  DURATION = 'DURATION', // /n or suffix like 'q', 'h'
  LBRACKET = 'LBRACKET', // [
  RBRACKET = 'RBRACKET', // ]
  WHITESPACE = 'WHITESPACE',
  EOF = 'EOF',
}

/**
 * Token from lexer.
 */
export interface Token {
  type: TokenType;
  value: string;
  position: number;
}

/**
 * Parse error with position information.
 */
export class MiniNotationError extends Error {
  constructor(
    message: string,
    public position: number
  ) {
    super(`${message} at position ${position}`);
    this.name = 'MiniNotationError';
  }
}

/**
 * Parsed element from mini-notation.
 */
export interface ParsedElement {
  type: 'note' | 'chord' | 'rest' | 'group' | 'degree';
  value?: string; // Note name, chord symbol, or degree number
  children?: ParsedElement[]; // For groups
  repeat: number; // Repetition factor
  extend: number; // Extension factor (duration multiplier)
  duration?: Duration; // Explicit duration
}
