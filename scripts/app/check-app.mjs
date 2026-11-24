/**
 * Checks the app's navigation, selection, focus, keys and popups end to end in headless Chrome.
 *
 * Starts the app's dev server, loads the demo show fresh for every scenario, then drives it with
 * real clicks and keys and reads only what the operator can observe: which panel is shown, which
 * rows and tiles are selected, which popups are open, what the 3D view highlights, and whether the
 * main thread blocked. Prints PASS/FAIL per check and exits non-zero on any failure.
 *
 * Usage: npm run app:check [-- --url http://localhost:5173] [--only <scenario> ...]
 *   --url    use a running dev server instead of starting one
 *   --only   run only these scenarios (repeatable): panels, playing, textscroll, select, resize,
 *            widgets, curves, repatch, position, scopes, fxfades, presets, memory, shared,
 *            highlight, deletes, keys, popups
 * Chrome: CHROME_PATH, else the usual install path for the system.
 */
/* eslint-disable no-console -- a command-line report */
/* eslint-disable no-await-in-loop, no-restricted-syntax -- scenario steps run in order */
/* eslint import/no-extraneous-dependencies: ['error', { devDependencies: true }] */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
/** Longest main-thread block allowed while navigating, after the show is loaded (ms) */
const MAX_BLOCK_MS = 50;
/** Time given to the app to load the demo show and the visualizer (ms) */
const BOOT_MS = 30000;
/** Pause after a click or key, for Vue and the visualizer to settle (ms) */
const SETTLE_MS = 250;

const wait = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

/**
 * Parses the command line
 * @returns {{url: ?String, only: Array<String>}} options
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const options = { url: null, only: [] };
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--url') {
      i += 1;
      options.url = args[i].replace(/\/$/, '');
    } else if (args[i] === '--only') {
      i += 1;
      options.only.push(args[i]);
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
 * Starts the app's Vite dev server and waits until it answers
 * @returns {Promise<{url: String, stop: Function}>} the server
 */
async function startApp() {
  const port = await freePort();
  const child = spawn(
    process.platform === 'win32' ? 'npx.cmd' : 'npx',
    ['vite', '--port', String(port), '--strictPort'],
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
    if (child.exitCode !== null) throw new Error(`vite exited:\n${output}`);
    try {
      const res = await fetch(`${url}/`);
      if (res.ok) return { url, stop };
    } catch { /* not up yet */ }
    await wait(500);
  }
  stop();
  throw new Error(`vite didn't answer on ${url}:\n${output}`);
}

/* ------------------------------------------------------------------------------------------ */
/* In-page probes: functions passed to page.evaluate, reading what the operator can observe     */
/* ------------------------------------------------------------------------------------------ */

/**
 * Installs the page-side helpers (window.__check): the show, long tasks, errors, and readers for
 * panels, lists, tiles, popups and the 3D highlight
 */
function installProbes() {
  const app = document.querySelector('#app').__vue_app__;
  const show = app.config.globalProperties.$show;
  const visible = (el) => !!el && !!el.offsetParent;
  const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');
  const longTasks = [];
  new PerformanceObserver((list) => {
    list.getEntries().forEach((e) => {
      longTasks.push({ at: e.startTime, ms: Math.round(e.duration) });
    });
  }).observe({ type: 'longtask' });
  const errors = [];
  window.addEventListener('error', (e) => errors.push(e.message));
  window.addEventListener('unhandledrejection', (e) => errors.push(String(e.reason?.message || e.reason)));
  const panelOf = () => {
    const panels = {
      universe: '.universe_modifier', group: '.group_modifier', chase: '.chase_modifier',
    };
    return Object.keys(panels).filter((k) => visible(document.querySelector(panels[k])));
  };
  const panelEl = () => {
    const [panel] = panelOf();
    return panel ? document.querySelector(`.${panel}_modifier`) : null;
  };
  const rowIds = (rows, cls) => rows
    .filter((r) => cls.some((c) => r.classList.contains(c)))
    .map((r) => Number((r.dataset.key || '').replace(/^id:/, '').replace(/#.*$/, '')))
    .filter((n) => !Number.isNaN(n))
    .sort((a, b) => a - b);
  const listState = (root) => {
    const rows = root ? [...root.querySelectorAll('.uikit_list_item[data-key]')] : [];
    return {
      selected: rowIds(rows, ['selected', 'highlighted']),
      focused: rowIds(rows, ['focused']).length > 0
        && rows.some((r) => r.classList.contains('focused') && (r.classList.contains('selected') || r.classList.contains('highlighted'))),
    };
  };
  const steps = [];
  // Input events: a long task that contains one is the app reacting to it (a visualizer frame
  // or a garbage collection between inputs isn't, and is measured separately)
  const inputs = [];
  ['pointerdown', 'click', 'keydown'].forEach((type) => {
    window.addEventListener(type, () => inputs.push(performance.now()), true);
  });
  window.__check = {
    show,
    errors,
    longTasks,
    resetLongTasks() { longTasks.length = 0; steps.length = 0; inputs.length = 0; },
    programs() { return show.visualizerHandle?.renderer?.info?.programs?.length ?? 0; },
    step(label) { steps.push({ at: performance.now(), label }); },
    maxBlock() { return longTasks.reduce((m, t) => Math.max(m, t.ms), 0); },
    blocks(limit) {
      return longTasks.filter((t) => t.ms > limit)
        .filter((t) => inputs.some((at) => at >= t.at - 1 && at <= t.at + t.ms))
        .map((t) => {
          const step = steps.filter((st) => st.at <= t.at).pop();
          return `${t.ms} ms after "${step ? step.label : 'start'}"`;
        });
    },
    panels: panelOf,
    selectedGroup() {
      const el = document.querySelector('.group_pool .uikit_cue_container.selected:not(.master) .uikit_cue_container_header h4');
      return text(el);
    },
    selectedChase() {
      return [...document.querySelectorAll('.group_pool .uikit_chase.selected:not(.master)')].length;
    },
    fixturePool() { return listState(panelEl()?.querySelector('.modifier_widget_fixture_pool')); },
    sceneList() { return listState(panelEl()?.querySelector('.scene_fixtures')); },
    selectedCue() {
      const tile = panelEl()?.querySelector('.cuepool_widget .grid_item.selected:not(.empty) .grid_item_footer');
      return text(tile);
    },
    groupName() {
      const input = panelEl()?.querySelector('input');
      return input ? input.value : '';
    },
    popups() {
      return [...document.querySelectorAll('.popup')].filter(visible)
        .map((p) => text(p.querySelector('.header h3')));
    },
    highlighted() {
      const ids = [];
      show.visualizerHandle?.fixtureRenderer?.instances?.forEach((instance, id) => {
        if (instance.model.highlighted) ids.push(Number(id));
      });
      return ids.sort((a, b) => a - b);
    },
    fixtureCount() { return show.fixturePool.fixtures.length; },
  };
}

/* ------------------------------------------------------------------------------------------ */
/* Node-side driver                                                                            */
/* ------------------------------------------------------------------------------------------ */

let failures = 0;
let passes = 0;
/**
 * Reports one check
 * @param {String} label what is checked
 * @param {Boolean} ok whether it holds
 * @param {*} [detail] what was seen, shown on failure
 */
function check(label, ok, detail) {
  if (ok) passes += 1;
  else failures += 1;
  const extra = !ok && detail !== undefined ? `  (${typeof detail === 'string' ? detail : JSON.stringify(detail)})` : '';
  console.log(`  ${ok ? 'PASS' : 'FAIL'} ${label}${extra}`);
}
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

/**
 * A fresh page with the demo show loaded and the probes installed
 * @param {import('puppeteer-core').Browser} browser browser
 * @param {String} url app url
 * @returns {Promise<import('puppeteer-core').Page>} page
 */
async function freshPage(browser, url) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1000 });
  await page.goto(url, { waitUntil: 'networkidle2' });
  await page.evaluate(() => localStorage.removeItem('ASLS_STUDIO_SHOWFILE'));
  await page.reload({ waitUntil: 'networkidle2' });
  await page.waitForFunction(() => {
    const app = document.querySelector('#app')?.__vue_app__;
    const show = app?.config.globalProperties.$show;
    return show?.ready && show.visualizerHandle?.fixtureRenderer?.instances?.size > 0
      && ![...document.querySelectorAll('.splash_popup')].some((e) => e.offsetParent);
  }, { timeout: BOOT_MS, polling: 250 });
  await wait(1500);
  await page.evaluate(installProbes);
  await page.mouse.move(2, 2);
  return page;
}

/**
 * Clicks the centre of the last visible element matching a selector (and a text, when given)
 * @param {import('puppeteer-core').Page} page page
 * @param {String} selector CSS selector
 * @param {?String|RegExp} [match] text the element must have (exact string, or a pattern)
 * @param {Object} [options] { modifiers: ['Meta'|'Shift'], within: selector of a container }
 * @returns {Promise<Boolean>} whether something was clicked
 */
async function click(page, selector, match = null, options = {}) {
  await page.evaluate((label) => window.__check?.step(label), `${selector} ${match || ''}`.trim());
  const handle = await page.evaluateHandle((sel, m, within) => {
    const root = within
      ? [...document.querySelectorAll(within)].find((e) => e.offsetParent)
      : document;
    if (!root) return null;
    const re = m && m.startsWith('/') ? new RegExp(m.slice(1, -1)) : null;
    return [...root.querySelectorAll(sel)].filter((e) => e.offsetParent).filter((e) => {
      if (!m) return true;
      const t = e.textContent.replace(/\s+/g, ' ').trim();
      return re ? re.test(t) : t === m;
    }).pop() || null;
  }, selector, match instanceof RegExp ? `/${match.source}/` : match, options.within || null);
  const el = handle.asElement();
  if (!el) return false;
  await el.evaluate((e) => e.scrollIntoView({ block: 'nearest', inline: 'nearest' }));
  const box = await el.boundingBox();
  if (!box) return false;
  const mods = options.modifiers || [];
  for (const key of mods) await page.keyboard.down(key);
  const x = box.x + Math.min(box.width / 2, options.x ?? box.width / 2);
  await page.mouse.click(x, box.y + box.height / 2);
  for (const key of mods) await page.keyboard.up(key);
  await page.mouse.move(2, 2);
  await wait(SETTLE_MS);
  return true;
}

const probe = (page, name, ...args) => page.evaluate((n, a) => window.__check[n](...a), name, args);

/**
 * The popups on screen once closing ones are gone: waits (up to 2 s) until at most `count` show,
 * since a closing popup stays until its leave animation ends (late when the CPU is busy)
 * @param {import('puppeteer-core').Page} page page
 * @param {Number} count popups expected at most
 * @returns {Promise<Array<String>>} titles of the popups on screen
 */
async function popupsAfterClosing(page, count) {
  try {
    await page.waitForFunction(
      (n) => window.__check.popups().length <= n,
      { timeout: 2000, polling: 50 },
      count,
    );
  } catch { /* still more: the check reports them */ }
  return probe(page, 'popups');
}

/** Opens a group from the group pool by its name */
const openGroup = (page, name) => click(page, '.group_pool .uikit_cue_container:not(.master) .uikit_cue_container_header', name);
/** Opens a universe from the patch bay */
const openUniverse = (page, id) => click(page, '.patch_bay .uikit_list_group > .uikit_list_item', `Universe ${id}`);
/** Unfolds a universe in the patch bay, unless it already is (a click would fold it) */
async function unfoldUniverse(page, id) {
  const open = await page.evaluate((u) => [...document.querySelectorAll('.patch_bay .uikit_list_group')]
    .some((g) => g.classList.contains('open') && g.querySelector(':scope > .uikit_list_item')
      ?.textContent.trim() === `Universe ${u}`), id);
  if (!open) await openUniverse(page, id);
  // the unfold animates rows into place: measure them once it's done
  await wait(400);
}
/** Clicks a fixture row (by fixture id) in a list of the panel in view */
const clickRow = (page, list, id, modifiers) => click(page, `${list} .uikit_list_item[data-key="id:${id}"]`, null, { modifiers, within: '.universe_modifier, .group_modifier', x: 40 });
/** Selects a cue (its name strip) in the group's cue pool */
const selectCueTile = (page, name) => click(page, '.cuepool_widget .grid_item_footer', name);
/** Presses a key, with modifiers */
async function press(page, key, modifiers = []) {
  for (const m of modifiers) await page.keyboard.down(m);
  await page.keyboard.press(key);
  for (const m of modifiers) await page.keyboard.up(m);
  await wait(SETTLE_MS);
}
/** Submits (OK) the top visible popup */
const submitTopPopup = (page) => click(page, '.popup .popup_validation .uikit_button, .popup .popup_validation button', /^(ok|OK|Ok|Delete|Submit|Confirm)$/i);

/** App modules the scenarios import in the page (served by the dev server) */
const PAGE_MODULES = {
  icons: '/src/views/utils/channel.icons.js',
  library: '/src/models/fixtures/fixture.library.js',
  placement: '/src/views/utils/placement.js',
  palette: '/src/views/utils/palette.js',
  scope: '/src/views/utils/effect.scope.js',
  live: '/src/models/DMX/live.model.js',
};
/** Text of a channel preset option: its span and label */
const presetText = (r) => `${r.label} ${r.start === r.end ? r.start : `${r.start}–${r.end}`}`;
/** Same text, whitespace removed (a row's name and span may touch in its text) */
const squash = (t) => String(t).replace(/\s+/g, '');
/** Picks a range in the open channel preset menu */
const pickPreset = (page, r) => click(
  page,
  '.uikit_select_option_list.with_trigger .uikit_list_item',
  new RegExp(`^${presetText(r).replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(' ', '\\s*')}$`),
);

/** Facts about the demo show used by the scenarios */
const demo = (page) => page.evaluate(() => {
  const { show } = window.__check;
  const groups = show.groupPool.groups.map((g) => ({
    id: g.id,
    name: g.name,
    fixtures: g.fixturePool.fixtures.map((f) => f.id),
    cues: g.cuePool.cues.map((c) => ({ id: c.id, name: c.name || `Cue${c.id}`, type: c.type })),
    chases: g.chasePool.chases.map((c) => c.id),
  }));
  const universes = show.universePool.universes.map((u) => ({
    id: u.id, fixtures: u.fixturePool.fixtures.map((f) => f.id),
  }));
  return { groups, universes };
});

/* ------------------------------------------------------------------------------------------ */
/* Scenarios                                                                                   */
/* ------------------------------------------------------------------------------------------ */

const SCENARIOS = {
  /** One panel in view, everyone agrees, no main-thread block while switching */
  async panels(page) {
    const d = await demo(page);
    const [g0, g1] = d.groups;
    await page.evaluate(() => window.__check.resetLongTasks());
    const programs = await probe(page, 'programs');
    await openGroup(page, g1.name);
    check('group pool opens group 1: the group panel only is shown', same(await probe(page, 'panels'), ['group']), await probe(page, 'panels'));
    check('group pool marks group 1', (await probe(page, 'selectedGroup')) === g1.name, await probe(page, 'selectedGroup'));
    check('the panel shows group 1', (await probe(page, 'groupName')) === g1.name, await probe(page, 'groupName'));
    await openUniverse(page, d.universes[0].id);
    check('patch bay opens universe 0: the universe panel only is shown', same(await probe(page, 'panels'), ['universe']), await probe(page, 'panels'));
    check('group pool no longer marks a group', (await probe(page, 'selectedGroup')) === '', await probe(page, 'selectedGroup'));
    if (g0.chases.length) {
      await click(page, '.group_pool .uikit_cue_container:not(.master) .uikit_chase_title');
      check('a chase cell opens the chase panel only', same(await probe(page, 'panels'), ['chase']), await probe(page, 'panels'));
      check('the chase cell is marked', (await probe(page, 'selectedChase')) === 1, await probe(page, 'selectedChase'));
    }
    // The same switches three times: a step that blocks in two cycles out of three blocks for
    // real; a single slow task is noise (a CPU-rendered frame or a garbage collection nearby)
    const CYCLES = 3;
    for (let cycle = 0; cycle < CYCLES; cycle += 1) {
      for (const step of [g0.name, g1.name, g0.name]) await openGroup(page, step);
      await openUniverse(page, d.universes[cycle % d.universes.length].id);
      await openGroup(page, g0.name);
      const [first, , third] = g0.fixtures;
      if (first !== undefined) await clickRow(page, '.modifier_widget_fixture_pool', first);
      if (third !== undefined) await clickRow(page, '.modifier_widget_fixture_pool', third, ['Meta']);
    }
    const blocks = await page.evaluate((limit) => window.__check.blocks(limit), MAX_BLOCK_MS);
    const perStep = {};
    blocks.forEach((b) => {
      const step = b.replace(/^\d+ ms after /, '');
      perStep[step] = (perStep[step] || 0) + 1;
    });
    const repeated = Object.entries(perStep).filter(([, n]) => n >= 2).map(([step]) => step);
    check(
      `no click or key blocks the main thread over ${MAX_BLOCK_MS} ms while switching panels`,
      !repeated.length,
      `blocked in ${CYCLES} cycles: ${blocks.join('; ')}`,
    );
    if (blocks.length && !repeated.length) console.log(`  note: isolated slow tasks, not repeated: ${blocks.join('; ')}`);
    const compiled = (await probe(page, 'programs')) - programs;
    check('no shader compiles while switching panels and selecting', compiled === 0, `${compiled} new WebGL program(s)`);
  },

  /** The same switches while two cues of group 0 play: playback must not make them block */
  async playing(page) {
    const started = await page.evaluate(() => {
      const group = window.__check.show.groupPool.groups[0];
      const cues = group.cuePool.cues.slice(0, 2);
      cues.forEach((cue) => { if (cue.animationId == null) cue.cue(true); });
      return cues.filter((cue) => cue.animationId != null).length;
    });
    check('two cues play', started === 2, `${started} playing`);
    await wait(500);
    await SCENARIOS.panels(page);
  },

  /** Cut text scrolls to its end on hover and comes back when the pointer leaves */
  async textscroll(page) {
    // the patch bay's fixture names (h4) that are cut, and one that fits
    const names = await page.evaluate(() => {
      const all = [...document.querySelectorAll('.patch_bay .uikit_list_item h4')]
        .filter((h) => h.offsetParent);
      const cut = all.find((h) => h.scrollWidth > h.clientWidth + 1);
      const fits = all.find((h) => h.scrollWidth <= h.clientWidth);
      if (cut) cut.dataset.check = 'cut';
      if (fits) fits.dataset.check = 'fits';
      return { cut: !!cut, fits: !!fits };
    });
    check('the patch bay has a cut name and one that fits', names.cut && names.fits, names);
    if (!names.cut) return;
    const state = (which) => page.evaluate((w) => {
      const h = document.querySelector(`[data-check="${w}"]`);
      return {
        left: Math.round(h.scrollLeft),
        end: h.scrollWidth - h.clientWidth,
        overflow: h.style.textOverflow,
      };
    }, which);
    const hover = async (which) => {
      const box = await (await page.$(`[data-check="${which}"]`)).boundingBox();
      await page.mouse.move(box.x + 10, box.y + box.height / 2);
    };
    await hover('cut');
    await wait(300);
    const early = await state('cut');
    const { end } = early;
    await wait(400 + (end / 40) * 1000 + 300);
    const atEnd = await state('cut');
    check('a cut name stays still for a moment, then scrolls to its end', early.left === 0
      && atEnd.left >= end - 1, { early, atEnd });
    await page.mouse.move(2, 2);
    await wait(100);
    const left = await state('cut');
    check('leaving puts it back at its start, ellipsised', left.left === 0 && left.overflow === '', left);
    if (names.fits) {
      await hover('fits');
      await wait(1200);
      check('a name that fits stays still', (await state('fits')).left === 0);
      await page.mouse.move(2, 2);
    }
    // UI that clips its content never scrolls. In a smaller window, panels and rows clip (the
    // container of the patch bay and the group pool, the colour picker's channel rows): rest on
    // each element that holds other elements and is cut, near one of its children
    await page.setViewport({ width: 1100, height: 700 });
    await wait(500);
    // points whose element is within 3 levels of a cut UI element (where hovering could reach it)
    const uiPoints = await page.evaluate(() => {
      const cut = [...document.querySelectorAll('body *')].filter((e) => e.offsetParent
        && e.childElementCount > 0 && e.scrollWidth > e.clientWidth + 1
        && ['hidden', 'clip'].includes(getComputedStyle(e).overflowX));
      const points = [];
      cut.forEach((e) => {
        const r = e.getBoundingClientRect();
        for (let gy = 0.1; gy < 1 && points.length < 6; gy += 0.2) {
          for (let gx = 0.05; gx < 1; gx += 0.1) {
            const x = r.x + r.width * gx;
            const y = r.y + r.height * gy;
            let node = document.elementFromPoint(x, y);
            let depth = 0;
            while (node && node !== e && depth < 4) { node = node.parentElement; depth += 1; }
            if (node === e) {
              points.push([x, y]);
              return;
            }
          }
        }
      });
      return points;
    });
    const scrolledUi = [];
    for (const [x, y] of uiPoints) {
      await page.mouse.move(x, y);
      await wait(1500);
      scrolledUi.push(...await page.evaluate(() => [...document.querySelectorAll('body *')]
        .filter((e) => e.childElementCount > 0 && e.scrollLeft > 0
          && getComputedStyle(e).overflowX !== 'auto' && getComputedStyle(e).overflowX !== 'scroll')
        .map((e) => `${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]}`)));
    }
    await page.mouse.move(2, 2);
    await page.setViewport({ width: 1600, height: 1000 });
    check(`resting on UI (${uiPoints.length} places) scrolls no UI, only text`, uiPoints.length > 0
      && !scrolledUi.length, scrolledUi);
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await hover('cut');
    await wait(1500);
    check('with reduced motion, nothing scrolls', (await state('cut')).left === 0);
    await page.emulateMediaFeatures([]);
  },

  /** Select inputs: the current value is marked, arrows move, Enter picks, Escape cancels */
  async select(page) {
    await click(page, '.group_pool .uikit_cue_container:not(.master) .uikit_chase_title');
    const read = () => page.evaluate(() => {
      const box = [...document.querySelectorAll('.chase_modifier .uikit_select')]
        .find((el) => el.querySelector('.label')?.textContent.trim().startsWith('Quantize'));
      const view = document.querySelector('#app').__vue_app__.config.globalProperties.$view;
      const lists = [...document.querySelectorAll('.uikit_select_option_list')]
        .filter((el) => el.style.display !== 'none');
      const list = lists[0];
      return {
        value: box?.querySelector('.uikit_select_textbox').textContent.trim(),
        model: view.chase?.quantize,
        open: !!list,
        current: list?.querySelector('.current')?.textContent.trim() ?? null,
        marked: list?.querySelector('.marked')?.textContent.trim() ?? null,
      };
    });
    const options = ['None', '1/8', '1/4', '1/2', '1/1'];
    const start = await read();
    check('the chase panel shows its Quantize select', options.includes(start.value), start);
    await click(page, '.chase_modifier .uikit_select_textbox_wrapper', start.value);
    const opened = await read();
    check('opening the list marks the current value', opened.open && opened.current === start.value
      && opened.marked === start.value, opened);
    const currentBg = await page.evaluate(() => {
      const el = [...document.querySelectorAll('.uikit_select_option_list')]
        .find((l) => l.style.display !== 'none')?.querySelector('.current');
      const css = el && getComputedStyle(el);
      return css && { bg: css.backgroundColor, shadow: css.boxShadow };
    });
    const accent = await page.evaluate(() => {
      const swatch = document.createElement('div');
      swatch.style.background = 'var(--accent-blue)';
      document.body.appendChild(swatch);
      const bg = getComputedStyle(swatch).backgroundColor;
      swatch.remove();
      return bg;
    });
    check('the current value has a full accent background, like a selected row', currentBg
      && currentBg.bg === accent && currentBg.shadow === 'none', { currentBg, accent });
    await press(page, 'Escape');
    const escaped = await read();
    check('Escape closes the list and keeps the value', !escaped.open && escaped.value === start.value, escaped);
    await press(page, 'ArrowDown');
    const reopened = await read();
    await press(page, 'ArrowDown');
    await press(page, 'ArrowDown');
    const moved = await read();
    await press(page, 'Enter');
    const picked = await read();
    const expected = options[(options.indexOf(start.value) + 2) % options.length];
    check('Down opens the list, Down Down moves the mark, Enter picks it', reopened.open
      && moved.marked === expected && !picked.open && picked.value === expected
      && picked.model === options.indexOf(expected), {
      reopened, moved, picked, expected,
    });
    await press(page, 'n');
    await press(page, 'Enter');
    const typed = await read();
    check('typing a letter marks the option starting with it', typed.value === 'None' && typed.model === 0, typed);
  },

  /** The modifier strip and the group pool's groups resize from anywhere along their border */
  async resize(page) {
    const size = (sel, dim) => page.evaluate((s, d) => Math.round(document.querySelector(s)
      .getBoundingClientRect()[d]), sel, dim);
    const drag = async (axis, frac, delta) => {
      const r = await page.evaluate((a) => {
        const b = document.querySelector(a).getBoundingClientRect();
        return {
          x: b.x, y: b.y, w: b.width, h: b.height,
        };
      }, axis);
      const vertical = axis.endsWith('.y');
      const x = vertical ? r.x + r.w * frac : r.x;
      const y = vertical ? r.y : r.y + r.h * frac;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(vertical ? x : x + delta, vertical ? y + delta : y, { steps: 6 });
      await page.mouse.up();
      await wait(SETTLE_MS);
    };
    const top = await size('.top_fragments', 'height');
    await drag('.uikit_resize_handle.y', 0.9, -60);
    check(
      'dragging the strip\'s border near its end makes the strip 60 px taller',
      Math.abs(top - 60 - await size('.top_fragments', 'height')) <= 2,
    );
    const groups = await size('.group_pool_groups', 'width');
    await drag('.groups_resize', 0.5, 50);
    check(
      'dragging the groups\' border makes them 50 px wider',
      Math.abs(groups + 50 - await size('.group_pool_groups', 'width')) <= 2,
    );
    // mid-drag, over another element, the cursor stays a resize cursor
    const mid = await page.evaluate(() => {
      const b = document.querySelector('.groups_resize').getBoundingClientRect();
      return { x: b.x, y: b.y + b.height / 2 };
    });
    await page.mouse.move(mid.x, mid.y);
    await page.mouse.down();
    await page.mouse.move(mid.x - 120, mid.y, { steps: 4 });
    const cursor = await page.evaluate(({ x, y }) => getComputedStyle(document
      .elementFromPoint(x, y)).cursor, { x: mid.x - 120, y: mid.y });
    await page.mouse.up();
    await wait(SETTLE_MS);
    const after = await page.evaluate(() => getComputedStyle(document.body).cursor);
    check('the cursor stays col-resize while dragging, then comes back', cursor === 'col-resize'
      && after !== 'col-resize', { cursor, after });
    await drag('.groups_resize', 0.2, -3000);
    check('the groups stop at their minimum width', (await size('.group_pool_groups', 'width')) === 240);
    // the patch bay widens up to twice its width; the groups' limit leaves room for it
    await drag('.patch_bay_resize', 0.5, 120);
    check('dragging the patch bay\'s border makes it 120 px wider', (await size('.patch_bay', 'width')) === 320);
    await drag('.patch_bay_resize', 0.5, 2000);
    check('the patch bay stops at twice its width (400 px)', (await size('.patch_bay', 'width')) === 400);
    await drag('.groups_resize', 0.5, 3000);
    const vw = await page.evaluate(() => window.innerWidth);
    check(
      'the groups\' maximum shrinks by what the patch bay grew',
      (await size('.group_pool_groups', 'width')) === vw - 720 - 400,
    );
  },

  /** Modifier widgets: fixed universe ID, fixture pool width, effect fields, fade play dot */
  async widgets(page) {
    const d = await demo(page);
    const visibleEl = (sel) => `[...document.querySelectorAll('${sel}')].find((e) => e.offsetParent)`;
    // Universe ID: disabled, typing changes nothing
    await openUniverse(page, d.universes[0].id);
    const idField = await page.evaluateHandle(() => [
      ...document.querySelectorAll('.universe_settings_wrapper .uikit_num_input'),
    ].find((e) => e.offsetParent && e.querySelector('.label')?.textContent.trim() === 'ID'));
    const input = await idField.asElement()?.$('input');
    const disabled = input ? await input.evaluate((e) => e.disabled) : null;
    if (input) {
      await input.click({ clickCount: 3 }).catch(() => {});
      await page.keyboard.type('7');
      await page.keyboard.press('Enter');
      await wait(SETTLE_MS);
    }
    const ids = await page.evaluate(() => window.__check.show.universePool.universes
      .map((u) => u.id));
    const shown = input ? await input.evaluate((e) => e.value) : null;
    const unchanged = same(ids, d.universes.map((u) => u.id))
      && shown === String(d.universes[0].id);
    check('the universe ID field is disabled and typing leaves it unchanged', disabled === true
      && unchanged, { disabled, ids, shown });

    // Fixture pool: as wide as its rows, between 250 and 400 px
    const pool = () => page.evaluate((js) => {
      const w = eval(js); // eslint-disable-line no-eval
      const rows = [...w.querySelectorAll('.uikit_list_item')];
      const cut = rows.filter((r) => [...r.querySelectorAll('h4')]
        .some((t) => t.scrollWidth > t.clientWidth + 1)).map((r) => r.querySelector('h4').textContent.trim());
      const more = rows.some((r) => [...r.querySelectorAll('.uikit_list_item_more')]
        .some((t) => t.scrollWidth > t.clientWidth + 1));
      return { width: Math.round(w.getBoundingClientRect().width), cut, more };
    }, visibleEl('.modifier_widget_fixture_pool'));
    const fitted = await pool();
    check('the fixture pool fits the demo rows whole (250 to 400 px)', fitted.width >= 250
      && fitted.width <= 400 && !fitted.cut.length, fitted);
    const long = 'A fixture with a name long enough to need more than four hundred pixels';
    const original = await page.evaluate((n) => {
      const f = window.__check.show.universePool.universes[0].fixturePool.fixtures[0];
      const { name } = f;
      f.name = n;
      return name;
    }, long);
    await wait(SETTLE_MS * 2);
    const wide = await pool();
    check(
      'a long name widens the pool to 400 px, then its name is cut, not its address',
      wide.width === 400 && wide.cut.length === 1 && !wide.more,
      wide,
    );
    await page.evaluate((n) => {
      window.__check.show.universePool.universes[0].fixturePool.fixtures[0].name = n;
    }, original);

    // Effect tool: every field whole and clear of the canvas, with or without PWM's Width
    const effectGroup = d.groups.find((g) => g.cues.some((c) => c.type === 1));
    if (effectGroup) {
      await openGroup(page, effectGroup.name);
      await selectCueTile(page, effectGroup.cues.find((c) => c.type === 1).name);
      const fields = () => page.evaluate(() => {
        const w = [...document.querySelectorAll('.widget_wave')].find((e) => e.offsetParent);
        if (!w) return null;
        const canvas = w.querySelector('.widget_wave_modifier').getBoundingClientRect();
        const all = [...w.querySelectorAll('.uikit_num_input, .uikit_select')];
        const right = Math.max(...all.map((e) => e.getBoundingClientRect().right));
        const cut = all.map((e) => e.querySelector('.label'))
          .filter((l) => l && l.scrollWidth > l.clientWidth + 1)
          .map((l) => l.textContent.trim());
        return { gap: Math.round(canvas.left - right), cut, count: all.length };
      });
      const plain = await fields();
      // the channel the effect tool shows (dev build: components are reachable from their root)
      const wave = await page.evaluate(() => {
        const w = [...document.querySelectorAll('.widget_wave')].find((e) => e.offsetParent);
        let comp = w?.__vueParentComponent;
        while (comp && !comp.props?.channel) comp = comp.parent;
        const ch = comp?.props.channel;
        if (!ch?.waveOptions) return null;
        const before = ch.waveform;
        ch.waveform = ch.waveOptions.findIndex((o) => /pwm/i.test(o));
        window.__checkWave = { ch, before };
        return before;
      });
      await wait(SETTLE_MS);
      const pwm = await fields();
      check(
        'effect tool fields end at least 8 px before the canvas, labels whole (with PWM too)',
        plain && pwm && plain.gap >= 8 && pwm.gap >= 8 && !plain.cut.length && !pwm.cut.length
        && pwm.count > plain.count,
        { plain, pwm, wave },
      );
      await page.evaluate(() => {
        const { ch, before } = window.__checkWave || {};
        if (ch) ch.waveform = before;
      });
    } else check('the demo has an effect cue', false);

    // Fade editor: the play dot sits on the drawn curve, and at its end once done
    const sceneGroup = d.groups.find((g) => g.cues.some((c) => c.type === 0));
    const scene = sceneGroup.cues.find((c) => c.type === 0);
    await openGroup(page, sceneGroup.name);
    await selectCueTile(page, scene.name);
    const onCurve = () => page.evaluate(() => {
      const w = [...document.querySelectorAll('.widget_curve')].find((e) => e.offsetParent);
      const canvas = w.querySelector('canvas');
      const dot = w.querySelector('.widget_curve_picker');
      const c = canvas.getBoundingClientRect();
      const r = dot.getBoundingClientRect();
      const cx = ((r.left + r.width / 2) - c.left) * (canvas.width / c.width);
      const cy = ((r.top + r.height / 2) - c.top) * (canvas.height / c.height);
      const ctx = canvas.getContext('2d');
      const px = ctx.getImageData(Math.round(cx) - 3, Math.round(cy) - 3, 7, 7).data;
      let hit = false;
      for (let i = 3; i < px.length; i += 4) if (px[i] > 0) hit = true;
      return {
        hit, x: Math.round(cx), y: Math.round(cy), w: canvas.width, h: canvas.height,
      };
    });
    const bar = await page.evaluate((id) => {
      const group = window.__check.show.groupPool.groups
        .find((g) => g.cuePool.cues.some((c) => c.id === id));
      const cue = group.cuePool.cues.find((c) => c.id === id);
      cue.fadeIn.type = 3; // EASE_IN
      cue.duration = 1;
      if (cue.animationId != null) cue.cue(false);
      cue.cue(true);
      return cue.fadeIn.durationMS;
    }, scene.id);
    const playScene = (on, type) => page.evaluate((id, state, t) => {
      const cue = window.__check.show.groupPool.groups.flatMap((g) => g.cuePool.cues)
        .find((c) => c.id === id);
      if (t != null) cue.fadeIn.type = t;
      if (state !== (cue.animationId != null)) cue.cue(state);
    }, scene.id, on, type);
    await wait(bar * 0.45);
    const mid = await onCurve();
    check('the fade dot is on the drawn curve mid-fade', mid.hit && mid.x > 5 && mid.x < mid.w - 5, mid);
    // stopped halfway, then the curve changes: the dot moves onto the new curve
    await playScene(false, 4); // EASE_OUT
    await wait(SETTLE_MS * 2);
    const edited = await onCurve();
    check('after a curve edit, the fade dot is on the new curve', edited.hit, edited);
    await playScene(true, null);
    await wait(bar + 600);
    const end = await onCurve();
    // the end level (1) sits below the canvas top: the canvas shows -0.25 to 1.25
    const endY = end.h * (0.25 / 1.5);
    check('the fade dot stays at the curve\'s end once done', end.x >= end.w - 3
      && Math.abs(end.y - endY) <= 3, { ...end, endY });
  },

  /** Fade presets: the picker, playback as drawn, overshoot clamped */
  async curves(page) {
    const d = await demo(page);
    const group = d.groups.find((g) => g.cues.some((c) => c.type === 0));
    const scene = group.cues.find((c) => c.type === 0);
    await openGroup(page, group.name);
    await selectCueTile(page, scene.name);
    const fadeOf = () => page.evaluate((id) => {
      const cue = window.__check.show.groupPool.groups.flatMap((g) => g.cuePool.cues)
        .find((c) => c.id === id);
      return {
        type: cue.fadeIn.type,
        name: cue.fadeIn.presetNames[cue.fadeIn.type],
        points: cue.fadeIn.controlPoints.map((p) => [p.x, p.y]),
      };
    }, scene.id);
    await page.evaluate(() => window.__check.show.refreshSaveState());

    // The picker: a standard select of named presets, each with a picture of its curve
    await click(page, '.scene_fade_in .widget_curve_type .uikit_select_textbox_wrapper');
    const options = await page.evaluate(() => [...document.querySelectorAll(
      '.uikit_select_option_list .uikit_select_option',
    )].map((o) => ({ name: o.textContent.trim(), curve: !!o.querySelector('svg path') })));
    await click(page, '.uikit_select_option_list .uikit_select_option', 'Expo out');
    const picked = await fadeOf();
    const box = await page.evaluate(() => {
      const t = document.querySelector('.scene_fade_in .widget_curve_type .uikit_select_textbox');
      return { text: t?.textContent.trim(), curve: !!t?.querySelector('svg path') };
    });
    const unsaved = await page.evaluate(() => {
      window.__check.show.refreshSaveState();
      return !window.__check.show.isSaved;
    });
    check(
      'the fade type select lists 30 named presets with their curve; picking Expo out sets its points',
      options.length === 30 && options.every((o) => o.curve) && options[0].name === 'Custom'
        && options.some((o) => o.name === 'Back in-out') && picked.name === 'Expo out'
        && same(picked.points, [[0.16, 1], [0.3, 1]]) && box.text === 'Expo out' && box.curve
        && unsaved,
      {
        count: options.length, picked, box, unsaved,
      },
    );

    // Playback follows the drawn curve: Ease in at half time plays its value at time 0.5
    const played = await page.evaluate((id) => {
      const cue = window.__check.show.groupPool.groups.flatMap((g) => g.cuePool.cues)
        .find((c) => c.id === id);
      if (cue.animationId != null) cue.cue(false);
      cue.relative = false;
      const fv = cue.fixtureValues.find((v) => v.channels.some((c) => c.active && !c.isFine));
      const channel = fv.channels.find((c) => c.active && !c.isFine);
      const target = 200;
      channel.value = target;
      const read = () => fv.fixture.getQuickAccessor(channel).value.DMX;
      const at = (type, fraction) => {
        cue.fadeIn.type = type;
        // The scene's own fade-in at that fraction of its time
        cue.fadeIn.duration = 1;
        cue.fadeStart = 0;
        cue.fadeFrom = 0;
        cue.computeFadeFactor(fraction * cue.fadeInMS);
        cue.update(0);
        return read();
      };
      const easeIn = at(3, 0.5);
      const linear = at(1, 0.5);
      channel.value = 255;
      let max = 0;
      let raw = 0;
      for (let k = 0; k < 100; k += 1) {
        max = Math.max(max, at(28, k / 100));
        raw = Math.max(raw, cue.fadeIn.value);
      }
      return {
        easeIn, linear, max, raw, back: cue.fadeIn.presetNames[28],
      };
    }, scene.id);
    check(
      'an Ease in fade to 200 plays about 63 at half time (its curve), Linear 100',
      Math.abs(played.easeIn - 63) <= 2 && Math.round(played.linear) === 100,
      played,
    );
    check(
      `${played.back} overshoots its curve past 1 and the channel never exceeds 255`,
      played.back === 'Back out' && played.raw > 1.05 && played.max <= 255,
      played,
    );
  },

  /** Position Tool on several fixtures, the Arrange popup and its placement maths */
  async position(page) {
    const d = await demo(page);
    const u0 = d.universes[0];
    const [a, b] = u0.fixtures;
    const poses = (ids) => page.evaluate((list) => list.map((id) => {
      const f = window.__check.show.fixturePool.getFromId(id);
      return { ...f.position, rz: Math.round(f.rotation.z), invertPan: f.invertPan };
    }), ids);
    const field = (cls) => page.evaluate((c) => {
      const input = [...document.querySelectorAll(`.${c} input`)].find((e) => e.offsetParent);
      return input ? { value: input.value, placeholder: input.placeholder } : null;
    }, cls);

    await openUniverse(page, u0.id);
    await unfoldUniverse(page, u0.id);
    await clickRow(page, '.modifier_widget_fixture_pool', a);
    await clickRow(page, '.modifier_widget_fixture_pool', b, ['Meta']);
    await page.evaluate((ids) => {
      const { fixturePool } = window.__check.show;
      fixturePool.getFromId(ids[0]).setPose({ x: -2, y: 0, z: 4 }, { x: 180, y: 0, z: 30 });
      fixturePool.getFromId(ids[1]).setPose({ x: 2, y: 0, z: 4 }, { x: 180, y: 0, z: 30 });
    }, [a, b]);
    await wait(SETTLE_MS);
    const mixed = await field('position_tool_position_x');
    const sharedZ = await field('position_tool_position_z');
    const title = await page.evaluate(() => [...document.querySelectorAll('.position_tool .header h3, .position_tool .header')]
      .find((e) => e.offsetParent)?.textContent || '');
    check(
      'two fixtures selected: the Position Tool says so, X (they differ) shows --, Z (shared) shows 4',
      mixed?.value === '' && mixed?.placeholder === '--' && Number(sharedZ?.value) === 4
        && /Position Tool \(2\)/.test(title),
      { mixed, sharedZ, title },
    );

    // Typing sets the axis on both; the arrows nudge each from its own value
    const zInput = await page.evaluateHandle(() => [...document.querySelectorAll('.position_tool_position_z input')].find((e) => e.offsetParent));
    await zInput.asElement().click({ clickCount: 3 });
    await page.keyboard.type('6');
    await page.keyboard.press('Enter');
    await wait(SETTLE_MS);
    const typed = await poses([a, b]);
    await page.evaluate(() => [...document.querySelectorAll('.position_tool_position_x .uikit_num_input_button_section')]
      .find((e) => e.offsetParent).click());
    await wait(SETTLE_MS);
    const nudged = await poses([a, b]);
    check(
      'typing Z 6 sets both fixtures; the X arrow nudges each by 0.1 and keeps their spacing',
      typed.every((p) => p.z === 6) && typed[0].x === -2 && typed[1].x === 2
        && nudged[0].x === -1.9 && nudged[1].x === 2.1,
      { typed, nudged },
    );

    // Arrange: A opens it; Line X spacing 2 around 0 places four fixtures in pool order
    const four = u0.fixtures.slice(0, 4);
    await page.evaluate((ids) => document.querySelector('#app').__vue_app__.config.globalProperties.$view.selectFixtures(ids), four);
    await wait(SETTLE_MS);
    await page.evaluate(() => document.activeElement?.blur());
    await page.keyboard.press('a');
    await wait(SETTLE_MS);
    const opened = (await probe(page, 'popups')).includes('Arrange');
    const arrange = (fn, ...args) => page.evaluate((src, list) => {
      let c = document.querySelector('.arrange_popup').__vueParentComponent;
      while (c && !c.proxy?.pickMode) c = c.parent;
      // eslint-disable-next-line no-new-func
      return new Function('p', 'args', src)(c.proxy, list);
    }, fn, args);
    const startPoses = await poses(four);
    // Typing a decimal value keeps every digit, applied on Enter (not after the first key)
    await arrange("p.pickMode([{ id: 'line' }]);");
    await wait(SETTLE_MS);
    const spacingInput = await page.$('.arrange_spacing input');
    await spacingInput.click({ clickCount: 3 });
    await page.keyboard.type('12.5');
    const whileTyping = await arrange('return p.settings.line.spacing;');
    await page.keyboard.press('Enter');
    await wait(SETTLE_MS);
    const typedSpacing = await arrange('return p.settings.line.spacing;');
    check(
      'Arrange fields take a typed decimal value whole, applied on Enter',
      whileTyping === 1 && typedSpacing === 12.5,
      { whileTyping, typedSpacing },
    );
    await arrange("p.set('axis', 'x'); p.set('spacing', 2); p.set('centre', 0);");
    await submitTopPopup(page);
    await wait(SETTLE_MS);
    const lined = await poses(four);
    check(
      'A opens Arrange; Line on X, spacing 2 around 0, OK: four fixtures at −3, −1, 1, 3 in pool order',
      opened && same(lined.map((p) => p.x), [-3, -1, 1, 3]),
      { opened, lined },
    );
    // Circle then Cancel: every fixture back as it was
    await page.keyboard.press('a');
    await wait(SETTLE_MS);
    await arrange("p.pickMode([{ id: 'circle' }]); p.set('radius', 3);");
    const moved = await poses(four);
    await page.keyboard.press('Escape');
    await wait(SETTLE_MS);
    const restored = await poses(four);
    const left = await popupsAfterClosing(page, 0);
    check(
      'Circle moves the fixtures live; Escape (Cancel) puts every one back',
      !same(moved, lined) && same(restored, lined) && left.length === 0,
      {
        moved, restored, lined, left, startPoses,
      },
    );

    // Apply keeps the arrangement and the popup open; it is greyed out until something changes
    await page.keyboard.press('a');
    await wait(SETTLE_MS);
    const applyOff = await page.$eval('.arrange_commit', (e) => e.classList.contains('disabled'));
    await arrange("p.pickMode([{ id: 'line' }]); p.set('axis', 'y'); p.set('spacing', 1);");
    await wait(SETTLE_MS);
    const applyOn = await page.$eval('.arrange_commit', (e) => !e.classList.contains('disabled'));
    await page.click('.arrange_commit');
    await wait(SETTLE_MS);
    const committed = await poses(four);
    await page.keyboard.press('Escape');
    await wait(SETTLE_MS);
    const afterCancel = await poses(four);
    await popupsAfterClosing(page, 0);
    check(
      'Arrange Apply: greyed out until a change, keeps the result; Cancel then comes back to it',
      applyOff && applyOn && same(afterCancel, committed) && !same(committed, lined),
      {
        applyOff, applyOn, committed, afterCancel,
      },
    );

    // Mount buttons: Floor stands every selected fixture up, keeping its turn
    await page.evaluate((ids) => ids.forEach((id) => window.__check.show.fixturePool.getFromId(id)
      .setPose({ x: 0, y: 0, z: 6 }, { x: 180, y: 0, z: 30 })), four);
    await wait(SETTLE_MS);
    const hungLit = await page.$eval('.position_tool_mount_hung', (e) => e.classList.contains('toggled'));
    await page.click('.position_tool_mount_floor');
    await wait(SETTLE_MS);
    const floored = await page.evaluate((ids) => ids.map((id) => {
      const r = window.__check.show.fixturePool.getFromId(id).rotation;
      return [Math.round(r.x), Math.round(r.y), Math.round(r.z)];
    }), four);
    const turn = await field('position_tool_turn');
    check(
      'mounts: Hung lights for hung fixtures; Floor stands them up and keeps their turn (30°)',
      hungLit && floored.every((r) => same(r, [0, 0, 30])) && Number(turn?.value) === 30,
      { hungLit, floored, turn },
    );

    // Stage map: dragging a dot moves the whole selection, snapped to 0.25 m
    await page.evaluate((ids) => ids.forEach((id, i) => window.__check.show.fixturePool
      .getFromId(id).setPose({ x: i - 1.5, y: 0, z: 6 }, { x: 180, y: 0, z: 0 })), four);
    await wait(SETTLE_MS);
    const dot = await page.$(`.stage_map_fixture[data-fixture="${four[0]}"] circle`);
    const box = await dot.boundingBox();
    const cx = box.x + box.width / 2;
    const cy = box.y + box.height / 2;
    await page.mouse.move(cx, cy);
    await page.mouse.down();
    await page.mouse.move(cx + 20, cy - 20, { steps: 4 });
    await page.mouse.move(cx + 37, cy - 41, { steps: 4 });
    await page.mouse.up();
    await wait(SETTLE_MS);
    const dragged = await poses(four);
    const dx = dragged[0].x - -1.5;
    const dy = dragged[0].y;
    const onGrid = (v) => Math.abs(v * 4 - Math.round(v * 4)) < 1e-6;
    check(
      'stage map: dragging a dot moves every selected fixture by the same step, on a 0.25 m grid',
      dx > 0 && dy > 0 && onGrid(dragged[0].x) && onGrid(dragged[0].y)
        && dragged.every((p, i) => Math.abs(p.x - (i - 1.5 + dx)) < 1e-6
          && Math.abs(p.y - dy) < 1e-6 && p.z === 6),
      { dragged },
    );

    // The placement maths behind each mode
    const maths = await page.evaluate(async (modules) => {
      const P = await import(modules.placement);
      const pose = (x, y = 0, z = 0, rz = 0) => ({
        position: { x, y, z }, rotation: { x: 0, y: 0, z: rz },
      });
      const xy = (list) => list.map((p) => [p.position.x, p.position.y]);
      const xs = (list) => list.map((p) => p.position.x);
      return {
        grid: P.grid([pose(0), pose(0), pose(0), pose(0)], { columns: 2, spacingX: 2, spacingY: 2 })
          .map((p) => [p.position.x, p.position.y]),
        circle: xy(P.circle([pose(0), pose(0), pose(0), pose(0)], { radius: 1 })),
        arc: xy(P.arc([pose(0), pose(0), pose(0)], { radius: 1, start: 0, end: 180 })),
        align: xs(P.align([pose(0), pose(2), pose(6)], { axis: 'x', to: 'max' })),
        distribute: xs(P.distribute([pose(0), pose(5), pose(1), pose(9)], { axis: 'x' })),
        fan: P.fan([pose(0), pose(0), pose(0)], { axis: 'z', angle: 20 }).map((p) => p.rotation.z),
        down: P.aimRotation({ x: 0, y: 0, z: 4 }, { x: 0, y: 0, z: 0 }),
        up: P.aimRotation({ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 4 }),
        side: P.aimRotation({ x: 0, y: 0, z: 0 }, { x: 4, y: 0, z: 0 }),
        mount: P.mountOf(P.mountRotation('back', -45, 10)),
      };
    }, PAGE_MODULES);
    check(
      'placement maths: grid, circle, arc, align, distribute, fan, aim and mounts give the expected poses',
      same(maths.grid, [[-1, 1], [1, 1], [-1, -1], [1, -1]])
        && same(maths.circle, [[1, 0], [0, 1], [-1, 0], [0, -1]])
        && same(maths.arc, [[1, 0], [0, 1], [-1, 0]])
        && same(maths.align, [6, 6, 6])
        && same(maths.distribute, [0, 6, 3, 9])
        && same(maths.fan, [-20, 0, 20])
        && same(maths.down, { x: 180, y: 0, z: 0 }) && same(maths.up, { x: 0, y: 0, z: 0 })
        && same(maths.side, { x: 0, y: 90, z: 0 })
        && same(maths.mount, {
          mount: 'back', turn: -45, tilt: 10, exact: true,
        }),
      maths,
    );
  },

  /** Pan/Tilt and Colour scopes: views, drags, keys, fields, shapes, presets and the editor */
  async scopes(page) {
    const d = await demo(page);
    // An effect with Pan, Tilt and colour waves, and one with colour waves only
    const found = await page.evaluate(() => {
      const types = (cue) => (cue.channels || []).map((c) => c.type);
      for (const group of window.__check.show.groupPool.groups) {
        const effects = group.cuePool.cues.filter((c) => c.type === 1);
        const both = effects.find((c) => ['Pan', 'Tilt', 'Red'].every((t) => types(c).includes(t)));
        const colour = effects.find((c) => !types(c).includes('Pan') && types(c).includes('Red'));
        if (both && colour) return { group: group.id, both: both.id, colour: colour.id };
      }
      return null;
    });
    if (!found) {
      check('the demo has an effect with Pan, Tilt and colour waves, and a colour-only one', false, found);
      return;
    }
    const group = d.groups.find((g) => g.id === found.group);
    const cueName = (id) => group.cues.find((c) => c.id === id).name;
    const waves = (id = found.both) => page.evaluate((gid, cid) => {
      const { cues } = window.__check.show.groupPool.getFromId(gid).cuePool;
      const cue = cues.find((c) => c.id === cid);
      return Object.fromEntries(cue.channels.map((c) => [c.type, {
        min: c.min,
        max: c.max,
        phase: c.phase,
        start: c.fixturePhaseStart,
        stop: c.fixturePhaseStop,
        frequency: c.frequency,
        waveform: c.waveform,
        width: c.width,
        direction: c.direction,
      }]));
    }, found.group, id);
    // A known ellipse: pan 92-164, tilt 104-152, one cycle, the fixtures spread over it
    await page.evaluate((gid, cid) => {
      const { cues } = window.__check.show.groupPool.getFromId(gid).cuePool;
      const cue = cues.find((c) => c.id === cid);
      const set = (type, fields) => Object.assign(
        cue.channels.find((c) => c.type === type),
        fields,
      );
      const wave = {
        waveform: 0, frequency: 1, direction: 0, fixturePhaseStart: 0, fixturePhaseStop: 360,
      };
      set('Pan', {
        ...wave, min: 92, max: 164, phase: 0,
      });
      set('Tilt', {
        ...wave, min: 104, max: 152, phase: 90,
      });
    }, found.group, found.both);
    const shown = () => page.evaluate(() => {
      const all = (sel) => [...document.querySelectorAll(sel)]
        .filter((e) => e.getClientRects().length);
      return {
        pantilt: all('.pantilt_scope').length,
        paths: all('.pantilt_scope_path').length,
        dots: all('.pantilt_scope_dot').map((g) => g.textContent.trim()),
        labels: all('.pantilt_scope_label').length,
        queue: all('.pantilt_scope_queue').length,
        colour: all('.colour_scope').length,
      };
    });
    // The strip scrolls sideways: bring a scope into view before pointing at it
    const reveal = (sel) => page.evaluate((s) => [...document.querySelectorAll(s)]
      .find((e) => e.getClientRects().length)
      .scrollIntoView({ block: 'nearest', inline: 'nearest' }), sel);
    const pickFrom = async (select, option) => {
      await click(page, `${select} .uikit_select_textbox_wrapper`);
      await click(page, '.uikit_select_option_list .uikit_select_option', option);
    };
    const typeIn = async (sel, text) => {
      const input = await page.evaluateHandle((s) => [...document.querySelectorAll(`${s} input`)]
        .find((e) => e.getClientRects().length), sel);
      await input.asElement().click({ clickCount: 3 });
      await page.keyboard.type(text);
      await page.keyboard.press('Enter');
      await wait(SETTLE_MS);
    };

    // A modulated channel picked in the list shows its scope
    const selectChannel = async (type) => {
      await click(page, '.modifier_widget_effect_channels .uikit_list_item', new RegExp(`^${type}`));
      await wait(300);
    };
    await openGroup(page, group.name);
    await selectCueTile(page, cueName(found.both));
    await wait(300);
    await selectChannel('Pan');
    const both = await shown();
    const count = group.fixtures.length;
    check(
      'Pan selected: the Pan/Tilt Scope alone, one shared path with its queue, N dots, only the first numbered, no values in the plot',
      both.pantilt === 1 && both.colour === 0 && both.paths === 1 && both.queue === 1
        && both.labels === 0 && both.dots.length === count && both.dots[0] === '1'
        && both.dots.slice(1).every((text) => text === ''),
      both,
    );
    await selectChannel('Red');
    const red = await shown();
    await selectChannel('Dimmer');
    const dimmer = await shown();
    check(
      'Red selected: the Colour Scope alone; Dimmer selected: no scope',
      red.colour === 1 && red.pantilt === 0 && dimmer.colour === 0 && dimmer.pantilt === 0,
      { red, dimmer },
    );
    // The scope comes before the Effect Tool
    await selectChannel('Pan');
    const order = await page.evaluate(() => {
      const panel = [...document.querySelectorAll('.pantilt_scope')].find((e) => e.offsetParent)
        ?.parentElement;
      const kids = panel ? [...panel.children] : [];
      const at = (cls) => kids.findIndex((k) => k.classList.contains(cls));
      return { pantilt: at('pantilt_scope'), wave: at('widget_wave') };
    });
    check('the scope comes before the Effect Tool', order.pantilt >= 0 && order.pantilt < order.wave, order);

    await selectCueTile(page, cueName(found.colour));
    await wait(300);
    await selectChannel('Red');
    const colourOnly = await shown();
    check('a colour-only effect shows the Colour Scope and no Pan/Tilt Scope', colourOnly.pantilt === 0 && colourOnly.colour === 1, colourOnly);
    await selectCueTile(page, cueName(found.both));
    await wait(300);
    await selectChannel('Pan');

    // Circle in degrees: as many degrees across as up, from the fixture's own ranges
    const ranges = await page.evaluate(async (gid, cid, modules) => {
      const { rangesOf } = await import(modules.scope);
      const { cues } = window.__check.show.groupPool.getFromId(gid).cuePool;
      const cue = cues.find((c) => c.id === cid);
      return rangesOf(cue.channels.find((c) => c.type === 'Pan').fixtures.map((f) => f.handle));
    }, found.group, found.both, PAGE_MODULES);
    await reveal('.pantilt_scope');
    await pickFrom('.pantilt_scope_shape', 'Circle');
    const circle = await waves();
    const degrees = (w, range) => ((w.max - w.min) * range) / 255;
    check(
      'Circle is round in degrees: the pan and tilt spans cover the same angle (fixture ranges)',
      Math.abs(degrees(circle.Pan, ranges.pan) - degrees(circle.Tilt, ranges.tilt)) < 3,
      { ranges, pan: degrees(circle.Pan, ranges.pan), tilt: degrees(circle.Tilt, ranges.tilt) },
    );
    // Shapes are absolute: Line, then Circle, gives Circle alone
    await pickFrom('.pantilt_scope_shape', 'Line horizontal');
    await pickFrom('.pantilt_scope_shape', 'Pretzel');
    await pickFrom('.pantilt_scope_shape', 'Circle');
    const again = await waves();
    // The selects show what the waves are: Circle, then Custom once the tilt phase moves
    const selectText = (sel) => page.evaluate((q) => [...document.querySelectorAll(`${q} .uikit_select_textbox`)]
      .find((e) => e.offsetParent)?.textContent.trim(), sel);
    const shapeShown = await selectText('.pantilt_scope_shape');
    await page.evaluate((gid, cid) => {
      const { cues } = window.__check.show.groupPool.getFromId(gid).cuePool;
      const tilt = cues.find((c) => c.id === cid).channels.find((c) => c.type === 'Tilt');
      tilt.phase = 45;
    }, found.group, found.both);
    await wait(SETTLE_MS);
    const customShown = await selectText('.pantilt_scope_shape');
    await pickFrom('.pantilt_scope_shape', 'Circle');
    // The form keeps a fixed width on the left, the field is on its right
    const layout = await page.evaluate(() => {
      const scope = [...document.querySelectorAll('.pantilt_scope')].find((e) => e.offsetParent);
      const form = scope.querySelector('.pantilt_scope_controls').getBoundingClientRect();
      const field = scope.querySelector('.pantilt_scope_field').getBoundingClientRect();
      return {
        form: Math.round(form.width),
        left: field.right <= form.left + 1,
        square: Math.abs(field.width - field.height) <= 1,
      };
    });
    check(
      'Shape shows Circle, then Custom after a Tilt phase edit; a square graph sits left of the form (340 px)',
      shapeShown === 'Circle' && customShown === 'Custom' && layout.form === 340 && layout.left
        && layout.square,
      { shapeShown, customShown, layout },
    );
    check(
      'shapes leave no traces: Line, Pretzel, then Circle equals Circle alone',
      JSON.stringify([again.Pan, again.Tilt]) === JSON.stringify([circle.Pan, circle.Tilt]),
      { circle: [circle.Pan, circle.Tilt], again: [again.Pan, again.Tilt] },
    );

    // DMX view: moving the path snaps to the grid step; Shift moves by single steps
    await click(page, '.pantilt_scope_units');
    const geometry = () => page.evaluate(() => {
      const scope = [...document.querySelectorAll('.pantilt_scope')].find((e) => e.getClientRects().length);
      const svg = scope.querySelector('.pantilt_scope_svg');
      const box = scope.querySelector('.pantilt_scope_box').getBoundingClientRect();
      const field = scope.querySelector('.pantilt_scope_field').getBoundingClientRect();
      return {
        step: Number(svg.dataset.step),
        scale: field.width / svg.viewBox.baseVal.width,
        box: { x: box.x + box.width / 2, y: box.y + box.height / 2 },
        units: scope.querySelector('.pantilt_scope_field').dataset.units,
      };
    });
    const g = await geometry();
    const dragFromTo = async (from, to, shift) => {
      await page.mouse.move(from.x, from.y);
      await page.mouse.down();
      if (shift) await page.keyboard.down('Shift');
      await page.mouse.move((from.x + to.x) / 2, (from.y + to.y) / 2, { steps: 3 });
      await page.mouse.move(to.x, to.y, { steps: 3 });
      await page.mouse.up();
      if (shift) await page.keyboard.up('Shift');
      await wait(SETTLE_MS);
    };
    const before = await waves();
    await dragFromTo(g.box, { x: g.box.x + (g.step * 2 + g.step / 3) * g.scale, y: g.box.y });
    const moved = await waves();
    const g2 = await geometry();
    await dragFromTo(g2.box, { x: g2.box.x + 3 * g2.scale, y: g2.box.y }, true);
    const fine = await waves();
    check(
      'DMX view: dragging the path moves Pan Min and Max by grid steps (Shift: single steps); Tilt stays',
      g.units.toUpperCase() === 'DMX' && g.step > 0 && moved.Pan.min - before.Pan.min === g.step * 2
        && moved.Pan.max - before.Pan.max === g.step * 2 && fine.Pan.min - moved.Pan.min === 3
        && moved.Tilt.min === before.Tilt.min,
      {
        g, before: [before.Pan, before.Tilt], moved: [moved.Pan, moved.Tilt], fine: fine.Pan,
      },
    );
    // The top handle (outside the box) moves Tilt's high end only
    const handle = await page.evaluate(() => {
      const el = [...document.querySelectorAll('.pantilt_scope_handle_top')].find((e) => e.getClientRects().length);
      const r = el.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    const g3 = await geometry();
    const down = fine.Tilt.max > 255 - g3.step * 2;
    await dragFromTo(handle, { x: handle.x, y: handle.y + (down ? 2 : -2) * g3.step * g3.scale });
    const resized = (await waves()).Tilt;
    check(
      'dragging the top handle moves the Tilt high end by grid steps and keeps its low end',
      resized.max === fine.Tilt.max + (down ? -2 : 2) * g3.step && resized.min === fine.Tilt.min,
      { before: fine.Tilt, resized, step: g3.step },
    );
    // Arrow keys with the field focused
    await page.evaluate(() => [...document.querySelectorAll('.pantilt_scope_field')]
      .find((e) => e.getClientRects().length).focus());
    const beforeKeys = await waves();
    await press(page, 'ArrowDown');
    await press(page, 'ArrowLeft', ['Shift']);
    const keyed = await waves();
    check(
      'arrow keys move the path: Down lowers Tilt by 1, Shift+Left lowers Pan by 10',
      keyed.Tilt.min === beforeKeys.Tilt.min - 1 && keyed.Pan.min === beforeKeys.Pan.min - 10
        && keyed.Pan.max === beforeKeys.Pan.max - 10,
      { before: [beforeKeys.Pan, beforeKeys.Tilt], keyed: [keyed.Pan, keyed.Tilt] },
    );
    // Fields (DMX view): Centre pan 128 then Size pan 40 gives 108-148; Speed 3 triples
    await typeIn('.pantilt_scope_centrePan', '128');
    await typeIn('.pantilt_scope_sizePan', '40');
    await typeIn('.pantilt_scope_speed', '3');
    const typed = await waves();
    check(
      'typing Centre pan 128, Size pan 40 and Speed 3 sets Pan to 108-148 and both Freq to 3',
      typed.Pan.min === 108 && typed.Pan.max === 148 && typed.Pan.frequency === 3
        && typed.Tilt.frequency === 3,
      [typed.Pan, typed.Tilt],
    );
    // Spread: Mirror
    await pickFrom('.pantilt_scope_spread', 'Mirror');
    const mirrored = await waves();
    const sym = await page.evaluate((gid, cid) => {
      const { cues } = window.__check.show.groupPool.getFromId(gid).cuePool;
      return cues.find((c) => c.id === cid).channels[0].directionOptions.indexOf('SYM');
    }, found.group, found.both);
    check(
      'Mirror sets both waves to SYM, Phase start 0 and stop 360',
      ['Pan', 'Tilt'].every((t) => mirrored[t].direction === sym && mirrored[t].start === 0 && mirrored[t].stop === 360),
      [mirrored.Pan, mirrored.Tilt],
    );
    // Mirror: the second half plays pan flipped (heads as mirror images); saved and read back
    const mirror = await page.evaluate((gid, cid) => {
      const { cues } = window.__check.show.groupPool.getFromId(gid).cuePool;
      const cue = cues.find((c) => c.id === cid);
      const pan = cue.channels.find((c) => c.type === 'Pan');
      const tilt = cue.channels.find((c) => c.type === 'Tilt');
      const active = (w) => w.fixtures.filter((f) => f.active);
      const n = active(pan).length;
      const pairs = [];
      [0.1, 0.37, 0.8].forEach((t) => {
        pan.update(t);
        tilt.update(t);
        const [p1, pN] = [active(pan)[0].value, active(pan)[n - 1].value];
        const [t1, tN] = [active(tilt)[0].value, active(tilt)[n - 1].value];
        pairs.push({ panSum: Math.round(p1 + pN), tiltSame: Math.abs(t1 - tN) < 0.5 });
      });
      const data = pan.showData;
      const Channel = pan.constructor;
      const back = new Channel(data, cue.fixtures, cue.duration);
      const older = new Channel({ ...data, mirror: undefined }, cue.fixtures, cue.duration);
      return {
        panMirror: pan.mirror,
        tiltMirror: tilt.mirror,
        sum: pan.min + pan.max,
        pairs,
        saved: data.mirror,
        loaded: back.mirror,
        older: older.mirror,
      };
    }, found.group, found.both);
    check(
      'Mirror mirrors Pan only: first and last heads\' pans add up to Min + Max, same tilt; saved, read back, off when missing',
      mirror.panMirror === true && mirror.tiltMirror === false
        && mirror.pairs.every((p) => Math.abs(p.panSum - mirror.sum) <= 1 && p.tiltSame)
        && mirror.saved === true && mirror.loaded === true && mirror.older === false,
      mirror,
    );
    // The Effect Tool's Mirror toggle switches it for the channel it shows
    const toolMirror = async () => page.evaluate((gid, cid) => {
      const { cues } = window.__check.show.groupPool.getFromId(gid).cuePool;
      return cues.find((c) => c.id === cid).channels.find((c) => c.type === 'Pan').mirror;
    }, found.group, found.both);
    await click(page, '.widget_wave .widget_wave_mirror', 'mirror');
    const toolOff = await toolMirror();
    await click(page, '.widget_wave .widget_wave_mirror', 'mirror');
    const toolOn = await toolMirror();
    check('the Effect Tool\'s Mirror toggle switches the channel\'s Mirror', toolOff === false && toolOn === true, { toolOff, toolOn });
    // Hovering the graph reads the pan/tilt under the pointer and the grid step; a dot can't be
    // dragged along the path (a press on it moves the shape, like the box)
    const centre = await page.evaluate(() => {
      const r = [...document.querySelectorAll('.pantilt_scope_field')]
        .find((e) => e.getClientRects().length).getBoundingClientRect();
      return { x: r.x + r.width * 0.9, y: r.y + r.height * 0.9 };
    });
    await page.mouse.move(centre.x, centre.y);
    await wait(SETTLE_MS);
    const hoverText = await page.evaluate(() => [...document.querySelectorAll('.pantilt_scope_readout')]
      .find((e) => e.offsetParent)?.textContent.trim());
    check(
      'hovering the graph reads the pan and tilt under the pointer and the grid step',
      /^Pan -?\d+°? · Tilt -?\d+°? · grid \d+°?$/.test(hoverText || ''),
      hoverText,
    );
    // A corner handle moves one end of each span: bottom-right, the pan high and tilt low ends
    const cornerBefore = await waves();
    const g4 = await geometry();
    const corner = await page.evaluate(() => {
      const r = [...document.querySelectorAll('.pantilt_scope_handle_bottomright')]
        .find((e) => e.getClientRects().length).getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    const by = g4.step * g4.scale;
    await dragFromTo(corner, { x: corner.x + by, y: corner.y + by });
    const cornerAfter = await waves();
    const panHigh = Math.max(cornerBefore.Pan.min, cornerBefore.Pan.max);
    const tiltLow = Math.min(cornerBefore.Tilt.min, cornerBefore.Tilt.max);
    check(
      'dragging the bottom-right corner handle raises the Pan high end and lowers the Tilt low end',
      Math.max(cornerAfter.Pan.min, cornerAfter.Pan.max) === Math.min(255, panHigh + g4.step)
        && Math.min(cornerAfter.Tilt.min, cornerAfter.Tilt.max) === Math.max(0, tiltLow - g4.step)
        && Math.min(cornerAfter.Pan.min, cornerAfter.Pan.max)
          === Math.min(cornerBefore.Pan.min, cornerBefore.Pan.max),
      {
        before: [cornerBefore.Pan, cornerBefore.Tilt],
        after: [cornerAfter.Pan, cornerAfter.Tilt],
        step: g4.step,
      },
    );

    await selectChannel('Red');
    // Colour strip: drags snap to 15°, fields, presets
    await reveal('.colour_scope');
    const strip = await page.evaluate(() => {
      const el = [...document.querySelectorAll('.colour_scope_canvas')].find((e) => e.offsetParent);
      const r = el.getBoundingClientRect();
      const { dataset } = el.parentElement;
      return {
        x: r.x,
        y: r.y,
        width: r.width,
        rows: Number(dataset.rows),
        block: Number(dataset.block),
        band: Number(dataset.band),
      };
    });
    const dragStrip = async (y, dx) => {
      const x = strip.x + strip.width / 3;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + dx, y, { steps: 4 });
      await page.mouse.up();
      await wait(SETTLE_MS);
    };
    const colourBefore = await waves();
    const colourTypes = ['Red', 'Green', 'Blue'].filter((t) => colourBefore[t]);
    await dragStrip(strip.y + strip.band / 2, strip.width / 4 + 3);
    const shifted = await waves();
    const expectPhase = (t) => {
      const phase = colourBefore[t].phase - 90 * colourBefore[t].frequency;
      return Math.round(((phase % 360) + 360) % 360) % 360;
    };
    check(
      'dragging the colour strip a quarter width right shifts every colour Phase by 90° per cycle (snapped)',
      colourTypes.every((t) => shifted[t].phase === expectPhase(t)),
      colourTypes.map((t) => [t, colourBefore[t].phase, shifted[t].phase, expectPhase(t)]),
    );
    // The last row: scroll the rows to the bottom first (they scroll when there are many)
    const lastRow = await page.evaluate(() => {
      const canvas = [...document.querySelectorAll('.colour_scope_canvas')].find((e) => e.offsetParent);
      const field = canvas.closest('.colour_scope_field');
      field.scrollTop = field.scrollHeight;
      const { dataset } = canvas.parentElement;
      const r = canvas.getBoundingClientRect();
      return r.y + (Number(dataset.rows) - 1) * Number(dataset.block) + Number(dataset.band) / 2;
    });
    await dragStrip(lastRow, strip.width / 8);
    await page.evaluate(() => {
      const canvas = [...document.querySelectorAll('.colour_scope_canvas')].find((e) => e.offsetParent);
      canvas.closest('.colour_scope_field').scrollTop = 0;
    });
    const spread = await waves();
    check(
      'dragging the last row changes every colour wave\'s Phase stop',
      colourTypes.every((t) => spread[t].stop !== shifted[t].stop),
      colourTypes.map((t) => [t, shifted[t].stop, spread[t].stop]),
    );
    const colourWaves = await page.evaluate((gid, cid) => {
      const { cues } = window.__check.show.groupPool.getFromId(gid).cuePool;
      return cues.find((c) => c.id === cid).channels.map((c) => c.type)
        .filter((t) => ['Red', 'Green', 'Blue', 'Cyan', 'Magenta', 'Yellow', 'White', 'Amber'].includes(t));
    }, found.group, found.both);
    // Preset and Spread share the first row half and half, nothing else on it
    const head = await page.evaluate(() => {
      const scope = [...document.querySelectorAll('.colour_scope')].find((e) => e.offsetParent);
      const row = scope.querySelector('.colour_scope_head').getBoundingClientRect();
      const width = (sel) => Math.round(scope.querySelector(sel).getBoundingClientRect().width);
      return {
        preset: width('.colour_scope_preset'),
        spread: width('.colour_scope_spread'),
        row: Math.round(row.width),
        buttons: scope.querySelectorAll('.colour_scope_head .uikit_button').length,
      };
    });
    check(
      'Preset and Spread share the first row of the Colour Scope\'s form half and half',
      Math.abs(head.preset - head.spread) <= 1 && head.buttons === 0
        && head.preset + head.spread >= head.row - 12,
      head,
    );
    // Fields: Phase stop 0 on every colour wave
    await typeIn('.colour_scope_fixturePhaseStop', '0');
    const stopped = await waves();
    check('typing Phase stop 0 sets it on every colour wave', colourWaves.every((t) => stopped[t].stop === 0), colourWaves.map((t) => stopped[t].stop));
    // A preset that adds a channel: it shows in Modulated Channels at once
    await page.evaluate((gid, cid) => {
      const { cues } = window.__check.show.groupPool.getFromId(gid).cuePool;
      const cue = cues.find((c) => c.id === cid);
      const blue = cue.channels.find((c) => c.type === 'Blue');
      if (blue) cue.deleteChannel(blue);
    }, found.group, found.both);
    await wait(SETTLE_MS);
    const channelNames = () => page.evaluate(() => [...document.querySelectorAll(
      '.modifier_widget_effect_channels .uikit_list_item',
    )].filter((e) => e.offsetParent).map((e) => e.textContent.trim()));
    const withoutBlue = await channelNames();
    await pickFrom('.colour_scope_preset', 'Rainbow');
    const withBlue = await channelNames();
    const colourInputs = () => page.evaluate(() => [...document.querySelectorAll(
      '.colour_scope_colour input[type="color"]',
    )].filter((e) => e.offsetParent).map((e) => e.value));
    const rainbowInputs = await colourInputs();
    check(
      'Rainbow adds the missing Blue wave, shown at once in Modulated Channels; A and B read black and white',
      !withoutBlue.some((n) => /Blue/.test(n)) && withBlue.some((n) => /Blue/.test(n))
        && rainbowInputs.join() === '#000000,#ffffff',
      { withoutBlue, withBlue, rainbowInputs },
    );
    // Generic: Colour B on the rainbow sets every channel's Max, the hue offsets stay
    const setColourInput = (end, hex) => page.evaluate((e, h) => {
      const input = [...document.querySelectorAll(`.colour_scope_colour_${e} input[type="color"]`)]
        .find((el) => el.offsetParent);
      input.value = h;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }, end, hex);
    const rainbow = await waves();
    await setColourInput('b', '#ff8000');
    await wait(SETTLE_MS);
    const warm = await waves();
    check(
      'Colour B #ff8000 on Rainbow sets the Max of red, green, blue to 255, 128, 0 and keeps their phases',
      warm.Red.max === 255 && warm.Green.max === 128 && warm.Blue.max === 0
        && ['Red', 'Green', 'Blue'].every((t) => warm[t].phase === rainbow[t].phase),
      { warm: [warm.Red, warm.Green, warm.Blue] },
    );
    // The colour field takes a typed hex code
    const hexBox = await page.evaluateHandle(() => [...document.querySelectorAll(
      '.colour_scope_colour_a .uikit_color_input_textbox',
    )].find((e) => e.offsetParent));
    await hexBox.asElement().click({ clickCount: 3 });
    await page.keyboard.type('20c0ff');
    await page.keyboard.press('Enter');
    await wait(SETTLE_MS);
    const typedA = await waves();
    const shownA = await colourInputs();
    check(
      'typing 20c0ff in Colour A sets every channel\'s Min (32, 192, 255) and the field shows it',
      typedA.Red.min === 32 && typedA.Green.min === 192 && typedA.Blue.min === 255
        && shownA[0] === '#20c0ff',
      { red: typedA.Red, shownA },
    );
    // Add Modulated Channel: the fixtures' channels with icons, in use marked; OK adds and selects
    await click(page, '.modifier_widget_effect_channels .uikit_button', 'add');
    const offered = await page.evaluate(() => {
      const popup = [...document.querySelectorAll('.popup_fx_channels')].find((e) => e.offsetParent);
      return [...popup.querySelectorAll('.uikit_list_item')].map((e) => ({
        name: e.querySelector('h4')?.textContent.trim() || e.textContent.trim(),
        icon: !!e.querySelector('.uikit_list_item_icon'),
        inUse: /in use/.test(e.textContent),
      }));
    });
    const fresh = offered.find((o) => !o.inUse);
    if (fresh) {
      await click(page, '.popup_fx_channels .uikit_list_item', new RegExp(`^${fresh.name}`));
      await submitTopPopup(page);
    }
    const afterAdd = await page.evaluate((gid, cid) => {
      const { cues } = window.__check.show.groupPool.getFromId(gid).cuePool;
      const types = cues.find((c) => c.id === cid).channels.map((c) => c.type);
      const sel = [...document.querySelectorAll('.modifier_widget_effect_channels .uikit_list_item.selected')]
        .filter((e) => e.offsetParent).map((e) => e.textContent.trim());
      return { types, sel };
    }, found.group, found.both);
    check(
      'Add Modulated Channel lists the fixtures\' channels with icons (Pan in use); OK adds one and selects it',
      offered.length > 4 && offered.every((o) => o.icon) && offered.some((o) => o.inUse && /^Pan/.test(o.name))
        && fresh && afterAdd.types.includes(fresh.name)
        && afterAdd.sel.some((n) => n.startsWith(fresh.name)),
      { offered: offered.map((o) => `${o.name}${o.inUse ? '*' : ''}`), fresh, afterAdd },
    );
    await selectChannel('Red');
    // Police starts from red and blue (A and B show them); changing B rewrites the waves
    await pickFrom('.colour_scope_preset', 'Police');
    const policeInputs = await colourInputs();
    await setColourInput('b', '#4b0082');
    await wait(SETTLE_MS);
    const police = await waves();
    const swatches = await page.evaluate(
      async (modules) => (await import(modules.palette)).default,
      PAGE_MODULES,
    );
    const hexOf = (c) => `#${[c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
    const tomato = swatches.find((c) => c.name === 'Tomato Red');
    const blue = swatches.find((c) => c.name === 'Blue');
    check(
      'Police shows A Blue and B Tomato Red; B #4b0082 sets every channel\'s Max from it',
      policeInputs.join() === `${hexOf(blue)},${hexOf(tomato)}`
        && police.Red.max === 0x4b && police.Green.max === 0 && police.Blue.max === 0x82,
      { policeInputs, red: police.Red, blue: police.Blue },
    );
    // Chase: a Width field, setting every PWM colour wave
    await pickFrom('.colour_scope_preset', 'Chase');
    await typeIn('.colour_scope_width', '30');
    const chased = await waves();
    check(
      'Chase shows a Width field; typing 30 sets every colour wave\'s PWM width',
      ['Red', 'Green', 'Blue'].every((t) => chased[t].width === 30),
      ['Red', 'Green', 'Blue'].map((t) => chased[t].width),
    );

    // Presets are absolute: Strobe and Police, then Fade, equal Fade alone, from Colour A to B
    await pickFrom('.colour_scope_preset', 'Fade');
    const fadeAlone = await waves();
    await pickFrom('.colour_scope_preset', 'Strobe');
    const strobeSpread = await selectText('.colour_scope_spread');
    const strobePreset = await selectText('.colour_scope_preset');
    await page.evaluate((gid, cid) => {
      const { cues } = window.__check.show.groupPool.getFromId(gid).cuePool;
      cues.find((c) => c.id === cid).channels.find((c) => c.type === 'Green').phase = 33;
    }, found.group, found.both);
    await wait(SETTLE_MS);
    const editedPreset = await selectText('.colour_scope_preset');
    check(
      'picking Strobe shows Strobe and its Together spread; a Green phase edit shows Custom',
      strobePreset === 'Strobe' && strobeSpread === 'Together' && editedPreset === 'Custom',
      { strobePreset, strobeSpread, editedPreset },
    );
    await pickFrom('.colour_scope_preset', 'Police');
    await pickFrom('.colour_scope_preset', 'Fade');
    const fadeAgain = await waves();
    const [hexA, hexB] = await colourInputs();
    const rgbOf = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    const [a, b] = [rgbOf(hexA), rgbOf(hexB)];
    check(
      'colour presets leave no traces: Strobe, Police, then Fade equals Fade alone, from A to B',
      JSON.stringify(colourWaves.map((t) => fadeAgain[t]))
        === JSON.stringify(colourWaves.map((t) => fadeAlone[t]))
        && fadeAgain.Red.min === a[0] && fadeAgain.Red.max === b[0] && fadeAgain.Blue.max === b[2],
      {
        hexA, hexB, red: fadeAgain.Red, alone: fadeAlone.Red,
      },
    );

    // Playing: the playhead shows, the dots move, no main-thread block over 50 ms
    const dotsNow = () => page.evaluate(() => [...document.querySelectorAll('.pantilt_scope_dot')]
      .filter((e) => e.getClientRects().length).map((e) => `${e.style.left},${e.style.top}`).join(' '));
    await probe(page, 'resetLongTasks');
    await page.evaluate((gid, cid) => {
      const { cues } = window.__check.show.groupPool.getFromId(gid).cuePool;
      const cue = cues.find((c) => c.id === cid);
      if (cue.animationId == null) cue.cue(true);
    }, found.group, found.both);
    await wait(800);
    const playhead = await page.evaluate(() => [...document.querySelectorAll('.colour_scope_playhead')].some((e) => e.offsetParent));
    await selectChannel('Pan');
    const still = await dotsNow();
    await wait(700);
    const playing = {
      playhead,
      moved: (await dotsNow()) !== still,
      maxBlock: await probe(page, 'maxBlock'),
    };
    check('while the effect plays, the playhead shows, the dots move, no main-thread block over 50 ms', playing.playhead && playing.moved && playing.maxBlock <= 50, playing);
  },

  /** Addresses 1-512, the repatch popup and its map, the patch popup map, invert and swap */
  async repatch(page) {
    const d = await demo(page);
    const u0 = d.universes[0];
    const [first, second] = u0.fixtures;
    const fixtureState = (id) => page.evaluate((fid) => {
      const f = window.__check.show.fixturePool.getFromId(fid);
      return { universe: Number(f.universe), chStart: f.chStart, chCount: f.chCount };
    }, id);
    const canPatch = (uid, start, count) => page.evaluate((u, a, n) => window.__check.show
      .universePool.getFromId(u).canPatchMany(a, n, 1), uid, start, count);

    // Addresses read 1 to 512
    await openUniverse(page, u0.id);
    await unfoldUniverse(page, u0.id);
    await clickRow(page, '.modifier_widget_fixture_pool', first);
    const shown = await page.evaluate((id) => ({
      row: document.querySelector(`.patch_bay .uikit_list_item[data-key$="/id:${id}"] .uikit_list_item_more`)
        ?.textContent.trim(),
      field: [...document.querySelectorAll('.fixture_settings_patch input')].map((i) => i.value).join(','),
    }), first);
    const firstState = await fixtureState(first);
    check(
      'addresses read 1-512: the first fixture (stored 0) shows U0 - CH1, Start 1 and Stop 14',
      firstState.chStart === 0 && shown.row === `U${u0.id} - CH1`
        && shown.field === `1,${firstState.chCount},${firstState.chCount}`,
      { ...shown, firstState },
    );

    // The range of the fixture at address 0 counts as taken
    const free0 = await canPatch(u0.id, 0, 14);
    const past = await canPatch(u0.id, 505, 14);
    check('a range over address 1, or past 512, is not free', free0 === false && past === false, { free0, past });

    // Repatch popup: drag the second fixture to a free row, OK
    await clickRow(page, '.modifier_widget_fixture_pool', second);
    const before = await fixtureState(second);
    const dragTo = async (id, slot) => {
      const points = await page.evaluate((fid, target) => {
        const grid = document.querySelector('.repatch_popup .universe_map_grid').getBoundingClientRect();
        const block = document.querySelector(`.repatch_popup .universe_map_block.first[data-fixture="${fid}"]`)
          .getBoundingClientRect();
        const w = grid.width / 32;
        const h = grid.height / 16;
        return {
          from: { x: block.left + w / 2, y: block.top + block.height / 2 },
          to: {
            x: grid.left + ((target % 32) + 0.5) * w,
            y: grid.top + (Math.floor(target / 32) + 0.5) * h,
          },
          // the block's first slot, from its position
          startSlot: Math.round((block.left - grid.left) / w)
            + Math.round((block.top - grid.top) / h) * 32,
        };
      }, id, slot);
      await page.mouse.move(points.from.x, points.from.y);
      await page.mouse.down();
      await page.mouse.move(points.from.x + 10, points.from.y + 10, { steps: 3 });
      await page.mouse.move(points.to.x, points.to.y, { steps: 6 });
      await page.mouse.up();
      await wait(SETTLE_MS);
    };
    const openRepatch = async () => {
      await click(page, '.fixture_settings .header .uikit_button', 'Edit');
      await wait(SETTLE_MS);
    };
    const okEnabled = () => page.evaluate(() => {
      const ok = [...document.querySelectorAll('.popup .popup_validation .uikit_button, .popup .popup_validation button')]
        .find((b) => /^ok$/i.test(b.textContent.trim()));
      return !!ok && !ok.classList.contains('disabled') && !ok.disabled;
    });
    await openRepatch();
    const blocks = await page.evaluate(() => document.querySelectorAll('.repatch_popup .universe_map_block.first').length);
    await dragTo(second, 320); // row 11, first slot: address 321
    const draftOk = await okEnabled();
    const previewIds = () => page.evaluate(() => {
      const app = document.querySelector('#app').__vue_app__;
      const ids = app.config.globalProperties.$view.previewIds;
      return ids ? [...ids] : null;
    });
    const preview = { open: JSON.stringify(await previewIds()) === JSON.stringify([second]) };
    await submitTopPopup(page);
    preview.closed = (await previewIds()) === null;
    const moved = await fixtureState(second);
    const oldFree = await canPatch(u0.id, before.chStart, before.chCount);
    const shownAfter = await page.evaluate(() => [...document.querySelectorAll('.fixture_settings_patch input')]
      .map((i) => i.value).join(','));
    const unsaved = await page.evaluate(() => {
      window.__check.show.refreshSaveState();
      return !window.__check.show.isSaved;
    });
    check(
      'the map shows each fixture; dragging one to address 321 and OK repatches it there and frees its old range',
      blocks === u0.fixtures.length && draftOk && moved.chStart === 320 && oldFree
        && shownAfter === `321,${320 + moved.chCount},${moved.chCount}` && unsaved && preview.open
        && preview.closed,
      {
        blocks, draftOk, moved, oldFree, shownAfter, unsaved, preview,
      },
    );

    // A drag onto another fixture stops where the block last fitted; Cancel leaves everything
    await openRepatch();
    await dragTo(second, 0);
    const conflict = await page.evaluate(() => document.querySelectorAll('.repatch_popup .universe_map_block.conflict').length);
    const told = await page.evaluate((fid) => {
      let c = document.querySelector('.repatch_popup').__vueParentComponent;
      while (c && !c.proxy?.showUniverse) c = c.parent;
      return {
        errors: document.querySelectorAll('.repatch_popup .universe_message.error').length,
        conflicting: c.proxy.conflicting,
        draft: c.proxy.draft[fid].chStart,
      };
    }, second);
    await click(page, '.popup .popup_validation .uikit_button, .popup .popup_validation button', /^[Cc]ancel$/);
    await popupsAfterClosing(page, 0);
    const kept = await fixtureState(second);
    check(
      'dragging onto another fixture never overlaps it (the block stops where it last fitted); Cancel keeps every address',
      conflict === 0 && told.errors === 0 && !told.conflicting && told.draft !== 0
        && kept.chStart === 320,
      { conflict, kept, told },
    );

    // Dragging past the last row keeps the block inside the universe
    await openRepatch();
    const edge = await page.evaluate((fid) => {
      const grid = document.querySelector('.repatch_popup .universe_map_grid').getBoundingClientRect();
      const block = document.querySelector(`.repatch_popup .universe_map_block.first[data-fixture="${fid}"]`)
        .getBoundingClientRect();
      return {
        x: block.left + 8, y: block.top + 8, right: grid.right + 150, bottom: grid.bottom + 150,
      };
    }, second);
    await page.mouse.move(edge.x, edge.y);
    await page.mouse.down();
    await page.mouse.move(edge.right, edge.bottom, { steps: 8 }); // past the grid's corner
    await page.mouse.up();
    await wait(SETTLE_MS);
    const clamped = await page.evaluate((fid) => {
      let c = document.querySelector('.repatch_popup').__vueParentComponent;
      while (c && !c.proxy?.showUniverse) c = c.parent;
      return c.proxy.draft[fid].chStart;
    }, second);
    await click(page, '.popup .popup_validation .uikit_button, .popup .popup_validation button', /^[Cc]ancel$/);
    await popupsAfterClosing(page, 0);
    check('a block dragged past address 512 stops at the end of the universe', clamped === 512 - kept.chCount, { clamped });

    // Remove gaps packs the universe from address 1, in order
    await openRepatch();
    await click(page, '.repatch_popup .uikit_button', 'Remove gaps');
    await submitTopPopup(page);
    const packed = await page.evaluate((uid) => window.__check.show.universePool.getFromId(uid)
      .fixturePool.fixtures.map((f) => [f.chStart, f.chCount]).sort((a, b) => a[0] - b[0]), u0.id);
    const contiguous = packed.every(([start], i) => (i === 0 ? start === 0
      : start === packed[i - 1][0] + packed[i - 1][1]));
    check('Remove gaps packs the universe from address 1 without gaps', contiguous, packed.slice(0, 4));

    // Another universe: the fixture keeps its groups and scenes
    if (d.universes.length > 1) {
      const u1 = d.universes[1];
      const group = d.groups.find((g) => g.fixtures.includes(second));
      await openRepatch();
      const index = d.universes.findIndex((u) => u.id === u1.id);
      await page.evaluate((i) => {
        let c = document.querySelector('.repatch_popup').__vueParentComponent;
        while (c && !c.proxy?.showUniverse) c = c.parent;
        c.proxy.showUniverse(i);
      }, index);
      await wait(SETTLE_MS);
      await click(page, '.repatch_popup .uikit_button', 'Move to free range');
      await submitTopPopup(page);
      const across = await fixtureState(second);
      const kept2 = await page.evaluate((fid, uid, gid) => {
        const { show } = window.__check;
        const inUniverse = show.universePool.getFromId(uid).fixturePool.fixtures
          .some((f) => f.id === fid);
        const g = gid == null ? null : show.groupPool.groups.find((x) => x.id === gid);
        return {
          inUniverse,
          inGroup: g ? g.fixturePool.fixtures.some((f) => f.id === fid) : null,
        };
      }, second, u1.id, group ? group.id : null);
      check(
        'Move to free range in another universe moves the fixture there; its group keeps it',
        across.universe === Number(u1.id) && kept2.inUniverse && kept2.inGroup !== false,
        { across, ...kept2 },
      );
    }

    // Two fixtures trade places in one repatch; an overlapping one changes nothing
    const traded = await page.evaluate((ids) => {
      const { show } = window.__check;
      const [a, b] = ids.map((id) => show.fixturePool.getFromId(id));
      const pool = show.universePool;
      const at = [[a.universe, a.chStart], [b.universe, b.chStart]];
      pool.repatch([
        { fixture: a, universe: at[1][0], chStart: at[1][1] },
        { fixture: b, universe: at[0][0], chStart: at[0][1] },
      ]);
      const swapped = a.chStart === at[1][1] && b.chStart === at[0][1];
      let refused = false;
      try {
        pool.repatch([{ fixture: a, universe: b.universe, chStart: b.chStart }]);
      } catch {
        refused = a.chStart === at[1][1];
      }
      return { swapped, refused };
    }, [first, u0.fixtures[2]]);
    check('two fixtures trade addresses in one repatch; an overlap is refused unchanged', traded.swapped && traded.refused, traded);

    // Patch popup: the range about to be patched shows red over a fixture
    await openUniverse(page, u0.id);
    const highlight = await page.evaluate(async () => {
      let c = document.querySelector('.universe_modifier').__vueParentComponent;
      while (c && !c.proxy?.displayPatchPopup) c = c.parent;
      c.proxy.displayPatchPopup();
      await new Promise((r) => { setTimeout(r, 400); });
      let p = document.querySelector('.patch_popup').__vueParentComponent;
      while (p && !p.proxy?.loadFixture) p = p.parent;
      const list = await (await fetch('/gdtf/gdtf_list.json')).json();
      const par = list.fixtures.find((f) => /par/i.test(f.file));
      await p.proxy.loadFixture({ source: 'gdtf', manufacturer: par.manufacturer, fixture: par.fixtureTypeId });
      p.proxy.setAddress(1);
      await new Promise((r) => { setTimeout(r, 300); });
      const shownError = {
        red: !!document.querySelector('.patch_popup .universe_map_highlight.error'),
        error: p.proxy.patchError,
        message: document.querySelector('.patch_popup .universe_message.error')?.textContent.trim(),
        rowLabels: document.querySelectorAll('.patch_popup .universe_map_row_label').length,
      };
      // Several identical fixtures are numbered
      p.proxy.amount = 2;
      p.proxy.autoPatch();
      const known = window.__check.show.fixturePool.fixtures.length;
      p.proxy.patchFixtures();
      const added = window.__check.show.fixturePool.fixtures.slice(known);
      shownError.names = added.map((f) => f.name);
      shownError.poses = added.map((f) => [f.position.x, f.position.y, f.position.z, f.rotation.x]);
      shownError.base = p.proxy.fixture.name;
      return shownError;
    });
    await popupsAfterClosing(page, 0);
    check(
      'the patch popup map (no row numbers) shows a taken range in red, says which fixture holds it, and numbers identical fixtures',
      highlight.red && highlight.error && /^Addresses 1–\d+ are taken by /.test(highlight.message || '')
        && highlight.rowLabels === 0
        && JSON.stringify(highlight.names) === JSON.stringify([`${highlight.base} 1`, `${highlight.base} 2`]),
      highlight,
    );
    // New fixtures are hung 4 m up in a line, 1 m apart, on the first free row (demo heads: 11.5 m)
    check(
      'patched fixtures are hung in a line at 4 m, 1 m apart, 3 m in front, not at the origin',
      JSON.stringify(highlight.poses) === JSON.stringify([[-0.5, -3, 4, 180], [0.5, -3, 4, 180]]),
      highlight.poses,
    );

    // Invert and swap pan/tilt change the output, not the programmed values
    const output = await page.evaluate(() => {
      const { show } = window.__check;
      const fixture = show.fixturePool.fixtures.find((f) => f.hasPan && f.hasTilt);
      const universe = show.universePool.getFromId(fixture.universe);
      const pan = fixture.channels.findIndex((c) => c.attribute === 'Pan' && !c.isFine);
      const tilt = fixture.channels.findIndex((c) => c.attribute === 'Tilt' && !c.isFine);
      const panFine = fixture.channels[pan].fineIndexes[0];
      fixture.setChannel(pan, 64);
      if (panFine != null) fixture.setChannel(panFine, 0);
      fixture.setChannel(tilt, 10);
      const frame = () => {
        const f = universe.packFrame();
        return {
          pan: f[fixture.chStart + pan],
          panFine: panFine == null ? null : f[fixture.chStart + panFine],
          tilt: f[fixture.chStart + tilt],
        };
      };
      const plain = frame();
      fixture.invertPan = true;
      const inverted = frame();
      fixture.invertPan = false;
      fixture.swapPanTilt = true;
      const swapped = frame();
      const saved = fixture.showData.swapPanTilt;
      fixture.swapPanTilt = false;
      return {
        plain, inverted, swapped, saved, fader: fixture.channels[pan].value.DMX, panFine,
      };
    });
    check(
      'Invert pan outputs 255 - value (fine too); Swap outputs tilt on pan; the fader keeps 64',
      output.plain.pan === 64 && output.inverted.pan === 191
        && (output.panFine == null || output.inverted.panFine === 255)
        && output.swapped.pan === 10 && output.swapped.tilt === 64 && output.saved === true
        && output.fader === 64,
      output,
    );
  },

  /** Channel icons for every OFL and GDTF channel, range labels, and the preset menu */
  async presets(page) {
    // Every channel of every bundled fixture (OFL and GDTF) names an icon file, never the "x"
    const coverage = await page.evaluate(async (modules) => {
      const { default: channelIcon } = await import(modules.icons);
      const { default: FixtureLibrary } = await import(modules.library);
      const ofl = await (await fetch('/fixtures/fixture_list.json')).json();
      const gdtf = await (await fetch('/gdtf/gdtf_list.json')).json();
      const jobs = [
        ...ofl.flatMap(({ name, fixtures }) => fixtures.map((f) => ['ofl', name, f.replace('.json', '')])),
        ...gdtf.fixtures.map((f) => ['gdtf', f.manufacturer, f.fixtureTypeId]),
      ];
      const used = new Map();
      let channels = 0;
      let generic = 0;
      let profiles = 0;
      let unlabelled = 0;
      const loaded = await Promise.all(jobs.map(([source, manufacturer, model]) => FixtureLibrary
        .getProfile(source, manufacturer, model).catch(() => null)));
      for (const profile of loaded.filter(Boolean)) {
        profiles += 1;
        for (const mode of profile.modes) {
          for (const channel of mode.channels) {
            channels += 1;
            const icon = channelIcon(channel);
            if (icon === 'channel') generic += 1;
            used.set(icon, (used.get(icon) || 0) + 1);
            unlabelled += channel.capabilities.filter((c) => !c.label).length;
          }
        }
      }
      return {
        profiles, channels, generic, unlabelled, icons: [...used.keys()],
      };
    }, PAGE_MODULES);
    const missing = [];
    for (const icon of coverage.icons) {
      const res = await page.evaluate(async (n) => (await fetch(`/src/views/components/uikit/icons/images/${n}.svg`)).status, icon);
      if (res !== 200) missing.push(icon);
    }
    check(
      `every OFL and GDTF channel names an icon file, never "close" (${coverage.channels} channels, ${coverage.profiles} fixtures, ${coverage.generic} generic)`,
      coverage.profiles > 400 && !missing.length && !coverage.icons.includes('close'),
      { missing, profiles: coverage.profiles },
    );
    check('every range of every OFL and GDTF fixture has a label', coverage.unlabelled === 0, coverage.unlabelled);

    // One attribute per GDTF family finds its family's icon
    const families = {
      Dimmer: 'dimmer',
      Pan: 'pan',
      TiltRotate: 'tilt',
      PositionMSpeed: 'speed',
      ColorAdd_RY: 'colorintensityamber',
      ColorAdd_GY: 'colorintensitylime',
      ColorAdd_UV: 'colorintensityuv',
      ColorAdd_WW: 'colorintensitywarmwhite',
      ColorSub_C: 'colorintensitycyan',
      ColorRGB_Red: 'colorintensityred',
      CTO: 'colortemperature',
      HSB_Hue: 'hueshift',
      HSB_Saturation: 'saturation',
      ColorMacro1: 'colorpreset',
      Color2: 'colorwheel',
      Color1WheelSpin: 'colorwheel',
      Gobo2: 'gobowheel',
      Gobo2PosRotate: 'goborotation',
      Gobo1WheelSpin: 'goborotation',
      Gobo1PosShake: 'shake',
      AnimationWheel1: 'animation',
      Shutter1: 'shutter',
      Shutter1StrobeRandom: 'strobe',
      StrobeFrequency: 'strobe',
      Iris: 'iris',
      Frost1: 'frost',
      Prism1: 'prism',
      Prism1PosRotate: 'prismrotation',
      Effects2: 'effect',
      Effects1Rate: 'speed',
      Blade3A: 'shaper',
      Zoom: 'zoom',
      Focus1: 'focus',
      Fog1: 'fog',
      Fan1: 'fan',
      Control1: 'maintenance',
      FixtureGlobalReset: 'maintenance',
      DimmerMode: 'control',
    };
    const wrong = await page.evaluate(async (expected, modules) => {
      const { default: channelIcon } = await import(modules.icons);
      return Object.entries(expected)
        .map(([attribute, icon]) => [
          attribute, icon, channelIcon({ attribute, type: attribute, name: attribute })])
        .filter(([, icon, got]) => icon !== got);
    }, families, PAGE_MODULES);
    check('one attribute of each GDTF family gets its family icon', !wrong.length, wrong);

    // GDTF ranges keep their channel set names
    const gdtfShutter = await page.evaluate(async (modules) => {
      const { default: FixtureLibrary } = await import(modules.library);
      const list = await (await fetch('/gdtf/gdtf_list.json')).json();
      const par = list.fixtures.find((f) => /par/i.test(f.file));
      const profile = await FixtureLibrary.getProfile('gdtf', par.manufacturer, par.fixtureTypeId);
      const shutter = profile.modes[0].channels.find((c) => /^Shutter\d$/.test(c.attribute));
      return shutter ? shutter.capabilities.map((c) => c.label) : null;
    }, PAGE_MODULES);
    check(
      'a GDTF shutter\'s ranges carry their channel set names',
      !!gdtfShutter && ['Closed', 'Open', 'Strobe'].every((l) => gdtfShutter.includes(l)),
      gdtfShutter,
    );

    // Universe: every channel has a menu; the MAC Aura's shutter offers its ranges
    const d = await demo(page);
    await openUniverse(page, d.universes[0].id);
    const columns = () => page.evaluate(() => {
      const w = [...document.querySelectorAll('.channels_widget')].find((e) => e.offsetParent);
      return [...w.querySelectorAll('.channels_channel')].map((c) => ({
        menu: !!c.querySelector('.channel_select .uikit_select_trigger'),
        text: c.querySelector('.channel_select_text')?.textContent.trim() ?? null,
        title: c.querySelector('.channel_select')?.getAttribute('title') ?? null,
      }));
    });
    // the open list (fixed, so no offsetParent: the shown one is the one not hidden)
    const openList = () => page.evaluate(() => {
      const list = [...document.querySelectorAll('.uikit_select_option_list.with_trigger')]
        .find((e) => e.style.display !== 'none');
      if (!list) return null;
      return {
        header: list.querySelector('.uikit_select_header')?.textContent.trim() ?? null,
        search: !!list.querySelector('.uikit_list_searchbox'),
        options: [...list.querySelectorAll('.uikit_list_item')]
          .map((o) => o.textContent.replace(/\s+/g, ' ').trim()),
        current: list.querySelector('.uikit_list_item.selected')?.textContent
          .replace(/\s+/g, ' ').trim() ?? null,
      };
    });
    const target = await page.evaluate(() => {
      const app = document.querySelector('#app').__vue_app__;
      const view = app.config.globalProperties.$view;
      const fixture = view.universeFixtures?.[0] || view.fixtures?.[0];
      const index = fixture.channels.findIndex((c) => /^Shutter\d$/.test(c.attribute)
        && c.capabilities.length > 2);
      const dimmer = fixture.channels.findIndex((c) => c.attribute === 'Dimmer'
        && c.capabilities.length === 1);
      const caps = fixture.channels[index].capabilities;
      const pick = caps.findIndex((c, i) => i > 0 && c.range[0] > caps[0].range[1]);
      return {
        fixtureId: fixture.id,
        index,
        dimmer,
        dimmerName: fixture.channels[dimmer]?.name,
        name: fixture.channels[index].name,
        strobes: caps.filter((c) => /strobe/i.test(c.label)).length,
        pick,
        start: caps[pick].range[0],
        end: caps[pick].range[1],
        label: caps[pick].label,
      };
    });
    const before = await columns();
    const triggerOf = (i) => `.channels_widget .channels_channel:nth-child(${i + 1}) .uikit_select_trigger`;
    await click(page, triggerOf(target.dimmer));
    const dimmerList = await openList();
    await press(page, 'Escape');
    check(
      'every channel has a menu; a dimmer\'s shows its full name and its one range',
      before.every((c) => c.menu) && before[target.dimmer]?.text === target.dimmerName
        && dimmerList?.header === target.dimmerName && dimmerList.options.length === 1,
      { dimmer: before[target.dimmer], dimmerList },
    );
    const triggerSel = triggerOf(target.index);
    await click(page, triggerSel);
    const shutterList = await openList();
    await page.keyboard.type('strobe');
    await wait(SETTLE_MS);
    const searched = await openList();
    await press(page, 'Escape');
    check(
      'a long range list has a search field that filters it, under the channel\'s name',
      shutterList?.header === target.name && shutterList.search
        && searched.options.length === target.strobes
        && searched.options.every((o) => /strobe/i.test(o)),
      { header: shutterList?.header, search: shutterList?.search, searched: searched?.options },
    );
    await click(page, triggerSel);
    await pickPreset(page, target);
    const picked = await page.evaluate((t) => {
      const fixture = window.__check.show.fixturePool.getFromId(t.fixtureId);
      return fixture.channels[t.index].value.DMX;
    }, target);
    await click(page, triggerSel);
    const marked = (await openList())?.current;
    await press(page, 'Escape');
    check(
      'picking a range sets the channel to its start and the menu marks it',
      picked === target.start && squash(marked) === squash(presetText(target)),
      {
        picked, start: target.start, marked, label: target.label,
      },
    );
    const shown = (await columns())[target.index];
    check(
      'the channel\'s box shows the current range, its tooltip the name and range',
      shown.text === target.label && shown.title === `${target.name}: ${target.label}`,
      shown,
    );

    // Keys: Down then Enter picks the next range, Escape leaves it
    const expected = await page.evaluate((t) => {
      const ch = window.__check.show.fixturePool.getFromId(t.fixtureId).channels[t.index];
      const at = ch.capabilities.findIndex((c) => ch.value.DMX >= c.range[0]
        && ch.value.DMX <= c.range[1]);
      return ch.capabilities[(at + 1) % ch.capabilities.length].range[0];
    }, target);
    await click(page, triggerSel);
    await press(page, 'ArrowDown');
    await press(page, 'Enter');
    const next = await page.evaluate((t) => {
      const fixture = window.__check.show.fixturePool.getFromId(t.fixtureId);
      return { value: fixture.channels[t.index].value.DMX };
    }, target);
    next.expected = expected;
    await click(page, triggerSel);
    await press(page, 'ArrowDown');
    await press(page, 'Escape');
    const kept = await page.evaluate((t) => window.__check.show.fixturePool
      .getFromId(t.fixtureId).channels[t.index].value.DMX, target);
    check(
      'Down and Enter pick the next range; Escape closes the menu unchanged',
      next.value === next.expected && kept === next.value,
      { next, kept },
    );

    // Scene: two fixtures of the same type, an inactive channel: both set, the channel active
    const sceneGroup = d.groups.find((g) => g.fixtures.length > 1
      && g.cues.some((c) => c.type === 0));
    await openGroup(page, sceneGroup.name);
    await selectCueTile(page, sceneGroup.cues.find((c) => c.type === 0).name);
    const ids = sceneGroup.fixtures.slice(0, 2);
    await page.evaluate((list) => {
      document.querySelector('#app').__vue_app__.config.globalProperties.$view.selectFixtures(list);
    }, ids);
    await wait(SETTLE_MS);
    const row = await page.evaluate(() => {
      const w = [...document.querySelectorAll('.channels_widget')].find((e) => e.offsetParent);
      let comp = w?.__vueParentComponent;
      while (comp && !comp.props?.channels) comp = comp.parent;
      const rows = comp?.props.channels || [];
      const index = rows.findIndex((r) => r.capabilities && r.capabilities.length > 2
        && /^Shutter\d$/.test(r.attribute) && r.targets.length === 2);
      if (index < 0) return null;
      const r = rows[index];
      // make it inactive first, as a fresh scene channel is
      r.targets.forEach((t) => t.fixtureValue.setQuickAccessor({
        type: t.type, qaIndex: t.qaIndex, value: 0, active: false,
      }));
      const pick = r.capabilities.findIndex((c, i) => i > 0 && c.range[0] > 0);
      const [start, end] = r.capabilities[pick].range;
      return {
        index,
        pick,
        start,
        end,
        label: r.capabilities[pick].label,
      };
    });
    if (!row) {
      check('a scene row of two same-type fixtures offers presets', false, 'no such row');
      return;
    }
    await page.evaluate(() => window.__check.show.refreshSaveState());
    await wait(SETTLE_MS);
    const sceneTrigger = `.channels_widget .channels_channel:nth-child(${row.index + 1}) .uikit_select_trigger`;
    await click(page, sceneTrigger, null, { within: '.group_modifier' });
    await pickPreset(page, row);
    await wait(SETTLE_MS);
    const scene = await page.evaluate((r) => {
      const w = [...document.querySelectorAll('.channels_widget')].find((e) => e.offsetParent);
      let comp = w?.__vueParentComponent;
      while (comp && !comp.props?.channels) comp = comp.parent;
      const current = comp.props.channels[r.index];
      const entries = current.targets.map((t) => {
        const fv = t.fixtureValue;
        const i = fv.fixture.channels
          .findIndex((c) => c.type === t.type && c.qaIndex === t.qaIndex);
        const e = fv.entryOf(i);
        return { value: e.value, active: e.active };
      });
      window.__check.show.refreshSaveState();
      return { entries, saved: window.__check.show.isSaved };
    }, row);
    check(
      'a scene preset sets both fixtures, activates the channel and marks the show unsaved',
      scene.entries.length === 2 && scene.entries.every((e) => e.value === row.start && e.active)
        && scene.saved === false,
      { ...scene, start: row.start },
    );
  },

  /** Cue fades: effects (Relative only), scenes (hold, fade out), chase items and their preview */
  async fxfades(page) {
    const d = await demo(page);
    // Errors Vue reports (watchers, renders) go to the app's error bus, not to window
    await page.evaluate(async () => {
      // The app's own instance: the URL it was loaded from
      const url = performance.getEntriesByType('resource').map((e) => e.name)
        .find((n) => n.includes('/plugins/eventbus.js'));
      const bus = (await import(url)).default;
      window.__appErrors = [];
      bus.on('app_error', (e) => window.__appErrors.push(String((e && e.message) || e)));
    });
    const found = await page.evaluate(() => {
      for (const group of window.__check.show.groupPool.groups) {
        const fx = group.cuePool.cues.find((c) => c.type === 1
          && c.channels.some((ch) => ch.type === 'Pan'));
        if (fx) return { group: group.id, fx: fx.id };
      }
      return null;
    });
    if (!found) {
      check('the demo has an effect with a Pan wave', false, found);
      return;
    }
    const group = d.groups.find((g) => g.id === found.group);
    const fxName = group.cues.find((c) => c.id === found.fx).name;
    const fadesShown = () => page.evaluate(() => ['.effect_fade_in', '.effect_fade_out']
      .map((s) => [...document.querySelectorAll(s)].some((e) => e.getClientRects().length)));
    const setFx = (fields) => page.evaluate((gid, cid, f) => {
      const fx = window.__check.show.groupPool.getFromId(gid).cuePool.cues
        .find((c) => c.id === cid);
      Object.assign(fx, f);
    }, found.group, found.fx, fields);

    await openGroup(page, group.name);
    await selectCueTile(page, fxName);
    await setFx({ relative: 0 });
    await wait(SETTLE_MS);
    const absolute = await fadesShown();
    await setFx({ relative: 1 });
    await wait(SETTLE_MS);
    const relative = await fadesShown();
    check(
      'Fade In and Fade Out widgets show only when Start is Relative',
      absolute.every((v) => !v) && relative.every(Boolean),
      { absolute, relative },
    );

    // Played by hand (Live's tick replaced by a no-op) so the times are exact
    const run = await page.evaluate(async (gid, cid, modules) => {
      const Live = (await import(modules.live)).default;
      const fx = window.__check.show.groupPool.getFromId(gid).cuePool.cues
        .find((c) => c.id === cid);
      const pan = fx.channels.find((ch) => ch.type === 'Pan');
      const fxFixture = pan._fixtures.find((f) => f.active);
      const fixture = fxFixture.handle;
      const index = fxFixture.targets[0].direct[0];
      const value = () => fixture.channels[index].value.DMX;
      const effectValue = () => Math.floor(fxFixture.value);
      const hold = (v) => {
        fixture.setChannel(index, v);
        fxFixture.recordStart();
      };
      const start = (relativeStart) => {
        fx.relative = relativeStart;
        fx.cue(true);
        // A no-op in place of the effect's tick: the test drives update() itself
        Live.remove(fx.animationId);
        fx.animationId = Live.add(() => {});
        fx.deltaStart = 0;
      };
      // One tick of the cue's own playback at a time since cued
      const tick = (t) => fx._update(t);
      const bar = Live.barDuration;
      fx.fadeIn.duration = 2;
      fx.fadeOut.duration = 1;
      const out = {};

      // Absolute: full strength on the first frame
      hold(10);
      start(0);
      tick(0);
      out.absolute = { value: value(), effect: effectValue() };
      fx.cue(false);

      // Relative: from the held value, to the effect after the Fade In
      hold(10);
      start(1);
      tick(0);
      out.first = value();
      tick(bar);
      out.half = { value: value(), effect: effectValue(), factor: fx.fadeFactor };
      tick(2 * bar + 1);
      out.full = { value: value(), effect: effectValue(), factor: fx.fadeFactor };

      // Stop: shown stopped at once, back to the held value after the Fade Out
      fx.cue(false);
      out.stopped = { state: fx.state, running: fx.animationId != null };
      tick(2 * bar + 1 + bar / 2);
      out.mid = value();
      tick(3 * bar + 2);
      out.end = { value: value(), running: fx.animationId != null, factor: fx.fadeFactor };

      // Cued again halfway through a fade-out: no jump
      hold(10);
      start(1);
      tick(2 * bar + 1);
      fx.cue(false);
      tick(2 * bar + 1 + bar / 2);
      const before = value();
      fx.cue(true);
      tick(2 * bar + 1 + bar / 2);
      out.again = { before, after: value(), state: fx.state };
      fx.fadeOut.duration = 0;
      fx.cue(false);
      fx.fadeOut.duration = 1;

      // Saved with the show; an older effect without fades has none
      const data = JSON.parse(JSON.stringify(fx.showData));
      const Fx = fx.constructor;
      const copy = new Fx({ ...data, fixtures: [], channels: [] });
      const older = new Fx({
        ...data, fadeIn: undefined, fadeOut: undefined, fixtures: [], channels: [],
      });
      out.saved = {
        fadeIn: data.fadeIn,
        copy: [copy.fadeIn.duration, copy.fadeOut.duration],
        older: [older.fadeIn.duration, older.fadeOut.duration],
      };
      const { show } = window.__check;
      show.refreshSaveState();
      out.unsaved = !show.isSaved;
      return out;
    }, found.group, found.fx, PAGE_MODULES);
    check(
      'Absolute: the effect writes at full strength on its first frame',
      run.absolute.value === run.absolute.effect,
      run.absolute,
    );
    check(
      'Relative: starts at the held value, blends halfway, reaches the effect after the Fade In',
      run.first === 10 && run.half.factor > 0 && run.half.factor < 1
        && run.full.factor === 1 && run.full.value === run.full.effect,
      run,
    );
    check(
      'Stop: shown stopped at once, still running, then back to the held value and removed',
      run.stopped.state === 0 && run.stopped.running && run.mid !== 10
        && run.end.value === 10 && !run.end.running && run.end.factor === 1,
      run,
    );
    check(
      'Cued again while fading out: no jump, running again',
      Math.abs(run.again.after - run.again.before) <= 1 && run.again.state === 1,
      run.again,
    );
    check(
      'Fades are saved (with their time), older effects load with none, the show is unsaved',
      run.saved.fadeIn.duration === 2 && run.saved.copy[0] === 2 && run.saved.copy[1] === 1
        && run.saved.older[0] === 0 && run.saved.older[1] === 0 && run.unsaved,
      run.saved,
    );

    // An effect in a chase item: fades by its times in Relative, full strength in Absolute
    const fxItem = await page.evaluate(async (gid, cid, modules) => {
      const Live = (await import(modules.live)).default;
      const fx = window.__check.show.groupPool.getFromId(gid).cuePool.cues
        .find((c) => c.id === cid);
      const bar = Live.barDuration;
      const at = (t) => {
        fx.playItem(t, 4 * bar);
        return Number(fx.fadeFactor.toFixed(3));
      };
      fx.fadeIn.duration = 1;
      fx.fadeOut.duration = 1;
      fx.relative = 1;
      fx.itemActive = false;
      const faded = [at(bar / 2), at(2 * bar), at(3.5 * bar)];
      fx.endItem();
      fx.relative = 0;
      const full = at(0);
      fx.endItem();
      return { relative: faded, absolute: full };
    }, found.group, found.fx, PAGE_MODULES);
    check(
      'Effect in a chase item: Relative fades in, holds, fades out; Absolute plays at full strength',
      fxItem.relative[0] > 0 && fxItem.relative[0] < 1 && fxItem.relative[1] === 1
        && fxItem.relative[2] > 0 && fxItem.relative[2] < 1 && fxItem.absolute === 1,
      fxItem,
    );

    // In the app, with the clock running: tiles toggle, Temporary holds, delete stops at once
    const ids = await page.evaluate((gid) => {
      const g = window.__check.show.groupPool.getFromId(gid);
      g.cuePool.cues.forEach((c) => { if (c.animationId != null) c.stopNow(); });
      const sc = g.cuePool.cues.find((c) => c.type === 0 && c.fixtureValues.length);
      const fx = g.cuePool.cues.find((c) => c.type === 1);
      sc.relative = 0;
      sc.fadeIn.duration = 1;
      sc.fadeOut.duration = 0.25;
      fx.relative = 0;
      return { scene: sc.id, fx: fx.id };
    }, found.group);
    const cueState = (id) => page.evaluate((gid, cid) => {
      const c = window.__check.show.groupPool.getFromId(gid).cuePool.cues.find((q) => q.id === cid);
      return {
        state: c.state, running: c.animationId != null, releasing: c.releasing,
      };
    }, found.group, id);
    const tileOf = (id) => `.cuepool_widget .grid_item[data-cue="${id}"]`;
    await page.evaluate((gid, list) => {
      const g = window.__check.show.groupPool.getFromId(gid);
      [...document.querySelectorAll('.cuepool_widget .grid_item:not(.empty)')].forEach((el) => {
        const name = el.querySelector('.grid_item_footer')?.textContent.trim();
        const c = g.cuePool.cues.find((q) => (q.name || '') === name);
        if (c && list.includes(c.id)) el.dataset.cue = c.id;
      });
    }, found.group, [ids.scene, ids.fx]);
    const playTile = async (id) => {
      const box = await page.evaluate((s) => {
        const r = document.querySelector(s).getBoundingClientRect();
        return { x: r.x + r.width / 2, y: r.y + r.height / 3 };
      }, tileOf(id));
      await page.mouse.click(box.x, box.y);
      return box;
    };
    await openGroup(page, group.name);
    await wait(SETTLE_MS);
    await playTile(ids.scene);
    await wait(600);
    const sceneOn = await cueState(ids.scene);
    await playTile(ids.scene);
    const sceneStopping = await cueState(ids.scene);
    await wait(900);
    const sceneOff = await cueState(ids.scene);
    check(
      'Clicking a scene fading in stops it: shown stopped at once, fades out, then off Live',
      sceneOn.state === 1 && sceneOn.running && sceneStopping.state === 0
        && sceneStopping.releasing && !sceneOff.running && sceneOff.state === 0,
      { sceneOn, sceneStopping, sceneOff },
    );
    await page.evaluate((gid, cid) => {
      const c = window.__check.show.groupPool.getFromId(gid).cuePool.cues.find((q) => q.id === cid);
      c.fadeIn.duration = 0.25;
    }, found.group, ids.scene);
    await playTile(ids.scene);
    await wait(1000);
    const sceneEnded = await cueState(ids.scene);
    check(
      'A scene ends by itself once faded in',
      sceneEnded.state === 0 && !sceneEnded.running,
      sceneEnded,
    );
    await page.evaluate((gid, cid) => {
      const c = window.__check.show.groupPool.getFromId(gid).cuePool.cues.find((q) => q.id === cid);
      c.fadeIn.duration = 1;
    }, found.group, ids.scene);
    await playTile(ids.fx);
    await wait(400);
    const fxOn = await cueState(ids.fx);
    await playTile(ids.fx);
    const fxOff = await cueState(ids.fx);
    check(
      'Clicking a playing Absolute effect stops it at once',
      fxOn.state === 1 && fxOn.running && fxOff.state === 0 && !fxOff.running,
      { fxOn, fxOff },
    );
    // Temporary: plays while held, fades out on release, pressed again while fading comes back
    await page.evaluate((gid, cid) => {
      window.__check.show.groupPool.getFromId(gid).cuePool.cues
        .find((q) => q.id === cid).triggerStyle = 1;
    }, found.group, ids.scene);
    const box = await page.evaluate((s) => {
      const r = document.querySelector(s).getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 3 };
    }, tileOf(ids.scene));
    await page.mouse.move(box.x, box.y);
    await page.mouse.down();
    await wait(600);
    const held = await cueState(ids.scene);
    await page.mouse.up();
    const released = await cueState(ids.scene);
    await page.mouse.down();
    await wait(100);
    const pressedAgain = await cueState(ids.scene);
    await page.mouse.up();
    await wait(900);
    const temporaryOff = await cueState(ids.scene);
    check(
      'Temporary: plays while held, fades out on release, comes back when pressed during the fade-out, then stops',
      held.state === 1 && released.state === 0 && released.releasing
        && pressedAgain.state === 1 && !pressedAgain.releasing && !temporaryOff.running,
      {
        held, released, pressedAgain, temporaryOff,
      },
    );
    // A One Shot cue reaching its end stops (Absolute at once; with a Fade Out, after it)
    const ends = await page.evaluate(async (gid, cid) => {
      const pause = (ms) => new Promise((res) => { setTimeout(res, ms); });
      const fx = window.__check.show.groupPool.getFromId(gid).cuePool.cues
        .find((c) => c.id === cid);
      const look = () => ({
        state: fx.state, running: fx.animationId != null, releasing: fx.releasing,
      });
      const saved = { loopStyle: fx.loopStyle, duration: fx.duration, relative: fx.relative };
      fx.loopStyle = 0;
      fx.duration = 0.5;
      fx.relative = 0;
      fx.cue(true);
      await pause(1400);
      const atOnce = look();
      fx.relative = 1;
      fx.fadeIn.duration = 0;
      fx.fadeOut.duration = 0.25;
      fx.cue(true);
      await pause(1150);
      const fading = look();
      await pause(700);
      const faded = look();
      Object.assign(fx, saved);
      return { absolute: atOnce, fading, faded };
    }, found.group, ids.fx);
    check(
      'A One Shot effect at its end stops; a Relative one with a Fade Out fades out first, then stops',
      ends.absolute.state === 0 && !ends.absolute.running
        && ends.fading.state === 0 && ends.fading.releasing && ends.fading.running
        && !ends.faded.running,
      ends,
    );
    const errors = await page.evaluate(() => [...window.__check.errors, ...window.__appErrors]);
    check('No app error while cues are started and stopped', errors.length === 0, errors);
    // Deleting a cue that fades out stops it at once
    const deleted = await page.evaluate((gid, cid) => {
      const g = window.__check.show.groupPool.getFromId(gid);
      const c = g.cuePool.cues.find((q) => q.id === cid);
      c.triggerStyle = 0;
      c.cue(true);
      c.cue(false);
      const { releasing } = c;
      g.cuePool.delete(c);
      return { releasing, running: c.animationId != null };
    }, found.group, ids.scene);
    check(
      'Deleting a cue while it fades out takes it off Live at once',
      deleted.releasing && !deleted.running,
      deleted,
    );

    // Scenes: own fade times, hold until stopped, fade out (to 0, or back in Relative)
    const scene = await page.evaluate(async (gid, modules) => {
      const Live = (await import(modules.live)).default;
      const g = window.__check.show.groupPool.getFromId(gid);
      const sc = g.cuePool.cues.find((c) => c.type === 0 && c.fixtureValues.length);
      if (!sc) return null;
      const fv = sc._fixtureValues.find((v) => v.channels.some((c) => c.active && !c.isFine));
      const ch = fv.channels.find((c) => c.active && !c.isFine);
      const accessor = fv.fixture.getQuickAccessor(ch);
      const value = () => Math.round(accessor.value.DMX);
      const target = Math.round(ch.value);
      const bar = Live.barDuration;
      const start = (mode) => {
        sc.relative = mode;
        sc.cue(true);
        Live.remove(sc.animationId);
        sc.animationId = Live.add(() => {});
        sc.deltaStart = 0;
      };
      const tick = (t) => sc._update(t);
      sc.fadeIn.duration = 2;
      sc.fadeOut.duration = 1;
      const out = { target, name: sc.name };
      fv.fixture.setQuickAccessor(ch, 10);
      start(0);
      tick(0);
      out.absStart = value();
      tick(2 * bar + 1);
      out.ended = { value: value(), state: sc.state, running: sc.animationId != null };
      // Stopped during its fade in: fades out to 0
      start(0);
      tick(bar);
      sc.cue(false);
      out.stopState = sc.state;
      tick(2 * bar + 1);
      out.absEnd = { value: value(), running: sc.animationId != null };
      fv.fixture.setQuickAccessor(ch, 10);
      start(1);
      tick(0);
      out.relStart = value();
      tick(bar);
      sc.cue(false);
      tick(2 * bar + 1);
      out.relEnd = value();
      // An older scene: its Duration becomes its Fade In
      const S = sc.constructor;
      const data = JSON.parse(JSON.stringify(sc.showData));
      delete data.fadeIn.duration;
      delete data.fadeOut;
      const older = new S({
        ...data, duration: 4, fixtures: [], fixtureValues: [],
      });
      out.older = [older.fadeIn.duration, older.fadeOut.duration];
      // In a chase item: fades by their own times, shrunk in a short item
      sc.relative = 0;
      sc.fadeIn.duration = 1;
      sc.fadeOut.duration = 1;
      const factorAt = (t, length) => {
        sc.playItem(t, length);
        return Number(sc.fadeFactor.toFixed(3));
      };
      sc.itemActive = false;
      out.item = {
        twoBars: factorAt(bar / 2, 2 * bar),
        eightBars: factorAt(bar / 2, 8 * bar),
        heldInEight: factorAt(4 * bar, 8 * bar),
        shortIn: sc.itemFades(bar).fadeIn / bar,
        shortOut: sc.itemFades(bar).fadeOut / bar,
      };
      sc.endItem();
      out.itemEnd = value();
      return out;
    }, found.group, PAGE_MODULES);
    if (!scene) {
      check('the demo group has a scene with values', false, scene);
      return;
    }
    check(
      'Scene (Absolute): fades in from 0 and ends once faded in, its look kept; stopped during its fade in, fades out to 0',
      scene.absStart === 0 && scene.ended.value === scene.target && scene.ended.state === 0
        && !scene.ended.running && scene.stopState === 0 && scene.absEnd.value === 0
        && !scene.absEnd.running,
      scene,
    );
    check(
      'Scene (Relative): fades in from the held value, and back to it when stopped during its fade in',
      scene.relStart === 10 && scene.relEnd === 10,
      scene,
    );
    check(
      'An older scene takes its Duration as its Fade In',
      scene.older[0] === 4 && scene.older[1] === 0,
      scene.older,
    );
    check(
      'Chase item: the fade follows the cue\'s time whatever the item length, holds, shrinks in a short item, ends at 0',
      scene.item.twoBars === scene.item.eightBars && scene.item.twoBars > 0
        && scene.item.twoBars < 1 && scene.item.heldInEight === 1
        && scene.item.shortIn === 0.5 && scene.item.shortOut === 0.5 && scene.itemEnd === 0,
      scene.item,
    );

    // Cue Settings: no Duration or Loop Style for a scene
    await selectCueTile(page, scene.name);
    await wait(SETTLE_MS);
    const labels = await page.evaluate(() => [...document.querySelectorAll('.modifier_widget_cue_settings .label')]
      .filter((e) => e.getClientRects().length).map((e) => e.textContent.trim()));
    const sceneFades = await page.evaluate(() => ['.scene_fade_in', '.scene_fade_out']
      .map((s) => [...document.querySelectorAll(s)].some((e) => e.getClientRects().length)));
    check(
      'A scene shows no Duration or Loop Style, and both fade widgets',
      !labels.some((l) => /Duration|Loop Style/.test(l)) && sceneFades.every(Boolean),
      { labels, sceneFades },
    );

    // The chase item preview draws the fades as played
    const chase = await page.evaluate(() => {
      const { show } = window.__check;
      for (const grp of show.groupPool.groups) {
        const ch = grp.chasePool.chases.find((c) => c.cues.some((p) => p.items.length));
        if (ch) {
          ch.cues.forEach((p) => {
            p.cue.fadeIn.duration = 1;
            p.cue.fadeOut.duration = 0.5;
          });
          const expected = ch.cues.flatMap((p) => p.items.map((it) => {
            const f = p.cue.itemFades(it.lengthMS);
            return [f.fadeIn / it.lengthMS, f.fadeOut / it.lengthMS];
          }));
          const view = document.querySelector('#app').__vue_app__.config.globalProperties.$view;
          view.openChase(grp.id, ch.id);
          return { expected };
        }
      }
      return null;
    });
    if (!chase) {
      check('the demo has a chase with items', false, chase);
      return;
    }
    await wait(800);
    const drawn = await page.evaluate(() => [...document.querySelectorAll('.widget_pool_timeline_item_cue_body_curve path')]
      .map((p) => p.getAttribute('d') || ''));
    const ratios = drawn.map((pathData) => {
      const m = /^M 0,[\d.]+ (?:C [^,]+, [^,]+, ([\d.]+) 0|L 0,0) L ([\d.]+),0/.exec(pathData);
      const end = /([\d.]+)[ ,]([\d.]+) Z$/.exec(pathData);
      if (!m || !end) return null;
      const width = Number(end[1]);
      return [Number(m[1] || 0) / width, (width - Number(m[2])) / width];
    });
    check(
      'Each chase item draws its Fade In and Fade Out over their played widths',
      ratios.length === chase.expected.length && ratios.every((r, i) => r
        && Math.abs(r[0] - chase.expected[i][0]) < 0.02
        && Math.abs(r[1] - chase.expected[i][1]) < 0.02),
      { ratios, expected: chase.expected, drawn: drawn.slice(0, 2) },
    );
  },

  /** Each group and universe comes back to its last selection */
  async memory(page) {
    const d = await demo(page);
    const [g0, g1] = d.groups;
    await openGroup(page, g0.name);
    const cue = g0.cues[Math.min(2, g0.cues.length - 1)];
    await selectCueTile(page, cue.name);
    const [fa, , fb] = g0.fixtures;
    await clickRow(page, '.modifier_widget_fixture_pool', fa);
    await clickRow(page, '.modifier_widget_fixture_pool', fb, ['Meta']);
    const before = await probe(page, 'fixturePool');
    check('group 0: cue and two fixtures selected', (await probe(page, 'selectedCue')) === cue.name && same(before.selected, [fa, fb].sort((a, b) => a - b)), { cue: await probe(page, 'selectedCue'), before });
    await openGroup(page, g1.name);
    await openGroup(page, g0.name);
    check('back in group 0: the same cue is selected', (await probe(page, 'selectedCue')) === cue.name, await probe(page, 'selectedCue'));
    check('back in group 0: the same fixtures are selected', same((await probe(page, 'fixturePool')).selected, before.selected), await probe(page, 'fixturePool'));
    const u = d.universes[0];
    await openUniverse(page, u.id);
    const fixture = u.fixtures[Math.min(3, u.fixtures.length - 1)];
    await clickRow(page, '.modifier_widget_fixture_pool', fixture);
    await openGroup(page, g1.name);
    await openUniverse(page, u.id);
    check('back in universe 0: the same fixture is selected', same((await probe(page, 'fixturePool')).selected, [fixture]), await probe(page, 'fixturePool'));
  },

  /** In a group, the fixture pool and the scene's fixture list share one selection */
  async shared(page) {
    const d = await demo(page);
    const g = d.groups.find((gr) => gr.cues.some((c) => c.type === 0)) || d.groups[0];
    await openGroup(page, g.name);
    const scene = g.cues.find((c) => c.type === 0);
    await selectCueTile(page, scene.name);
    const target = g.fixtures[Math.min(1, g.fixtures.length - 1)];
    await clickRow(page, '.scene_fixtures', target);
    const sceneList = await probe(page, 'sceneList');
    const pool = await probe(page, 'fixturePool');
    check('selecting in the scene list selects the same fixture in the fixture pool', same(pool.selected, [target]) && same(sceneList.selected, [target]), { sceneList, pool });
    check('the scene list (clicked) shows focused rows, the pool selected but unfocused', sceneList.focused && !pool.focused, { sceneList, pool });
    await clickRow(page, '.modifier_widget_fixture_pool', target);
    const sceneList2 = await probe(page, 'sceneList');
    const pool2 = await probe(page, 'fixturePool');
    check('clicking in the pool swaps the focused style', pool2.focused && !sceneList2.focused, { sceneList2, pool2 });
  },

  /** The 3D highlight is exactly the selection of the panel in view */
  async highlight(page) {
    const d = await demo(page);
    const u = d.universes[0];
    await openUniverse(page, u.id);
    const [a, b] = [u.fixtures[1], u.fixtures[2]];
    await clickRow(page, '.modifier_widget_fixture_pool', a);
    await clickRow(page, '.modifier_widget_fixture_pool', b, ['Meta']);
    check('universe: highlight == the two selected fixtures', same(await probe(page, 'highlighted'), [a, b].sort((x, y) => x - y)), await probe(page, 'highlighted'));
    const g = d.groups[0];
    await openGroup(page, g.name);
    const pool = await probe(page, 'fixturePool');
    check('group: highlight == the group fixture pool selection', same(await probe(page, 'highlighted'), pool.selected), { highlighted: await probe(page, 'highlighted'), pool });
    await openUniverse(page, u.id);
    check('back to the universe: highlight == its selection again', same(await probe(page, 'highlighted'), (await probe(page, 'fixturePool')).selected), { highlighted: await probe(page, 'highlighted'), pool: await probe(page, 'fixturePool') });
  },

  /** Deleting what is in view falls back, without errors or stale panels */
  async deletes(page) {
    const d = await demo(page);
    const g = d.groups[0];
    await openGroup(page, g.name);
    const cue = g.cues[Math.min(2, g.cues.length - 1)];
    await selectCueTile(page, cue.name);
    await press(page, 'Delete');
    await submitTopPopup(page);
    const remaining = await page.evaluate((gid) => window.__check.show.groupPool.getFromId(gid).cuePool.cues.map((c) => c.name || `Cue${c.id}`), g.id);
    const shown = await probe(page, 'selectedCue');
    check('deleting the cue in view: it is gone and a remaining cue is shown', !remaining.includes(cue.name) && remaining.includes(shown), { remaining, shown });
    const victim = d.groups[d.groups.length - 1];
    await openGroup(page, victim.name);
    await press(page, 'Delete');
    await submitTopPopup(page);
    const groupsLeft = await page.evaluate(
      () => window.__check.show.groupPool.groups.map((gr) => gr.name),
    );
    check('deleting the group in view: the first group is shown', !groupsLeft.includes(victim.name) && (await probe(page, 'groupName')) === groupsLeft[0] && (await probe(page, 'selectedGroup')) === groupsLeft[0], { groupsLeft, shown: await probe(page, 'groupName'), marked: await probe(page, 'selectedGroup') });
    const u = d.universes[0];
    await openUniverse(page, u.id);
    const fixture = u.fixtures[Math.min(3, u.fixtures.length - 1)];
    await clickRow(page, '.modifier_widget_fixture_pool', fixture);
    await unfoldUniverse(page, u.id);
    const trashed = await click(page, `.patch_bay .uikit_list_item[data-key$="id:${fixture}"] .uikit_list_item_delete`);
    check('the patch bay shows the fixture with its trash icon', trashed);
    await submitTopPopup(page);
    const pool = await probe(page, 'fixturePool');
    const alive = await page.evaluate(
      () => window.__check.show.fixturePool.fixtures.map((f) => f.id),
    );
    check('deleting the selected fixture from the patch bay: a remaining fixture is selected', !alive.includes(fixture) && pool.selected.length === 1 && alive.includes(pool.selected[0]), { pool, deleted: fixture });
    const errors = await page.evaluate(() => window.__check.errors);
    const errorPopup = (await probe(page, 'popups')).some((t) => /error/i.test(t));
    check('no error raised or reported', !errors.length && !errorPopup, { errors, popups: await probe(page, 'popups') });
  },

  /** Keys go to one place: the top popup, the focused block, then global shortcuts */
  async keys(page) {
    const d = await demo(page);
    const u = d.universes[0];
    await openUniverse(page, u.id);
    await clickRow(page, '.modifier_widget_fixture_pool', u.fixtures[1]);
    await click(page, '.modifier_widget_fixture_pool .uikit_widget_header .uikit_button, .modifier_widget_fixture_pool .uikit_button', /add/i);
    const opened = await probe(page, 'popups');
    const count = await probe(page, 'fixtureCount');
    await press(page, 'Delete');
    const now = await probe(page, 'popups');
    check(
      'Delete with a popup open deletes nothing and opens no confirmation',
      opened.length === 1 && (await probe(page, 'fixtureCount')) === count
        && !now.some((t) => /delete/i.test(t)),
      { opened, now },
    );
    await press(page, 'Escape');
    const g = d.groups[0];
    await openGroup(page, g.name);
    await clickRow(page, '.modifier_widget_fixture_pool', g.fixtures[0]);
    await press(page, 'Delete');
    const popups = await probe(page, 'popups');
    check('Delete in the focused fixture pool opens only its confirmation', popups.length === 1 && /delete items/i.test(popups[0]), popups);
    const layersBefore = await page.evaluate(() => {
      const view = document.querySelector('#app').__vue_app__.config.globalProperties.$view;
      return view ? view.layers.map((l) => (l.el ? l.el.querySelector('.header h3')?.textContent || 'untitled' : 'no element')) : null;
    });
    await press(page, 'Escape');
    const left = await popupsAfterClosing(page, 0);
    check('Escape closes that confirmation', left.length === 0, { popups: left, layersBefore });
    // typing in a field never triggers a shortcut (Shift+N: new show, Space: play/pause)
    const liveUrl = await page.evaluate(() => performance.getEntriesByType('resource').map((e) => e.name).find((n) => n.includes('/models/DMX/live.model.js')));
    const liveState = () => page.evaluate(async (l) => (await import(l)).default.state, liveUrl);
    const stateBefore = await liveState();
    await click(page, '.modifier_widget_fixture_pool .uikit_list_searchbox input');
    const typing = await page.evaluate(() => document.activeElement.tagName);
    await page.keyboard.type('New name');
    await wait(SETTLE_MS);
    check(
      'typing "New name" in a field opens no popup and leaves playback alone',
      typing === 'INPUT' && (await probe(page, 'popups')).length === 0
        && (await liveState()) === stateBefore,
      {
        typing, popups: await probe(page, 'popups'), stateBefore, after: await liveState(),
      },
    );
    await page.keyboard.down('Meta'); await page.keyboard.press('a'); await page.keyboard.up('Meta');
    await page.keyboard.press('Backspace');
    // Ctrl+S saves from every panel
    for (const [label, open] of [['universe', () => openUniverse(page, u.id)], ['group', () => openGroup(page, g.name)]]) {
      await open();
      const marker = `check-${label}-${Date.now()}`;
      await page.evaluate((m) => { window.__check.show.name = m; }, marker);
      await press(page, 's', ['Control']);
      const saved = await page.evaluate(() => localStorage.getItem('ASLS_STUDIO_SHOWFILE') || '');
      check(`Ctrl+S saves from the ${label} panel`, saved.includes(marker));
    }
  },

  /** Popups stack, Escape closes the top one, switching panel closes the panel's popups */
  async popups(page) {
    const d = await demo(page);
    const u = d.universes[0];
    await openUniverse(page, u.id);
    await click(page, '.modifier_widget_fixture_pool .uikit_button', /add/i);
    const patch = await probe(page, 'popups');
    const busUrl = await page.evaluate(() => performance.getEntriesByType('resource').map((e) => e.name).find((n) => n.includes('/plugins/eventbus.js')));
    await page.evaluate(async (b) => { (await import(b)).default.emit('app_error', new Error('check: an import failed')); }, busUrl);
    await wait(SETTLE_MS);
    const both = await probe(page, 'popups');
    await press(page, 'Escape');
    const after = await popupsAfterClosing(page, 1);
    check(
      'an error over the patch popup: Escape closes only the error',
      both.length === 2 && after.length === 1 && same(after, patch),
      { patch, both, after },
    );
    if (!(await probe(page, 'popups')).length) {
      await click(page, '.modifier_widget_fixture_pool .uikit_button', /add/i);
    }
    const before = await probe(page, 'popups');
    await openGroup(page, d.groups[0].name);
    const afterSwitch = await popupsAfterClosing(page, 0);
    check(
      'opening a group closes the universe patch popup',
      before.length === 1 && afterSwitch.length === 0,
      { before, after: afterSwitch },
    );
  },
};

/**
 * Runs the selected scenarios, one fresh page each
 */
async function main() {
  const options = parseArgs();
  const server = options.url ? { url: options.url, stop: () => {} } : await startApp();
  const browser = await puppeteer.launch({
    executablePath: findChrome(),
    headless: true,
    args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
  });
  try {
    const names = options.only.length ? options.only : Object.keys(SCENARIOS);
    for (const name of names) {
      if (!SCENARIOS[name]) throw new Error(`unknown scenario: ${name}`);
      console.log(`\n${name}`);
      const page = await freshPage(browser, server.url);
      try {
        await SCENARIOS[name](page);
      } catch (err) {
        check(`${name} ran to the end`, false, err.message.split('\n')[0]);
      }
      await page.close();
    }
  } finally {
    await browser.close();
    server.stop();
  }
  console.log(`\n${passes} passed, ${failures} failed.`);
  console.log(failures ? 'FAILED' : 'ALL PASS');
  process.exitCode = failures ? 1 : 0;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
