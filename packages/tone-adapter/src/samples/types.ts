/**
 * Type definitions for sample library integration.
 *
 * This file provides type-safe interfaces for soundfont-player instruments,
 * General MIDI instrument names, and soundfont library identifiers.
 */

/**
 * General MIDI instrument names (128 instruments).
 * Provides autocomplete for GM-compatible SoundFonts.
 *
 * Note: These names match the soundfont-player naming convention
 * (lowercase with underscores), not the spec's PascalCase names.
 */
export enum GMInstrument {
  // Piano (0-7)
  AcousticGrandPiano = 'acoustic_grand_piano',
  BrightAcousticPiano = 'bright_acoustic_piano',
  ElectricGrandPiano = 'electric_grand_piano',
  HonkyTonkPiano = 'honky_tonk_piano',
  ElectricPiano1 = 'electric_piano_1',
  ElectricPiano2 = 'electric_piano_2',
  Harpsichord = 'harpsichord',
  Clavinet = 'clavinet',

  // Chromatic Percussion (8-15)
  Celesta = 'celesta',
  Glockenspiel = 'glockenspiel',
  MusicBox = 'music_box',
  Vibraphone = 'vibraphone',
  Marimba = 'marimba',
  Xylophone = 'xylophone',
  TubularBells = 'tubular_bells',
  Dulcimer = 'dulcimer',

  // Organ (16-23)
  DrawbarOrgan = 'drawbar_organ',
  PercussiveOrgan = 'percussive_organ',
  RockOrgan = 'rock_organ',
  ChurchOrgan = 'church_organ',
  ReedOrgan = 'reed_organ',
  Accordion = 'accordion',
  Harmonica = 'harmonica',
  TangoAccordion = 'tango_accordion',

  // Guitar (24-31)
  AcousticGuitarNylon = 'acoustic_guitar_nylon',
  AcousticGuitarSteel = 'acoustic_guitar_steel',
  ElectricGuitarJazz = 'electric_guitar_jazz',
  ElectricGuitarClean = 'electric_guitar_clean',
  ElectricGuitarMuted = 'electric_guitar_muted',
  OverdrivenGuitar = 'overdriven_guitar',
  DistortionGuitar = 'distortion_guitar',
  GuitarHarmonics = 'guitar_harmonics',

  // Bass (32-39)
  AcousticBass = 'acoustic_bass',
  ElectricBassFinger = 'electric_bass_finger',
  ElectricBassPick = 'electric_bass_pick',
  FretlessBass = 'fretless_bass',
  SlapBass1 = 'slap_bass_1',
  SlapBass2 = 'slap_bass_2',
  SynthBass1 = 'synth_bass_1',
  SynthBass2 = 'synth_bass_2',

  // Strings (40-47)
  Violin = 'violin',
  Viola = 'viola',
  Cello = 'cello',
  Contrabass = 'contrabass',
  TremoloStrings = 'tremolo_strings',
  PizzicatoStrings = 'pizzicato_strings',
  OrchestralHarp = 'orchestral_harp',
  Timpani = 'timpani',

  // Ensemble (48-55)
  StringEnsemble1 = 'string_ensemble_1',
  StringEnsemble2 = 'string_ensemble_2',
  SynthStrings1 = 'synth_strings_1',
  SynthStrings2 = 'synth_strings_2',
  ChoirAahs = 'choir_aahs',
  VoiceOohs = 'voice_oohs',
  SynthVoice = 'synth_voice',
  OrchestraHit = 'orchestra_hit',

  // Brass (56-63)
  Trumpet = 'trumpet',
  Trombone = 'trombone',
  Tuba = 'tuba',
  MutedTrumpet = 'muted_trumpet',
  FrenchHorn = 'french_horn',
  BrassSection = 'brass_section',
  SynthBrass1 = 'synth_brass_1',
  SynthBrass2 = 'synth_brass_2',

  // Reed (64-71)
  SopranoSax = 'soprano_sax',
  AltoSax = 'alto_sax',
  TenorSax = 'tenor_sax',
  BaritoneSax = 'baritone_sax',
  Oboe = 'oboe',
  EnglishHorn = 'english_horn',
  Bassoon = 'bassoon',
  Clarinet = 'clarinet',

  // Pipe (72-79)
  Piccolo = 'piccolo',
  Flute = 'flute',
  Recorder = 'recorder',
  PanFlute = 'pan_flute',
  BlownBottle = 'blown_bottle',
  Shakuhachi = 'shakuhachi',
  Whistle = 'whistle',
  Ocarina = 'ocarina',

  // Synth Lead (80-87)
  Lead1Square = 'lead_1_square',
  Lead2Sawtooth = 'lead_2_sawtooth',
  Lead3Calliope = 'lead_3_calliope',
  Lead4Chiff = 'lead_4_chiff',
  Lead5Charang = 'lead_5_charang',
  Lead6Voice = 'lead_6_voice',
  Lead7Fifths = 'lead_7_fifths',
  Lead8BassLead = 'lead_8_bass__lead',

  // Synth Pad (88-95)
  Pad1NewAge = 'pad_1_new_age',
  Pad2Warm = 'pad_2_warm',
  Pad3Polysynth = 'pad_3_polysynth',
  Pad4Choir = 'pad_4_choir',
  Pad5Bowed = 'pad_5_bowed',
  Pad6Metallic = 'pad_6_metallic',
  Pad7Halo = 'pad_7_halo',
  Pad8Sweep = 'pad_8_sweep',

  // Synth Effects (96-103)
  FX1Rain = 'fx_1_rain',
  FX2Soundtrack = 'fx_2_soundtrack',
  FX3Crystal = 'fx_3_crystal',
  FX4Atmosphere = 'fx_4_atmosphere',
  FX5Brightness = 'fx_5_brightness',
  FX6Goblins = 'fx_6_goblins',
  FX7Echoes = 'fx_7_echoes',
  FX8SciFi = 'fx_8_scifi',

  // Ethnic (104-111)
  Sitar = 'sitar',
  Banjo = 'banjo',
  Shamisen = 'shamisen',
  Koto = 'koto',
  Kalimba = 'kalimba',
  Bagpipe = 'bagpipe',
  Fiddle = 'fiddle',
  Shanai = 'shanai',

  // Percussive (112-119)
  TinkleBell = 'tinkle_bell',
  Agogo = 'agogo',
  SteelDrums = 'steel_drums',
  Woodblock = 'woodblock',
  TaikoDrum = 'taiko_drum',
  MelodicTom = 'melodic_tom',
  SynthDrum = 'synth_drum',
  ReverseCymbal = 'reverse_cymbal',

  // Sound Effects (120-127)
  GuitarFretNoise = 'guitar_fret_noise',
  BreathNoise = 'breath_noise',
  Seashore = 'seashore',
  BirdTweet = 'bird_tweet',
  TelephoneRing = 'telephone_ring',
  Helicopter = 'helicopter',
  Applause = 'applause',
  Gunshot = 'gunshot',
}

/**
 * Available soundfont libraries from soundfont-player.
 * These are hosted on CDN and include pre-rendered samples.
 */
export enum SoundfontLibrary {
  /** MusyngKite - High quality GM soundfont */
  MusyngKite = 'MusyngKite',

  /** FluidR3_GM - Open source GM soundfont */
  FluidR3GM = 'FluidR3_GM',

  /** FatBoy - Alternative GM soundfont */
  FatBoy = 'FatBoy',
}

/**
 * Audio format for soundfont samples.
 */
export type SoundfontFormat = 'mp3' | 'ogg';

/**
 * Soundfont instrument instance from soundfont-player.
 *
 * Note: soundfont-player doesn't provide TypeScript types,
 * so we define the interface based on its API.
 */
export interface SoundfontInstrument {
  /**
   * Play a note.
   * @param note - Note name (e.g., 'C4', 'F#3')
   * @param time - AudioContext time when to play (0 = now)
   * @param options - Playback options
   */
  play(
    note: string,
    time?: number,
    options?: {
      duration?: number;
      gain?: number;
      [key: string]: unknown;
    }
  ): void;

  /**
   * Schedule a note to play at a specific time.
   * @param when - AudioContext time
   * @param note - Note name
   * @param duration - Note duration in seconds
   * @param options - Additional options
   */
  schedule?(
    when: number,
    note: string,
    duration: number,
    options?: { gain?: number }
  ): void;

  /**
   * Stop all playing notes.
   */
  stop(): void;

  /**
   * Get the underlying AudioContext.
   */
  context?: AudioContext;

  /**
   * Get the output audio node.
   */
  out?: AudioNode;
}

/**
 * Configuration for loading a soundfont instrument.
 */
export interface SampleLibraryConfig {
  /** Instrument name from GMInstrument enum */
  instrument: string;

  /** Audio format (mp3 or ogg) */
  format?: SoundfontFormat;

  /** Soundfont library to use */
  soundfont?: SoundfontLibrary | string;
}

/**
 * Type-safe qualified instrument name.
 * Format: 'LibraryName:InstrumentName'
 *
 * @example
 * 'MusyngKite:acoustic_grand_piano'
 * 'FluidR3_GM:violin'
 */
export type QualifiedInstrumentName = `${SoundfontLibrary}:${GMInstrument}` | `${string}:${string}`;

/**
 * Helper to create a qualified instrument name.
 */
export function createQualifiedName(
  library: SoundfontLibrary | string,
  instrument: GMInstrument | string
): QualifiedInstrumentName {
  return `${library}:${instrument}` as QualifiedInstrumentName;
}

/**
 * Parse a qualified instrument name into library and instrument parts.
 *
 * @param qualifiedName - The qualified name to parse
 * @returns Object with library and instrument names, or null if invalid
 */
export function parseQualifiedName(qualifiedName: string): {
  library: string;
  instrument: string;
} | null {
  const parts = qualifiedName.split(':');
  if (parts.length !== 2) {
    return null;
  }
  return {
    library: parts[0],
    instrument: parts[1],
  };
}

/**
 * Check if a string is a qualified instrument name (contains ':').
 */
export function isQualifiedName(name: string): boolean {
  return name.includes(':');
}

/**
 * Options for loading a soundfont instrument.
 */
export interface SoundfontOptions {
  format?: SoundfontFormat;
  soundfont?: SoundfontLibrary | string;
  destination?: AudioNode;
  [key: string]: unknown;
}

/**
 * Interface for the soundfont-player global object.
 */
export interface SoundfontPlayer {
  instrument(
    ac: AudioContext,
    name: string,
    options?: SoundfontOptions
  ): Promise<SoundfontInstrument>;
}
