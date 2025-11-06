// packages/core/tests/debug/Logger.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  Logger,
  patternLogger,
  scheduleLogger,
  audioLogger,
  hmrLogger,
  compositionLogger,
  validatorLogger,
} from '../../src/debug/Logger';

describe('Logger', () => {
  beforeEach(() => {
    // Reset logger state before each test
    Logger.reset();

    // Mock console methods
    vi.spyOn(console, 'debug').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Logger.create', () => {
    it('should create a logger for a category', () => {
      const logger = Logger.create('pattern');
      expect(logger).toBeInstanceOf(Logger);
    });
  });

  describe('isEnabled', () => {
    it('should return false when logging is disabled', () => {
      Logger.disable();
      const logger = Logger.create('pattern');
      expect(logger.isEnabled()).toBe(false);
    });

    it('should return true when category is enabled', () => {
      Logger.enableCategories('pattern');
      const logger = Logger.create('pattern');
      expect(logger.isEnabled()).toBe(true);
    });

    it('should return false when different category is enabled', () => {
      Logger.enableCategories('audio');
      const logger = Logger.create('pattern');
      expect(logger.isEnabled()).toBe(false);
    });

    it('should support multiple enabled categories', () => {
      Logger.enableCategories('pattern', 'audio');
      const patternLogger = Logger.create('pattern');
      const audioLogger = Logger.create('audio');
      const scheduleLogger = Logger.create('schedule');

      expect(patternLogger.isEnabled()).toBe(true);
      expect(audioLogger.isEnabled()).toBe(true);
      expect(scheduleLogger.isEnabled()).toBe(false);
    });
  });

  describe('debug', () => {
    it('should not log when disabled', () => {
      Logger.disable();
      const logger = Logger.create('pattern');

      logger.debug('test message');

      expect(console.debug).not.toHaveBeenCalled();
    });

    it('should log when enabled', () => {
      Logger.enableCategories('pattern');
      const logger = Logger.create('pattern');

      logger.debug('test message');

      expect(console.debug).toHaveBeenCalled();
      const call = (console.debug as any).mock.calls[0][0];
      expect(call).toContain('[contour:pattern]');
      expect(call).toContain('[DEBUG]');
      expect(call).toContain('test message');
    });

    it('should include context in log', () => {
      Logger.enableCategories('pattern');
      const logger = Logger.create('pattern');

      logger.debug('test message', { events: 12, duration: 4.5 });

      expect(console.debug).toHaveBeenCalled();
      const call = (console.debug as any).mock.calls[0][0];
      expect(call).toContain('test message');
      expect(call).toContain('"events":12');
      expect(call).toContain('"duration":4.5');
    });

    it('should include timestamp', () => {
      Logger.enableCategories('pattern');
      const logger = Logger.create('pattern');

      logger.debug('test message');

      expect(console.debug).toHaveBeenCalled();
      const call = (console.debug as any).mock.calls[0][0];
      // Check for ISO timestamp format
      expect(call).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    });
  });

  describe('log levels', () => {
    beforeEach(() => {
      Logger.enableCategories('pattern');
    });

    it('should log info messages', () => {
      const logger = Logger.create('pattern');
      logger.info('info message');

      expect(console.info).toHaveBeenCalled();
      const call = (console.info as any).mock.calls[0][0];
      expect(call).toContain('[INFO]');
      expect(call).toContain('info message');
    });

    it('should log warning messages', () => {
      const logger = Logger.create('pattern');
      logger.warn('warning message');

      expect(console.warn).toHaveBeenCalled();
      const call = (console.warn as any).mock.calls[0][0];
      expect(call).toContain('[WARN]');
      expect(call).toContain('warning message');
    });

    it('should log error messages', () => {
      const logger = Logger.create('pattern');
      logger.error('error message');

      expect(console.error).toHaveBeenCalled();
      const call = (console.error as any).mock.calls[0][0];
      expect(call).toContain('[ERROR]');
      expect(call).toContain('error message');
    });
  });

  describe('pre-created loggers', () => {
    it('should export pre-created category loggers', () => {
      expect(patternLogger).toBeInstanceOf(Logger);
      expect(scheduleLogger).toBeInstanceOf(Logger);
      expect(audioLogger).toBeInstanceOf(Logger);
      expect(hmrLogger).toBeInstanceOf(Logger);
      expect(compositionLogger).toBeInstanceOf(Logger);
      expect(validatorLogger).toBeInstanceOf(Logger);
    });
  });

  describe('reset', () => {
    it('should clear enabled categories', () => {
      Logger.enableCategories('pattern');
      const logger = Logger.create('pattern');
      expect(logger.isEnabled()).toBe(true);

      Logger.reset();
      expect(logger.isEnabled()).toBe(false);
    });
  });

  describe('zero runtime cost when disabled', () => {
    it('should not format context when disabled', () => {
      Logger.disable();
      const logger = Logger.create('pattern');

      const expensiveContext = {
        get data() {
          throw new Error('Should not be called');
        }
      };

      // Should not throw because context is not accessed when disabled
      expect(() => {
        logger.debug('test', expensiveContext);
      }).not.toThrow();
    });
  });
});
