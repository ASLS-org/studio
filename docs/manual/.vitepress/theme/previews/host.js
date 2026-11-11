/* eslint-disable import/no-extraneous-dependencies, import/first */
// First: requests resolve from the site root before Studio's Show is built (see site-root.js)
import './site-root';
/*
 * Live preview host: runs real Studio components in the manual. Loaded on the client only, the
 * first time a <LivePreview> comes near the screen (it pulls in the show engine).
 *
 * Each preview is its own small Vue app set up as src/main.js sets up Studio (uikit, $show,
 * $http, $utils, the live ticker, a memory router), so components get the app's environment with
 * no shims. Every preview on a page shares Studio's one Show, loaded from the manual's demo show.
 */
import {
  createApp, h, markRaw, reactive,
} from 'vue';
import { createMemoryHistory, createRouter, RouterView } from 'vue-router';
import { withBase } from 'vitepress';
import axios from 'axios';
import uikit from '@/views/components/uikit';
import utils from '@/views/utils';
import LiveTicker from '@/plugins/live.ticker';
import Live from '@/models/DMX/live.model';
import ShowSingleton from '@/singletons/show.singleton';
import UniverseModifier from '@/views/activities/app/fragments/modifiers/universe/universe.modifier.fragment.vue';
import GroupModifier from '@/views/activities/app/fragments/modifiers/group/group.modifier.fragment.vue';
import ChaseModifier from '@/views/activities/app/fragments/modifiers/chase/chase.modifier.fragment.vue';

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
 * Studio's routes for the panels that read the route (the app shell itself is left out)
 * @type {Array<Object>}
 */
const routes = [
  { path: '/', component: { render: () => null } },
  { path: '/universe/:universeId', component: UniverseModifier },
  { path: '/group/:groupId', component: GroupModifier },
  { path: '/group/:groupId/cue/:cueId', component: GroupModifier },
  { path: '/group/:groupId/chase/:chaseId', component: ChaseModifier },
];

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
    loading = (async () => {
      // Nothing may keep playing on the show being cleared: stop every chase and cue first
      show.groupPool.groups.forEach((group) => {
        group.stopAllChases?.();
        group.cuePool.cues.forEach((cue) => { if (cue.animationId != null) cue.cue(false); });
      });
      const res = await fetch(withBase(SHOWFILE));
      if (!res.ok) throw new Error(`Demo show unavailable (${res.status})`);
      await show.loadFromData(await res.json());
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
  const inner = preset.panel ? RouterView : component;
  // `stage`: the component next to the visualizer (see StageWrap.vue)
  const StageWrap = preset.stage ? (await import('./StageWrap.vue')).default : null;
  const app = createApp({
    render: () => {
      if (!StageWrap) return preset.panel ? h(RouterView) : h(component, props());
      return h(StageWrap, {
        inner,
        innerProps: preset.panel ? {} : props(),
        innerWidth: preset.componentWidth || 0,
        innerHeight: preset.componentHeight || 239,
        viewWidth: preset.viewWidth || 480,
      });
    },
  });
  registerComponents(uikit, app);
  app.config.globalProperties.$show = show;
  app.config.globalProperties.$http = axios;
  app.config.globalProperties.$utils = reactive(utils);
  app.config.globalProperties.$liveTicker = LiveTicker;
  app.config.errorHandler = (err) => onError(err);
  app.provide('popupHost', popupHost);
  const router = createRouter({ history: createMemoryHistory(), routes });
  // A preset can stand in for a panel the preview doesn't show, when the component navigates
  if (preset.onRoute) router.afterEach((to) => preset.onRoute(show, to));
  app.use(router);
  await router.push(preset.warmRoute || preset.route || '/');
  await router.isReady();
  app.mount(el);
  if (preset.warmRoute) await router.push(preset.route);
  // Some demos start with the rig already playing (a cue, the chase), as the reader would have it
  if (preset.start) preset.start(show);
  return app;
}

/** Studio's clock, exposed for dev checks */
export { Live };
