// packages/core/src/debug/Logger.ts

/**
 * Categories for structured logging.
 * Each category can be enabled independently via DEBUG environment variable.
 */
export type LogCategory = 'pattern' | 'schedule' | 'audio' | 'hmr' | 'composition' | 'validator';

/**
 * Log level for filtering messages.
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

/**
 * Context data that can be attached to log messages.
 */
export interface LogContext {
  [key: string]: unknown;
}

/**
 * Structured log entry.
 */
export interface LogEntry {
  timestamp: number;
  category: LogCategory;
  level: LogLevel;
  message: string;
  context?: LogContext;
}

/**
 * Verbose logging system with environment-based configuration.
 *
 * Enable logging via DEBUG environment variable:
 * - DEBUG=contour:* - Enable all categories
 * - DEBUG=contour:pattern - Enable only pattern category
 * - DEBUG=contour:pattern,contour:audio - Enable multiple categories
 *
 * Zero runtime cost when disabled (tree-shakeable).
 *
 * @example
 * ```typescript
 * // In your code
 * const logger = Logger.create('pattern');
 * logger.debug('Pattern created', { events: 12 });
 *
 * // In terminal
 * DEBUG=contour:* npm run dev
 * // Output: [2025-11-06T12:34:56.789Z] [contour:pattern] [DEBUG] Pattern created { events: 12 }
 * ```
 */
export class Logger {
  private static readonly PREFIX = 'contour';
  private static enabledCategories: Set<LogCategory> | null = null;
  private static initialized = false;

  private constructor(
    private readonly category: LogCategory
  ) {}

  /**
   * Create a logger for a specific category.
   */
  static create(category: LogCategory): Logger {
    return new Logger(category);
  }

  /**
   * Initialize logger from environment.
   * Automatically called on first use.
   */
  private static initialize(): void {
    if (this.initialized) return;
    this.initialized = true;

    const debugEnv = this.getDebugEnv();
    if (!debugEnv) {
      // Logging disabled
      this.enabledCategories = null;
      return;
    }

    // Parse DEBUG environment variable
    const patterns = debugEnv.split(',').map(p => p.trim());
    const categories = new Set<LogCategory>();

    for (const pattern of patterns) {
      if (pattern === `${this.PREFIX}:*`) {
        // Enable all categories
        categories.add('pattern');
        categories.add('schedule');
        categories.add('audio');
        categories.add('hmr');
        categories.add('composition');
        categories.add('validator');
      } else if (pattern.startsWith(`${this.PREFIX}:`)) {
        // Enable specific category
        const category = pattern.slice(this.PREFIX.length + 1) as LogCategory;
        categories.add(category);
      }
    }

    this.enabledCategories = categories.size > 0 ? categories : null;
  }

  /**
   * Get DEBUG environment variable.
   * Works in both Node.js and browser.
   */
  private static getDebugEnv(): string | undefined {
    // Node.js
    if (typeof process !== 'undefined' && process.env?.DEBUG) {
      return process.env.DEBUG;
    }

    // Browser (check localStorage for persistence)
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('DEBUG') || undefined;
    }

    return undefined;
  }

  /**
   * Check if this logger is enabled.
   */
  isEnabled(): boolean {
    if (!Logger.initialized) {
      Logger.initialize();
    }
    return Logger.enabledCategories?.has(this.category) ?? false;
  }

  /**
   * Log a debug message.
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  /**
   * Log an info message.
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  /**
   * Log a warning message.
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  /**
   * Log an error message.
   */
  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  /**
   * Internal logging implementation.
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.isEnabled()) return;

    const entry: LogEntry = {
      timestamp: Date.now(),
      category: this.category,
      level,
      message,
      context,
    };

    this.output(entry);
  }

  /**
   * Output log entry to console.
   */
  private output(entry: LogEntry): void {
    const timestamp = new Date(entry.timestamp).toISOString();
    const prefix = `[${timestamp}] [${Logger.PREFIX}:${entry.category}] [${entry.level.toUpperCase()}]`;
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    const fullMessage = `${prefix} ${entry.message}${contextStr}`;

    // Use appropriate console method based on level
    switch (entry.level) {
      case 'debug':
        console.debug(fullMessage);
        break;
      case 'info':
        console.info(fullMessage);
        break;
      case 'warn':
        console.warn(fullMessage);
        break;
      case 'error':
        console.error(fullMessage);
        break;
    }
  }

  /**
   * Reset logger state (useful for testing).
   */
  static reset(): void {
    this.initialized = false;
    this.enabledCategories = null;
  }

  /**
   * Manually enable categories (useful for testing).
   */
  static enableCategories(...categories: LogCategory[]): void {
    this.initialized = true;
    this.enabledCategories = new Set(categories);
  }

  /**
   * Disable all logging.
   */
  static disable(): void {
    this.initialized = true;
    this.enabledCategories = null;
  }
}

/**
 * Pre-created loggers for convenience.
 */
export const patternLogger = Logger.create('pattern');
export const scheduleLogger = Logger.create('schedule');
export const audioLogger = Logger.create('audio');
export const hmrLogger = Logger.create('hmr');
export const compositionLogger = Logger.create('composition');
export const validatorLogger = Logger.create('validator');
