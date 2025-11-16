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
    commonjsOptions: {
      include: [/soundfont-player/, /node_modules/],
    },
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        playground: resolve(__dirname, 'playground.html'),
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
    esbuildOptions: {
      // Needed for soundfont-player CommonJS compatibility
      platform: 'browser',
    },
  },
  worker: {
    format: 'es',
  },
});
