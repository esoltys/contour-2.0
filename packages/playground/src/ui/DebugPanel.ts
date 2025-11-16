/**
 * Debug Panel - Main container for development debugging tools
 *
 * Provides tabs for:
 * - Transport Inspector
 * - Pattern Inspector
 * - Performance Monitor
 * - Console Log
 */

import { TransportInspector } from './TransportInspector.js';
import { PatternInspector } from './PatternInspector.js';
import { PerformanceMonitor } from './PerformanceMonitor.js';
import { ConsoleLog } from './ConsoleLog.js';

export type DebugPanelTab = 'transport' | 'patterns' | 'performance' | 'console';

export interface DebugPanelConfig {
  initialTab?: DebugPanelTab;
  position?: 'bottom' | 'right';
  visible?: boolean;
}

export class DebugPanel {
  private container: HTMLDivElement;
  private header: HTMLDivElement;
  private tabsContainer: HTMLDivElement;
  private contentContainer: HTMLDivElement;
  private currentTab: DebugPanelTab;
  private isVisible: boolean;
  private position: 'bottom' | 'right';

  // Tab components
  private transportInspector: TransportInspector;
  private patternInspector: PatternInspector;
  private performanceMonitor: PerformanceMonitor;
  private consoleLog: ConsoleLog;

  constructor(config: DebugPanelConfig = {}) {
    this.currentTab = config.initialTab || 'transport';
    this.position = config.position || 'bottom';
    this.isVisible = config.visible || false;

    // Create container
    this.container = this.createContainer();
    this.header = this.createHeader();
    this.tabsContainer = this.createTabs();
    this.contentContainer = this.createContent();

    // Initialize tab components
    this.transportInspector = new TransportInspector();
    this.patternInspector = new PatternInspector();
    this.performanceMonitor = new PerformanceMonitor();
    this.consoleLog = new ConsoleLog();

    // Assemble the panel
    this.container.appendChild(this.header);
    this.container.appendChild(this.tabsContainer);
    this.container.appendChild(this.contentContainer);

    // Add to DOM
    document.body.appendChild(this.container);

    // Load settings from localStorage
    this.loadSettings();

    // Show initial tab
    this.switchTab(this.currentTab);

    // Apply visibility
    if (this.isVisible) {
      this.show();
    }
  }

  private createContainer(): HTMLDivElement {
    const div = document.createElement('div');
    div.id = 'debug-panel';
    div.className = `debug-panel debug-panel-${this.position}`;
    div.style.display = 'none'; // Hidden by default
    return div;
  }

  private createHeader(): HTMLDivElement {
    const header = document.createElement('div');
    header.className = 'debug-panel-header';

    const title = document.createElement('div');
    title.className = 'debug-panel-title';
    title.textContent = '🔧 Debug Tools';

    const actions = document.createElement('div');
    actions.className = 'debug-panel-actions';

    // Position toggle button
    const positionBtn = document.createElement('button');
    positionBtn.className = 'debug-panel-btn';
    positionBtn.innerHTML = this.position === 'bottom' ? '⇄' : '⇅';
    positionBtn.title = 'Toggle position';
    positionBtn.addEventListener('click', () => this.togglePosition());

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'debug-panel-btn';
    closeBtn.innerHTML = '×';
    closeBtn.title = 'Close (Cmd+D)';
    closeBtn.addEventListener('click', () => this.hide());

    actions.appendChild(positionBtn);
    actions.appendChild(closeBtn);

    header.appendChild(title);
    header.appendChild(actions);

    return header;
  }

  private createTabs(): HTMLDivElement {
    const container = document.createElement('div');
    container.className = 'debug-panel-tabs';

    const tabs: Array<{ id: DebugPanelTab; label: string; icon: string }> = [
      { id: 'transport', label: 'Transport', icon: '⏯' },
      { id: 'patterns', label: 'Patterns', icon: '🎵' },
      { id: 'performance', label: 'Performance', icon: '📊' },
      { id: 'console', label: 'Console', icon: '📝' }
    ];

    tabs.forEach(tab => {
      const button = document.createElement('button');
      button.className = 'debug-panel-tab';
      button.dataset.tab = tab.id;
      button.innerHTML = `<span class="tab-icon">${tab.icon}</span> ${tab.label}`;
      button.addEventListener('click', () => this.switchTab(tab.id));
      container.appendChild(button);
    });

    return container;
  }

  private createContent(): HTMLDivElement {
    const div = document.createElement('div');
    div.className = 'debug-panel-content';
    return div;
  }

  private switchTab(tabId: DebugPanelTab): void {
    // Stop updates for previous tab
    this.stopUpdates();

    this.currentTab = tabId;

    // Update tab buttons
    const tabs = this.tabsContainer.querySelectorAll('.debug-panel-tab');
    tabs.forEach(tab => {
      if (tab.getAttribute('data-tab') === tabId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Clear content
    this.contentContainer.innerHTML = '';

    // Show selected tab content
    let component: TransportInspector | PatternInspector | PerformanceMonitor | ConsoleLog;
    switch (tabId) {
      case 'transport':
        component = this.transportInspector;
        break;
      case 'patterns':
        component = this.patternInspector;
        break;
      case 'performance':
        component = this.performanceMonitor;
        break;
      case 'console':
        component = this.consoleLog;
        break;
    }

    this.contentContainer.appendChild(component.render());

    // Start updates for new tab (if panel is visible)
    if (this.isVisible) {
      this.startUpdates();
    }

    // Save to localStorage
    this.saveSettings();
  }

  private togglePosition(): void {
    this.position = this.position === 'bottom' ? 'right' : 'bottom';
    this.container.className = `debug-panel debug-panel-${this.position}`;

    // Update button icon
    const positionBtn = this.header.querySelector('.debug-panel-btn') as HTMLButtonElement;
    if (positionBtn) {
      positionBtn.innerHTML = this.position === 'bottom' ? '⇄' : '⇅';
    }

    this.saveSettings();
  }

  public show(): void {
    this.isVisible = true;
    this.container.style.display = 'flex';
    this.saveSettings();

    // Start updates for active tab
    this.startUpdates();
  }

  public hide(): void {
    this.isVisible = false;
    this.container.style.display = 'none';
    this.saveSettings();

    // Stop updates
    this.stopUpdates();
  }

  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  private startUpdates(): void {
    // Each component manages its own update intervals
    if (this.currentTab === 'transport') {
      this.transportInspector.startUpdates();
    } else if (this.currentTab === 'performance') {
      this.performanceMonitor.startUpdates();
    }
  }

  private stopUpdates(): void {
    this.transportInspector.stopUpdates();
    this.performanceMonitor.stopUpdates();
  }

  private saveSettings(): void {
    const settings = {
      visible: this.isVisible,
      position: this.position,
      currentTab: this.currentTab
    };
    localStorage.setItem('contour-debug-panel', JSON.stringify(settings));
  }

  private loadSettings(): void {
    const stored = localStorage.getItem('contour-debug-panel');
    if (stored) {
      try {
        const settings = JSON.parse(stored);

        // Validate and apply settings with type guards
        if (this.isValidSettings(settings)) {
          this.isVisible = settings.visible;
          this.position = settings.position;
          this.currentTab = settings.currentTab;
          this.container.className = `debug-panel debug-panel-${this.position}`;
        } else {
          console.warn('[DebugPanel] Invalid settings format, using defaults');
        }
      } catch (e) {
        console.error('[DebugPanel] Failed to load settings:', e);
      }
    }
  }

  private isValidSettings(settings: unknown): settings is {
    visible: boolean;
    position: 'bottom' | 'right';
    currentTab: DebugPanelTab;
  } {
    if (typeof settings !== 'object' || settings === null) {
      return false;
    }

    const obj = settings as Record<string, unknown>;

    // Validate visible
    if (typeof obj.visible !== 'boolean') {
      return false;
    }

    // Validate position
    if (obj.position !== 'bottom' && obj.position !== 'right') {
      return false;
    }

    // Validate currentTab
    const validTabs: DebugPanelTab[] = ['transport', 'patterns', 'performance', 'console'];
    if (typeof obj.currentTab !== 'string' || !validTabs.includes(obj.currentTab as DebugPanelTab)) {
      return false;
    }

    return true;
  }

  /**
   * Get the PatternInspector component for registering/updating patterns.
   */
  public getPatternInspector(): PatternInspector {
    return this.patternInspector;
  }

  public dispose(): void {
    this.stopUpdates();
    this.container.remove();
  }
}
