/**
 * Pattern Visualization MCP Server
 *
 * Provides tools for visualizing, analyzing, and transforming musical patterns.
 * Wraps @contour/core pattern and debug modules for MCP access.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';

import {
  Pattern,
  PatternBuilder,
  PatternInspector,
  parseMiniNotation,
  Note,
  Scale,
  Duration,
} from '@contour/core';
import type { NoteName } from '@contour/core';
import type { ScaleName } from '@contour/core';
import type { Event, NoteEvent } from '@contour/core';

/**
 * Tool definitions for the Pattern Visualization server.
 */
const TOOLS: Tool[] = [
  {
    name: 'parse_mini_notation',
    description: 'Parse Contour mini-notation string into a pattern and visualize it. ' +
      'Syntax: "C4 E4 G4" for notes, "C4*2" for repetition, "[C4 E4]" for grouping, ' +
      '"Cmaj7" for chords, "~" for rest.',
    inputSchema: {
      type: 'object',
      properties: {
        notation: {
          type: 'string',
          description: 'Mini-notation string (e.g., "C4 E4 G4*2 [F4 A4]")',
        },
        visualize: {
          type: 'boolean',
          description: 'Include ASCII visualization (default: true)',
          default: true,
        },
      },
      required: ['notation'],
    },
  },
  {
    name: 'visualize_pattern',
    description: 'Generate ASCII visualization of a pattern from notes.',
    inputSchema: {
      type: 'object',
      properties: {
        notes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of note names with octaves (e.g., ["C4", "E4", "G4"])',
        },
        durations: {
          type: 'array',
          items: { type: 'number' },
          description: 'Optional durations for each note (in beats). Defaults to 0.25 each.',
        },
        width: {
          type: 'number',
          description: 'Width of ASCII visualization (default: 40)',
          default: 40,
        },
        showVelocity: {
          type: 'boolean',
          description: 'Show velocity variations in visualization',
          default: false,
        },
      },
      required: ['notes'],
    },
  },
  {
    name: 'inspect_pattern',
    description: 'Get detailed metrics and analysis of a pattern.',
    inputSchema: {
      type: 'object',
      properties: {
        notes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of note names with octaves',
        },
        durations: {
          type: 'array',
          items: { type: 'number' },
          description: 'Optional durations for each note',
        },
      },
      required: ['notes'],
    },
  },
  {
    name: 'transform_pattern',
    description: 'Apply transformations to a pattern (transpose, reverse, fast, slow).',
    inputSchema: {
      type: 'object',
      properties: {
        notes: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of note names with octaves',
        },
        transformations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                enum: ['transpose', 'retrograde', 'fast', 'slow'],
              },
              value: {
                type: 'number',
                description: 'Value for transformation (semitones for transpose, factor for fast/slow)',
              },
            },
            required: ['type'],
          },
          description: 'Array of transformations to apply in order',
        },
        visualize: {
          type: 'boolean',
          description: 'Include ASCII visualization of result',
          default: true,
        },
      },
      required: ['notes', 'transformations'],
    },
  },
  {
    name: 'create_scale_pattern',
    description: 'Create a pattern from scale degrees.',
    inputSchema: {
      type: 'object',
      properties: {
        root: {
          type: 'string',
          description: 'Root note with octave (e.g., "C4")',
        },
        scale: {
          type: 'string',
          description: 'Scale type (e.g., "major", "minor", "Dorian")',
        },
        degrees: {
          type: 'array',
          items: { type: 'number' },
          description: 'Scale degrees to include (e.g., [1, 3, 5] for arpeggio)',
        },
        visualize: {
          type: 'boolean',
          description: 'Include ASCII visualization',
          default: true,
        },
      },
      required: ['root', 'scale', 'degrees'],
    },
  },
  {
    name: 'compare_patterns',
    description: 'Compare two patterns side by side.',
    inputSchema: {
      type: 'object',
      properties: {
        pattern1: {
          type: 'object',
          properties: {
            notes: { type: 'array', items: { type: 'string' } },
            name: { type: 'string' },
          },
          required: ['notes'],
        },
        pattern2: {
          type: 'object',
          properties: {
            notes: { type: 'array', items: { type: 'string' } },
            name: { type: 'string' },
          },
          required: ['notes'],
        },
      },
      required: ['pattern1', 'pattern2'],
    },
  },
];

/**
 * Build a pattern from note names and optional durations.
 */
function buildPattern(notes: string[], durations?: number[]): Pattern {
  const builder = new PatternBuilder();
  notes.forEach((noteName, i) => {
    const note = new Note(noteName as NoteName);
    const duration = Duration(durations?.[i] ?? 0.25);
    builder.note(note, duration);
  });
  return builder.build();
}

/**
 * Handle tool calls for the Pattern Visualization server.
 */
function handleToolCall(name: string, args: Record<string, unknown>): unknown {
  switch (name) {
    case 'parse_mini_notation': {
      const notation = args.notation as string;
      const visualize = args.visualize !== false;

      try {
        const events = parseMiniNotation(notation);
        const pattern = new Pattern(events);
        const inspection = PatternInspector.inspect(pattern);

        const result: Record<string, unknown> = {
          notation,
          notes: pattern.events
            .filter((e: Event): e is NoteEvent => e.type === 'note')
            .map((e: NoteEvent) => ({
              pitch: e.pitch,
              time: e.time,
              duration: e.duration,
            })),
          metrics: {
            duration: inspection.duration,
            noteCount: inspection.eventCount.notes,
            restCount: inspection.eventCount.rests,
            chordCount: inspection.eventCount.chords,
          },
        };

        if (visualize) {
          result.visualization = PatternInspector.toASCII(pattern, { width: 40 });
        }

        return result;
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Failed to parse notation',
          notation,
          hint: 'Check syntax: notes like "C4 E4", chords like "Cmaj7", rests like "~"',
        };
      }
    }

    case 'visualize_pattern': {
      const notes = args.notes as string[];
      const durations = args.durations as number[] | undefined;
      const width = (args.width as number) ?? 40;
      const showVelocity = args.showVelocity === true;

      const pattern = buildPattern(notes, durations);
      const visualization = PatternInspector.toASCII(pattern, { width, showVelocity });

      return {
        notes,
        visualization,
        duration: pattern.duration,
      };
    }

    case 'inspect_pattern': {
      const notes = args.notes as string[];
      const durations = args.durations as number[] | undefined;

      const pattern = buildPattern(notes, durations);
      const inspection = PatternInspector.inspect(pattern);

      return {
        notes,
        metrics: {
          duration: inspection.duration,
          eventCount: inspection.eventCount,
          noteRange: {
            lowest: inspection.noteRange.lowest,
            highest: inspection.noteRange.highest,
            span: inspection.noteRange.span,
            spanDescription: `${inspection.noteRange.span} semitones`,
          },
          timing: inspection.timing,
          velocity: inspection.velocity,
        },
        analysis: {
          density: inspection.eventCount.notes / inspection.duration,
          hasOverlaps: inspection.timing.overlaps > 0,
          hasGaps: inspection.timing.gaps > 0,
        },
      };
    }

    case 'transform_pattern': {
      const notes = args.notes as string[];
      const transformations = args.transformations as Array<{ type: string; value?: number }>;
      const visualize = args.visualize !== false;

      let pattern = buildPattern(notes);
      const steps: Array<{ transformation: string; notes: string[] }> = [
        { transformation: 'original', notes },
      ];

      for (const t of transformations) {
        switch (t.type) {
          case 'transpose':
            pattern = pattern.transpose(t.value ?? 0);
            break;
          case 'retrograde':
            pattern = pattern.retrograde();
            break;
          case 'fast':
            pattern = pattern.fast(t.value ?? 2);
            break;
          case 'slow':
            pattern = pattern.slow(t.value ?? 2);
            break;
        }

        steps.push({
          transformation: t.value !== undefined ? `${t.type}(${t.value})` : t.type,
          notes: pattern.events
            .filter((e: Event): e is NoteEvent => e.type === 'note')
            .map((e: NoteEvent) => pitchToNoteName(e.pitch)),
        });
      }

      const result: Record<string, unknown> = {
        original: notes,
        transformations: transformations.map(t =>
          t.value !== undefined ? `${t.type}(${t.value})` : t.type
        ),
        result: pattern.events
          .filter((e: Event): e is NoteEvent => e.type === 'note')
          .map((e: NoteEvent) => pitchToNoteName(e.pitch)),
        steps,
      };

      if (visualize) {
        result.visualization = PatternInspector.toASCII(pattern, { width: 40 });
      }

      return result;
    }

    case 'create_scale_pattern': {
      const root = args.root as NoteName;
      const scaleName = args.scale as ScaleName;
      const degrees = args.degrees as number[];
      const visualize = args.visualize !== false;

      const scale = new Scale(root, scaleName);
      const pattern = scale.pattern(degrees) as Pattern;

      const notes = pattern.events
        .filter((e: Event): e is NoteEvent => e.type === 'note')
        .map((e: NoteEvent) => pitchToNoteName(e.pitch));

      const result: Record<string, unknown> = {
        scale: `${root.slice(0, -1)} ${scaleName}`,
        degrees,
        notes,
        duration: pattern.duration,
      };

      if (visualize) {
        result.visualization = PatternInspector.toASCII(pattern, { width: 40 });
      }

      return result;
    }

    case 'compare_patterns': {
      const p1 = args.pattern1 as { notes: string[]; name?: string };
      const p2 = args.pattern2 as { notes: string[]; name?: string };

      const pattern1 = buildPattern(p1.notes);
      const pattern2 = buildPattern(p2.notes);

      const inspection1 = PatternInspector.inspect(pattern1);
      const inspection2 = PatternInspector.inspect(pattern2);

      return {
        pattern1: {
          name: p1.name ?? 'Pattern 1',
          notes: p1.notes,
          visualization: PatternInspector.toASCII(pattern1, { width: 30 }),
          metrics: {
            duration: inspection1.duration,
            noteCount: inspection1.eventCount.notes,
            range: inspection1.noteRange.span,
          },
        },
        pattern2: {
          name: p2.name ?? 'Pattern 2',
          notes: p2.notes,
          visualization: PatternInspector.toASCII(pattern2, { width: 30 }),
          metrics: {
            duration: inspection2.duration,
            noteCount: inspection2.eventCount.notes,
            range: inspection2.noteRange.span,
          },
        },
        comparison: {
          durationDiff: inspection2.duration - inspection1.duration,
          noteCountDiff: inspection2.eventCount.notes - inspection1.eventCount.notes,
          rangeDiff: inspection2.noteRange.span - inspection1.noteRange.span,
        },
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/**
 * Convert MIDI pitch to note name.
 */
function pitchToNoteName(pitch: number): string {
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const octave = Math.floor(pitch / 12) - 1;
  const noteName = noteNames[pitch % 12];
  return `${noteName}${octave}`;
}

/**
 * Create and start the Pattern Visualization MCP server.
 */
export async function createPatternVisualizationServer(): Promise<Server> {
  const server = new Server(
    {
      name: 'contour-pattern-visualization',
      version: '2.0.0',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handle list tools request
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      const result = handleToolCall(name, args as Record<string, unknown>);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ error: message }),
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

/**
 * Run the server with stdio transport.
 */
export async function runPatternVisualizationServer(): Promise<void> {
  const server = await createPatternVisualizationServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Contour Pattern Visualization MCP server running on stdio');
}
