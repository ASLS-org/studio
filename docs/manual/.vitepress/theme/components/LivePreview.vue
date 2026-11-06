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
        v-if="state === 'idle' || state === 'loading' || state === 'ready'"
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
            <!-- Loading: the component's title and an empty body, never a picture of the app -->
            <uk-widget
              v-if="state !== 'ready'"
              class="live_preview_placeholder"
              :style="placeholderStyle"
              :header="{ title: (definition && definition.title) || preset }"
            />
          </div>
        </div>
      </div>

      <!-- Over the whole frame, unscaled: Studio's popups open here (centred on the frame, their
           backdrop dims only the frame); in a demo, the cursor and its hint -->
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
          <div
            ref="hint"
            class="live_preview_hint"
          />
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
        v-else-if="state === 'fallback' && fallbackVideo"
        :src="fallbackVideo"
      />
      <p
        v-else
        class="live_preview_message"
      >
        {{ message }}
      </p>

      <!-- Under the stage, so nothing covers the component -->
      <div
        v-if="state === 'ready'"
        class="live_preview_bar"
      >
        <span
          v-if="isDemo"
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

/** Window events: previews unmount before a reset reloads the show, then mount again */
const SUSPEND_EVENT = 'asls-preview-suspend';
const RESUME_EVENT = 'asls-preview-resume';
/** Window events: the reader changed something in a preview / the show is back as loaded */
const DIRTY_EVENT = 'asls-preview-dirty';
const CLEAN_EVENT = 'asls-preview-clean';
/** Reader input that may change the show */
const EDIT_EVENTS = ['pointerdown', 'keydown', 'input', 'wheel'];

/**
 * Whether this browser can run a preview
 * @param {Object} preset preset
 * @returns {?String} why it can't, or null
 */
function unsupported(preset) {
  if (typeof Worker === 'undefined') return 'This preview needs Web Workers, which this browser has turned off.';
  if (preset.webgl) {
    const canvas = document.createElement('canvas');
    if (!(canvas.getContext('webgl2') || canvas.getContext('webgl'))) {
      return 'This preview needs WebGL, which this browser has turned off.';
    }
  }
  return null;
}

/**
 * A live Studio component in a manual page: the real widget or panel named by a preset
 * (previews/presets.js), at the size it has in Studio, on Studio's idle surface, running on the
 * manual's demo show. Interactive, or a demo a cursor plays. Loads when it comes near the
 * screen, pauses Studio's clock off screen, and falls back to its video or a message when it
 * can't run.
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
      state: 'idle',
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
     * Whether a scripted cursor plays this preset
     * @type {Boolean}
     */
    isDemo() {
      return Boolean(this.definition && this.definition.demo);
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
      return (this.definition && this.definition.width) || this.contentWidth || 240;
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
     * Where the component sits on the stage (top left, at its own width unless the preset sets
     * the component's width)
     * @type {Object}
     */
    mountStyle() {
      const { componentWidth, componentHeight } = this.definition || {};
      return {
        width: componentWidth ? `${componentWidth}px` : 'max-content',
        height: componentHeight ? `${componentHeight}px` : '100%',
      };
    },
    /**
     * The loading placeholder takes the component's place
     * @type {Object}
     */
    placeholderStyle() {
      const { componentWidth, width } = this.definition || {};
      return { width: `${componentWidth || width || 240}px` };
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
    window.addEventListener(SUSPEND_EVENT, this.suspend);
    window.addEventListener(RESUME_EVENT, this.resume);
    window.addEventListener(DIRTY_EVENT, this.markDirty);
    window.addEventListener(CLEAN_EVENT, this.markClean);
    // The reader's edits enable Reset on every preview of the page
    this.onEdit = (e) => {
      if (e.isTrusted && !this.isDemo) window.dispatchEvent(new Event(DIRTY_EVENT));
    };
    EDIT_EVENTS.forEach((type) => this.$el.addEventListener(type, this.onEdit, true));
    // Load when within a screen height; run Studio's clock only while on screen
    this.nearObserver = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        this.nearObserver.disconnect();
        this.load();
      }
    }, { rootMargin: '100% 0px' });
    this.nearObserver.observe(this.$el);
    this.viewObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      this.updateClock();
    });
    this.viewObserver.observe(this.$el);
    this.sizeObserver = new ResizeObserver(() => this.measure());
    this.sizeObserver.observe(this.$el);
  },
  beforeUnmount() {
    window.removeEventListener(SUSPEND_EVENT, this.suspend);
    window.removeEventListener(RESUME_EVENT, this.resume);
    window.removeEventListener(DIRTY_EVENT, this.markDirty);
    window.removeEventListener(CLEAN_EVENT, this.markClean);
    if (this.onEdit) {
      EDIT_EVENTS.forEach((type) => this.$el.removeEventListener(type, this.onEdit, true));
    }
    if (this.nearObserver) this.nearObserver.disconnect();
    if (this.viewObserver) this.viewObserver.disconnect();
    if (this.sizeObserver) this.sizeObserver.disconnect();
    if (this.popupObserver) this.popupObserver.disconnect();
    this.visible = false;
    this.updateClock();
    this.stopDemo();
    this.unmountApp();
  },
  methods: {
    /**
     * Loads the host and the demo show, then mounts the component
     */
    async load() {
      this.state = 'loading';
      try {
        this.host = await import('../previews/host');
        await this.host.loadShow(this.page);
        await this.mountApp();
        if (this.isDemo) this.startDemo();
      } catch (err) {
        this.fail('This preview could not start.', err);
      }
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
      if (mount && mount.firstElementChild && !(this.definition && this.definition.width)) {
        this.contentWidth = Math.ceil(mount.firstElementChild.getBoundingClientRect().width
          / (this.scale || 1));
      }
      const available = viewport.clientWidth;
      this.scale = this.fit === 'scale' && available
        ? Math.min(1, available / this.stageWidth) : 1;
    },
    /**
     * Starts the scripted cursor
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
        visible: () => Boolean(this.visible) && document.visibilityState === 'visible',
        restart: async () => {
          this.unmountApp();
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
     * Reset: every preview on the page unmounts, the demo show reloads, they all mount again
     * (components must never render a show being cleared)
     */
    async reset() {
      this.resetting = true;
      window.dispatchEvent(new Event(SUSPEND_EVENT));
      try {
        await this.host.loadShow(this.page, true);
      } catch (err) {
        this.fail('This preview could not reset.', err);
      }
      window.dispatchEvent(new Event(RESUME_EVENT));
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
     * Before a reset: unmount
     */
    suspend() {
      if (!this.app) return;
      this.stopDemo();
      this.unmountApp();
      this.suspended = true;
      this.updateClock();
    },
    /**
     * After a reset: mount again, on the reloaded show's objects
     */
    async resume() {
      if (!this.suspended) return;
      this.suspended = false;
      try {
        await this.mountApp();
        if (this.isDemo) this.startDemo();
      } catch (err) {
        this.fail('This preview could not restart.', err);
      }
    },
    /**
     * Tells the host whether this preview needs Studio's clock right now
     */
    updateClock() {
      if (!this.host || !this.definition) return;
      this.host.setClock(this.id, Boolean(this.visible && this.app && this.definition.clock));
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
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1001;
  padding: 4px 8px;
  border-radius: 4px;
  background: var(--primary-dark);
  font-family: Roboto-Medium, sans-serif;
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
  color: var(--secondary-lighter);
  opacity: 0;
  transition: transform 0.6s cubic-bezier(0.45, 0, 0.2, 1), opacity 0.2s;
  pointer-events: none;
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
  justify-content: flex-end;
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
