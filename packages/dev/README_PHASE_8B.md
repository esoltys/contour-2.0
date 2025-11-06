# Phase 8B: Interactive Development UI

This document describes the interactive developer tools added in Phase 8B.

## Overview

Phase 8B adds comprehensive debugging and development tools to the Contour Live Performance Interface. These tools help developers understand what's happening in their compositions, monitor performance, and debug issues.

## Features

### 1. Debug Panel (Cmd/Ctrl + D)

A collapsible panel with multiple tabs for inspecting different aspects of the system:

#### Transport Inspector Tab
- **Real-time Transport State**: Shows current state (playing/stopped), BPM, position, and elapsed time
- **Scheduled Events Table**: Lists all events scheduled in Tone.Transport (when Phase 8A diagnostics are available)
- **Next Events Highlighting**: Highlights the next 5 events to fire
- **Clear All Button**: Clears all scheduled events for debugging
- **Auto-refresh**: Updates every 100ms when playing

#### Pattern Inspector Tab
- **Pattern Selector**: Dropdown to select any active pattern from the performance grid
- **Pattern Details**: Shows detailed information about the selected pattern
- **Visual Timeline**: Canvas-based visualization of pattern events with:
  - Note pitches shown on vertical axis
  - Time shown on horizontal axis
  - Color-coded notes based on pitch
  - Velocity indicated by circle size
- **Statistics**: Shows event count, duration, note range, and average velocity
- **Export Button**: Copy ASCII visualization to clipboard

#### Performance Monitor Tab
- **Real-time Metrics**:
  - FPS (target: 60)
  - Audio Node count
  - Active voices
  - CPU usage estimate
  - Memory usage (when available)
- **Color-coded Status**: Green/yellow/red based on thresholds
- **60-second History Graphs**: Visual graphs showing FPS and CPU over time
- **Performance Warnings**: Alerts when metrics exceed thresholds

#### Console Log Tab
- **Intercepted Console Logs**: Captures all console.log/warn/error calls
- **Filtering**:
  - By level (info/warn/error/debug)
  - By search text
- **Color-coded Levels**: Visual distinction between log types
- **Auto-scroll**: Optional auto-scrolling to latest logs
- **Copy & Clear**: Buttons to copy logs or clear the console
- **Categorization**: Logs from Contour are automatically categorized

### 2. Pattern Playground (Cmd/Ctrl + K)

A modal for experimenting with pattern code:

- **Monaco Editor**: Full TypeScript editor with syntax highlighting
- **Live Preview**: Run pattern code and see results immediately
- **Error Display**: Shows compilation errors with helpful messages
- **Pattern Inspection**: Displays pattern details after successful compilation
- **Add to Grid**: (Coming soon) Add created patterns to the performance grid
- **Keyboard Shortcut**: Cmd/Ctrl + Enter to run pattern code

### 3. Keyboard Shortcuts Overlay (?)

Press `?` to show a help modal listing all keyboard commands:

#### Transport
- `Space`: Play/Pause
- `Esc`: Stop All

#### Pattern Grid
- `1-4, Q-R, A-F, Z-V`: Trigger pads
- `Shift + Pad Key`: Edit pattern

#### Debug Tools
- `Cmd/Ctrl + D`: Toggle debug panel
- `Cmd/Ctrl + K`: Open pattern playground
- `?`: Show keyboard shortcuts

#### Editor
- `Cmd/Ctrl + Enter`: Run/Apply code
- `Esc`: Close modal

### 4. Position Toggle

The Debug Panel can be docked at:
- **Bottom**: Full-width panel at bottom of screen (default)
- **Right**: Vertical panel on right side of screen

Use the position toggle button (⇄/⇅) in the panel header to switch.

### 5. Persistent Settings

All debug panel settings are saved to localStorage:
- Visibility state
- Panel position (bottom/right)
- Active tab
- Auto-scroll preference in console

## Architecture

### Component Structure

```
packages/dev/src/ui/
├── DebugPanel.ts          # Main container
├── TransportInspector.ts  # Transport tab
├── PatternInspector.ts    # Pattern visualization tab
├── PerformanceMonitor.ts  # Performance metrics tab
├── ConsoleLog.ts          # Console logs tab
├── PatternPlayground.ts   # Pattern testing modal
├── KeyboardShortcuts.ts   # Help overlay
└── debug-panel.css        # Styles for all components
```

### Integration Points

The debug UI is integrated into `performance.ts`:

```typescript
// Initialize debug components
state.debugPanel = new DebugPanel({
  initialTab: 'transport',
  position: 'bottom',
  visible: false
});

state.patternPlayground = new PatternPlayground({
  onAddToGrid: (code, pattern) => {
    // Handle adding pattern to grid
  }
});

state.keyboardShortcuts = new KeyboardShortcuts();
```

### Phase 8A Integration (Complete)

Phase 8A has been integrated with the debug UI:

- **Transport Inspector**: Now shows actual scheduled events from `TransportDebugger.getScheduledEvents()`
  - Displays pending and total event counts
  - Highlights next 5 events to fire
  - Shows event time, state, and callback name

- **Pattern Inspector**: Uses `Pattern.inspect()` method for detailed analysis
  - Shows event counts (notes, rests, chords, total)
  - Displays note range with lowest/highest notes
  - Analyzes timing (gaps, overlaps, average spacing)
  - Shows velocity statistics (min, max, average)
  - Visual timeline with color-coded notes

- **Performance Monitor**: Uses `TransportDebugger` for accurate metrics
  - Audio node count from `getActiveNodeCount()`
  - Active voices estimated from pending events

- **Console Log**: Parses structured logs from the `Logger` system
  - Detects format: `[timestamp] [contour:category] [LEVEL] message`
  - Preserves category and level from structured logs
  - Falls back to extracting category from regular logs

## Usage Examples

### Debugging Transport Issues

1. Press `Cmd+D` to open debug panel
2. Check the Transport tab
3. Verify BPM, position, and scheduled events
4. Use "Clear All" if events are stuck

### Analyzing Pattern Timing

1. Start playing a composition
2. Press `Cmd+D` and switch to Pattern tab
3. Select a pattern from the dropdown
4. View the visual timeline and statistics
5. Verify note timing and velocities are correct

### Monitoring Performance

1. Press `Cmd+D` and switch to Performance tab
2. Watch FPS and CPU metrics while playing
3. Check for warnings if performance degrades
4. Use the 60-second history graph to identify patterns

### Testing New Patterns

1. Press `Cmd+K` to open playground
2. Write pattern code in the editor
3. Press `Cmd+Enter` to compile and test
4. View pattern details in the results pane
5. Click "Add to Grid" when satisfied (coming soon)

### Viewing Console Logs

1. Press `Cmd+D` and switch to Console tab
2. Filter by level or search text
3. Copy logs for bug reports
4. Clear logs to start fresh

## Mobile Support

All debug UI components are responsive:

- **Bottom position**: Automatically used on mobile (50vh height)
- **Collapsible sections**: Minimize when not in use
- **Touch-friendly**: Large tap targets for buttons
- **Keyboard shortcuts**: Still available on external keyboards

## Performance Impact

The debug UI is designed to be non-blocking:

- **Lazy initialization**: Components only created when first used
- **Conditional updates**: Metrics only update when panel is visible
- **Efficient rendering**: Canvas-based visualizations for performance
- **Debounced updates**: 100ms refresh rate for real-time data

When the debug panel is hidden, updates are paused to minimize overhead.

## Future Enhancements

### Planned Features
- **Composition Timeline View**: Visual timeline of all tracks
- **MIDI Monitor**: Real-time MIDI event display
- **Audio Analyzer**: Spectrum and waveform analysis
- **Recording**: Capture and export debugging sessions
- **Remote Debugging**: Debug sessions over network

### Phase 8A Integration
- **Structured Logging**: Categorized logs with stack traces
- **Pattern Inspection API**: Deep pattern analysis
- **Transport Diagnostics**: Detailed event scheduling info
- **Performance Profiling**: CPU and memory profiling

## Troubleshooting

### Debug Panel Won't Open
- Check browser console for errors
- Verify `Cmd+D` / `Ctrl+D` is not captured by browser
- Try clicking a pad to ensure audio is initialized

### Monaco Editor Not Loading
- Check network tab for failed requests
- Verify `@monaco-editor/loader` is installed
- Check browser console for initialization errors

### Performance Metrics Not Updating
- Ensure debug panel is visible
- Check if browser supports Performance API
- Try refreshing the page

### CSS Styles Not Applied
- Verify `debug-panel.css` is imported in `performance.ts`
- Check build output includes CSS bundle
- Clear browser cache and reload

## Contributing

When adding new debug features:

1. **Create component**: Add new `.ts` file in `packages/dev/src/ui/`
2. **Add styles**: Update `debug-panel.css` with component styles
3. **Integrate**: Wire component into `DebugPanel.ts` or standalone
4. **Document**: Update this README with usage examples
5. **Test**: Verify on desktop and mobile, with and without Phase 8A

## License

Part of the Contour project. See main LICENSE file.
