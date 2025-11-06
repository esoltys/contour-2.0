// packages/tone-adapter/tests/debug/TransportDebugger.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TransportDebugger, getTransportDebugger } from '../../src/debug/TransportDebugger';
import * as Tone from 'tone';

describe('TransportDebugger', () => {
  let dbg: TransportDebugger;

  beforeEach(() => {
    TransportDebugger.reset();
    dbg = TransportDebugger.getInstance();
  });

  describe('getInstance', () => {
    it('should return singleton instance', () => {
      const instance1 = TransportDebugger.getInstance();
      const instance2 = TransportDebugger.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should work via convenience function', () => {
      const instance = getTransportDebugger();
      expect(instance).toBeInstanceOf(TransportDebugger);
    });
  });

  describe('reset', () => {
    it('should clear singleton instance', () => {
      const instance1 = TransportDebugger.getInstance();
      TransportDebugger.reset();
      const instance2 = TransportDebugger.getInstance();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe('getTransportSnapshot', () => {
    it('should return current transport state', () => {
      const snapshot = dbg.getTransportSnapshot();

      expect(snapshot).toHaveProperty('state');
      expect(snapshot).toHaveProperty('bpm');
      expect(snapshot).toHaveProperty('timeSignature');
      expect(snapshot).toHaveProperty('position');
      expect(snapshot).toHaveProperty('seconds');
      expect(snapshot).toHaveProperty('progress');
      expect(snapshot).toHaveProperty('loop');
      expect(snapshot).toHaveProperty('loopStart');
      expect(snapshot).toHaveProperty('loopEnd');
    });

    it('should reflect current BPM', () => {
      Tone.Transport.bpm.value = 140;
      const snapshot = dbg.getTransportSnapshot();

      expect(snapshot.bpm).toBe(140);
    });
  });

  describe('trackScheduledEvent', () => {
    it('should track a scheduled event', () => {
      const id = dbg.trackScheduledEvent('0:0:0');

      expect(id).toBeTypeOf('number');

      const events = dbg.getScheduledEvents();
      expect(events).toHaveLength(1);
      expect(events[0].id).toBe(id);
      expect(events[0].time).toBe('0:0:0');
      expect(events[0].state).toBe('scheduled');
    });

    it('should capture callback name', () => {
      function myCallback() {}
      const id = dbg.trackScheduledEvent('0:0:0', myCallback);

      const events = dbg.getScheduledEvents();
      expect(events[0].callback).toBe('myCallback');
    });

    it('should handle anonymous functions', () => {
      const id = dbg.trackScheduledEvent('0:0:0', () => {});

      const events = dbg.getScheduledEvents();
      expect(events[0].callback).toBe('anonymous');
    });

    it('should assign unique IDs', () => {
      const id1 = dbg.trackScheduledEvent('0:0:0');
      const id2 = dbg.trackScheduledEvent('0:1:0');
      const id3 = dbg.trackScheduledEvent('0:2:0');

      expect(id1).not.toBe(id2);
      expect(id2).not.toBe(id3);
    });
  });

  describe('markEventExecuted', () => {
    it('should mark event as executed', () => {
      const id = dbg.trackScheduledEvent('0:0:0');
      dbg.markEventExecuted(id);

      const events = dbg.getScheduledEvents();
      expect(events[0].state).toBe('executed');
    });
  });

  describe('markEventCancelled', () => {
    it('should mark event as cancelled', () => {
      const id = dbg.trackScheduledEvent('0:0:0');
      dbg.markEventCancelled(id);

      const events = dbg.getScheduledEvents();
      expect(events[0].state).toBe('cancelled');
    });
  });

  describe('getPendingEvents', () => {
    it('should return only pending events', () => {
      const id1 = dbg.trackScheduledEvent('0:0:0');
      const id2 = dbg.trackScheduledEvent('0:1:0');
      const id3 = dbg.trackScheduledEvent('0:2:0');

      dbg.markEventExecuted(id1);
      dbg.markEventCancelled(id2);
      // id3 remains scheduled

      const pending = dbg.getPendingEvents();
      expect(pending).toHaveLength(1);
      expect(pending[0].id).toBe(id3);
    });
  });

  describe('clearEvents', () => {
    it('should clear all tracked events', () => {
      dbg.trackScheduledEvent('0:0:0');
      dbg.trackScheduledEvent('0:1:0');
      dbg.trackScheduledEvent('0:2:0');

      expect(dbg.getScheduledEvents()).toHaveLength(3);

      dbg.clearEvents();
      expect(dbg.getScheduledEvents()).toHaveLength(0);
    });
  });

  describe('detectConflicts', () => {
    it('should detect no conflicts when events are spread out', () => {
      dbg.trackScheduledEvent(0);
      dbg.trackScheduledEvent(1);
      dbg.trackScheduledEvent(2);

      const conflicts = dbg.detectConflicts();
      expect(conflicts).toHaveLength(0);
    });

    it('should detect conflicts when multiple events are at same time', () => {
      dbg.trackScheduledEvent(1.0);
      dbg.trackScheduledEvent(1.0);
      dbg.trackScheduledEvent(1.0);

      const conflicts = dbg.detectConflicts();
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts[0].events).toHaveLength(3);
    });

    it('should detect conflicts within threshold', () => {
      dbg.trackScheduledEvent(1.0);
      dbg.trackScheduledEvent(1.0005); // Within 0.001 threshold

      const conflicts = dbg.detectConflicts(0.001);
      expect(conflicts.length).toBeGreaterThan(0);
    });

    it('should set severity based on event count', () => {
      // Warning for 2-5 events
      dbg.trackScheduledEvent(1.0);
      dbg.trackScheduledEvent(1.0);
      const conflicts1 = dbg.detectConflicts();
      expect(conflicts1[0]?.severity).toBe('warning');

      dbg.clearEvents();

      // Error for >5 events
      for (let i = 0; i < 10; i++) {
        dbg.trackScheduledEvent(1.0);
      }
      const conflicts2 = dbg.detectConflicts();
      expect(conflicts2[0]?.severity).toBe('error');
    });
  });

  describe('AudioNode tracking', () => {
    it('should track AudioNode creation', () => {
      const id = dbg.trackAudioNode('Synth');

      expect(id).toBeTypeOf('number');
      expect(dbg.getAudioNodeCount()).toBe(1);
    });

    it('should assign unique IDs to nodes', () => {
      const id1 = dbg.trackAudioNode('Synth');
      const id2 = dbg.trackAudioNode('Filter');

      expect(id1).not.toBe(id2);
    });

    it('should track node type', () => {
      const id = dbg.trackAudioNode('Synth');
      const nodes = dbg.getAllNodes();

      expect(nodes[0].type).toBe('Synth');
    });
  });

  describe('markNodeDisposed', () => {
    it('should mark node as disposed', () => {
      const id = dbg.trackAudioNode('Synth');
      dbg.markNodeDisposed(id);

      const nodes = dbg.getAllNodes();
      expect(nodes[0].disposed).toBe(true);
    });
  });

  describe('getActiveNodeCount', () => {
    it('should return count of active nodes', () => {
      const id1 = dbg.trackAudioNode('Synth');
      const id2 = dbg.trackAudioNode('Filter');
      const id3 = dbg.trackAudioNode('Reverb');

      expect(dbg.getActiveNodeCount()).toBe(3);

      dbg.markNodeDisposed(id1);
      expect(dbg.getActiveNodeCount()).toBe(2);

      dbg.markNodeDisposed(id2);
      expect(dbg.getActiveNodeCount()).toBe(1);
    });
  });

  describe('checkForLeaks', () => {
    it('should detect no leaks when all nodes are disposed', () => {
      const id1 = dbg.trackAudioNode('Synth');
      const id2 = dbg.trackAudioNode('Filter');

      dbg.markNodeDisposed(id1);
      dbg.markNodeDisposed(id2);

      const leaks = dbg.checkForLeaks(0); // Check immediately
      expect(leaks).toHaveLength(0);
    });

    it('should detect leaks for old undisposed nodes', () => {
      dbg.trackAudioNode('Synth');

      // Check with 0ms threshold (should detect immediately)
      const leaks = dbg.checkForLeaks(0);
      expect(leaks).toHaveLength(1);
      expect(leaks[0].type).toBe('Synth');
      expect(leaks[0].disposed).toBe(false);
    });

    it('should not detect leaks for young nodes', async () => {
      dbg.trackAudioNode('Synth');

      // Check with high threshold
      const leaks = dbg.checkForLeaks(10000); // 10 seconds
      expect(leaks).toHaveLength(0);
    });

    it('should respect age threshold', async () => {
      dbg.trackAudioNode('Synth');

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 100));

      const leaks = dbg.checkForLeaks(50); // 50ms threshold
      expect(leaks.length).toBeGreaterThan(0);
    });
  });

  describe('clearNodes', () => {
    it('should clear all tracked nodes', () => {
      dbg.trackAudioNode('Synth');
      dbg.trackAudioNode('Filter');

      expect(dbg.getAudioNodeCount()).toBe(2);

      dbg.clearNodes();
      expect(dbg.getAudioNodeCount()).toBe(0);
    });
  });

  describe('generateReport', () => {
    it('should generate comprehensive report', () => {
      // Add some events
      dbg.trackScheduledEvent('0:0:0');
      dbg.trackScheduledEvent('0:1:0');

      // Add some nodes
      dbg.trackAudioNode('Synth');
      dbg.trackAudioNode('Filter');

      const report = dbg.generateReport();

      expect(report).toContain('Transport Debugger Report');
      expect(report).toContain('Transport State:');
      expect(report).toContain('Scheduled Events:');
      expect(report).toContain('AudioNodes:');
      expect(report).toContain('Total: 2');
    });

    it('should include conflicts in report', () => {
      dbg.trackScheduledEvent(1.0);
      dbg.trackScheduledEvent(1.0);

      const report = dbg.generateReport();
      expect(report).toContain('Conflicts:');
    });

    it('should include leaks in report', () => {
      dbg.trackAudioNode('Synth');

      const report = dbg.generateReport();
      expect(report).toContain('Potential leaks:');
    });
  });

  describe('printReport', () => {
    it('should print report to console', () => {
      vi.spyOn(console, 'log').mockImplementation(() => {});

      dbg.printReport();

      expect(console.log).toHaveBeenCalled();
      const output = (console.log as any).mock.calls[0][0];
      expect(output).toContain('Transport Debugger Report');
    });
  });
});
