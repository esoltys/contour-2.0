/**
 * Export Bach Invention No. 4 to MIDI file
 *
 * This demonstrates the MIDI renderer plugin.
 */

import { MIDIRenderer } from '@contour/plugin-midi';
import { createBachInvention4 } from './invention';
import { writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function main() {
  console.log('Exporting Bach Invention No. 4 to MIDI...\n');

  // Create the composition
  const composition = createBachInvention4();

  console.log(`Composition: ${composition.title}`);
  console.log(`Tempo: ${composition.tempo} BPM`);
  console.log(`Tracks: ${composition.tracks.length}`);
  console.log(`Duration: ${composition.duration} seconds\n`);

  // Create MIDI renderer
  const renderer = new MIDIRenderer();

  // Initialize with configuration
  await renderer.initialize({
    format: 1, // Format 1 = multi-track
    ticksPerBeat: 480,
  });

  console.log('Rendering to MIDI...');

  // Render to MIDI
  const result = await renderer.render(composition);

  console.log(`\nRendered successfully!`);
  console.log(`Format: ${result.format}`);
  console.log(`Track count: ${result.metadata.trackCount}`);
  console.log(`File size: ${result.data.length} bytes`);

  // Write to file
  const outputPath = join(__dirname, 'bach-invention-4.mid');
  await writeFile(outputPath, result.data);

  console.log(`\nWritten to: ${outputPath}`);
  console.log('\nYou can now import this MIDI file into any DAW or notation software!');

  // Cleanup
  await renderer.shutdown();
}

main().catch(console.error);
