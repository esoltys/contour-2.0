/**
 * Music Theory MCP Server
 *
 * Provides tools for scales, chords, progressions, and intervals.
 * Wraps @contour/core theory module for MCP access.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from '@modelcontextprotocol/sdk/types.js';

import { Scale, ChordVoicing, ChordProgression, Note } from '@contour/core';
import { Duration } from '@contour/core';
import type { NoteName } from '@contour/core';
import type { ScaleName, ChordQuality, Degree } from '@contour/core';
import type { ChordChange } from '@contour/core';

// Available scale names
const SCALE_NAMES: ScaleName[] = [
  'major', 'minor', 'harmonicMinor', 'melodicMinor',
  'Ionian', 'Dorian', 'Phrygian', 'Lydian', 'Mixolydian', 'Aeolian', 'Locrian',
  'majorPentatonic', 'minorPentatonic', 'chromatic', 'wholeTone'
];

// Available chord qualities
const CHORD_QUALITIES: ChordQuality[] = [
  'maj', 'm', 'maj7', 'M7', '7', 'm7', 'min7',
  'dim', 'dim7', 'aug', 'sus2', 'sus4',
  '9', 'm9', 'maj9', '11', '13'
];

/**
 * Tool definitions for the Music Theory server.
 */
const TOOLS: Tool[] = [
  {
    name: 'get_scale',
    description: 'Get notes in a scale. Returns all notes from root to octave.',
    inputSchema: {
      type: 'object',
      properties: {
        root: {
          type: 'string',
          description: 'Root note with octave (e.g., "C4", "F#3", "Bb5")',
        },
        scale: {
          type: 'string',
          description: `Scale type: ${SCALE_NAMES.join(', ')}`,
          enum: SCALE_NAMES,
        },
      },
      required: ['root', 'scale'],
    },
  },
  {
    name: 'get_scale_degree',
    description: 'Get a specific scale degree (1=tonic, 5=dominant, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        root: {
          type: 'string',
          description: 'Root note with octave (e.g., "C4")',
        },
        scale: {
          type: 'string',
          description: 'Scale type',
          enum: SCALE_NAMES,
        },
        degree: {
          type: 'number',
          description: 'Scale degree (1-8 for diatonic scales)',
          minimum: 1,
          maximum: 13,
        },
      },
      required: ['root', 'scale', 'degree'],
    },
  },
  {
    name: 'get_chord',
    description: 'Get notes in a chord voicing.',
    inputSchema: {
      type: 'object',
      properties: {
        root: {
          type: 'string',
          description: 'Root note with octave (e.g., "C4", "G3")',
        },
        quality: {
          type: 'string',
          description: `Chord quality: ${CHORD_QUALITIES.join(', ')}`,
          enum: CHORD_QUALITIES,
        },
        inversion: {
          type: 'number',
          description: 'Inversion (0=root position, 1=first, 2=second, etc.)',
          minimum: 0,
          default: 0,
        },
      },
      required: ['root', 'quality'],
    },
  },
  {
    name: 'get_chord_inversions',
    description: 'Get all inversions of a chord.',
    inputSchema: {
      type: 'object',
      properties: {
        root: {
          type: 'string',
          description: 'Root note with octave (e.g., "C4")',
        },
        quality: {
          type: 'string',
          description: 'Chord quality',
          enum: CHORD_QUALITIES,
        },
      },
      required: ['root', 'quality'],
    },
  },
  {
    name: 'get_progression',
    description: 'Generate a chord progression from Roman numerals (I, ii, IV, V, vi, etc.)',
    inputSchema: {
      type: 'object',
      properties: {
        root: {
          type: 'string',
          description: 'Root note with octave for the key (e.g., "C4" for C major)',
        },
        scale: {
          type: 'string',
          description: 'Scale type for the key',
          enum: SCALE_NAMES,
        },
        degrees: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of Roman numerals: I, ii, iii, IV, V, vi, vii (lowercase = minor)',
        },
      },
      required: ['root', 'scale', 'degrees'],
    },
  },
  {
    name: 'transpose_note',
    description: 'Transpose a note by semitones.',
    inputSchema: {
      type: 'object',
      properties: {
        note: {
          type: 'string',
          description: 'Note to transpose (e.g., "C4", "F#3")',
        },
        semitones: {
          type: 'number',
          description: 'Number of semitones (positive = up, negative = down)',
        },
      },
      required: ['note', 'semitones'],
    },
  },
  {
    name: 'get_interval',
    description: 'Calculate the interval between two notes in semitones.',
    inputSchema: {
      type: 'object',
      properties: {
        from: {
          type: 'string',
          description: 'Starting note (e.g., "C4")',
        },
        to: {
          type: 'string',
          description: 'Target note (e.g., "G4")',
        },
      },
      required: ['from', 'to'],
    },
  },
  {
    name: 'list_scales',
    description: 'List all available scale types with their interval patterns.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'list_chords',
    description: 'List all available chord types with their interval patterns.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// Interval patterns for reference
const SCALE_INTERVALS: Record<string, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11, 12],
  minor: [0, 2, 3, 5, 7, 8, 10, 12],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11, 12],
  melodicMinor: [0, 2, 3, 5, 7, 9, 11, 12],
  Ionian: [0, 2, 4, 5, 7, 9, 11, 12],
  Dorian: [0, 2, 3, 5, 7, 9, 10, 12],
  Phrygian: [0, 1, 3, 5, 7, 8, 10, 12],
  Lydian: [0, 2, 4, 6, 7, 9, 11, 12],
  Mixolydian: [0, 2, 4, 5, 7, 9, 10, 12],
  Aeolian: [0, 2, 3, 5, 7, 8, 10, 12],
  Locrian: [0, 1, 3, 5, 6, 8, 10, 12],
  majorPentatonic: [0, 2, 4, 7, 9, 12],
  minorPentatonic: [0, 3, 5, 7, 10, 12],
  chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  wholeTone: [0, 2, 4, 6, 8, 10, 12],
};

const CHORD_INTERVALS: Record<string, number[]> = {
  maj: [0, 4, 7],
  m: [0, 3, 7],
  maj7: [0, 4, 7, 11],
  M7: [0, 4, 7, 11],
  '7': [0, 4, 7, 10],
  m7: [0, 3, 7, 10],
  min7: [0, 3, 7, 10],
  dim: [0, 3, 6],
  dim7: [0, 3, 6, 9],
  aug: [0, 4, 8],
  sus2: [0, 2, 7],
  sus4: [0, 5, 7],
  '9': [0, 4, 7, 10, 14],
  m9: [0, 3, 7, 10, 14],
  maj9: [0, 4, 7, 11, 14],
  '11': [0, 4, 7, 10, 14, 17],
  '13': [0, 4, 7, 10, 14, 17, 21],
};

// Note utilities (Note imported at top of file)

/**
 * Handle tool calls for the Music Theory server.
 */
function handleToolCall(name: string, args: Record<string, unknown>): unknown {
  switch (name) {
    case 'get_scale': {
      const root = args.root as NoteName;
      const scaleName = args.scale as ScaleName;
      const scale = new Scale(root, scaleName);
      const notes = scale.getNotes();
      return {
        root,
        scale: scaleName,
        notes: notes.map((n: Note) => n.name),
        intervals: SCALE_INTERVALS[scaleName],
        description: `${root.slice(0, -1)} ${scaleName} scale`,
      };
    }

    case 'get_scale_degree': {
      const root = args.root as NoteName;
      const scaleName = args.scale as ScaleName;
      const degree = args.degree as number;
      const scale = new Scale(root, scaleName);
      const note = scale.degree(degree);
      return {
        root,
        scale: scaleName,
        degree,
        note: note.name,
        description: `Degree ${degree} of ${root.slice(0, -1)} ${scaleName}`,
      };
    }

    case 'get_chord': {
      const root = args.root as NoteName;
      const quality = args.quality as ChordQuality;
      const inversion = (args.inversion as number) ?? 0;
      let chord = ChordVoicing.fromQuality(root, quality);
      if (inversion > 0) {
        chord = chord.invert(inversion);
      }
      return {
        root,
        quality,
        inversion,
        notes: chord.notes.map((n: Note) => n.name),
        intervals: CHORD_INTERVALS[quality],
        description: `${root.slice(0, -1)}${quality}${inversion > 0 ? ` (inversion ${inversion})` : ''}`,
      };
    }

    case 'get_chord_inversions': {
      const root = args.root as NoteName;
      const quality = args.quality as ChordQuality;
      const baseChord = ChordVoicing.fromQuality(root, quality);
      const inversions = [];
      for (let i = 0; i < baseChord.length; i++) {
        const inv = i === 0 ? baseChord : baseChord.invert(i);
        inversions.push({
          inversion: i,
          name: i === 0 ? 'root position' : `${ordinal(i)} inversion`,
          notes: inv.notes.map((n: Note) => n.name),
        });
      }
      return {
        root,
        quality,
        inversions,
      };
    }

    case 'get_progression': {
      const root = args.root as NoteName;
      const scaleName = args.scale as ScaleName;
      const degrees = args.degrees as Degree[];
      const scale = new Scale(root, scaleName);
      const progression = ChordProgression.fromDegrees(scale, degrees, Duration(1.0));
      return {
        key: `${root.slice(0, -1)} ${scaleName}`,
        degrees,
        chords: progression.changes.map((c: ChordChange, i: number) => ({
          degree: degrees[i],
          root: c.chord.root,
          quality: c.chord.quality,
          notes: c.chord.notes.map((n: Note) => n.name),
        })),
      };
    }

    case 'transpose_note': {
      const noteName = args.note as NoteName;
      const semitones = args.semitones as number;
      const note = new Note(noteName);
      const transposed = note.transpose(semitones);
      return {
        original: noteName,
        semitones,
        result: transposed.name,
        direction: semitones > 0 ? 'up' : semitones < 0 ? 'down' : 'none',
      };
    }

    case 'get_interval': {
      const from = new Note(args.from as NoteName);
      const to = new Note(args.to as NoteName);
      const semitones = to.pitch - from.pitch;
      const intervalNames: Record<number, string> = {
        0: 'unison',
        1: 'minor 2nd',
        2: 'major 2nd',
        3: 'minor 3rd',
        4: 'major 3rd',
        5: 'perfect 4th',
        6: 'tritone',
        7: 'perfect 5th',
        8: 'minor 6th',
        9: 'major 6th',
        10: 'minor 7th',
        11: 'major 7th',
        12: 'octave',
      };
      const absInterval = Math.abs(semitones) % 12;
      return {
        from: from.name,
        to: to.name,
        semitones,
        intervalName: intervalNames[absInterval] ?? `${Math.abs(semitones)} semitones`,
        direction: semitones > 0 ? 'ascending' : semitones < 0 ? 'descending' : 'same pitch',
      };
    }

    case 'list_scales': {
      return {
        scales: SCALE_NAMES.map(name => ({
          name,
          intervals: SCALE_INTERVALS[name],
          noteCount: SCALE_INTERVALS[name].length,
        })),
      };
    }

    case 'list_chords': {
      return {
        chords: CHORD_QUALITIES.map(quality => ({
          quality,
          intervals: CHORD_INTERVALS[quality],
          noteCount: CHORD_INTERVALS[quality].length,
        })),
      };
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

/**
 * Convert number to ordinal (1st, 2nd, 3rd, etc.)
 */
function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Create and start the Music Theory MCP server.
 */
export async function createMusicTheoryServer(): Promise<Server> {
  const server = new Server(
    {
      name: 'contour-music-theory',
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
export async function runMusicTheoryServer(): Promise<void> {
  const server = await createMusicTheoryServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Contour Music Theory MCP server running on stdio');
}
