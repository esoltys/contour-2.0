/**
 * Reusable Audio Controls Component
 *
 * Provides a consistent audio initialization and control interface
 * across all playground pages.
 */

import { Tone } from '@contour/tone-adapter';

export interface AudioControlsOptions {
  onAudioStarted?: () => void;
  onAudioStopped?: () => void;
  showStopButton?: boolean;
}

export class AudioControls {
  private container: HTMLElement;
  private startButton: HTMLButtonElement;
  private stopButton: HTMLButtonElement | null = null;
  private statusIndicator: HTMLSpanElement;
  private isReady: boolean = false;
  private options: AudioControlsOptions;

  constructor(containerId: string, options: AudioControlsOptions = {}) {
    this.options = {
      showStopButton: true,
      ...options
    };

    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container element with id "${containerId}" not found`);
    }
    this.container = container;

    this.render();
    this.startButton = this.container.querySelector('#startAudioBtn') as HTMLButtonElement;
    this.statusIndicator = this.container.querySelector('#audioStatus') as HTMLSpanElement;

    if (this.options.showStopButton) {
      this.stopButton = this.container.querySelector('#stopAllBtn') as HTMLButtonElement;
    }

    this.attachEventListeners();
  }

  private render(): void {
    const stopButtonHtml = this.options.showStopButton
      ? '<button id="stopAllBtn" class="btn btn-secondary">STOP ALL</button>'
      : '';

    this.container.innerHTML = `
      <div class="audio-controls-section">
        <h2>AUDIO CONTROLS</h2>
        <div class="audio-controls-buttons">
          <button id="startAudioBtn" class="btn btn-primary">START AUDIO CONTEXT</button>
          ${stopButtonHtml}
          <span id="audioStatus" class="status">Not Ready</span>
        </div>
      </div>
    `;
  }

  private attachEventListeners(): void {
    this.startButton.addEventListener('click', async () => {
      await this.startAudio();
    });

    if (this.stopButton) {
      this.stopButton.addEventListener('click', () => {
        this.stopAll();
      });
    }
  }

  private async startAudio(): Promise<void> {
    if (this.isReady) return;

    try {
      await Tone.start();
      this.isReady = true;

      this.startButton.disabled = true;
      this.startButton.textContent = 'AUDIO READY';

      this.statusIndicator.textContent = 'Ready';
      this.statusIndicator.className = 'status ready';

      if (this.options.onAudioStarted) {
        this.options.onAudioStarted();
      }
    } catch (error) {
      console.error('Failed to start audio context:', error);
      this.statusIndicator.textContent = 'Error';
      this.statusIndicator.className = 'status error';
    }
  }

  public stopAll(): void {
    Tone.Transport.stop();
    Tone.Transport.cancel();

    this.statusIndicator.textContent = 'Ready';
    this.statusIndicator.className = 'status ready';

    if (this.options.onAudioStopped) {
      this.options.onAudioStopped();
    }
  }

  public setPlaying(): void {
    this.statusIndicator.textContent = 'Playing';
    this.statusIndicator.className = 'status playing';
  }

  public setReady(): void {
    this.statusIndicator.textContent = 'Ready';
    this.statusIndicator.className = 'status ready';
  }

  public getIsReady(): boolean {
    return this.isReady;
  }

  public getTone(): typeof Tone {
    return Tone;
  }
}
