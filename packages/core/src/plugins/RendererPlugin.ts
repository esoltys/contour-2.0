/**
 * Plugin Architecture for Extensible Renderers
 *
 * This module defines the core interfaces for the plugin system,
 * allowing multiple output formats (audio, MIDI, visualizations) without
 * modifying the core library.
 */

import type { Seconds } from '../types/brands';
import type { Composition } from '../composition/Composition';

/**
 * Result of rendering operation.
 */
export interface RenderResult {
  /** Raw data in plugin's format */
  data: Buffer | Blob | ArrayBuffer;

  /** Format identifier (e.g., 'wav', 'midi', 'mp3') */
  format: string;

  /** Rendering metadata */
  metadata: {
    /** Duration of rendered content */
    duration: Seconds;

    /** Sample rate (for audio) */
    sampleRate?: number;

    /** Bit depth (for audio) */
    bitDepth?: number;

    /** Additional format-specific metadata */
    [key: string]: unknown;
  };
}

/**
 * Base interface for all renderer plugins.
 *
 * Plugins must not modify the core library and must be type-safe.
 */
export interface RendererPlugin<TConfig = unknown> {
  /** Unique plugin identifier */
  readonly name: string;

  /** Semantic version (semver) */
  readonly version: string;

  /** Plugin dependencies (other plugin names) */
  readonly dependencies?: string[];

  /**
   * Initialize the plugin with configuration.
   *
   * Called once before first render.
   */
  initialize(config: TConfig): Promise<void>;

  /**
   * Render a composition to the plugin's format.
   *
   * This is the main plugin operation.
   */
  render(composition: Composition): Promise<RenderResult>;

  /**
   * Cleanup resources.
   *
   * Called when plugin is no longer needed.
   */
  shutdown(): Promise<void>;
}

/**
 * Plugin registry for managing renderers.
 *
 * Validates dependencies and maintains plugin lifecycle.
 */
export class PluginRegistry {
  private plugins = new Map<string, RendererPlugin>();

  /**
   * Register a plugin.
   *
   * @throws Error if dependencies are not met
   */
  register<T>(plugin: RendererPlugin<T>): void {
    // Validate dependencies exist
    if (plugin.dependencies) {
      for (const dep of plugin.dependencies) {
        if (!this.plugins.has(dep)) {
          throw new Error(
            `Plugin ${plugin.name} depends on ${dep} which is not registered`
          );
        }
      }
    }

    // Check for duplicate registration
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Plugin ${plugin.name} is already registered`);
    }

    this.plugins.set(plugin.name, plugin);
  }

  /**
   * Get plugin by name.
   *
   * @throws Error if plugin not found
   */
  get(name: string): RendererPlugin {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Plugin ${name} not found`);
    }
    return plugin;
  }

  /**
   * Check if plugin is registered.
   */
  has(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * Get all registered plugins.
   */
  getAll(): RendererPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Unregister a plugin.
   *
   * @throws Error if other plugins depend on it
   */
  unregister(name: string): void {
    // Check if any plugins depend on this one
    for (const plugin of this.plugins.values()) {
      if (plugin.dependencies?.includes(name)) {
        throw new Error(
          `Cannot unregister ${name}: plugin ${plugin.name} depends on it`
        );
      }
    }

    this.plugins.delete(name);
  }

  /**
   * Clear all registered plugins.
   */
  clear(): void {
    this.plugins.clear();
  }
}
