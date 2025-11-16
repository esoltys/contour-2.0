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
  // Types
  TokenType,
  Token,
  MiniNotationError,
  ParsedElement,
  // Classes
  MiniNotationLexer,
  MiniNotationParser,
  EventGenerator,
  GenerationContext,
  // Public API functions
  parseMiniNotation,
  parseMiniNotationWithDefaults,
} from './mini-notation/index.js';
