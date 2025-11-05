import { describe, it, expect } from 'vitest';
import { MIDIRenderer } from '@contour/plugin-midi';
import { createBachInvention4 } from './invention';

describe('Bach Invention No. 4 - Export Tests', () => {
  it('exports to MIDI successfully', async () => {
    // Create composition
    const composition = createBachInvention4();

    // Create and initialize MIDI renderer
    const renderer = new MIDIRenderer();
    await renderer.initialize({
      format: 1,
      ticksPerBeat: 480,
    });

    // Render to MIDI
    const result = await renderer.render(composition);

    // Verify result
    expect(result.format).toBe('midi');
    expect(result.data).toBeInstanceOf(Buffer);
    expect(result.data.length).toBeGreaterThan(0);

    // Verify MIDI file header
    const header = result.data.toString('ascii', 0, 4);
    expect(header).toBe('MThd');

    // Verify metadata
    expect(result.metadata.trackCount).toBe(2); // Two voices
    expect(result.metadata.tempo).toBe(96); // Bach's tempo
    expect(result.metadata.duration).toBeGreaterThan(0);

    // Cleanup
    await renderer.shutdown();
  });

  it('composition has correct structure', () => {
    const composition = createBachInvention4();

    // Verify composition metadata
    expect(composition.title).toBe('Invention No. 4 in D minor (BWV 775)');
    expect(composition.tempo).toBe(96);

    // Verify tracks
    expect(composition.tracks.length).toBe(1);

    const track = composition.tracks[0];
    expect(track.name).toBe('Two-Voice Invention');
    expect(track.voices.length).toBe(2);

    // Verify voices have patterns
    for (const voice of track.voices) {
      expect(voice.pattern.events.length).toBeGreaterThan(0);
      expect(voice.instrument).toBe('harpsichord');
    }
  });

  it('has recognizable D minor content', () => {
    const composition = createBachInvention4();
    const track = composition.tracks[0];

    // Get all note events from both voices
    const allNotes = track.voices.flatMap(voice =>
      voice.pattern.events
        .filter(e => e.type === 'note')
        .map(e => e.type === 'note' ? e.pitch : 0)
    );

    expect(allNotes.length).toBeGreaterThan(0);

    // D minor scale notes (MIDI): D(62), E(64), F(65), G(67), A(69), Bb(70), C(72)
    // Check that we have notes from the D minor scale
    const dMinorNotes = [62, 64, 65, 67, 69, 70, 72];
    const hasMinorScaleNotes = allNotes.some(note =>
      dMinorNotes.includes(note % 12 + 60)
    );

    expect(hasMinorScaleNotes).toBe(true);
  });

  it('upper and lower voices have different ranges', () => {
    const composition = createBachInvention4();
    const track = composition.tracks[0];

    const [upperVoice, lowerVoice] = track.voices;

    // Get note pitches
    const upperNotes = upperVoice.pattern.events
      .filter(e => e.type === 'note')
      .map(e => e.type === 'note' ? e.pitch : 0);

    const lowerNotes = lowerVoice.pattern.events
      .filter(e => e.type === 'note')
      .map(e => e.type === 'note' ? e.pitch : 0);

    // Upper voice should generally be higher
    const avgUpper = upperNotes.reduce((a, b) => a + b, 0) / upperNotes.length;
    const avgLower = lowerNotes.reduce((a, b) => a + b, 0) / lowerNotes.length;

    expect(avgUpper).toBeGreaterThan(avgLower);
  });
});
