import { defineConfig } from 'vite';
import { musicHMRPlugin } from './plugins/musicHMR';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    musicHMRPlugin({
      fadeTimeMs: 300,
    }),
  ],
  server: {
    port: 3000,
    hmr: {
      overlay: true,
    },
  },
  build: {
    target: 'esnext',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        performance: resolve(__dirname, 'performance.html'),
        prototypeSamples: resolve(__dirname, 'prototype-samples.html'),
      },
    },
  },
  resolve: {
    // Ensure proper resolution of workspace packages
    preserveSymlinks: true,
  },
  optimizeDeps: {
    include: ['monaco-editor', 'soundfont-player'],
    exclude: ['@contour/core', '@contour/tone-adapter'],
  },
  worker: {
    format: 'es',
  },
});
