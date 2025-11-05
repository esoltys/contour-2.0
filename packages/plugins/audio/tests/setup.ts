/**
 * Test setup for audio renderer tests.
 *
 * Mocks Web Audio API for Node.js environment.
 */

// Mock AudioContext for Tone.js
if (typeof window !== 'undefined' && !window.AudioContext) {
  // @ts-ignore
  window.AudioContext = class MockAudioContext {
    currentTime = 0;
    destination = {};
    listener = {};
    sampleRate = 44100;
    state = 'running';

    createOscillator() {
      return { connect: () => {}, start: () => {}, stop: () => {} };
    }

    createGain() {
      return {
        connect: () => {},
        gain: { value: 1, setValueAtTime: () => {} },
      };
    }

    createBuffer(channels: number, length: number, sampleRate: number) {
      return {
        numberOfChannels: channels,
        length,
        sampleRate,
        getChannelData: () => new Float32Array(length),
      };
    }

    decodeAudioData() {
      return Promise.resolve(this.createBuffer(2, 44100, 44100));
    }
  };
}

// Suppress Tone.js warnings in tests
if (typeof console !== 'undefined') {
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    // Suppress Tone.js context warnings
    if (args[0]?.includes?.('Tone') || args[0]?.includes?.('AudioContext')) {
      return;
    }
    originalWarn.apply(console, args);
  };
}
