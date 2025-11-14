# Troubleshooting Guide

## Dev Server Issues

### Module Export Errors (e.g., "does not provide an export named...")

If you see errors like:
```
The requested module '/node_modules/.vite/deps/@contour_tone-adapter.js?v=...' 
does not provide an export named 'getTransportDebugger'
```

**Solution:**

1. Stop the dev server (Ctrl+C)
2. Clear Vite cache:
   ```bash
   cd packages/dev
   rm -rf node_modules/.vite
   ```
3. Rebuild packages:
   ```bash
   pnpm --filter @contour/core build
   pnpm --filter @contour/tone-adapter build
   ```
4. Restart dev server:
   ```bash
   pnpm dev
   ```

**Why this happens:**
Vite caches transformed modules for performance. When you make changes to workspace packages, the cache can become stale. Clearing it forces Vite to re-transform everything.

### Performance Grid Not Showing

If `/performance.html` shows a blank page or no grid buttons:

1. Check browser console for errors
2. Try the module export fix above
3. Hard refresh the browser (Cmd/Ctrl + Shift + R)
4. Clear browser cache

### Type Errors After Pulling Changes

If TypeScript shows errors after pulling changes:

```bash
# Rebuild all packages
pnpm build

# Or rebuild specific package
pnpm --filter @contour/core build
```

## Common Development Issues

### Port Already in Use

If you see "Port 3000 is in use":

```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill

# Or let Vite choose another port automatically
# It will try 3001, 3002, etc.
```

### Audio Not Playing

1. Make sure you've clicked somewhere on the page first (browser audio requires user interaction)
2. Check that your system volume isn't muted
3. Try starting Tone.Transport manually:
   - Open browser console
   - Type: `Tone.start()` then `Tone.Transport.start()`

### Hot Module Reload Not Working

1. Check that Vite dev server is running
2. Make sure you're editing files in `/packages/dev/src/`
3. Try hard refresh (Cmd/Ctrl + Shift + R)
4. Restart dev server

## Getting Help

If you encounter an issue not covered here:

1. Check the GitHub issues: https://github.com/esoltys/contour-2.0/issues
2. Create a new issue with:
   - Error message (full stack trace)
   - Steps to reproduce
   - Your OS and Node.js version
   - Output of `pnpm list` from project root
