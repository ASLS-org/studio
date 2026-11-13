/* eslint-disable import/no-extraneous-dependencies, import/first, vue/one-component-per-file */
// First: requests resolve from the site root before Studio's Show is built (see site-root.js)
import './site-root';
/*
 * Live preview host: runs real Studio components in the manual. Loaded on the client only, the
 * first time a <LivePreview> comes near the screen (it pulls in the show engine).
 *
 * Each preview is its own small Vue app set up as src/main.js sets up Studio (uikit, $show,
 * $http, $utils, the live ticker, its own view state and keyboard), so components get the app's
 * environment with no shims. Every preview on a page shares Studio's one Show, loaded from the
 * manual's demo show.
 */
import {
  createApp, h, markRaw, reactive,
} from 'vue';
import { withBase } from 'vitepress';
import axios from 'axios';
import uikit from '@/views/components/uikit';
import utils from '@/views/utils';
import LiveTicker from '@/plugins/live.ticker';
import Live from '@/models/DMX/live.model';
import ShowSingleton from '@/singletons/show.singleton';
import ViewState from '@/views/view.state';
import Keyboard from '@/views/keyboard';

/** The demo show every preview runs on */
const SHOWFILE = '/presets/manual.showfile.json';

// Previews never save: the show's local save keeps its bookkeeping without touching
// localStorage (loading a show ends with a save)
ShowSingleton.persistLocally = function persistLocally() {
  this._savedSnapshot = this.genShowFile();
  this.isSaved = true;
  this.emit('saveState', this.isSaved);
};

/**
 * Studio always has a visualizer, which holds the show's visualizer preferences. While no
 * visualizer preview is mounted, a stand-in keeps them
 * @param {?Object} [preferences=null] preferences to keep
 * @returns {Object} stand-in visualizer handle
 */
export function visualizerStandIn(preferences = null) {
  return markRaw({
    preferences,
    get showData() {
      return this.preferences;
    },
  });
}
if (!ShowSingleton.visualizerHandle) ShowSingleton.visualizerHandle = visualizerStandIn();

const show = reactive(ShowSingleton);

/**
 * Registers every uk-* component, as src/main.js does
 * @param {Object} components nested component map
 * @param {Object} app Vue app
 */
function registerComponents(components, app) {
  Object.keys(components).forEach((key) => {
    const component = components[key];
    if (component.name) app.component(component.name, component);
    else registerComponents(component, app);
  });
}

/* ── Show ─────────────────────────────────────────────────────────────── */

let loading = null;
let loadedFor = null;

/**
 * Loads the demo show once per page visit (again with `force`, for Reset)
 * @param {String} page page the previews belong to
 * @param {Boolean} [force=false] reload even if this page already loaded it
 * @returns {Promise} resolves once the show is ready
 */
export function loadShow(page, force = false) {
  if (!loading || force || loadedFor !== page) {
    loadedFor = page;
    const previous = loading;
    loading = (async () => {
      // Never two loads on the show at once (a demo's loop restarting while the reader scrolls
      // to the next preview): interleaved clears and rebuilds leave fixtures half built
      if (previous) await previous.catch(() => {});
      const res = await fetch(withBase(SHOWFILE));
      if (!res.ok) throw new Error(`Demo show unavailable (${res.status})`);
      const data = await res.json();
      // Nothing may keep playing on the show being cleared: stop every chase and cue first
      show.groupPool.groups.forEach((group) => {
        group.stopAllChases?.();
        group.cuePool.cues.forEach((cue) => { if (cue.animationId != null) cue.cue(false); });
      });
      // Outputs a demo added: previews never connect them, so drop them before the load clears
      // the pool (Studio's own clearing throws once an output exists, see Known limitations)
      show.universePool.universes.forEach((u) => { if (u.stream) u.stream.stop?.(); });
      show.outputPool.outputs.splice(0);
      await show.loadFromData(data);
    })();
    loading.catch(() => { loading = null; });
  }
  return loading;
}

/* ── Clock ────────────────────────────────────────────────────────────── */

const running = new Set();

/**
 * Starts or stops Studio's clock: it runs only while a visible preview needs it. Stopped, the
 * show time is frozen (Live paused) and the 60 Hz tick is detached, so nothing runs.
 */
function updateClock() {
  const on = running.size > 0 && document.visibilityState === 'visible';
  if (on) {
    // Re-setting the method re-attaches the worker's tick to Live.update
    Live.animationMethod = Live.animationMethod; // eslint-disable-line no-self-assign
    Live.play();
  } else {
    Live.pause();
    Live.w.onmessage = null;
  }
}
document.addEventListener('visibilitychange', updateClock);
// Live starts ticking as soon as it's imported: hold it until a preview needs it
updateClock();

/**
 * A preview's clock need changed (it scrolled in or out of view, or unmounted)
 * @param {Symbol} id preview id
 * @param {Boolean} needed whether it is visible and shows anything moving
 */
export function setClock(id, needed) {
  if (needed) running.add(id);
  else running.delete(id);
  updateClock();
}

/* ── Mounting ─────────────────────────────────────────────────────────── */

/**
 * Mounts a preset into an element as its own Vue app
 * @param {HTMLElement} el target element
 * @param {Object} preset preset from presets.js
 * @param {Function} onError called with any error the preview throws while running (as Studio's
 *   own error handler, it doesn't stop the component)
 * @param {HTMLElement} popupHost element Studio's popups open in (uk-popup's `popupHost`)
 * @returns {Promise<Object>} the mounted app
 */
export async function mountPreset(el, preset, onError, popupHost) {
  const component = (await preset.component()).default;
  const props = () => (preset.props ? preset.props(show) : {});
  // `stage`: the component next to the visualizer (see StageWrap.vue)
  const StageWrap = preset.stage ? (await import('./StageWrap.vue')).default : null;
  const app = createApp({
    render: () => {
      if (!StageWrap) return h(component, props());
      return h(StageWrap, {
        inner: component,
        innerProps: props(),
        innerWidth: preset.componentWidth || 0,
        innerHeight: preset.componentHeight || 239,
        popupInBox: Boolean(preset.popupInBox),
      });
    },
  });
  registerComponents(uikit, app);
  app.config.globalProperties.$show = show;
  // Each preview has its own view state: what it shows and selects stays its own
  const view = reactive(new ViewState(show));
  app.config.globalProperties.$view = view;
  app.provide('view', view);
  // Keys reach the preview only while the focus is inside it
  const keyboard = new Keyboard(view, el);
  app.config.globalProperties.$keyboard = keyboard;
  const unmount = app.unmount.bind(app);
  app.unmount = () => {
    keyboard.dispose();
    unmount();
  };
  app.config.globalProperties.$http = axios;
  app.config.globalProperties.$utils = reactive(utils);
  app.config.globalProperties.$liveTicker = LiveTicker;
  app.config.errorHandler = (err) => onError(err);
  app.provide('popupHost', popupHost);
  // What the preview shows and selects: a panel, a group, a chase (as Studio's view state)
  if (preset.view) preset.view(view, show);
  app.mount(el);
  // Some demos start with the rig already playing (a cue, the chase), as the reader would have it
  if (preset.start) preset.start(show);
  return app;
}

/**
 * Mounts the page's one visualizer (the floating card) into an element: Studio's visualizer on
 * the shared show, as its own Vue app with Studio's globals
 * @param {HTMLElement} el target element
 * @returns {Promise<Object>} the mounted app
 */
export async function mountVisualizer(el) {
  const VisualizerPreview = (await import('./VisualizerPreview.vue')).default;
  const app = createApp({ render: () => h(VisualizerPreview) });
  app.config.globalProperties.$show = show;
  app.config.errorHandler = (err) => console.error('[Visualizer]', err); // eslint-disable-line no-console
  app.mount(el);
  return app;
}

/** Studio's clock, exposed for dev checks */
export { Live };
