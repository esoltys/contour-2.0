/**
 * Loading Progress - Visual progress indicator for loading operations
 *
 * Features:
 * - Progress bar with percentage
 * - Loading status text
 * - Error state display
 * - Success notification
 */

export class LoadingProgress {
  private container: HTMLDivElement | null = null;
  private progressBar: HTMLDivElement | null = null;
  private statusText: HTMLSpanElement | null = null;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    this.container = this.createContainer();
    document.body.appendChild(this.container);
  }

  private createContainer(): HTMLDivElement {
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.style.display = 'none';

    const progressContainer = document.createElement('div');
    progressContainer.className = 'progress-container';

    // Status text
    const statusText = document.createElement('div');
    statusText.className = 'progress-status';
    this.statusText = document.createElement('span');
    this.statusText.textContent = 'Loading...';
    statusText.appendChild(this.statusText);

    // Progress bar
    const progressBarOuter = document.createElement('div');
    progressBarOuter.className = 'progress-bar-outer';

    this.progressBar = document.createElement('div');
    this.progressBar.className = 'progress-bar-inner';
    this.progressBar.style.width = '0%';

    progressBarOuter.appendChild(this.progressBar);

    progressContainer.appendChild(statusText);
    progressContainer.appendChild(progressBarOuter);

    overlay.appendChild(progressContainer);

    return overlay;
  }

  /**
   * Show loading overlay with a message.
   */
  show(message: string = 'Loading...'): void {
    if (this.container && this.statusText) {
      this.statusText.textContent = message;
      this.container.style.display = 'flex';
      this.container.classList.remove('error', 'success');
      this.updateProgress(0, 100);
    }
  }

  /**
   * Update progress bar.
   * @param loaded - Number of items loaded
   * @param total - Total number of items
   */
  updateProgress(loaded: number, total: number): void {
    if (!this.progressBar || !this.statusText) return;

    const percent = total > 0 ? (loaded / total) * 100 : 0;
    this.progressBar.style.width = `${percent}%`;

    // Update text if showing loading
    if (this.container && !this.container.classList.contains('error')) {
      this.statusText.textContent = `Loading: ${loaded}/${total} instruments (${Math.round(percent)}%)`;
    }
  }

  /**
   * Hide the loading overlay.
   */
  hide(): void {
    if (this.container) {
      this.container.style.display = 'none';
      this.container.classList.remove('error', 'success');
    }
  }

  /**
   * Show error state.
   */
  showError(message: string): void {
    if (this.container && this.statusText) {
      this.container.classList.add('error');
      this.container.classList.remove('success');
      this.statusText.textContent = `Error: ${message}`;
    }
  }

  /**
   * Show success state and auto-hide after delay.
   */
  showSuccess(message: string = 'Loading complete!', autoHideMs: number = 2000): void {
    if (this.container && this.statusText && this.progressBar) {
      this.container.classList.add('success');
      this.container.classList.remove('error');
      this.statusText.textContent = message;
      this.progressBar.style.width = '100%';

      if (autoHideMs > 0) {
        setTimeout(() => this.hide(), autoHideMs);
      }
    }
  }

  /**
   * Check if loading overlay is visible.
   */
  isVisible(): boolean {
    return this.container?.style.display === 'flex';
  }

  dispose(): void {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
    this.progressBar = null;
    this.statusText = null;
  }
}
