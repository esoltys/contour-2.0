import { vi, afterEach } from 'vitest';

// Mock the 'tone' module at the top level (before any imports)
// This MUST be at the top level for Vitest to properly hoist it
vi.mock('tone', async () => {
  const { Tone } = await import('./mocks/tone.mock');
  return Tone;
});

// Reset Tone mocks after each test to ensure test isolation
afterEach(async () => {
  const { resetToneMocks } = await import('./mocks/tone.mock');
  resetToneMocks();
});
