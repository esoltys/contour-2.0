/**
 * Pattern Playground - Interactive pattern testing modal
 *
 * Features:
 * - Monaco editor with TypeScript support
 * - Code template pre-filled
 * - "Run" button (Cmd+Enter)
 * - Shows Pattern.inspect() results
 * - "Add to Grid" button (saves to performance grid)
 * - Error display with line numbers
 */

import loader from '@monaco-editor/loader';
import type * as Monaco from 'monaco-editor';
import { pattern, type Pattern } from '@contour/core';

export interface PlaygroundConfig {
  onAddToGrid?: (code: string, patternInstance: Pattern) => void;
  onClose?: () => void;
}

export class PatternPlayground {
  private modal: HTMLDivElement | null = null;
  private monaco: typeof Monaco | null = null;
  private editor: Monaco.editor.IStandaloneCodeEditor | null = null;
  private config: PlaygroundConfig;
  private currentPattern: Pattern | null = null;

  private readonly DEFAULT_TEMPLATE = `pattern()
  .note('C4')
  .note('E4')
  .note('G4')
  .note('C5')`;

  constructor(config: PlaygroundConfig = {}) {
    this.config = config;
  }

  public async show(): Promise<void> {
    if (!this.modal) {
      await this.createModal();
    }

    if (this.modal) {
      this.modal.classList.add('active');
      this.editor?.focus();
    }
  }

  public hide(): void {
    if (this.modal) {
      this.modal.classList.remove('active');
      this.config.onClose?.();
    }
  }

  public isVisible(): boolean {
    return this.modal?.classList.contains('active') ?? false;
  }

  private async createModal(): Promise<void> {
    // Create modal container
    this.modal = document.createElement('div');
    this.modal.className = 'playground-modal modal';
    this.modal.id = 'playground-modal';

    const content = document.createElement('div');
    content.className = 'modal-content playground-content';

    // Header
    const header = this.createHeader();
    content.appendChild(header);

    // Body
    const body = this.createBody();
    content.appendChild(body);

    // Footer
    const footer = this.createFooter();
    content.appendChild(footer);

    this.modal.appendChild(content);
    document.body.appendChild(this.modal);

    // Initialize Monaco
    await this.initMonaco();

    // Close on background click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });
  }

  private createHeader(): HTMLDivElement {
    const header = document.createElement('div');
    header.className = 'modal-header';

    const title = document.createElement('h3');
    title.className = 'modal-title';
    title.textContent = '🎵 Pattern Playground';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.innerHTML = '×';
    closeBtn.addEventListener('click', () => this.hide());

    header.appendChild(title);
    header.appendChild(closeBtn);

    return header;
  }

  private createBody(): HTMLDivElement {
    const body = document.createElement('div');
    body.className = 'modal-body playground-body';

    // Editor pane
    const editorPane = document.createElement('div');
    editorPane.className = 'playground-pane';

    const editorTitle = document.createElement('h4');
    editorTitle.textContent = 'Pattern Code';
    editorPane.appendChild(editorTitle);

    const editorContainer = document.createElement('div');
    editorContainer.id = 'playground-editor';
    editorContainer.className = 'playground-editor-container';
    editorPane.appendChild(editorContainer);

    // Results pane
    const resultsPane = document.createElement('div');
    resultsPane.className = 'playground-pane';

    const resultsTitle = document.createElement('h4');
    resultsTitle.textContent = 'Results';
    resultsPane.appendChild(resultsTitle);

    const resultsContainer = document.createElement('div');
    resultsContainer.id = 'playground-results';
    resultsContainer.className = 'playground-results-container';
    resultsContainer.innerHTML = '<div class="playground-hint">Press <kbd>Cmd/Ctrl+Enter</kbd> to run</div>';
    resultsPane.appendChild(resultsContainer);

    body.appendChild(editorPane);
    body.appendChild(resultsPane);

    return body;
  }

  private createFooter(): HTMLDivElement {
    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    const shortcutHint = document.createElement('div');
    shortcutHint.className = 'shortcut-hint';
    shortcutHint.innerHTML = 'Press <span class="shortcut-key">Cmd/Ctrl + Enter</span> to run';

    const actions = document.createElement('div');
    actions.className = 'modal-actions';

    const runBtn = document.createElement('button');
    runBtn.className = 'btn btn-primary';
    runBtn.textContent = '▶ Run';
    runBtn.addEventListener('click', () => this.runPattern());

    const addToGridBtn = document.createElement('button');
    addToGridBtn.className = 'btn btn-success';
    addToGridBtn.id = 'playground-add-to-grid';
    addToGridBtn.textContent = '+ Add to Grid';
    addToGridBtn.disabled = true;
    addToGridBtn.addEventListener('click', () => this.addToGrid());

    actions.appendChild(runBtn);
    actions.appendChild(addToGridBtn);

    footer.appendChild(shortcutHint);
    footer.appendChild(actions);

    return footer;
  }

  private async initMonaco(): Promise<void> {
    try {
      this.monaco = await loader.init();

      // Add TypeScript definitions
      this.monaco.languages.typescript.typescriptDefaults.addExtraLib(`
        import { PatternBuilder } from '@contour/core';
        declare function pattern(): PatternBuilder;
      `, 'ts:contour-runtime.d.ts');

      // Create editor
      const container = document.getElementById('playground-editor');
      if (!container) return;

      this.editor = this.monaco.editor.create(container, {
        value: this.DEFAULT_TEMPLATE,
        language: 'typescript',
        theme: 'vs-dark',
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        padding: { top: 16, bottom: 16 }
      });

      // Add keyboard shortcut for run (Cmd/Ctrl + Enter)
      this.editor.addCommand(
        this.monaco.KeyMod.CtrlCmd | this.monaco.KeyCode.Enter,
        () => this.runPattern()
      );

      console.log('[PatternPlayground] Monaco editor initialized');
    } catch (error) {
      console.error('[PatternPlayground] Failed to initialize Monaco:', error);
    }
  }

  private runPattern(): void {
    if (!this.editor) return;

    const code = this.editor.getValue();
    const resultsContainer = document.getElementById('playground-results');
    const addToGridBtn = document.getElementById('playground-add-to-grid') as HTMLButtonElement;

    if (!resultsContainer) return;

    try {
      // Compile pattern using Function constructor
      // SECURITY NOTE: This is intentionally using new Function() for a development-only
      // pattern playground. This allows dynamic code execution which is acceptable in a
      // local dev environment. Do NOT expose this to untrusted user input in production.
      const patternFunc = new Function('pattern', `return ${code}`);
      const builder = patternFunc(pattern);

      if (!builder || typeof builder.build !== 'function') {
        throw new Error('Code must return a PatternBuilder');
      }

      this.currentPattern = builder.build();

      // Show results
      resultsContainer.innerHTML = '';

      const successDiv = document.createElement('div');
      successDiv.className = 'playground-success';
      successDiv.innerHTML = '✅ Pattern compiled successfully!';
      resultsContainer.appendChild(successDiv);

      // Show pattern details (placeholder for Pattern.inspect())
      const detailsDiv = document.createElement('pre');
      detailsDiv.className = 'playground-pattern-details';

      try {
        const patternData = this.currentPattern as any;
        const events = patternData._events || patternData.events || [];

        let output = `Events: ${events.length}\n\n`;

        if (events.length > 0) {
          output += 'Preview:\n';
          events.slice(0, 10).forEach((event: any, index: number) => {
            const time = event.time || event.startTime || 0;
            const note = event.note || event.pitch || '?';
            const velocity = event.velocity || 0;
            output += `  ${index + 1}. ${time.toFixed(3)}s - ${note} (vel: ${velocity})\n`;
          });

          if (events.length > 10) {
            output += `  ... and ${events.length - 10} more events\n`;
          }
        }

        detailsDiv.textContent = output;
      } catch {
        detailsDiv.textContent = 'Pattern created (inspection requires Phase 8A)';
      }

      resultsContainer.appendChild(detailsDiv);

      // Enable "Add to Grid" button
      if (addToGridBtn) {
        addToGridBtn.disabled = false;
      }

    } catch (error) {
      // Show error
      this.currentPattern = null;

      resultsContainer.innerHTML = '';

      const errorDiv = document.createElement('div');
      errorDiv.className = 'playground-error';
      errorDiv.innerHTML = `<strong>❌ Error:</strong><br>${error instanceof Error ? error.message : 'Unknown error'}`;
      resultsContainer.appendChild(errorDiv);

      // Disable "Add to Grid" button
      if (addToGridBtn) {
        addToGridBtn.disabled = true;
      }
    }
  }

  private addToGrid(): void {
    if (!this.currentPattern || !this.editor) return;

    const code = this.editor.getValue();

    if (this.config.onAddToGrid) {
      this.config.onAddToGrid(code, this.currentPattern);
      this.hide();
    } else {
      alert('Add to Grid functionality not configured');
    }
  }

  public dispose(): void {
    this.editor?.dispose();
    this.modal?.remove();
  }
}
