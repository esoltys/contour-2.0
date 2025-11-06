/**
 * Transport Inspector - Shows real-time Tone.Transport state
 *
 * Displays:
 * - Current transport state (started/stopped)
 * - BPM
 * - Current position
 * - Scheduled events (scrollable table)
 * - Next 5 events to fire (highlighted)
 */

import { Tone } from '@contour/tone-adapter';

interface ScheduledEvent {
  id: string;
  time: string;
  type: string;
  description: string;
}

export class TransportInspector {
  private container: HTMLDivElement | null = null;
  private updateInterval: number | null = null;
  private eventsTable: HTMLTableElement | null = null;

  public render(): HTMLDivElement {
    this.container = document.createElement('div');
    this.container.className = 'transport-inspector';

    // Transport state section
    const stateSection = this.createStateSection();
    this.container.appendChild(stateSection);

    // Events section
    const eventsSection = this.createEventsSection();
    this.container.appendChild(eventsSection);

    // Actions section
    const actionsSection = this.createActionsSection();
    this.container.appendChild(actionsSection);

    return this.container;
  }

  private createStateSection(): HTMLDivElement {
    const section = document.createElement('div');
    section.className = 'inspector-section';

    const title = document.createElement('h4');
    title.textContent = 'Transport State';
    section.appendChild(title);

    const stateGrid = document.createElement('div');
    stateGrid.className = 'state-grid';

    const stateItems = [
      { id: 'transport-state', label: 'State', value: 'stopped' },
      { id: 'transport-bpm', label: 'BPM', value: '120' },
      { id: 'transport-position', label: 'Position', value: '0:0:0' },
      { id: 'transport-seconds', label: 'Seconds', value: '0.00' }
    ];

    stateItems.forEach(item => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'state-item';

      const label = document.createElement('div');
      label.className = 'state-label';
      label.textContent = item.label;

      const value = document.createElement('div');
      value.className = 'state-value';
      value.id = item.id;
      value.textContent = item.value;

      itemDiv.appendChild(label);
      itemDiv.appendChild(value);
      stateGrid.appendChild(itemDiv);
    });

    section.appendChild(stateGrid);
    return section;
  }

  private createEventsSection(): HTMLDivElement {
    const section = document.createElement('div');
    section.className = 'inspector-section events-section';

    const header = document.createElement('div');
    header.className = 'section-header';

    const title = document.createElement('h4');
    title.textContent = 'Scheduled Events';

    const eventCount = document.createElement('span');
    eventCount.className = 'event-count';
    eventCount.id = 'transport-event-count';
    eventCount.textContent = '0 events';

    header.appendChild(title);
    header.appendChild(eventCount);
    section.appendChild(header);

    // Events table container (scrollable)
    const tableContainer = document.createElement('div');
    tableContainer.className = 'events-table-container';

    this.eventsTable = document.createElement('table');
    this.eventsTable.className = 'events-table';
    this.eventsTable.innerHTML = `
      <thead>
        <tr>
          <th>Time</th>
          <th>Type</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody id="transport-events-body">
        <tr class="no-events">
          <td colspan="3">No events scheduled</td>
        </tr>
      </tbody>
    `;

    tableContainer.appendChild(this.eventsTable);
    section.appendChild(tableContainer);

    return section;
  }

  private createActionsSection(): HTMLDivElement {
    const section = document.createElement('div');
    section.className = 'inspector-section inspector-actions';

    const clearBtn = document.createElement('button');
    clearBtn.className = 'btn btn-danger btn-small';
    clearBtn.textContent = 'Clear All Events';
    clearBtn.addEventListener('click', () => this.clearAllEvents());

    const refreshBtn = document.createElement('button');
    refreshBtn.className = 'btn btn-secondary btn-small';
    refreshBtn.textContent = 'Refresh Now';
    refreshBtn.addEventListener('click', () => this.updateState());

    section.appendChild(clearBtn);
    section.appendChild(refreshBtn);

    return section;
  }

  public startUpdates(): void {
    // Update every 100ms when playing
    this.updateInterval = window.setInterval(() => {
      this.updateState();
    }, 100);

    // Initial update
    this.updateState();
  }

  public stopUpdates(): void {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private updateState(): void {
    if (!this.container) return;

    // Update transport state
    const stateEl = document.getElementById('transport-state');
    const bpmEl = document.getElementById('transport-bpm');
    const positionEl = document.getElementById('transport-position');
    const secondsEl = document.getElementById('transport-seconds');

    if (stateEl) {
      const state = Tone.getTransport().state;
      stateEl.textContent = state;
      stateEl.className = `state-value state-${state}`;
    }

    if (bpmEl) {
      bpmEl.textContent = Tone.getTransport().bpm.value.toFixed(1);
    }

    if (positionEl) {
      positionEl.textContent = Tone.getTransport().position.toString();
    }

    if (secondsEl) {
      secondsEl.textContent = Tone.getTransport().seconds.toFixed(2);
    }

    // Update events (placeholder - will be populated when Phase 8A diagnostics are available)
    this.updateEvents();
  }

  private updateEvents(): void {
    // NOTE: This is a placeholder implementation
    // In the future, this will use the diagnostics from Phase 8A to show actual scheduled events
    // For now, we'll show a message that this feature requires Phase 8A

    const tbody = document.getElementById('transport-events-body');
    const eventCountEl = document.getElementById('transport-event-count');

    if (!tbody) return;

    // Try to access Transport's internal state (if available)
    // This is a workaround until Phase 8A diagnostics are available
    const transport = Tone.getTransport() as any;
    const events = transport._scheduledEvents || transport._timeline || [];

    if (eventCountEl) {
      eventCountEl.textContent = `${events.length || 0} events`;
    }

    if (events.length === 0) {
      tbody.innerHTML = `
        <tr class="no-events">
          <td colspan="3">No events scheduled</td>
        </tr>
      `;
    } else {
      tbody.innerHTML = `
        <tr class="info-message">
          <td colspan="3">
            ℹ️ Detailed event inspection requires Phase 8A diagnostics
          </td>
        </tr>
      `;
    }
  }

  private clearAllEvents(): void {
    if (confirm('Clear all scheduled events? This will stop all playing patterns.')) {
      Tone.getTransport().cancel();
      this.updateEvents();
      console.log('[TransportInspector] All events cleared');
    }
  }
}
