/**
 * Instrument Selector - Modal interface for browsing and selecting GM instruments
 *
 * Features:
 * - Browse all 128 General MIDI instruments
 * - Category filtering (Piano, Strings, Brass, etc.)
 * - Search/filter by instrument name
 * - Preview button to hear instrument sound
 * - Apply selected instrument to current pad
 */

import {
  SampleLibraryManager,
  GMInstrument,
  SoundfontLibrary,
  createQualifiedName,
  MusicalSampler
} from '@contour/tone-adapter';
import {
  SEARCH_DEBOUNCE_MS,
  PREVIEW_NOTE_DURATION,
  PREVIEW_NOTE_VELOCITY,
  PREVIEW_CLEANUP_DELAY_MS,
  ERROR_RESET_TIMEOUT_MS
} from '../constants.js';
import { INSTRUMENT_PROGRAM_MAP } from '../config/instruments.js';
import { div, span, button, inputEl, selectEl, optionEl, labelEl, h2 } from './utils/dom.js';

export type InstrumentCategory =
  | 'all'
  | 'piano'
  | 'chromatic'
  | 'organ'
  | 'guitar'
  | 'bass'
  | 'strings'
  | 'ensemble'
  | 'brass'
  | 'reed'
  | 'pipe'
  | 'synth-lead'
  | 'synth-pad'
  | 'synth-fx'
  | 'ethnic'
  | 'percussive'
  | 'sound-fx';

interface CategoryInfo {
  name: string;
  range: [number, number]; // GM instrument number range
}

const CATEGORIES: Record<InstrumentCategory, CategoryInfo> = {
  all: { name: 'All', range: [0, 127] },
  piano: { name: 'Piano', range: [0, 7] },
  chromatic: { name: 'Chromatic Percussion', range: [8, 15] },
  organ: { name: 'Organ', range: [16, 23] },
  guitar: { name: 'Guitar', range: [24, 31] },
  bass: { name: 'Bass', range: [32, 39] },
  strings: { name: 'Strings', range: [40, 47] },
  ensemble: { name: 'Ensemble', range: [48, 55] },
  brass: { name: 'Brass', range: [56, 63] },
  reed: { name: 'Reed', range: [64, 71] },
  pipe: { name: 'Pipe', range: [72, 79] },
  'synth-lead': { name: 'Synth Lead', range: [80, 87] },
  'synth-pad': { name: 'Synth Pad', range: [88, 95] },
  'synth-fx': { name: 'Synth Effects', range: [96, 103] },
  ethnic: { name: 'Ethnic', range: [104, 111] },
  percussive: { name: 'Percussive', range: [112, 119] },
  'sound-fx': { name: 'Sound Effects', range: [120, 127] },
};

export class InstrumentSelector {
  private modal: HTMLDivElement | null = null;
  private sampleManager: SampleLibraryManager;
  private currentPadId: string | null = null;
  private currentInstrument: string | null = null;
  private onInstrumentSelected: (padId: string, instrument: string) => void;
  private audioContext: AudioContext;
  private currentCategory: InstrumentCategory = 'all';
  private searchTerm: string = '';
  private selectedLibrary: SoundfontLibrary = SoundfontLibrary.MusyngKite;
  private previewSampler: MusicalSampler | null = null;
  private searchDebounceTimer: number | null = null;

  constructor(
    sampleManager: SampleLibraryManager,
    audioContext: AudioContext,
    onInstrumentSelected: (padId: string, instrument: string) => void
  ) {
    this.sampleManager = sampleManager;
    this.audioContext = audioContext;
    this.onInstrumentSelected = onInstrumentSelected;
    this.initialize();
  }

  private initialize(): void {
    this.modal = this.createModal();
    document.body.appendChild(this.modal);

    // Close modal on background click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible()) {
        this.hide();
      }
    });
  }

  private createModal(): HTMLDivElement {
    const modal = div({
      className: 'instrument-selector-modal',
      style: { display: 'none' }
    });

    const content = div({ className: 'instrument-selector-content' });

    content.appendChild(this.createHeader());
    content.appendChild(div({ className: 'current-instrument', id: 'current-instrument-display' }));
    content.appendChild(this.createSearchBar());
    content.appendChild(this.createLibrarySelector());
    content.appendChild(this.createCategoryTabs());

    // Error notification area
    const errorNotification = div({
      className: 'instrument-selector-error',
      id: 'instrument-selector-error',
      styles: {
        display: 'none',
        background: '#ff4444',
        color: 'white',
        padding: '10px 15px',
        borderRadius: '4px',
        margin: '10px 0',
        alignItems: 'center',
        gap: '10px',
        fontSize: '14px'
      }
    });
    content.appendChild(errorNotification);

    content.appendChild(div({ className: 'instrument-list', id: 'instrument-list' }));
    content.appendChild(this.createFooter());

    modal.appendChild(content);
    return modal;
  }

  private createHeader(): HTMLDivElement {
    const header = div({ className: 'instrument-selector-header' });

    const title = h2({
      text: 'Select Instrument',
      id: 'instrument-selector-title'
    });

    const closeBtn = button({
      className: 'close-btn',
      text: '×',
      attrs: { title: 'Close' },
      events: { click: () => this.hide() }
    });

    header.appendChild(title);
    header.appendChild(closeBtn);

    return header;
  }

  private createSearchBar(): HTMLDivElement {
    const container = div({ className: 'search-container' });

    const searchIcon = span({
      className: 'search-icon',
      text: '🔍'
    });

    const searchInput = inputEl({
      className: 'search-input',
      id: 'instrument-search',
      attrs: { type: 'text', placeholder: 'Search instruments...' },
      events: {
        input: (e) => {
          const target = e.target as HTMLInputElement;
          this.handleSearchInput(target.value);
        }
      }
    });

    container.appendChild(searchIcon);
    container.appendChild(searchInput);

    return container;
  }

  private createLibrarySelector(): HTMLDivElement {
    const container = div({ className: 'library-selector-container' });

    const label = labelEl({
      text: 'Library: ',
      attrs: { for: 'library-select' }
    });

    const select = selectEl({
      id: 'library-select',
      className: 'library-select',
      events: {
        change: (e) => {
          const target = e.target as HTMLSelectElement;
          this.selectedLibrary = target.value as SoundfontLibrary;
        }
      }
    });

    Object.values(SoundfontLibrary).forEach((lib) => {
      const option = optionEl({
        text: lib as string,
        attrs: { value: lib as string }
      });
      select.appendChild(option);
    });

    select.value = this.selectedLibrary;

    container.appendChild(label);
    container.appendChild(select);

    return container;
  }

  private createCategoryTabs(): HTMLDivElement {
    const container = div({ className: 'category-tabs' });

    const categories: InstrumentCategory[] = [
      'all', 'piano', 'chromatic', 'organ', 'guitar', 'bass',
      'strings', 'ensemble', 'brass', 'reed', 'pipe',
      'synth-lead', 'synth-pad', 'synth-fx', 'ethnic', 'percussive', 'sound-fx',
    ];

    categories.forEach((category) => {
      const tab = button({
        className: category === this.currentCategory ? 'category-tab active' : 'category-tab',
        text: CATEGORIES[category].name,
        data: { category },
        events: { click: () => this.setCategory(category) }
      });

      container.appendChild(tab);
    });

    return container;
  }

  private createFooter(): HTMLDivElement {
    const footer = div({ className: 'instrument-selector-footer' });

    const cancelBtn = button({
      className: 'btn-secondary',
      text: 'Cancel',
      events: { click: () => this.hide() }
    });

    footer.appendChild(cancelBtn);

    return footer;
  }

  private handleSearchInput(value: string): void {
    // Debounce search
    if (this.searchDebounceTimer !== null) {
      window.clearTimeout(this.searchDebounceTimer);
    }

    this.searchDebounceTimer = window.setTimeout(() => {
      this.searchTerm = value.toLowerCase();
      this.updateInstrumentList();
    }, SEARCH_DEBOUNCE_MS);
  }

  private setCategory(category: InstrumentCategory): void {
    this.currentCategory = category;

    // Update tab active state
    const tabs = this.modal?.querySelectorAll('.category-tab');
    tabs?.forEach((tab) => {
      if ((tab as HTMLElement).dataset.category === category) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    this.updateInstrumentList();
  }

  private updateInstrumentList(): void {
    const listEl = this.modal?.querySelector('#instrument-list');
    if (!listEl) return;

    listEl.innerHTML = '';

    const filteredInstruments = this.getFilteredInstruments();

    filteredInstruments.forEach((instrument) => {
      const item = this.createInstrumentItem(instrument);
      listEl.appendChild(item);
    });

    if (filteredInstruments.length === 0) {
      const noResults = div({
        className: 'no-results',
        text: 'No instruments found'
      });
      listEl.appendChild(noResults);
    }
  }

  private getFilteredInstruments(): GMInstrument[] {
    const categoryRange = CATEGORIES[this.currentCategory].range;
    const allInstruments = Object.values(GMInstrument) as GMInstrument[];

    return allInstruments.filter((instrument) => {
      // Filter by category
      const programNumber = INSTRUMENT_PROGRAM_MAP.get(instrument);
      if (programNumber === undefined) return false;

      if (programNumber < categoryRange[0] || programNumber > categoryRange[1]) {
        return false;
      }

      // Filter by search term
      if (this.searchTerm) {
        const displayName = this.instrumentToDisplayName(instrument);
        if (!displayName.toLowerCase().includes(this.searchTerm)) {
          return false;
        }
      }

      return true;
    });
  }

  private createInstrumentItem(instrument: GMInstrument): HTMLDivElement {
    const item = div({
      className: 'instrument-item',
      data: { instrument }
    });

    const checkbox = inputEl({
      className: 'instrument-checkbox',
      attrs: { type: 'radio', name: 'instrument-selection', value: instrument }
    });

    const label = labelEl({
      className: 'instrument-name',
      text: this.instrumentToDisplayName(instrument)
    });

    const previewBtn = button({
      className: 'btn-preview',
      text: 'Preview',
      events: {
        click: (e) => {
          e.stopPropagation();
          this.previewInstrument(instrument);
        }
      }
    });

    const applyBtn = button({
      className: 'btn-apply',
      text: '✓',
      attrs: { title: 'Apply' },
      events: {
        click: (e) => {
          e.stopPropagation();
          this.applyInstrument(instrument);
        }
      }
    });

    item.appendChild(checkbox);
    item.appendChild(label);
    item.appendChild(previewBtn);
    item.appendChild(applyBtn);

    // Click anywhere on item to select
    item.addEventListener('click', () => {
      checkbox.checked = true;
    });

    return item;
  }

  private instrumentToDisplayName(instrument: GMInstrument): string {
    // Convert snake_case to Title Case
    return instrument
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  private async previewInstrument(instrument: GMInstrument): Promise<void> {
    try {
      const previewBtn = this.modal?.querySelector(
        `[data-instrument="${instrument}"] .btn-preview`
      ) as HTMLButtonElement;
      if (previewBtn) {
        previewBtn.disabled = true;
        previewBtn.textContent = 'Loading...';
      }

      // Clean up previous preview
      if (this.previewSampler) {
        this.previewSampler.dispose();
        this.previewSampler = null;
      }

      // Load instrument
      const qualifiedName = createQualifiedName(this.selectedLibrary, instrument);
      const sfInstrument = await this.sampleManager.getInstrumentByQualifiedName(qualifiedName);

      // Create sampler
      this.previewSampler = new MusicalSampler(sfInstrument);
      this.previewSampler.toDestination();

      // Play preview note
      this.previewSampler.triggerAttackRelease('C4', PREVIEW_NOTE_DURATION, undefined, PREVIEW_NOTE_VELOCITY);

      // Clean up after preview
      setTimeout(() => {
        if (this.previewSampler) {
          this.previewSampler.dispose();
          this.previewSampler = null;
        }
        if (previewBtn) {
          previewBtn.disabled = false;
          previewBtn.textContent = 'Preview';
        }
      }, PREVIEW_CLEANUP_DELAY_MS);
    } catch (error) {
      console.error('Preview failed:', error);
      const previewBtn = this.modal?.querySelector(
        `[data-instrument="${instrument}"] .btn-preview`
      ) as HTMLButtonElement;

      // Determine error type and provide helpful message
      let errorMessage = 'Failed to preview instrument.';
      if (error instanceof Error) {
        if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'Network error: Unable to load instrument samples. Check your internet connection.';
        } else if (error.message.includes('AudioContext') || error.message.includes('audio')) {
          errorMessage = 'Audio error: Unable to play instrument. Try clicking the page first to enable audio.';
        } else if (error.message.includes('not found') || error.message.includes('404')) {
          errorMessage = `Instrument "${instrument}" not found in the selected library.`;
        } else {
          errorMessage = `Preview failed: ${error.message}`;
        }
      }

      // Show error notification with retry option
      this.showError(errorMessage, () => this.previewInstrument(instrument));

      if (previewBtn) {
        previewBtn.disabled = false;
        previewBtn.textContent = 'Retry';
        setTimeout(() => {
          previewBtn.textContent = 'Preview';
        }, ERROR_RESET_TIMEOUT_MS);
      }
    }
  }

  private showError(message: string, retryCallback?: () => void): void {
    const errorEl = this.modal?.querySelector('#instrument-selector-error') as HTMLDivElement;
    if (!errorEl) return;

    // Create error message content
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    messageSpan.style.flex = '1';

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.className = 'error-close-btn';
    closeBtn.style.cssText = `
      background: transparent;
      border: none;
      color: white;
      font-size: 18px;
      cursor: pointer;
      padding: 0 5px;
    `;
    closeBtn.addEventListener('click', () => this.hideError());

    errorEl.innerHTML = '';
    errorEl.appendChild(messageSpan);

    if (retryCallback) {
      const retryBtn = document.createElement('button');
      retryBtn.textContent = 'Retry';
      retryBtn.className = 'error-retry-btn';
      retryBtn.style.cssText = `
        background: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.5);
        color: white;
        padding: 4px 12px;
        border-radius: 3px;
        cursor: pointer;
        font-size: 12px;
      `;
      retryBtn.addEventListener('click', () => {
        this.hideError();
        retryCallback();
      });
      errorEl.appendChild(retryBtn);
    }

    errorEl.appendChild(closeBtn);
    errorEl.style.display = 'flex';

    // Auto-hide after 8 seconds
    setTimeout(() => this.hideError(), 8000);
  }

  private hideError(): void {
    const errorEl = this.modal?.querySelector('#instrument-selector-error') as HTMLDivElement;
    if (errorEl) {
      errorEl.style.display = 'none';
    }
  }

  private applyInstrument(instrument: GMInstrument): void {
    if (!this.currentPadId) return;

    const qualifiedName = createQualifiedName(this.selectedLibrary, instrument);
    this.onInstrumentSelected(this.currentPadId, qualifiedName);
    this.hide();
  }

  show(padId: string, currentInstrument?: string): void {
    this.currentPadId = padId;
    this.currentInstrument = currentInstrument || null;

    // Update title
    const title = this.modal?.querySelector('#instrument-selector-title');
    if (title) {
      title.textContent = `Select Instrument for Pad: ${padId}`;
    }

    // Update current instrument display
    const currentInstrumentEl = this.modal?.querySelector('#current-instrument-display');
    if (currentInstrumentEl) {
      if (currentInstrument) {
        currentInstrumentEl.textContent = `Current: ${currentInstrument}`;
      } else {
        currentInstrumentEl.textContent = 'Current: Synth';
      }
    }

    // Reset search and category
    this.searchTerm = '';
    const searchInput = this.modal?.querySelector('#instrument-search') as HTMLInputElement;
    if (searchInput) {
      searchInput.value = '';
    }

    this.setCategory('all');
    this.updateInstrumentList();

    if (this.modal) {
      this.modal.style.display = 'flex';
    }
  }

  hide(): void {
    if (this.modal) {
      this.modal.style.display = 'none';
    }
    this.currentPadId = null;

    // Clean up preview sampler
    if (this.previewSampler) {
      this.previewSampler.dispose();
      this.previewSampler = null;
    }
  }

  isVisible(): boolean {
    return this.modal?.style.display === 'flex';
  }

  dispose(): void {
    if (this.previewSampler) {
      this.previewSampler.dispose();
      this.previewSampler = null;
    }
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
  }
}
