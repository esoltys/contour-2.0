/**
 * Console Log - Display DEBUG logs in UI
 *
 * Features:
 * - Color-coded by level (info/warn/error)
 * - Search/filter functionality
 * - Copy log button
 * - Clear button
 * - Auto-scroll toggle
 */

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  category: string;
  message: string;
}

/**
 * Type guard to check if a value is an object (non-null, non-array)
 */
function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Safely convert unknown value to string representation
 */
function formatUnknownValue(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (value === undefined) {
    return 'undefined';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (typeof value === 'symbol') {
    return value.toString();
  }
  if (typeof value === 'bigint') {
    return value.toString();
  }
  if (typeof value === 'function') {
    return `[Function: ${value.name || 'anonymous'}]`;
  }
  if (Array.isArray(value)) {
    try {
      return JSON.stringify(value);
    } catch {
      return '[Array]';
    }
  }
  if (isObject(value)) {
    try {
      return JSON.stringify(value);
    } catch {
      return '[Object]';
    }
  }
  return String(value);
}

export class ConsoleLog {
  private container: HTMLDivElement | null = null;
  private logContainer: HTMLDivElement | null = null;
  private logs: LogEntry[] = [];
  private filteredLogs: LogEntry[] = [];
  private autoScroll = true;
  private filterText = '';
  private filterLevel: LogLevel | 'all' = 'all';
  private maxLogs = 1000;

  constructor() {
    // Intercept console methods
    this.interceptConsole();
  }

  public render(): HTMLDivElement {
    this.container = document.createElement('div');
    this.container.className = 'console-log';

    // Controls
    const controls = this.createControls();
    this.container.appendChild(controls);

    // Log container
    this.logContainer = document.createElement('div');
    this.logContainer.className = 'console-log-container';
    this.logContainer.id = 'console-log-container';
    this.container.appendChild(this.logContainer);

    // Render initial logs
    this.renderLogs();

    return this.container;
  }

  private createControls(): HTMLDivElement {
    const controls = document.createElement('div');
    controls.className = 'console-controls';

    // Level filter
    const levelFilter = document.createElement('select');
    levelFilter.className = 'console-filter-select';
    levelFilter.innerHTML = `
      <option value="all">All Levels</option>
      <option value="debug">Debug</option>
      <option value="info">Info</option>
      <option value="warn">Warn</option>
      <option value="error">Error</option>
    `;
    levelFilter.addEventListener('change', (e) => {
      this.filterLevel = (e.target as HTMLSelectElement).value as LogLevel | 'all';
      this.applyFilters();
    });

    // Search input
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.className = 'console-search-input';
    searchInput.placeholder = 'Search logs...';
    searchInput.addEventListener('input', (e) => {
      this.filterText = (e.target as HTMLInputElement).value.toLowerCase();
      this.applyFilters();
    });

    // Auto-scroll toggle
    const autoScrollLabel = document.createElement('label');
    autoScrollLabel.className = 'console-autoscroll-label';

    const autoScrollCheck = document.createElement('input');
    autoScrollCheck.type = 'checkbox';
    autoScrollCheck.checked = this.autoScroll;
    autoScrollCheck.addEventListener('change', (e) => {
      this.autoScroll = (e.target as HTMLInputElement).checked;
    });

    autoScrollLabel.appendChild(autoScrollCheck);
    autoScrollLabel.appendChild(document.createTextNode(' Auto-scroll'));

    // Copy button
    const copyBtn = document.createElement('button');
    copyBtn.className = 'btn btn-secondary btn-small';
    copyBtn.textContent = '📋 Copy';
    copyBtn.addEventListener('click', () => this.copyLogs());

    // Clear button
    const clearBtn = document.createElement('button');
    clearBtn.className = 'btn btn-danger btn-small';
    clearBtn.textContent = 'Clear';
    clearBtn.addEventListener('click', () => this.clearLogs());

    controls.appendChild(levelFilter);
    controls.appendChild(searchInput);
    controls.appendChild(autoScrollLabel);
    controls.appendChild(copyBtn);
    controls.appendChild(clearBtn);

    return controls;
  }

  private interceptConsole(): void {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;
    const originalDebug = console.debug;

    console.log = (...args: unknown[]) => {
      this.addLog('info', args);
      originalLog.apply(console, args);
    };

    console.warn = (...args: unknown[]) => {
      this.addLog('warn', args);
      originalWarn.apply(console, args);
    };

    console.error = (...args: unknown[]) => {
      this.addLog('error', args);
      originalError.apply(console, args);
    };

    // Intercept debug if it exists (it should in modern browsers)
    if (originalDebug) {
      console.debug = (...args: unknown[]) => {
        this.addLog('debug', args);
        originalDebug.apply(console, args);
      };
    }
  }

  private addLog(level: LogLevel, args: unknown[]): void {
    const message = args.map((arg) => formatUnknownValue(arg)).join(' ');

    // Try to parse structured logs from Logger (format: "[timestamp] [contour:category] [LEVEL] message")
    const structuredMatch = message.match(
      /^\[([^\]]+)\] \[contour:([^\]]+)\] \[([^\]]+)\] (.+)$/
    );

    let category: string;
    let parsedLevel: LogLevel;
    let parsedMessage: string;
    let timestamp: number;

    if (structuredMatch) {
      // This is a structured log from the Logger system
      timestamp = new Date(structuredMatch[1]).getTime();
      category = structuredMatch[2];
      parsedLevel = structuredMatch[3].toLowerCase() as LogLevel;
      parsedMessage = structuredMatch[4];
    } else {
      // Regular console log - try to extract category from [Category] format
      timestamp = Date.now();
      const categoryMatch = message.match(/^\[([^\]]+)\]/);
      category = categoryMatch ? categoryMatch[1] : 'General';
      parsedLevel = level;
      parsedMessage = message;
    }

    const entry: LogEntry = {
      timestamp,
      level: parsedLevel,
      category,
      message: parsedMessage,
    };

    this.logs.push(entry);

    // Limit log size
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Apply filters and re-render
    this.applyFilters();
  }

  private applyFilters(): void {
    this.filteredLogs = this.logs.filter((log) => {
      // Level filter
      if (this.filterLevel !== 'all' && log.level !== this.filterLevel) {
        return false;
      }

      // Text filter
      if (this.filterText) {
        const searchText = `${log.category} ${log.message}`.toLowerCase();
        if (!searchText.includes(this.filterText)) {
          return false;
        }
      }

      return true;
    });

    this.renderLogs();
  }

  private renderLogs(): void {
    if (!this.logContainer) return;

    // Clear container
    this.logContainer.innerHTML = '';

    if (this.filteredLogs.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'console-empty';
      empty.textContent = this.logs.length === 0 ? 'No logs yet' : 'No logs match filters';
      this.logContainer.appendChild(empty);
      return;
    }

    // Render logs
    this.filteredLogs.forEach((log) => {
      const logElement = this.createLogElement(log);
      this.logContainer!.appendChild(logElement);
    });

    // Auto-scroll to bottom
    if (this.autoScroll) {
      this.logContainer.scrollTop = this.logContainer.scrollHeight;
    }
  }

  private createLogElement(log: LogEntry): HTMLDivElement {
    const element = document.createElement('div');
    element.className = `console-log-entry console-log-${log.level}`;

    const time = new Date(log.timestamp);
    const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}:${time.getSeconds().toString().padStart(2, '0')}.${time.getMilliseconds().toString().padStart(3, '0')}`;

    const timestamp = document.createElement('span');
    timestamp.className = 'console-log-timestamp';
    timestamp.textContent = timeStr;

    const level = document.createElement('span');
    level.className = 'console-log-level';
    level.textContent = log.level.toUpperCase();

    const category = document.createElement('span');
    category.className = 'console-log-category';
    category.textContent = log.category;

    const message = document.createElement('span');
    message.className = 'console-log-message';
    message.textContent = log.message;

    element.appendChild(timestamp);
    element.appendChild(level);
    element.appendChild(category);
    element.appendChild(message);

    return element;
  }

  private copyLogs(): void {
    const text = this.filteredLogs
      .map((log) => {
        const time = new Date(log.timestamp).toISOString();
        return `${time} [${log.level.toUpperCase()}] [${log.category}] ${log.message}`;
      })
      .join('\n');

    navigator.clipboard
      .writeText(text)
      .then(() => {
        alert('Logs copied to clipboard!');
      })
      .catch((err: unknown) => {
        console.error('[ConsoleLog] Failed to copy:', err);
        alert('Failed to copy to clipboard');
      });
  }

  private clearLogs(): void {
    if (confirm('Clear all logs?')) {
      this.logs = [];
      this.filteredLogs = [];
      this.renderLogs();
    }
  }
}
