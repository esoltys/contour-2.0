import { defineConfig } from 'vite';
import { musicHMRPlugin } from './plugins/musicHMR';

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
  },
  resolve: {
    // Ensure proper resolution of workspace packages
    preserveSymlinks: true,
  },
});
