# Contour: Technical Specification

**Version:** 2.0  
**Last Updated:** November 2025  
**Status:** Implementation Ready

## Overview

This document specifies the technical architecture, API contracts, and implementation details for Contour. All TypeScript interfaces and classes defined here are normative—implementations must match these signatures exactly.

## Architecture Overview

### Four-Layer System
```
┌──────────────────────────────────────────────────┐
│ Layer 4: DSL Syntax                              │
│ (User-facing API: track(), sequence(), etc.)     │
└────────────────────┬─────────────────────────────┘
                     │
┌────────────────────┼─────────────────────────────┐
│ Layer 3: Composition Abstractions                │
│ (Voice, Track, Composition, Pattern)             │
└────────────────────┬─────────────────────────────┘
                     │
┌────────────────────┼─────────────────────────────┐
│ Layer 2: Musical Wrappers                        │
│ (Thin adapters with musical terminology)         │
└────────────────────┬─────────────────────────────┘
                     │
┌────────────────────┼─────────────────────────────┐
│ Layer 1: Tone.js Primitives (Unchanged)          │
│ (Synth, Transport, Signal, Effects)              │
└──────────────────────────────────────────────────┘
```

**Critical Principle:** Users must always be able to drop down to any layer when they need fine control. Never hide Tone.js completely.

## Type System

### Branded Types

Branded types prevent unit mixing at compile time:

```typescript
// packages/core/src/types/brands.ts

/**
 * Frequency in Hertz. Prevents mixing with other numeric types.
 */
export type Hz = number & { readonly __brand: 'Hz' };

/**
 * Tempo in beats per minute.
 */
export type BPM = number & { readonly __brand: 'BPM' };

/**
 * Time in seconds.
 */
export type Seconds = number & { readonly __brand: 'Seconds' };

/**
 * MIDI note number (0-127).
 */
export type MIDINote = number & { readonly __brand: 'MIDINote' };

/**
 * Musical velocity (0-127).
 */
export type Velocity = number & { readonly __brand: 'Velocity' };

// Constructor functions with validation
export const Hz = (value: number): Hz => {
  if (value < 20 || value > 20000) {
    throw new RangeError(`Hz must be between 20 and 20000, got ${value}`);
  }
  return value as Hz;
};

export const BPM = (value: number): BPM => {
  if (value <= 0 || value > 999) {
    throw new RangeError(`BPM must be between 0 and 999, got ${value}`);
  }
  return value as BPM;
};

export const Seconds = (value: number): Seconds => {
  if (value < 0) {
    throw new RangeError(`Seconds cannot be negative, got ${value}`);
  }
  return value as Seconds;
};

export const MIDINote = (value: number): MIDINote => {
  if (!Number.isInteger(value) || value < 0 || value > 127) {
    throw new RangeError(`MIDI note must be integer 0-127, got ${value}`);
  }
  return value as MIDINote;
};

export const Velocity = (value: number): Velocity => {
  if (!Number.isInteger(value) || value < 0 || value > 127) {
    throw new RangeError(`Velocity must be integer 0-127, got ${value}`);
  }
  return value as Velocity;
};
```

### Musical Type Primitives

```typescript
// packages/core/src/types/music.ts

/**
 * Musical note letter names.
 */
export type NoteLetter = 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B';

/**
 * Accidentals (sharp, flat, natural).
 */
export type Accidental = '' | '#' | 'b';

/**
 * Octave number (scientific pitch notation).
 */
export type Octave = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';

/**
 * Complete note name with compile-time validation.
 * Examples: 'C4', 'F#5', 'Bb3'
 */
export type NoteName = `${NoteLetter}${Accidental}${Octave}`;

/**
 * Musical duration as fraction of whole note.
 * 1 = whole, 0.5 = half, 0.25 = quarter, etc.
 */
export type Duration = number & { readonly __brand: 'Duration' };

export const Duration = (value: number): Duration => {
  if (value <= 0) {
    throw new RangeError(`Duration must be positive, got ${value}`);
  }
  return value as Duration;
};

/**
 * Common duration constants.
 */
export const Durations = {
  whole: Duration(1),
  half: Duration(0.5),
  quarter: Duration(0.25),
  eighth: Duration(0.125),
  sixteenth: Duration(0.0625),
  thirtysecond: Duration(0.03125),
  
  // Dotted durations
  dottedHalf: Duration(0.75),
  dottedQuarter: Duration(0.375),
  dottedEighth: Duration(0.1875),
} as const;
```

### Interval and Chord Types

```typescript
// packages/core/src/types/harmony.ts

/**
 * Musical interval in semitones.
 */
export type Interval = number & { readonly __brand: 'Interval' };

export const Interval = (semitones: number): Interval => {
  return semitones as Interval;
};

/**
 * Common interval constants.
 */
export const Intervals = {
  unison: Interval(0),
  minorSecond: Interval(1),
  majorSecond: Interval(2),
  minorThird: Interval(3),
  majorThird: Interval(4),
  perfectFourth: Interval(5),
  augmentedFourth: Interval(6), // tritone
  perfectFifth: Interval(7),
  minorSixth: Interval(8),
  majorSixth: Interval(9),
  minorSeventh: Interval(10),
  majorSeventh: Interval(11),
  octave: Interval(12),
} as const;

/**
 * Chord quality types.
 */
export type ChordQuality = 
  | 'major' | 'minor' | 'diminished' | 'augmented'
  | 'sus2' | 'sus4'
  | 'major7' | 'minor7' | 'dominant7' | 'diminished7' | 'halfDiminished7'
  | 'major9' | 'minor9' | 'dominant9'
  | 'major11' | 'minor11' | 'dominant11'
  | 'major13' | 'minor13' | 'dominant13';

/**
 * Chord symbol parser result.
 */
export interface ChordSymbol {
  root: NoteName;
  quality: ChordQuality;
  extensions: number[];
  alterations: string[];
  bass?: NoteName; // For slash chords
}
```

## Core Classes

### Note Class

```typescript
// packages/core/src/primitives/Note.ts

/**
 * Immutable representation of a musical note.
 */
export class Note {
  readonly pitch: MIDINote;
  readonly name: NoteName;
  readonly frequency: Hz;
  
  constructor(name: NoteName, octave?: Octave) {
    // If octave provided separately, combine with name
    // Otherwise parse from NoteName
    this.name = octave ? `${name}${octave}` as NoteName : name;
    this.pitch = this.noteToPitch(this.name);
    this.frequency = this.pitchToFrequency(this.pitch);
  }
  
  /**
   * Transpose by semitones (returns new Note).
   */
  transpose(semitones: number): Note {
    const newPitch = MIDINote(this.pitch + semitones);
    return Note.fromMIDI(newPitch);
  }
  
  /**
   * Get enharmonic equivalent (e.g., C# <-> Db).
   */
  enharmonic(): Note {
    // Implementation determines enharmonic spelling
    throw new Error('Not implemented');
  }
  
  /**
   * Interval from this note to another.
   */
  intervalTo(other: Note): Interval {
    return Interval(other.pitch - this.pitch);
  }
  
  /**
   * Create Note from MIDI number.
   */
  static fromMIDI(pitch: MIDINote): Note {
    // Convert MIDI to NoteName
    throw new Error('Not implemented');
  }
  
  /**
   * Create Note from frequency.
   */
  static fromFrequency(freq: Hz): Note {
    // Convert Hz to nearest MIDI note
    throw new Error('Not implemented');
  }
  
  private noteToPitch(name: NoteName): MIDINote {
    // Parse NoteName to MIDI number
    throw new Error('Not implemented');
  }
  
  private pitchToFrequency(pitch: MIDINote): Hz {
    // A4 = 440 Hz, 12-TET tuning
    return Hz(440 * Math.pow(2, (pitch - 69) / 12));
  }
}

/**
 * Convenience functions for common notes.
 */
export const C = (octave: Octave = '4') => new Note(`C${octave}` as NoteName);
export const Db = (octave: Octave = '4') => new Note(`Db${octave}` as NoteName);
export const D = (octave: Octave = '4') => new Note(`D${octave}` as NoteName);
// ... all note names
```

### Event Interface

```typescript
// packages/core/src/primitives/Event.ts

/**
 * Musical event in time.
 */
export interface MusicalEvent {
  readonly time: Seconds;
  readonly duration: Duration;
  readonly velocity: Velocity;
}

/**
 * Note event (extends MusicalEvent).
 */
export interface NoteEvent extends MusicalEvent {
  readonly type: 'note';
  readonly pitch: MIDINote;
  readonly note: Note;
}

/**
 * Rest event.
 */
export interface RestEvent extends MusicalEvent {
  readonly type: 'rest';
}

/**
 * Chord event (multiple simultaneous notes).
 */
export interface ChordEvent extends MusicalEvent {
  readonly type: 'chord';
  readonly notes: Note[];
}

export type Event = NoteEvent | RestEvent | ChordEvent;
```

### Pattern Class

```typescript
// packages/core/src/patterns/Pattern.ts

/**
 * Immutable pattern of musical events.
 */
export class Pattern {
  readonly events: ReadonlyArray<Event>;
  readonly duration: Duration;
  
  constructor(events: Event[]) {
    this.events = Object.freeze([...events]);
    this.duration = this.calculateDuration();
  }
  
  /**
   * Transpose all notes by semitones (returns new Pattern).
   */
  transpose(semitones: number): Pattern {
    const newEvents = this.events.map(event => {
      if (event.type === 'note') {
        return {
          ...event,
          note: event.note.transpose(semitones),
          pitch: MIDINote(event.pitch + semitones),
        };
      }
      if (event.type === 'chord') {
        return {
          ...event,
          notes: event.notes.map(n => n.transpose(semitones)),
        };
      }
      return event;
    });
    return new Pattern(newEvents);
  }
  
  /**
   * Reverse the pattern (retrograde).
   */
  retrograde(): Pattern {
    const totalDuration = this.duration;
    const newEvents = [...this.events].reverse().map(event => ({
      ...event,
      time: Seconds(totalDuration - event.time - event.duration),
    }));
    return new Pattern(newEvents);
  }
  
  /**
   * Change speed (fast multiplies speed, slow divides).
   */
  fast(factor: number): Pattern {
    const newEvents = this.events.map(event => ({
      ...event,
      time: Seconds(event.time / factor),
      duration: Duration(event.duration / factor),
    }));
    return new Pattern(newEvents);
  }
  
  slow(factor: number): Pattern {
    return this.fast(1 / factor);
  }
  
  /**
   * Apply transformation every N cycles.
   */
  every(n: number, transform: (p: Pattern) => Pattern): Pattern {
    // Implementation applies transform conditionally
    throw new Error('Not implemented');
  }
  
  /**
   * Functional map over events.
   */
  map<T extends Event>(fn: (event: Event) => T): Pattern {
    return new Pattern(this.events.map(fn));
  }
  
  /**
   * Functional filter.
   */
  filter(predicate: (event: Event) => boolean): Pattern {
    return new Pattern(this.events.filter(predicate));
  }
  
  private calculateDuration(): Duration {
    if (this.events.length === 0) return Duration(0);
    const lastEvent = this.events[this.events.length - 1];
    return Duration(lastEvent.time + lastEvent.duration);
  }
}
```

### PatternBuilder Class

```typescript
// packages/core/src/patterns/PatternBuilder.ts

/**
 * Fluent builder for constructing patterns.
 */
export class PatternBuilder {
  private events: Event[] = [];
  private currentTime: Seconds = Seconds(0);
  private defaultDuration: Duration = Durations.quarter;
  private defaultVelocity: Velocity = Velocity(80);
  
  /**
   * Add a single note.
   */
  note(
    note: Note | NoteName,
    duration?: Duration,
    velocity?: Velocity
  ): this {
    const noteObj = typeof note === 'string' ? new Note(note) : note;
    const dur = duration ?? this.defaultDuration;
    const vel = velocity ?? this.defaultVelocity;
    
    this.events.push({
      type: 'note',
      time: this.currentTime,
      duration: dur,
      velocity: vel,
      pitch: noteObj.pitch,
      note: noteObj,
    });
    
    this.currentTime = Seconds(this.currentTime + dur);
    return this;
  }
  
  /**
   * Add multiple notes sequentially.
   */
  notes(
    notes: (Note | NoteName)[],
    duration?: Duration,
    velocity?: Velocity
  ): this {
    for (const note of notes) {
      this.note(note, duration, velocity);
    }
    return this;
  }
  
  /**
   * Add a chord (simultaneous notes).
   */
  chord(
    notes: (Note | NoteName)[],
    duration?: Duration,
    velocity?: Velocity
  ): this {
    const noteObjs = notes.map(n => 
      typeof n === 'string' ? new Note(n) : n
    );
    const dur = duration ?? this.defaultDuration;
    const vel = velocity ?? this.defaultVelocity;
    
    this.events.push({
      type: 'chord',
      time: this.currentTime,
      duration: dur,
      velocity: vel,
      notes: noteObjs,
    });
    
    this.currentTime = Seconds(this.currentTime + dur);
    return this;
  }
  
  /**
   * Add a rest.
   */
  rest(duration?: Duration): this {
    const dur = duration ?? this.defaultDuration;
    
    this.events.push({
      type: 'rest',
      time: this.currentTime,
      duration: dur,
      velocity: Velocity(0),
    });
    
    this.currentTime = Seconds(this.currentTime + dur);
    return this;
  }
  
  /**
   * Set default duration for subsequent notes.
   */
  withDuration(duration: Duration): this {
    this.defaultDuration = duration;
    return this;
  }
  
  /**
   * Set default velocity for subsequent notes.
   */
  withVelocity(velocity: Velocity): this {
    this.defaultVelocity = velocity;
    return this;
  }
  
  /**
   * Apply crescendo (gradual velocity increase).
   */
  crescendo(startVel: number, endVel: number): this {
    const numEvents = this.events.length;
    this.events = this.events.map((event, i) => ({
      ...event,
      velocity: Velocity(
        Math.round(startVel + (endVel - startVel) * (i / numEvents))
      ),
    }));
    return this;
  }
  
  /**
   * Apply humanization (slight timing and velocity randomness).
   */
  humanize(timingAmount: number = 0.05, velocityAmount: number = 0.1): this {
    // Implementation adds controlled randomness
    return this;
  }
  
  /**
   * Apply swing rhythm.
   */
  swing(amount: number = 0.15): this {
    // Implementation delays off-beats
    return this;
  }
  
  /**
   * Build immutable Pattern.
   */
  build(): Pattern {
    return new Pattern(this.events);
  }
}

/**
 * Factory function for creating patterns.
 */
export const pattern = (name?: string): PatternBuilder => {
  return new PatternBuilder();
};
```

## Composition System

### Voice Class

```typescript
// packages/core/src/composition/Voice.ts

/**
 * Single voice in a composition (one pattern + instrument).
 */
export class Voice {
  readonly pattern: Pattern;
  readonly instrument: string; // Tone.js instrument identifier
  
  constructor(pattern: Pattern, instrument: string = 'synth') {
    this.pattern = pattern;
    this.instrument = instrument;
  }
  
  /**
   * Transform the voice's pattern.
   */
  transform(fn: (p: Pattern) => Pattern): Voice {
    return new Voice(fn(this.pattern), this.instrument);
  }
}
```

### Track Class

```typescript
// packages/core/src/composition/Track.ts

/**
 * Track containing one or more voices.
 */
export class Track {
  readonly name: string;
  readonly voices: ReadonlyArray<Voice>;
  
  constructor(name: string, voices: Voice[]) {
    this.name = name;
    this.voices = Object.freeze([...voices]);
  }
  
  /**
   * Add a voice to this track.
   */
  addVoice(voice: Voice): Track {
    return new Track(this.name, [...this.voices, voice]);
  }
  
  /**
   * Transform all voices in the track.
   */
  transform(fn: (v: Voice) => Voice): Track {
    return new Track(
      this.name,
      this.voices.map(fn)
    );
  }
}
```

### Composition Class

```typescript
// packages/core/src/composition/Composition.ts

/**
 * Complete composition with multiple tracks.
 */
export class Composition {
  readonly title: string;
  readonly tempo: BPM;
  readonly timeSignature: { numerator: number; denominator: number };
  readonly tracks: ReadonlyArray<Track>;
  
  constructor(
    title: string,
    tempo: BPM = BPM(120),
    timeSignature: { numerator: number; denominator: number } = { numerator: 4, denominator: 4 }
  ) {
    this.title = title;
    this.tempo = tempo;
    this.timeSignature = timeSignature;
    this.tracks = [];
  }
  
  /**
   * Add a track to the composition.
   */
  addTrack(track: Track): Composition {
    const comp = Object.create(Composition.prototype);
    comp.title = this.title;
    comp.tempo = this.tempo;
    comp.timeSignature = this.timeSignature;
    comp.tracks = Object.freeze([...this.tracks, track]);
    return comp;
  }
  
  /**
   * Change tempo (returns new Composition).
   */
  withTempo(tempo: BPM): Composition {
    const comp = Object.create(Composition.prototype);
    comp.title = this.title;
    comp.tempo = tempo;
    comp.timeSignature = this.timeSignature;
    comp.tracks = this.tracks;
    return comp;
  }
  
  /**
   * Calculate total duration.
   */
  get duration(): Seconds {
    const maxDuration = Math.max(
      ...this.tracks.flatMap(track =>
        track.voices.map(voice => voice.pattern.duration)
      )
    );
    return Seconds(maxDuration);
  }
}
```

## Plugin Architecture

### Renderer Plugin Interface

```typescript
// packages/core/src/plugins/RendererPlugin.ts

/**
 * Result of rendering operation.
 */
export interface RenderResult {
  data: Buffer | Blob | ArrayBuffer;
  format: string;
  metadata: {
    duration: Seconds;
    sampleRate?: number;
    bitDepth?: number;
    [key: string]: unknown;
  };
}

/**
 * Base interface for all renderer plugins.
 */
export interface RendererPlugin<TConfig = unknown> {
  /** Unique plugin identifier */
  readonly name: string;
  
  /** Semantic version */
  readonly version: string;
  
  /** Plugin dependencies (other plugin names) */
  readonly dependencies?: string[];
  
  /**
   * Initialize the plugin with configuration.
   */
  initialize(config: TConfig): Promise<void>;
  
  /**
   * Render a composition to the plugin's format.
   */
  render(composition: Composition): Promise<RenderResult>;
  
  /**
   * Cleanup resources.
   */
  shutdown(): Promise<void>;
}

/**
 * Plugin registry for managing renderers.
 */
export class PluginRegistry {
  private plugins = new Map<string, RendererPlugin>();
  
  /**
   * Register a plugin.
   */
  register<T>(plugin: RendererPlugin<T>): void {
    // Validate dependencies exist
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.plugins.has(dep)) {
          throw new Error(
            `Plugin ${plugin.name} depends on ${dep} which is not registered`
          );
        }
      }
    }
    
    this.plugins.set(plugin.name, plugin);
  }
  
  /**
   * Get plugin by name.
   */
  get(name: string): RendererPlugin {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin ${name} not found`);
    }
    return plugin;
  }
  
  /**
   * Get all registered plugins.
   */
  getAll(): RendererPlugin[] {
    return Array.from(this.plugins.values());
  }
}
```

### Audio Renderer Plugin

```typescript
// packages/plugins/audio/AudioRenderer.ts

export interface AudioRendererConfig {
  sampleRate: number;
  bitDepth: 16 | 24 | 32;
  format: 'wav';
  // Future: mp3Bitrate?: number; // kbps for MP3 (not yet implemented)
}

export class AudioRenderer implements RendererPlugin<AudioRendererConfig> {
  readonly name = 'audio';
  readonly version = '1.0.0';
  
  private config!: AudioRendererConfig;
  
  async initialize(config: AudioRendererConfig): Promise<void> {
    this.config = config;
  }
  
  async render(composition: Composition): Promise<RenderResult> {
    // Use Tone.Offline to render offline
    const duration = composition.duration;
    
    const buffer = await Tone.Offline(({ transport }) => {
      // Set up composition in Tone.js
      // Schedule all events
      // Start transport
    }, duration);
    
    // Convert buffer to desired format
    const audioData = this.encodeAudio(buffer);
    
    return {
      data: audioData,
      format: this.config.format,
      metadata: {
        duration,
        sampleRate: this.config.sampleRate,
        bitDepth: this.config.bitDepth,
      },
    };
  }
  
  async shutdown(): Promise<void> {
    // Cleanup
  }
  
  private encodeAudio(buffer: AudioBuffer): Buffer {
    // Implement encoding based on format
    throw new Error('Not implemented');
  }
}
```

## Tone.js Integration Layer

### Musical Scheduler

```typescript
// packages/tone-adapter/src/scheduling/Scheduler.ts

/**
 * Schedules Pattern events to Tone.Transport.
 */
export class PatternScheduler {
  private scheduledEvents: number[] = [];
  
  /**
   * Schedule a pattern to play.
   */
  schedule(pattern: Pattern, startTime: Seconds = Seconds(0)): void {
    pattern.events.forEach(event => {
      const eventTime = Seconds(startTime + event.time);
      
      if (event.type === 'note') {
        const id = Tone.Transport.schedule((time) => {
          // Trigger note at precise time
          this.triggerNote(event, time);
        }, eventTime);
        
        this.scheduledEvents.push(id);
      }
      
      // Handle other event types...
    });
  }
  
  /**
   * Clear all scheduled events.
   */
  clear(): void {
    this.scheduledEvents.forEach(id => {
      Tone.Transport.clear(id);
    });
    this.scheduledEvents = [];
  }
  
  private triggerNote(event: NoteEvent, time: number): void {
    // Convert Note to Tone.js format and trigger
    // This is where Layer 2 wrappers come in
  }
}
```

### Hot Module Replacement Handler

```typescript
// packages/tone-adapter/src/hmr/HMRHandler.ts

/**
 * Handles hot-reload without audio glitches.
 */
export class HMRHandler {
  private fadeTime = 0.3; // seconds
  
  /**
   * Prepare for module reload (fade out audio).
   */
  async prepareReload(): Promise<void> {
    const master = Tone.getDestination();
    
    // Fade out over fadeTime
    await master.volume.rampTo(-60, this.fadeTime);
    
    // Stop transport cleanly
    Tone.Transport.stop();
    Tone.Transport.cancel();
  }
  
  /**
   * Restore audio after reload (fade in).
   */
  async afterReload(): Promise<void> {
    const master = Tone.getDestination();
    
    // Fade back in
    await master.volume.rampTo(0, this.fadeTime);
    
    // Restart transport if it was playing
    Tone.Transport.start();
  }
}
```

## Debugging and Development Tools

Contour provides comprehensive debugging and monitoring tools for development and troubleshooting.

### TransportDebugger

A singleton class for tracking audio scheduling, detecting conflicts, and monitoring memory.

```typescript
// packages/tone-adapter/src/debug/TransportDebugger.ts

/**
 * Information about a scheduled event.
 */
export interface ScheduledEventInfo {
  id: number;
  time: string | number;
  callback: string; // Function name or description
  state: 'scheduled' | 'executed' | 'cancelled';
}

/**
 * Detected scheduling conflict.
 */
export interface ScheduleConflict {
  time: number;
  events: ScheduledEventInfo[];
  severity: 'warning' | 'error';
  message: string;
}

/**
 * Audio node tracking information.
 */
export interface AudioNodeInfo {
  type: string;
  created: number; // Timestamp
  disposed: boolean;
  id: number;
}

/**
 * Transport state snapshot.
 */
export interface TransportSnapshot {
  state: 'started' | 'stopped' | 'paused';
  bpm: number;
  timeSignature: number[];
  position: string;
  seconds: number;
  progress: number;
  loop: boolean;
  loopStart: number;
  loopEnd: number;
}

/**
 * Transport Debugger for monitoring Tone.Transport.
 *
 * Singleton class that provides utilities for debugging audio scheduling,
 * detecting conflicts, and tracking AudioNode creation.
 */
export class TransportDebugger {
  private static instance: TransportDebugger | null = null;

  /**
   * Get singleton instance.
   */
  static getInstance(): TransportDebugger;

  /**
   * Reset the debugger (useful for testing).
   */
  static reset(): void;

  /**
   * Get current transport state snapshot.
   */
  getTransportSnapshot(): TransportSnapshot;

  /**
   * Track a scheduled event.
   *
   * @returns Event ID for tracking
   */
  trackScheduledEvent(time: string | number, callback?: Function): number;

  /**
   * Mark an event as executed.
   */
  markEventExecuted(id: number): void;

  /**
   * Mark an event as cancelled.
   */
  markEventCancelled(id: number): void;

  /**
   * Get all scheduled events.
   */
  getScheduledEvents(): ScheduledEventInfo[];

  /**
   * Get pending (not yet executed) events.
   */
  getPendingEvents(): ScheduledEventInfo[];

  /**
   * Clear event tracking.
   */
  clearEvents(): void;

  /**
   * Detect scheduling conflicts.
   *
   * Looks for multiple events scheduled at very similar times
   * which might indicate unintended overlap.
   *
   * @param threshold - Time threshold in seconds (default: 0.001)
   */
  detectConflicts(threshold?: number): ScheduleConflict[];

  /**
   * Track an AudioNode creation.
   *
   * @returns Node ID for tracking
   */
  trackAudioNode(type: string): number;

  /**
   * Mark an AudioNode as disposed.
   */
  markNodeDisposed(id: number): void;

  /**
   * Get total count of created AudioNodes.
   */
  getAudioNodeCount(): number;

  /**
   * Get count of active (not disposed) AudioNodes.
   */
  getActiveNodeCount(): number;

  /**
   * Check for potential memory leaks.
   *
   * Returns AudioNodes that were created but never disposed
   * and are older than the threshold.
   *
   * @param ageThresholdMs - Age threshold in milliseconds (default: 60000)
   */
  checkForLeaks(ageThresholdMs?: number): AudioNodeInfo[];

  /**
   * Get all AudioNode information.
   */
  getAllNodes(): AudioNodeInfo[];

  /**
   * Clear all AudioNode tracking.
   */
  clearNodes(): void;

  /**
   * Generate a debug report as a formatted string.
   */
  generateReport(): string;

  /**
   * Print report to console.
   */
  printReport(): void;
}

/**
 * Convenience function to get debugger instance.
 */
export function getTransportDebugger(): TransportDebugger;
```

**Usage Example:**

```typescript
import { getTransportDebugger } from '@contour/tone-adapter';

const debugger = getTransportDebugger();

// Track scheduled events
const eventId = debugger.trackScheduledEvent('0:0:0', myCallback);

// Detect scheduling conflicts
const conflicts = debugger.detectConflicts();
conflicts.forEach(c => console.warn(c.message));

// Check for memory leaks
const leaks = debugger.checkForLeaks();
if (leaks.length > 0) {
  console.error(`Found ${leaks.length} potential AudioNode leaks`);
}

// Generate full diagnostic report
debugger.printReport();
```

### Debug Panel UI

The development server includes an interactive debug panel with four tabs.

```typescript
// packages/playground/src/ui/DebugPanel.ts

export type DebugPanelTab = 'transport' | 'patterns' | 'performance' | 'console';

export interface DebugPanelConfig {
  initialTab?: DebugPanelTab;
  position?: 'bottom' | 'right';
  visible?: boolean;
}

/**
 * Main container for development debugging tools.
 *
 * Provides tabs for:
 * - Transport Inspector
 * - Pattern Inspector
 * - Performance Monitor
 * - Console Log
 */
export class DebugPanel {
  constructor(config?: DebugPanelConfig);

  /**
   * Show the debug panel.
   */
  show(): void;

  /**
   * Hide the debug panel.
   */
  hide(): void;

  /**
   * Toggle panel visibility.
   */
  toggle(): void;

  /**
   * Get the PatternInspector component for registering/updating patterns.
   */
  getPatternInspector(): PatternInspector;

  /**
   * Clean up and remove panel.
   */
  dispose(): void;
}
```

**Keyboard Shortcut Integration:**

```typescript
// packages/playground/src/ui/KeyboardShortcuts.ts

export interface ShortcutDefinition {
  key: string;
  description: string;
  category: string;
}

/**
 * Keyboard Shortcuts Overlay - Help modal showing all keyboard commands.
 *
 * Press '?' to show shortcuts.
 */
export class KeyboardShortcuts {
  constructor();

  /**
   * Show the shortcuts modal.
   */
  show(): void;

  /**
   * Hide the shortcuts modal.
   */
  hide(): void;

  /**
   * Toggle modal visibility.
   */
  toggle(): void;

  /**
   * Check if modal is currently visible.
   */
  isVisible(): boolean;

  /**
   * Clean up and remove modal.
   */
  dispose(): void;
}
```

**Default Keyboard Shortcuts:**

| Key | Description | Category |
|-----|-------------|----------|
| `Space` | Play/Pause transport | Transport |
| `Esc` | Stop all playback | Transport |
| `Cmd/Ctrl + D` | Toggle debug panel | Debug Tools |
| `Cmd/Ctrl + K` | Open pattern playground | Debug Tools |
| `Cmd/Ctrl + Shift + I` | Inspect selected pattern | Debug Tools |
| `?` | Show keyboard shortcuts | Debug Tools |
| `1-4, Q-R, A-F, Z-V` | Trigger pattern pads | Pattern Grid |
| `Shift + Pad Key` | Edit pattern | Pattern Grid |
| `Cmd/Ctrl + Enter` | Run/Apply code | Editor |

## Testing Utilities

### Musical Matchers

```typescript
// packages/testing/src/matchers.ts

declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInKey(key: NoteName, mode: 'major' | 'minor'): R;
      toHaveRange(low: NoteName, high: NoteName): R;
      toBeRhythmicallyValid(): R;
      toMatchAudioBuffer(reference: AudioBuffer, threshold: number): R;
    }
  }
}

export const musicalMatchers = {
  toBeInKey(
    received: Pattern,
    key: NoteName,
    mode: 'major' | 'minor'
  ) {
    // Implementation checks if all notes are in the key
    const scale = mode === 'major' 
      ? majorScale(key)
      : minorScale(key);
    
    const allInKey = received.events.every(event => {
      if (event.type === 'note') {
        return scale.contains(event.note);
      }
      return true;
    });
    
    return {
      pass: allInKey,
      message: () => `Expected pattern to be in ${key} ${mode}`,
    };
  },
  
  // Other matchers...
};
```

## Configuration

### Vite Configuration

```typescript
// packages/playground/vite.config.ts

import { defineConfig } from 'vite';
import { musicHMRPlugin } from './plugins/musicHMR';

export default defineConfig({
  plugins: [
    musicHMRPlugin({
      fadeTime: 300, // ms
      maintainPosition: true,
    }),
  ],
  server: {
    port: 3000,
    hmr: {
      overlay: true,
    },
  },
  build: {
    target: 'esnext',
    lib: {
      entry: 'src/index.ts',
      formats: ['es'],
    },
  },
});
```

### TypeScript Configuration

```typescript
// tsconfig.json

{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src"
  }
}
```

## Performance Requirements

### Timing Precision
- **Scheduling accuracy**: < 1ms jitter using AudioContext time
- **Hot-reload latency**: < 100ms from save to audio update
- **Never use**: setTimeout, setInterval for audio scheduling

### Memory Management
- **Dispose AudioNodes**: Always call `.dispose()` on Tone.js objects
- **Pattern immutability**: Prevents memory leaks from shared references
- **Event pooling**: Consider object pooling for high-frequency events

### Concurrency
- **Maximum voices**: 100+ simultaneous without glitches
- **Web Workers**: Consider for heavy DSP or pattern generation
- **Look-ahead scheduling**: 0.1s buffer prevents JavaScript timing issues

## Security Considerations

### Plugin Sandboxing
- Plugins should not have direct DOM access
- Consider running in separate context or Worker
- Validate all plugin configurations

### User Input
- Validate all note names and musical values
- Sanitize file paths in export operations
- Rate limit hot-reload to prevent abuse

## Browser Compatibility

### Required APIs
- **Web Audio API**: AudioContext, AudioNode scheduling
- **ES2022**: Class fields, top-level await
- **ESM**: Native module support

### Known Limitations
- **iOS Safari**: Requires user gesture before audio
- **Firefox**: Slight timing differences in AudioContext
- **Safari**: No SharedArrayBuffer (affects some advanced features)

## Implementation Status

### Completed Features ✅

All core features specified in this document have been implemented and tested:

1. ✅ **Project structure** - Monorepo with pnpm workspaces
2. ✅ **Branded types** - Hz, BPM, Seconds, MIDINote, Velocity, Duration, Interval
3. ✅ **Note and Event classes** - Comprehensive primitive system
4. ✅ **Pattern system** - PatternBuilder, transformations, pattern algebra
5. ✅ **Mini-notation parser** - Concise syntax with chord support (20+ chord types)
6. ✅ **Tone.js integration** - Scheduling, HMR with graceful audio transitions
7. ✅ **Composition system** - Voice, Track, Composition classes
8. ✅ **Plugin architecture** - Audio and MIDI renderers
9. ✅ **Acceptance tests** - Bach Invention No. 4 (27 passing tests)
10. ✅ **Interactive dev tools** - Debug panel, pattern playground, performance grid
11. ✅ **Diagnostics** - Logger, PatternInspector, TransportDebugger, MusicalError

**Test Coverage:** 308+ passing tests across all packages

### Future Enhancements

Potential areas for expansion (not yet implemented):

- **Advanced music theory** - Scale/mode utilities, chord progression generators
- **Additional plugins** - Notation export (MusicXML), visualizers
- **Sample playback** - Tone.Sampler integration
- **MIDI input** - Real-time MIDI device support
- **Collaborative features** - Real-time multi-user editing
- **Performance optimizations** - Pattern caching, Web Worker scheduling

---

All interfaces in this document are normative. Implementations must match these signatures exactly for API compatibility.
