import { defineConfig } from 'vite';
import { musicHMRPlugin } from './plugins/musicHMR';

export default defineConfig({
  plugins: [
    musicHMRPlugin({
      fadeTime: 300, // ms
      maintainPosition: true,
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
