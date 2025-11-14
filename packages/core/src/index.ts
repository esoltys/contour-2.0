// Contour Core Package
// Main entry point for musical primitives, patterns, and composition

// Types
export * from './types/brands';
export * from './types/music';
export * from './types/theory';

// Primitives
export * from './primitives/Note';
export * from './primitives/Event';

// Patterns (Phase 2)
export * from './patterns/Pattern';
export * from './patterns/PatternBuilder';

// Mini-Notation (Phase 6)
export * from './patterns/MiniNotation';

// Composition (Phase 4)
export * from './composition/Voice';
export * from './composition/Track';
export * from './composition/Composition';

// Plugins (Phase 5)
export * from './plugins/RendererPlugin';

// Debugging & Diagnostics (Phase 8A)
export * from './debug/Logger';
export * from './debug/PatternInspector';
export * from './debug/Validator';
export * from './errors/MusicalError';

// Music Theory (Phase 7)
export * from './theory';
