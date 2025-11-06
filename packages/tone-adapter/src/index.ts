// Scheduling
export { PatternScheduler } from './scheduling/Scheduler';
export { CompositionScheduler } from './scheduling/CompositionScheduler';

// Musical Wrappers
export { MusicalSynth } from './wrappers/MusicalSynth';

// Hot Module Replacement
export { HMRHandler } from './hmr/HMRHandler';

// Debugging & Diagnostics (Phase 8A)
export { TransportDebugger, getTransportDebugger } from './debug/TransportDebugger';
export type {
  ScheduledEventInfo,
  ScheduleConflict,
  AudioNodeInfo,
  TransportSnapshot,
} from './debug/TransportDebugger';

// Re-export Tone.js for convenience
export * as Tone from 'tone';
