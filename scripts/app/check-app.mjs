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
 *            widgets, curves, presets, memory, shared, highlight, deletes, keys, popups
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
    await click(page, '.widget_curve .widget_curve_type .uikit_select_textbox_wrapper');
    const options = await page.evaluate(() => [...document.querySelectorAll(
      '.uikit_select_option_list .uikit_select_option',
    )].map((o) => ({ name: o.textContent.trim(), curve: !!o.querySelector('svg path') })));
    await click(page, '.uikit_select_option_list .uikit_select_option', 'Expo out');
    const picked = await fadeOf();
    const box = await page.evaluate(() => {
      const t = document.querySelector('.widget_curve_type .uikit_select_textbox');
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
        cue.update(fraction * 1000, 1000);
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
