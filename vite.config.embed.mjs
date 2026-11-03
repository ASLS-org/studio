/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import svgLoader from 'vite-svg-loader'; // Re-imported to fix the Vue crash
import compression from 'vite-plugin-compression';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';
import { fileURLToPath } from 'url';
import path from 'path';
import util from 'util';
import { exec } from 'child_process';

const asyncExec = util.promisify(exec);

async function prepareVersioningEnv() {
  try {
    const { stdout } = await asyncExec('git describe --tags --abbrev=0');
    process.env.VITE_APP_VERSION = stdout.trim();
  } catch (err) {
    process.env.VITE_APP_VERSION = '';
  }

  try {
    const { stdout } = await asyncExec(
      `git log -1 --format=%ai ${process.env.VITE_APP_VERSION}`,
    );
    process.env.VITE_APP_BUILD_DATE = stdout.trim();
  } catch (err) {
    process.env.VITE_APP_BUILD_DATE = '';
  }

  try {
    const { stdout } = await asyncExec('git rev-parse --abbrev-ref HEAD');
    process.env.VITE_APP_BRANCH = stdout.trim();
  } catch (err) {
    process.env.VITE_APP_BRANCH = '';
  }
}

const filename = fileURLToPath(import.meta.url);
const pathSegments = path.dirname(filename);

export default defineConfig(async () => {
  await prepareVersioningEnv();

  return {
    plugins: [
      vue(),
      // FIXED: Restored svgLoader with specific optimization parameters
      svgLoader({
        defaultImport: 'component', // Keeps your existing template tags working
        svgoConfig: {
          plugins: [
            {
              name: 'preset-default',
              params: {
                overrides: {
                  removeViewBox: false, // Prevents SVG rendering skew issues
                },
              },
            },
          ],
        },
      }),
      cssInjectedByJsPlugin(),
      compression({
        algorithm: 'gzip',
        ext: '.gz',
        threshold: 0,
        deleteOriginFile: false,
      }),
    ],

    resolve: {
      alias: {
        '@': path.resolve(pathSegments, './src'),
        '@root': path.resolve(pathSegments, './'),
      },
      extensions: [
        '.mjs',
        '.js',
        '.ts',
        '.jsx',
        '.tsx',
        '.json',
        '.vue',
        '*?raw',
      ],
    },

    build: {
      outDir: 'dist-embed',
      emptyOutDir: true,
      sourcemap: false,
      chunkSizeWarningLimit: 10000,

      // Inlines small assets (like binary PNGs/JPEGs), while svgLoader handles the SVGs safely
      assetsInlineLimit: 524288,

      rollupOptions: {
        output: {
          inlineDynamicImports: true,
          entryFileNames: 'assets/app.js',
          assetFileNames: 'assets/[name][extname]',
        },
      },
    },
  };
});
