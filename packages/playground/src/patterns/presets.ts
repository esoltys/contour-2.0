/**
 * Pattern preset definitions
 */
export interface PatternPreset {
  id: string;
  name: string;
  icon: string;
  category: 'drums' | 'bass' | 'melody' | 'effects';
  code: string;
  description: string;
}

export const PATTERN_PRESETS: PatternPreset[] = [
  // === DRUMS (Row 1) ===
  {
    id: 'techno-kick',
    name: 'Techno Kick',
    icon: '🥁',
    category: 'drums',
    code: `pattern().fromNotation("C1*4")`,
    description: 'Four-on-the-floor kick drum'
  },
  {
    id: 'funky-snare',
    name: 'Funky Snare',
    icon: '🎵',
    category: 'drums',
    code: `pattern().fromNotation("[~ D1] ~ D1 ~")`,
    description: 'Syncopated snare pattern'
  },
  {
    id: 'euclidean-hat',
    name: 'Euclidean Hat',
    icon: '🎩',
    category: 'drums',
    code: `pattern().fromNotation("F#1 ~ F#1 ~ F#1 ~ F#1 F#1")`,
    description: 'Hi-hat with euclidean rhythm'
  },
  {
    id: 'breakbeat',
    name: 'Breakbeat',
    icon: '💥',
    category: 'drums',
    code: `pattern().fromNotation("C1 ~ D1 ~ C1 D1 ~ D1")`,
    description: 'Classic breakbeat pattern'
  },

  // === BASS (Row 2) ===
  {
    id: 'bass-groove',
    name: 'E-Bass Finger',
    icon: '🎸',
    category: 'bass',
    code: `pattern().fromNotation("C2*4 ~ Eb2*2 ~")`,
    description: 'Electric bass fingerstyle'
  },
  {
    id: 'acid-bass',
    name: 'Synth Bass 1',
    icon: '⚡',
    category: 'bass',
    code: `pattern().fromNotation("C2 Eb2 G2 C3 G2 Eb2 C2 Bb1")`,
    description: 'Classic synth bass'
  },
  {
    id: 'walking-bass',
    name: 'Acoustic Bass',
    icon: '🚶',
    category: 'bass',
    code: `pattern().fromNotation("C2 E2 G2 A2")`,
    description: 'Upright acoustic bass'
  },
  {
    id: 'sub-bass',
    name: 'Synth Bass 2',
    icon: '🔊',
    category: 'bass',
    code: `pattern().fromNotation("C1@4")`,
    description: 'Deep synth sub bass'
  },

  // === MELODY (Row 3) ===
  {
    id: 'arpeggio',
    name: 'Grand Piano',
    icon: '🎹',
    category: 'melody',
    code: `pattern().fromNotation("C4 E4 G4 C5")`,
    description: 'Acoustic grand piano'
  },
  {
    id: 'melody-lead',
    name: 'Square Lead',
    icon: '🎼',
    category: 'melody',
    code: `pattern().fromNotation("E4 D4 C4 ~ G3 ~ C4 ~")`,
    description: 'Square wave synth lead'
  },
  {
    id: 'fast-arp',
    name: 'Electric Piano',
    icon: '⚡',
    category: 'melody',
    code: `pattern().fromNotation("C4 E4 G4 B4 C5 B4 G4 E4")`,
    description: 'Electric piano sound'
  },
  {
    id: 'pentatonic',
    name: 'Nylon Guitar',
    icon: '🌏',
    category: 'melody',
    code: `pattern().fromNotation("C4 D4 E4 G4 A4 G4 E4 D4")`,
    description: 'Acoustic nylon guitar'
  },

  // === EFFECTS (Row 4) ===
  {
    id: 'ambient-swell',
    name: 'Warm Pad',
    icon: '🌊',
    category: 'effects',
    code: `pattern().fromNotation("C3@2 E3@2")`,
    description: 'Warm ambient pad'
  },
  {
    id: 'stab-chord',
    name: 'String Ensemble',
    icon: '💫',
    category: 'effects',
    code: `pattern().fromNotation("~ ~ [C4 E4 G4] ~")`,
    description: 'String ensemble stabs'
  },
  {
    id: 'texture',
    name: 'Brightness FX',
    icon: '✨',
    category: 'effects',
    code: `pattern().fromNotation("C5 ~ G5 ~ E5 ~ C6 ~")`,
    description: 'Bright textural FX'
  },
  {
    id: 'riser',
    name: 'Choir Pad',
    icon: '📈',
    category: 'effects',
    code: `pattern().fromNotation("C3 D3 E3 F3 G3 A3 B3 C4")`,
    description: 'Choir pad rising melody'
  }
];

/**
 * Get preset by ID
 */
export function getPreset(id: string): PatternPreset | undefined {
  return PATTERN_PRESETS.find(p => p.id === id);
}

/**
 * Get presets by category
 */
export function getPresetsByCategory(category: string): PatternPreset[] {
  return PATTERN_PRESETS.filter(p => p.category === category);
}
