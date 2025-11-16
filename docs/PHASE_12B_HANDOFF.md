# Phase 12B Handoff: Sample Library UI Integration & Performance

**Status:** 📋 READY FOR IMPLEMENTATION
**Prerequisites:** Phase 12A (Sample Library Integration - Backend) ✅ Complete
**Target Completion:** Phase 12B
**Estimated Effort:** 2-3 days

---

## Overview

This document provides complete context for implementing **Phase 12B: Sample Library UI Integration** in the Contour playground. Phase 12A (backend integration) is complete and merged. This phase adds user-facing UI components to:

1. Toggle between synthesized and sampled instruments in the playground
2. Browse and select from 128 General MIDI instruments
3. Display loading progress and memory usage
4. Provide keyboard shortcuts for quick access

---

## Current State (Phase 12A Complete ✅)

### Backend Implementation

**Fully Implemented:**
- ✅ `SampleLibraryManager` in `packages/tone-adapter/src/samples/`
- ✅ Sample loading via CDN using soundfont-player
- ✅ `CompositionScheduler` supports both synth and sampled instruments
- ✅ Type-safe `GMInstrument` enum with 128 instruments
- ✅ Three soundfont libraries: MusyngKite, FluidR3_GM, FatBoy
- ✅ `MusicalSampler` wrapper for Tone.js integration
- ✅ Qualified instrument names (`'Library:Instrument'` format)

**Files:**
- `packages/tone-adapter/src/samples/types.ts` - Type definitions
- `packages/tone-adapter/src/samples/SampleLibraryManager.ts` - Manager class
- `packages/tone-adapter/src/wrappers/MusicalSampler.ts` - Tone.js wrapper
- `packages/tone-adapter/src/scheduling/CompositionScheduler.ts` - Integration

**Documentation:**
- `docs/SAMPLE_LIBRARY_USAGE_GUIDE.md` - Complete API reference
- `examples/sample-library-demo/` - Working examples

### Playground Current State

**Entry Points:**
1. **`packages/playground/src/main.ts`** → `index.html`
   - Simple demo with basic playback

2. **`packages/playground/src/performance.ts`** → `playground.html`
   - Interactive 4×4 grid with 16 pattern presets
   - **Already has partial sample support!** (lines 243-329)
   - Toggle button exists: "🎻 Use Samples" ↔ "🎹 Use Synths"
   - Basic instrument mapping implemented

**Existing Sample Integration in Performance Grid:**

```typescript
// From performance.ts, lines 243-329
async function toggleSamples() {
  // Already implemented:
  // - Instrument mapping for bass, melody, effects categories
  // - Loading progress: "Loading samples... N/M"
  // - Button text toggle
  // - Reschedules active pads when switching

  const instrumentMap = {
    bass: {
      'bass-groove': 'electric_bass_finger',
      'acid-bass': 'synth_bass_1',
      // ...
    },
    melody: {
      'arpeggio': 'acoustic_grand_piano',
      'melody-lead': 'lead_1_square',
      // ...
    },
    // ...
  };
}
```

**What's Missing:**
- Advanced UI for browsing/selecting instruments
- Sample library panel showing loaded state
- Per-pad instrument customization
- Memory usage display
- Loading indicators beyond basic text
- Keyboard shortcuts for instrument selection

---

## Existing UI Component Patterns

All playground UI components follow a consistent architecture:

### Component Structure

**Location:** `packages/playground/src/ui/`

**Standard Pattern:**
```typescript
export class ComponentName {
  private container: HTMLDivElement | null = null;

  constructor(/* dependencies */) {
    this.initialize();
  }

  private initialize(): void {
    // Create DOM elements
    // Attach event listeners
    // Register keyboard shortcuts
  }

  show(): void { /* ... */ }
  hide(): void { /* ... */ }
  toggle(): void { /* ... */ }
  isVisible(): boolean { /* ... */ }
  dispose(): void { /* ... */ }
}
```

### Reference Components

**1. DebugPanel (`ui/DebugPanel.ts`):**
- Multi-tab interface (Transport, Patterns, Performance, Console)
- Toggled with Cmd/Ctrl+D
- Position toggle (bottom/right)
- Settings persistence via localStorage
- Tab switching logic
- Content area updates

**2. PatternPlayground (`ui/PatternPlayground.ts`):**
- Monaco editor integration for TypeScript
- Run code with Cmd/Ctrl+Enter
- Results pane with pattern analysis
- "Add to Grid" button functionality
- Code execution in isolated context

**3. KeyboardShortcuts (`ui/KeyboardShortcuts.ts`):**
- Help overlay showing all shortcuts
- Toggled with `?` key
- Grouped by category (Transport, Pattern Grid, Debug Tools, Editor)
- Auto-generated from shortcuts array
- Modal-style presentation

**4. PerformanceMonitor (`ui/PerformanceMonitor.ts`):**
- Real-time metrics display (FPS, CPU, memory)
- 60-second history graphs
- Color-coded thresholds
- Chart.js integration
- Auto-refresh on interval

### Design System

**CSS Variables (from `playground.html`):**
```css
--bg-void: #0a0a0b;        /* Darkest background */
--bg-panel: #16161a;       /* Panel background */
--bg-surface: #1f1f24;     /* Surface elements */
--bg-elevated: #28282e;    /* Elevated/hover */
--neon-cyan: #00fff5;      /* Primary accent */
--neon-magenta: #ff00ff;   /* Secondary accent */
--text-primary: #e7e7ea;   /* Primary text */
--text-secondary: #94949a; /* Secondary text */
--border-subtle: #2e2e36;  /* Borders */
```

**Typography:**
- Font: 'Space Mono', monospace
- Headers: 14px, uppercase, letter-spacing: 2px
- Body: 13px
- Code: 12px

**Modal Pattern:**
```html
<div class="modal" id="modal-id">
  <div class="modal-content">
    <div class="modal-header">
      <h2>Title</h2>
      <button class="close-btn">×</button>
    </div>
    <div class="modal-body">
      <!-- Content -->
    </div>
    <div class="modal-footer">
      <!-- Actions -->
    </div>
  </div>
</div>
```

**Styling Classes:**
```css
.btn-primary    /* Neon cyan button */
.btn-secondary  /* Gray button */
.btn-danger     /* Red/magenta button */
.badge          /* Small label/tag */
.spinner        /* Loading animation */
.progress-bar   /* Progress indicator */
```

---

## Phase 12B Implementation Tasks

### Task 1: Instrument Selector Component

**File:** `packages/playground/src/ui/InstrumentSelector.ts`

**Purpose:** Allow users to browse and select instruments for individual pads.

**Features:**
- Modal interface with instrument browser
- Category filtering (Piano, Strings, Brass, Reed, etc.)
- Search/filter by instrument name
- Preview button to hear instrument sound
- Apply selected instrument to current pad
- Show current instrument selection

**API:**
```typescript
export class InstrumentSelector {
  private modal: HTMLDivElement | null = null;
  private sampleManager: SampleLibraryManager;
  private currentPadId: string | null = null;
  private onInstrumentSelected: (padId: string, instrument: string) => void;
  private audioContext: AudioContext;

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

  /**
   * Show selector for a specific pad.
   */
  show(padId: string, currentInstrument?: string): void {
    this.currentPadId = padId;
    // Show modal
    // Highlight current instrument if provided
  }

  /**
   * Hide the selector.
   */
  hide(): void {
    this.modal?.classList.remove('active');
    this.currentPadId = null;
  }

  /**
   * Preview an instrument by playing a test note.
   */
  private async previewInstrument(instrumentName: string): Promise<void> {
    // Load instrument if not already loaded
    // Play C4 for 0.5 seconds
    // Show loading state during load
  }

  /**
   * Filter instruments by category or search term.
   */
  private filterInstruments(category?: string, searchTerm?: string): void {
    // Update displayed instruments
  }

  /**
   * Apply selected instrument to current pad.
   */
  private applyInstrument(instrumentName: string): void {
    if (!this.currentPadId) return;
    this.onInstrumentSelected(this.currentPadId, instrumentName);
    this.hide();
  }
}
```

**UI Structure:**
```
┌─────────────────────────────────────────────────┐
│ Select Instrument for Pad: Bass Groove     [×] │
├─────────────────────────────────────────────────┤
│ Current: Synth Bass                             │
│                                                 │
│ [🔍 Search...]                                  │
│                                                 │
│ Categories: [All] [Piano] [Strings] [Brass]... │
│                                                 │
│ ┌─────────────────────────────────────────────┐ │
│ │ □ Acoustic Grand Piano        [Preview] [✓]│ │
│ │ □ Bright Acoustic Piano       [Preview]    │ │
│ │ □ Electric Grand Piano        [Preview]    │ │
│ │ ...                                         │ │
│ └─────────────────────────────────────────────┘ │
│                                                 │
│ Library: [MusyngKite ▼]        [Apply] [Cancel]│
└─────────────────────────────────────────────────┘
```

**Categories to Implement:**
- All (default)
- Piano (0-7)
- Chromatic Percussion (8-15)
- Organ (16-23)
- Guitar (24-31)
- Bass (32-39)
- Strings (40-47)
- Ensemble (48-55)
- Brass (56-63)
- Reed (64-71)
- Pipe (72-79)
- Synth Lead (80-87)
- Synth Pad (88-95)
- Synth Effects (96-103)
- Ethnic (104-111)
- Percussive (112-119)
- Sound Effects (120-127)

**Implementation Notes:**
- Use `GMInstrument` enum for instrument names (from `@contour/tone-adapter`)
- Use `SoundfontLibrary` enum for library selection
- Preview using `sampleManager.getInstrumentByQualifiedName()`
- Debounce search input (300ms)
- Show loading spinner during preview
- Highlight currently selected instrument
- Keyboard navigation (arrow keys, enter to select)

---

### Task 2: Sample Library Panel Component

**File:** `packages/playground/src/ui/SampleLibraryPanel.ts`

**Purpose:** Display loaded libraries, instruments, and memory usage.

**Features:**
- Show all loaded libraries and their state
- List loaded instruments per library
- Display memory usage estimate
- Show loading progress
- Provide library management (preload, unload)

**API:**
```typescript
export class SampleLibraryPanel {
  private container: HTMLDivElement | null = null;
  private sampleManager: SampleLibraryManager;
  private updateInterval: number | null = null;

  constructor(sampleManager: SampleLibraryManager) {
    this.sampleManager = sampleManager;
    this.initialize();
  }

  show(): void {
    this.container?.classList.add('active');
    this.startAutoUpdate();
  }

  hide(): void {
    this.container?.classList.remove('active');
    this.stopAutoUpdate();
  }

  /**
   * Update display with current library state.
   */
  private update(): void {
    // Get loaded instruments from sampleManager
    // Calculate estimated memory usage
    // Update UI
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
}
```

**UI Structure:**
```
┌─────────────────────────────────────────────────┐
│ Sample Libraries                            [×] │
├─────────────────────────────────────────────────┤
│ Status: 3 instruments loaded                    │
│ Memory: ~15 MB                                  │
│                                                 │
│ MusyngKite Library                              │
│ ├─ acoustic_grand_piano          [loaded] 5 MB │
│ ├─ electric_bass_finger          [loaded] 4 MB │
│ └─ violin                         [loaded] 6 MB │
│                                                 │
│ FluidR3_GM Library                              │
│ └─ (no instruments loaded)                      │
│                                                 │
│ [Preload Common Instruments]     [Clear Cache] │
└─────────────────────────────────────────────────┘
```

**Memory Estimation:**
- Assume ~5-10 MB per instrument
- Show total across all loaded instruments
- Update in real-time as instruments load/unload

---

### Task 3: Loading Indicators & Progress

**Files to Modify:**
- `packages/playground/src/performance.ts`
- `packages/playground/playground.html` (add CSS)

**Features:**
- Replace text-only loading with visual progress bar
- Show loading spinner on individual pads during load
- Display progress: "Loading: 3/16 instruments (18%)"
- Error handling with retry option
- Success/error notifications

**Progress Bar Component:**
```typescript
class LoadingProgress {
  private container: HTMLDivElement;
  private progressBar: HTMLDivElement;
  private statusText: HTMLSpanElement;

  show(message: string): void {
    this.statusText.textContent = message;
    this.container.classList.add('active');
  }

  updateProgress(loaded: number, total: number): void {
    const percent = (loaded / total) * 100;
    this.progressBar.style.width = `${percent}%`;
    this.statusText.textContent =
      `Loading: ${loaded}/${total} instruments (${percent.toFixed(0)}%)`;
  }

  hide(): void {
    this.container.classList.remove('active');
  }

  showError(message: string): void {
    this.container.classList.add('error');
    this.statusText.textContent = `Error: ${message}`;
  }
}
```

**Per-Pad Loading State:**
```typescript
function setPadLoadingState(padId: string, loading: boolean): void {
  const pad = document.querySelector(`[data-pad-id="${padId}"]`);
  if (!pad) return;

  if (loading) {
    pad.classList.add('loading');
    // Add spinner overlay
  } else {
    pad.classList.remove('loading');
    // Remove spinner overlay
  }
}
```

**CSS for Loading States:**
```css
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(10, 10, 11, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.progress-container {
  width: 400px;
  padding: 2rem;
  background: var(--bg-panel);
  border: 1px solid var(--neon-cyan);
  box-shadow: 0 0 20px rgba(0, 255, 245, 0.3);
}

.progress-bar-outer {
  width: 100%;
  height: 8px;
  background: var(--bg-surface);
  border-radius: 4px;
  overflow: hidden;
  margin: 1rem 0;
}

.progress-bar-inner {
  height: 100%;
  background: var(--neon-cyan);
  transition: width 0.3s ease;
  box-shadow: 0 0 10px var(--neon-cyan);
}

.pad.loading::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 20px;
  height: 20px;
  border: 2px solid var(--neon-cyan);
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: translate(-50%, -50%) rotate(360deg); }
}
```

---

### Task 4: Keyboard Shortcuts Integration

**File to Modify:** `packages/playground/src/ui/KeyboardShortcuts.ts`

**New Shortcuts to Add:**

```typescript
// Add to shortcuts array:
{
  key: 'I',
  description: 'Select instrument for pad',
  category: 'Pattern Grid',
  action: () => {
    // Open instrument selector for focused/hovered pad
    if (state.focusedPadId) {
      state.instrumentSelector?.show(state.focusedPadId);
    }
  }
},
{
  key: 'L',
  description: 'Toggle sample library panel',
  category: 'Debug Tools',
  action: () => {
    state.sampleLibraryPanel?.toggle();
  }
},
{
  key: 'Shift+S',
  description: 'Toggle samples/synths',
  category: 'Pattern Grid',
  action: () => {
    toggleSamples();
  }
}
```

**Integration in performance.ts:**
```typescript
// Track focused pad for keyboard shortcuts
let state = {
  // ... existing state
  focusedPadId: null as string | null,
  instrumentSelector: null as InstrumentSelector | null,
  sampleLibraryPanel: null as SampleLibraryPanel | null,
};

// Update on pad hover/click
function handlePadFocus(padId: string): void {
  state.focusedPadId = padId;
  // Visual indication of focus
}
```

---

### Task 5: Visual Indicators

**Files to Modify:**
- `packages/playground/playground.html` (CSS)
- `packages/playground/src/performance.ts` (add badge logic)

**Features:**
- Badge on pads showing synth vs sample
- Different colors for synth (cyan) vs sample (magenta)
- Instrument name tooltip on hover
- Active state animation

**Badge Implementation:**
```typescript
function updatePadBadge(padId: string, instrument: string): void {
  const pad = document.querySelector(`[data-pad-id="${padId}"]`);
  if (!pad) return;

  // Remove existing badge
  const existingBadge = pad.querySelector('.pad-badge');
  existingBadge?.remove();

  // Create new badge
  const badge = document.createElement('div');
  badge.className = 'pad-badge';

  const isSampled = instrument.includes(':');
  badge.classList.add(isSampled ? 'badge-sample' : 'badge-synth');

  // Extract display name
  const displayName = isSampled
    ? instrument.split(':')[1].replace(/_/g, ' ')
    : 'Synth';

  badge.textContent = displayName;
  badge.title = instrument; // Full name in tooltip

  pad.appendChild(badge);
}
```

**CSS for Badges:**
```css
.pad {
  position: relative;
  /* ... existing styles */
}

.pad-badge {
  position: absolute;
  bottom: 4px;
  right: 4px;
  font-size: 9px;
  padding: 2px 6px;
  border-radius: 2px;
  text-transform: uppercase;
  letter-spacing: 1px;
  pointer-events: none;
  max-width: calc(100% - 8px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.badge-synth {
  background: rgba(0, 255, 245, 0.2);
  color: var(--neon-cyan);
  border: 1px solid var(--neon-cyan);
}

.badge-sample {
  background: rgba(255, 0, 255, 0.2);
  color: var(--neon-magenta);
  border: 1px solid var(--neon-magenta);
}

.pad.active .pad-badge {
  animation: badge-pulse 2s ease-in-out infinite;
}

@keyframes badge-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}
```

---

## Implementation Plan

### Step 1: Create InstrumentSelector Component (Day 1)
1. Create `ui/InstrumentSelector.ts`
2. Implement modal structure
3. Add category filtering
4. Implement search functionality
5. Add preview functionality
6. Connect to SampleLibraryManager
7. Add keyboard navigation
8. Test instrument selection flow

### Step 2: Create SampleLibraryPanel Component (Day 1)
1. Create `ui/SampleLibraryPanel.ts`
2. Implement panel structure
3. Display loaded libraries
4. Show memory usage estimates
5. Add auto-update logic
6. Test panel display

### Step 3: Add Loading Indicators (Day 2)
1. Create LoadingProgress component
2. Update toggleSamples() with visual progress
3. Add per-pad loading spinners
4. Implement error handling
5. Add success/error notifications
6. Test loading states

### Step 4: Integrate Keyboard Shortcuts (Day 2)
1. Update KeyboardShortcuts component
2. Add new shortcuts (I, L, Shift+S)
3. Track focused pad state
4. Test all keyboard shortcuts
5. Update help overlay

### Step 5: Add Visual Indicators (Day 2)
1. Implement badge system
2. Add CSS for badges
3. Update badge on instrument change
4. Add tooltips
5. Test visual states

### Step 6: Integration & Polish (Day 3)
1. Initialize all components in performance.ts
2. Wire up all event handlers
3. Test complete flow
4. Add error recovery
5. Performance optimization
6. Browser compatibility testing
7. Update documentation

---

## Testing Checklist

### Functionality Tests
- [ ] Toggle samples button loads instruments progressively
- [ ] Loading progress bar shows accurate progress
- [ ] Instrument selector opens with `I` key
- [ ] Can browse instruments by category
- [ ] Search/filter works correctly
- [ ] Preview button plays instrument sound
- [ ] Applying instrument updates pad immediately
- [ ] Badge shows correct instrument type (synth/sample)
- [ ] Tooltip shows full instrument name
- [ ] Sample library panel shows loaded state
- [ ] Memory usage estimate is reasonable
- [ ] All keyboard shortcuts work as documented
- [ ] Modals close with Escape key
- [ ] Background click closes modals

### Error Handling Tests
- [ ] Network error during load shows error message
- [ ] Retry option works after error
- [ ] Invalid instrument name handled gracefully
- [ ] Missing AudioContext handled
- [ ] Concurrent loads don't conflict

### Performance Tests
- [ ] Loading 16 instruments completes in <10 seconds
- [ ] UI remains responsive during loading
- [ ] No memory leaks after repeated loads
- [ ] Smooth animations (60fps)
- [ ] Preview doesn't block UI

### Cross-Browser Tests
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Visual Regression Tests
- [ ] Design system colors consistent
- [ ] Typography matches existing components
- [ ] Spacing and alignment correct
- [ ] Animations smooth and consistent
- [ ] Mobile responsive (if applicable)

---

## Success Criteria

### User Experience
1. ✅ Users can see which pads use samples vs synths (visual badges)
2. ✅ Users can change instrument for any pad via UI (not just code)
3. ✅ Users can browse all 128 GM instruments with search
4. ✅ Loading state is visible with progress indication
5. ✅ Memory usage is transparent (show MB loaded)
6. ✅ Keyboard shortcuts work efficiently
7. ✅ UI follows existing brutalist design system
8. ✅ No breaking changes to existing functionality

### Technical Requirements
1. ✅ All components follow existing patterns
2. ✅ Code is type-safe (no `any` types)
3. ✅ Proper error handling throughout
4. ✅ Memory management (dispose methods)
5. ✅ Performance optimized (debouncing, caching)
6. ✅ Accessibility basics (keyboard nav, ARIA)
7. ✅ Cross-browser compatible

---

## File Structure Reference

```
packages/playground/
├── src/
│   ├── main.ts                          # Main entry point
│   ├── performance.ts                   # Performance grid (MODIFY)
│   └── ui/
│       ├── DebugPanel.ts               # Existing - reference pattern
│       ├── PatternPlayground.ts        # Existing - reference pattern
│       ├── KeyboardShortcuts.ts        # Existing - MODIFY
│       ├── PerformanceMonitor.ts       # Existing - reference pattern
│       ├── InstrumentSelector.ts       # NEW - Task 1
│       ├── SampleLibraryPanel.ts       # NEW - Task 2
│       └── index.ts                    # Export all components
├── index.html                           # Simple demo page
└── playground.html                     # Performance grid page (MODIFY CSS)
```

---

## Code Examples

### Example: Initializing Components in performance.ts

```typescript
// Add to imports
import { InstrumentSelector } from './ui/InstrumentSelector.js';
import { SampleLibraryPanel } from './ui/SampleLibraryPanel.js';

// Add to state
interface PerformanceState {
  // ... existing
  instrumentSelector: InstrumentSelector | null;
  sampleLibraryPanel: SampleLibraryPanel | null;
  focusedPadId: string | null;
}

// Initialize in init()
async function init() {
  // ... existing initialization

  // Initialize sample library manager
  state.sampleLibraryManager = new SampleLibraryManager();
  await state.sampleLibraryManager.initialize(audioContext);

  // Initialize UI components
  state.instrumentSelector = new InstrumentSelector(
    state.sampleLibraryManager,
    audioContext,
    (padId, instrument) => {
      updatePadInstrument(padId, instrument);
    }
  );

  state.sampleLibraryPanel = new SampleLibraryPanel(
    state.sampleLibraryManager
  );

  // Add keyboard shortcuts
  document.addEventListener('keydown', handleKeyboardShortcuts);
}

function updatePadInstrument(padId: string, instrument: string): void {
  // Update pad data
  const padData = state.pads.get(padId);
  if (!padData) return;

  padData.instrument = instrument;

  // Update badge
  updatePadBadge(padId, instrument);

  // Reschedule if playing
  if (padData.isActive) {
    reschedulePattern(padId);
  }
}

function handleKeyboardShortcuts(e: KeyboardEvent) {
  // I key - instrument selector
  if (e.key === 'i' || e.key === 'I') {
    if (state.focusedPadId) {
      const padData = state.pads.get(state.focusedPadId);
      state.instrumentSelector?.show(
        state.focusedPadId,
        padData?.instrument
      );
    }
    return;
  }

  // L key - library panel
  if (e.key === 'l' || e.key === 'L') {
    state.sampleLibraryPanel?.toggle();
    return;
  }

  // Shift+S - toggle samples
  if (e.shiftKey && (e.key === 's' || e.key === 'S')) {
    toggleSamples();
    return;
  }
}
```

### Example: Preview Instrument

```typescript
async function previewInstrument(instrumentName: string): Promise<void> {
  try {
    // Show loading state
    const previewBtn = document.querySelector(`[data-instrument="${instrumentName}"] .preview-btn`);
    previewBtn?.classList.add('loading');

    // Load instrument
    const qualifiedName = createQualifiedName(
      SoundfontLibrary.MusyngKite,
      instrumentName as any
    );
    const sfInstrument = await sampleManager.getInstrumentByQualifiedName(qualifiedName);

    // Create temporary sampler
    const sampler = new MusicalSampler(sfInstrument);
    sampler.toDestination();

    // Play preview note (C4 for 0.5 seconds)
    sampler.triggerAttackRelease('C4', 0.5, undefined, 0.8);

    // Clean up after preview
    setTimeout(() => {
      sampler.dispose();
      previewBtn?.classList.remove('loading');
    }, 600);

  } catch (error) {
    console.error('Preview failed:', error);
    // Show error state
  }
}
```

---

## Resources

### Documentation
- **Sample Library Usage Guide:** `docs/SAMPLE_LIBRARY_USAGE_GUIDE.md`
- **Type Definitions:** `packages/tone-adapter/src/samples/types.ts`
- **Prototype Findings:** `docs/SAMPLE_LIBRARY_PROTOTYPE_FINDINGS.md`
- **Architecture Spec:** `docs/SAMPLE_LIBRARY_SPEC.md`

### Existing Code References
- **Performance Grid:** `packages/playground/src/performance.ts`
- **UI Components:** `packages/playground/src/ui/`
- **Sample Manager:** `packages/tone-adapter/src/samples/SampleLibraryManager.ts`
- **Musical Sampler:** `packages/tone-adapter/src/wrappers/MusicalSampler.ts`

### Design System
- **Colors & Styles:** `packages/playground/playground.html` (CSS variables)
- **Component Patterns:** All files in `packages/playground/src/ui/`

---

## Questions & Answers

**Q: Can I use a different UI framework (React, Vue, etc.)?**
A: No. The playground uses vanilla TypeScript/JavaScript. Keep it consistent with existing components.

**Q: Should I add unit tests?**
A: The playground doesn't currently have unit tests. Focus on manual testing and browser compatibility.

**Q: What about mobile support?**
A: Desktop-first is fine. The playground is primarily for desktop development.

**Q: Can I refactor the existing performance.ts structure?**
A: Minimal refactoring is okay, but don't break existing functionality. The current structure works.

**Q: Should I optimize for bundle size?**
A: Not a priority. Development experience > bundle size for the playground.

**Q: What if soundfont-player is slow to load?**
A: That's expected. Show loading progress and keep UI responsive. Users understand network delays.

---

## Next Steps After Phase 12B

### Phase 12C (Future)
- Preloading strategies (load common instruments on page load)
- Caching strategies (persist loaded instruments)
- Advanced features (velocity layers, articulations)
- Custom sample pack support (user uploads)

### Phase 12D (Future)
- .sf2 parser for offline use (vs CDN)
- Local file loading
- Sample library builder tool

---

## Contact & Support

**Phase 12A Implementation:**
- PR #28: https://github.com/esoltys/contour-2.0/pull/28
- Branch: `claude/phase-1-sample-library-integration-019uitbvre1DphgKeVToCAkp`

**Questions?**
- Review existing UI components in `packages/playground/src/ui/`
- Check `docs/SAMPLE_LIBRARY_USAGE_GUIDE.md` for API reference
- Look at `performance.ts` lines 243-329 for existing sample integration

---

**Good luck with the implementation! 🎹**
