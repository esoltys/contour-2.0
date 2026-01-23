import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CompositionScheduler } from '../../src/scheduling/CompositionScheduler';
import { SampleLibraryManager } from '../../src/samples/SampleLibraryManager';
import { Voice, Track, Composition, PatternBuilder, Durations } from '@contour/core';

// Mock Tone.js to avoid real audio context issues
vi.mock('tone', async () => {
  const actual = await vi.importActual('tone');
  return {
    ...actual,
    Transport: {
      ...actual.Transport,
      schedule: vi.fn(),
      bpm: { value: 120 },
      start: vi.fn(),
      stop: vi.fn(),
      pause: vi.fn(),
      clear: vi.fn(),
      state: 'stopped',
      seconds: 0,
    },
    start: vi.fn().mockResolvedValue(undefined),
    PolySynth: class {
      toDestination() { return this; }
      triggerAttackRelease() {}
      dispose() {}
      volume = { value: 0 }
    },
    Gain: class {
      constructor() {
        this.gain = { value: 1, rampTo: vi.fn() };
        this.input = {};
      }
      toDestination() { return this; }
      connect() { return this; }
      disconnect() { return this; }
      dispose() {}
    },
    getContext: () => ({
        currentTime: 0,
        rawContext: {}
    }),
  };
});

describe('CompositionScheduler Performance', () => {
  let scheduler: CompositionScheduler;
  let mockManager: any;

  beforeEach(async () => {
    scheduler = new CompositionScheduler();

    // Create a mock SampleLibraryManager
    mockManager = {
      initialize: vi.fn(),
      getInstrumentByQualifiedName: vi.fn().mockImplementation(async () => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 50));
        return {
           stop: vi.fn(),
           play: vi.fn(),
           out: {
             connect: vi.fn(),
           }
        };
      }),
      isLoaded: vi.fn().mockReturnValue(false),
      loadInstrumentByQualifiedName: vi.fn(),
      getInstrument: vi.fn(),
      dispose: vi.fn(),
    };

    scheduler.setSampleLibraryManager(mockManager as unknown as SampleLibraryManager);
  });

  afterEach(() => {
    scheduler.dispose();
  });

  it('measures scheduling time for multiple voices', async () => {
    const numVoices = 10;
    const delay = 50;

    // Create multiple voices using DIFFERENT sampled instruments to force sequential loading
    const voices: Voice[] = [];
    for (let i = 0; i < numVoices; i++) {
      voices.push({
        name: `Voice ${i}`,
        instrument: `MusyngKite:instrument_${i}`, // Qualified name to trigger sample loading
        pattern: new PatternBuilder().note('C4', Durations.quarter).build(),
      });
    }

    const track: Track = {
      name: 'Piano Track',
      voices: voices,
    };

    const composition: Composition = {
      title: 'Perf Test',
      tempo: 120,
      tracks: [track],
    };

    const startTime = performance.now();
    await scheduler.scheduleComposition(composition);
    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`Scheduling took ${duration.toFixed(2)}ms for ${numVoices} voices with ${delay}ms delay each.`);

    // OPTIMIZED ASSERTION:
    // Parallel loading: max(50ms) + overhead = ~50-60ms
    // We expect it to be less than 150ms (giving generous buffer)
    expect(duration).toBeLessThan(150);
    // And definitely much faster than sequential
    expect(duration).toBeLessThan(numVoices * delay * 0.5);
  });

  it('deduplicates simultaneous load requests for the same instrument', async () => {
    const numVoices = 5;
    const delay = 50;

    // Create multiple voices using the SAME instrument
    const voices: Voice[] = [];
    for (let i = 0; i < numVoices; i++) {
      voices.push({
        name: `Voice ${i}`,
        instrument: 'MusyngKite:shared_piano',
        pattern: new PatternBuilder().note('C4', Durations.quarter).build(),
      });
    }

    const track: Track = {
      name: 'Shared Instrument Track',
      voices: voices,
    };

    const composition: Composition = {
      title: 'Dedupe Test',
      tempo: 120,
      tracks: [track],
    };

    const startTime = performance.now();
    await scheduler.scheduleComposition(composition);
    const endTime = performance.now();

    // Should be fast (~50ms)
    expect(endTime - startTime).toBeLessThan(150);

    // Verify only ONE load call was made
    expect(mockManager.getInstrumentByQualifiedName).toHaveBeenCalledWith(
       expect.stringMatching(/shared_piano/)
    );
    // Count calls specifically for shared_piano
    const calls = mockManager.getInstrumentByQualifiedName.mock.calls;
    const sharedPianoCalls = calls.filter((args: any[]) => args[0] === 'MusyngKite:shared_piano');
    expect(sharedPianoCalls.length).toBe(1);
  });
});
