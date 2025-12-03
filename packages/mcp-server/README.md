# @contour/mcp-server

MCP (Model Context Protocol) servers for the Contour music composition system. These servers expose Contour's music theory and pattern capabilities to AI assistants like Claude.

## Installation

```bash
# From the Contour monorepo
bun install

# Or install globally
bun install -g @contour/mcp-server
```

## Quick Start

### Claude Code Integration

Add to your Claude Code settings (`~/.claude/settings.json` or project `.claude/settings.json`):

```json
{
  "mcpServers": {
    "contour-theory": {
      "command": "bun",
      "args": ["x", "@contour/mcp-server", "music-theory"]
    },
    "contour-pattern": {
      "command": "bun",
      "args": ["x", "@contour/mcp-server", "pattern"]
    }
  }
}
```

### Command Line

```bash
# Run music theory server
bun x @contour/mcp-server music-theory

# Run pattern visualization server
bun x @contour/mcp-server pattern

# Show help
bun x @contour/mcp-server --help
```

## Available Servers

### Music Theory Server (`music-theory`)

Provides tools for scales, chords, progressions, and interval calculations.

#### Tools

| Tool | Description |
|------|-------------|
| `get_scale` | Get all notes in a scale (e.g., C major, D Dorian) |
| `get_scale_degree` | Get a specific scale degree (1=tonic, 5=dominant) |
| `get_chord` | Get notes in a chord voicing (e.g., Cmaj7, Dm) |
| `get_chord_inversions` | Get all inversions of a chord |
| `get_progression` | Generate chord progression from Roman numerals |
| `transpose_note` | Transpose a note by semitones |
| `get_interval` | Calculate interval between two notes |
| `list_scales` | List all available scale types |
| `list_chords` | List all available chord types |

#### Example Usage

```
Claude: What notes are in a D Dorian scale?
→ get_scale(root: "D4", scale: "Dorian")
→ D4, E4, F4, G4, A4, B4, C5, D5

Claude: Show me Cmaj7 in all inversions
→ get_chord_inversions(root: "C4", quality: "maj7")
→ Root: C4, E4, G4, B4
→ 1st: E4, G4, B4, C5
→ 2nd: G4, B4, C5, E5
→ 3rd: B4, C5, E5, G5

Claude: What's a ii-V-I progression in G major?
→ get_progression(root: "G4", scale: "major", degrees: ["ii", "V", "I"])
→ Am7 → D7 → Gmaj
```

### Pattern Visualization Server (`pattern`)

Provides tools for visualizing, analyzing, and transforming musical patterns.

#### Tools

| Tool | Description |
|------|-------------|
| `parse_mini_notation` | Parse Contour mini-notation and visualize |
| `visualize_pattern` | Generate ASCII visualization of a pattern |
| `inspect_pattern` | Get detailed metrics and analysis |
| `transform_pattern` | Apply transformations (transpose, retrograde, fast, slow) |
| `create_scale_pattern` | Create a pattern from scale degrees |
| `compare_patterns` | Compare two patterns side by side |

#### Example Usage

```
Claude: Visualize a C major arpeggio
→ visualize_pattern(notes: ["C4", "E4", "G4", "C5"])
→
Time:  0.0   0.25  0.5   0.75
C5:    .     .     .     █
G4:    .     .     █     .
E4:    .     █     .     .
C4:    █     .     .     .

Claude: What happens if I transpose this pattern up a fifth and reverse it?
→ transform_pattern(
    notes: ["C4", "E4", "G4"],
    transformations: [
      { type: "transpose", value: 7 },
      { type: "retrograde" }
    ]
  )
→ Original: C4, E4, G4
→ After transpose(7): G4, B4, D5
→ After retrograde: D5, B4, G4
```

## Supported Scales

- **Major modes**: major, Ionian, Dorian, Phrygian, Lydian, Mixolydian, Aeolian, Locrian
- **Minor scales**: minor (natural), harmonicMinor, melodicMinor
- **Pentatonic**: majorPentatonic, minorPentatonic
- **Other**: chromatic, wholeTone

## Supported Chord Types

- **Major**: maj, M, maj7, M7, maj9
- **Minor**: m, min, m7, min7, m9
- **Dominant**: 7, 9, 11, 13
- **Diminished**: dim, dim7
- **Augmented**: aug
- **Suspended**: sus2, sus4

## Mini-Notation Syntax

The pattern server supports Contour's mini-notation:

| Syntax | Description | Example |
|--------|-------------|---------|
| `C4 E4 G4` | Space-separated notes | Three quarter notes |
| `C4*4` | Repetition | C4 four times |
| `[C4 E4]` | Grouping/subdivision | Two notes in time of one |
| `~` | Rest | Silent beat |
| `Cmaj7` | Chord symbol | C major 7th chord |
| `C4@2` | Hold/extend | C4 twice as long |

## Development

```bash
# Build
bun run build

# Run tests
bun run test

# Type check
bun run type-check
```

## Architecture

The MCP servers are thin wrappers around `@contour/core`:

```
@contour/mcp-server
├── src/
│   ├── cli.ts                    # CLI entry point
│   ├── index.ts                  # Package exports
│   └── servers/
│       ├── music-theory.ts       # Wraps Scale, ChordVoicing, ChordProgression
│       └── pattern-visualization.ts  # Wraps Pattern, PatternInspector
```

## License

MIT
