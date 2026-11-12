/**
 * Checks the user manual's live previews and anchored links in headless Chrome.
 *
 * Runs every <LivePreview> a page uses (each demo through one loop) and fails on: a preview that
 * can't start (fallback or unknown preset), a `[LivePreview …]` error, an uncaught page error, a
 * demo step that can't run, a registry preset that no page uses, and an internal `#anchor` link
 * whose target doesn't exist.
 *
 * Usage: npm run docs:manual:check [-- --url http://localhost:5173] [--page /rig/outputs ...]
 *   --url    use a running manual (`npm run docs:manual:serve`) instead of starting one
 *   --page   check only these pages (repeatable)
 * Chrome: CHROME_PATH, else the usual install path for the system.
 */
/* eslint-disable no-console -- a command-line report */
/* eslint import/no-extraneous-dependencies: ['error', { devDependencies: true }] */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const MANUAL = path.join(ROOT, 'docs/manual');
const PRESETS_FILE = path.join(MANUAL, '.vitepress/theme/previews/presets.js');
const READY_MS = 30000;
const DEMO_LOOP_MS = 90000;

const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

/**
 * Parses the command line
 * @returns {{url: ?String, pages: Array<String>}} options
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = { url: null, pages: [] };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--url') {
      i += 1;
      options.url = args[i].replace(/\/$/, '');
    } else if (args[i] === '--page') {
      i += 1;
      options.pages.push(args[i]);
    } else {
      throw new Error(`unknown argument: ${args[i]}`);
    }
  }
  return options;
}

/**
 * Finds Chrome or Chromium
 * @returns {String} executable path
 */
function findChrome() {
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    '/snap/bin/chromium',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ].filter(Boolean);
  const found = candidates.find((file) => fs.existsSync(file));
  if (!found) {
    throw new Error('Chrome not found: set CHROME_PATH to a Chrome or Chromium executable.');
  }
  return found;
}

/**
 * Lists the manual's pages (not `_dev/`, not CLAUDE.md) with the presets each one uses
 * @returns {Array<{url: String, presets: Array<String>}>} pages, sorted by url
 */
function collectPages() {
  const pages = [];
  const walk = (dir) => {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (!['.vitepress', '_dev', 'public', 'node_modules'].includes(entry.name)) walk(file);
        return;
      }
      if (!entry.name.endsWith('.md') || entry.name === 'CLAUDE.md') return;
      const rel = path.relative(MANUAL, file).split(path.sep).join('/');
      const url = `/${rel.replace(/(^|\/)index\.md$/, '$1').replace(/\.md$/, '')}`;
      const source = fs.readFileSync(file, 'utf8');
      const presets = [...source.matchAll(/<LivePreview[^>]*\spreset="([^"]+)"/g)].map((m) => m[1]);
      pages.push({ url, presets });
    });
  };
  walk(MANUAL);
  return pages.sort((a, b) => a.url.localeCompare(b.url));
}

/**
 * Reads the preset ids of the registry (the top-level keys of PRESETS)
 * @returns {Array<String>} ids
 */
function registryIds() {
  const source = fs.readFileSync(PRESETS_FILE, 'utf8');
  const start = source.indexOf('const PRESETS = {');
  const end = source.indexOf('\n};', start);
  if (start < 0 || end < 0) throw new Error(`PRESETS not found in ${PRESETS_FILE}`);
  return [...source.slice(start, end).matchAll(/^ {2}'?([a-z][a-z0-9-]*)'?:/gm)].map((m) => m[1]);
}

/**
 * Finds a free local port
 * @returns {Promise<Number>} port
 */
function freePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolve(port));
    });
  });
}

/**
 * Starts `vitepress dev` for the manual and waits until it answers
 * @returns {Promise<{url: String, stop: Function}>} the server
 */
async function startManual() {
  const port = await freePort();
  const child = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['vitepress', 'dev', 'docs/manual', '--port', String(port), '--strictPort'],
    { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'], detached: process.platform !== 'win32' },
  );
  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk; });
  child.stderr.on('data', (chunk) => { output += chunk; });
  const stop = () => {
    if (child.exitCode !== null) return;
    try {
      if (process.platform === 'win32') child.kill();
      else process.kill(-child.pid);
    } catch { /* already gone */ }
  };
  const url = `http://localhost:${port}`;
  const deadline = Date.now() + 60000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`vitepress dev exited:\n${output}`);
    try {
      const res = await fetch(`${url}/`); // eslint-disable-line no-await-in-loop
      if (res.ok) return { url, stop };
    } catch { /* not up yet */ }
    await wait(500); // eslint-disable-line no-await-in-loop
  }
  stop();
  throw new Error(`vitepress dev didn't answer on ${url}:\n${output}`);
}

/**
 * Waits for a condition in the page
 * @param {import('puppeteer-core').Page} page the page
 * @param {Function} fn condition, run in the page
 * @param {Array} args its arguments
 * @param {Number} timeout ms
 * @returns {Promise<Boolean>} whether it became true in time
 */
async function until(page, fn, args, timeout) {
  try {
    await page.waitForFunction(fn, { timeout, polling: 200 }, ...args);
    return true;
  } catch {
    return false;
  }
}

/**
 * Runs one preview of the page: scrolls to it, runs it, waits until ready and, for a demo, until
 * its first loop ends
 * @param {import('puppeteer-core').Page} page the page
 * @param {Number} index the preview's position on the page
 * @returns {Promise<?String>} the reason it failed, or null
 */
async function runPreview(page, index) {
  await page.evaluate((i) => {
    const el = document.querySelectorAll('.live_preview[data-preset]')[i];
    el.scrollIntoView({ block: 'center' });
  }, index);
  await wait(300);
  await page.evaluate((i) => {
    const el = document.querySelectorAll('.live_preview[data-preset]')[i];
    const paused = el.querySelector(':scope > .live_preview_paused');
    if (paused) paused.click();
  }, index);
  const settled = await until(page, (i) => {
    const el = document.querySelectorAll('.live_preview[data-preset]')[i];
    return ['ready', 'fallback', 'unknown'].some((s) => el.classList.contains(s));
  }, [index], READY_MS);
  if (!settled) return `not ready after ${READY_MS / 1000} s`;
  const state = await page.evaluate((i) => {
    const el = document.querySelectorAll('.live_preview[data-preset]')[i];
    const message = el.querySelector(':scope > .live_preview_message');
    return {
      ready: el.classList.contains('ready'),
      unknown: el.classList.contains('unknown'),
      demo: el.hasAttribute('data-demo-loops'),
      message: message ? message.textContent.trim() : '',
    };
  }, index);
  if (state.unknown) return 'unknown preset';
  if (!state.ready) return `fell back${state.message ? `: ${state.message}` : ''}`;
  // Let it run a moment so mount-time errors surface
  await wait(state.demo ? 0 : 1500);
  if (state.demo) {
    const looped = await until(page, (i) => {
      const el = document.querySelectorAll('.live_preview[data-preset]')[i];
      return Number(el.getAttribute('data-demo-loops')) >= 1;
    }, [index], DEMO_LOOP_MS);
    if (!looped) return `demo loop didn't end within ${DEMO_LOOP_MS / 1000} s`;
  }
  return null;
}

/**
 * Collects the ids of the page and its internal anchored links
 * @param {import('puppeteer-core').Page} page the page
 * @returns {Promise<{ids: Array<String>, links: Array<String>}>} ids and hrefs
 */
function pageAnchors(page) {
  return page.evaluate(() => ({
    ids: [...document.querySelectorAll('[id]')].map((el) => el.id),
    links: [...document.querySelectorAll('main a[href*="#"]')]
      .map((a) => a.getAttribute('href'))
      .filter((href) => href.startsWith('/') || href.startsWith('#')),
  }));
}

/**
 * Groups repeated messages (a per-tick error repeats every frame)
 * @param {Array<String>} messages messages, in order
 * @returns {Array<String>} unique messages, each with its count when repeated
 */
function summarise(messages) {
  const counts = new Map();
  messages.forEach((text) => counts.set(text, (counts.get(text) || 0) + 1));
  return [...counts].map(([text, n]) => (n > 1 ? `${text} (×${n})` : text));
}

/**
 * Opens a page and waits for the theme to mount
 * @param {import('puppeteer-core').Page} page the page
 * @param {String} url absolute url
 */
async function open(page, url) {
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 90000 });
  await wait(800);
}

const options = parseArgs();
const allPages = collectPages();
const pages = options.pages.length
  ? allPages.filter((p) => options.pages.includes(p.url))
  : allPages;
if (options.pages.length && pages.length !== options.pages.length) {
  const known = new Set(allPages.map((p) => p.url));
  throw new Error(`unknown page(s): ${options.pages.filter((p) => !known.has(p)).join(', ')}`);
}
const failures = [];
const fail = (where, why) => {
  failures.push(`${where}: ${why}`);
  console.log(`  FAIL ${where}: ${why}`);
};

// Presets no page uses (read from every page's source, also with --page): delete or use them
const used = new Set(allPages.flatMap((p) => p.presets));
registryIds().filter((id) => !used.has(id))
  .forEach((id) => fail(`preset ${id}`, 'no page uses it'));

const server = options.url ? { url: options.url, stop: () => {} } : await startManual();
process.on('SIGINT', () => {
  server.stop();
  process.exit(130);
});
console.log(`Manual: ${server.url}`);

const browser = await puppeteer.launch({
  executablePath: findChrome(),
  headless: true,
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
let checked = 0;
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  // A `[LivePreview <id>]` error belongs to that preset; page errors and demo warnings belong to
  // the preview running when they arrive ('' while none runs)
  let current = '';
  const problems = new Map();
  const report = (preset, text) => {
    if (!problems.has(preset)) problems.set(preset, []);
    problems.get(preset).push(text.slice(0, 300));
  };
  const take = (preset) => {
    const list = problems.get(preset) || [];
    problems.delete(preset);
    return summarise(list);
  };
  page.on('pageerror', (err) => report(current, `page error: ${err.message.split('\n')[0]}`));
  page.on('console', async (msg) => {
    const demo = msg.text().startsWith('[LivePreview demo]');
    if (msg.type() !== 'error' && !demo) return;
    if (!msg.text().startsWith('[LivePreview')) return;
    const running = current;
    // Errors are passed as objects: read their message in the page
    const parts = await Promise.all(msg.args().map((arg) => arg.evaluate((v) => (
      v instanceof Error ? v.message : String(v))).catch(() => '?')));
    const text = parts.join(' ');
    if (demo) {
      report(running, `demo step failed: ${text.slice(19)}`);
      return;
    }
    const tag = text.match(/^\[LivePreview ([^\]]+)\]\s*/);
    report(tag ? tag[1] : running, text.slice(tag ? tag[0].length : 0));
  });

  const ids = new Map();
  const links = [];
  for (const entry of pages) { // eslint-disable-line no-restricted-syntax
    console.log(entry.url);
    problems.clear();
    current = '';
    await open(page, server.url + entry.url); // eslint-disable-line no-await-in-loop
    const anchors = await pageAnchors(page); // eslint-disable-line no-await-in-loop
    ids.set(entry.url, new Set(anchors.ids));
    anchors.links.forEach((href) => links.push({ from: entry.url, href }));

    const found = await page.$$eval( // eslint-disable-line no-await-in-loop
      '.live_preview[data-preset]',
      (els) => els.map((el) => el.dataset.preset),
    );
    if (found.join() !== entry.presets.join()) {
      fail(entry.url, `page shows [${found}] but its source has [${entry.presets}]`);
    }
    for (let i = 0; i < found.length; i += 1) {
      current = found[i];
      const why = await runPreview(page, i); // eslint-disable-line no-await-in-loop
      checked += 1;
      const all = [why, ...take(current)].filter(Boolean);
      if (all.length) fail(`${entry.url} ${current}`, all.join('; '));
      else console.log(`  ok   ${current}`);
    }
    // Errors that came once a preview had stopped (unmounting, a late tick)
    current = '';
    await wait(500); // eslint-disable-line no-await-in-loop
    [...problems.keys()].forEach((preset) => {
      fail(`${entry.url} ${preset || '(page)'}`, `${take(preset).join('; ')}${preset ? ' (after it stopped)' : ''}`);
    });
  }

  // Anchored links: does each target exist on its page?
  let anchored = 0;
  for (const { from, href } of links) { // eslint-disable-line no-restricted-syntax
    const [target, hash] = href.startsWith('#') ? [from, href.slice(1)] : href.split('#');
    const key = (target || from).replace(/\.html$/, '').replace(/\/index$/, '/');
    if (!ids.has(key)) {
      await open(page, server.url + key); // eslint-disable-line no-await-in-loop
      ids.set(key, new Set((await pageAnchors(page)).ids)); // eslint-disable-line no-await-in-loop
    }
    anchored += 1;
    if (!ids.get(key).has(decodeURIComponent(hash))) fail(from, `broken link ${href}`);
  }
  console.log(`\n${pages.length} pages, ${checked} previews, ${anchored} anchored links checked.`);
} finally {
  await browser.close();
  server.stop();
}

if (failures.length) {
  console.log(`\n${failures.length} failure(s):`);
  failures.forEach((line) => console.log(`- ${line}`));
  process.exit(1);
}
console.log('All clear.');
