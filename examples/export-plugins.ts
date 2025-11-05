/**
 * Demonstration of Plugin Architecture
 *
 * This example shows how to use the plugin registry and multiple renderers.
 */

import { PluginRegistry } from '@contour/core';
import { MIDIRenderer } from '@contour/plugin-midi';
import {
  Composition,
  Track,
  Voice,
  PatternBuilder,
  BPM,
  Durations,
  C, D, E, F, G,
} from '@contour/core';
import { writeFile } from 'fs/promises';
import { join } from 'path';

async function main() {
  console.log('=== Contour Plugin Architecture Demo ===\n');

  // Create a simple composition
  const melody = new PatternBuilder()
    .note(C('4'), Durations.quarter)
    .note(D('4'), Durations.quarter)
    .note(E('4'), Durations.quarter)
    .note(F('4'), Durations.quarter)
    .note(G('4'), Durations.quarter)
    .note(F('4'), Durations.quarter)
    .note(E('4'), Durations.quarter)
    .note(D('4'), Durations.quarter)
    .note(C('4'), Durations.half)
    .build();

  const voice = new Voice(melody, 'piano');
  const track = new Track('Melody', [voice]);
  const composition = new Composition('Simple Melody', BPM(120)).addTrack(track);

  console.log(`Composition: ${composition.title}`);
  console.log(`Tempo: ${composition.tempo} BPM\n`);

  // Create plugin registry
  const registry = new PluginRegistry();

  // Register MIDI renderer
  const midiRenderer = new MIDIRenderer();
  registry.register(midiRenderer);

  console.log('Registered plugins:');
  for (const plugin of registry.getAll()) {
    console.log(`  - ${plugin.name} v${plugin.version}`);
  }
  console.log('');

  // Use MIDI renderer
  console.log('Exporting to MIDI...');
  await midiRenderer.initialize({
    format: 1,
    ticksPerBeat: 480,
  });

  const midiResult = await midiRenderer.render(composition);

  console.log(`  Format: ${midiResult.format}`);
  console.log(`  File size: ${midiResult.data.length} bytes`);
  console.log(`  Track count: ${midiResult.metadata.trackCount}`);

  // Write MIDI file
  const midiPath = join(process.cwd(), 'simple-melody.mid');
  await writeFile(midiPath, midiResult.data);
  console.log(`  Written to: ${midiPath}\n`);

  // Cleanup
  await midiRenderer.shutdown();

  console.log('=== Demo Complete ===');
  console.log('\nThe plugin architecture allows you to:');
  console.log('  • Register multiple renderer plugins');
  console.log('  • Validate plugin dependencies');
  console.log('  • Export compositions to different formats');
  console.log('  • Extend with custom plugins without modifying core library\n');
}

main().catch(console.error);
