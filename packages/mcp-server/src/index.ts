/**
 * @contour/mcp-server
 *
 * MCP (Model Context Protocol) servers for the Contour music composition system.
 *
 * Provides two servers:
 * - music-theory: Scales, chords, progressions, intervals
 * - pattern-visualization: Pattern analysis, ASCII visualization, transformations
 *
 * @example
 * ```typescript
 * // Programmatic usage
 * import { createMusicTheoryServer, createPatternVisualizationServer } from '@contour/mcp-server';
 *
 * const theoryServer = await createMusicTheoryServer();
 * const patternServer = await createPatternVisualizationServer();
 * ```
 *
 * @example
 * ```bash
 * # CLI usage
 * npx contour-mcp music-theory
 * npx contour-mcp pattern
 * ```
 */

export {
  createMusicTheoryServer,
  runMusicTheoryServer,
} from './servers/music-theory.js';

export {
  createPatternVisualizationServer,
  runPatternVisualizationServer,
} from './servers/pattern-visualization.js';
