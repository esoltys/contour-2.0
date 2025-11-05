import * as Tone from 'tone';

/**
 * Handles hot module replacement without audio glitches.
 *
 * CRITICAL: Fades audio out BEFORE accepting HMR update to prevent
 * clicks, pops, and audio glitches during code reload.
 */
export class HMRHandler {
  private fadeTime: number;
  private wasPlaying: boolean = false;

  /**
   * @param fadeTime - Fade duration in seconds (default: 0.3s)
   */
  constructor(fadeTime: number = 0.3) {
    this.fadeTime = fadeTime;
  }

  /**
   * Prepare for module reload by fading out audio gracefully.
   *
   * Call this BEFORE accepting the HMR update:
   * ```typescript
   * if (import.meta.hot) {
   *   import.meta.hot.accept(async () => {
   *     await hmrHandler.prepareReload();
   *     // Module will reload here
   *   });
   * }
   * ```
   */
  async prepareReload(): Promise<void> {
    const master = Tone.getDestination();

    // Remember if transport was playing
    this.wasPlaying = Tone.Transport.state === 'started';

    // Fade out over fadeTime (convert seconds to ms for setTimeout)
    master.volume.rampTo(-60, this.fadeTime);

    // Wait for fade to complete
    await new Promise(resolve => setTimeout(resolve, this.fadeTime * 1000));

    // Stop transport cleanly after fade
    if (this.wasPlaying) {
      Tone.Transport.stop();
    }

    // Cancel all scheduled events
    Tone.Transport.cancel();
  }

  /**
   * Restore audio after reload by fading in.
   *
   * Call this AFTER the new module has been loaded and set up:
   * ```typescript
   * if (import.meta.hot) {
   *   import.meta.hot.accept(async () => {
   *     await hmrHandler.prepareReload();
   *     // ... reload happens ...
   *     await hmrHandler.afterReload();
   *   });
   * }
   * ```
   */
  async afterReload(): Promise<void> {
    const master = Tone.getDestination();

    // Fade back in
    master.volume.rampTo(0, this.fadeTime);

    // Restart transport if it was playing before
    if (this.wasPlaying) {
      Tone.Transport.start();
    }

    // Wait for fade to complete
    await new Promise(resolve => setTimeout(resolve, this.fadeTime * 1000));
  }

  /**
   * Emergency stop - immediately stop audio without fade.
   * Use this only for error conditions.
   */
  emergencyStop(): void {
    Tone.Transport.stop();
    Tone.Transport.cancel();
    const master = Tone.getDestination();
    master.volume.value = -60;
  }
}
