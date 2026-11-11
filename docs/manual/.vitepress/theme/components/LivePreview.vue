<template>
  <StudioFrame
    :caption="caption || (definition && definition.caption) || ''"
    :padding="0"
  >
    <div
      class="live_preview"
      :class="[state, { demo: isDemo }]"
    >
      <!-- Stage: the component at its size in Studio, scaled down (or scrolled) to fit -->
      <div
        v-if="hasStage"
        ref="viewport"
        class="live_preview_viewport"
        :class="{ scroll: fit === 'scroll' }"
      >
        <div
          class="live_preview_box"
          :style="boxStyle"
        >
          <div
            ref="stage"
            class="live_preview_stage"
            :style="stageStyle"
          >
            <div
              v-show="state === 'ready'"
              ref="mount"
              class="live_preview_mount"
              :style="mountStyle"
            />
            <!-- Paused or loading: the component's title and an empty body, never a picture -->
            <uk-widget
              v-if="state !== 'ready'"
              class="live_preview_placeholder"
              :style="placeholderStyle"
              :header="{ title: (definition && definition.title) || preset }"
            />
          </div>
        </div>
      </div>

      <!-- Paused: only one preview runs at a time, the one in view. Click to run this one -->
      <button
        v-if="state === 'paused' || state === 'loading'"
        type="button"
        class="live_preview_paused"
        @click="pinAndRun"
      >
        <span class="live_preview_paused_label">
          <svg
            viewBox="0 0 12 12"
            aria-hidden="true"
          ><path d="M3 1.5v9l7.5-4.5z" /></svg>
          {{ state === 'loading' ? 'Starting…' : pausedLabel }}
        </span>
      </button>

      <!-- Over the whole frame, unscaled: Studio's popups open here (centred on the frame, their
           backdrop dims only the frame); in a demo, the cursor -->
      <div
        v-if="state === 'ready'"
        class="live_preview_overlay"
      >
        <div
          ref="popups"
          class="live_preview_popups"
        />
        <template v-if="isDemo">
          <div class="live_preview_blocker" />
          <svg
            ref="cursor"
            class="live_preview_cursor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          ><path d="M4 2.5v16.2l4.3-4.1 2.9 6.6 2.8-1.2-2.9-6.5h6z" /></svg>
        </template>
      </div>

      <!-- Can't run: its recording, or a short message -->
      <Video
        v-if="state === 'fallback' && fallbackVideo"
        :src="fallbackVideo"
      />
      <p
        v-else-if="state === 'fallback' || state === 'unknown'"
        class="live_preview_message"
      >
        {{ message }}
      </p>

      <!-- Under the stage, so nothing covers the component -->
      <div
        v-if="hasStage"
        class="live_preview_bar"
      >
        <!-- A demo's caption: what the cursor is doing and why, under the stage -->
        <p
          v-if="state === 'ready' && isDemo"
          ref="hint"
          class="live_preview_hint"
          aria-live="polite"
        />
        <span
          v-if="state !== 'ready'"
          class="live_preview_badge off"
        >Paused</span>
        <span
          v-else-if="isDemo"
          class="live_preview_badge"
        >
          <svg
            viewBox="0 0 12 12"
            aria-hidden="true"
          ><path d="M3 1.5v9l7.5-4.5z" /></svg>
          Demo
        </span>
        <button
          v-else
          type="button"
          class="live_preview_reset"
          :disabled="!dirty || resetting"
          :title="dirty ? 'Back to the demo show as it was' : 'Nothing to reset yet'"
          @click="reset"
        >
          <svg
            viewBox="0 0 16 16"
            aria-hidden="true"
          ><path d="M3 8a5 5 0 1 0 1.5-3.6M3 2.5v2.4h2.4" /></svg>
          Reset
        </button>
      </div>
    </div>
  </StudioFrame>
</template>

<script>
import PRESETS from '../previews/presets';
import stageState from '../previews/stage';

/** Window events: the reader changed something in a preview / the show is back as loaded */
const DIRTY_EVENT = 'asls-preview-dirty';
const CLEAN_EVENT = 'asls-preview-clean';
/** Reader input that may change the show */
const EDIT_EVENTS = ['pointerdown', 'keydown', 'input', 'wheel'];

/* ── One preview at a time ────────────────────────────────────────────────
 * Every live preview of the page registers here. Only one runs (mounted, its clock and 3D view
 * going): the one well in view nearest the centre of the screen, or the one the reader clicked.
 * The others are paused: unmounted (their WebGL context released), shown dimmed. */
const registry = new Set();
const page = {
  active: null, pinned: null, scheduled: false, demoRan: false,
};

/**
 * Picks the preview to run and switches to it
 */
function arbitrate() {
  const vh = window.innerHeight;
  let best = null;
  let bestScore = -Infinity;
  registry.forEach((preview) => {
    if (!preview.runnable()) return;
    const r = preview.$el.getBoundingClientRect();
    const visible = Math.max(0, Math.min(r.bottom, vh) - Math.max(r.top, 0));
    const ratio = visible / Math.max(1, Math.min(r.height, vh));
    if (ratio < 0.5) return; // less than half of it in view: never runs
    const centre = Math.abs((r.top + r.bottom) / 2 - vh / 2) / vh;
    let score = ratio - centre;
    if (preview === page.active) score += 0.35; // the running one keeps running unless leaving
    if (preview === page.pinned) score += 2;
    if (score > bestScore) {
      best = preview;
      bestScore = score;
    }
  });
  if (page.pinned && page.pinned !== best) page.pinned = null;
  if (best === page.active) return;
  const previous = page.active;
  page.active = best;
  if (previous) previous.deactivate();
  if (best) best.activate();
}

/**
 * Re-picks on the next frame (scroll, resize, a preview appearing)
 */
function schedule() {
  if (page.scheduled) return;
  page.scheduled = true;
  requestAnimationFrame(() => {
    page.scheduled = false;
    arbitrate();
  });
}

let webgl = null;
/**
 * Whether the browser gives WebGL, probed once: the probe's context is released right away (the
 * browser keeps only 16 and drops the oldest, which may be a visualizer's)
 * @returns {Boolean}
 */
function hasWebGL() {
  if (webgl === null) {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    webgl = Boolean(gl);
    const lose = gl && gl.getExtension('WEBGL_lose_context');
    if (lose) lose.loseContext();
  }
  return webgl;
}

/**
 * Whether this browser can run a preview
 * @param {Object} preset preset
 * @returns {?String} why it can't, or null
 */
function unsupported(preset) {
  if (typeof Worker === 'undefined') return 'This preview needs Web Workers, which this browser has turned off.';
  if ((preset.webgl || preset.stage) && !hasWebGL()) {
    return 'This preview needs WebGL, which this browser has turned off.';
  }
  return null;
}

/**
 * A live Studio component in a manual page: the real widget or panel named by a preset
 * (previews/presets.js), at the size it has in Studio, on Studio's idle surface, running on the
 * manual's demo show. Interactive, or a demo a cursor plays. One preview runs at a time: the one
 * in view (or clicked); the others are paused and dimmed. Falls back to its video or a message
 * when it can't run.
 * @example <LivePreview preset="group-cuepool" />
 */
export default {
  name: 'LivePreview',
  props: {
    /**
     * Preset id, from previews/presets.js
     * @type {String}
     */
    preset: {
      type: String,
      required: true,
    },
    /**
     * Text under the preview
     * @type {String}
     */
    caption: {
      type: String,
      default: '',
    },
  },
  data() {
    return {
      state: 'paused',
      message: '',
      dirty: false,
      resetting: false,
      scale: 1,
      contentWidth: 0,
    };
  },
  computed: {
    /**
     * The preset's definition
     * @type {?Object}
     */
    definition() {
      return PRESETS[this.preset] || null;
    },
    /**
     * Whether the stage is shown (not for fallbacks and unknown presets)
     * @type {Boolean}
     */
    hasStage() {
      return ['paused', 'loading', 'ready'].includes(this.state);
    },
    /**
     * Whether a scripted cursor plays this preset
     * @type {Boolean}
     */
    isDemo() {
      return Boolean(this.definition && this.definition.demo);
    },
    /**
     * Label of the paused state
     * @type {String}
     */
    pausedLabel() {
      return this.isDemo
        ? 'Demo paused · scroll here or click to play'
        : 'Paused · scroll here or click to use';
    },
    /**
     * How the stage fits the page: 'scale' (whole, scaled down) or 'scroll' (panels)
     * @type {String}
     */
    fit() {
      return (this.definition && this.definition.fit) || 'scale';
    },
    /**
     * Stage height in Studio (px)
     * @type {Number}
     */
    stageHeight() {
      return (this.definition && this.definition.height) || 240;
    },
    /**
     * Stage width: the preset's, else the component's own
     * @type {Number}
     */
    stageWidth() {
      const def = this.definition || {};
      return def.width || this.contentWidth || def.componentWidth || 760;
    },
    /**
     * The stage at Studio's size, scaled
     * @type {Object}
     */
    stageStyle() {
      return {
        width: `${this.stageWidth}px`,
        height: `${this.stageHeight}px`,
        transform: `scale(${this.scale})`,
      };
    },
    /**
     * The space the scaled stage takes in the page
     * @type {Object}
     */
    boxStyle() {
      return {
        width: `${Math.ceil(this.stageWidth * this.scale)}px`,
        height: `${Math.ceil(this.stageHeight * this.scale)}px`,
      };
    },
    /**
     * Where the component sits on the stage: top left, at its own size (a stage preset fills the
     * stage: its component and the visualizer side by side)
     * @type {Object}
     */
    mountStyle() {
      const { componentWidth, componentHeight, stage } = this.definition || {};
      if (stage) return { width: '100%', height: '100%' };
      return {
        width: componentWidth ? `${componentWidth}px` : 'max-content',
        height: componentHeight ? `${componentHeight}px` : '100%',
      };
    },
    /**
     * The placeholder takes the component's place
     * @type {Object}
     */
    placeholderStyle() {
      const { componentWidth, width, stage } = this.definition || {};
      return { width: `${stage ? width : componentWidth || width || this.stageWidth}px` };
    },
    /**
     * The preset's recording, played when it can't run
     * @type {String}
     */
    fallbackVideo() {
      return (this.definition && this.definition.video) || '';
    },
  },
  mounted() {
    this.id = Symbol(this.preset);
    this.page = window.location.pathname;
    // Stage previews bring the page's floating visualizer card
    if (this.definition && this.definition.stage) {
      stageState.count += 1;
      this.countsStage = true;
    }
    if (!this.definition) {
      this.state = 'unknown';
      this.message = import.meta.env.DEV
        ? `Unknown live preview "${this.preset}": check previews/presets.js.`
        : 'This preview is unavailable.';
      return;
    }
    const why = unsupported(this.definition);
    if (why) {
      this.fail(why);
      return;
    }
    window.addEventListener(DIRTY_EVENT, this.markDirty);
    window.addEventListener(CLEAN_EVENT, this.markClean);
    // The reader's edits enable Reset on every preview of the page
    this.onEdit = (e) => {
      if (e.isTrusted && !this.isDemo && this.state === 'ready') {
        window.dispatchEvent(new Event(DIRTY_EVENT));
      }
    };
    EDIT_EVENTS.forEach((type) => this.$el.addEventListener(type, this.onEdit, true));
    this.sizeObserver = new ResizeObserver(() => this.measure());
    this.sizeObserver.observe(this.$el);
    if (!registry.size) {
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', schedule);
      document.addEventListener('visibilitychange', schedule);
    }
    registry.add(this);
    this.$nextTick(() => {
      this.measure();
      schedule();
    });
  },
  beforeUnmount() {
    window.removeEventListener(DIRTY_EVENT, this.markDirty);
    window.removeEventListener(CLEAN_EVENT, this.markClean);
    if (this.onEdit) {
      EDIT_EVENTS.forEach((type) => this.$el.removeEventListener(type, this.onEdit, true));
    }
    if (this.sizeObserver) this.sizeObserver.disconnect();
    registry.delete(this);
    if (this.countsStage) stageState.count -= 1;
    if (page.active === this) page.active = null;
    if (page.pinned === this) page.pinned = null;
    if (!registry.size) {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('visibilitychange', schedule);
    } else {
      schedule();
    }
    this.deactivate();
  },
  methods: {
    /**
     * Whether this preview can be the running one
     * @returns {Boolean} runnable
     */
    runnable() {
      return Boolean(this.definition) && this.state !== 'fallback' && this.state !== 'unknown'
        && document.visibilityState === 'visible';
    },
    /**
     * The reader clicked a paused preview: run this one while it stays in view
     */
    pinAndRun() {
      page.pinned = this;
      arbitrate();
    },
    /**
     * Becomes the running preview: loads the host and the demo show, mounts the component
     */
    async activate() {
      const token = Symbol('activation');
      this.activation = token;
      this.state = 'loading';
      try {
        if (!this.host) this.host = await import('../previews/host');
        // A demo leaves the show as its loop left it: start from the demo show again
        await this.host.loadShow(this.page, page.demoRan);
        page.demoRan = false;
        if (this.activation !== token) return;
        await this.mountApp();
        if (this.activation !== token) {
          this.unmountApp();
          return;
        }
        if (this.isDemo) {
          page.demoRan = true;
          this.startDemo();
        }
      } catch (err) {
        this.fail('This preview could not start.', err);
      }
    },
    /**
     * Stops running: the component unmounts (its 3D view's WebGL context is released)
     */
    deactivate() {
      this.activation = null;
      if (stageState.frame === this.$el) {
        stageState.frame = null;
        stageState.demo = false;
      }
      this.stopDemo();
      this.unmountApp();
      if (this.state === 'ready' || this.state === 'loading') this.state = 'paused';
      this.updateClock();
    },
    /**
     * Mounts the preset as its own Vue app
     */
    async mountApp() {
      // The overlay (popup host) exists once ready: show it before mounting
      this.state = 'ready';
      await this.$nextTick();
      // Errors while running are logged and the component goes on, as Studio's own error
      // handler does; only a component that can't load or mount falls back
      this.app = await this.host.mountPreset(this.$refs.mount, this.definition, (err) => {
        console.error(`[LivePreview ${this.preset}]`, err); // eslint-disable-line no-console
      }, this.$refs.popups);
      this.updateClock();
      await this.$nextTick();
      this.measure();
      this.watchPopups();
      // The floating visualizer comes next to a running stage preview
      if (this.definition.stage) {
        stageState.frame = this.$el;
        stageState.title = this.definition.title || '';
        stageState.demo = this.isDemo;
      }
    },
    /**
     * Studio's popups are sized for a desktop window: when one opens, the popup layer scales it
     * down to fit the frame (kept centred)
     */
    watchPopups() {
      const layer = this.$refs.popups;
      if (!layer || this.popupObserver) return;
      const fit = () => {
        const popup = layer.querySelector('.popup');
        if (!popup) {
          layer.style.scale = '';
          return;
        }
        const k = Math.min(
          1,
          (layer.clientWidth - 16) / popup.offsetWidth,
          (layer.clientHeight - 16) / popup.offsetHeight,
        );
        layer.style.scale = String(Math.max(k, 0.3));
      };
      this.popupObserver = new MutationObserver(fit);
      this.popupObserver.observe(layer, { childList: true, subtree: true });
    },
    /**
     * Unmounts the preset's app
     */
    unmountApp() {
      if (this.popupObserver) {
        this.popupObserver.disconnect();
        this.popupObserver = null;
      }
      if (this.app) {
        this.app.unmount();
        this.app = null;
      }
    },
    /**
     * Sizes the stage: the component's own width, scaled down to fit the page (scale presets),
     * or at full size with a scrollbar (panels)
     */
    measure() {
      const { mount, viewport } = this.$refs;
      if (!viewport) return;
      const def = this.definition || {};
      if (mount && mount.firstElementChild && !def.width && this.state === 'ready') {
        this.contentWidth = Math.ceil(mount.firstElementChild.getBoundingClientRect().width
          / (this.scale || 1));
      }
      const available = viewport.clientWidth;
      this.scale = this.fit === 'scale' && available
        ? Math.min(1, available / this.stageWidth) : 1;
    },
    /**
     * Starts the scripted cursor; each loop starts again from the demo show
     */
    async startDemo() {
      await this.$nextTick();
      const { cursor, hint } = this.$refs;
      if (!cursor) return;
      const { default: playDemo } = await import('../previews/demo');
      this.stopDemoFn = playDemo({
        root: this.$el.querySelector('.live_preview'),
        cursor,
        hint,
        steps: this.definition.demo,
        visible: () => page.active === this && document.visibilityState === 'visible',
        restart: async () => {
          this.unmountApp();
          await this.host.loadShow(this.page, true);
          if (page.active !== this) return;
          await this.mountApp();
        },
      });
    },
    /**
     * Stops the scripted cursor
     */
    stopDemo() {
      if (this.stopDemoFn) this.stopDemoFn();
      this.stopDemoFn = null;
    },
    /**
     * Reset: the demo show reloads (only this preview is mounted) and the component mounts again
     */
    async reset() {
      this.resetting = true;
      this.unmountApp();
      try {
        await this.host.loadShow(this.page, true);
        if (page.active === this) await this.mountApp();
      } catch (err) {
        this.fail('This preview could not reset.', err);
      }
      window.dispatchEvent(new Event(CLEAN_EVENT));
      this.resetting = false;
    },
    /**
     * The reader changed something: Reset becomes available
     */
    markDirty() {
      this.dirty = true;
    },
    /**
     * The show is back as loaded
     */
    markClean() {
      this.dirty = false;
    },
    /**
     * Tells the host whether this preview needs Studio's clock right now
     */
    updateClock() {
      if (!this.host || !this.definition) return;
      const running = Boolean(this.app && page.active === this && this.definition.clock);
      this.host.setClock(this.id, running);
    },
    /**
     * The preview can't run: its video or a message replaces it; the rest of the page goes on
     * @param {String} message reason shown to the reader
     * @param {Error} [err] error, logged for authors
     */
    fail(message, err) {
      if (err) console.error(`[LivePreview ${this.preset}]`, err); // eslint-disable-line no-console
      this.stopDemo();
      this.unmountApp();
      this.message = message;
      this.state = 'fallback';
      this.updateClock();
      if (page.active === this) {
        page.active = null;
        schedule();
      }
    },
  },
};
</script>

<style scoped>
/* Studio's idle surface around the component, as behind the modifier strip */
.live_preview {
  position: relative;
  display: flex;
  /* A flex item of the frame: never wider than the page column (the stage scales instead) */
  flex: 1;
  min-width: 0;
  flex-direction: column;
  gap: 10px;
  padding: 16px;
  background: var(--primary-light) var(--idle-stripes);
}

.live_preview_viewport {
  display: flex;
  justify-content: center;
  width: 100%;
  overflow: hidden;
}

.live_preview_viewport.scroll {
  justify-content: flex-start;
  overflow-x: auto;
}

.live_preview_box {
  position: relative;
  flex: none;
}

/* Studio's size, scaled to fit */
.live_preview_stage {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  overflow: hidden;
}

/* Widgets sit as in Studio's modifier strip: own width, stretched to the strip's height */
.live_preview_mount {
  display: flex;
  height: 100%;
}

.live_preview_placeholder {
  height: 100%;
}

/* Paused: dimmed, with what to do */
.live_preview.paused .live_preview_viewport,
.live_preview.loading .live_preview_viewport {
  opacity: 0.35;
  filter: grayscale(0.6);
}

.live_preview_paused {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
}

.live_preview_paused_label {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
  border-radius: 4px;
  background: var(--primary-dark);
  font-family: Roboto-Medium, sans-serif;
  font-size: 12px;
  line-height: 32px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--secondary-lighter);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.4);
}

.live_preview_paused:hover .live_preview_paused_label {
  background: var(--primary-lighter);
}

.live_preview_paused_label svg {
  width: 12px;
  height: 12px;
  fill: currentColor;
}

.live_preview_overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
}

/* Popup host: positioned (popups centre on it) and transformed (fixed backdrops stay in it) */
.live_preview_popups {
  position: absolute;
  inset: 0;
  transform: translateZ(0);
}

.live_preview_popups > :deep(*) {
  pointer-events: auto;
}

.live_preview_blocker {
  position: absolute;
  inset: 0;
  z-index: 1000;
  cursor: default;
  pointer-events: auto;
}

.live_preview_cursor {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1002;
  width: 22px;
  height: 22px;
  margin: -2px 0 0 -4px;
  fill: #fff;
  stroke: #0b0d0a;
  stroke-width: 1.4;
  stroke-linejoin: round;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.5));
  transition: transform 0.6s cubic-bezier(0.45, 0, 0.2, 1);
  pointer-events: none;
}

.live_preview_cursor.pressing {
  scale: 0.85;
}

.live_preview_hint {
  flex: 1;
  min-height: 28px;
  margin: 0;
  font-family: Roboto-Regular, sans-serif;
  padding-top: 5px;
  font-size: 13px;
  line-height: 1.45;
  color: var(--secondary-lighter);
  opacity: 0;
  transition: opacity 0.25s;
}

.live_preview_hint.shown {
  opacity: 1;
}

.live_preview_message {
  margin: 0;
  padding: 24px 16px;
  font-family: Roboto-Regular, sans-serif;
  font-size: 13px;
  text-align: center;
  color: var(--secondary-dark);
}

.live_preview.unknown .live_preview_message {
  color: var(--accent-red);
}

.live_preview_bar {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 12px;
}

.live_preview_reset,
.live_preview_badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
  border: none;
  border-radius: 4px;
  font-family: Roboto-Medium, sans-serif;
  font-size: 11px;
  line-height: 24px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.live_preview_reset {
  background: var(--secondary-lighter);
  color: var(--primary-dark);
  cursor: pointer;
}

.live_preview_reset:hover:not(:disabled) {
  background: #fff;
}

.live_preview_reset:disabled {
  background: var(--primary-lighter);
  color: var(--secondary-dark);
  cursor: default;
}

.live_preview_badge {
  background: var(--primary-lighter);
  color: var(--secondary-light);
}

.live_preview_badge.off {
  color: var(--secondary-dark);
}

.live_preview_reset svg,
.live_preview_badge svg {
  width: 12px;
  height: 12px;
}

.live_preview_reset svg {
  fill: none;
  stroke: currentColor;
  stroke-width: 1.6;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.live_preview_badge svg {
  fill: currentColor;
}
</style>
