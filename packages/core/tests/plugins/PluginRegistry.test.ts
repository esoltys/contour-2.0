import { describe, it, expect, beforeEach } from 'vitest';
import {
  PluginRegistry,
  RendererPlugin,
  RenderResult,
} from '../../src/plugins/RendererPlugin';
import { Composition, BPM, Seconds } from '../../src';

// Mock plugin for testing
class MockRenderer implements RendererPlugin<{ quality: number }> {
  readonly name = 'mock';
  readonly version = '1.0.0';
  readonly dependencies = undefined;

  initialized = false;
  config: { quality: number } | null = null;

  async initialize(config: { quality: number }): Promise<void> {
    this.initialized = true;
    this.config = config;
  }

  async render(composition: Composition): Promise<RenderResult> {
    return {
      data: Buffer.from('mock data'),
      format: 'mock',
      metadata: {
        duration: composition.duration,
        quality: this.config?.quality,
      },
    };
  }

  async shutdown(): Promise<void> {
    this.initialized = false;
  }
}

// Plugin with dependencies
class DependentRenderer implements RendererPlugin {
  readonly name = 'dependent';
  readonly version = '1.0.0';
  readonly dependencies = ['mock'];

  async initialize(): Promise<void> {}
  async render(composition: Composition): Promise<RenderResult> {
    return {
      data: Buffer.from('dependent data'),
      format: 'dependent',
      metadata: {
        duration: composition.duration,
      },
    };
  }
  async shutdown(): Promise<void> {}
}

describe('PluginRegistry', () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    registry = new PluginRegistry();
  });

  describe('register', () => {
    it('registers a plugin successfully', () => {
      const plugin = new MockRenderer();
      registry.register(plugin);

      expect(registry.has('mock')).toBe(true);
      expect(registry.get('mock')).toBe(plugin);
    });

    it('throws on duplicate registration', () => {
      const plugin = new MockRenderer();
      registry.register(plugin);

      expect(() => registry.register(plugin)).toThrow(
        'Plugin mock is already registered'
      );
    });

    it('throws when dependency is missing', () => {
      const dependent = new DependentRenderer();

      expect(() => registry.register(dependent)).toThrow(
        'Plugin dependent depends on mock which is not registered'
      );
    });

    it('allows registration when dependencies are met', () => {
      const mock = new MockRenderer();
      const dependent = new DependentRenderer();

      registry.register(mock);
      registry.register(dependent);

      expect(registry.has('dependent')).toBe(true);
    });
  });

  describe('get', () => {
    it('retrieves registered plugin', () => {
      const plugin = new MockRenderer();
      registry.register(plugin);

      const retrieved = registry.get('mock');
      expect(retrieved).toBe(plugin);
    });

    it('throws when plugin not found', () => {
      expect(() => registry.get('nonexistent')).toThrow(
        'Plugin nonexistent not found'
      );
    });
  });

  describe('has', () => {
    it('returns true for registered plugin', () => {
      const plugin = new MockRenderer();
      registry.register(plugin);

      expect(registry.has('mock')).toBe(true);
    });

    it('returns false for unregistered plugin', () => {
      expect(registry.has('nonexistent')).toBe(false);
    });
  });

  describe('getAll', () => {
    it('returns empty array when no plugins registered', () => {
      expect(registry.getAll()).toEqual([]);
    });

    it('returns all registered plugins', () => {
      const mock = new MockRenderer();
      registry.register(mock);

      const all = registry.getAll();
      expect(all).toHaveLength(1);
      expect(all[0]).toBe(mock);
    });

    it('returns all plugins including dependencies', () => {
      const mock = new MockRenderer();
      const dependent = new DependentRenderer();

      registry.register(mock);
      registry.register(dependent);

      const all = registry.getAll();
      expect(all).toHaveLength(2);
    });
  });

  describe('unregister', () => {
    it('unregisters a plugin', () => {
      const plugin = new MockRenderer();
      registry.register(plugin);

      registry.unregister('mock');
      expect(registry.has('mock')).toBe(false);
    });

    it('throws when unregistering plugin with dependents', () => {
      const mock = new MockRenderer();
      const dependent = new DependentRenderer();

      registry.register(mock);
      registry.register(dependent);

      expect(() => registry.unregister('mock')).toThrow(
        'Cannot unregister mock: plugin dependent depends on it'
      );
    });

    it('allows unregistering after dependent is removed', () => {
      const mock = new MockRenderer();
      const dependent = new DependentRenderer();

      registry.register(mock);
      registry.register(dependent);

      registry.unregister('dependent');
      registry.unregister('mock');

      expect(registry.has('mock')).toBe(false);
    });
  });

  describe('clear', () => {
    it('removes all plugins', () => {
      const mock = new MockRenderer();
      const dependent = new DependentRenderer();

      registry.register(mock);
      registry.register(dependent);

      registry.clear();

      expect(registry.getAll()).toHaveLength(0);
      expect(registry.has('mock')).toBe(false);
      expect(registry.has('dependent')).toBe(false);
    });
  });

  describe('plugin lifecycle', () => {
    it('initializes plugin with config', async () => {
      const plugin = new MockRenderer();
      await plugin.initialize({ quality: 100 });

      expect(plugin.initialized).toBe(true);
      expect(plugin.config).toEqual({ quality: 100 });
    });

    it('renders composition', async () => {
      const plugin = new MockRenderer();
      await plugin.initialize({ quality: 100 });

      const composition = new Composition('Test', BPM(120));
      const result = await plugin.render(composition);

      expect(result.format).toBe('mock');
      expect(result.data).toBeInstanceOf(Buffer);
      expect(result.metadata.quality).toBe(100);
    });

    it('shuts down cleanly', async () => {
      const plugin = new MockRenderer();
      await plugin.initialize({ quality: 100 });
      await plugin.shutdown();

      expect(plugin.initialized).toBe(false);
    });
  });
});
