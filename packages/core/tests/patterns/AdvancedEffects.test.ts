// packages/core/tests/patterns/AdvancedEffects.test.ts

import { describe, it, expect } from 'vitest';
import { Pattern } from '../../src/patterns/Pattern.js';
import { PatternBuilder } from '../../src/patterns/PatternBuilder.js';
import { Duration, Seconds, Velocity, MIDINote } from '../../src/types/brands.js';
import { Note, C, E, G } from '../../src/primitives/Note.js';
import type { Event, NoteEvent, ChordEvent } from '../../src/primitives/Event.js';
import { parseChord } from '../../src/patterns/chordParser.js';

describe('Advanced Effects', () => {
  // ============================================================================
  // STACCATO
  // ============================================================================
  describe('staccato()', () => {
    it('should shorten note durations by default factor (0.5)', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), Duration(1.0))
        .note(new Note('E4'), Duration(1.0))
        .build();

      const staccato = pattern.staccato();

      expect(staccato.events[0].duration).toBe(0.5);
      expect(staccato.events[1].duration).toBe(0.5);
    });

    it('should shorten note durations by custom factor', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), Duration(1.0))
        .build();

      const veryStaccato = pattern.staccato(0.25);

      expect(veryStaccato.events[0].duration).toBe(0.25);
    });

    it('should maintain original pattern unchanged (immutability)', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), Duration(1.0))
        .build();

      const originalDuration = pattern.events[0].duration;
      pattern.staccato(0.5);

      expect(pattern.events[0].duration).toBe(originalDuration);
    });

    it('should throw error for invalid factor', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), Duration(1.0))
        .build();

      expect(() => pattern.staccato(0)).toThrow(RangeError);
      expect(() => pattern.staccato(1.5)).toThrow(RangeError);
      expect(() => pattern.staccato(-0.5)).toThrow(RangeError);
    });

    it('should preserve timing (start times)', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), Duration(0.5))
        .note(new Note('E4'), Duration(0.5))
        .build();

      const staccato = pattern.staccato(0.5);

      expect(staccato.events[0].time).toBe(0);
      expect(staccato.events[1].time).toBe(0.5);
    });
  });

  // ============================================================================
  // LEGATO
  // ============================================================================
  describe('legato()', () => {
    it('should extend note durations to overlap by default amount', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 0.5)
        .note(new Note('E4'), 0.5)
        .build();

      const legato = pattern.legato();

      // First note should extend to reach second note + 0.1 overlap
      expect(legato.events[0].duration).toBeCloseTo(0.6, 2);
    });

    it('should extend with custom overlap amount', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 0.5)
        .note(new Note('E4'), 0.5)
        .build();

      const legato = pattern.legato(0.2);

      expect(legato.events[0].duration).toBeCloseTo(0.7, 2);
    });

    it('should maintain original pattern unchanged (immutability)', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 0.5)
        .build();

      const originalDuration = pattern.events[0].duration;
      pattern.legato(0.1);

      expect(pattern.events[0].duration).toBe(originalDuration);
    });

    it('should throw error for negative overlap', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 0.5)
        .build();

      expect(() => pattern.legato(-0.1)).toThrow(RangeError);
    });
  });

  // ============================================================================
  // CRESCENDO
  // ============================================================================
  describe('crescendo()', () => {
    it('should gradually increase velocity', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 0.25, Velocity(50))
        .note(new Note('E4'), 0.25, Velocity(50))
        .note(new Note('G4'), 0.25, Velocity(50))
        .note(new Note('C5'), 0.25, Velocity(50))
        .build();

      const crescendo = pattern.crescendo(Velocity(40), Velocity(100));

      expect(crescendo.events[0].velocity).toBe(40);
      expect(crescendo.events[3].velocity).toBe(100);
      // Middle values should be interpolated
      expect(crescendo.events[1].velocity).toBeGreaterThan(40);
      expect(crescendo.events[1].velocity).toBeLessThan(100);
    });

    it('should use pattern minimum as default start velocity', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 0.25, Velocity(60))
        .note(new Note('E4'), 0.25, Velocity(70))
        .build();

      const crescendo = pattern.crescendo();

      expect(crescendo.events[0].velocity).toBe(60); // Minimum from pattern
      expect(crescendo.events[1].velocity).toBe(127); // Default maximum
    });

    it('should maintain original pattern unchanged', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 0.25, Velocity(50))
        .build();

      const originalVelocity = pattern.events[0].velocity;
      pattern.crescendo();

      expect(pattern.events[0].velocity).toBe(originalVelocity);
    });

    it('should not affect rest events', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 0.25, Velocity(50))
        .rest(Duration(0.25))
        .note(new Note('E4'), 0.25, Velocity(50))
        .build();

      const crescendo = pattern.crescendo(Velocity(40), Velocity(100));

      expect(crescendo.events[1].type).toBe('rest');
    });
  });

  // ============================================================================
  // DIMINUENDO
  // ============================================================================
  describe('diminuendo()', () => {
    it('should gradually decrease velocity', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 0.25, Velocity(100))
        .note(new Note('E4'), 0.25, Velocity(100))
        .note(new Note('G4'), 0.25, Velocity(100))
        .note(new Note('C5'), 0.25, Velocity(100))
        .build();

      const diminuendo = pattern.diminuendo(Velocity(100), Velocity(40));

      expect(diminuendo.events[0].velocity).toBe(100);
      expect(diminuendo.events[3].velocity).toBe(40);
      // Middle values should be interpolated
      expect(diminuendo.events[1].velocity).toBeGreaterThan(40);
      expect(diminuendo.events[1].velocity).toBeLessThan(100);
    });

    it('should use default values correctly', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 0.25, Velocity(60))
        .note(new Note('E4'), 0.25, Velocity(70))
        .build();

      const diminuendo = pattern.diminuendo();

      expect(diminuendo.events[0].velocity).toBe(127); // Default start
      expect(diminuendo.events[1].velocity).toBe(60); // Minimum from pattern
    });

    it('should maintain original pattern unchanged', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 0.25, Velocity(100))
        .build();

      const originalVelocity = pattern.events[0].velocity;
      pattern.diminuendo();

      expect(pattern.events[0].velocity).toBe(originalVelocity);
    });
  });

  // ============================================================================
  // ACCENT
  // ============================================================================
  describe('accent()', () => {
    it('should accent specified beat indices', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 0.25, Velocity(80))
        .note(new Note('E4'), 0.25, Velocity(80))
        .note(new Note('G4'), 0.25, Velocity(80))
        .note(new Note('C5'), 0.25, Velocity(80))
        .build();

      const accented = pattern.accent([0, 2], 20);

      expect(accented.events[0].velocity).toBe(100); // 80 + 20
      expect(accented.events[1].velocity).toBe(80);  // Unchanged
      expect(accented.events[2].velocity).toBe(100); // 80 + 20
      expect(accented.events[3].velocity).toBe(80);  // Unchanged
    });

    it('should accent using predicate function', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 0.25, Velocity(80))
        .note(new Note('E4'), 0.25, Velocity(80))
        .note(new Note('G4'), 0.25, Velocity(80))
        .note(new Note('C5'), 0.25, Velocity(80))
        .build();

      // Accent every other note
      const accented = pattern.accent((i) => i % 2 === 0, 20);

      expect(accented.events[0].velocity).toBe(100);
      expect(accented.events[1].velocity).toBe(80);
      expect(accented.events[2].velocity).toBe(100);
      expect(accented.events[3].velocity).toBe(80);
    });

    it('should use default accent amount', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 0.25, Velocity(80))
        .build();

      const accented = pattern.accent([0]);

      expect(accented.events[0].velocity).toBe(100); // 80 + 20 (default)
    });

    it('should cap velocity at 127', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 0.25, Velocity(120))
        .build();

      const accented = pattern.accent([0], 50);

      expect(accented.events[0].velocity).toBe(127); // Capped at maximum
    });

    it('should not accent rest events', () => {
      const pattern = new PatternBuilder()
        .rest(Duration(0.25))
        .note(new Note('E4'), 0.25, Velocity(80))
        .build();

      const accented = pattern.accent([0, 1], 20);

      expect(accented.events[0].type).toBe('rest');
      expect(accented.events[1].velocity).toBe(100);
    });
  });

  // ============================================================================
  // HUMANIZE
  // ============================================================================
  describe('humanize()', () => {
    it('should add timing variations', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 0.25)
        .note(new Note('E4'), 0.25)
        .note(new Note('G4'), 0.25)
        .build();

      const humanized = pattern.humanize({ timing: 0.05, seed: 12345 });

      // Times should be different (but close) due to humanization
      expect(humanized.events[0].time).not.toBe(0);
      expect(humanized.events[1].time).not.toBe(0.25);
      expect(humanized.events[2].time).not.toBe(0.5);

      // But still within range
      expect(humanized.events[0].time).toBeGreaterThanOrEqual(0);
      expect(humanized.events[0].time).toBeLessThan(0.1);
    });

    it('should add velocity variations', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 0.25, Velocity(80))
        .note(new Note('E4'), 0.25, Velocity(80))
        .note(new Note('G4'), 0.25, Velocity(80))
        .build();

      const humanized = pattern.humanize({ velocity: 15, seed: 12345 });

      // Velocities should be varied
      const velocities = humanized.events.map(e => e.velocity);
      const allSame = velocities.every(v => v === 80);
      expect(allSame).toBe(false);

      // But still within reasonable range
      velocities.forEach(v => {
        expect(v).toBeGreaterThanOrEqual(65);
        expect(v).toBeLessThanOrEqual(95);
      });
    });

    it('should use seed for reproducibility', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 0.25)
        .note(new Note('E4'), 0.25)
        .build();

      const humanized1 = pattern.humanize({ seed: 99999 });
      const humanized2 = pattern.humanize({ seed: 99999 });

      expect(humanized1.events[0].time).toBe(humanized2.events[0].time);
      expect(humanized1.events[0].velocity).toBe(humanized2.events[0].velocity);
    });

    it('should not affect rest events', () => {
      const pattern = new PatternBuilder()
        .rest(Duration(0.25))
        .note(new Note('E4'), 0.25)
        .build();

      const humanized = pattern.humanize({ seed: 12345 });

      expect(humanized.events[0].type).toBe('rest');
    });

    it('should keep velocities within MIDI range', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 0.25, Velocity(10))  // Low velocity
        .note(new Note('E4'), 0.25, Velocity(120)) // High velocity
        .build();

      const humanized = pattern.humanize({ velocity: 50, seed: 12345 });

      humanized.events.forEach(event => {
        if (event.type !== 'rest') {
          expect(event.velocity).toBeGreaterThanOrEqual(1);
          expect(event.velocity).toBeLessThanOrEqual(127);
        }
      });
    });
  });

  // ============================================================================
  // SWING
  // ============================================================================
  describe('swing()', () => {
    it('should delay alternating notes', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 0.5) // Beat 0 (on)
        .note(new Note('E4'), 0.5) // Beat 0.5 (off)
        .note(new Note('G4'), 0.5) // Beat 1 (on)
        .note(new Note('C5'), 0.5) // Beat 1.5 (off)
        .build();

      const swung = pattern.swing(0.5, 2);

      // On-beats unchanged
      expect(swung.events[0].time).toBe(0);
      expect(swung.events[2].time).toBe(1.0);

      // Off-beats delayed
      expect(swung.events[1].time).toBeGreaterThan(0.5);
      expect(swung.events[3].time).toBeGreaterThan(1.5);
    });

    it('should apply different swing amounts', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 0.5)
        .note(new Note('E4'), 0.5)
        .build();

      const subtle = pattern.swing(0.3);
      const extreme = pattern.swing(0.8);

      const subtleDelay = subtle.events[1].time - 0.5;
      const extremeDelay = extreme.events[1].time - 0.5;

      expect(extremeDelay).toBeGreaterThan(subtleDelay);
    });

    it('should throw error for invalid swing amount', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 0.5)
        .build();

      expect(() => pattern.swing(-0.1)).toThrow(RangeError);
      expect(() => pattern.swing(1.5)).toThrow(RangeError);
    });

    it('should maintain original pattern unchanged', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 0.5)
        .note(new Note('E4'), 0.5)
        .build();

      const originalTime = pattern.events[1].time;
      pattern.swing(0.5);

      expect(pattern.events[1].time).toBe(originalTime);
    });
  });

  // ============================================================================
  // TREMOLO
  // ============================================================================
  describe('tremolo()', () => {
    it('should repeat notes at specified rate', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 1.0)
        .build();

      const tremolo = pattern.tremolo(4); // 4 repetitions per beat = 4 notes

      expect(tremolo.events.length).toBe(4);
      expect(tremolo.events[0].duration).toBe(0.25); // 1/4 beat each
    });

    it('should maintain pitch and velocity', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 1.0, Velocity(80))
        .build();

      const tremolo = pattern.tremolo(4);

      tremolo.events.forEach(event => {
        if (event.type === 'note') {
          const noteEvent = event as NoteEvent;
          expect(noteEvent.pitch).toBe(60); // C4
          expect(noteEvent.velocity).toBe(80);
        }
      });
    });

    it('should space repetitions evenly', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 1.0)
        .build();

      const tremolo = pattern.tremolo(4);

      expect(tremolo.events[0].time).toBe(0);
      expect(tremolo.events[1].time).toBe(0.25);
      expect(tremolo.events[2].time).toBe(0.5);
      expect(tremolo.events[3].time).toBe(0.75);
    });

    it('should allow custom duration override', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 0.5) // Original duration
        .build();

      const tremolo = pattern.tremolo(4, 2); // Repeat for 2 beats instead

      expect(tremolo.events.length).toBe(8); // 4 * 2 beats
    });

    it('should not affect rest events', () => {
      const pattern = new PatternBuilder()
        .rest(Duration(0.5))
        .note(new Note('E4'), 0.5)
        .build();

      const tremolo = pattern.tremolo(4);

      expect(tremolo.events[0].type).toBe('rest');
    });

    it('should throw error for invalid rate', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 1.0)
        .build();

      expect(() => pattern.tremolo(0)).toThrow(RangeError);
      expect(() => pattern.tremolo(-4)).toThrow(RangeError);
    });
  });

  // ============================================================================
  // ARPEGGIATE
  // ============================================================================
  describe('arpeggiate()', () => {
    it('should arpeggiate chord ascending', () => {
      const chord = ['C4', 'E4', 'G4'];
      const pattern = new PatternBuilder()
        .chord(chord, 1.0)
        .build();

      const arpeggio = pattern.arpeggiate('up');

      expect(arpeggio.events.length).toBe(3); // C E G
      expect(arpeggio.events.every(e => e.type === 'note')).toBe(true);

      // Check ascending order
      const pitches = arpeggio.events.map(e => (e as NoteEvent).pitch);
      expect(pitches[0]).toBeLessThan(pitches[1]);
      expect(pitches[1]).toBeLessThan(pitches[2]);
    });

    it('should arpeggiate chord descending', () => {
      const chord = ['C4', 'E4', 'G4'];
      const pattern = new PatternBuilder()
        .chord(chord, 1.0)
        .build();

      const arpeggio = pattern.arpeggiate('down');

      const pitches = arpeggio.events.map(e => (e as NoteEvent).pitch);
      expect(pitches[0]).toBeGreaterThan(pitches[1]);
      expect(pitches[1]).toBeGreaterThan(pitches[2]);
    });

    it('should arpeggiate up then down', () => {
      const chord = ['C4', 'E4', 'G4'];
      const pattern = new PatternBuilder()
        .chord(chord, 1.0)
        .build();

      const arpeggio = pattern.arpeggiate('updown');

      // Should have 5 notes: C E G E C
      expect(arpeggio.events.length).toBe(5);
    });

    it('should arpeggiate down then up', () => {
      const chord = ['C4', 'E4', 'G4'];
      const pattern = new PatternBuilder()
        .chord(chord, 1.0)
        .build();

      const arpeggio = pattern.arpeggiate('downup');

      // Should have 5 notes: G E C E G
      expect(arpeggio.events.length).toBe(5);
    });

    it('should distribute notes evenly across chord duration', () => {
      const chord = ['C4', 'E4', 'G4'];
      const pattern = new PatternBuilder()
        .chord(chord, 1.0)
        .build();

      const arpeggio = pattern.arpeggiate('up');

      expect(arpeggio.events[0].time).toBe(0);
      expect(arpeggio.events[1].time).toBeCloseTo(1/3, 2);
      expect(arpeggio.events[2].time).toBeCloseTo(2/3, 2);
    });

    it('should pass through non-chord events unchanged', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 0.5)
        .rest(Duration(0.5))
        .build();

      const arpeggio = pattern.arpeggiate('up');

      expect(arpeggio.events[0].type).toBe('note');
      expect(arpeggio.events[1].type).toBe('rest');
      expect(arpeggio.events.length).toBe(2);
    });

    it('should preserve velocity', () => {
      const chord = ['C4', 'E4', 'G4'];
      const pattern = new PatternBuilder()
        .chord(chord, 1.0, Velocity(90))
        .build();

      const arpeggio = pattern.arpeggiate('up');

      arpeggio.events.forEach(event => {
        expect(event.velocity).toBe(90);
      });
    });
  });

  // ============================================================================
  // DELAY
  // ============================================================================
  describe('delay()', () => {
    it('should create delayed repetitions', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 0.25)
        .build();

      const delayed = pattern.delay(Duration(0.5), 0.5, 0.5);

      // Should have original + delay taps
      expect(delayed.events.length).toBeGreaterThan(1);

      // First event is original
      expect(delayed.events[0].time).toBe(0);
      expect(delayed.events[0].velocity).toBe(80); // Original velocity (default from PatternBuilder)
    });

    it('should attenuate velocity on delay taps', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 0.25, Velocity(100))
        .build();

      const delayed = pattern.delay(Duration(0.5), 0.5, 0.5);

      // Find first delay tap
      const firstDelay = delayed.events.find(e => e.time > 0);
      expect(firstDelay).toBeDefined();
      if (firstDelay) {
        expect(firstDelay.velocity).toBeLessThan(100);
      }
    });

    it('should space delay taps correctly', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 0.25)
        .build();

      const delayed = pattern.delay(Duration(1.0), 0.7, 0.5);

      // Check timing of delay taps
      const times = delayed.events.map(e => e.time).sort((a, b) => a - b);
      const uniqueTimes = [...new Set(times)];

      // Should have events at 0, 1, 2, etc.
      expect(uniqueTimes).toContain(0);
      expect(uniqueTimes).toContain(1.0);
    });

    it('should respect feedback parameter', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 0.25, Velocity(100))
        .build();

      const lowFeedback = pattern.delay(Duration(0.5), 0.3, 0.5);
      const highFeedback = pattern.delay(Duration(0.5), 0.7, 0.5);

      // High feedback should create more repetitions
      expect(highFeedback.events.length).toBeGreaterThan(lowFeedback.events.length);
    });

    it('should throw error for invalid feedback', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 0.25)
        .build();

      expect(() => pattern.delay(Duration(1.0), -0.1, 0.5)).toThrow(RangeError);
      expect(() => pattern.delay(Duration(1.0), 1.5, 0.5)).toThrow(RangeError);
    });

    it('should throw error for invalid mix', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 0.25)
        .build();

      expect(() => pattern.delay(Duration(1.0), 0.5, -0.1)).toThrow(RangeError);
      expect(() => pattern.delay(Duration(1.0), 0.5, 1.5)).toThrow(RangeError);
    });

    it('should not delay rest events', () => {
      const pattern = new PatternBuilder()
        .rest(Duration(0.25))
        .build();

      const delayed = pattern.delay(Duration(0.5), 0.5, 0.5);

      // Should only have the single rest event
      expect(delayed.events.length).toBe(1);
      expect(delayed.events[0].type).toBe('rest');
    });

    it('should maintain original pattern unchanged', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 0.25)
        .build();

      const originalLength = pattern.events.length;
      pattern.delay(Duration(0.5), 0.5, 0.5);

      expect(pattern.events.length).toBe(originalLength);
    });
  });

  // ============================================================================
  // COMBINATION TESTS
  // ============================================================================
  describe('Effect Combinations', () => {
    it('should chain staccato and crescendo', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 1.0, Velocity(60))
        .note(new Note('E4'), 1.0, Velocity(60))
        .note(new Note('G4'), 1.0, Velocity(60))
        .build();

      const result = pattern
        .staccato(0.5)
        .crescendo(Velocity(60), Velocity(100));

      // Should have short durations AND increasing velocity
      expect(result.events[0].duration).toBe(0.5);
      expect(result.events[0].velocity).toBe(60);
      expect(result.events[2].velocity).toBe(100);
    });

    it('should chain legato and humanize', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 0.5)
        .note(new Note('E4'), 0.5)
        .build();

      const result = pattern
        .legato(0.1)
        .humanize({ seed: 12345 });

      // Should have extended durations AND varied timing
      expect(result.events[0].duration).toBeGreaterThan(0.5);
      expect(result.events[0].time).not.toBe(0);
    });

    it('should chain swing and accent', () => {
      const pattern = new PatternBuilder()
        .note(new Note('C4'), 0.5, Velocity(80))
        .note(new Note('E4'), 0.5, Velocity(80))
        .note(new Note('G4'), 0.5, Velocity(80))
        .note(new Note('C5'), 0.5, Velocity(80))
        .build();

      const result = pattern
        .swing(0.5)
        .accent([0, 2], 20);

      // Off-beats should be delayed
      expect(result.events[1].time).toBeGreaterThan(0.5);
      // Beats 0 and 2 should be accented
      expect(result.events[0].velocity).toBe(100);
      expect(result.events[2].velocity).toBe(100);
    });

    it('should chain arpeggiate, staccato, and delay', () => {
      const chord = ['C4', 'E4', 'G4', 'B4'];
      const pattern = new PatternBuilder()
        .chord(chord, 2.0)
        .build();

      const result = pattern
        .arpeggiate('up')
        .staccato(0.5)
        .delay(Duration(0.25), 0.4, 0.5);

      // Should have arpeggiated notes (4 for maj7 chord)
      expect(result.events.length).toBeGreaterThan(4);
      // Should have short durations from staccato
      const originalNotes = result.events.slice(0, 4);
      originalNotes.forEach(event => {
        expect(event.duration).toBeLessThan(0.5);
      });
    });
  });
});
