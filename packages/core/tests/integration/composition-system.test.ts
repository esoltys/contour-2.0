/**
 * Integration tests for the complete composition system (Phase 4).
 *
 * Tests the full stack:
 * - Voice
 * - Track
 * - Composition
 * - Multi-voice counterpoint
 */

import { describe, it, expect } from 'vitest';
import { Composition } from '../../src/composition/Composition';
import { Track } from '../../src/composition/Track';
import { Voice } from '../../src/composition/Voice';
import { PatternBuilder } from '../../src/patterns/PatternBuilder';
import { D, E, F, G, A, Bb, C } from '../../src/primitives/Note';
import { BPM } from '../../src/types/brands';
import { Durations } from '../../src/types/music';

describe('Composition System Integration (Phase 4)', () => {
  describe('simple two-voice composition', () => {
    it('creates and plays two independent voices', () => {
      const melody = new PatternBuilder()
        .notes([C('5'), D('5'), E('5'), F('5')], Durations.quarter)
        .build();

      const harmony = new PatternBuilder()
        .notes([C('4'), E('4'), G('4'), C('5')], Durations.quarter)
        .build();

      const melodyVoice = new Voice(melody, 'piano');
      const harmonyVoice = new Voice(harmony, 'strings');

      const track = new Track('Main', [melodyVoice, harmonyVoice]);
      const composition = new Composition('Simple Song', BPM(120))
        .addTrack(track);

      expect(composition.trackCount).toBe(1);
      expect(composition.tracks[0].voiceCount).toBe(2);
      expect(composition.duration).toBe(1.0); // 4 quarter notes
    });
  });

  describe('multi-track composition', () => {
    it('creates composition with multiple independent tracks', () => {
      const track1 = new Track('Piano', [
        new Voice(
          new PatternBuilder().notes([C('4'), D('4')], Durations.quarter).build(),
          'piano'
        ),
      ]);

      const track2 = new Track('Strings', [
        new Voice(
          new PatternBuilder().notes([E('4'), F('4')], Durations.quarter).build(),
          'strings'
        ),
      ]);

      const track3 = new Track('Drums', [
        new Voice(
          new PatternBuilder().notes([G('3'), A('3')], Durations.quarter).build(),
          'drums'
        ),
      ]);

      const composition = new Composition('Orchestra', BPM(140))
        .addTrack(track1)
        .addTrack(track2)
        .addTrack(track3);

      expect(composition.trackCount).toBe(3);
      expect(composition.tracks[0].name).toBe('Piano');
      expect(composition.tracks[1].name).toBe('Strings');
      expect(composition.tracks[2].name).toBe('Drums');
    });
  });

  describe('Bach-style two-voice counterpoint (ACCEPTANCE TEST)', () => {
    /**
     * Simplified Bach Invention-style composition.
     * Demonstrates:
     * - Two independent voices
     * - D minor tonality
     * - Voice independence (lower voice enters after rest)
     * - Proper timing synchronization
     */
    it('creates Bach-style two-voice invention', () => {
      // Upper voice: starts immediately with sixteenth-note figuration
      const upperPattern = new PatternBuilder()
        .note(D('5'), Durations.sixteenth)
        .note(C('5'), Durations.sixteenth)
        .note(D('5'), Durations.sixteenth)
        .note(E('5'), Durations.sixteenth)
        .note(F('5'), Durations.sixteenth)
        .note(E('5'), Durations.sixteenth)
        .note(F('5'), Durations.sixteenth)
        .note(G('5'), Durations.sixteenth)
        .note(A('5'), Durations.sixteenth)
        .note(G('5'), Durations.sixteenth)
        .note(F('5'), Durations.sixteenth)
        .note(E('5'), Durations.sixteenth)
        .note(D('5'), Durations.sixteenth)
        .note(C('5'), Durations.sixteenth)
        .note(Bb('4'), Durations.sixteenth)
        .note(A('4'), Durations.sixteenth)
        .build();

      // Lower voice: rests first, then enters with answer
      const lowerPattern = new PatternBuilder()
        .rest(Durations.half) // Rest for 2 beats
        .note(D('4'), Durations.sixteenth)
        .note(C('4'), Durations.sixteenth)
        .note(D('4'), Durations.sixteenth)
        .note(E('4'), Durations.sixteenth)
        .note(F('4'), Durations.sixteenth)
        .note(E('4'), Durations.sixteenth)
        .note(F('4'), Durations.sixteenth)
        .note(G('4'), Durations.sixteenth)
        .build();

      const upperVoice = new Voice(upperPattern, 'harpsichord');
      const lowerVoice = new Voice(lowerPattern, 'harpsichord');

      const track = new Track('Two-Voice Invention', [upperVoice, lowerVoice]);
      const invention = new Composition('Invention in D minor', BPM(96))
        .addTrack(track);

      // Verify structure
      expect(invention.trackCount).toBe(1);
      expect(invention.tracks[0].voiceCount).toBe(2);

      // Verify voice independence
      const firstUpper = upperPattern.events[0];
      const firstLower = lowerPattern.events[0];

      expect(firstUpper.type).toBe('note');
      expect(firstLower.type).toBe('rest');

      // Verify timing
      expect(firstUpper.time).toBe(0);
      expect(firstLower.time).toBe(0);

      // Verify D minor tonality
      if (firstUpper.type === 'note') {
        expect(firstUpper.note.name).toBe('D5');
      }
    });

    it('maintains voice independence under transformations', () => {
      const upper = new Voice(
        new PatternBuilder().notes([D('5'), E('5'), F('5')]).build(),
        'piano'
      );
      const lower = new Voice(
        new PatternBuilder().notes([D('4'), E('4'), F('4')]).build(),
        'piano'
      );

      const track = new Track('Counterpoint', [upper, lower]);
      const composition = new Composition('Test').addTrack(track);

      // Transform the entire composition
      const transposed = composition.tracks[0].transform(v =>
        v.transform(p => p.transpose(2))
      );

      // Original unchanged
      const origFirstUpper = composition.tracks[0].voices[0].pattern.events[0];
      if (origFirstUpper.type === 'note') {
        expect(origFirstUpper.pitch).toBe(74); // D5
      }

      // Transformed is different
      const transFirstUpper = transposed.voices[0].pattern.events[0];
      if (transFirstUpper.type === 'note') {
        expect(transFirstUpper.pitch).toBe(76); // E5
      }
    });

    it('calculates duration correctly for staggered voices', () => {
      const shortVoice = new Voice(
        new PatternBuilder()
          .notes([C('4'), D('4')], Durations.quarter)
          .build(),
        'piano'
      );

      const longVoice = new Voice(
        new PatternBuilder()
          .notes([E('4'), F('4'), G('4'), A('4'), C('5'), D('5')], Durations.quarter)
          .build(),
        'strings'
      );

      const track = new Track('Mixed', [shortVoice, longVoice]);
      const composition = new Composition('Test').addTrack(track);

      // Duration should be the longest voice (6 quarter notes = 1.5)
      expect(composition.duration).toBe(1.5);
    });
  });

  describe('complex orchestral composition', () => {
    it('creates multi-track, multi-voice orchestral piece', () => {
      // Strings section - multiple voices
      const violins1 = new Voice(
        new PatternBuilder().notes([E('5'), F('5'), G('5')]).build(),
        'violin'
      );
      const violins2 = new Voice(
        new PatternBuilder().notes([C('5'), D('5'), E('5')]).build(),
        'violin'
      );
      const violas = new Voice(
        new PatternBuilder().notes([G('4'), A('4'), C('5')]).build(),
        'viola'
      );
      const cellos = new Voice(
        new PatternBuilder().notes([C('4'), E('4'), G('4')]).build(),
        'cello'
      );

      const stringsTrack = new Track('Strings', [
        violins1,
        violins2,
        violas,
        cellos,
      ]);

      // Woodwinds section
      const flute = new Voice(
        new PatternBuilder().notes([G('5'), A('5')]).build(),
        'flute'
      );
      const clarinet = new Voice(
        new PatternBuilder().notes([E('5'), F('5')]).build(),
        'clarinet'
      );

      const woodwindsTrack = new Track('Woodwinds', [flute, clarinet]);

      // Brass section
      const trumpet = new Voice(
        new PatternBuilder().notes([C('5'), E('5')]).build(),
        'trumpet'
      );

      const brassTrack = new Track('Brass', [trumpet]);

      // Create full orchestral composition
      const symphony = new Composition('Symphony No. 1', BPM(120))
        .addTrack(stringsTrack)
        .addTrack(woodwindsTrack)
        .addTrack(brassTrack);

      expect(symphony.trackCount).toBe(3);
      expect(symphony.tracks[0].voiceCount).toBe(4); // Strings
      expect(symphony.tracks[1].voiceCount).toBe(2); // Woodwinds
      expect(symphony.tracks[2].voiceCount).toBe(1); // Brass

      // Total of 7 voices across 3 tracks
      const totalVoices = symphony.tracks.reduce(
        (sum, track) => sum + track.voiceCount,
        0
      );
      expect(totalVoices).toBe(7);
    });
  });

  describe('immutability throughout the stack', () => {
    it('maintains immutability from Voice to Composition', () => {
      const voice = new Voice(
        new PatternBuilder().notes([C('4'), D('4')]).build(),
        'piano'
      );
      const track = new Track('Piano', [voice]);
      const composition = new Composition('Song').addTrack(track);

      // Transform at composition level
      const newTrack = composition.tracks[0].transform(v =>
        v.transform(p => p.transpose(5))
      );

      // Original composition unchanged
      expect(composition.tracks[0].voices[0]).toBe(voice);

      // New track has transformed voice
      expect(newTrack.voices[0]).not.toBe(voice);
      expect(newTrack.voices[0].pattern).not.toBe(voice.pattern);
    });

    it('allows building complex compositions through chaining', () => {
      const composition = new Composition('Epic', BPM(140))
        .withTimeSignature({ numerator: 5, denominator: 4 })
        .addTrack(
          new Track('Piano', [
            new Voice(
              new PatternBuilder().notes([C('4'), D('4')]).build(),
              'piano'
            ),
          ])
        )
        .addTrack(
          new Track('Strings', [
            new Voice(
              new PatternBuilder().notes([E('4'), F('4')]).build(),
              'strings'
            ),
          ])
        )
        .withTempo(BPM(160));

      expect(composition.trackCount).toBe(2);
      expect(composition.tempo).toBe(160);
      expect(composition.timeSignature).toEqual({ numerator: 5, denominator: 4 });
    });
  });

  describe('Phase 4 acceptance criteria', () => {
    it('✓ Multi-track composition works', () => {
      const track1 = new Track('Track1');
      const track2 = new Track('Track2');
      const composition = new Composition('Test')
        .addTrack(track1)
        .addTrack(track2);

      expect(composition.trackCount).toBe(2);
    });

    it('✓ Multi-voice tracks work', () => {
      const voice1 = new Voice(new PatternBuilder().note(C('4')).build(), 'piano');
      const voice2 = new Voice(new PatternBuilder().note(E('4')).build(), 'strings');
      const track = new Track('Multi', [voice1, voice2]);

      expect(track.voiceCount).toBe(2);
    });

    it('✓ Voice independence (no timing drift)', () => {
      const voice1 = new Voice(
        new PatternBuilder().notes([C('4'), D('4'), E('4')], Durations.quarter).build(),
        'piano'
      );
      const voice2 = new Voice(
        new PatternBuilder().notes([G('3'), A('3'), C('4')], Durations.quarter).build(),
        'piano'
      );

      const track = new Track('Test', [voice1, voice2]);

      expect(voice1.pattern.duration).toBe(0.75);
      expect(voice2.pattern.duration).toBe(0.75);
    });

    it('✓ Composition calculates duration correctly', () => {
      const composition = new Composition('Test').addTrack(
        new Track('Track', [
          new Voice(
            new PatternBuilder()
              .notes([C('4'), D('4'), E('4'), F('4')], Durations.quarter)
              .build(),
            'piano'
          ),
        ])
      );

      expect(composition.duration).toBe(1.0);
    });

    it('✓ Bach Invention-style composition is possible', () => {
      const upperVoice = new Voice(
        new PatternBuilder()
          .notes([D('5'), C('5'), D('5'), E('5')], Durations.sixteenth)
          .build(),
        'harpsichord'
      );

      const lowerVoice = new Voice(
        new PatternBuilder()
          .rest(Durations.half)
          .notes([D('4'), C('4'), D('4'), E('4')], Durations.sixteenth)
          .build(),
        'harpsichord'
      );

      const invention = new Composition('Invention', BPM(96)).addTrack(
        new Track('Two-Voice', [upperVoice, lowerVoice])
      );

      expect(invention.trackCount).toBe(1);
      expect(invention.tracks[0].voiceCount).toBe(2);
      expect(invention.tempo).toBe(96);
    });
  });
});
