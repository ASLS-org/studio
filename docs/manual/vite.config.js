/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from 'vite';
import svgLoader from 'vite-svg-loader';

export default defineConfig({
  plugins: [svgLoader()],
  resolve: {
    alias: {
      '@': '../../src',
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
  },
});
