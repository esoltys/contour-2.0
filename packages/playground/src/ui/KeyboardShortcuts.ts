/**
 * Keyboard Shortcuts Overlay - Help modal showing all keyboard commands
 *
 * Press '?' to show shortcuts
 * Lists all keyboard commands with descriptions
 * Modal overlay, dismissible
 */

export interface ShortcutDefinition {
  key: string;
  description: string;
  category: string;
}

export class KeyboardShortcuts {
  private modal: HTMLDivElement | null = null;
  private shortcuts: ShortcutDefinition[] = [];

  constructor() {
    this.initializeShortcuts();
  }

  private initializeShortcuts(): void {
    this.shortcuts = [
      // Transport
      { key: 'Space', description: 'Play/Pause', category: 'Transport' },
      { key: 'Esc', description: 'Stop All', category: 'Transport' },

      // Pattern Grid
      { key: '1-4, Q-R, A-F, Z-V', description: 'Trigger pads', category: 'Pattern Grid' },
      { key: 'Shift + Pad Key', description: 'Edit pattern', category: 'Pattern Grid' },
      { key: 'I', description: 'Select instrument for pad', category: 'Pattern Grid' },
      { key: 'Shift + S', description: 'Toggle samples/synths', category: 'Pattern Grid' },

      // Debug Tools
      { key: 'Cmd/Ctrl + D', description: 'Toggle debug panel', category: 'Debug Tools' },
      { key: 'Cmd/Ctrl + K', description: 'Open playground', category: 'Debug Tools' },
      { key: 'Cmd/Ctrl + Shift + I', description: 'Inspect selected pattern', category: 'Debug Tools' },
      { key: 'L', description: 'Toggle sample library panel', category: 'Debug Tools' },
      { key: '?', description: 'Show keyboard shortcuts', category: 'Debug Tools' },

      // Editor
      { key: 'Cmd/Ctrl + Enter', description: 'Run/Apply code', category: 'Editor' },
      { key: 'Esc', description: 'Close modal', category: 'Editor' }
    ];
  }

  public show(): void {
    if (!this.modal) {
      this.createModal();
    }

    if (this.modal) {
      this.modal.classList.add('active');
    }
  }

  public hide(): void {
    if (this.modal) {
      this.modal.classList.remove('active');
    }
  }

  public toggle(): void {
    if (this.isVisible()) {
      this.hide();
    } else {
      this.show();
    }
  }

  public isVisible(): boolean {
    return this.modal?.classList.contains('active') ?? false;
  }

  private createModal(): void {
    this.modal = document.createElement('div');
    this.modal.className = 'shortcuts-modal modal';
    this.modal.id = 'shortcuts-modal';

    const content = document.createElement('div');
    content.className = 'modal-content shortcuts-content';

    // Header
    const header = document.createElement('div');
    header.className = 'modal-header';

    const title = document.createElement('h3');
    title.className = 'modal-title';
    title.textContent = '⌨️ Keyboard Shortcuts';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.innerHTML = '×';
    closeBtn.addEventListener('click', () => this.hide());

    header.appendChild(title);
    header.appendChild(closeBtn);
    content.appendChild(header);

    // Body
    const body = document.createElement('div');
    body.className = 'modal-body shortcuts-body';

    // Group shortcuts by category
    const categories = this.groupByCategory();

    categories.forEach(({ category, shortcuts }) => {
      const section = document.createElement('div');
      section.className = 'shortcuts-section';

      const categoryTitle = document.createElement('h4');
      categoryTitle.className = 'shortcuts-category';
      categoryTitle.textContent = category;
      section.appendChild(categoryTitle);

      const shortcutsList = document.createElement('div');
      shortcutsList.className = 'shortcuts-list';

      shortcuts.forEach(shortcut => {
        const item = document.createElement('div');
        item.className = 'shortcut-item';

        const keys = document.createElement('div');
        keys.className = 'shortcut-keys';

        // Parse and render key combinations
        const keyParts = shortcut.key.split(/(?:\s*\+\s*)/);
        keyParts.forEach((part, index) => {
          const kbd = document.createElement('kbd');
          kbd.textContent = part.trim();
          keys.appendChild(kbd);

          if (index < keyParts.length - 1) {
            keys.appendChild(document.createTextNode(' + '));
          }
        });

        const desc = document.createElement('div');
        desc.className = 'shortcut-description';
        desc.textContent = shortcut.description;

        item.appendChild(keys);
        item.appendChild(desc);
        shortcutsList.appendChild(item);
      });

      section.appendChild(shortcutsList);
      body.appendChild(section);
    });

    content.appendChild(body);

    // Footer
    const footer = document.createElement('div');
    footer.className = 'modal-footer';

    const hint = document.createElement('div');
    hint.className = 'shortcuts-footer-hint';
    hint.innerHTML = 'Press <kbd>?</kbd> or <kbd>Esc</kbd> to close this dialog';

    footer.appendChild(hint);
    content.appendChild(footer);

    this.modal.appendChild(content);
    document.body.appendChild(this.modal);

    // Close on background click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    });

    // Close on Esc key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal?.classList.contains('active')) {
        this.hide();
      }
    });
  }

  private groupByCategory(): Array<{ category: string; shortcuts: ShortcutDefinition[] }> {
    const grouped = new Map<string, ShortcutDefinition[]>();

    this.shortcuts.forEach(shortcut => {
      const existing = grouped.get(shortcut.category) || [];
      existing.push(shortcut);
      grouped.set(shortcut.category, existing);
    });

    return Array.from(grouped.entries()).map(([category, shortcuts]) => ({
      category,
      shortcuts
    }));
  }

  public dispose(): void {
    this.modal?.remove();
  }
}
