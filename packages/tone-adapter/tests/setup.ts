import { beforeAll, vi } from 'vitest';

// Mock the Web Audio API before Tone.js loads
beforeAll(() => {
  // Import and setup web-audio-test-api
  const { AudioContext, OfflineAudioContext } = require('web-audio-test-api');

  // Assign to global scope
  global.AudioContext = AudioContext;
  global.OfflineAudioContext = OfflineAudioContext;

  // Also assign to window for jsdom
  if (typeof window !== 'undefined') {
    (window as any).AudioContext = AudioContext;
    (window as any).OfflineAudioContext = OfflineAudioContext;
    (window as any).webkitAudioContext = AudioContext;
  }
});
