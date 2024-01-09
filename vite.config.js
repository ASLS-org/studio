/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import svgLoader from 'vite-svg-loader';
import { fileURLToPath } from 'url';
import path from 'path';
import { exec } from 'child_process';

const filename = fileURLToPath(import.meta.url);
const pathSegments = path.dirname(filename);

exec('git describe --tags --abbrev=0', (err, stdout) => {
  if (err) {
    process.env.VITE_APP_VERSION = 'no version data';
  } else {
    process.env.VITE_APP_VERSION = stdout;
  }
});

exec(`git log -1 --format=%ai ${process.env.VITE_APP_VERSION}`, (err, stdout) => {
  if (err) {
    process.env.VITE_APP_BUILD_DATE = 'no build date data';
  } else {
    process.env.VITE_APP_BUILD_DATE = stdout;
  }
});

exec('git rev-parse --abbrev-ref HEAD', (err, stdout) => {
  if (err) {
    process.env.VITE_APP_BRANCH = 'no branch data';
  } else {
    process.env.VITE_APP_BRANCH = stdout;
  }
});

export default defineConfig({
  plugins: [vue(), svgLoader()],
  resolve: {
    alias: {
      '@': path.resolve(pathSegments, './src'),
      '@root': path.resolve(pathSegments, './'),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
  },
});
