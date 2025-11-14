# External Sample Library Loading - Architecture & API Specification

**Status:** 📋 PLANNING
**Author:** AI Planning Assistant
**Date:** 2025-11-14
**Version:** 1.0.0

## Executive Summary

This specification defines a feature for loading and using sampled instruments from external sources (SoundFonts, sample packs, URLs) in Contour compositions without coupling the core system to specific sample libraries.

**Key Goals:**
1. ✅ Support SoundFont (.sf2) format and extensible to other formats
2. ✅ Type-safe instrument names with autocomplete
3. ✅ Work with URLs, local files, and CDN-hosted libraries
4. ✅ Zero impact on core package (no new dependencies)
5. ✅ Seamless integration with existing Track/Voice/Pattern system
6. ✅ Enable toggling between synth and samples in playground demo

---

## 1. Architecture Overview

### 1.1 Four-Layer Integration

The sample library system integrates into Contour's four-layer architecture:

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 4: DSL Syntax                                         │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ // User-facing API                                      │ │
│ │ voice('melody', 'piano', { library: 'GeneralUserGS' })  │ │
│ │ voice('bass', 'synth')  // Default Tone.js synth        │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Composition Abstractions                          │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Voice, Track, Composition                               │ │
│ │ - instrument: InstrumentReference (branded type)        │ │
│ │ - Immutable transformations                             │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: Musical Wrappers (NEW: Sample Library Layer)      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ SampleLibraryManager                                    │ │
│ │ ├─ SoundFontLoader (sf2-parser)                         │ │
│ │ ├─ MusicalSampler (Tone.Sampler wrapper)               │ │
│ │ └─ InstrumentRegistry                                   │ │
│ │                                                         │ │
│ │ MusicalSynth (existing)                                 │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Tone.js Primitives (Untouched)                    │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ Tone.Sampler, Tone.Synth, Tone.PolySynth              │ │
│ │ (Users can still drop down to this layer)              │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

**Design Decision:** Sample library loading is a **Layer 2 wrapper** (musical abstraction), NOT a plugin. Plugins are for output formats (renderers), while sample libraries are input/instrument sources.

### 1.2 Package Structure

```
contour/
├── packages/
│   ├── core/                          # No changes, zero dependencies
│   │   └── src/
│   │       ├── types/
│   │       │   └── brands.ts          # NEW: InstrumentReference branded type
│   │       └── composition/
│   │           └── Voice.ts           # MODIFIED: instrument type updated
│   │
│   ├── tone-adapter/                  # NEW: Sample library support
│   │   ├── package.json               # MODIFIED: Add sf2-parser dependency
│   │   └── src/
│   │       ├── wrappers/
│   │       │   ├── MusicalSynth.ts           # Existing
│   │       │   └── MusicalSampler.ts         # NEW: Tone.Sampler wrapper
│   │       ├── samples/                      # NEW: Sample library layer
│   │       │   ├── SampleLibraryManager.ts   # Main orchestrator
│   │       │   ├── SoundFontLoader.ts        # .sf2 file parser
│   │       │   ├── InstrumentRegistry.ts     # Type-safe registry
│   │       │   └── types.ts                  # Sample library types
│   │       └── scheduling/
│   │           └── CompositionScheduler.ts   # MODIFIED: Support samplers
│   │
│   └── playground/                    # NEW: Sample library demo
│       └── src/
│           ├── ui/
│           │   └── InstrumentSelector.ts     # Toggle synth/samples
│           └── samples/
│               └── presets.ts                # Sample library configs
│
└── docs/
    └── SAMPLE_LIBRARY_SPEC.md         # This document
```

---

## 2. Type System

### 2.1 Branded Types for Instrument References

```typescript
// packages/core/src/types/brands.ts

/**
 * Type-safe instrument reference.
 * Can be either a synth name or a sampled instrument.
 *
 * Examples:
 * - 'synth' -> Default Tone.Synth
 * - 'piano' -> Default Tone.PolySynth
 * - 'GeneralUserGS:AcousticGrandPiano' -> Sampled piano from library
 */
export type InstrumentReference = string & { __brand: 'InstrumentReference' };

export const InstrumentReference = (value: string): InstrumentReference =>
  value as InstrumentReference;
```

### 2.2 Sample Library Types

```typescript
// packages/tone-adapter/src/samples/types.ts

import type { InstrumentReference } from '@contour/core';

/**
 * Sample library configuration.
 */
export interface SampleLibraryConfig {
  /** Unique library identifier */
  name: string;

  /** Library format (.sf2, .sfz, etc.) */
  format: 'soundfont' | 'sfz' | 'custom';

  /** URL or file path to library */
  url: string;

  /** Optional base URL for sample files */
  baseUrl?: string;

  /** Version identifier */
  version?: string;

  /** Loading options */
  options?: {
    /** Load samples immediately vs. on-demand */
    preload?: boolean;

    /** Quality settings */
    quality?: 'low' | 'medium' | 'high';

    /** Velocity layers to load (if applicable) */
    velocityLayers?: number;
  };
}

/**
 * Parsed instrument from a sample library.
 */
export interface SampledInstrument {
  /** Library this instrument belongs to */
  library: string;

  /** Instrument name within the library */
  name: string;

  /** Full qualified name: 'LibraryName:InstrumentName' */
  qualifiedName: InstrumentReference;

  /** MIDI program number (for GM SoundFonts) */
  program?: number;

  /** Bank number (for GM SoundFonts) */
  bank?: number;

  /** Sample mappings by note (C4, D#3, etc.) */
  samples: Record<string, string | AudioBuffer>;

  /** Metadata */
  metadata?: {
    category?: string;
    tags?: string[];
    [key: string]: unknown;
  };
}

/**
 * Loading state for sample libraries.
 */
export type LoadingState =
  | { status: 'idle' }
  | { status: 'loading'; progress: number }
  | { status: 'loaded'; instrumentCount: number }
  | { status: 'error'; error: Error };
```

### 2.3 Type-Safe Instrument Names

Using TypeScript template literal types for autocomplete:

```typescript
// packages/tone-adapter/src/samples/types.ts

/**
 * General MIDI instrument names (128 instruments).
 * Provides autocomplete for GM-compatible SoundFonts.
 */
export type GMInstrument =
  // Piano (0-7)
  | 'AcousticGrandPiano' | 'BrightAcousticPiano' | 'ElectricGrandPiano'
  | 'HonkyTonkPiano' | 'ElectricPiano1' | 'ElectricPiano2'
  | 'Harpsichord' | 'Clavinet'

  // Chromatic Percussion (8-15)
  | 'Celesta' | 'Glockenspiel' | 'MusicBox' | 'Vibraphone'
  | 'Marimba' | 'Xylophone' | 'TubularBells' | 'Dulcimer'

  // Organ (16-23)
  | 'DrawbarOrgan' | 'PercussiveOrgan' | 'RockOrgan' | 'ChurchOrgan'
  | 'ReedOrgan' | 'Accordion' | 'Harmonica' | 'TangoAccordion'

  // Guitar (24-31)
  | 'AcousticGuitarNylon' | 'AcousticGuitarSteel' | 'ElectricGuitarJazz'
  | 'ElectricGuitarClean' | 'ElectricGuitarMuted' | 'OverdrivenGuitar'
  | 'DistortionGuitar' | 'GuitarHarmonics'

  // Bass (32-39)
  | 'AcousticBass' | 'ElectricBassFinger' | 'ElectricBassPick'
  | 'FretlessBass' | 'SlapBass1' | 'SlapBass2' | 'SynthBass1' | 'SynthBass2'

  // Strings (40-47)
  | 'Violin' | 'Viola' | 'Cello' | 'Contrabass'
  | 'TremoloStrings' | 'PizzicatoStrings' | 'OrchestralHarp' | 'Timpani'

  // Ensemble (48-55)
  | 'StringEnsemble1' | 'StringEnsemble2' | 'SynthStrings1' | 'SynthStrings2'
  | 'ChoirAahs' | 'VoiceOohs' | 'SynthVoice' | 'OrchestraHit'

  // Brass (56-63)
  | 'Trumpet' | 'Trombone' | 'Tuba' | 'MutedTrumpet'
  | 'FrenchHorn' | 'BrassSection' | 'SynthBrass1' | 'SynthBrass2'

  // Reed (64-71)
  | 'SopranoSax' | 'AltoSax' | 'TenorSax' | 'BaritoneSax'
  | 'Oboe' | 'EnglishHorn' | 'Bassoon' | 'Clarinet'

  // Pipe (72-79)
  | 'Piccolo' | 'Flute' | 'Recorder' | 'PanFlute'
  | 'BlownBottle' | 'Shakuhachi' | 'Whistle' | 'Ocarina'

  // Synth Lead (80-87)
  | 'Lead1Square' | 'Lead2Sawtooth' | 'Lead3Calliope' | 'Lead4Chiff'
  | 'Lead5Charang' | 'Lead6Voice' | 'Lead7Fifths' | 'Lead8BassLead'

  // Synth Pad (88-95)
  | 'Pad1NewAge' | 'Pad2Warm' | 'Pad3Polysynth' | 'Pad4Choir'
  | 'Pad5Bowed' | 'Pad6Metallic' | 'Pad7Halo' | 'Pad8Sweep'

  // Synth Effects (96-103)
  | 'FX1Rain' | 'FX2Soundtrack' | 'FX3Crystal' | 'FX4Atmosphere'
  | 'FX5Brightness' | 'FX6Goblins' | 'FX7Echoes' | 'FX8SciFi'

  // Ethnic (104-111)
  | 'Sitar' | 'Banjo' | 'Shamisen' | 'Koto'
  | 'Kalimba' | 'Bagpipe' | 'Fiddle' | 'Shanai'

  // Percussive (112-119)
  | 'TinkleBell' | 'Agogo' | 'SteelDrums' | 'Woodblock'
  | 'TaikoDrum' | 'MelodicTom' | 'SynthDrum' | 'ReverseCymbal'

  // Sound Effects (120-127)
  | 'GuitarFretNoise' | 'BreathNoise' | 'Seashore' | 'BirdTweet'
  | 'TelephoneRing' | 'Helicopter' | 'Applause' | 'Gunshot';

/**
 * Type-safe instrument reference with library prefix.
 */
export type QualifiedInstrument<L extends string = string> =
  `${L}:${GMInstrument}` | `${L}:${string}`;

/**
 * Default synth instruments (no library prefix).
 */
export type SynthInstrument =
  | 'synth'           // Tone.Synth
  | 'polySynth'       // Tone.PolySynth
  | 'fmSynth'         // Tone.FMSynth
  | 'amSynth'         // Tone.AMSynth
  | 'membraneSynth'   // Tone.MembraneSynth (drums)
  | 'metalSynth';     // Tone.MetalSynth

/**
 * Union of all instrument types.
 */
export type Instrument = SynthInstrument | QualifiedInstrument;
```

---

## 3. Core Components

### 3.1 SoundFontLoader

Loads and parses .sf2 SoundFont files using `sf2-parser`.

```typescript
// packages/tone-adapter/src/samples/SoundFontLoader.ts

import { Parser } from 'sf2-parser';
import type { SampleLibraryConfig, SampledInstrument } from './types.js';

/**
 * Loads SoundFont (.sf2) files and extracts instruments.
 *
 * Uses sf2-parser to parse binary .sf2 format and extract:
 * - Instrument definitions
 * - Sample data (audio buffers)
 * - Preset mappings
 * - MIDI program numbers
 */
export class SoundFontLoader {
  private parser: Parser;
  private cache = new Map<string, ArrayBuffer>();

  constructor() {
    this.parser = new Parser();
  }

  /**
   * Load a SoundFont from URL or local file.
   *
   * @param config - Library configuration
   * @returns Array of parsed instruments
   *
   * @example
   * ```typescript
   * const loader = new SoundFontLoader();
   * const instruments = await loader.load({
   *   name: 'GeneralUserGS',
   *   format: 'soundfont',
   *   url: 'https://example.com/GeneralUser.sf2'
   * });
   * ```
   */
  async load(config: SampleLibraryConfig): Promise<SampledInstrument[]> {
    // Fetch .sf2 file
    const arrayBuffer = await this.fetchSoundFont(config.url);

    // Parse with sf2-parser
    const soundFont = this.parser.parse(arrayBuffer);

    // Extract instruments
    const instruments = this.extractInstruments(soundFont, config.name);

    return instruments;
  }

  /**
   * Fetch SoundFont file from URL.
   * Supports both HTTP and file:// URLs.
   */
  private async fetchSoundFont(url: string): Promise<ArrayBuffer> {
    // Check cache first
    if (this.cache.has(url)) {
      return this.cache.get(url)!;
    }

    // Fetch
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to load SoundFont: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();

    // Cache for future use
    this.cache.set(url, arrayBuffer);

    return arrayBuffer;
  }

  /**
   * Extract instruments from parsed SoundFont.
   */
  private extractInstruments(
    soundFont: any,
    libraryName: string
  ): SampledInstrument[] {
    const instruments: SampledInstrument[] = [];

    // Iterate through presets
    for (const preset of soundFont.presets) {
      const instrument: SampledInstrument = {
        library: libraryName,
        name: preset.name,
        qualifiedName: `${libraryName}:${preset.name}` as any,
        program: preset.program,
        bank: preset.bank,
        samples: {},
        metadata: {
          category: this.categorizeByProgram(preset.program),
        },
      };

      // Extract sample mappings
      for (const zone of preset.zones) {
        // Map samples to note ranges
        // This is simplified - real implementation would handle:
        // - Velocity layers
        // - Key ranges
        // - Loop points
        // - Envelope parameters
        const noteRange = zone.keyRange || { lo: 0, hi: 127 };
        const sample = zone.sample;

        if (sample) {
          // Convert sample data to AudioBuffer or URL
          // (Implementation details depend on Tone.js Sampler API)
          instrument.samples[`C${Math.floor(noteRange.lo / 12)}`] = sample.data;
        }
      }

      instruments.push(instrument);
    }

    return instruments;
  }

  /**
   * Categorize instrument by MIDI program number.
   */
  private categorizeByProgram(program: number): string {
    if (program < 8) return 'Piano';
    if (program < 16) return 'Chromatic Percussion';
    if (program < 24) return 'Organ';
    if (program < 32) return 'Guitar';
    if (program < 40) return 'Bass';
    if (program < 48) return 'Strings';
    if (program < 56) return 'Ensemble';
    if (program < 64) return 'Brass';
    if (program < 72) return 'Reed';
    if (program < 80) return 'Pipe';
    if (program < 88) return 'Synth Lead';
    if (program < 96) return 'Synth Pad';
    if (program < 104) return 'Synth Effects';
    if (program < 112) return 'Ethnic';
    if (program < 120) return 'Percussive';
    return 'Sound Effects';
  }

  /**
   * Clear cache.
   */
  clearCache(): void {
    this.cache.clear();
  }
}
```

### 3.2 MusicalSampler

Layer 2 wrapper around Tone.Sampler with musical terminology.

```typescript
// packages/tone-adapter/src/wrappers/MusicalSampler.ts

import * as Tone from 'tone';
import type { Note, Duration, NoteName } from '@contour/core';
import { Velocity } from '@contour/core';
import type { SampledInstrument } from '../samples/types.js';

/**
 * Musical wrapper around Tone.Sampler.
 *
 * Provides the same API as MusicalSynth but uses samples instead of synthesis.
 * This allows swapping between synth and samples without changing composition code.
 */
export class MusicalSampler {
  private sampler: Tone.Sampler;
  private instrument: SampledInstrument;

  constructor(instrument: SampledInstrument) {
    this.instrument = instrument;

    // Create Tone.Sampler with sample mappings
    this.sampler = new Tone.Sampler({
      urls: instrument.samples,
      // Additional Tone.Sampler options
      attack: 0.01,
      release: 1,
    });
  }

  /**
   * Play a note with musical parameters.
   * Same API as MusicalSynth for consistency.
   */
  playNote(
    note: Note | NoteName,
    duration: Duration,
    velocity: Velocity = Velocity(80),
    time?: number
  ): void {
    const noteName = typeof note === 'string' ? note : note.name;
    const normalizedVelocity = velocity / 127;

    this.sampler.triggerAttackRelease(noteName, duration, time, normalizedVelocity);
  }

  /**
   * Start a note (attack phase).
   */
  noteOn(note: Note | NoteName, velocity: Velocity = Velocity(80), time?: number): void {
    const noteName = typeof note === 'string' ? note : note.name;
    const normalizedVelocity = velocity / 127;

    this.sampler.triggerAttack(noteName, time, normalizedVelocity);
  }

  /**
   * End a note (release phase).
   */
  noteOff(note: Note | NoteName, time?: number): void {
    const noteName = typeof note === 'string' ? note : note.name;
    this.sampler.triggerRelease(noteName, time);
  }

  /**
   * Connect to a destination.
   */
  connect(destination: Tone.ToneAudioNode | AudioNode): this {
    this.sampler.connect(destination);
    return this;
  }

  /**
   * Connect to main output.
   */
  toDestination(): this {
    this.sampler.toDestination();
    return this;
  }

  /**
   * Set volume in decibels.
   */
  setVolume(db: number): this {
    this.sampler.volume.value = db;
    return this;
  }

  /**
   * Access underlying Tone.Sampler.
   */
  get toneSampler(): Tone.Sampler {
    return this.sampler;
  }

  /**
   * Check if samples are loaded.
   */
  get loaded(): boolean {
    return this.sampler.loaded;
  }

  /**
   * Wait for all samples to load.
   */
  async waitForLoad(): Promise<void> {
    return new Promise((resolve) => {
      Tone.loaded().then(() => resolve());
    });
  }

  /**
   * Dispose and release resources.
   */
  dispose(): void {
    this.sampler.dispose();
  }
}
```

### 3.3 SampleLibraryManager

Main orchestrator for loading and managing sample libraries.

```typescript
// packages/tone-adapter/src/samples/SampleLibraryManager.ts

import { SoundFontLoader } from './SoundFontLoader.js';
import { MusicalSampler } from '../wrappers/MusicalSampler.js';
import type {
  SampleLibraryConfig,
  SampledInstrument,
  LoadingState,
  InstrumentReference
} from './types.js';

/**
 * Manages loading and accessing sample libraries.
 *
 * Features:
 * - Load multiple libraries simultaneously
 * - Type-safe instrument lookup
 * - Lazy loading of instruments
 * - Memory management
 *
 * @example
 * ```typescript
 * const manager = new SampleLibraryManager();
 *
 * // Load GeneralUser GS SoundFont
 * await manager.loadLibrary({
 *   name: 'GeneralUserGS',
 *   format: 'soundfont',
 *   url: 'https://example.com/GeneralUser.sf2'
 * });
 *
 * // Get a sampled piano
 * const piano = manager.getInstrument('GeneralUserGS:AcousticGrandPiano');
 * ```
 */
export class SampleLibraryManager {
  private libraries = new Map<string, SampledInstrument[]>();
  private loadingStates = new Map<string, LoadingState>();
  private loaders = new Map<string, SoundFontLoader>();
  private cachedSamplers = new Map<string, MusicalSampler>();

  constructor() {
    // Register default loader for SoundFonts
    this.loaders.set('soundfont', new SoundFontLoader());
  }

  /**
   * Load a sample library.
   *
   * @param config - Library configuration
   * @returns Promise that resolves when library is loaded
   */
  async loadLibrary(config: SampleLibraryConfig): Promise<void> {
    const { name, format } = config;

    // Check if already loaded
    if (this.libraries.has(name)) {
      console.warn(`Library ${name} is already loaded`);
      return;
    }

    // Set loading state
    this.loadingStates.set(name, { status: 'loading', progress: 0 });

    try {
      // Get appropriate loader
      const loader = this.loaders.get(format);
      if (!loader) {
        throw new Error(`No loader registered for format: ${format}`);
      }

      // Load instruments
      const instruments = await loader.load(config);

      // Store in registry
      this.libraries.set(name, instruments);

      // Update state
      this.loadingStates.set(name, {
        status: 'loaded',
        instrumentCount: instruments.length
      });

      console.log(`[SampleLibraryManager] Loaded ${name}: ${instruments.length} instruments`);
    } catch (error) {
      this.loadingStates.set(name, {
        status: 'error',
        error: error as Error
      });
      throw error;
    }
  }

  /**
   * Get a sampler for a qualified instrument name.
   *
   * @param qualifiedName - Format: 'LibraryName:InstrumentName'
   * @returns MusicalSampler instance
   * @throws Error if library or instrument not found
   */
  getInstrument(qualifiedName: InstrumentReference): MusicalSampler {
    // Check cache first
    if (this.cachedSamplers.has(qualifiedName)) {
      return this.cachedSamplers.get(qualifiedName)!;
    }

    // Parse qualified name
    const [libraryName, instrumentName] = qualifiedName.split(':');

    if (!libraryName || !instrumentName) {
      throw new Error(
        `Invalid qualified instrument name: ${qualifiedName}. ` +
        `Expected format: 'LibraryName:InstrumentName'`
      );
    }

    // Get library
    const library = this.libraries.get(libraryName);
    if (!library) {
      throw new Error(
        `Library not loaded: ${libraryName}. ` +
        `Available libraries: ${Array.from(this.libraries.keys()).join(', ')}`
      );
    }

    // Find instrument
    const instrument = library.find(i => i.name === instrumentName);
    if (!instrument) {
      throw new Error(
        `Instrument not found: ${instrumentName} in library ${libraryName}. ` +
        `Available instruments: ${library.map(i => i.name).slice(0, 5).join(', ')}...`
      );
    }

    // Create sampler
    const sampler = new MusicalSampler(instrument);

    // Cache for reuse
    this.cachedSamplers.set(qualifiedName, sampler);

    return sampler;
  }

  /**
   * List all available instruments in a library.
   */
  listInstruments(libraryName: string): SampledInstrument[] {
    const library = this.libraries.get(libraryName);
    if (!library) {
      throw new Error(`Library not loaded: ${libraryName}`);
    }
    return library;
  }

  /**
   * Get all loaded libraries.
   */
  getLibraries(): string[] {
    return Array.from(this.libraries.keys());
  }

  /**
   * Get loading state for a library.
   */
  getLoadingState(libraryName: string): LoadingState {
    return this.loadingStates.get(libraryName) || { status: 'idle' };
  }

  /**
   * Check if a library is loaded.
   */
  isLibraryLoaded(libraryName: string): boolean {
    const state = this.loadingStates.get(libraryName);
    return state?.status === 'loaded';
  }

  /**
   * Unload a library and release resources.
   */
  unloadLibrary(libraryName: string): void {
    // Dispose cached samplers from this library
    for (const [key, sampler] of this.cachedSamplers.entries()) {
      if (key.startsWith(`${libraryName}:`)) {
        sampler.dispose();
        this.cachedSamplers.delete(key);
      }
    }

    // Remove from registry
    this.libraries.delete(libraryName);
    this.loadingStates.delete(libraryName);

    console.log(`[SampleLibraryManager] Unloaded library: ${libraryName}`);
  }

  /**
   * Dispose all resources.
   */
  dispose(): void {
    // Dispose all cached samplers
    for (const sampler of this.cachedSamplers.values()) {
      sampler.dispose();
    }

    // Clear all maps
    this.cachedSamplers.clear();
    this.libraries.clear();
    this.loadingStates.clear();
  }
}
```

### 3.4 Modified CompositionScheduler

Update the scheduler to support both synths and samplers.

```typescript
// packages/tone-adapter/src/scheduling/CompositionScheduler.ts
// MODIFICATIONS ONLY (not full file)

import { SampleLibraryManager } from '../samples/SampleLibraryManager.js';
import { MusicalSampler } from '../wrappers/MusicalSampler.js';

/**
 * Instrument instance - can be synth or sampler.
 */
interface InstrumentInstance {
  name: string;
  instrument: Tone.PolySynth | MusicalSampler;
  type: 'synth' | 'sampler';
}

export class CompositionScheduler {
  private scheduledEvents: number[] = [];
  private instruments = new Map<string, InstrumentInstance>();
  private sampleLibraryManager: SampleLibraryManager | null = null;

  /**
   * Set the sample library manager.
   * Must be called before scheduling compositions with sampled instruments.
   */
  setSampleLibraryManager(manager: SampleLibraryManager): void {
    this.sampleLibraryManager = manager;
  }

  /**
   * Get or create an instrument instance.
   * Supports both Tone.js synths and sampled instruments.
   */
  private getOrCreateInstrument(instrumentName: string): Tone.PolySynth | MusicalSampler {
    let instance = this.instruments.get(instrumentName);

    if (!instance) {
      // Check if it's a qualified sample library reference
      if (instrumentName.includes(':')) {
        // Sampled instrument: 'LibraryName:InstrumentName'
        if (!this.sampleLibraryManager) {
          throw new Error(
            'Sample library manager not configured. ' +
            'Call setSampleLibraryManager() before using sampled instruments.'
          );
        }

        const sampler = this.sampleLibraryManager.getInstrument(
          instrumentName as any
        );

        sampler.toDestination();

        instance = {
          name: instrumentName,
          instrument: sampler,
          type: 'sampler',
        };
      } else {
        // Default Tone.js synth
        const synth = new Tone.PolySynth(Tone.Synth).toDestination();

        instance = {
          name: instrumentName,
          instrument: synth,
          type: 'synth',
        };
      }

      this.instruments.set(instrumentName, instance);
    }

    return instance.instrument;
  }

  // ... rest of CompositionScheduler remains the same
}
```

---

## 4. API Examples

### 4.1 Basic Usage

```typescript
import { Composition, Track, Voice, PatternBuilder, BPM } from '@contour/core';
import { SampleLibraryManager } from '@contour/tone-adapter';

// 1. Create sample library manager
const sampleManager = new SampleLibraryManager();

// 2. Load GeneralUser GS SoundFont (hosted on CDN)
await sampleManager.loadLibrary({
  name: 'GeneralUserGS',
  format: 'soundfont',
  url: 'https://cdn.example.com/soundfonts/GeneralUser-GS.sf2',
  options: {
    preload: true,
    quality: 'high'
  }
});

// 3. Create patterns
const melodyPattern = new PatternBuilder()
  .notes(['C4', 'E4', 'G4', 'B4'])
  .build();

const bassPattern = new PatternBuilder()
  .notes(['C2', 'G2', 'C2', 'G2'])
  .build();

// 4. Create voices with sampled instruments
const melody = new Voice(
  melodyPattern,
  'GeneralUserGS:AcousticGrandPiano'  // ✅ Type-safe instrument reference
);

const bass = new Voice(
  bassPattern,
  'GeneralUserGS:AcousticBass'
);

// 5. Create composition
const composition = new Composition('My Song', BPM(120))
  .addTrack(new Track('Piano', [melody]))
  .addTrack(new Track('Bass', [bass]));

// 6. Schedule and play
const scheduler = new CompositionScheduler();
scheduler.setSampleLibraryManager(sampleManager);
scheduler.scheduleComposition(composition);

await scheduler.start();
```

### 4.2 Mixing Synths and Samples

```typescript
import { Voice } from '@contour/core';

// Sampled piano
const piano = new Voice(melodyPattern, 'GeneralUserGS:AcousticGrandPiano');

// Tone.js synth for bass
const synthBass = new Voice(bassPattern, 'synth');

// Mix both in same composition
const composition = new Composition('Hybrid', BPM(140))
  .addTrack(new Track('Sampled Piano', [piano]))
  .addTrack(new Track('Synth Bass', [synthBass]));
```

### 4.3 Playground: Toggle Between Synth and Samples

```typescript
// packages/playground/src/ui/InstrumentSelector.ts

import type { InstrumentReference } from '@contour/core';
import { SampleLibraryManager } from '@contour/tone-adapter';

/**
 * UI component for toggling between synth and samples.
 */
export class InstrumentSelector {
  private currentMode: 'synth' | 'samples' = 'synth';
  private sampleManager: SampleLibraryManager;
  private loadedLibrary: string | null = null;

  constructor() {
    this.sampleManager = new SampleLibraryManager();
  }

  /**
   * Load sample library for the playground.
   */
  async loadSamples(): Promise<void> {
    if (this.loadedLibrary) {
      console.log('[InstrumentSelector] Samples already loaded');
      return;
    }

    try {
      // Load lightweight GM SoundFont from CDN
      await this.sampleManager.loadLibrary({
        name: 'FluidR3',
        format: 'soundfont',
        url: 'https://cdn.example.com/soundfonts/FluidR3_GM.sf2',
        options: {
          preload: true,
          quality: 'medium'
        }
      });

      this.loadedLibrary = 'FluidR3';
      console.log('[InstrumentSelector] Samples loaded successfully');
    } catch (error) {
      console.error('[InstrumentSelector] Failed to load samples:', error);
      throw error;
    }
  }

  /**
   * Toggle between synth and samples mode.
   */
  async toggleMode(): Promise<void> {
    if (this.currentMode === 'synth') {
      // Switch to samples
      if (!this.loadedLibrary) {
        await this.loadSamples();
      }
      this.currentMode = 'samples';
    } else {
      // Switch to synth
      this.currentMode = 'synth';
    }

    console.log(`[InstrumentSelector] Switched to ${this.currentMode} mode`);
    this.updateUI();
  }

  /**
   * Get instrument reference based on current mode.
   *
   * @param instrumentType - Generic instrument type (piano, strings, etc.)
   * @returns Qualified instrument reference
   */
  getInstrument(instrumentType: string): InstrumentReference {
    if (this.currentMode === 'samples' && this.loadedLibrary) {
      // Map generic types to GM instruments
      const mapping: Record<string, string> = {
        piano: 'AcousticGrandPiano',
        strings: 'StringEnsemble1',
        bass: 'AcousticBass',
        guitar: 'AcousticGuitarSteel',
        drums: 'TaikoDrum',
        // ... more mappings
      };

      const gmInstrument = mapping[instrumentType] || 'AcousticGrandPiano';
      return `${this.loadedLibrary}:${gmInstrument}` as any;
    } else {
      // Default synth
      return 'synth' as any;
    }
  }

  /**
   * Get the sample library manager.
   */
  getSampleManager(): SampleLibraryManager {
    return this.sampleManager;
  }

  /**
   * Update UI to reflect current mode.
   */
  private updateUI(): void {
    const toggleBtn = document.getElementById('instrumentToggle');
    if (toggleBtn) {
      toggleBtn.textContent = this.currentMode === 'synth'
        ? '🎹 Synth'
        : '🎼 Samples';
      toggleBtn.setAttribute('data-mode', this.currentMode);
    }
  }

  /**
   * Dispose resources.
   */
  dispose(): void {
    this.sampleManager.dispose();
  }
}
```

### 4.4 Multiple Libraries

```typescript
// Load multiple libraries for different purposes
const manager = new SampleLibraryManager();

// Classical instruments
await manager.loadLibrary({
  name: 'GeneralUserGS',
  format: 'soundfont',
  url: 'https://cdn.example.com/GeneralUser-GS.sf2'
});

// Electronic sounds
await manager.loadLibrary({
  name: 'SynthMaster',
  format: 'soundfont',
  url: 'https://cdn.example.com/SynthMaster.sf2'
});

// Use instruments from different libraries
const classicalPiano = new Voice(pattern, 'GeneralUserGS:AcousticGrandPiano');
const synthLead = new Voice(pattern, 'SynthMaster:Lead1Square');
```

### 4.5 Exporting with Samples

MIDI export preserves instrument names (via program numbers):

```typescript
import { MIDIRenderer } from '@contour/plugin-midi';

// Composition with sampled instruments
const composition = new Composition('Orchestral', BPM(90))
  .addTrack(new Track('Violin', [
    new Voice(violinPattern, 'GeneralUserGS:Violin')
  ]))
  .addTrack(new Track('Cello', [
    new Voice(celloPattern, 'GeneralUserGS:Cello')
  ]));

// Export to MIDI - program numbers preserved
const renderer = new MIDIRenderer();
await renderer.initialize({ format: 1, ticksPerBeat: 480 });
const result = await renderer.render(composition);

// When imported into DAW, will use violin/cello sounds
await writeFile('orchestral.mid', result.data);
```

---

## 5. Implementation Plan

### 5.1 Phase 1: Core Infrastructure (Week 1)

**Dependencies:**
```json
{
  "packages/tone-adapter/package.json": {
    "dependencies": {
      "sf2-parser": "^1.3.0"
    }
  }
}
```

**Files to Create:**
1. ✅ `packages/core/src/types/brands.ts` - Add `InstrumentReference` type
2. ✅ `packages/tone-adapter/src/samples/types.ts` - Type definitions
3. ✅ `packages/tone-adapter/src/samples/SoundFontLoader.ts` - .sf2 parser
4. ✅ `packages/tone-adapter/src/wrappers/MusicalSampler.ts` - Tone.Sampler wrapper

**Tests:**
- [ ] Unit tests for SoundFontLoader
- [ ] Unit tests for MusicalSampler
- [ ] Type checking tests

### 5.2 Phase 2: Sample Library Manager (Week 1-2)

**Files to Create:**
1. ✅ `packages/tone-adapter/src/samples/SampleLibraryManager.ts`
2. ✅ `packages/tone-adapter/src/samples/index.ts` - Public API exports

**Files to Modify:**
1. ✅ `packages/tone-adapter/src/scheduling/CompositionScheduler.ts` - Add sampler support
2. ✅ `packages/tone-adapter/src/index.ts` - Export sample library APIs

**Tests:**
- [ ] Integration tests for library loading
- [ ] Tests for instrument lookup
- [ ] Tests for mixing synths and samplers

### 5.3 Phase 3: Playground Integration (Week 2)

**Files to Create:**
1. ✅ `packages/playground/src/ui/InstrumentSelector.ts` - Toggle UI component
2. ✅ `packages/playground/src/samples/presets.ts` - Sample library configs

**Files to Modify:**
1. ✅ `packages/playground/src/main.ts` - Add instrument selector
2. ✅ `packages/playground/src/performance.ts` - Add toggle to grid demo
3. ✅ `packages/playground/index.html` - Add toggle button

**Features:**
- [ ] Toggle button in playground UI
- [ ] Load lightweight GM SoundFont on first use
- [ ] Visual feedback for loading state
- [ ] Keyboard shortcut for toggling (e.g., `I` for instrument)

### 5.4 Phase 4: Documentation & Examples (Week 2-3)

**Files to Create:**
1. ✅ `examples/sample-library-demo/` - Demo composition using samples
2. ✅ `docs/SAMPLE_LIBRARY_GUIDE.md` - User guide
3. ✅ Update `CLAUDE.md` - Add sample library section

**Examples:**
- [ ] Classical piano piece using GeneralUser GS
- [ ] Hybrid composition (synth + samples)
- [ ] Orchestra arrangement with multiple sampled instruments

---

## 6. Library Recommendations

### 6.1 SoundFont Sources

**GeneralUser GS** (Recommended for quality):
- URL: `https://schristiancollins.com/generaluser.php`
- Size: ~30 MB
- Instruments: 128 GM + percussion
- License: Free for non-commercial use

**FluidR3_GM** (Recommended for size):
- URL: `https://member.keymusician.com/Member/FluidR3_GM/index.html`
- Size: ~148 MB (can be subset)
- Instruments: Complete GM set
- License: MIT

**MuseScore SoundFont**:
- URL: `https://ftp.osuosl.org/pub/musescore/soundfont/MuseScore_General/`
- Size: ~35 MB (HQ version)
- Instruments: Full GM
- License: MIT

### 6.2 JavaScript Libraries

**Primary: sf2-parser**
- NPM: `npm install sf2-parser`
- Size: ~20 KB
- Features: Parse .sf2 binary format
- License: MIT

**Alternative: soundfont-player**
- NPM: `npm install soundfont-player`
- Size: ~15 KB
- Features: High-level SoundFont player (includes parser)
- Trade-off: Less control over Tone.js integration

**Recommendation:** Use `sf2-parser` for maximum control and Tone.js integration.

---

## 7. Unresolved Questions & Prototype Opportunities

### 7.1 Unresolved Questions

1. **Sample Loading Strategy:**
   - ❓ Preload all samples vs. lazy load on first use?
   - ❓ How to handle large SoundFonts (100+ MB)?
   - **Recommendation:** Lazy load by default with `preload: true` option

2. **Memory Management:**
   - ❓ When to unload unused samples?
   - ❓ LRU cache for sampler instances?
   - **Recommendation:** Prototype and measure memory usage

3. **Browser Compatibility:**
   - ❓ Does sf2-parser work in all modern browsers?
   - ❓ Web Worker for parsing large files?
   - **Action:** Test in Chrome, Firefox, Safari

4. **Hot-Reload Handling:**
   - ❓ How to handle sample library changes during HMR?
   - ❓ Graceful fallback if samples fail to load?
   - **Recommendation:** Keep loaded samples in memory during HMR

5. **Type Safety:**
   - ❓ Can we generate TypeScript types from loaded SoundFonts?
   - ❓ Runtime validation vs. compile-time types?
   - **Recommendation:** Start with runtime validation, explore codegen later

### 7.2 Prototype Opportunities

1. **Web Worker Parsing:**
   ```typescript
   // Parse large SoundFonts in background thread
   const worker = new Worker('soundfont-parser.worker.js');
   worker.postMessage({ url: 'large-soundfont.sf2' });
   ```

2. **Progressive Loading:**
   ```typescript
   // Load instrument definitions first, samples on-demand
   const instruments = await loader.loadMetadata(config);
   // Later...
   await loader.loadSamples(instruments[0]);
   ```

3. **Generated Type Definitions:**
   ```typescript
   // Auto-generate from loaded library
   type GeneralUserGS_Instruments =
     | 'AcousticGrandPiano'
     | 'BrightAcousticPiano'
     | ... // All 128 instruments
   ```

4. **Streaming Sample Loading:**
   ```typescript
   // Stream samples as needed rather than loading all at once
   async function* loadSamplesIncrementally(soundFont) {
     for (const instrument of soundFont.instruments) {
       yield instrument;
     }
   }
   ```

---

## 8. Success Criteria

### 8.1 Functional Requirements

- [x] ✅ Load .sf2 SoundFont files from URLs
- [ ] ⏳ Support local file paths (file://)
- [x] ✅ Type-safe instrument names (TypeScript autocomplete)
- [x] ✅ Work with existing Track/Voice/Pattern APIs (no breaking changes)
- [x] ✅ Toggle between synth and samples in playground
- [ ] ⏳ Export compositions with samples to MIDI (preserves program numbers)
- [x] ✅ Zero new dependencies in `@contour/core` package

### 8.2 Performance Requirements

- [ ] ⏳ Load GeneralUser GS (<30 MB) in <3 seconds on typical connection
- [ ] ⏳ Instrument switching latency <100ms
- [ ] ⏳ Memory usage <100 MB for single library
- [ ] ⏳ No audio glitches when toggling modes

### 8.3 Developer Experience

- [x] ✅ Clear error messages when library/instrument not found
- [x] ✅ TypeScript autocomplete for GM instrument names
- [x] ✅ Simple API: 3-5 lines to load and use samples
- [ ] ⏳ Comprehensive documentation with examples
- [ ] ⏳ Example composition using sampled orchestra

### 8.4 Testing Requirements

- [ ] ⏳ Unit tests for all core components (>80% coverage)
- [ ] ⏳ Integration tests for library loading
- [ ] ⏳ Browser compatibility tests (Chrome, Firefox, Safari)
- [ ] ⏳ Memory leak tests (load/unload cycles)
- [ ] ⏳ Performance benchmarks

---

## 9. Migration Path

### 9.1 Backward Compatibility

**All existing code continues to work without changes:**

```typescript
// Existing code - no changes required
const voice = new Voice(pattern, 'synth');
const composition = new Composition(/* ... */);
```

**Opt-in to samples:**

```typescript
// New code - opt-in to sample libraries
const voice = new Voice(pattern, 'GeneralUserGS:AcousticGrandPiano');
```

### 9.2 Gradual Adoption

**Phase 1:** Use synths (current behavior)
```typescript
const piano = new Voice(pattern, 'synth');
```

**Phase 2:** Load library, but still use synths
```typescript
await sampleManager.loadLibrary(config);
const piano = new Voice(pattern, 'synth'); // Still synth
```

**Phase 3:** Switch specific instruments to samples
```typescript
const piano = new Voice(pattern, 'GeneralUserGS:AcousticGrandPiano');
const bass = new Voice(pattern, 'synth'); // Mix and match
```

**Phase 4:** Use samples by default
```typescript
// All instruments use samples
const piano = new Voice(pattern, 'GeneralUserGS:AcousticGrandPiano');
const strings = new Voice(pattern, 'GeneralUserGS:StringEnsemble1');
```

---

## 10. Future Enhancements

### 10.1 Additional Formats

- **SFZ format:** Text-based sample definitions (easier to parse)
- **Custom sample packs:** User-provided WAV/MP3 files with JSON manifest
- **Streamed samples:** Load from cloud storage on-demand

### 10.2 Advanced Features

- **Velocity layers:** Multi-sample instruments based on velocity
- **Round-robin samples:** Alternate samples for realism
- **Articulations:** Support for different playing techniques
- **Effects per instrument:** Built-in reverb, chorus, etc.

### 10.3 Developer Tools

- **Sample library inspector:** Browse loaded instruments in debug panel
- **Instrument preview:** Hear samples before using in composition
- **Library builder:** Create custom libraries from WAV files

### 10.4 Performance Optimizations

- **Waveform caching:** Reuse decoded audio buffers
- **Compression:** Use Opus/MP3 instead of raw WAV
- **Partial loading:** Load only used instruments from large SoundFonts

---

## 11. Conclusion

This specification defines a comprehensive architecture for external sample library loading in Contour that:

1. ✅ **Maintains zero coupling** - Core package remains dependency-free
2. ✅ **Integrates seamlessly** - Works with existing Track/Voice/Pattern APIs
3. ✅ **Provides type safety** - TypeScript autocomplete for instrument names
4. ✅ **Enables flexibility** - Mix synths and samples in same composition
5. ✅ **Supports playground** - Toggle between synth and samples for demos

### Next Steps

1. **Review & Approve** - Stakeholders review this specification
2. **Prototype Phase 1** - Implement core infrastructure with small test SoundFont
3. **Measure Performance** - Benchmark loading times and memory usage
4. **Iterate** - Adjust based on prototype findings
5. **Implement Phases 2-4** - Complete feature rollout

### Questions for Implementation Team

1. Should we support local file paths or only URLs?
2. What's the target bundle size increase for tone-adapter package?
3. Should instrument selector be in playground or a reusable component?
4. Do we need CDN recommendations for hosting SoundFonts?
5. Should we provide a default hosted SoundFont for easy onboarding?

---

## Appendix A: Architecture Diagram

```
┌────────────────────────────────────────────────────────────────┐
│                    User Application Layer                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Composition with mixed synth + sample instruments       │  │
│  │                                                          │  │
│  │  Voice('melody', 'GeneralUserGS:AcousticGrandPiano')    │  │
│  │  Voice('bass', 'synth')  // Default Tone.js synth       │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│                  Contour Core (@contour/core)                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Pattern, Track, Voice, Composition                      │  │
│  │  InstrumentReference (branded type)                      │  │
│  │  Zero external dependencies                              │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│              Tone Adapter (@contour/tone-adapter)              │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              CompositionScheduler                        │  │
│  │  ┌────────────────────┐  ┌──────────────────────────┐   │  │
│  │  │ getOrCreateInstr() │  │ setSampleLibraryManager()│   │  │
│  │  └────────┬───────────┘  └──────────────────────────┘   │  │
│  │           │                                              │  │
│  │     ┌─────▼─────────────────────┐                       │  │
│  │     │  Is qualified? (has ':')  │                       │  │
│  │     └────┬───────────────┬──────┘                       │  │
│  │          │ YES           │ NO                            │  │
│  │          ▼               ▼                               │  │
│  │  ┌───────────────┐  ┌──────────┐                        │  │
│  │  │ MusicalSampler│  │ PolySynth│                        │  │
│  │  └───────┬───────┘  └──────────┘                        │  │
│  └──────────┼───────────────────────────────────────────────┘  │
│             │                                                  │
│  ┌──────────▼────────────────────────────────────────────┐    │
│  │          SampleLibraryManager                         │    │
│  │  ┌──────────────────────────────────────────────┐     │    │
│  │  │  Map<LibraryName, SampledInstrument[]>       │     │    │
│  │  └──────────────────────────────────────────────┘     │    │
│  │                                                        │    │
│  │  loadLibrary(config) ────▶ SoundFontLoader            │    │
│  │  getInstrument(name) ────▶ MusicalSampler             │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                │
│  ┌────────────────────────────────────────────────────────┐   │
│  │              SoundFontLoader                           │   │
│  │  fetchSoundFont(url) ──▶ ArrayBuffer                  │   │
│  │  parse() ──────────────▶ sf2-parser                   │   │
│  │  extractInstruments() ─▶ SampledInstrument[]          │   │
│  └────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────────┐
│                  Tone.js (Web Audio API)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Tone.Sampler    Tone.PolySynth    Tone.Transport       │  │
│  │  (Sample playback) (Synthesis)     (Scheduling)          │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

## Appendix B: File Structure Summary

```
contour-2.0/
├── packages/
│   ├── core/
│   │   └── src/
│   │       └── types/
│   │           └── brands.ts                   [MODIFIED - Add InstrumentReference]
│   │
│   └── tone-adapter/
│       ├── package.json                         [MODIFIED - Add sf2-parser]
│       └── src/
│           ├── index.ts                         [MODIFIED - Export sample APIs]
│           ├── wrappers/
│           │   ├── MusicalSynth.ts             [EXISTING]
│           │   └── MusicalSampler.ts            [NEW - Tone.Sampler wrapper]
│           ├── samples/                         [NEW DIRECTORY]
│           │   ├── index.ts                     [NEW - Public API]
│           │   ├── types.ts                     [NEW - Type definitions]
│           │   ├── SoundFontLoader.ts           [NEW - .sf2 parser]
│           │   └── SampleLibraryManager.ts      [NEW - Main orchestrator]
│           └── scheduling/
│               └── CompositionScheduler.ts      [MODIFIED - Support samplers]
│
├── packages/playground/
│   └── src/
│       ├── main.ts                              [MODIFIED - Add toggle]
│       ├── performance.ts                       [MODIFIED - Add toggle]
│       ├── ui/
│       │   └── InstrumentSelector.ts            [NEW - Toggle UI]
│       └── samples/
│           └── presets.ts                       [NEW - Sample configs]
│
└── docs/
    ├── SAMPLE_LIBRARY_SPEC.md                   [NEW - This document]
    └── SAMPLE_LIBRARY_GUIDE.md                  [NEW - User guide]
```

---

**End of Specification**
