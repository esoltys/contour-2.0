
import { describe, it, expect } from 'vitest';
import { parseTransportTime } from '../../src/debug/TimeParser';

describe('parseTransportTime', () => {
  it('should pass through numbers as seconds', () => {
    expect(parseTransportTime(1.5, 120, 4)).toBe(1.5);
    expect(parseTransportTime(0, 120, 4)).toBe(0);
  });

  describe('bars:quarters:sixteenths', () => {
    it('should parse simple B:Q:S at 120 BPM 4/4', () => {
      // 120 BPM = 0.5s per quarter
      // 4/4 = 4 quarters per bar
      // 1 bar = 2.0s

      // "0:0:0" -> 0
      expect(parseTransportTime('0:0:0', 120, 4)).toBe(0);

      // "0:1:0" -> 1 quarter -> 0.5s
      expect(parseTransportTime('0:1:0', 120, 4)).toBe(0.5);

      // "0:0:1" -> 1 sixteenth -> 0.125s
      expect(parseTransportTime('0:0:1', 120, 4)).toBe(0.125); // 0.5 / 4

      // "1:0:0" -> 1 bar -> 2.0s
      expect(parseTransportTime('1:0:0', 120, 4)).toBe(2.0);
    });

    it('should parse decimal values', () => {
      // "0:0.5:0" -> 0.5 quarter -> 0.25s
      expect(parseTransportTime('0:0.5:0', 120, 4)).toBe(0.25);
    });

    it('should handle different BPM', () => {
      // 60 BPM = 1.0s per quarter
      expect(parseTransportTime('0:1:0', 60, 4)).toBe(1.0);
      expect(parseTransportTime('1:0:0', 60, 4)).toBe(4.0); // 1 bar = 4 quarters = 4s
    });

    it('should handle different time signatures (numerator)', () => {
      // 3/4 time -> 3 quarters per bar
      // 120 BPM

      // "1:0:0" -> 3 quarters -> 1.5s
      expect(parseTransportTime('1:0:0', 120, 3)).toBe(1.5);
    });

    it('should handle different time signatures (array)', () => {
      // 6/8 time
      // 6 * (4/8) = 3 quarters per bar
      const sig = [6, 8];

      // "1:0:0" -> 3 quarters -> 1.5s at 120 BPM
      expect(parseTransportTime('1:0:0', 120, sig)).toBe(1.5);

      // "0:3:0" -> 3 quarters -> 1.5s
      expect(parseTransportTime('0:3:0', 120, sig)).toBe(1.5);
    });

    it('should handle partial strings (B:Q)', () => {
        // "0:1" -> 0 bars, 1 quarter -> 0.5s
        expect(parseTransportTime('0:1', 120, 4)).toBe(0.5);

        // "1:1" -> 1 bar (4q) + 1q = 5q -> 2.5s
        expect(parseTransportTime('1:1', 120, 4)).toBe(2.5);
    });
  });

  describe('Invalid inputs', () => {
    it('should return null for non-transport strings', () => {
      expect(parseTransportTime('4n', 120, 4)).toBe(null);
      expect(parseTransportTime('hello', 120, 4)).toBe(null);
    });

    it('should return null for invalid parts', () => {
        expect(parseTransportTime('0:foo:0', 120, 4)).toBe(null);
    });

    it('should return null for non-string/non-number', () => {
        expect(parseTransportTime({} as any, 120, 4)).toBe(null);
    });
  });
});
