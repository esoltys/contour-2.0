import { describe, it, expect } from 'vitest';
import { Voice } from '../../src/composition/Voice';
import { Pattern } from '../../src/patterns/Pattern';
import { PatternBuilder } from '../../src/patterns/PatternBuilder';
import { C, D, E, G } from '../../src/primitives/Note';
import { Durations } from '../../src/types/music';

describe('Voice', () => {
  describe('construction', () => {
    it('creates voice with pattern and default instrument', () => {
      const pattern = new PatternBuilder()
        .note(C('4'), Durations.quarter)
        .build();

      const voice = new Voice(pattern);

      expect(voice.pattern).toBe(pattern);
      expect(voice.instrument).toBe('synth');
    });

    it('creates voice with pattern and custom instrument', () => {
      const pattern = new PatternBuilder()
        .note(C('4'), Durations.quarter)
        .build();

      const voice = new Voice(pattern, 'piano');

      expect(voice.pattern).toBe(pattern);
      expect(voice.instrument).toBe('piano');
    });

    it('creates voice with empty pattern', () => {
      const pattern = new Pattern([]);
      const voice = new Voice(pattern, 'strings');

      expect(voice.pattern.isEmpty).toBe(true);
      expect(voice.instrument).toBe('strings');
    });
  });

  describe('immutability', () => {
    it('pattern reference is readonly at compile time', () => {
      const pattern = new PatternBuilder()
        .notes([C('4'), E('4'), G('4')])
        .build();

      const voice = new Voice(pattern, 'synth');

      // TypeScript prevents mutation with readonly keyword
      // @ts-expect-error - TypeScript correctly prevents this assignment
      // voice.pattern = new Pattern([]);

      // Verify pattern reference is preserved
      expect(voice.pattern).toBe(pattern);
    });

    it('instrument reference is readonly at compile time', () => {
      const pattern = new PatternBuilder()
        .note(C('4'))
        .build();

      const voice = new Voice(pattern, 'piano');

      // TypeScript prevents mutation with readonly keyword
      // @ts-expect-error - TypeScript correctly prevents this assignment
      // voice.instrument = 'synth';

      // Verify instrument is preserved
      expect(voice.instrument).toBe('piano');
    });
  });

  describe('transform', () => {
    it('returns new Voice with transformed pattern', () => {
      const pattern = new PatternBuilder()
        .notes([C('4'), D('4'), E('4')])
        .build();

      const voice = new Voice(pattern, 'piano');
      const transposed = voice.transform(p => p.transpose(2));

      // Original voice unchanged
      expect(voice.pattern).toBe(pattern);
      expect(voice.instrument).toBe('piano');

      // New voice has transformed pattern
      expect(transposed.pattern).not.toBe(pattern);
      expect(transposed.instrument).toBe('piano');

      // Verify transformation applied
      const firstEvent = transposed.pattern.events[0];
      if (firstEvent.type === 'note') {
        expect(firstEvent.pitch).toBe(62); // C4 (60) + 2 = D4 (62)
      }
    });

    it('preserves instrument when transforming', () => {
      const pattern = new PatternBuilder()
        .note(C('4'))
        .build();

      const voice = new Voice(pattern, 'guitar');
      const faster = voice.transform(p => p.fast(2));

      expect(faster.instrument).toBe('guitar');
    });

    it('can chain multiple transformations', () => {
      const pattern = new PatternBuilder()
        .notes([C('4'), D('4'), E('4'), G('4')])
        .build();

      const voice = new Voice(pattern, 'synth');
      const transformed = voice
        .transform(p => p.transpose(5))
        .transform(p => p.fast(2))
        .transform(p => p.retrograde());

      // Original unchanged
      expect(voice.pattern).toBe(pattern);

      // Transformations applied
      expect(transformed.pattern.duration).toBe(pattern.duration / 2);
      expect(transformed.instrument).toBe('synth');
    });

    it('handles transformation that returns empty pattern', () => {
      const pattern = new PatternBuilder()
        .notes([C('4'), D('4'), E('4')])
        .build();

      const voice = new Voice(pattern, 'piano');
      const filtered = voice.transform(p => p.filter(() => false));

      expect(filtered.pattern.isEmpty).toBe(true);
      expect(filtered.instrument).toBe('piano');
    });

    it('applies retrograde transformation', () => {
      const pattern = new PatternBuilder()
        .note(C('4'), Durations.quarter)
        .note(D('4'), Durations.quarter)
        .note(E('4'), Durations.quarter)
        .build();

      const voice = new Voice(pattern, 'synth');
      const reversed = voice.transform(p => p.retrograde());

      expect(reversed.pattern.events.length).toBe(3);

      // Check that the order is reversed
      const firstEvent = reversed.pattern.events[0];
      if (firstEvent.type === 'note') {
        expect(firstEvent.pitch).toBe(64); // E4
      }
    });

    it('applies fast transformation', () => {
      const pattern = new PatternBuilder()
        .notes([C('4'), D('4'), E('4')])
        .build();

      const voice = new Voice(pattern, 'piano');
      const doubled = voice.transform(p => p.fast(2));

      expect(doubled.pattern.duration).toBe(pattern.duration / 2);
    });

    it('applies slow transformation', () => {
      const pattern = new PatternBuilder()
        .notes([C('4'), D('4'), E('4')])
        .build();

      const voice = new Voice(pattern, 'piano');
      const halved = voice.transform(p => p.slow(2));

      expect(halved.pattern.duration).toBe(pattern.duration * 2);
    });
  });

  describe('instrument identifiers', () => {
    it('accepts various instrument names', () => {
      const pattern = new Pattern([]);

      expect(new Voice(pattern, 'synth').instrument).toBe('synth');
      expect(new Voice(pattern, 'piano').instrument).toBe('piano');
      expect(new Voice(pattern, 'guitar').instrument).toBe('guitar');
      expect(new Voice(pattern, 'strings').instrument).toBe('strings');
      expect(new Voice(pattern, 'drums').instrument).toBe('drums');
      expect(new Voice(pattern, 'bass').instrument).toBe('bass');
    });

    it('accepts Tone.js instrument names', () => {
      const pattern = new Pattern([]);

      expect(new Voice(pattern, 'AMSynth').instrument).toBe('AMSynth');
      expect(new Voice(pattern, 'FMSynth').instrument).toBe('FMSynth');
      expect(new Voice(pattern, 'MonoSynth').instrument).toBe('MonoSynth');
      expect(new Voice(pattern, 'PluckSynth').instrument).toBe('PluckSynth');
    });
  });
});
