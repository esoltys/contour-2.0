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
    name: 'Bass Groove',
    icon: '🎸',
    category: 'bass',
    code: `pattern().fromNotation("C2*4 ~ Eb2*2 ~")`,
    description: 'Deep bass groove'
  },
  {
    id: 'acid-bass',
    name: 'Acid Bass',
    icon: '⚡',
    category: 'bass',
    code: `pattern().fromNotation("C2 Eb2 G2 C3 G2 Eb2 C2 Bb1")`,
    description: 'Classic acid bassline'
  },
  {
    id: 'walking-bass',
    name: 'Walking Bass',
    icon: '🚶',
    category: 'bass',
    code: `pattern().fromNotation("C2 E2 G2 A2")`,
    description: 'Jazz walking bass'
  },
  {
    id: 'sub-bass',
    name: 'Sub Bass',
    icon: '🔊',
    category: 'bass',
    code: `pattern().fromNotation("C1@4")`,
    description: 'Deep sustained sub bass'
  },

  // === MELODY (Row 3) ===
  {
    id: 'arpeggio',
    name: 'Arpeggio',
    icon: '🎹',
    category: 'melody',
    code: `pattern().fromNotation("C4 E4 G4 C5")`,
    description: 'Classic C major arpeggio'
  },
  {
    id: 'melody-lead',
    name: 'Melody Lead',
    icon: '🎼',
    category: 'melody',
    code: `pattern().fromNotation("E4 D4 C4 ~ G3 ~ C4 ~")`,
    description: 'Simple melodic phrase'
  },
  {
    id: 'fast-arp',
    name: 'Fast Arp',
    icon: '⚡',
    category: 'melody',
    code: `pattern().fromNotation("C4 E4 G4 B4 C5 B4 G4 E4")`,
    description: 'Fast ascending-descending arp'
  },
  {
    id: 'pentatonic',
    name: 'Pentatonic',
    icon: '🌏',
    category: 'melody',
    code: `pattern().fromNotation("C4 D4 E4 G4 A4 G4 E4 D4")`,
    description: 'Pentatonic scale melody'
  },

  // === EFFECTS (Row 4) ===
  {
    id: 'ambient-swell',
    name: 'Ambient Swell',
    icon: '🌊',
    category: 'effects',
    code: `pattern().fromNotation("C3@2 E3@2")`,
    description: 'Slow ambient pad'
  },
  {
    id: 'stab-chord',
    name: 'Stab Chord',
    icon: '💫',
    category: 'effects',
    code: `pattern().fromNotation("~ ~ [C4 E4 G4] ~")`,
    description: 'Chord stab accent'
  },
  {
    id: 'texture',
    name: 'Texture',
    icon: '✨',
    category: 'effects',
    code: `pattern().fromNotation("C5 ~ G5 ~ E5 ~ C6 ~")`,
    description: 'High textural elements'
  },
  {
    id: 'riser',
    name: 'Riser',
    icon: '📈',
    category: 'effects',
    code: `pattern().fromNotation("C3 D3 E3 F3 G3 A3 B3 C4")`,
    description: 'Rising tension effect'
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
