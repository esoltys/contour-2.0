import { Tone } from '@contour/tone-adapter';
import { PlaygroundState } from './PlaygroundState.js';

// ============================================================================
// Piano Roll Visualizer
// ============================================================================

interface VisualizerConfig {
  octaves: number;
  lowestNote: number;
  noteColors: string[];
}

const DEFAULT_CONFIG: VisualizerConfig = {
  octaves: 5,
  lowestNote: 24, // MIDI C1
  noteColors: [
    'rgba(0, 255, 245, 0.6)', // Cyan
    'rgba(255, 0, 255, 0.6)', // Magenta
    'rgba(0, 255, 127, 0.6)', // Spring green
    'rgba(255, 127, 0, 0.6)' // Orange
  ]
};

export class PianoRollVisualizer {
  private state: PlaygroundState;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private config: VisualizerConfig;
  private isRunning = false;
  private animationFrameId: number | null = null;

  constructor(
    state: PlaygroundState,
    canvas: HTMLCanvasElement,
    config: Partial<VisualizerConfig> = {}
  ) {
    this.state = state;
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  start(): void {
    if (this.isRunning) return;
    if (!this.ctx) {
      console.warn('[Contour] Cannot start visualization: no canvas context');
      return;
    }

    console.log('[Contour] Starting piano roll visualization');
    this.isRunning = true;
    this.draw();
  }

  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  private draw = (): void => {
    if (!this.isRunning) return;

    this.animationFrameId = requestAnimationFrame(this.draw);

    if (!this.ctx) return;

    const { octaves, lowestNote, noteColors } = this.config;
    const totalNotes = octaves * 12 + 1;
    const noteHeight = this.canvas.height / totalNotes;

    this.clearCanvas();
    this.drawGrid(totalNotes, noteHeight);

    const maxPatternLengthBeats = this.getMaxPatternLength();
    const pixelsPerBeat = this.canvas.width / maxPatternLengthBeats;

    // Always draw notes if there are active patterns (even when paused)
    this.drawNotes(
      lowestNote,
      totalNotes,
      noteHeight,
      pixelsPerBeat,
      noteColors
    );

    // Only draw playhead when playing
    if (this.state.isPlaying) {
      const currentBeat = this.getCurrentBeat();
      this.drawPlayhead(currentBeat, maxPatternLengthBeats, pixelsPerBeat);
    }
  };

  private clearCanvas(): void {
    if (!this.ctx) return;
    this.ctx.fillStyle = '#0a0a0b';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawGrid(totalNotes: number, noteHeight: number): void {
    if (!this.ctx) return;

    const { octaves } = this.config;

    // Draw octave lines
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 1;
    for (let i = 0; i <= octaves; i++) {
      const y = i * 12 * noteHeight;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.canvas.width, y);
      this.ctx.stroke();
    }

    // Draw beat lines
    const timeScale = 60;
    const beatsToShow = Math.ceil(this.canvas.width / timeScale);
    for (let i = 0; i <= beatsToShow; i++) {
      const x = i * timeScale;
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.canvas.height);
      this.ctx.stroke();
    }
  }

  private getCurrentBeat(): number {
    return Tone.Transport.seconds * (this.state.bpm / 60);
  }

  private getMaxPatternLength(): number {
    let maxPatternLengthBeats = 4;

    this.state.pads.forEach((pad) => {
      if (!pad.isActive || !pad.pattern || pad.pattern.events.length === 0) {
        return;
      }

      const lastEvent = pad.pattern.events[pad.pattern.events.length - 1];
      const patternEndBeats =
        (lastEvent.time + lastEvent.duration) * (this.state.bpm / 60);
      maxPatternLengthBeats = Math.max(maxPatternLengthBeats, patternEndBeats);
    });

    return maxPatternLengthBeats;
  }

  private drawPlayhead(
    currentBeat: number,
    maxPatternLengthBeats: number,
    pixelsPerBeat: number
  ): void {
    if (!this.ctx) return;

    const playheadX =
      (currentBeat % maxPatternLengthBeats) * pixelsPerBeat;
    this.ctx.strokeStyle = '#00fff5';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(playheadX, 0);
    this.ctx.lineTo(playheadX, this.canvas.height);
    this.ctx.stroke();
  }

  private drawNotes(
    lowestNote: number,
    totalNotes: number,
    noteHeight: number,
    pixelsPerBeat: number,
    colors: string[]
  ): void {
    if (!this.ctx) return;

    let colorIndex = 0;
    const maxPatternLengthBeats = this.getMaxPatternLength();

    this.state.pads.forEach((pad) => {
      if (!pad.isActive || !pad.pattern) return;

      const color = colors[colorIndex % colors.length];
      colorIndex++;

      // Calculate pattern length in beats for this pad
      const patternLengthSeconds = this.getPatternLengthSeconds(pad.pattern);
      const patternLengthBeats = patternLengthSeconds * (this.state.bpm / 60);

      // Calculate how many times the pattern repeats in the visible area
      const numRepeats = Math.ceil(maxPatternLengthBeats / patternLengthBeats);

      // Draw pattern for each repeat
      for (let repeat = 0; repeat < numRepeats; repeat++) {
        const repeatOffsetBeats = repeat * patternLengthBeats;

        pad.pattern.events.forEach((event) => {
          if (event.type === 'rest') return;

          const notes = event.type === 'note' ? [event.note] : event.notes;

          notes.forEach((note) => {
            const midi = note.pitch;
            if (midi < lowestNote || midi >= lowestNote + totalNotes) return;

            const noteIndex = midi - lowestNote;
            const y = (totalNotes - noteIndex - 1) * noteHeight;

            const eventStartBeat = event.time * (this.state.bpm / 60) + repeatOffsetBeats;
            const eventDurationBeats = event.duration * (this.state.bpm / 60);

            const x = eventStartBeat * pixelsPerBeat;
            const width = eventDurationBeats * pixelsPerBeat;

            this.ctx!.fillStyle = color;
            this.ctx!.fillRect(x, y, Math.max(width, 2), noteHeight - 1);
          });
        });
      }
    });
  }

  private getPatternLengthSeconds(pattern: {
    events: Array<{ time: number; duration: number }>;
  }): number {
    if (pattern.events.length === 0) return 2; // Default 2 seconds

    let maxTime = 0;
    pattern.events.forEach((event) => {
      const eventEnd = event.time + event.duration;
      if (eventEnd > maxTime) {
        maxTime = eventEnd;
      }
    });

    return maxTime || 2;
  }
}
