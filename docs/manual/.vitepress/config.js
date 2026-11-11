/* eslint-disable import/no-extraneous-dependencies */
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { loadEnv } from 'vite';
import { APP_STATIC_FILES } from '../vite.config';

/*
 * Resource links. Studio-hosted URLs come from the repo's .env (MANUAL_URL_*) so they are set in
 * one place; GitHub URLs are fixed. An empty value hides the link everywhere (nav, hero,
 * <ResourceLink>) and is reported by the build.
 */
const env = loadEnv('production', fileURLToPath(new URL('../../..', import.meta.url)), 'MANUAL_URL_');
const repository = 'https://github.com/ASLS-org/studio';
const links = {
  demo: env.MANUAL_URL_DEMO || '',
  website: env.MANUAL_URL_WEBSITE || '',
  devDocs: env.MANUAL_URL_DEV_DOCS || '',
  download: env.MANUAL_URL_DOWNLOAD || '',
  repository,
  releases: `${repository}/releases`,
  discussions: `${repository}/discussions`,
  issues: `${repository}/issues`,
  license: `${repository}/blob/master/COPYING`,
};
/*
 * Version shown in the footer: the last release tag reachable from the built commit (the deploy
 * workflow fetches tags), else package.json's version.
 */
let version;
try {
  version = execSync('git describe --tags --abbrev=0', { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString().trim();
} catch (e) {
  version = `v${JSON.parse(fs.readFileSync(new URL('../../../package.json', import.meta.url))).version}`;
}

const unset = Object.keys(links).filter((key) => !links[key]);
if (unset.length) {
  // eslint-disable-next-line no-console
  console.warn(`manual: unset resource URLs: ${unset.join(', ')} (set MANUAL_URL_* in .env)`);
}

/**
 * Nav entries whose URL is configured.
 * @type {Array<Object>}
 */
const nav = [
  { text: 'User Manual', link: '/introduction/' },
  { text: 'Live Demo', link: links.demo },
  { text: 'Download', link: links.download },
  { text: 'Developer Docs', link: links.devDocs },
].filter((item) => item.link);

/*
 * Live preview ids, read from the preset registry's source (it lazy-imports app components, so
 * it isn't imported here). A page naming an unknown preset is reported at build time.
 */
const presetIds = new Set([...fs.readFileSync(
  fileURLToPath(new URL('./theme/previews/presets.js', import.meta.url)),
  'utf8',
).matchAll(/^ {2}'?([a-z0-9-]+)'?: \{/gm)].map((match) => match[1]));

/**
 * Reports `<LivePreview preset="…">` tags whose preset doesn't exist
 * @param {String} file page source path
 * @param {String} page page path relative to the manual
 */
function checkPresets(file, page) {
  const source = fs.readFileSync(file, 'utf8');
  [...source.matchAll(/<LivePreview[^>]*\spreset="([^"]+)"/g)].forEach(([, id]) => {
    if (!presetIds.has(id)) {
      // eslint-disable-next-line no-console
      console.warn(`[manual] ${page}: unknown live preview "${id}" (see theme/previews/presets.js)`);
    }
  });
}

// Studio's tokens switch on html[data-theme]. Set it before first paint from VitePress's saved
// appearance (dark unless the visitor chose light), so light-mode readers see no dark flash.
const themeBootScript = 'try{var m=localStorage.getItem(\'asls-manual-appearance\')'
  + '||localStorage.getItem(\'vitepress-theme-appearance\');'
  + 'var d=m===\'system\'||m===\'auto\'?matchMedia(\'(prefers-color-scheme: dark)\').matches'
  + ':m!==\'light\';var h=document.documentElement;h.dataset.theme=d?\'dark\':\'light\';'
  + 'h.classList.toggle(\'dark\',d)}catch(e){}';

export default {
  title: 'ASLS Studio',
  description: 'Open-source DMX lighting control and real-time 3D visualizer, in the browser or on the desktop.',
  // The installation page links to the local dev server
  ignoreDeadLinks: 'localhostLinks',
  appearance: 'dark',
  // Never published: the AI context notes, and the dev-only check pages (built in dev only)
  srcExclude: ['CLAUDE.md', ...(process.argv.includes('dev') ? [] : ['_dev/**'])],
  // Copies the app's public files the manual uses (see vite.config.js) into the build
  buildEnd(siteConfig) {
    const appPublic = fileURLToPath(new URL('../../../public', import.meta.url));
    APP_STATIC_FILES.forEach((file) => {
      const target = path.join(siteConfig.outDir, file);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.join(appPublic, file), target);
    });
  },
  // Pages naming an unknown live preview are reported
  transformPageData(pageData, { siteConfig }) {
    checkPresets(path.join(siteConfig.srcDir, pageData.relativePath), pageData.relativePath);
  },
  // Anchor scrolling clears the 48px toolbar
  scrollOffset: 72,
  head: [
    ['link', {
      rel: 'icon', type: 'image/png', sizes: '32x32', href: '/studio_standalone_logo.png',
    }],
    ['script', {}, themeBootScript],
  ],
  themeConfig: {
    siteTitle: 'ASLS Studio',
    links,
    version,
    search: {
      provider: 'local',
    },
    socialLinks: [
      { icon: 'github', link: repository },
    ],
    logo: { dark: '/studio_standalone_logo.png', light: '/studio_standalone_logo_dark.png' },
    nav,
    sidebar: {
      // By the reader's path (stubs for the old pages are left out, see openspec unit 3)
      '/': [{
        text: 'Getting started',
        collapsible: true,
        items: [{
          text: 'About',
          link: '/introduction/',
        }, {
          text: 'How Studio Works',
          link: '/introduction/overview',
        }, {
          text: 'Installation',
          link: '/introduction/installation',
        }, {
          text: 'Your First Show',
          link: '/getting-started/first-show',
        }, {
          text: 'The Interface',
          link: '/getting-started/interface',
        }, {
          text: 'License',
          link: '/introduction/license',
        }],
      }, {
        text: 'Concepts',
        collapsible: true,
        items: [{
          text: 'Show Structure',
          link: '/concepts/',
        }, {
          text: 'Timing and Playback',
          link: '/concepts/timing',
        }],
      }, {
        text: 'Programming a show',
        collapsible: true,
        items: [{
          text: 'Patching Fixtures',
          link: '/programming/patching',
        }, {
          text: 'Groups',
          link: '/programming/groups',
        }, {
          text: 'Scenes',
          link: '/programming/scenes',
        }, {
          text: 'Effects',
          link: '/programming/effects',
        }, {
          text: 'Chases',
          link: '/programming/chases',
        }, {
          text: 'Playing a Show',
          link: '/programming/playback',
        }],
      }, {
        text: 'Rig & output',
        collapsible: true,
        items: [{
          text: 'Toolbar',
          link: '/interface/toolbar/',
        }, {
          text: 'Visualizer',
          link: '/interface/visualizer/',
        }],
      }],
    },
    footer: {
      message: 'ASLS Studio - Released under the GPLv3 License',
      copyright: `Copyright (©) 2021-${new Date().getFullYear()} Timé Kadel.`,
    },
    markdown: {
      // theme: 'material-palenight'
      toc: 'every',
    },
  },
};
