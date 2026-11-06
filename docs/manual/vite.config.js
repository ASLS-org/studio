/* eslint-disable import/no-extraneous-dependencies */
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import svgLoader from 'vite-svg-loader';

const root = fileURLToPath(new URL('../..', import.meta.url));

/**
 * Files from the app's public folder the manual uses at run time (the hero's rig: one fixture
 * profile and the moving-head model). Served from there in dev, copied into the build by
 * config.js (buildEnd), at the same paths as in the app.
 */
export const APP_STATIC_FILES = [
  'fixtures/martin/mac-aura.json',
  'visualizer/models/model_list.json',
  'visualizer/models/scenography/moving_head_lowpoly.glb',
];

/**
 * Dev server: serves APP_STATIC_FILES from the app's public folder
 * @returns {Object} Vite plugin
 */
function appStaticFiles() {
  return {
    name: 'asls-app-static-files',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const file = decodeURIComponent((req.url || '').split('?')[0]).replace(/^\//, '');
        if (!APP_STATIC_FILES.includes(file)) return next();
        res.setHeader('Content-Type', file.endsWith('.json') ? 'application/json' : 'model/gltf-binary');
        fs.createReadStream(path.join(root, 'public', file)).pipe(res);
        return undefined;
      });
    },
  };
}

export default defineConfig({
  // The repo's .env, as in the app (VITE_STATIC_URL for the visualizer and fixture library)
  envDir: root,
  plugins: [svgLoader(), appStaticFiles()],
  resolve: {
    alias: {
      // Resolved from this file, not from the folder the build runs in
      '@': fileURLToPath(new URL('../../src', import.meta.url)),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
  },
});
