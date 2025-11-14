/**
 * Comprehensive Tone.js mock for testing
 *
 * Provides mock implementations of Tone.Transport, Tone.Synth, and other
 * Tone.js objects needed for testing without requiring a real audio context.
 */

import { vi } from 'vitest';

// Mock AudioParam interface
class MockAudioParam {
  private _value: number;

  constructor(defaultValue: number = 120) {
    this._value = defaultValue;
  }

  get value(): number {
    return this._value;
  }

  set value(val: number) {
    this._value = val;
  }

  setValueAtTime(value: number, time: number): this {
    this._value = value;
    return this;
  }

  linearRampToValueAtTime(value: number, time: number): this {
    this._value = value;
    return this;
  }

  exponentialRampToValueAtTime(value: number, time: number): this {
    this._value = value;
    return this;
  }

  setTargetAtTime(target: number, startTime: number, timeConstant: number): this {
    this._value = target;
    return this;
  }

  cancelScheduledValues(cancelTime: number): this {
    return this;
  }

  rampTo(value: number, rampTime: number, startTime?: number): this {
    this._value = value;
    return this;
  }
}

// Mock Transport
class MockTransport {
  private _state: 'started' | 'stopped' | 'paused' = 'stopped';
  private _bpm: MockAudioParam;
  private _timeSignature: number[] = [4, 4];
  private _position: string = '0:0:0';
  private _seconds: number = 0;
  private _progress: number = 0;
  private _loop: boolean = false;
  private _loopStart: number = 0;
  private _loopEnd: number = 0;
  private scheduledEvents: Map<number, any> = new Map();
  private nextId: number = 0;

  constructor() {
    this._bpm = new MockAudioParam(120);
  }

  get state() {
    return this._state;
  }

  get bpm() {
    return this._bpm;
  }

  get timeSignature() {
    return this._timeSignature;
  }

  set timeSignature(val: number | number[]) {
    this._timeSignature = Array.isArray(val) ? val : [val, 4];
  }

  get position() {
    return this._position;
  }

  set position(val: string | number) {
    this._position = typeof val === 'string' ? val : `0:0:${val}`;
  }

  get seconds() {
    return this._seconds;
  }

  set seconds(val: number) {
    this._seconds = val;
  }

  get progress() {
    return this._progress;
  }

  get loop() {
    return this._loop;
  }

  set loop(val: boolean) {
    this._loop = val;
  }

  get loopStart() {
    return this._loopStart;
  }

  set loopStart(val: number) {
    this._loopStart = val;
  }

  get loopEnd() {
    return this._loopEnd;
  }

  set loopEnd(val: number) {
    this._loopEnd = val;
  }

  start = vi.fn((time?: number) => {
    this._state = 'started';
    return this;
  });

  stop = vi.fn((time?: number) => {
    this._state = 'stopped';
    this._seconds = 0;
    this._position = '0:0:0';
    return this;
  });

  pause = vi.fn((time?: number) => {
    this._state = 'paused';
    return this;
  });

  toggle = vi.fn((time?: number) => {
    if (this._state === 'started') {
      this.pause();
    } else {
      this.start();
    }
    return this;
  });

  schedule = vi.fn((callback: Function, time: string | number) => {
    const id = this.nextId++;
    this.scheduledEvents.set(id, { callback, time, type: 'schedule' });
    return id;
  });

  scheduleRepeat = vi.fn((callback: Function, interval: number, startTime?: number) => {
    const id = this.nextId++;
    this.scheduledEvents.set(id, { callback, interval, startTime, type: 'scheduleRepeat' });
    return id;
  });

  scheduleOnce = vi.fn((callback: Function, time: string | number) => {
    const id = this.nextId++;
    this.scheduledEvents.set(id, { callback, time, type: 'scheduleOnce' });
    return id;
  });

  clear = vi.fn((eventId: number) => {
    this.scheduledEvents.delete(eventId);
    return this;
  });

  cancel = vi.fn((after?: number) => {
    if (after === undefined) {
      this.scheduledEvents.clear();
    } else {
      // Remove events scheduled after the given time
      for (const [id, event] of this.scheduledEvents.entries()) {
        if (typeof event.time === 'number' && event.time > after) {
          this.scheduledEvents.delete(id);
        }
      }
    }
    return this;
  });

  // Helper methods for testing
  _reset() {
    this._state = 'stopped';
    this._seconds = 0;
    this._position = '0:0:0';
    this._progress = 0;
    this._bpm = new MockAudioParam(120);
    this.scheduledEvents.clear();
    this.nextId = 0;
  }

  _getScheduledEvents() {
    return Array.from(this.scheduledEvents.values());
  }
}

// Mock destination node
class MockDestination {
  volume = new MockAudioParam(0);
  mute = false;

  toDestination() {
    return this;
  }

  connect() {
    return this;
  }

  disconnect() {
    return this;
  }

  dispose() {
    // no-op
  }
}

// Mock Synth
class MockSynth {
  private _disposed = false;
  volume = new MockAudioParam(0);
  detune = new MockAudioParam(0);

  constructor(options?: any) {
    // Store options if needed
  }

  triggerAttack = vi.fn((note: string | number, time?: number, velocity?: number) => {
    if (this._disposed) throw new Error('Synth has been disposed');
    return this;
  });

  triggerRelease = vi.fn((time?: number) => {
    if (this._disposed) throw new Error('Synth has been disposed');
    return this;
  });

  triggerAttackRelease = vi.fn((
    notes: string | string[] | number | number[],
    duration: number | string,
    time?: number,
    velocity?: number
  ) => {
    if (this._disposed) throw new Error('Synth has been disposed');
    return this;
  });

  toDestination() {
    return this;
  }

  connect() {
    return this;
  }

  disconnect() {
    return this;
  }

  dispose() {
    this._disposed = true;
  }

  get disposed() {
    return this._disposed;
  }
}

// Mock PolySynth
class MockPolySynth {
  private _disposed = false;
  volume = new MockAudioParam(0);

  constructor(voiceType?: any, options?: any) {
    // Store options if needed
  }

  triggerAttack = vi.fn((notes: string | string[] | number | number[], time?: number, velocity?: number) => {
    if (this._disposed) throw new Error('PolySynth has been disposed');
    return this;
  });

  triggerRelease = vi.fn((notes: string | string[] | number | number[], time?: number) => {
    if (this._disposed) throw new Error('PolySynth has been disposed');
    return this;
  });

  triggerAttackRelease = vi.fn((
    notes: string | string[] | number | number[],
    duration: number | string,
    time?: number,
    velocity?: number
  ) => {
    if (this._disposed) throw new Error('PolySynth has been disposed');
    return this;
  });

  toDestination() {
    return this;
  }

  connect() {
    return this;
  }

  disconnect() {
    return this;
  }

  dispose() {
    this._disposed = true;
  }

  get disposed() {
    return this._disposed;
  }
}

// Mock AMSynth (just a constructor that returns a synth-like object)
class MockAMSynth extends MockSynth {
  constructor(options?: any) {
    super(options);
  }
}

// Mock Time utility
class MockTime {
  private _value: number;

  constructor(value: string | number, units?: string) {
    if (typeof value === 'number') {
      this._value = value;
    } else if (typeof value === 'string') {
      // Parse transport time notation like "0:0:0" or "4n"
      this._value = this.parseTimeString(value);
    } else {
      this._value = 0;
    }
  }

  private parseTimeString(str: string): number {
    // Handle transport notation "bars:beats:sixteenths"
    if (str.includes(':')) {
      const [bars = 0, beats = 0, sixteenths = 0] = str.split(':').map(Number);
      // Assume 4/4 time, 120 BPM: 1 bar = 2 seconds
      return bars * 2 + beats * 0.5 + sixteenths * 0.125;
    }

    // Handle note notation "4n", "8n", etc.
    if (str.endsWith('n')) {
      const duration = parseInt(str);
      return 4 / duration; // Rough approximation
    }

    return parseFloat(str) || 0;
  }

  toSeconds(): number {
    return this._value;
  }

  valueOf(): number {
    return this._value;
  }
}

// Create singleton instances
const mockTransport = new MockTransport();
const mockDestination = new MockDestination();

// Export the mock Tone module
export const Tone = {
  Transport: mockTransport,
  Synth: MockSynth,
  PolySynth: MockPolySynth,
  AMSynth: MockAMSynth,
  Time: (value: string | number, units?: string) => new MockTime(value, units),

  getDestination: () => mockDestination,

  start: vi.fn(async () => {
    // Simulate starting the audio context
    return Promise.resolve();
  }),

  context: {
    state: 'running',
    sampleRate: 44100,
    currentTime: 0,
    destination: mockDestination,
  },

  now: vi.fn(() => Date.now() / 1000),

  immediate: vi.fn(() => 0),
};

// Helper to reset all mocks
export function resetToneMocks() {
  mockTransport._reset();
  vi.clearAllMocks();
}

export { MockTransport, MockSynth, MockPolySynth, MockAMSynth, MockTime };
