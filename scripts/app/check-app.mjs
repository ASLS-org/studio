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
 *   --only   run only these scenarios (repeatable): panels, playing, memory, shared, highlight,
 *            deletes, keys, popups
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
