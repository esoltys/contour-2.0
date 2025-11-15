// Scheduling
export { PatternScheduler } from './scheduling/Scheduler';
export { CompositionScheduler } from './scheduling/CompositionScheduler';

// Musical Wrappers
export { MusicalSynth } from './wrappers/MusicalSynth';
export { MusicalSampler } from './wrappers/MusicalSampler';

// Instrument Adapters
export type { InstrumentAdapter } from './wrappers/InstrumentAdapter.js';
export { SynthAdapter } from './wrappers/SynthAdapter.js';
export { SampleAdapter } from './wrappers/SampleAdapter.js';
export { DrumAdapter } from './wrappers/DrumAdapter.js';
export type { DrumKit } from './wrappers/DrumAdapter.js';

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

// Sample Library Loading (Phase 12)
export {
  SampleLibraryManager,
  GMInstrument,
  SoundfontLibrary,
  createQualifiedName,
  parseQualifiedName,
  isQualifiedName,
} from './samples/index.js';
export type {
  SampleLibraryConfig,
  SoundfontInstrument,
  SoundfontFormat,
  QualifiedInstrumentName,
} from './samples/index.js';

// Re-export Tone.js for convenience
export * as Tone from 'tone';
