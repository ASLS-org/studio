/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from 'electron-vite';
import path, { resolve } from 'path';
import vue from '@vitejs/plugin-vue';
import svgLoader from 'vite-svg-loader';
import { fileURLToPath } from 'url';
import util from 'util';
import { exec } from 'child_process';

const asyncExec = util.promisify(exec);

async function prepareVersioningEnv() {
  try {
    const execData = await asyncExec('git describe --tags --abbrev=0');
    process.env.VITE_APP_VERSION = execData.stdout;
  } catch (err) {
    process.env.VITE_APP_VERSION = '';
  }

  try {
    const execData = await asyncExec(`git log -1 --format=%ai ${process.env.VITE_APP_VERSION}`);
    process.env.VITE_APP_BUILD_DATE = execData.stdout;
  } catch (err) {
    process.env.VITE_APP_BUILD_DATE = '';
  }

  try {
    const execData = await asyncExec('git rev-parse --abbrev-ref HEAD');
    process.env.VITE_APP_BRANCH = execData.stdout;
  } catch (err) {
    process.env.VITE_APP_BRANCH = '';
  }
}

const filename = fileURLToPath(import.meta.url);
const pathSegments = path.dirname(filename);

export default defineConfig(async () => {
  process.env.VITE_STATIC_URL = 'static:/';
  await prepareVersioningEnv();
  return {
    root: './',
    plugins: [
      vue(),
      svgLoader(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(pathSegments, './src'),
        '@root': path.resolve(pathSegments, './'),
      },
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
    },
    main: {
      plugins: [
        vue(),
        svgLoader(),
      ],
      resolve: {
        alias: {
          '@': path.resolve(pathSegments, './src'),
          '@root': path.resolve(pathSegments, './'),
        },
        extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
      },
      root: '.',
      build: {
        publicDir: resolve(__dirname, 'public'),
        lib: {
          entry: './src/electron/main.js',
        },
      },
    },
    preload: {
      build: {
        publicDir: resolve(__dirname, 'public'),
        lib: {
          entry: './src/electron/preload.js',
        },
      },
    },
    renderer: {
      plugins: [
        vue(),
        svgLoader(),
      ],
      resolve: {
        alias: {
          '@': path.resolve(pathSegments, './src'),
          '@root': path.resolve(pathSegments, './'),
        },
        extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
      },
      root: '.',
      build: {
        publicDir: resolve(__dirname, 'public'),
        rollupOptions: {
          input: {
            index: './index.html',
          },
        },
      },
    },
  };
});
