/**
 * Centralized constants for the Contour Playground.
 *
 * This file extracts magic numbers into named, self-documenting constants.
 * Group related constants together for better organization.
 */

// =============================================================================
// Audio & Timing
// =============================================================================

/** Default tempo in BPM for the performance grid */
export const DEFAULT_BPM = 120;

/** Duration (seconds) for instrument preview playback */
export const PREVIEW_NOTE_DURATION = 0.5;

/** Velocity for instrument preview notes (0-1) */
export const PREVIEW_NOTE_VELOCITY = 0.8;

// =============================================================================
// Performance Monitor
// =============================================================================

/** Number of seconds of history to maintain in performance graphs */
export const PERFORMANCE_HISTORY_LENGTH = 60;

/** Warning threshold ratio (70% of target) */
export const PERFORMANCE_WARNING_THRESHOLD = 0.7;

/** Danger/critical threshold ratio (90% of target) */
export const PERFORMANCE_DANGER_THRESHOLD = 0.9;

/** Canvas dimensions for performance graphs */
export const PERFORMANCE_CANVAS_WIDTH = 600;
export const PERFORMANCE_CANVAS_HEIGHT = 200;

/** Interval (ms) between performance metric updates */
export const PERFORMANCE_UPDATE_INTERVAL_MS = 1000;

/** Target FPS for good performance */
export const TARGET_FPS = 60;

/** FPS threshold for warnings (90% of target) */
export const FPS_WARNING_THRESHOLD = 54;

/** CPU usage percentage threshold for warnings */
export const CPU_WARNING_THRESHOLD_PERCENT = 70;

/** Audio node count threshold for warnings */
export const AUDIO_NODE_WARNING_THRESHOLD = 100;

// =============================================================================
// UI Debounce & Delays
// =============================================================================

/** Debounce delay (ms) for search input */
export const SEARCH_DEBOUNCE_MS = 300;

/** Cleanup timeout (ms) after preview sample finishes */
export const PREVIEW_CLEANUP_DELAY_MS = 600;

/** Timeout (ms) to reset error message back to normal state */
export const ERROR_RESET_TIMEOUT_MS = 2000;

/** Default auto-hide delay (ms) for success notifications */
export const SUCCESS_AUTO_HIDE_MS = 2000;

// =============================================================================
// Demo Sequence
// =============================================================================

/** Demo jam sequence configuration */
export const DEMO_SEQUENCE = [
  { padIndex: 0, delay: 500, name: 'Kick' },
  { padIndex: 2, delay: 2000, name: 'Hat' },
  { padIndex: 4, delay: 4000, name: 'Bass' },
  { padIndex: 8, delay: 6000, name: 'Arp' },
  { padIndex: 1, delay: 8000, name: 'Snare' },
  { padIndex: 9, delay: 10000, name: 'Melody' },
] as const;

/** Additional delay (ms) after demo completes before re-enabling button */
export const DEMO_COMPLETION_BUFFER_MS = 1000;

// =============================================================================
// Pattern Inspector
// =============================================================================

/** Canvas dimensions for pattern timeline visualization */
export const PATTERN_CANVAS_WIDTH = 600;
export const PATTERN_CANVAS_HEIGHT = 200;

// =============================================================================
// UI Display
// =============================================================================

/** Maximum character length for instrument name badges */
export const BADGE_NAME_MAX_LENGTH = 12;
