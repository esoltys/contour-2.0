// Simple chord parser for mini-notation
// Supports basic chord types without external dependencies

interface ChordData {
  notes: string[];
}

// Basic chord interval structures (in semitones from root)
const CHORD_TYPES: Record<string, number[]> = {
  // Major chords
  '': [0, 4, 7],                    // Major triad (C = C, E, G)
  'maj': [0, 4, 7],                 // Major triad
  'M': [0, 4, 7],                   // Major triad
  'maj7': [0, 4, 7, 11],            // Major 7th
  'M7': [0, 4, 7, 11],              // Major 7th
  '7': [0, 4, 7, 10],               // Dominant 7th
  'maj9': [0, 4, 7, 11, 14],        // Major 9th

  // Minor chords
  'm': [0, 3, 7],                   // Minor triad
  'min': [0, 3, 7],                 // Minor triad
  'm7': [0, 3, 7, 10],              // Minor 7th
  'min7': [0, 3, 7, 10],            // Minor 7th
  'm9': [0, 3, 7, 10, 14],          // Minor 9th

  // Diminished chords
  'dim': [0, 3, 6],                 // Diminished triad
  'dim7': [0, 3, 6, 9],             // Diminished 7th

  // Augmented chords
  'aug': [0, 4, 8],                 // Augmented triad

  // Suspended chords
  'sus2': [0, 2, 7],                // Suspended 2nd
  'sus4': [0, 5, 7],                // Suspended 4th

  // Extended chords
  '9': [0, 4, 7, 10, 14],           // Dominant 9th
  '11': [0, 4, 7, 10, 14, 17],      // Dominant 11th
  '13': [0, 4, 7, 10, 14, 17, 21],  // Dominant 13th
};

// Note names in chromatic scale
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NOTE_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/**
 * Parse a chord symbol and return the notes
 */
export function parseChord(chordSymbol: string): ChordData {
  // Extract root note (with optional accidental)
  const match = chordSymbol.match(/^([A-G][#b]?)(.*)/);
  if (!match) {
    return { notes: [] };
  }

  const [, root, quality] = match;

  // Get chord intervals
  const intervals = CHORD_TYPES[quality];
  if (!intervals) {
    // Unknown chord type, return empty
    return { notes: [] };
  }

  // Convert root to MIDI note number
  const rootIndex = getNoteIndex(root);
  if (rootIndex === -1) {
    return { notes: [] };
  }

  // Generate notes
  const useFlats = root.includes('b');
  const noteNames = useFlats ? FLAT_NOTE_NAMES : NOTE_NAMES;

  const notes = intervals.map(interval => {
    const noteIndex = (rootIndex + interval) % 12;
    return noteNames[noteIndex];
  });

  return { notes };
}

/**
 * Get the index of a note in the chromatic scale
 */
function getNoteIndex(note: string): number {
  // Try sharp notes first
  let index = NOTE_NAMES.indexOf(note);
  if (index !== -1) return index;

  // Try flat notes
  index = FLAT_NOTE_NAMES.indexOf(note);
  return index;
}
