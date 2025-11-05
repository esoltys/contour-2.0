import { describe, it, expect } from 'vitest';
import { Track } from '../../src/composition/Track';
import { Voice } from '../../src/composition/Voice';
import { Pattern } from '../../src/patterns/Pattern';
import { PatternBuilder } from '../../src/patterns/PatternBuilder';
import { C, D, E, F, G, A } from '../../src/primitives/Note';
import { Durations } from '../../src/types/music';

describe('Track', () => {
  describe('construction', () => {
    it('creates empty track with name', () => {
      const track = new Track('Piano');

      expect(track.name).toBe('Piano');
      expect(track.voices.length).toBe(0);
      expect(track.isEmpty).toBe(true);
      expect(track.voiceCount).toBe(0);
    });

    it('creates track with single voice', () => {
      const pattern = new PatternBuilder()
        .notes([C('4'), D('4'), E('4')])
        .build();
      const voice = new Voice(pattern, 'synth');
      const track = new Track('Melody', [voice]);

      expect(track.name).toBe('Melody');
      expect(track.voices.length).toBe(1);
      expect(track.isEmpty).toBe(false);
      expect(track.voiceCount).toBe(1);
      expect(track.voices[0]).toBe(voice);
    });

    it('creates track with multiple voices', () => {
      const voice1 = new Voice(
        new PatternBuilder().notes([C('4'), E('4')]).build(),
        'piano'
      );
      const voice2 = new Voice(
        new PatternBuilder().notes([G('3'), C('4')]).build(),
        'strings'
      );
      const voice3 = new Voice(
        new PatternBuilder().notes([E('5'), G('5')]).build(),
        'flute'
      );

      const track = new Track('Harmony', [voice1, voice2, voice3]);

      expect(track.voices.length).toBe(3);
      expect(track.voiceCount).toBe(3);
      expect(track.voices[0]).toBe(voice1);
      expect(track.voices[1]).toBe(voice2);
      expect(track.voices[2]).toBe(voice3);
    });

    it('freezes voices array (immutability)', () => {
      const voice = new Voice(new Pattern([]), 'synth');
      const track = new Track('Test', [voice]);

      expect(Object.isFrozen(track.voices)).toBe(true);
    });
  });

  describe('addVoice', () => {
    it('adds voice to empty track', () => {
      const track = new Track('Piano');
      const voice = new Voice(new Pattern([]), 'piano');
      const newTrack = track.addVoice(voice);

      // Original unchanged
      expect(track.voices.length).toBe(0);

      // New track has voice
      expect(newTrack.voices.length).toBe(1);
      expect(newTrack.voices[0]).toBe(voice);
      expect(newTrack.name).toBe('Piano');
    });

    it('adds voice to track with existing voices', () => {
      const voice1 = new Voice(new Pattern([]), 'synth');
      const voice2 = new Voice(new Pattern([]), 'piano');
      const voice3 = new Voice(new Pattern([]), 'strings');

      const track = new Track('Multi', [voice1, voice2]);
      const newTrack = track.addVoice(voice3);

      // Original unchanged
      expect(track.voices.length).toBe(2);

      // New track has all voices
      expect(newTrack.voices.length).toBe(3);
      expect(newTrack.voices[0]).toBe(voice1);
      expect(newTrack.voices[1]).toBe(voice2);
      expect(newTrack.voices[2]).toBe(voice3);
    });

    it('can chain multiple addVoice calls', () => {
      const voice1 = new Voice(new Pattern([]), 'synth');
      const voice2 = new Voice(new Pattern([]), 'piano');
      const voice3 = new Voice(new Pattern([]), 'strings');

      const track = new Track('Chain')
        .addVoice(voice1)
        .addVoice(voice2)
        .addVoice(voice3);

      expect(track.voices.length).toBe(3);
      expect(track.voices[0]).toBe(voice1);
      expect(track.voices[1]).toBe(voice2);
      expect(track.voices[2]).toBe(voice3);
    });

    it('preserves track name when adding voices', () => {
      const track = new Track('Original Name');
      const voice = new Voice(new Pattern([]), 'synth');
      const newTrack = track.addVoice(voice);

      expect(newTrack.name).toBe('Original Name');
    });
  });

  describe('transform', () => {
    it('transforms all voices in track', () => {
      const pattern1 = new PatternBuilder()
        .notes([C('4'), D('4'), E('4')])
        .build();
      const pattern2 = new PatternBuilder()
        .notes([G('3'), A('3')])
        .build();

      const voice1 = new Voice(pattern1, 'piano');
      const voice2 = new Voice(pattern2, 'strings');
      const track = new Track('Multi', [voice1, voice2]);

      const transposed = track.transform(v => v.transform(p => p.transpose(2)));

      // Original unchanged
      expect(track.voices[0].pattern).toBe(pattern1);
      expect(track.voices[1].pattern).toBe(pattern2);

      // New track has transformed voices
      expect(transposed.voices.length).toBe(2);
      expect(transposed.voices[0].pattern).not.toBe(pattern1);
      expect(transposed.voices[1].pattern).not.toBe(pattern2);

      // Verify transformation applied
      const firstEvent = transposed.voices[0].pattern.events[0];
      if (firstEvent.type === 'note') {
        expect(firstEvent.pitch).toBe(62); // C4 (60) + 2 = D4 (62)
      }
    });

    it('preserves track name when transforming', () => {
      const voice = new Voice(new Pattern([]), 'synth');
      const track = new Track('Original', [voice]);
      const transformed = track.transform(v => v);

      expect(transformed.name).toBe('Original');
    });

    it('handles empty track transformation', () => {
      const track = new Track('Empty');
      const transformed = track.transform(v => v.transform(p => p.transpose(5)));

      expect(transformed.isEmpty).toBe(true);
      expect(transformed.voices.length).toBe(0);
    });

    it('can chain multiple transformations', () => {
      const pattern = new PatternBuilder()
        .notes([C('4'), D('4'), E('4'), F('4')])
        .build();
      const voice = new Voice(pattern, 'piano');
      const track = new Track('Piano', [voice]);

      const transformed = track
        .transform(v => v.transform(p => p.transpose(5)))
        .transform(v => v.transform(p => p.fast(2)))
        .transform(v => v.transform(p => p.retrograde()));

      // Original unchanged
      expect(track.voices[0].pattern).toBe(pattern);

      // Transformations applied
      expect(transformed.voices[0].pattern.duration).toBe(pattern.duration / 2);
    });

    it('transforms each voice independently', () => {
      const voice1 = new Voice(new Pattern([]), 'piano');
      const voice2 = new Voice(new Pattern([]), 'strings');
      const track = new Track('Multi', [voice1, voice2]);

      let transformCount = 0;
      const transformed = track.transform(v => {
        transformCount++;
        return v;
      });

      expect(transformCount).toBe(2);
      expect(transformed.voices.length).toBe(2);
    });

    it('applies different instruments transformation', () => {
      const pattern1 = new PatternBuilder().notes([C('4'), D('4')]).build();
      const pattern2 = new PatternBuilder().notes([E('4'), F('4')]).build();

      const voice1 = new Voice(pattern1, 'synth');
      const voice2 = new Voice(pattern2, 'piano');
      const track = new Track('Multi', [voice1, voice2]);

      const transformed = track.transform(v => v.transform(p => p.fast(2)));

      expect(transformed.voices[0].instrument).toBe('synth');
      expect(transformed.voices[1].instrument).toBe('piano');
    });

    it('applies retrograde to all voices', () => {
      const pattern1 = new PatternBuilder()
        .note(C('4'), Durations.quarter)
        .note(D('4'), Durations.quarter)
        .build();
      const pattern2 = new PatternBuilder()
        .note(E('4'), Durations.quarter)
        .note(F('4'), Durations.quarter)
        .build();

      const voice1 = new Voice(pattern1, 'synth');
      const voice2 = new Voice(pattern2, 'piano');
      const track = new Track('Multi', [voice1, voice2]);

      const reversed = track.transform(v => v.transform(p => p.retrograde()));

      // First voice reversed
      const voice1FirstEvent = reversed.voices[0].pattern.events[0];
      if (voice1FirstEvent.type === 'note') {
        expect(voice1FirstEvent.pitch).toBe(62); // D4
      }

      // Second voice reversed
      const voice2FirstEvent = reversed.voices[1].pattern.events[0];
      if (voice2FirstEvent.type === 'note') {
        expect(voice2FirstEvent.pitch).toBe(65); // F4
      }
    });
  });

  describe('properties', () => {
    it('reports correct voice count', () => {
      const track = new Track('Test');
      expect(track.voiceCount).toBe(0);

      const withOne = track.addVoice(new Voice(new Pattern([]), 'synth'));
      expect(withOne.voiceCount).toBe(1);

      const withTwo = withOne.addVoice(new Voice(new Pattern([]), 'piano'));
      expect(withTwo.voiceCount).toBe(2);
    });

    it('reports isEmpty correctly', () => {
      const track = new Track('Test');
      expect(track.isEmpty).toBe(true);

      const withVoice = track.addVoice(new Voice(new Pattern([]), 'synth'));
      expect(withVoice.isEmpty).toBe(false);
    });
  });

  describe('multi-voice counterpoint', () => {
    it('supports two-voice counterpoint (Bach-style)', () => {
      // Upper voice
      const upperPattern = new PatternBuilder()
        .notes([D('5'), C('5'), D('5'), E('5')])
        .build();
      const upperVoice = new Voice(upperPattern, 'harpsichord');

      // Lower voice
      const lowerPattern = new PatternBuilder()
        .notes([D('4'), A('3'), F('4'), G('4')])
        .build();
      const lowerVoice = new Voice(lowerPattern, 'harpsichord');

      const track = new Track('Two-Voice Invention', [upperVoice, lowerVoice]);

      expect(track.voiceCount).toBe(2);
      expect(track.voices[0].pattern.events.length).toBe(4);
      expect(track.voices[1].pattern.events.length).toBe(4);
    });

    it('supports four-voice harmony (SATB)', () => {
      const soprano = new Voice(
        new PatternBuilder().notes([G('5'), F('5')]).build(),
        'soprano'
      );
      const alto = new Voice(
        new PatternBuilder().notes([E('5'), D('5')]).build(),
        'alto'
      );
      const tenor = new Voice(
        new PatternBuilder().notes([C('5'), A('4')]).build(),
        'tenor'
      );
      const bass = new Voice(
        new PatternBuilder().notes([C('4'), D('4')]).build(),
        'bass'
      );

      const track = new Track('SATB Chorale', [soprano, alto, tenor, bass]);

      expect(track.voiceCount).toBe(4);
      expect(track.voices[0].instrument).toBe('soprano');
      expect(track.voices[1].instrument).toBe('alto');
      expect(track.voices[2].instrument).toBe('tenor');
      expect(track.voices[3].instrument).toBe('bass');
    });
  });
});
