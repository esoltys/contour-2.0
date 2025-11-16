/**
 * Parser for mini-notation tokens
 */

import { TokenType, Token, ParsedElement, MiniNotationError } from './types.js';
import { Duration } from '../../types/brands.js';

/**
 * Parser for mini-notation.
 */
export class MiniNotationParser {
  private position = 0;
  private tokens: Token[] = [];

  constructor(tokens: Token[]) {
    this.tokens = tokens.filter((t) => t.type !== TokenType.WHITESPACE);
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
      throw new MiniNotationError(`Unexpected token type ${token.type}`, token.position);
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
      throw new MiniNotationError(`Expected ${type}, got ${token.type}`, token.position);
    }
    return this.advance();
  }
}
