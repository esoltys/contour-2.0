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

import { Tone, getTransportDebugger, type ScheduledEventInfo } from '@contour/tone-adapter';

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
  private eventsTableBody: HTMLTableSectionElement | null = null;
  private eventCountElement: HTMLSpanElement | null = null;
  private stateElement: HTMLSpanElement | null = null;
  private bpmElement: HTMLSpanElement | null = null;
  private positionElement: HTMLSpanElement | null = null;
  private secondsElement: HTMLSpanElement | null = null;

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

    // Create state element
    const stateItemDiv = document.createElement('div');
    stateItemDiv.className = 'state-item';
    const stateLabel = document.createElement('div');
    stateLabel.className = 'state-label';
    stateLabel.textContent = 'State';
    this.stateElement = document.createElement('div');
    this.stateElement.className = 'state-value';
    this.stateElement.textContent = 'stopped';
    stateItemDiv.appendChild(stateLabel);
    stateItemDiv.appendChild(this.stateElement);
    stateGrid.appendChild(stateItemDiv);

    // Create BPM element
    const bpmItemDiv = document.createElement('div');
    bpmItemDiv.className = 'state-item';
    const bpmLabel = document.createElement('div');
    bpmLabel.className = 'state-label';
    bpmLabel.textContent = 'BPM';
    this.bpmElement = document.createElement('div');
    this.bpmElement.className = 'state-value';
    this.bpmElement.textContent = '120';
    bpmItemDiv.appendChild(bpmLabel);
    bpmItemDiv.appendChild(this.bpmElement);
    stateGrid.appendChild(bpmItemDiv);

    // Create position element
    const positionItemDiv = document.createElement('div');
    positionItemDiv.className = 'state-item';
    const positionLabel = document.createElement('div');
    positionLabel.className = 'state-label';
    positionLabel.textContent = 'Position';
    this.positionElement = document.createElement('div');
    this.positionElement.className = 'state-value';
    this.positionElement.textContent = '0:0:0';
    positionItemDiv.appendChild(positionLabel);
    positionItemDiv.appendChild(this.positionElement);
    stateGrid.appendChild(positionItemDiv);

    // Create seconds element
    const secondsItemDiv = document.createElement('div');
    secondsItemDiv.className = 'state-item';
    const secondsLabel = document.createElement('div');
    secondsLabel.className = 'state-label';
    secondsLabel.textContent = 'Seconds';
    this.secondsElement = document.createElement('div');
    this.secondsElement.className = 'state-value';
    this.secondsElement.textContent = '0.00';
    secondsItemDiv.appendChild(secondsLabel);
    secondsItemDiv.appendChild(this.secondsElement);
    stateGrid.appendChild(secondsItemDiv);

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

    this.eventCountElement = document.createElement('span');
    this.eventCountElement.className = 'event-count';
    this.eventCountElement.textContent = '0 events';

    header.appendChild(title);
    header.appendChild(this.eventCountElement);
    section.appendChild(header);

    // Events table container (scrollable)
    const tableContainer = document.createElement('div');
    tableContainer.className = 'events-table-container';

    this.eventsTable = document.createElement('table');
    this.eventsTable.className = 'events-table';

    const thead = document.createElement('thead');
    thead.innerHTML = `
      <tr>
        <th>Time</th>
        <th>Type</th>
        <th>Description</th>
      </tr>
    `;

    this.eventsTableBody = document.createElement('tbody');
    this.eventsTableBody.innerHTML = `
      <tr class="no-events">
        <td colspan="3">No events scheduled</td>
      </tr>
    `;

    this.eventsTable.appendChild(thead);
    this.eventsTable.appendChild(this.eventsTableBody);

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

    // Update transport state using stored element references
    if (this.stateElement) {
      const state = Tone.getTransport().state;
      this.stateElement.textContent = state;
      this.stateElement.className = `state-value state-${state}`;
    }

    if (this.bpmElement) {
      this.bpmElement.textContent = Tone.getTransport().bpm.value.toFixed(1);
    }

    if (this.positionElement) {
      this.positionElement.textContent = Tone.getTransport().position.toString();
    }

    if (this.secondsElement) {
      this.secondsElement.textContent = Tone.getTransport().seconds.toFixed(2);
    }

    // Update scheduled events
    this.updateEvents();
  }

  private updateEvents(): void {
    if (!this.eventsTableBody) return;

    // Get events from TransportDebugger
    const transportDebugger = getTransportDebugger();
    const events = transportDebugger.getScheduledEvents();
    const pendingEvents = transportDebugger.getPendingEvents();

    if (this.eventCountElement) {
      this.eventCountElement.textContent = `${pendingEvents.length} pending / ${events.length} total`;
    }

    if (pendingEvents.length === 0) {
      this.eventsTableBody.innerHTML = `
        <tr class="no-events">
          <td colspan="3">No pending events</td>
        </tr>
      `;
      return;
    }

    // Sort by time and show pending events
    const sortedEvents = [...pendingEvents].sort((a, b) => {
      const timeA = this.eventTimeToNumber(a.time);
      const timeB = this.eventTimeToNumber(b.time);
      return timeA - timeB;
    });

    // Highlight next 5 events
    const nextEvents = sortedEvents.slice(0, 5);
    const nextEventIds = new Set(nextEvents.map(e => e.id));

    this.eventsTableBody.innerHTML = sortedEvents.map(event => {
      const isNext = nextEventIds.has(event.id);
      const rowClass = isNext ? 'next-event' : '';
      const timeStr = this.formatEventTime(event.time);

      return `
        <tr class="${rowClass}">
          <td>${timeStr}</td>
          <td>${event.state}</td>
          <td>${event.callback}</td>
        </tr>
      `;
    }).join('');
  }

  private eventTimeToNumber(time: string | number): number {
    if (typeof time === 'number') return time;
    try {
      return Tone.Time(time).toSeconds();
    } catch {
      return 0;
    }
  }

  private formatEventTime(time: string | number): string {
    if (typeof time === 'string') return time;
    return time.toFixed(3) + 's';
  }

  private clearAllEvents(): void {
    if (confirm('Clear all scheduled events? This will stop all playing patterns.')) {
      Tone.getTransport().cancel();
      this.updateEvents();
      console.log('[TransportInspector] All events cleared');
    }
  }
}
