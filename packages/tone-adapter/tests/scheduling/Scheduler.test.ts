import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PatternScheduler } from '../../src/scheduling/Scheduler';
import { PatternBuilder, Seconds, Velocity, Durations } from '@contour/core';
import * as Tone from 'tone';

describe('PatternScheduler', () => {
  let scheduler: PatternScheduler;

  beforeEach(async () => {
    // Initialize Tone.js context for testing
    await Tone.start();
    scheduler = new PatternScheduler();
  });

  afterEach(() => {
    // Clean up to prevent memory leaks
    scheduler.dispose();
  });

  describe('schedule', () => {
    it('schedules note events to Tone.Transport', () => {
      const pattern = new PatternBuilder()
        .note('C4', Durations.quarter, Velocity(80))
        .note('E4', Durations.quarter, Velocity(80))
        .build();

      // Spy on Tone.Transport.schedule
      const scheduleSpy = vi.spyOn(Tone.Transport, 'schedule');

      scheduler.schedule(pattern);

      // Should have scheduled 2 note events
      expect(scheduleSpy).toHaveBeenCalledTimes(2);
    });

    it('schedules chord events correctly', () => {
      const pattern = new PatternBuilder()
        .chord(['C4', 'E4', 'G4'], Durations.half, Velocity(80))
        .build();

      const scheduleSpy = vi.spyOn(Tone.Transport, 'schedule');

      scheduler.schedule(pattern);

      // Should schedule 1 chord event
      expect(scheduleSpy).toHaveBeenCalledTimes(1);
    });

    it('respects start time offset', () => {
      const pattern = new PatternBuilder()
        .note('C4', Durations.quarter, Velocity(80))
        .build();

      const scheduleSpy = vi.spyOn(Tone.Transport, 'schedule');
      const startTime = Seconds(2);

      scheduler.schedule(pattern, startTime);

      // Check that the scheduled time includes the offset
      expect(scheduleSpy).toHaveBeenCalled();
      const [callback, time] = scheduleSpy.mock.calls[0];
      expect(time).toBeGreaterThanOrEqual(startTime);
    });

    it('does not schedule rest events', () => {
      const pattern = new PatternBuilder()
        .note('C4', Durations.quarter, Velocity(80))
        .rest(Durations.quarter)
        .note('E4', Durations.quarter, Velocity(80))
        .build();

      const scheduleSpy = vi.spyOn(Tone.Transport, 'schedule');

      scheduler.schedule(pattern);

      // Should only schedule 2 note events (not the rest)
      expect(scheduleSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('clear', () => {
    it('clears all scheduled events', () => {
      const pattern = new PatternBuilder()
        .note('C4', Durations.quarter, Velocity(80))
        .note('E4', Durations.quarter, Velocity(80))
        .build();

      scheduler.schedule(pattern);

      const clearSpy = vi.spyOn(Tone.Transport, 'clear');

      scheduler.clear();

      // Should have cleared both scheduled events
      expect(clearSpy).toHaveBeenCalledTimes(2);
    });

    it('resets scheduled events array', () => {
      const pattern = new PatternBuilder()
        .note('C4', Durations.quarter, Velocity(80))
        .build();

      scheduler.schedule(pattern);
      scheduler.clear();

      // Scheduling again should work without issues
      expect(() => scheduler.schedule(pattern)).not.toThrow();
    });
  });

  describe('transport controls', () => {
    it('starts transport', () => {
      const startSpy = vi.spyOn(Tone.Transport, 'start');

      scheduler.start();

      expect(startSpy).toHaveBeenCalled();
    });

    it('stops transport', () => {
      const stopSpy = vi.spyOn(Tone.Transport, 'stop');

      scheduler.stop();

      expect(stopSpy).toHaveBeenCalled();
    });

    it('pauses transport', () => {
      const pauseSpy = vi.spyOn(Tone.Transport, 'pause');

      scheduler.pause();

      expect(pauseSpy).toHaveBeenCalled();
    });
  });

  describe('tempo control', () => {
    it('sets tempo', () => {
      scheduler.setTempo(140);

      expect(Tone.Transport.bpm.value).toBe(140);
    });
  });

  describe('position', () => {
    it('returns current playback position', () => {
      const position = scheduler.position;

      expect(typeof position).toBe('number');
      expect(position).toBeGreaterThanOrEqual(0);
    });
  });

  describe('dispose', () => {
    it('cleans up all resources', () => {
      const pattern = new PatternBuilder()
        .note('C4', Durations.quarter, Velocity(80))
        .build();

      scheduler.schedule(pattern);
      scheduler.dispose();

      // Attempting to schedule after dispose should throw
      expect(() => scheduler.schedule(pattern)).toThrow('Scheduler has been disposed');
    });

    it('disposes of the synth', () => {
      // Access the synth through any method to ensure it's created
      const pattern = new PatternBuilder()
        .note('C4', Durations.quarter, Velocity(80))
        .build();
      scheduler.schedule(pattern);

      // Dispose should not throw
      expect(() => scheduler.dispose()).not.toThrow();
    });
  });

  describe('integration', () => {
    it('schedules and plays a simple melody', async () => {
      const melody = new PatternBuilder()
        .note('C4', Durations.eighth, Velocity(80))
        .note('D4', Durations.eighth, Velocity(80))
        .note('E4', Durations.eighth, Velocity(80))
        .note('F4', Durations.eighth, Velocity(80))
        .note('G4', Durations.quarter, Velocity(80))
        .build();

      scheduler.schedule(melody);

      // Verify the pattern was scheduled
      expect(scheduler).toBeDefined();

      // In a real test environment, we might want to actually
      // render the audio and verify it, but for now we just
      // verify that scheduling worked without errors
    });
  });
});
