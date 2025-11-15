/**
 * Sample Library Panel - Display loaded libraries, instruments, and memory usage
 *
 * Features:
 * - Show all loaded instruments
 * - Display estimated memory usage
 * - Show loading progress
 * - Auto-update display
 */

import { SampleLibraryManager } from '@contour/tone-adapter';

export class SampleLibraryPanel {
  private container: HTMLDivElement | null = null;
  private sampleManager: SampleLibraryManager;
  private updateInterval: number | null = null;

  constructor(sampleManager: SampleLibraryManager) {
    this.sampleManager = sampleManager;
    this.initialize();
  }

  private initialize(): void {
    this.container = this.createContainer();
    document.body.appendChild(this.container);

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible()) {
        this.hide();
      }
    });

    // Close on background click
    this.container.addEventListener('click', (e) => {
      if (e.target === this.container) {
        this.hide();
      }
    });
  }

  private createContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'sample-library-panel-modal';
    container.style.display = 'none';

    const content = document.createElement('div');
    content.className = 'sample-library-panel-content';

    // Header
    const header = this.createHeader();
    content.appendChild(header);

    // Status section
    const status = document.createElement('div');
    status.className = 'library-status';
    status.id = 'library-status';
    content.appendChild(status);

    // Instruments list
    const instrumentsContainer = document.createElement('div');
    instrumentsContainer.className = 'instruments-container';
    instrumentsContainer.id = 'instruments-container';
    content.appendChild(instrumentsContainer);

    // Actions
    const actions = this.createActions();
    content.appendChild(actions);

    container.appendChild(content);
    return container;
  }

  private createHeader(): HTMLDivElement {
    const header = document.createElement('div');
    header.className = 'sample-library-panel-header';

    const title = document.createElement('h2');
    title.textContent = 'Sample Libraries';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.textContent = '×';
    closeBtn.title = 'Close';
    closeBtn.addEventListener('click', () => this.hide());

    header.appendChild(title);
    header.appendChild(closeBtn);

    return header;
  }

  private createActions(): HTMLDivElement {
    const actions = document.createElement('div');
    actions.className = 'library-actions';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn-secondary';
    closeBtn.textContent = 'Close';
    closeBtn.addEventListener('click', () => this.hide());

    actions.appendChild(closeBtn);

    return actions;
  }

  show(): void {
    if (this.container) {
      this.container.style.display = 'flex';
      this.update();
      this.startAutoUpdate();
    }
  }

  hide(): void {
    if (this.container) {
      this.container.style.display = 'none';
      this.stopAutoUpdate();
    }
  }

  toggle(): void {
    if (this.isVisible()) {
      this.hide();
    } else {
      this.show();
    }
  }

  isVisible(): boolean {
    return this.container?.style.display === 'flex';
  }

  /**
   * Update display with current library state.
   */
  private update(): void {
    const loadedInstruments = this.sampleManager.getLoadedInstruments();
    const instrumentCount = loadedInstruments.length;
    const estimatedMemory = this.estimateMemoryUsage(instrumentCount);

    // Update status
    const statusEl = this.container?.querySelector('#library-status');
    if (statusEl) {
      statusEl.innerHTML = `
        <div class="status-row">
          <span class="status-label">Status:</span>
          <span class="status-value">${instrumentCount} instrument${instrumentCount !== 1 ? 's' : ''} loaded</span>
        </div>
        <div class="status-row">
          <span class="status-label">Memory:</span>
          <span class="status-value">~${estimatedMemory} MB</span>
        </div>
      `;
    }

    // Update instruments list
    const instrumentsEl = this.container?.querySelector('#instruments-container');
    if (instrumentsEl) {
      if (instrumentCount === 0) {
        instrumentsEl.innerHTML = '<div class="no-instruments">No instruments loaded</div>';
      } else {
        instrumentsEl.innerHTML = `
          <div class="instruments-header">Loaded Instruments:</div>
          <div class="instruments-list">
            ${loadedInstruments
              .map(
                (name) => `
                  <div class="instrument-entry">
                    <span class="instrument-icon">🎵</span>
                    <span class="instrument-name">${this.formatInstrumentName(name)}</span>
                    <span class="instrument-status">loaded</span>
                    <span class="instrument-size">~${this.estimateInstrumentSize()} MB</span>
                  </div>
                `
              )
              .join('')}
          </div>
        `;
      }
    }
  }

  /**
   * Estimate memory usage based on number of loaded instruments.
   * Rough estimate: 5-10 MB per instrument on average.
   */
  private estimateMemoryUsage(instrumentCount: number): number {
    const avgSizePerInstrument = 7; // MB
    return Math.round(instrumentCount * avgSizePerInstrument);
  }

  /**
   * Estimate size of a single instrument.
   */
  private estimateInstrumentSize(): number {
    return 7; // MB - rough estimate
  }

  /**
   * Format instrument name for display.
   * Convert snake_case to Title Case.
   */
  private formatInstrumentName(name: string): string {
    return name
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Start auto-updating display.
   */
  private startAutoUpdate(): void {
    this.updateInterval = window.setInterval(() => {
      this.update();
    }, 1000);
  }

  /**
   * Stop auto-updating.
   */
  private stopAutoUpdate(): void {
    if (this.updateInterval !== null) {
      window.clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  dispose(): void {
    this.stopAutoUpdate();
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }
}
