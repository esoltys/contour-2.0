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

import { SampleLibraryManager } from '@contour/tone-adapter';
import { GMInstrument, SoundfontLibrary, createQualifiedName } from '@contour/tone-adapter';
import { MusicalSampler } from '@contour/tone-adapter';

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

// Map GM instruments to their program numbers for category filtering
const INSTRUMENT_PROGRAM_MAP: Map<GMInstrument, number> = new Map([
  // Piano (0-7)
  [GMInstrument.AcousticGrandPiano, 0],
  [GMInstrument.BrightAcousticPiano, 1],
  [GMInstrument.ElectricGrandPiano, 2],
  [GMInstrument.HonkyTonkPiano, 3],
  [GMInstrument.ElectricPiano1, 4],
  [GMInstrument.ElectricPiano2, 5],
  [GMInstrument.Harpsichord, 6],
  [GMInstrument.Clavinet, 7],
  // Chromatic Percussion (8-15)
  [GMInstrument.Celesta, 8],
  [GMInstrument.Glockenspiel, 9],
  [GMInstrument.MusicBox, 10],
  [GMInstrument.Vibraphone, 11],
  [GMInstrument.Marimba, 12],
  [GMInstrument.Xylophone, 13],
  [GMInstrument.TubularBells, 14],
  [GMInstrument.Dulcimer, 15],
  // Organ (16-23)
  [GMInstrument.DrawbarOrgan, 16],
  [GMInstrument.PercussiveOrgan, 17],
  [GMInstrument.RockOrgan, 18],
  [GMInstrument.ChurchOrgan, 19],
  [GMInstrument.ReedOrgan, 20],
  [GMInstrument.Accordion, 21],
  [GMInstrument.Harmonica, 22],
  [GMInstrument.TangoAccordion, 23],
  // Guitar (24-31)
  [GMInstrument.AcousticGuitarNylon, 24],
  [GMInstrument.AcousticGuitarSteel, 25],
  [GMInstrument.ElectricGuitarJazz, 26],
  [GMInstrument.ElectricGuitarClean, 27],
  [GMInstrument.ElectricGuitarMuted, 28],
  [GMInstrument.OverdrivenGuitar, 29],
  [GMInstrument.DistortionGuitar, 30],
  [GMInstrument.GuitarHarmonics, 31],
  // Bass (32-39)
  [GMInstrument.AcousticBass, 32],
  [GMInstrument.ElectricBassFinger, 33],
  [GMInstrument.ElectricBassPick, 34],
  [GMInstrument.FretlessBass, 35],
  [GMInstrument.SlapBass1, 36],
  [GMInstrument.SlapBass2, 37],
  [GMInstrument.SynthBass1, 38],
  [GMInstrument.SynthBass2, 39],
  // Strings (40-47)
  [GMInstrument.Violin, 40],
  [GMInstrument.Viola, 41],
  [GMInstrument.Cello, 42],
  [GMInstrument.Contrabass, 43],
  [GMInstrument.TremoloStrings, 44],
  [GMInstrument.PizzicatoStrings, 45],
  [GMInstrument.OrchestralHarp, 46],
  [GMInstrument.Timpani, 47],
  // Ensemble (48-55)
  [GMInstrument.StringEnsemble1, 48],
  [GMInstrument.StringEnsemble2, 49],
  [GMInstrument.SynthStrings1, 50],
  [GMInstrument.SynthStrings2, 51],
  [GMInstrument.ChoirAahs, 52],
  [GMInstrument.VoiceOohs, 53],
  [GMInstrument.SynthVoice, 54],
  [GMInstrument.OrchestraHit, 55],
  // Brass (56-63)
  [GMInstrument.Trumpet, 56],
  [GMInstrument.Trombone, 57],
  [GMInstrument.Tuba, 58],
  [GMInstrument.MutedTrumpet, 59],
  [GMInstrument.FrenchHorn, 60],
  [GMInstrument.BrassSection, 61],
  [GMInstrument.SynthBrass1, 62],
  [GMInstrument.SynthBrass2, 63],
  // Reed (64-71)
  [GMInstrument.SopranoSax, 64],
  [GMInstrument.AltoSax, 65],
  [GMInstrument.TenorSax, 66],
  [GMInstrument.BaritoneSax, 67],
  [GMInstrument.Oboe, 68],
  [GMInstrument.EnglishHorn, 69],
  [GMInstrument.Bassoon, 70],
  [GMInstrument.Clarinet, 71],
  // Pipe (72-79)
  [GMInstrument.Piccolo, 72],
  [GMInstrument.Flute, 73],
  [GMInstrument.Recorder, 74],
  [GMInstrument.PanFlute, 75],
  [GMInstrument.BlownBottle, 76],
  [GMInstrument.Shakuhachi, 77],
  [GMInstrument.Whistle, 78],
  [GMInstrument.Ocarina, 79],
  // Synth Lead (80-87)
  [GMInstrument.Lead1Square, 80],
  [GMInstrument.Lead2Sawtooth, 81],
  [GMInstrument.Lead3Calliope, 82],
  [GMInstrument.Lead4Chiff, 83],
  [GMInstrument.Lead5Charang, 84],
  [GMInstrument.Lead6Voice, 85],
  [GMInstrument.Lead7Fifths, 86],
  [GMInstrument.Lead8BassLead, 87],
  // Synth Pad (88-95)
  [GMInstrument.Pad1NewAge, 88],
  [GMInstrument.Pad2Warm, 89],
  [GMInstrument.Pad3Polysynth, 90],
  [GMInstrument.Pad4Choir, 91],
  [GMInstrument.Pad5Bowed, 92],
  [GMInstrument.Pad6Metallic, 93],
  [GMInstrument.Pad7Halo, 94],
  [GMInstrument.Pad8Sweep, 95],
  // Synth Effects (96-103)
  [GMInstrument.FX1Rain, 96],
  [GMInstrument.FX2Soundtrack, 97],
  [GMInstrument.FX3Crystal, 98],
  [GMInstrument.FX4Atmosphere, 99],
  [GMInstrument.FX5Brightness, 100],
  [GMInstrument.FX6Goblins, 101],
  [GMInstrument.FX7Echoes, 102],
  [GMInstrument.FX8SciFi, 103],
  // Ethnic (104-111)
  [GMInstrument.Sitar, 104],
  [GMInstrument.Banjo, 105],
  [GMInstrument.Shamisen, 106],
  [GMInstrument.Koto, 107],
  [GMInstrument.Kalimba, 108],
  [GMInstrument.Bagpipe, 109],
  [GMInstrument.Fiddle, 110],
  [GMInstrument.Shanai, 111],
  // Percussive (112-119)
  [GMInstrument.TinkleBell, 112],
  [GMInstrument.Agogo, 113],
  [GMInstrument.SteelDrums, 114],
  [GMInstrument.Woodblock, 115],
  [GMInstrument.TaikoDrum, 116],
  [GMInstrument.MelodicTom, 117],
  [GMInstrument.SynthDrum, 118],
  [GMInstrument.ReverseCymbal, 119],
  // Sound Effects (120-127)
  [GMInstrument.GuitarFretNoise, 120],
  [GMInstrument.BreathNoise, 121],
  [GMInstrument.Seashore, 122],
  [GMInstrument.BirdTweet, 123],
  [GMInstrument.TelephoneRing, 124],
  [GMInstrument.Helicopter, 125],
  [GMInstrument.Applause, 126],
  [GMInstrument.Gunshot, 127],
]);

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
    const modal = document.createElement('div');
    modal.className = 'instrument-selector-modal';
    modal.style.display = 'none';

    const content = document.createElement('div');
    content.className = 'instrument-selector-content';

    // Header
    const header = this.createHeader();
    content.appendChild(header);

    // Current instrument display
    const currentInstrumentEl = document.createElement('div');
    currentInstrumentEl.className = 'current-instrument';
    currentInstrumentEl.id = 'current-instrument-display';
    content.appendChild(currentInstrumentEl);

    // Search bar
    const searchBar = this.createSearchBar();
    content.appendChild(searchBar);

    // Library selector
    const librarySelector = this.createLibrarySelector();
    content.appendChild(librarySelector);

    // Category tabs
    const categoryTabs = this.createCategoryTabs();
    content.appendChild(categoryTabs);

    // Instrument list
    const instrumentList = document.createElement('div');
    instrumentList.className = 'instrument-list';
    instrumentList.id = 'instrument-list';
    content.appendChild(instrumentList);

    // Footer with actions
    const footer = this.createFooter();
    content.appendChild(footer);

    modal.appendChild(content);
    return modal;
  }

  private createHeader(): HTMLDivElement {
    const header = document.createElement('div');
    header.className = 'instrument-selector-header';

    const title = document.createElement('h2');
    title.textContent = 'Select Instrument';
    title.id = 'instrument-selector-title';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.textContent = '×';
    closeBtn.title = 'Close';
    closeBtn.addEventListener('click', () => this.hide());

    header.appendChild(title);
    header.appendChild(closeBtn);

    return header;
  }

  private createSearchBar(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'search-container';

    const searchIcon = document.createElement('span');
    searchIcon.className = 'search-icon';
    searchIcon.textContent = '🔍';

    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'search-input';
    searchInput.placeholder = 'Search instruments...';
    searchInput.id = 'instrument-search';
    searchInput.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      this.handleSearchInput(target.value);
    });

    container.appendChild(searchIcon);
    container.appendChild(searchInput);

    return container;
  }

  private createLibrarySelector(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'library-selector-container';

    const label = document.createElement('label');
    label.textContent = 'Library: ';
    label.htmlFor = 'library-select';

    const select = document.createElement('select');
    select.id = 'library-select';
    select.className = 'library-select';

    Object.values(SoundfontLibrary).forEach((lib) => {
      const option = document.createElement('option');
      option.value = lib as string;
      option.textContent = lib as string;
      select.appendChild(option);
    });

    select.value = this.selectedLibrary;
    select.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      this.selectedLibrary = target.value as SoundfontLibrary;
    });

    container.appendChild(label);
    container.appendChild(select);

    return container;
  }

  private createCategoryTabs(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'category-tabs';

    const categories: InstrumentCategory[] = [
      'all',
      'piano',
      'chromatic',
      'organ',
      'guitar',
      'bass',
      'strings',
      'ensemble',
      'brass',
      'reed',
      'pipe',
      'synth-lead',
      'synth-pad',
      'synth-fx',
      'ethnic',
      'percussive',
      'sound-fx',
    ];

    categories.forEach((category) => {
      const tab = document.createElement('button');
      tab.className = 'category-tab';
      tab.textContent = CATEGORIES[category].name;
      tab.dataset.category = category;

      if (category === this.currentCategory) {
        tab.classList.add('active');
      }

      tab.addEventListener('click', () => {
        this.setCategory(category);
      });

      container.appendChild(tab);
    });

    return container;
  }

  private createFooter(): HTMLDivElement {
    const footer = document.createElement('div');
    footer.className = 'instrument-selector-footer';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'btn-secondary';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.addEventListener('click', () => this.hide());

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
    }, 300);
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
      const noResults = document.createElement('div');
      noResults.className = 'no-results';
      noResults.textContent = 'No instruments found';
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

      if (
        programNumber < categoryRange[0] ||
        programNumber > categoryRange[1]
      ) {
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
    const item = document.createElement('div');
    item.className = 'instrument-item';
    item.dataset.instrument = instrument;

    const checkbox = document.createElement('input');
    checkbox.type = 'radio';
    checkbox.name = 'instrument-selection';
    checkbox.value = instrument;
    checkbox.className = 'instrument-checkbox';

    const label = document.createElement('label');
    label.className = 'instrument-name';
    label.textContent = this.instrumentToDisplayName(instrument);

    const previewBtn = document.createElement('button');
    previewBtn.className = 'btn-preview';
    previewBtn.textContent = 'Preview';
    previewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.previewInstrument(instrument);
    });

    const applyBtn = document.createElement('button');
    applyBtn.className = 'btn-apply';
    applyBtn.textContent = '✓';
    applyBtn.title = 'Apply';
    applyBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.applyInstrument(instrument);
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
      const sfInstrument = await this.sampleManager.getInstrumentByQualifiedName(
        qualifiedName
      );

      // Create sampler
      this.previewSampler = new MusicalSampler(sfInstrument);
      this.previewSampler.toDestination();

      // Play preview note (C4 for 0.5 seconds)
      this.previewSampler.triggerAttackRelease('C4', 0.5, undefined, 0.8);

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
      }, 600);
    } catch (error) {
      console.error('Preview failed:', error);
      const previewBtn = this.modal?.querySelector(
        `[data-instrument="${instrument}"] .btn-preview`
      ) as HTMLButtonElement;
      if (previewBtn) {
        previewBtn.disabled = false;
        previewBtn.textContent = 'Error';
        setTimeout(() => {
          previewBtn.textContent = 'Preview';
        }, 2000);
      }
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
