/**
 * Sample library loading with soundfont-player.
 *
 * Provides type-safe loading and management of soundfont instruments
 * from CDN-hosted libraries (MusyngKite, FluidR3_GM, FatBoy).
 */

export { SampleLibraryManager } from './SampleLibraryManager.js';

export {
  GMInstrument,
  SoundfontLibrary,
  createQualifiedName,
  parseQualifiedName,
  isQualifiedName,
} from './types.js';

export type {
  SampleLibraryConfig,
  SoundfontInstrument,
  SoundfontFormat,
  QualifiedInstrumentName,
} from './types.js';
