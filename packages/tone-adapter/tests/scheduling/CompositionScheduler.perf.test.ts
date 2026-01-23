import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CompositionScheduler } from '../../src/scheduling/CompositionScheduler';
import { SampleLibraryManager } from '../../src/samples/SampleLibraryManager';
import { Seconds } from '@contour/core';
import * as Tone from 'tone';

// Mock SampleLibraryManager
vi.mock('../../src/samples/SampleLibraryManager', () => {
  return {
    SampleLibraryManager: vi.fn().mockImplementation(() => {
      return {
        initialize: vi.fn(),
        getInstrumentByQualifiedName: vi.fn().mockImplementation(async (name) => {
          await new Promise(resolve => setTimeout(resolve, 100)); // Simulate 100ms delay
          return {
              triggerAttackRelease: vi.fn(),
              triggerAttackReleaseChord: vi.fn(),
              dispose: vi.fn(),
              toDestination: vi.fn(),
          };
        }),
        getInstrument: vi.fn(),
        isLoaded: vi.fn().mockReturnValue(false),
      };
    })
  };
});

// Mock MusicalSampler
vi.mock('../../src/wrappers/MusicalSampler', () => {
  return {
    MusicalSampler: vi.fn().mockImplementation(() => ({
      toDestination: vi.fn().mockReturnThis(),
      triggerAttackRelease: vi.fn(),
      triggerAttackReleaseChord: vi.fn(),
      dispose: vi.fn(),
      volume: { value: 0 }
    }))
  };
});

// Mock Tone.js
vi.mock('tone', async () => {
  const actual = await vi.importActual('tone');
  return {
    ...actual,
    Transport: {
      ...actual.Transport,
      schedule: vi.fn().mockReturnValue(1),
      bpm: { value: 120 },
      start: vi.fn(),
      stop: vi.fn(),
      clear: vi.fn(),
    },
    PolySynth: vi.fn().mockImplementation(() => ({
      toDestination: vi.fn().mockReturnThis(),
      triggerAttackRelease: vi.fn(),
      dispose: vi.fn(),
      volume: { value: 0 }
    })),
    start: vi.fn(),
  };
});

describe('CompositionScheduler Performance', () => {
  let scheduler: CompositionScheduler;
  let mockManager: any;

  beforeEach(() => {
    scheduler = new CompositionScheduler();
    mockManager = new SampleLibraryManager();
    scheduler.setSampleLibraryManager(mockManager);
  });

  afterEach(() => {
    scheduler.dispose();
    vi.clearAllMocks();
  });

  it('measures scheduleComposition execution time', async () => {
    const composition = {
      tempo: 120,
      tracks: [
        {
          voices: [
            {
              instrument: 'Library:Inst1',
              pattern: { events: [] }
            }
          ]
        },
        {
          voices: [
            {
              instrument: 'Library:Inst2',
              pattern: { events: [] }
            }
          ]
        },
        {
          voices: [
            {
              instrument: 'Library:Inst3',
              pattern: { events: [] }
            }
          ]
        }
      ]
    };

    const startTime = performance.now();
    await scheduler.scheduleComposition(composition as any);
    const endTime = performance.now();
    const duration = endTime - startTime;

    console.log(`scheduleComposition took ${duration.toFixed(2)}ms`);

    // With 3 tracks * 100ms delay:
    // Sequential: ~300ms
    // Parallel: ~100ms

    // We expect it to be fast now (Parallel)
    // 3 tracks * 100ms delay in parallel = ~100ms + overhead
    expect(duration).toBeLessThan(150);
  });

  it('coalesces requests for the same instrument', async () => {
    const composition = {
      tempo: 120,
      tracks: [
        {
          voices: [
            { instrument: 'Library:SharedInst', pattern: { events: [] } }
          ]
        },
        {
          voices: [
            { instrument: 'Library:SharedInst', pattern: { events: [] } }
          ]
        }
      ]
    };

    const spy = vi.spyOn(mockManager, 'getInstrumentByQualifiedName');

    await scheduler.scheduleComposition(composition as any);

    // Should be called only once despite multiple tracks using it concurrently
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('Library:SharedInst');
  });
});
