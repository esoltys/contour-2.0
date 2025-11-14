/**
 * Integration tests for Scale and Pattern interaction.
 */

import { describe, it, expect } from 'vitest';
import { Scale } from '../../src/theory/Scale';
import { PatternBuilder } from '../../src/patterns/PatternBuilder';
import type { NoteEvent } from '../../src/primitives/Event';

describe('Scale + Pattern Integration', () => {
  describe('Pattern.inScale', () => {
    it('quantizes chromatic pattern to major scale', () => {
      const chromatic = new PatternBuilder()
        .notes(['C4', 'C#4', 'D4', 'D#4', 'E4'])
        .build();

      const cMajor = new Scale('C4', 'major');
      const quantized = chromatic.inScale(cMajor);

      const pitches = quantized.events.map((e) => (e as NoteEvent).note.name);

      // C#4 should snap to D4 (nearest scale tone)
      // D#4 should snap to E4 (nearest scale tone)
      expect(pitches).toEqual(['C4', 'D4', 'D4', 'E4', 'E4']);
    });

    it('quantizes to minor scale', () => {
      const pattern = new PatternBuilder()
        .notes(['A4', 'A#4', 'B4', 'C5', 'C#5'])
        .build();

      const aMinor = new Scale('A4', 'minor');
      const quantized = pattern.inScale(aMinor);

      const pitches = quantized.events.map((e) => (e as NoteEvent).note.name);

      // A# should snap to B (minor 2nd)
      // C# should snap to C or D (nearest scale tones)
      expect(pitches.every((p) => ['A4', 'B4', 'C5', 'D5', 'E5'].includes(p))).toBe(true);
    });

    it('quantizes to pentatonic scale', () => {
      const pattern = new PatternBuilder()
        .notes(['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'])
        .build();

      const cPentatonic = new Scale('C4', 'majorPentatonic');
      const quantized = pattern.inScale(cPentatonic);

      const pitches = quantized.events.map((e) => (e as NoteEvent).note.name);

      // F and B should be removed (not in pentatonic)
      // F → E or G, B → A or C
      const pentatonicNotes = ['C4', 'D4', 'E4', 'G4', 'A4', 'C5'];
      expect(pitches.every((p) => pentatonicNotes.includes(p))).toBe(true);
    });

    it('preserves timing and velocity', () => {
      const pattern = new PatternBuilder()
        .notes(['C4', 'C#4', 'D4'])
        .build();

      const cMajor = new Scale('C4', 'major');
      const quantized = pattern.inScale(cMajor);

      // Timing should be preserved
      expect(quantized.events[0].time).toBe(pattern.events[0].time);
      expect(quantized.events[1].time).toBe(pattern.events[1].time);

      // Velocity should be preserved
      expect(quantized.events[0].velocity).toBe(pattern.events[0].velocity);
    });

    it('does not modify rests', () => {
      const pattern = new PatternBuilder()
        .note('C4')
        .rest()
        .note('C#4')
        .build();

      const cMajor = new Scale('C4', 'major');
      const quantized = pattern.inScale(cMajor);

      expect(quantized.events[1].type).toBe('rest');
    });

    it('handles patterns with chords', () => {
      const pattern = new PatternBuilder()
        .chord(['C4', 'E4', 'G#4']) // G# is not in C major
        .build();

      const cMajor = new Scale('C4', 'major');
      const quantized = pattern.inScale(cMajor);

      const chordEvent = quantized.events[0];
      expect(chordEvent.type).toBe('chord');

      // G# should snap to G or A
      if (chordEvent.type === 'chord') {
        const noteNames = chordEvent.notes.map((n) => n.name);
        expect(noteNames.every((n) => ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'].includes(n))).toBe(true);
      }
    });

    it('works with different octaves', () => {
      const pattern = new PatternBuilder()
        .notes(['C3', 'C#5', 'D6'])
        .build();

      const cMajor = new Scale('C4', 'major');
      const quantized = pattern.inScale(cMajor);

      // Should find nearest scale tones even across octaves
      expect(quantized.events).toHaveLength(3);
      expect(quantized.events[0].type).toBe('note');
    });

    it('is immutable - does not modify original pattern', () => {
      const original = new PatternBuilder()
        .notes(['C4', 'C#4', 'D4'])
        .build();

      const originalPitches = original.events.map((e) => (e as NoteEvent).pitch);

      const cMajor = new Scale('C4', 'major');
      original.inScale(cMajor);

      // Original should be unchanged
      expect(original.events.map((e) => (e as NoteEvent).pitch)).toEqual(originalPitches);
    });
  });

  describe('Pattern transformations after quantization', () => {
    it('can transpose quantized pattern', () => {
      const pattern = new PatternBuilder()
        .notes(['C4', 'C#4', 'D4'])
        .build();

      const cMajor = new Scale('C4', 'major');
      const quantized = pattern.inScale(cMajor);
      const transposed = quantized.transpose(2);

      expect(transposed.events).toHaveLength(3);
      expect(transposed.events[0].type).toBe('note');
    });

    it('can apply fast/slow to quantized pattern', () => {
      const pattern = new PatternBuilder()
        .notes(['C4', 'D4', 'E4'])
        .build();

      const cMajor = new Scale('C4', 'major');
      const quantized = pattern.inScale(cMajor).fast(2);

      expect(quantized.events[0].duration).toBeLessThan(pattern.events[0].duration);
    });

    it('can chain multiple transformations', () => {
      const pattern = new PatternBuilder()
        .notes(['C4', 'C#4', 'D4', 'D#4'])
        .build();

      const cMajor = new Scale('C4', 'major');
      const result = pattern
        .inScale(cMajor)
        .transpose(5)
        .fast(2)
        .retrograde();

      expect(result.events).toHaveLength(4);
    });
  });
});
