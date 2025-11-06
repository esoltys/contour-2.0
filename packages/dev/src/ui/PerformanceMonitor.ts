/**
 * Performance Monitor - Real-time performance metrics
 *
 * Displays:
 * - FPS (should stay at 60)
 * - AudioNode count
 * - Active voices
 * - CPU usage estimate
 * - Memory (if available)
 * - Graphs showing last 60 seconds
 * - Color-coded thresholds (green/yellow/red)
 */

import { Tone } from '@contour/tone-adapter';

interface PerformanceMetrics {
  fps: number;
  audioNodes: number;
  activeVoices: number;
  cpuUsage: number;
  memory: number | null;
}

export class PerformanceMonitor {
  private container: HTMLDivElement | null = null;
  private updateInterval: number | null = null;
  private fpsHistory: number[] = [];
  private cpuHistory: number[] = [];
  private lastFrameTime = performance.now();
  private frameCount = 0;
  private canvas: HTMLCanvasElement | null = null;

  private readonly HISTORY_LENGTH = 60; // 60 seconds of history
  private readonly WARNING_THRESHOLD = 0.7;
  private readonly DANGER_THRESHOLD = 0.9;

  public render(): HTMLDivElement {
    this.container = document.createElement('div');
    this.container.className = 'performance-monitor';

    // Metrics grid
    const metricsSection = this.createMetricsSection();
    this.container.appendChild(metricsSection);

    // Graphs
    const graphSection = this.createGraphSection();
    this.container.appendChild(graphSection);

    // Warnings
    const warningsSection = this.createWarningsSection();
    this.container.appendChild(warningsSection);

    return this.container;
  }

  private createMetricsSection(): HTMLDivElement {
    const section = document.createElement('div');
    section.className = 'inspector-section';

    const title = document.createElement('h4');
    title.textContent = 'Real-time Metrics';
    section.appendChild(title);

    const metricsGrid = document.createElement('div');
    metricsGrid.className = 'metrics-grid';

    const metrics = [
      { id: 'perf-fps', label: 'FPS', value: '60', unit: '', threshold: 60 },
      { id: 'perf-nodes', label: 'Audio Nodes', value: '0', unit: '', threshold: 100 },
      { id: 'perf-voices', label: 'Active Voices', value: '0', unit: '', threshold: 16 },
      { id: 'perf-cpu', label: 'CPU Usage', value: '0', unit: '%', threshold: 70 },
      { id: 'perf-memory', label: 'Memory', value: 'N/A', unit: '', threshold: 100 }
    ];

    metrics.forEach(metric => {
      const itemDiv = document.createElement('div');
      itemDiv.className = 'metric-item';

      const label = document.createElement('div');
      label.className = 'metric-label';
      label.textContent = metric.label;

      const valueContainer = document.createElement('div');
      valueContainer.className = 'metric-value-container';

      const value = document.createElement('div');
      value.className = 'metric-value';
      value.id = metric.id;
      value.dataset.threshold = metric.threshold.toString();
      value.innerHTML = `${metric.value}<span class="metric-unit">${metric.unit}</span>`;

      valueContainer.appendChild(value);
      itemDiv.appendChild(label);
      itemDiv.appendChild(valueContainer);
      metricsGrid.appendChild(itemDiv);
    });

    section.appendChild(metricsGrid);
    return section;
  }

  private createGraphSection(): HTMLDivElement {
    const section = document.createElement('div');
    section.className = 'inspector-section';

    const title = document.createElement('h4');
    title.textContent = 'Performance History (60s)';
    section.appendChild(title);

    this.canvas = document.createElement('canvas');
    this.canvas.id = 'performance-graph-canvas';
    this.canvas.className = 'performance-graph-canvas';
    this.canvas.width = 600;
    this.canvas.height = 200;
    section.appendChild(this.canvas);

    return section;
  }

  private createWarningsSection(): HTMLDivElement {
    const section = document.createElement('div');
    section.className = 'inspector-section warnings-section';
    section.id = 'performance-warnings';
    section.style.display = 'none'; // Hidden by default

    const title = document.createElement('h4');
    title.textContent = '⚠️ Performance Warnings';
    section.appendChild(title);

    const warningsList = document.createElement('ul');
    warningsList.id = 'warnings-list';
    warningsList.className = 'warnings-list';
    section.appendChild(warningsList);

    return section;
  }

  public startUpdates(): void {
    // Update every second
    this.updateInterval = window.setInterval(() => {
      this.updateMetrics();
    }, 1000);

    // Start FPS counter
    this.startFPSCounter();

    // Initial update
    this.updateMetrics();
  }

  public stopUpdates(): void {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private startFPSCounter(): void {
    const updateFPS = () => {
      this.frameCount++;
      requestAnimationFrame(updateFPS);
    };
    requestAnimationFrame(updateFPS);
  }

  private calculateFPS(): number {
    const now = performance.now();
    const elapsed = (now - this.lastFrameTime) / 1000; // Convert to seconds

    if (elapsed >= 1) {
      const fps = this.frameCount / elapsed;
      this.frameCount = 0;
      this.lastFrameTime = now;
      return Math.round(fps);
    }

    return this.fpsHistory[this.fpsHistory.length - 1] || 60;
  }

  private updateMetrics(): void {
    const metrics = this.gatherMetrics();

    // Update FPS
    const fpsEl = document.getElementById('perf-fps');
    if (fpsEl) {
      fpsEl.innerHTML = `${metrics.fps}<span class="metric-unit"></span>`;
      this.setMetricStatus(fpsEl, metrics.fps, 60, true); // Inverted threshold (lower is worse)
    }

    // Update Audio Nodes
    const nodesEl = document.getElementById('perf-nodes');
    if (nodesEl) {
      nodesEl.innerHTML = `${metrics.audioNodes}<span class="metric-unit"></span>`;
      this.setMetricStatus(nodesEl, metrics.audioNodes, 100);
    }

    // Update Active Voices
    const voicesEl = document.getElementById('perf-voices');
    if (voicesEl) {
      voicesEl.innerHTML = `${metrics.activeVoices}<span class="metric-unit"></span>`;
      this.setMetricStatus(voicesEl, metrics.activeVoices, 16);
    }

    // Update CPU Usage
    const cpuEl = document.getElementById('perf-cpu');
    if (cpuEl) {
      cpuEl.innerHTML = `${metrics.cpuUsage}<span class="metric-unit">%</span>`;
      this.setMetricStatus(cpuEl, metrics.cpuUsage, 100);
    }

    // Update Memory
    const memEl = document.getElementById('perf-memory');
    if (memEl) {
      if (metrics.memory !== null) {
        const memMB = (metrics.memory / 1024 / 1024).toFixed(1);
        memEl.innerHTML = `${memMB}<span class="metric-unit">MB</span>`;
      } else {
        memEl.innerHTML = 'N/A';
      }
    }

    // Update history
    this.fpsHistory.push(metrics.fps);
    this.cpuHistory.push(metrics.cpuUsage);

    if (this.fpsHistory.length > this.HISTORY_LENGTH) {
      this.fpsHistory.shift();
    }
    if (this.cpuHistory.length > this.HISTORY_LENGTH) {
      this.cpuHistory.shift();
    }

    // Update graph
    this.drawGraph();

    // Check for warnings
    this.updateWarnings(metrics);
  }

  private gatherMetrics(): PerformanceMetrics {
    const fps = this.calculateFPS();

    // Count audio nodes (estimate)
    const context = Tone.getContext();
    const audioNodes = this.countAudioNodes();

    // Active voices (estimate based on Transport state)
    const activeVoices = this.estimateActiveVoices();

    // CPU usage estimate (based on audio context latency)
    const cpuUsage = this.estimateCPUUsage();

    // Memory (if available)
    const memory = (performance as any).memory?.usedJSHeapSize || null;

    return {
      fps,
      audioNodes,
      activeVoices,
      cpuUsage,
      memory
    };
  }

  private countAudioNodes(): number {
    // NOTE: This is an estimate as there's no direct API to count AudioNodes
    // In a real implementation with Phase 8A, we would track this properly
    try {
      const context = Tone.getContext() as any;
      // Try to access internal state (not reliable, but best we can do)
      return context._worklets?.length || 0;
    } catch {
      return 0;
    }
  }

  private estimateActiveVoices(): number {
    // Count currently playing synths/samplers
    // This would be tracked properly in Phase 8A
    return Tone.getTransport().state === 'started' ? 1 : 0;
  }

  private estimateCPUUsage(): number {
    const context = Tone.getContext();
    const rawContext = context.rawContext as AudioContext;

    // Use baseLatency and outputLatency as a proxy for CPU usage
    const baseLatency = rawContext.baseLatency || 0;
    const outputLatency = rawContext.outputLatency || 0;

    // Convert latency to rough CPU percentage (this is a rough estimate)
    const totalLatency = (baseLatency + outputLatency) * 1000; // Convert to ms
    const cpuEstimate = Math.min(100, totalLatency * 10); // Scale to percentage

    return Math.round(cpuEstimate);
  }

  private setMetricStatus(element: HTMLElement, value: number, threshold: number, inverted = false): void {
    element.classList.remove('status-good', 'status-warning', 'status-danger');

    let status: string;

    if (inverted) {
      // For FPS, lower is worse
      if (value >= threshold * 0.9) {
        status = 'status-good';
      } else if (value >= threshold * 0.7) {
        status = 'status-warning';
      } else {
        status = 'status-danger';
      }
    } else {
      // For other metrics, higher is worse
      const ratio = value / threshold;

      if (ratio < this.WARNING_THRESHOLD) {
        status = 'status-good';
      } else if (ratio < this.DANGER_THRESHOLD) {
        status = 'status-warning';
      } else {
        status = 'status-danger';
      }
    }

    element.classList.add(status);
  }

  private drawGraph(): void {
    if (!this.canvas) return;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    const width = this.canvas.width;
    const height = this.canvas.height;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;

    for (let i = 0; i <= 4; i++) {
      const y = (height / 4) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw FPS graph (green)
    if (this.fpsHistory.length > 1) {
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 2;
      ctx.beginPath();

      const stepX = width / Math.max(1, this.fpsHistory.length - 1);

      this.fpsHistory.forEach((fps, index) => {
        const x = index * stepX;
        const y = height - (fps / 60) * height; // Normalize to 60 FPS max

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    }

    // Draw CPU graph (red)
    if (this.cpuHistory.length > 1) {
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 2;
      ctx.beginPath();

      const stepX = width / Math.max(1, this.cpuHistory.length - 1);

      this.cpuHistory.forEach((cpu, index) => {
        const x = index * stepX;
        const y = height - (cpu / 100) * height; // Normalize to 100% max

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.stroke();
    }

    // Draw legend
    ctx.font = '12px monospace';
    ctx.fillStyle = '#4ade80';
    ctx.fillText('FPS', 10, 20);
    ctx.fillStyle = '#f87171';
    ctx.fillText('CPU', 60, 20);
  }

  private updateWarnings(metrics: PerformanceMetrics): void {
    const warningsSection = document.getElementById('performance-warnings');
    const warningsList = document.getElementById('warnings-list');

    if (!warningsSection || !warningsList) return;

    const warnings: string[] = [];

    // Check FPS
    if (metrics.fps < 54) { // 90% of 60 FPS
      warnings.push(`Low FPS: ${metrics.fps} (target: 60)`);
    }

    // Check CPU
    if (metrics.cpuUsage > 70) {
      warnings.push(`High CPU usage: ${metrics.cpuUsage}%`);
    }

    // Check audio nodes
    if (metrics.audioNodes > 100) {
      warnings.push(`Many audio nodes: ${metrics.audioNodes} (consider cleanup)`);
    }

    // Update UI
    if (warnings.length > 0) {
      warningsList.innerHTML = warnings.map(w => `<li>${w}</li>`).join('');
      warningsSection.style.display = 'block';
    } else {
      warningsSection.style.display = 'none';
    }
  }
}
