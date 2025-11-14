// packages/tone-adapter/src/debug/TransportDebugger.ts

import * as Tone from 'tone';

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
 *
 * Works independently of UI.
 *
 * @example
 * ```typescript
 * const debugger = TransportDebugger.getInstance();
 *
 * // Get all scheduled events
 * const events = debugger.getScheduledEvents();
 * console.log(`${events.length} events scheduled`);
 *
 * // Check for conflicts
 * const conflicts = debugger.detectConflicts();
 * if (conflicts.length > 0) {
 *   console.warn('Scheduling conflicts detected:', conflicts);
 * }
 *
 * // Track AudioNodes
 * console.log(`${debugger.getAudioNodeCount()} AudioNodes created`);
 * const leaks = debugger.checkForLeaks();
 * if (leaks.length > 0) {
 *   console.error('AudioNode leaks detected:', leaks);
 * }
 * ```
 */
export class TransportDebugger {
  private static instance: TransportDebugger | null = null;

  private scheduledEvents: Map<number, ScheduledEventInfo> = new Map();
  private audioNodes: Map<number, AudioNodeInfo> = new Map();
  private nextEventId = 0;
  private nextNodeId = 0;

  private constructor() {
    // Private constructor for singleton
  }

  /**
   * Get singleton instance.
   */
  static getInstance(): TransportDebugger {
    if (!this.instance) {
      this.instance = new TransportDebugger();
    }
    return this.instance;
  }

  /**
   * Reset the debugger (useful for testing).
   */
  static reset(): void {
    this.instance = null;
  }

  /**
   * Get current transport state snapshot.
   */
  getTransportSnapshot(): TransportSnapshot {
    return {
      state: Tone.Transport.state,
      bpm: Tone.Transport.bpm.value,
      timeSignature: Tone.Transport.timeSignature as number[],
      position: Tone.Transport.position as string,
      seconds: Tone.Transport.seconds,
      progress: Tone.Transport.progress,
      loop: Tone.Transport.loop,
      loopStart: Tone.Transport.loopStart as number,
      loopEnd: Tone.Transport.loopEnd as number,
    };
  }

  /**
   * Track a scheduled event.
   *
   * Call this when scheduling events on Tone.Transport.
   *
   * @returns Event ID for tracking
   */
  trackScheduledEvent(
    time: string | number,
    callback?: Function
  ): number {
    const id = this.nextEventId++;
    const callbackName = callback?.name || 'anonymous';

    this.scheduledEvents.set(id, {
      id,
      time,
      callback: callbackName,
      state: 'scheduled',
    });

    return id;
  }

  /**
   * Mark an event as executed.
   */
  markEventExecuted(id: number): void {
    const event = this.scheduledEvents.get(id);
    if (event) {
      event.state = 'executed';
    }
  }

  /**
   * Mark an event as cancelled.
   */
  markEventCancelled(id: number): void {
    const event = this.scheduledEvents.get(id);
    if (event) {
      event.state = 'cancelled';
    }
  }

  /**
   * Get all scheduled events.
   */
  getScheduledEvents(): ScheduledEventInfo[] {
    return Array.from(this.scheduledEvents.values());
  }

  /**
   * Get pending (not yet executed) events.
   */
  getPendingEvents(): ScheduledEventInfo[] {
    return Array.from(this.scheduledEvents.values())
      .filter(e => e.state === 'scheduled');
  }

  /**
   * Clear event tracking.
   */
  clearEvents(): void {
    this.scheduledEvents.clear();
    this.nextEventId = 0;
  }

  /**
   * Detect scheduling conflicts.
   *
   * Looks for multiple events scheduled at very similar times
   * which might indicate unintended overlap.
   */
  detectConflicts(threshold: number = 0.001): ScheduleConflict[] {
    const conflicts: ScheduleConflict[] = [];
    const pending = this.getPendingEvents();

    // Group events by approximate time
    const timeGroups = new Map<number, ScheduledEventInfo[]>();

    for (const event of pending) {
      const time = this.eventTimeToSeconds(event.time);
      if (time === null) continue;

      // Round to threshold precision using fixed decimal places to avoid floating-point errors
      const decimalPlaces = Math.max(0, -Math.floor(Math.log10(threshold)));
      const roundedTime = Number(time.toFixed(decimalPlaces));

      if (!timeGroups.has(roundedTime)) {
        timeGroups.set(roundedTime, []);
      }
      timeGroups.get(roundedTime)!.push(event);
    }

    // Find groups with multiple events
    for (const [time, events] of timeGroups) {
      if (events.length > 1) {
        conflicts.push({
          time,
          events,
          severity: events.length > 5 ? 'error' : 'warning',
          message: `${events.length} events scheduled at ~${time.toFixed(3)}s`,
        });
      }
    }

    return conflicts;
  }

  /**
   * Convert event time to seconds (approximate).
   */
  private eventTimeToSeconds(time: string | number): number | null {
    if (typeof time === 'number') {
      return time;
    }

    // Parse transport time strings like "0:0:0"
    // This is a simplified parser - real implementation would be more complex
    if (typeof time === 'string') {
      try {
        return Tone.Time(time).toSeconds();
      } catch {
        return null;
      }
    }

    return null;
  }

  /**
   * Track an AudioNode creation.
   */
  trackAudioNode(type: string): number {
    const id = this.nextNodeId++;
    this.audioNodes.set(id, {
      type,
      created: Date.now(),
      disposed: false,
      id,
    });
    return id;
  }

  /**
   * Mark an AudioNode as disposed.
   */
  markNodeDisposed(id: number): void {
    const node = this.audioNodes.get(id);
    if (node) {
      node.disposed = true;
    }
  }

  /**
   * Get total count of created AudioNodes.
   */
  getAudioNodeCount(): number {
    return this.audioNodes.size;
  }

  /**
   * Get count of active (not disposed) AudioNodes.
   */
  getActiveNodeCount(): number {
    return Array.from(this.audioNodes.values())
      .filter(n => !n.disposed)
      .length;
  }

  /**
   * Check for potential memory leaks.
   *
   * Returns AudioNodes that were created but never disposed
   * and are older than the threshold.
   *
   * @param ageThresholdMs - Age threshold in milliseconds (default: 60000 = 1 minute)
   */
  checkForLeaks(ageThresholdMs: number = 60000): AudioNodeInfo[] {
    const now = Date.now();
    const leaks: AudioNodeInfo[] = [];

    for (const node of this.audioNodes.values()) {
      if (!node.disposed && (now - node.created) >= ageThresholdMs) {
        leaks.push(node);
      }
    }

    return leaks;
  }

  /**
   * Get all AudioNode information.
   */
  getAllNodes(): AudioNodeInfo[] {
    return Array.from(this.audioNodes.values());
  }

  /**
   * Clear all AudioNode tracking.
   */
  clearNodes(): void {
    this.audioNodes.clear();
    this.nextNodeId = 0;
  }

  /**
   * Generate a debug report.
   */
  generateReport(): string {
    const snapshot = this.getTransportSnapshot();
    const events = this.getScheduledEvents();
    const pendingEvents = this.getPendingEvents();
    const conflicts = this.detectConflicts();
    const activeNodes = this.getActiveNodeCount();
    const totalNodes = this.getAudioNodeCount();
    const leaks = this.checkForLeaks();

    const lines: string[] = [];
    lines.push('=== Transport Debugger Report ===');
    lines.push('');
    lines.push('Transport State:');
    lines.push(`  State: ${snapshot.state}`);
    lines.push(`  BPM: ${snapshot.bpm}`);
    lines.push(`  Position: ${snapshot.position}`);
    lines.push(`  Seconds: ${snapshot.seconds.toFixed(3)}`);
    lines.push(`  Loop: ${snapshot.loop}`);
    lines.push('');
    lines.push('Scheduled Events:');
    lines.push(`  Total: ${events.length}`);
    lines.push(`  Pending: ${pendingEvents.length}`);
    lines.push(`  Conflicts: ${conflicts.length}`);

    if (conflicts.length > 0) {
      lines.push('');
      lines.push('  Detected Conflicts:');
      for (const conflict of conflicts) {
        lines.push(`    [${conflict.severity}] ${conflict.message}`);
      }
    }

    lines.push('');
    lines.push('AudioNodes:');
    lines.push(`  Total created: ${totalNodes}`);
    lines.push(`  Active: ${activeNodes}`);
    lines.push(`  Disposed: ${totalNodes - activeNodes}`);

    if (leaks.length > 0) {
      lines.push(`  Potential leaks: ${leaks.length}`);
      lines.push('');
      lines.push('  Leak Details:');
      for (const leak of leaks) {
        const age = ((Date.now() - leak.created) / 1000).toFixed(1);
        lines.push(`    ${leak.type} (id: ${leak.id}, age: ${age}s)`);
      }
    }

    lines.push('');
    lines.push('='.repeat(40));

    return lines.join('\n');
  }

  /**
   * Print report to console.
   */
  printReport(): void {
    console.log(this.generateReport());
  }
}

/**
 * Convenience function to get debugger instance.
 */
export function getTransportDebugger(): TransportDebugger {
  return TransportDebugger.getInstance();
}
