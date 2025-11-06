/**
 * Pattern Inspector - Visualizes and analyzes patterns
 *
 * Features:
 * - Dropdown to select pattern from active pads
 * - Show Pattern.inspect() output (formatted)
 * - Visual timeline of events
 * - Note range piano roll
 * - Velocity graph
 * - Export ASCII visualization
 */

import type { Pattern } from '@contour/core';

export interface InspectablePattern {
  id: string;
  name: string;
  pattern: Pattern | null;
}

export class PatternInspector {
  private container: HTMLDivElement | null = null;
  private patterns: Map<string, InspectablePattern> = new Map();
  private selectedPatternId: string | null = null;

  public render(): HTMLDivElement {
    this.container = document.createElement('div');
    this.container.className = 'pattern-inspector';

    // Pattern selector
    const selectorSection = this.createSelectorSection();
    this.container.appendChild(selectorSection);

    // Pattern details
    const detailsSection = this.createDetailsSection();
    this.container.appendChild(detailsSection);

    // Visualization
    const visualSection = this.createVisualizationSection();
    this.container.appendChild(visualSection);

    return this.container;
  }

  private createSelectorSection(): HTMLDivElement {
    const section = document.createElement('div');
    section.className = 'inspector-section';

    const label = document.createElement('label');
    label.textContent = 'Select Pattern:';
    label.htmlFor = 'pattern-selector';

    const select = document.createElement('select');
    select.id = 'pattern-selector';
    select.className = 'pattern-selector';
    select.addEventListener('change', (e) => {
      this.selectPattern((e.target as HTMLSelectElement).value);
    });

    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Select a pattern --';
    select.appendChild(defaultOption);

    section.appendChild(label);
    section.appendChild(select);

    return section;
  }

  private createDetailsSection(): HTMLDivElement {
    const section = document.createElement('div');
    section.className = 'inspector-section pattern-details-section';

    const header = document.createElement('div');
    header.className = 'section-header';

    const title = document.createElement('h4');
    title.textContent = 'Pattern Details';

    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn btn-secondary btn-small';
    exportBtn.textContent = '📋 Copy ASCII';
    exportBtn.addEventListener('click', () => this.exportASCII());

    header.appendChild(title);
    header.appendChild(exportBtn);
    section.appendChild(header);

    const detailsContent = document.createElement('pre');
    detailsContent.id = 'pattern-details-content';
    detailsContent.className = 'pattern-details-content';
    detailsContent.textContent = 'Select a pattern to inspect';

    section.appendChild(detailsContent);

    return section;
  }

  private createVisualizationSection(): HTMLDivElement {
    const section = document.createElement('div');
    section.className = 'inspector-section';

    const title = document.createElement('h4');
    title.textContent = 'Visual Timeline';
    section.appendChild(title);

    // Timeline canvas
    const canvas = document.createElement('canvas');
    canvas.id = 'pattern-timeline-canvas';
    canvas.className = 'pattern-timeline-canvas';
    canvas.width = 600;
    canvas.height = 200;
    section.appendChild(canvas);

    // Stats
    const statsDiv = document.createElement('div');
    statsDiv.id = 'pattern-stats';
    statsDiv.className = 'pattern-stats';
    statsDiv.innerHTML = `
      <div class="stat-item">
        <span class="stat-label">Events:</span>
        <span id="stat-events" class="stat-value">0</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Duration:</span>
        <span id="stat-duration" class="stat-value">0s</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Note Range:</span>
        <span id="stat-range" class="stat-value">-</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Avg Velocity:</span>
        <span id="stat-velocity" class="stat-value">0</span>
      </div>
    `;
    section.appendChild(statsDiv);

    return section;
  }

  public registerPattern(id: string, name: string, pattern: Pattern | null): void {
    this.patterns.set(id, { id, name, pattern });
    this.updatePatternSelector();
  }

  public unregisterPattern(id: string): void {
    this.patterns.delete(id);
    this.updatePatternSelector();

    if (this.selectedPatternId === id) {
      this.selectedPatternId = null;
      this.updateDetails();
    }
  }

  public updatePattern(id: string, pattern: Pattern | null): void {
    const existing = this.patterns.get(id);
    if (existing) {
      existing.pattern = pattern;

      if (this.selectedPatternId === id) {
        this.updateDetails();
      }
    }
  }

  private updatePatternSelector(): void {
    const select = document.getElementById('pattern-selector') as HTMLSelectElement;
    if (!select) return;

    // Clear existing options (except default)
    select.innerHTML = '<option value="">-- Select a pattern --</option>';

    // Add patterns
    this.patterns.forEach((pattern, id) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = pattern.name;
      select.appendChild(option);
    });
  }

  private selectPattern(patternId: string): void {
    this.selectedPatternId = patternId || null;
    this.updateDetails();
  }

  private updateDetails(): void {
    const detailsEl = document.getElementById('pattern-details-content');
    if (!detailsEl) return;

    if (!this.selectedPatternId) {
      detailsEl.textContent = 'Select a pattern to inspect';
      this.clearVisualization();
      return;
    }

    const inspectable = this.patterns.get(this.selectedPatternId);
    if (!inspectable || !inspectable.pattern) {
      detailsEl.textContent = 'Pattern not compiled yet';
      this.clearVisualization();
      return;
    }

    // NOTE: This requires Pattern.inspect() method from Phase 8A
    // For now, we'll show a basic representation
    try {
      const pattern = inspectable.pattern as any;

      // Try to access internal state
      const events = pattern._events || pattern.events || [];
      const duration = pattern.duration || 0;

      let output = `Pattern: ${inspectable.name}\n`;
      output += `Events: ${events.length}\n`;
      output += `Duration: ${duration}s\n\n`;

      if (events.length > 0) {
        output += 'Events:\n';
        events.forEach((event: any, index: number) => {
          const time = event.time || event.startTime || 0;
          const note = event.note || event.pitch || '?';
          const velocity = event.velocity || 0;
          output += `  ${index + 1}. ${time.toFixed(3)}s - ${note} (vel: ${velocity})\n`;
        });
      }

      detailsEl.textContent = output;

      // Update visualization
      this.visualizePattern(inspectable.pattern);
    } catch (error) {
      detailsEl.textContent = 'ℹ️ Full pattern inspection requires Phase 8A diagnostics\n\n' +
        'Pattern.inspect() method is not yet available.';
      this.clearVisualization();
    }
  }

  private visualizePattern(pattern: Pattern): void {
    const canvas = document.getElementById('pattern-timeline-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    try {
      const patternData = pattern as any;
      const events = patternData._events || patternData.events || [];

      if (events.length === 0) {
        ctx.fillStyle = '#666';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('No events to visualize', canvas.width / 2, canvas.height / 2);
        return;
      }

      // Find note range
      const notes = events
        .filter((e: any) => e.note || e.pitch)
        .map((e: any) => this.noteToMidi(e.note || e.pitch || 'C4'));

      const minNote = Math.min(...notes, 60);
      const maxNote = Math.max(...notes, 72);
      const noteRange = maxNote - minNote || 12;

      // Find time range
      const times = events.map((e: any) => e.time || e.startTime || 0);
      const maxTime = Math.max(...times, 1);

      // Draw events
      events.forEach((event: any) => {
        const time = event.time || event.startTime || 0;
        const note = this.noteToMidi(event.note || event.pitch || 'C4');
        const velocity = event.velocity || 64;

        const x = (time / maxTime) * (canvas.width - 40) + 20;
        const y = ((maxNote - note) / noteRange) * (canvas.height - 40) + 20;

        // Draw note as circle
        const radius = (velocity / 127) * 8 + 2;
        ctx.fillStyle = `hsl(${(note % 12) * 30}, 70%, 60%)`;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Update stats
      this.updateStats(events, maxTime, minNote, maxNote);
    } catch (error) {
      console.error('[PatternInspector] Visualization error:', error);
      this.clearVisualization();
    }
  }

  private updateStats(events: any[], duration: number, minNote: number, maxNote: number): void {
    const eventsEl = document.getElementById('stat-events');
    const durationEl = document.getElementById('stat-duration');
    const rangeEl = document.getElementById('stat-range');
    const velocityEl = document.getElementById('stat-velocity');

    if (eventsEl) eventsEl.textContent = events.length.toString();
    if (durationEl) durationEl.textContent = `${duration.toFixed(2)}s`;
    if (rangeEl) {
      rangeEl.textContent = `${this.midiToNote(minNote)} - ${this.midiToNote(maxNote)}`;
    }

    if (velocityEl) {
      const velocities = events.map((e: any) => e.velocity || 64);
      const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;
      velocityEl.textContent = avgVelocity.toFixed(0);
    }
  }

  private clearVisualization(): void {
    const canvas = document.getElementById('pattern-timeline-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Clear stats
    const eventsEl = document.getElementById('stat-events');
    const durationEl = document.getElementById('stat-duration');
    const rangeEl = document.getElementById('stat-range');
    const velocityEl = document.getElementById('stat-velocity');

    if (eventsEl) eventsEl.textContent = '0';
    if (durationEl) durationEl.textContent = '0s';
    if (rangeEl) rangeEl.textContent = '-';
    if (velocityEl) velocityEl.textContent = '0';
  }

  private exportASCII(): void {
    const detailsEl = document.getElementById('pattern-details-content');
    if (!detailsEl) return;

    const text = detailsEl.textContent || '';
    navigator.clipboard.writeText(text).then(() => {
      alert('Pattern details copied to clipboard!');
    }).catch(err => {
      console.error('[PatternInspector] Failed to copy:', err);
      alert('Failed to copy to clipboard');
    });
  }

  private noteToMidi(note: string): number {
    // Simple note to MIDI conversion
    const noteMap: { [key: string]: number } = {
      'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
      'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
      'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
    };

    const match = note.match(/^([A-G][#b]?)(\d+)$/);
    if (!match) return 60; // Default to C4

    const noteName = match[1];
    const octave = parseInt(match[2]);

    return (octave + 1) * 12 + (noteMap[noteName] || 0);
  }

  private midiToNote(midi: number): string {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midi / 12) - 1;
    const note = notes[midi % 12];
    return `${note}${octave}`;
  }
}
