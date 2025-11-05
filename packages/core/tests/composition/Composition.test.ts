import { describe, it, expect } from 'vitest';
import { Composition } from '../../src/composition/Composition';
import { Track } from '../../src/composition/Track';
import { Voice } from '../../src/composition/Voice';
import { PatternBuilder } from '../../src/patterns/PatternBuilder';
import { C, D, E, F, G, A, B } from '../../src/primitives/Note';
import { BPM, Seconds } from '../../src/types/brands';
import { Durations } from '../../src/types/music';

describe('Composition', () => {
  describe('construction', () => {
    it('creates composition with default values', () => {
      const composition = new Composition('My Song');

      expect(composition.title).toBe('My Song');
      expect(composition.tempo).toBe(120);
      expect(composition.timeSignature).toEqual({ numerator: 4, denominator: 4 });
      expect(composition.tracks.length).toBe(0);
      expect(composition.isEmpty).toBe(true);
      expect(composition.trackCount).toBe(0);
    });

    it('creates composition with custom tempo', () => {
      const composition = new Composition('Fast Song', BPM(180));

      expect(composition.title).toBe('Fast Song');
      expect(composition.tempo).toBe(180);
      expect(composition.timeSignature).toEqual({ numerator: 4, denominator: 4 });
    });

    it('creates composition with custom time signature', () => {
      const composition = new Composition(
        'Waltz',
        BPM(120),
        { numerator: 3, denominator: 4 }
      );

      expect(composition.title).toBe('Waltz');
      expect(composition.tempo).toBe(120);
      expect(composition.timeSignature).toEqual({ numerator: 3, denominator: 4 });
    });

    it('creates composition with all custom parameters', () => {
      const composition = new Composition(
        'Progressive',
        BPM(140),
        { numerator: 7, denominator: 8 }
      );

      expect(composition.title).toBe('Progressive');
      expect(composition.tempo).toBe(140);
      expect(composition.timeSignature).toEqual({ numerator: 7, denominator: 8 });
    });

    it('freezes tracks array (immutability)', () => {
      const composition = new Composition('Test');
      expect(Object.isFrozen(composition.tracks)).toBe(true);
    });
  });

  describe('addTrack', () => {
    it('adds track to empty composition', () => {
      const composition = new Composition('Song');
      const track = new Track('Piano');
      const newComposition = composition.addTrack(track);

      // Original unchanged
      expect(composition.tracks.length).toBe(0);

      // New composition has track
      expect(newComposition.tracks.length).toBe(1);
      expect(newComposition.tracks[0]).toBe(track);
      expect(newComposition.title).toBe('Song');
      expect(newComposition.tempo).toBe(composition.tempo);
    });

    it('adds track to composition with existing tracks', () => {
      const track1 = new Track('Piano');
      const track2 = new Track('Strings');
      const track3 = new Track('Brass');

      const composition = new Composition('Symphony')
        .addTrack(track1)
        .addTrack(track2);
      const newComposition = composition.addTrack(track3);

      // Original unchanged
      expect(composition.tracks.length).toBe(2);

      // New composition has all tracks
      expect(newComposition.tracks.length).toBe(3);
      expect(newComposition.tracks[0]).toBe(track1);
      expect(newComposition.tracks[1]).toBe(track2);
      expect(newComposition.tracks[2]).toBe(track3);
    });

    it('can chain multiple addTrack calls', () => {
      const track1 = new Track('Piano');
      const track2 = new Track('Guitar');
      const track3 = new Track('Drums');

      const composition = new Composition('Rock Song')
        .addTrack(track1)
        .addTrack(track2)
        .addTrack(track3);

      expect(composition.tracks.length).toBe(3);
      expect(composition.tracks[0]).toBe(track1);
      expect(composition.tracks[1]).toBe(track2);
      expect(composition.tracks[2]).toBe(track3);
    });

    it('preserves composition properties when adding tracks', () => {
      const composition = new Composition('Song', BPM(140), { numerator: 3, denominator: 4 });
      const track = new Track('Piano');
      const newComposition = composition.addTrack(track);

      expect(newComposition.title).toBe('Song');
      expect(newComposition.tempo).toBe(140);
      expect(newComposition.timeSignature).toEqual({ numerator: 3, denominator: 4 });
    });
  });

  describe('withTempo', () => {
    it('changes tempo returning new composition', () => {
      const original = new Composition('Song', BPM(120));
      const faster = original.withTempo(BPM(180));

      // Original unchanged
      expect(original.tempo).toBe(120);

      // New composition has new tempo
      expect(faster.tempo).toBe(180);
      expect(faster.title).toBe('Song');
    });

    it('preserves tracks when changing tempo', () => {
      const track = new Track('Piano');
      const composition = new Composition('Song').addTrack(track);
      const newTempo = composition.withTempo(BPM(90));

      expect(newTempo.tracks.length).toBe(1);
      expect(newTempo.tracks[0]).toBe(track);
    });

    it('can chain tempo changes', () => {
      const composition = new Composition('Song', BPM(120))
        .withTempo(BPM(140))
        .withTempo(BPM(160));

      expect(composition.tempo).toBe(160);
    });
  });

  describe('withTimeSignature', () => {
    it('changes time signature returning new composition', () => {
      const original = new Composition('Song');
      const waltz = original.withTimeSignature({ numerator: 3, denominator: 4 });

      // Original unchanged
      expect(original.timeSignature).toEqual({ numerator: 4, denominator: 4 });

      // New composition has new time signature
      expect(waltz.timeSignature).toEqual({ numerator: 3, denominator: 4 });
      expect(waltz.title).toBe('Song');
    });

    it('preserves tracks when changing time signature', () => {
      const track = new Track('Piano');
      const composition = new Composition('Song').addTrack(track);
      const newSig = composition.withTimeSignature({ numerator: 5, denominator: 4 });

      expect(newSig.tracks.length).toBe(1);
      expect(newSig.tracks[0]).toBe(track);
    });

    it('supports various time signatures', () => {
      const composition = new Composition('Song');

      const threeFour = composition.withTimeSignature({ numerator: 3, denominator: 4 });
      expect(threeFour.timeSignature).toEqual({ numerator: 3, denominator: 4 });

      const sixEight = composition.withTimeSignature({ numerator: 6, denominator: 8 });
      expect(sixEight.timeSignature).toEqual({ numerator: 6, denominator: 8 });

      const sevenEight = composition.withTimeSignature({ numerator: 7, denominator: 8 });
      expect(sevenEight.timeSignature).toEqual({ numerator: 7, denominator: 8 });

      const fiveFour = composition.withTimeSignature({ numerator: 5, denominator: 4 });
      expect(fiveFour.timeSignature).toEqual({ numerator: 5, denominator: 4 });
    });
  });

  describe('duration calculation', () => {
    it('returns 0 for empty composition', () => {
      const composition = new Composition('Empty');
      expect(composition.duration).toBe(0);
    });

    it('calculates duration from single track with single voice', () => {
      const pattern = new PatternBuilder()
        .notes([C('4'), D('4'), E('4'), F('4')], Durations.quarter)
        .build();
      const voice = new Voice(pattern, 'piano');
      const track = new Track('Piano', [voice]);
      const composition = new Composition('Song').addTrack(track);

      expect(composition.duration).toBe(1.0); // 4 quarter notes = 1 whole note
    });

    it('calculates duration from multiple tracks (uses longest)', () => {
      const shortPattern = new PatternBuilder()
        .notes([C('4'), D('4')], Durations.quarter)
        .build();
      const longPattern = new PatternBuilder()
        .notes([C('4'), D('4'), E('4'), F('4'), G('4'), A('4')], Durations.quarter)
        .build();

      const shortTrack = new Track('Short', [new Voice(shortPattern, 'piano')]);
      const longTrack = new Track('Long', [new Voice(longPattern, 'strings')]);

      const composition = new Composition('Song')
        .addTrack(shortTrack)
        .addTrack(longTrack);

      expect(composition.duration).toBe(1.5); // 6 quarter notes = 1.5 whole notes
    });

    it('calculates duration from track with multiple voices (uses longest voice)', () => {
      const voice1Pattern = new PatternBuilder()
        .notes([C('4'), D('4')], Durations.quarter)
        .build();
      const voice2Pattern = new PatternBuilder()
        .notes([E('4'), F('4'), G('4'), A('4')], Durations.quarter)
        .build();

      const voice1 = new Voice(voice1Pattern, 'piano');
      const voice2 = new Voice(voice2Pattern, 'strings');
      const track = new Track('Multi', [voice1, voice2]);

      const composition = new Composition('Song').addTrack(track);

      expect(composition.duration).toBe(1.0); // 4 quarter notes = 1 whole note
    });

    it('handles tracks with empty voices', () => {
      const emptyTrack = new Track('Empty');
      const patternTrack = new Track('WithPattern', [
        new Voice(
          new PatternBuilder().notes([C('4'), D('4')], Durations.quarter).build(),
          'piano'
        ),
      ]);

      const composition = new Composition('Song')
        .addTrack(emptyTrack)
        .addTrack(patternTrack);

      expect(composition.duration).toBe(0.5); // 2 quarter notes
    });
  });

  describe('properties', () => {
    it('reports correct track count', () => {
      const composition = new Composition('Song');
      expect(composition.trackCount).toBe(0);

      const withOne = composition.addTrack(new Track('Piano'));
      expect(withOne.trackCount).toBe(1);

      const withTwo = withOne.addTrack(new Track('Strings'));
      expect(withTwo.trackCount).toBe(2);
    });

    it('reports isEmpty correctly', () => {
      const composition = new Composition('Song');
      expect(composition.isEmpty).toBe(true);

      const withTrack = composition.addTrack(new Track('Piano'));
      expect(withTrack.isEmpty).toBe(false);
    });
  });

  describe('complex compositions', () => {
    it('creates multi-track orchestral composition', () => {
      const melody = new Track('Melody', [
        new Voice(
          new PatternBuilder().notes([C('5'), D('5'), E('5'), F('5')]).build(),
          'flute'
        ),
      ]);

      const harmony = new Track('Harmony', [
        new Voice(
          new PatternBuilder().notes([E('4'), F('4'), G('4'), A('4')]).build(),
          'strings'
        ),
      ]);

      const bass = new Track('Bass', [
        new Voice(
          new PatternBuilder().notes([C('3'), C('3'), C('3'), C('3')]).build(),
          'cello'
        ),
      ]);

      const composition = new Composition('Symphony No. 1', BPM(120))
        .addTrack(melody)
        .addTrack(harmony)
        .addTrack(bass);

      expect(composition.trackCount).toBe(3);
      expect(composition.tempo).toBe(120);
      expect(composition.isEmpty).toBe(false);
    });

    it('creates composition with counterpoint (Bach-style)', () => {
      const upperVoice = new Voice(
        new PatternBuilder()
          .notes([D('5'), C('5'), D('5'), E('5'), F('5'), E('5')])
          .build(),
        'harpsichord'
      );

      const lowerVoice = new Voice(
        new PatternBuilder()
          .notes([D('4'), A('3'), F('4'), G('4'), A('4'), B('4')])
          .build(),
        'harpsichord'
      );

      const track = new Track('Two-Voice Invention', [upperVoice, lowerVoice]);
      const composition = new Composition('Invention No. 4 in D minor', BPM(96))
        .addTrack(track);

      expect(composition.trackCount).toBe(1);
      expect(composition.tracks[0].voiceCount).toBe(2);
      expect(composition.tempo).toBe(96);
    });

    it('chains all composition operations', () => {
      const track1 = new Track('Piano');
      const track2 = new Track('Strings');

      const composition = new Composition('Song', BPM(100))
        .withTempo(BPM(120))
        .withTimeSignature({ numerator: 3, denominator: 4 })
        .addTrack(track1)
        .addTrack(track2)
        .withTempo(BPM(140));

      expect(composition.title).toBe('Song');
      expect(composition.tempo).toBe(140);
      expect(composition.timeSignature).toEqual({ numerator: 3, denominator: 4 });
      expect(composition.trackCount).toBe(2);
    });
  });
});
