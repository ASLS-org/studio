/* eslint-disable import/no-extraneous-dependencies */
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import svgLoader from 'vite-svg-loader';

export default defineConfig({
  plugins: [svgLoader()],
  resolve: {
    alias: {
      // Resolved from this file, not from the folder the build runs in
      '@': fileURLToPath(new URL('../../src', import.meta.url)),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
  },
});
