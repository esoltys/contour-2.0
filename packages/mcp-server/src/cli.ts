#!/usr/bin/env node
/**
 * Contour MCP Server CLI
 *
 * Run MCP servers for Contour music composition system.
 *
 * Usage:
 *   contour-mcp music-theory    # Run music theory server
 *   contour-mcp pattern         # Run pattern visualization server
 *   contour-mcp --help          # Show help
 */

import { runMusicTheoryServer } from './servers/music-theory.js';
import { runPatternVisualizationServer } from './servers/pattern-visualization.js';

const HELP = `
Contour MCP Servers

Usage:
  contour-mcp <server>

Servers:
  music-theory    Music theory tools (scales, chords, progressions, intervals)
  pattern         Pattern visualization and transformation tools

Examples:
  contour-mcp music-theory
  contour-mcp pattern

For Claude Code integration, add to your settings:
  {
    "mcpServers": {
      "contour-theory": {
        "command": "npx",
        "args": ["contour-mcp", "music-theory"]
      },
      "contour-pattern": {
        "command": "npx",
        "args": ["contour-mcp", "pattern"]
      }
    }
  }
`;

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(HELP);
    process.exit(0);
  }

  const server = args[0];

  switch (server) {
    case 'music-theory':
    case 'theory':
      await runMusicTheoryServer();
      break;

    case 'pattern':
    case 'pattern-visualization':
    case 'viz':
      await runPatternVisualizationServer();
      break;

    default:
      console.error(`Unknown server: ${server}`);
      console.error('Use --help for available servers');
      process.exit(1);
  }
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
