import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@contour/core': path.resolve(__dirname, '../../packages/core/src'),
      '@contour/tone-adapter': path.resolve(__dirname, '../../packages/tone-adapter/src'),
      '@contour/plugin-audio': path.resolve(__dirname, '../../packages/plugins/audio/src'),
      '@contour/plugin-midi': path.resolve(__dirname, '../../packages/plugins/midi/src'),
    },
  },
  server: {
    port: 3003,
  },
  optimizeDeps: {
    exclude: ['@contour/core', '@contour/tone-adapter', '@contour/plugin-audio', '@contour/plugin-midi'],
  },
});
