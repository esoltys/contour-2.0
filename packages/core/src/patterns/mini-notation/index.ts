/**
 * Mini-notation module - Concise pattern notation parser
 *
 * Provides a TidalCycles-inspired mini-notation syntax for defining musical patterns.
 */

export { TokenType, Token, MiniNotationError, ParsedElement } from './types.js';
export { MiniNotationLexer } from './Lexer.js';
export { MiniNotationParser } from './Parser.js';
export { EventGenerator, GenerationContext } from './EventGenerator.js';

import type { Event } from '../../primitives/Event.js';
import type { Duration, Velocity } from '../../types/brands.js';
import type { ScaleLike } from '../../types/interfaces.js';
import { MiniNotationLexer } from './Lexer.js';
import { MiniNotationParser } from './Parser.js';
import { EventGenerator } from './EventGenerator.js';
import { MiniNotationError } from './types.js';

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
    scale?: ScaleLike;
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
