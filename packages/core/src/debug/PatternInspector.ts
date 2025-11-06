// packages/core/src/debug/PatternInspector.ts

import type { Pattern } from '../patterns/Pattern.js';
import type { Event, NoteEvent, ChordEvent } from '../primitives/Event.js';
import type { MIDINote } from '../types/brands.js';

/**
 * Pattern inspection result with detailed metrics.
 */
export interface PatternInspection {
  /** Total duration of the pattern */
  duration: number;

  /** Count of different event types */
  eventCount: {
    notes: number;
    rests: number;
    chords: number;
    total: number;
  };

  /** Note range information */
  noteRange: {
    lowest: MIDINote | null;
    highest: MIDINote | null;
    span: number; // In semitones
  };

  /** Timing analysis */
  timing: {
    gaps: number; // Number of gaps between events
    overlaps: number; // Number of overlapping events
    avgSpacing: number; // Average time between events
  };

  /** Velocity analysis */
  velocity: {
    min: number;
    max: number;
    avg: number;
  };
}

/**
 * Pattern Inspector utility.
 *
 * Provides detailed analysis and visualization of Pattern objects.
 */
export class PatternInspector {
  /**
   * Inspect a pattern and return detailed metrics.
   */
  static inspect(pattern: Pattern): PatternInspection {
    const events = pattern.events;

    // Count event types
    const eventCount = {
      notes: 0,
      rests: 0,
      chords: 0,
      total: events.length,
    };

    const velocities: number[] = [];
    const pitches: MIDINote[] = [];

    for (const event of events) {
      velocities.push(event.velocity);

      switch (event.type) {
        case 'note':
          eventCount.notes++;
          pitches.push(event.pitch);
          break;
        case 'rest':
          eventCount.rests++;
          break;
        case 'chord':
          eventCount.chords++;
          // Add all chord notes to pitch analysis
          for (const note of event.notes) {
            pitches.push(note.pitch);
          }
          break;
      }
    }

    // Calculate note range
    const noteRange = {
      lowest: pitches.length > 0 ? Math.min(...pitches) as MIDINote : null,
      highest: pitches.length > 0 ? Math.max(...pitches) as MIDINote : null,
      span: pitches.length > 0 ? Math.max(...pitches) - Math.min(...pitches) : 0,
    };

    // Analyze timing
    const timing = this.analyzeTiming(events);

    // Analyze velocity
    const velocity = {
      min: velocities.length > 0 ? Math.min(...velocities) : 0,
      max: velocities.length > 0 ? Math.max(...velocities) : 0,
      avg: velocities.length > 0
        ? velocities.reduce((a, b) => a + b, 0) / velocities.length
        : 0,
    };

    return {
      duration: pattern.duration,
      eventCount,
      noteRange,
      timing,
      velocity,
    };
  }

  /**
   * Analyze timing properties of events.
   */
  private static analyzeTiming(events: readonly Event[]): PatternInspection['timing'] {
    if (events.length === 0) {
      return { gaps: 0, overlaps: 0, avgSpacing: 0 };
    }

    let gaps = 0;
    let overlaps = 0;
    let totalSpacing = 0;

    // Sort events by time for analysis
    const sortedEvents = [...events].sort((a, b) => a.time - b.time);

    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const current = sortedEvents[i];
      const next = sortedEvents[i + 1];

      const currentEnd = current.time + current.duration;
      const spacing = next.time - currentEnd;

      totalSpacing += next.time - current.time;

      if (spacing > 0) {
        gaps++;
      } else if (spacing < 0) {
        overlaps++;
      }
    }

    const avgSpacing = sortedEvents.length > 1
      ? totalSpacing / (sortedEvents.length - 1)
      : 0;

    return { gaps, overlaps, avgSpacing };
  }

  /**
   * Generate ASCII visualization of pattern.
   *
   * Shows notes on a staff-like display with time on the horizontal axis.
   *
   * @param pattern - Pattern to visualize
   * @param options - Visualization options
   * @returns ASCII string representation
   *
   * @example
   * ```
   * Time:  0.0   0.5   1.0   1.5
   * C5:    █     .     .     .
   * G4:    .     █     .     .
   * E4:    .     .     █     .
   * C4:    .     .     .     █
   * ```
   */
  static toASCII(
    pattern: Pattern,
    options: {
      width?: number;
      showVelocity?: boolean;
      showRests?: boolean;
    } = {}
  ): string {
    const {
      width = 40,
      showVelocity = false,
      showRests = false,
    } = options;

    if (pattern.events.length === 0) {
      return '(empty pattern)';
    }

    // Collect all unique pitches and sort them (highest first)
    const pitchSet = new Set<MIDINote>();
    for (const event of pattern.events) {
      if (event.type === 'note') {
        pitchSet.add(event.pitch);
      } else if (event.type === 'chord') {
        for (const note of event.notes) {
          pitchSet.add(note.pitch);
        }
      }
    }

    const pitches = Array.from(pitchSet).sort((a, b) => b - a);

    if (pitches.length === 0 && !showRests) {
      return '(no notes to display)';
    }

    const duration = pattern.duration;
    if (duration === 0) {
      return '(pattern has zero duration)';
    }
    const timeStep = duration / width;

    // Build the grid
    const lines: string[] = [];

    // Time header
    const timeHeader = 'Time:  ' + this.buildTimeHeader(duration, width);
    lines.push(timeHeader);

    // Note rows
    for (const pitch of pitches) {
      const noteName = this.pitchToNoteName(pitch);
      const row = this.buildNoteRow(pattern, pitch, width, timeStep, showVelocity);
      lines.push(`${noteName.padEnd(6)} ${row}`);
    }

    // Optionally show rests
    if (showRests) {
      const restRow = this.buildRestRow(pattern, width, timeStep);
      lines.push(`Rest:  ${restRow}`);
    }

    return lines.join('\n');
  }

  /**
   * Build time header showing timestamps.
   */
  private static buildTimeHeader(duration: number, width: number): string {
    // Show 5 time markers (0, 1/4, 1/2, 3/4, 1)
    const numMarkers = 5;
    const step = duration / (numMarkers - 1);

    // Calculate positions for each marker
    const positions: number[] = [];
    for (let i = 0; i < numMarkers; i++) {
      positions.push(Math.round(i * (width - 1) / (numMarkers - 1)));
    }

    // Build header string
    const header = Array(width).fill(' ');
    for (let i = 0; i < numMarkers; i++) {
      const time = (i * step).toFixed(1);
      // Place the time string at the calculated position
      for (let j = 0; j < time.length && positions[i] + j < width; j++) {
        header[positions[i] + j] = time[j];
      }
    }

    return header.join('');
  }

  /**
   * Build a row for a specific pitch.
   */
  private static buildNoteRow(
    pattern: Pattern,
    pitch: MIDINote,
    width: number,
    timeStep: number,
    showVelocity: boolean
  ): string {
    const cells: string[] = new Array(width).fill('.');

    for (const event of pattern.events) {
      const pitchMatches = (
        (event.type === 'note' && event.pitch === pitch) ||
        (event.type === 'chord' && event.notes.some(n => n.pitch === pitch))
      );

      if (!pitchMatches) continue;

      // Calculate cell positions
      const startCell = Math.floor(event.time / timeStep);
      const endCell = Math.min(
        Math.ceil((event.time + event.duration) / timeStep),
        width
      );

      // Mark cells
      for (let i = startCell; i < endCell; i++) {
        if (i < width) {
          if (showVelocity) {
            // Show velocity as different characters
            const vel = event.velocity;
            if (vel >= 100) cells[i] = '█';
            else if (vel >= 80) cells[i] = '▓';
            else if (vel >= 60) cells[i] = '▒';
            else if (vel >= 40) cells[i] = '░';
            else cells[i] = '·';
          } else {
            cells[i] = '█';
          }
        }
      }
    }

    return cells.join('');
  }

  /**
   * Build a row showing rests.
   */
  private static buildRestRow(
    pattern: Pattern,
    width: number,
    timeStep: number
  ): string {
    const cells: string[] = new Array(width).fill('.');

    for (const event of pattern.events) {
      if (event.type !== 'rest') continue;

      const startCell = Math.floor(event.time / timeStep);
      const endCell = Math.min(
        Math.ceil((event.time + event.duration) / timeStep),
        width
      );

      for (let i = startCell; i < endCell; i++) {
        if (i < width) {
          cells[i] = '-';
        }
      }
    }

    return cells.join('');
  }

  /**
   * Convert MIDI pitch to note name.
   */
  private static pitchToNoteName(pitch: MIDINote): string {
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(pitch / 12) - 1;
    const noteName = noteNames[pitch % 12];
    return `${noteName}${octave}`;
  }

  /**
   * Pretty-print pattern to console (browser/Node.js).
   * Adds decorative formatting for better readability.
   */
  static toConsole(pattern: Pattern, options?: { showVelocity?: boolean }): void {
    const ascii = this.toASCII(pattern, options);

    // Check if we're in a terminal that supports colors
    const supportsColor = typeof process !== 'undefined'
      ? process.stdout?.isTTY
      : true; // Assume browser consoles support styling

    if (supportsColor) {
      // Add some basic styling
      console.log('\n' + '='.repeat(60));
      console.log('Pattern Visualization');
      console.log('='.repeat(60));
      console.log(ascii);
      console.log('='.repeat(60) + '\n');
    } else {
      console.log(ascii);
    }
  }
}
