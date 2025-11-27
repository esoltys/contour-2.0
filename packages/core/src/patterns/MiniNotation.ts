/**
 * Mini-notation parser - Facade module
 *
 * This module re-exports the mini-notation parser functionality from its split modules.
 * The implementation has been refactored into separate files for better maintainability:
 * - types.ts: Type definitions and error class
 * - Lexer.ts: Tokenization of mini-notation strings
 * - Parser.ts: Parsing tokens into parsed elements
 * - EventGenerator.ts: Converting parsed elements to musical events
 * - index.ts: Main entry point with public API functions
 */

// Re-export everything from the mini-notation module
export {
  // Enums and classes
  TokenType,
  MiniNotationError,
  MiniNotationLexer,
  MiniNotationParser,
  EventGenerator,
  // Public API functions
  parseMiniNotation,
  parseMiniNotationWithDefaults,
} from './mini-notation/index.js';

// Re-export types separately for proper ESM handling
export type { Token, ParsedElement, GenerationContext } from './mini-notation/index.js';
