import type { Plugin } from 'vite';

interface MusicHMROptions {
  /** Fade duration in milliseconds */
  fadeTime?: number;
  /** Whether to maintain playback position across reloads */
  maintainPosition?: boolean;
}

/**
 * Vite plugin for music-aware hot module replacement.
 *
 * This plugin injects client-side code that:
 * 1. Fades audio out before HMR update
 * 2. Waits for fade to complete
 * 3. Accepts the HMR update
 * 4. Fades audio back in after reload
 *
 * This prevents audio glitches (clicks, pops) during hot-reload.
 */
export function musicHMRPlugin(options: MusicHMROptions = {}): Plugin {
  const fadeTime = options.fadeTime ?? 300;
  const maintainPosition = options.maintainPosition ?? true;

  return {
    name: 'contour-music-hmr',

    // Transform the client code to inject HMR handling
    transform(code, id) {
      // Only inject for main entry files
      if (!id.includes('src/main.ts') && !id.includes('src/index.ts')) {
        return null;
      }

      // Inject HMR handling code
      const hmrCode = `
        // Music-aware HMR handling
        if (import.meta.hot) {
          let hmrHandler = null;

          // Import HMRHandler dynamically to avoid circular dependencies
          import('@contour/tone-adapter').then(({ HMRHandler }) => {
            hmrHandler = new HMRHandler(${fadeTime / 1000});

            import.meta.hot.accept(async (newModule) => {
              console.log('[Contour] Preparing graceful audio reload...');

              if (hmrHandler) {
                try {
                  await hmrHandler.prepareReload();
                  console.log('[Contour] Audio faded out, reloading module...');

                  // Allow time for module to reload
                  await new Promise(resolve => setTimeout(resolve, 100));

                  // Re-initialize if the module exports an init function
                  if (newModule && typeof newModule.init === 'function') {
                    await newModule.init();
                  }

                  await hmrHandler.afterReload();
                  console.log('[Contour] Audio faded back in, reload complete!');
                } catch (error) {
                  console.error('[Contour] HMR error:', error);
                  hmrHandler.emergencyStop();
                }
              }
            });
          });
        }
      `;

      return {
        code: code + '\n' + hmrCode,
        map: null,
      };
    },

    // Configure HMR server
    configureServer(server) {
      server.ws.on('contour:reload', () => {
        console.log('[Contour] Manual reload requested');
      });
    },
  };
}
