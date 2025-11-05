/**
 * Playback script for Bach Invention No. 4
 *
 * NOTE: This script is designed for browser environments where Tone.js
 * can access the Web Audio API. For Node.js usage, use export-midi.ts instead.
 *
 * To run audio playback:
 *   1. cd ../../packages/dev
 *   2. pnpm dev
 *   3. Open http://localhost:5173 in your browser
 *
 * This demonstrates:
 * - Loading a composition
 * - Scheduling with CompositionScheduler
 * - Starting playback in browser
 */

import { createBachInvention4 } from './invention.js';
import { CompositionScheduler } from '@contour/tone-adapter';

async function main() {
  console.log('🎹 Bach Invention No. 4 in D minor (BWV 775)');
  console.log('='.repeat(50));

  // Create the composition
  const invention = createBachInvention4();

  console.log(`Title: ${invention.title}`);
  console.log(`Tempo: ${invention.tempo} BPM`);
  console.log(`Time Signature: ${invention.timeSignature.numerator}/${invention.timeSignature.denominator}`);
  console.log(`Tracks: ${invention.trackCount}`);
  console.log(`Duration: ${invention.duration.toFixed(2)} seconds`);
  console.log();

  // Analyze the composition
  invention.tracks.forEach((track, i) => {
    console.log(`Track ${i + 1}: ${track.name}`);
    console.log(`  Voices: ${track.voiceCount}`);
    track.voices.forEach((voice, j) => {
      console.log(`    Voice ${j + 1}: ${voice.instrument}`);
      console.log(`      Events: ${voice.pattern.events.length}`);
      console.log(`      Duration: ${voice.pattern.duration.toFixed(2)}`);
    });
  });

  console.log();
  console.log('▶️  Starting playback...');

  // Create scheduler and play
  const scheduler = new CompositionScheduler();

  try {
    // Schedule the composition
    scheduler.scheduleComposition(invention);

    // Start playback (requires user gesture in browser)
    await scheduler.start();

    console.log('✓ Playing...');
    console.log(`  Position: ${scheduler.position.toFixed(2)}s`);
    console.log(`  State: ${scheduler.state}`);

    // Wait for composition to finish
    // Duration is branded as Seconds but is a number at runtime
    const duration = invention.duration as number;
    await new Promise(resolve => setTimeout(resolve, (duration + 1) * 1000));

    console.log('✓ Playback complete');

    // Stop and cleanup
    scheduler.stop();
    scheduler.dispose();
  } catch (error) {
    console.error('Error during playback:', error);
    scheduler.dispose();
    process.exit(1);
  }
}

export { main };

// Run if called directly (ESM version)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
