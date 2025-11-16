/**
 * Instrument Configuration - Centralized mapping of GM instruments to program numbers.
 *
 * This file contains the General MIDI (GM) instrument program number mappings
 * separated from UI logic for better maintainability.
 */

import { GMInstrument } from '@contour/tone-adapter';

/**
 * Map of GM instruments to their standard program numbers (0-127).
 * Organized by GM instrument categories.
 */
export const INSTRUMENT_PROGRAM_MAP: ReadonlyMap<GMInstrument, number> = new Map([
  // Piano (0-7)
  [GMInstrument.AcousticGrandPiano, 0],
  [GMInstrument.BrightAcousticPiano, 1],
  [GMInstrument.ElectricGrandPiano, 2],
  [GMInstrument.HonkyTonkPiano, 3],
  [GMInstrument.ElectricPiano1, 4],
  [GMInstrument.ElectricPiano2, 5],
  [GMInstrument.Harpsichord, 6],
  [GMInstrument.Clavinet, 7],

  // Chromatic Percussion (8-15)
  [GMInstrument.Celesta, 8],
  [GMInstrument.Glockenspiel, 9],
  [GMInstrument.MusicBox, 10],
  [GMInstrument.Vibraphone, 11],
  [GMInstrument.Marimba, 12],
  [GMInstrument.Xylophone, 13],
  [GMInstrument.TubularBells, 14],
  [GMInstrument.Dulcimer, 15],

  // Organ (16-23)
  [GMInstrument.DrawbarOrgan, 16],
  [GMInstrument.PercussiveOrgan, 17],
  [GMInstrument.RockOrgan, 18],
  [GMInstrument.ChurchOrgan, 19],
  [GMInstrument.ReedOrgan, 20],
  [GMInstrument.Accordion, 21],
  [GMInstrument.Harmonica, 22],
  [GMInstrument.TangoAccordion, 23],

  // Guitar (24-31)
  [GMInstrument.AcousticGuitarNylon, 24],
  [GMInstrument.AcousticGuitarSteel, 25],
  [GMInstrument.ElectricGuitarJazz, 26],
  [GMInstrument.ElectricGuitarClean, 27],
  [GMInstrument.ElectricGuitarMuted, 28],
  [GMInstrument.OverdrivenGuitar, 29],
  [GMInstrument.DistortionGuitar, 30],
  [GMInstrument.GuitarHarmonics, 31],

  // Bass (32-39)
  [GMInstrument.AcousticBass, 32],
  [GMInstrument.ElectricBassFinger, 33],
  [GMInstrument.ElectricBassPick, 34],
  [GMInstrument.FretlessBass, 35],
  [GMInstrument.SlapBass1, 36],
  [GMInstrument.SlapBass2, 37],
  [GMInstrument.SynthBass1, 38],
  [GMInstrument.SynthBass2, 39],

  // Strings (40-47)
  [GMInstrument.Violin, 40],
  [GMInstrument.Viola, 41],
  [GMInstrument.Cello, 42],
  [GMInstrument.Contrabass, 43],
  [GMInstrument.TremoloStrings, 44],
  [GMInstrument.PizzicatoStrings, 45],
  [GMInstrument.OrchestralHarp, 46],
  [GMInstrument.Timpani, 47],

  // Ensemble (48-55)
  [GMInstrument.StringEnsemble1, 48],
  [GMInstrument.StringEnsemble2, 49],
  [GMInstrument.SynthStrings1, 50],
  [GMInstrument.SynthStrings2, 51],
  [GMInstrument.ChoirAahs, 52],
  [GMInstrument.VoiceOohs, 53],
  [GMInstrument.SynthVoice, 54],
  [GMInstrument.OrchestraHit, 55],

  // Brass (56-63)
  [GMInstrument.Trumpet, 56],
  [GMInstrument.Trombone, 57],
  [GMInstrument.Tuba, 58],
  [GMInstrument.MutedTrumpet, 59],
  [GMInstrument.FrenchHorn, 60],
  [GMInstrument.BrassSection, 61],
  [GMInstrument.SynthBrass1, 62],
  [GMInstrument.SynthBrass2, 63],

  // Reed (64-71)
  [GMInstrument.SopranoSax, 64],
  [GMInstrument.AltoSax, 65],
  [GMInstrument.TenorSax, 66],
  [GMInstrument.BaritoneSax, 67],
  [GMInstrument.Oboe, 68],
  [GMInstrument.EnglishHorn, 69],
  [GMInstrument.Bassoon, 70],
  [GMInstrument.Clarinet, 71],

  // Pipe (72-79)
  [GMInstrument.Piccolo, 72],
  [GMInstrument.Flute, 73],
  [GMInstrument.Recorder, 74],
  [GMInstrument.PanFlute, 75],
  [GMInstrument.BlownBottle, 76],
  [GMInstrument.Shakuhachi, 77],
  [GMInstrument.Whistle, 78],
  [GMInstrument.Ocarina, 79],

  // Synth Lead (80-87)
  [GMInstrument.Lead1Square, 80],
  [GMInstrument.Lead2Sawtooth, 81],
  [GMInstrument.Lead3Calliope, 82],
  [GMInstrument.Lead4Chiff, 83],
  [GMInstrument.Lead5Charang, 84],
  [GMInstrument.Lead6Voice, 85],
  [GMInstrument.Lead7Fifths, 86],
  [GMInstrument.Lead8BassLead, 87],

  // Synth Pad (88-95)
  [GMInstrument.Pad1NewAge, 88],
  [GMInstrument.Pad2Warm, 89],
  [GMInstrument.Pad3Polysynth, 90],
  [GMInstrument.Pad4Choir, 91],
  [GMInstrument.Pad5Bowed, 92],
  [GMInstrument.Pad6Metallic, 93],
  [GMInstrument.Pad7Halo, 94],
  [GMInstrument.Pad8Sweep, 95],

  // Synth Effects (96-103)
  [GMInstrument.FX1Rain, 96],
  [GMInstrument.FX2Soundtrack, 97],
  [GMInstrument.FX3Crystal, 98],
  [GMInstrument.FX4Atmosphere, 99],
  [GMInstrument.FX5Brightness, 100],
  [GMInstrument.FX6Goblins, 101],
  [GMInstrument.FX7Echoes, 102],
  [GMInstrument.FX8SciFi, 103],

  // Ethnic (104-111)
  [GMInstrument.Sitar, 104],
  [GMInstrument.Banjo, 105],
  [GMInstrument.Shamisen, 106],
  [GMInstrument.Koto, 107],
  [GMInstrument.Kalimba, 108],
  [GMInstrument.Bagpipe, 109],
  [GMInstrument.Fiddle, 110],
  [GMInstrument.Shanai, 111],

  // Percussive (112-119)
  [GMInstrument.TinkleBell, 112],
  [GMInstrument.Agogo, 113],
  [GMInstrument.SteelDrums, 114],
  [GMInstrument.Woodblock, 115],
  [GMInstrument.TaikoDrum, 116],
  [GMInstrument.MelodicTom, 117],
  [GMInstrument.SynthDrum, 118],
  [GMInstrument.ReverseCymbal, 119],

  // Sound Effects (120-127)
  [GMInstrument.GuitarFretNoise, 120],
  [GMInstrument.BreathNoise, 121],
  [GMInstrument.Seashore, 122],
  [GMInstrument.BirdTweet, 123],
  [GMInstrument.TelephoneRing, 124],
  [GMInstrument.Helicopter, 125],
  [GMInstrument.Applause, 126],
  [GMInstrument.Gunshot, 127],
]);

/**
 * Get the program number for a GM instrument.
 * @param instrument - The GM instrument
 * @returns The program number (0-127) or undefined if not found
 */
export function getInstrumentProgramNumber(instrument: GMInstrument): number | undefined {
  return INSTRUMENT_PROGRAM_MAP.get(instrument);
}

/**
 * Check if a program number is within a category range.
 * @param programNumber - The program number to check
 * @param range - The category range [start, end]
 * @returns True if the program number is within the range
 */
export function isInCategoryRange(programNumber: number, range: [number, number]): boolean {
  return programNumber >= range[0] && programNumber <= range[1];
}
