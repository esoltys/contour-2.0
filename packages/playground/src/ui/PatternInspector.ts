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

import { Note, type Pattern, type PatternInspection } from '@contour/core';
import { PATTERN_CANVAS_WIDTH, PATTERN_CANVAS_HEIGHT } from '../constants.js';

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

    // Populate with any already-registered patterns
    this.patterns.forEach((pattern) => {
      const option = document.createElement('option');
      option.value = pattern.id;
      option.textContent = pattern.name;
      select.appendChild(option);
    });

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
    canvas.width = PATTERN_CANVAS_WIDTH;
    canvas.height = PATTERN_CANVAS_HEIGHT;
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

    try {
      const pattern = inspectable.pattern;
      const inspection = pattern.inspect();

      let output = `Pattern: ${inspectable.name}\n\n`;
      output += `Duration: ${inspection.duration.toFixed(3)}s\n\n`;

      output += `Event Counts:\n`;
      output += `  Notes:  ${inspection.eventCount.notes}\n`;
      output += `  Rests:  ${inspection.eventCount.rests}\n`;
      output += `  Chords: ${inspection.eventCount.chords}\n`;
      output += `  Total:  ${inspection.eventCount.total}\n\n`;

      if (inspection.noteRange.lowest !== null) {
        output += `Note Range:\n`;
        output += `  Lowest:  ${Note.midiToNoteName(inspection.noteRange.lowest)}\n`;
        output += `  Highest: ${Note.midiToNoteName(inspection.noteRange.highest!)}\n`;
        output += `  Span:    ${inspection.noteRange.span} semitones\n\n`;
      }

      output += `Timing:\n`;
      output += `  Gaps:        ${inspection.timing.gaps}\n`;
      output += `  Overlaps:    ${inspection.timing.overlaps}\n`;
      output += `  Avg spacing: ${inspection.timing.avgSpacing.toFixed(3)}s\n\n`;

      output += `Velocity:\n`;
      output += `  Min: ${inspection.velocity.min}\n`;
      output += `  Max: ${inspection.velocity.max}\n`;
      output += `  Avg: ${inspection.velocity.avg.toFixed(1)}\n`;

      detailsEl.textContent = output;

      // Update visualization
      this.visualizePattern(inspectable.pattern, inspection);
    } catch (error) {
      detailsEl.textContent = `Error inspecting pattern:\n${error instanceof Error ? error.message : 'Unknown error'}`;
      this.clearVisualization();
    }
  }

  private visualizePattern(pattern: Pattern, inspection: PatternInspection): void {
    const canvas = document.getElementById('pattern-timeline-canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    try {
      const events = pattern.events;

      if (events.length === 0) {
        ctx.fillStyle = '#666';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('No events to visualize', canvas.width / 2, canvas.height / 2);
        return;
      }

      const minNote = inspection.noteRange.lowest || 60;
      const maxNote = inspection.noteRange.highest || 72;
      const noteRange = maxNote - minNote || 12;
      const maxTime = inspection.duration;

      // Draw events
      events.forEach((event) => {
        if (event.type === 'rest') return; // Skip rests

        const time = event.time;
        const velocity = event.velocity;

        if (event.type === 'note') {
          const x = (time / maxTime) * (canvas.width - 40) + 20;
          const y = ((maxNote - event.pitch) / noteRange) * (canvas.height - 40) + 20;

          // Draw note as circle
          const radius = (velocity / 127) * 8 + 2;
          ctx.fillStyle = `hsl(${(event.pitch % 12) * 30}, 70%, 60%)`;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (event.type === 'chord') {
          // Draw chord notes
          event.notes.forEach((note) => {
            const x = (time / maxTime) * (canvas.width - 40) + 20;
            const y = ((maxNote - note.pitch) / noteRange) * (canvas.height - 40) + 20;

            const radius = (velocity / 127) * 8 + 2;
            ctx.fillStyle = `hsl(${(note.pitch % 12) * 30}, 70%, 60%)`;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
          });
        }
      });

      // Update stats
      this.updateStats(inspection);
    } catch (error) {
      console.error('[PatternInspector] Visualization error:', error);
      this.clearVisualization();
    }
  }

  private updateStats(inspection: PatternInspection): void {
    const eventsEl = document.getElementById('stat-events');
    const durationEl = document.getElementById('stat-duration');
    const rangeEl = document.getElementById('stat-range');
    const velocityEl = document.getElementById('stat-velocity');

    if (eventsEl) eventsEl.textContent = inspection.eventCount.total.toString();
    if (durationEl) durationEl.textContent = `${inspection.duration.toFixed(2)}s`;

    if (rangeEl) {
      if (inspection.noteRange.lowest !== null) {
        const low = Note.midiToNoteName(inspection.noteRange.lowest);
        const high = Note.midiToNoteName(inspection.noteRange.highest!);
        rangeEl.textContent = `${low} - ${high}`;
      } else {
        rangeEl.textContent = '-';
      }
    }

    if (velocityEl) {
      velocityEl.textContent = inspection.velocity.avg.toFixed(0);
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
}
