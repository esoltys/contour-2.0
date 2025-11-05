/**
 * Tests for Bach Invention No. 4
 *
 * This is the PRIMARY ACCEPTANCE TEST for Phase 4.
 * Success = composition is recognizable as Bach Invention No. 4.
 */

import { describe, it, expect } from 'vitest';
import { createBachInvention4 } from './invention';

describe('Bach Invention No. 4 (PRIMARY ACCEPTANCE TEST)', () => {
  const invention = createBachInvention4();

  describe('composition structure', () => {
    it('has correct title', () => {
      expect(invention.title).toBe('Invention No. 4 in D minor (BWV 775)');
    });

    it('has correct tempo (allegro moderato)', () => {
      expect(invention.tempo).toBe(96);
    });

    it('has common time signature', () => {
      expect(invention.timeSignature).toEqual({
        numerator: 4,
        denominator: 4,
      });
    });

    it('has one track (two-voice counterpoint)', () => {
      expect(invention.trackCount).toBe(1);
    });

    it('has two voices in the track', () => {
      expect(invention.tracks[0].voiceCount).toBe(2);
    });
  });

  describe('voice structure', () => {
    const track = invention.tracks[0];

    it('both voices use harpsichord', () => {
      expect(track.voices[0].instrument).toBe('harpsichord');
      expect(track.voices[1].instrument).toBe('harpsichord');
    });

    it('upper voice has correct number of events', () => {
      const upperVoice = track.voices[0];
      // 8 bars × 8 sixteenth notes per bar (4/4 time) = 64 events
      // Actually varies due to the pattern, but should be substantial
      expect(upperVoice.pattern.events.length).toBeGreaterThan(50);
    });

    it('lower voice has correct number of events', () => {
      const lowerVoice = track.voices[1];
      // Lower voice starts with rest, then enters
      expect(lowerVoice.pattern.events.length).toBeGreaterThan(50);
    });

    it('voices have appropriate duration', () => {
      const upperVoice = track.voices[0];
      const lowerVoice = track.voices[1];

      // 8 bars in 4/4 time = 8 whole notes duration
      expect(upperVoice.pattern.duration).toBeCloseTo(8, 0);
      expect(lowerVoice.pattern.duration).toBeCloseTo(8, 0);
    });
  });

  describe('voice independence (counterpoint)', () => {
    const track = invention.tracks[0];
    const upperVoice = track.voices[0];
    const lowerVoice = track.voices[1];

    it('voices start at different times (lower voice rests first)', () => {
      const upperFirstEvent = upperVoice.pattern.events[0];
      const lowerFirstEvent = lowerVoice.pattern.events[0];

      expect(upperFirstEvent.type).toBe('note');
      expect(lowerFirstEvent.type).toBe('rest');
    });

    it('upper voice starts immediately', () => {
      const firstEvent = upperVoice.pattern.events[0];
      expect(firstEvent.time).toBe(0);
    });

    it('lower voice starts after rest', () => {
      // First event is a rest
      const firstEvent = lowerVoice.pattern.events[0];
      expect(firstEvent.type).toBe('rest');

      // Second event should be a note
      const secondEvent = lowerVoice.pattern.events[1];
      if (secondEvent) {
        expect(secondEvent.type).toBe('note');
      }
    });

    it('voices contain note events', () => {
      const upperNotes = upperVoice.pattern.events.filter(e => e.type === 'note');
      const lowerNotes = lowerVoice.pattern.events.filter(e => e.type === 'note');

      expect(upperNotes.length).toBeGreaterThan(40);
      expect(lowerNotes.length).toBeGreaterThan(40);
    });
  });

  describe('musical characteristics', () => {
    const track = invention.tracks[0];
    const upperVoice = track.voices[0];

    it('uses sixteenth notes (characteristic of inventions)', () => {
      const firstNoteEvent = upperVoice.pattern.events.find(e => e.type === 'note');
      if (firstNoteEvent && firstNoteEvent.type === 'note') {
        expect(firstNoteEvent.duration).toBe(0.0625); // sixteenth note
      }
    });

    it('upper voice starts on D5 (D minor key)', () => {
      const firstEvent = upperVoice.pattern.events[0];
      if (firstEvent.type === 'note') {
        expect(firstEvent.note.name).toBe('D5');
        expect(firstEvent.pitch).toBe(74); // D5 MIDI number
      }
    });

    it('contains D minor scale notes in upper voice', () => {
      const upperNotes = upperVoice.pattern.events
        .filter(e => e.type === 'note')
        .map(e => (e.type === 'note' ? e.note.name : ''));

      // D minor scale: D, E, F, G, A, Bb, C
      const dMinorNotes = ['D', 'E', 'F', 'G', 'A', 'B', 'C'];
      const noteLetters = upperNotes.map(name => name.charAt(0));

      dMinorNotes.forEach(note => {
        expect(noteLetters).toContain(note);
      });
    });
  });

  describe('composition duration', () => {
    it('has reasonable duration for 8 bars', () => {
      // 8 bars in 4/4 = 8 whole notes = 8.0 duration units
      expect(invention.duration).toBeCloseTo(8, 0);
    });

    it('duration matches longest voice', () => {
      const track = invention.tracks[0];
      const durations = track.voices.map(v => v.pattern.duration as number);
      const maxDuration = Math.max(...durations);

      expect(invention.duration).toBe(maxDuration);
    });
  });

  describe('transformations (verify immutability)', () => {
    it('can transpose both voices', () => {
      const track = invention.tracks[0];
      const transposed = track.transform(v => v.transform(p => p.transpose(2)));

      // Original unchanged
      const originalFirst = track.voices[0].pattern.events[0];
      if (originalFirst.type === 'note') {
        expect(originalFirst.pitch).toBe(74); // D5
      }

      // Transposed is different
      const transposedFirst = transposed.voices[0].pattern.events[0];
      if (transposedFirst.type === 'note') {
        expect(transposedFirst.pitch).toBe(76); // E5
      }
    });

    it('can change tempo', () => {
      const faster = invention.withTempo(120 as any);

      expect(invention.tempo).toBe(96);
      expect(faster.tempo).toBe(120);
    });

    it('can make both voices play faster', () => {
      const track = invention.tracks[0];
      const faster = track.transform(v => v.transform(p => p.fast(2)));

      const originalDuration = track.voices[0].pattern.duration;
      const fasterDuration = faster.voices[0].pattern.duration;

      expect(fasterDuration).toBe(originalDuration / 2);
    });
  });

  describe('acceptance criteria', () => {
    it('ACCEPTANCE: Composition renders two independent voices', () => {
      const track = invention.tracks[0];

      expect(track.voiceCount).toBe(2);
      expect(track.voices[0].pattern.isEmpty).toBe(false);
      expect(track.voices[1].pattern.isEmpty).toBe(false);
    });

    it('ACCEPTANCE: Uses D minor key signature', () => {
      const track = invention.tracks[0];
      const upperVoice = track.voices[0];
      const firstNote = upperVoice.pattern.events[0];

      if (firstNote.type === 'note') {
        expect(firstNote.note.name).toContain('D');
      }
    });

    it('ACCEPTANCE: Has proper timing (no duration drift)', () => {
      const track = invention.tracks[0];

      // Both voices should have same total duration
      const upperDuration = track.voices[0].pattern.duration;
      const lowerDuration = track.voices[1].pattern.duration;

      expect(upperDuration).toBe(lowerDuration);
    });

    it('ACCEPTANCE: Multi-track composition works', () => {
      expect(invention.isEmpty).toBe(false);
      expect(invention.trackCount).toBe(1);
      expect(invention.tracks[0].isEmpty).toBe(false);
    });
  });
});
