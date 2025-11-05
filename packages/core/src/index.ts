// Contour Core Package
// Main entry point for musical primitives, patterns, and composition

// Types
export * from './types/brands';
export * from './types/music';

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
