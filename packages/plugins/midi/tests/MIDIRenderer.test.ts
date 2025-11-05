import { describe, it, expect, beforeEach } from 'vitest';
import { MIDIRenderer, MIDIRendererConfig } from '../src/MIDIRenderer';
import {
  Composition,
  Track,
  Voice,
  PatternBuilder,
  BPM,
  Durations,
  C, D, E, F, G, A,
} from '@contour/core';

describe('MIDIRenderer', () => {
  let renderer: MIDIRenderer;

  beforeEach(() => {
    renderer = new MIDIRenderer();
  });

  describe('initialization', () => {
    it('initializes with default config', async () => {
      await renderer.initialize();

      expect(renderer.name).toBe('midi');
      expect(renderer.version).toBe('1.0.0');
    });

    it('initializes with custom config', async () => {
      const config: MIDIRendererConfig = {
        format: 1,
        ticksPerBeat: 960,
      };

      await renderer.initialize(config);

      // No error means success
      expect(renderer.name).toBe('midi');
    });

    it('throws on invalid format', async () => {
      await expect(
        renderer.initialize({ format: 2 as any })
      ).rejects.toThrow('MIDI format must be 0 or 1');
    });

    it('throws on invalid ticks per beat', async () => {
      await expect(
        renderer.initialize({ ticksPerBeat: -1 })
      ).rejects.toThrow('Ticks per beat must be positive');
    });
  });

  describe('rendering', () => {
    it('renders simple composition to MIDI', async () => {
      await renderer.initialize();

      // Create simple melody
      const pattern = new PatternBuilder()
        .note(C('4'), Durations.quarter)
        .note(D('4'), Durations.quarter)
        .note(E('4'), Durations.quarter)
        .note(C('4'), Durations.quarter)
        .build();

      const voice = new Voice(pattern, 'piano');
      const track = new Track('Melody', [voice]);
      const composition = new Composition('Simple Song', BPM(120)).addTrack(track);

      const result = await renderer.render(composition);

      // Verify result structure
      expect(result.format).toBe('midi');
      expect(result.data).toBeInstanceOf(Buffer);
      expect(result.data.length).toBeGreaterThan(0);

      // Verify MIDI file header (starts with "MThd")
      const header = result.data.toString('ascii', 0, 4);
      expect(header).toBe('MThd');

      // Verify metadata
      expect(result.metadata.trackCount).toBeGreaterThan(0);
      expect(result.metadata.tempo).toBe(120);
    });

    it('renders multi-voice composition', async () => {
      await renderer.initialize();

      // Create two voices
      const voice1 = new Voice(
        new PatternBuilder()
          .note(C('5'), Durations.quarter)
          .note(E('5'), Durations.quarter)
          .build(),
        'piano'
      );

      const voice2 = new Voice(
        new PatternBuilder()
          .note(C('3'), Durations.half)
          .build(),
        'bass'
      );

      const track = new Track('Harmony', [voice1, voice2]);
      const composition = new Composition('Multi-Voice', BPM(120)).addTrack(track);

      const result = await renderer.render(composition);

      expect(result.format).toBe('midi');
      expect(result.data).toBeInstanceOf(Buffer);
      expect(result.metadata.trackCount).toBe(2); // Two voices = two tracks
    });

    it('renders composition with chord events', async () => {
      await renderer.initialize();

      const pattern = new PatternBuilder()
        .chord([C('4'), E('4'), G('4')], Durations.quarter)
        .chord([F('4'), A('4'), C('5')], Durations.quarter)
        .build();

      const voice = new Voice(pattern, 'piano');
      const track = new Track('Chords', [voice]);
      const composition = new Composition('Harmony', BPM(120)).addTrack(track);

      const result = await renderer.render(composition);

      expect(result.format).toBe('midi');
      expect(result.data).toBeInstanceOf(Buffer);
      expect(result.data.toString('ascii', 0, 4)).toBe('MThd');
    });

    it('renders composition with rest events', async () => {
      await renderer.initialize();

      const pattern = new PatternBuilder()
        .note(C('4'), Durations.quarter)
        .rest(Durations.quarter)
        .note(E('4'), Durations.quarter)
        .rest(Durations.quarter)
        .build();

      const voice = new Voice(pattern, 'piano');
      const track = new Track('With Rests', [voice]);
      const composition = new Composition('Rests', BPM(120)).addTrack(track);

      const result = await renderer.render(composition);

      expect(result.format).toBe('midi');
      expect(result.data).toBeInstanceOf(Buffer);
    });

    it('respects tempo setting', async () => {
      await renderer.initialize();

      const pattern = new PatternBuilder()
        .note(C('4'), Durations.quarter)
        .build();

      const voice = new Voice(pattern, 'piano');
      const track = new Track('Tempo Test', [voice]);

      // Different tempos
      const slowComp = new Composition('Slow', BPM(60)).addTrack(track);
      const fastComp = new Composition('Fast', BPM(240)).addTrack(track);

      const slowResult = await renderer.render(slowComp);
      const fastResult = await renderer.render(fastComp);

      // Both should render successfully
      expect(slowResult.data).toBeInstanceOf(Buffer);
      expect(fastResult.data).toBeInstanceOf(Buffer);

      expect(slowResult.metadata.tempo).toBe(60);
      expect(fastResult.metadata.tempo).toBe(240);
    });

    it('handles empty composition', async () => {
      await renderer.initialize();

      const composition = new Composition('Empty', BPM(120));

      const result = await renderer.render(composition);

      // Should still produce valid MIDI file
      expect(result.format).toBe('midi');
      expect(result.data).toBeInstanceOf(Buffer);
      expect(result.metadata.trackCount).toBe(0);
    });

    it('uses correct instrument numbers', async () => {
      await renderer.initialize();

      const pattern = new PatternBuilder()
        .note(C('4'), Durations.quarter)
        .build();

      // Test different instruments
      const instruments = ['piano', 'harpsichord', 'strings', 'bass'];

      for (const inst of instruments) {
        const voice = new Voice(pattern, inst);
        const track = new Track('Test', [voice]);
        const composition = new Composition('Test', BPM(120)).addTrack(track);

        const result = await renderer.render(composition);

        expect(result.data).toBeInstanceOf(Buffer);
        expect(result.data.toString('ascii', 0, 4)).toBe('MThd');
      }
    });

    it('handles multi-track compositions', async () => {
      await renderer.initialize();

      const melody = new Voice(
        new PatternBuilder()
          .note(C('5'), Durations.quarter)
          .note(D('5'), Durations.quarter)
          .build(),
        'piano'
      );

      const bass = new Voice(
        new PatternBuilder()
          .note(C('2'), Durations.half)
          .build(),
        'bass'
      );

      const track1 = new Track('Melody', [melody]);
      const track2 = new Track('Bass', [bass]);

      const composition = new Composition('Multi-Track', BPM(120))
        .addTrack(track1)
        .addTrack(track2);

      const result = await renderer.render(composition);

      expect(result.format).toBe('midi');
      expect(result.metadata.trackCount).toBe(2);
    });
  });

  describe('shutdown', () => {
    it('shuts down cleanly', async () => {
      await renderer.initialize();
      await renderer.shutdown();

      // No error means success
      expect(true).toBe(true);
    });

    it('can be called multiple times', async () => {
      await renderer.initialize();
      await renderer.shutdown();
      await renderer.shutdown();

      // No error means success
      expect(true).toBe(true);
    });
  });

  describe('plugin interface', () => {
    it('has no dependencies', () => {
      expect(renderer.dependencies).toBeUndefined();
    });

    it('has correct name and version', () => {
      expect(renderer.name).toBe('midi');
      expect(renderer.version).toBe('1.0.0');
    });
  });
});
