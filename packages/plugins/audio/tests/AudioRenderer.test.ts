import { describe, it, expect, beforeEach } from 'vitest';
import { AudioRenderer, AudioRendererConfig } from '../src/AudioRenderer';

describe('AudioRenderer', () => {
  let renderer: AudioRenderer;

  beforeEach(() => {
    renderer = new AudioRenderer();
  });

  describe('initialization', () => {
    it('initializes with default config', async () => {
      await renderer.initialize({});

      expect(renderer.name).toBe('audio');
      expect(renderer.version).toBe('1.0.0');
    });

    it('initializes with custom config', async () => {
      const config: AudioRendererConfig = {
        sampleRate: 48000,
        bitDepth: 24,
        format: 'wav',
        masterVolume: -6,
      };

      await renderer.initialize(config);

      // No error means success
      expect(renderer.name).toBe('audio');
    });

    it('throws on invalid sample rate', async () => {
      await expect(
        renderer.initialize({ sampleRate: -1, bitDepth: 16, format: 'wav' })
      ).rejects.toThrow('Sample rate must be positive');
    });

    it('throws on invalid bit depth', async () => {
      await expect(
        renderer.initialize({ sampleRate: 44100, bitDepth: 8 as any, format: 'wav' })
      ).rejects.toThrow('Bit depth must be 16, 24, or 32');
    });

    it('throws on unsupported format', async () => {
      await expect(
        renderer.initialize({ sampleRate: 44100, bitDepth: 16, format: 'mp3' as any })
      ).rejects.toThrow('Only WAV format is currently supported');
    });
  });

  describe('shutdown', () => {
    it('shuts down cleanly', async () => {
      await renderer.initialize({ sampleRate: 44100, bitDepth: 16, format: 'wav' });
      await renderer.shutdown();

      // No error means success
      expect(true).toBe(true);
    });

    it('can be called multiple times', async () => {
      await renderer.initialize({ sampleRate: 44100, bitDepth: 16, format: 'wav' });
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
      expect(renderer.name).toBe('audio');
      expect(renderer.version).toBe('1.0.0');
    });
  });

  // Note: Full rendering tests require a browser environment with Web Audio API.
  // These tests focus on the plugin interface. Full integration tests should
  // be run in the examples or browser environment.
});
