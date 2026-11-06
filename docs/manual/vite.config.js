/* eslint-disable import/no-extraneous-dependencies */
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';
import svgLoader from 'vite-svg-loader';

const root = fileURLToPath(new URL('../..', import.meta.url));

/**
 * Files from the app's public folder the manual uses at run time: the hero's rig, and the live
 * previews' demo show (public/presets/manual.showfile.json): the library index the show loader
 * reads (OFL and the GDTF bundle's), each fixture profile it patches, the moving-head model and
 * the visualizer's floor.
 * Served from there in dev, copied into the build by config.js (buildEnd), at the same paths as
 * in the app.
 */
export const APP_STATIC_FILES = [
  'fixtures/fixture_list.json',
  'fixtures/martin/mac-aura.json',
  'fixtures/chauvet-dj/colorband-pix.json',
  'fixtures/eurolite/led-par-56-tcl.json',
  'gdtf/gdtf_list.json',
  'visualizer/models/model_list.json',
  'visualizer/models/scenography/moving_head_lowpoly.glb',
  'visualizer/textures/environment/checkerboard_default.jpg',
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
        const types = { json: 'application/json', glb: 'model/gltf-binary', jpg: 'image/jpeg' };
        res.setHeader('Content-Type', types[file.split('.').pop()] || 'application/octet-stream');
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
      // The repo root, as in the app (the license popup reads @root/COPYING)
      '@root': root,
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
  },
});
