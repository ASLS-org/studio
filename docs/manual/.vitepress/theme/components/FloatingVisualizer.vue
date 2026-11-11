<template>
  <div
    v-if="visible"
    ref="card"
    class="floating_visualizer"
    :class="{
      collapsed, attached, free: mode === 'free', narrow, moving,
    }"
    :style="cardStyle"
    role="region"
    aria-label="Visualizer"
  >
    <!-- Collapsed: the title and a call to bring the stage back -->
    <button
      v-if="collapsed"
      type="button"
      class="floating_visualizer_pill"
      @click="setCollapsed(false)"
    >
      <span class="floating_visualizer_dot" />
      <span class="floating_visualizer_title">Visualizer</span>
      <span class="floating_visualizer_cta">Show the stage</span>
    </button>

    <template v-else>
      <header
        class="floating_visualizer_header"
        @pointerdown="startDrag"
      >
        <span class="floating_visualizer_dot" />
        <span class="floating_visualizer_title">Visualizer</span>
        <span
          v-if="attached && state.title"
          class="floating_visualizer_follow"
        >{{ state.demo ? 'Demo' : 'Live' }} · {{ state.title }}</span>
        <span class="floating_visualizer_spacer" />
        <button
          v-if="mode === 'free'"
          type="button"
          class="floating_visualizer_button"
          title="Back to its place"
          aria-label="Back to its place"
          @pointerdown.stop
          @click="mode = 'auto'"
        >
          <svg
            viewBox="0 0 16 16"
            aria-hidden="true"
          ><path d="M3 8a5 5 0 1 0 1.5-3.6M3 2.5v2.4h2.4" /></svg>
        </button>
        <button
          type="button"
          class="floating_visualizer_button"
          title="Reduce to a title"
          aria-label="Reduce to a title"
          @pointerdown.stop
          @click="setCollapsed(true)"
        >
          <svg
            viewBox="0 0 16 16"
            aria-hidden="true"
          ><path d="M3.5 8h9" /></svg>
        </button>
      </header>
      <div
        ref="view"
        class="floating_visualizer_view"
      />
      <span
        v-if="!narrow"
        class="floating_visualizer_grip"
        :class="gripCorner"
        title="Resize"
        @pointerdown.stop="startResize"
      />
    </template>
  </div>
</template>

<script>
import stage from '../previews/stage';

/** Sizes (px): docked in the corner, attached next to a preview (both resizable), limits */
const SIZES = {
  dock: { w: 300, h: 196 },
  attach: { w: 440, h: 300 },
  min: { w: 220, h: 150 },
  max: { w: 900, h: 640 },
};
/** Margin from the window's edges and from the preview (px) */
const GAP = 16;
/** Below this window width the card is a bottom sheet */
const NARROW = 768;
/** The toolbar's height: the card stays under it */
const TOP = 56;
/** Per-viewer conveniences, kept in this browser */
const STORE = 'asls-manual-visualizer';

const clamp = (x, a, b) => Math.min(Math.max(x, a), b);

/**
 * Reads the reader's saved card state
 * @returns {Object} { collapsed, dock, attach }
 */
function readStore() {
  try {
    return JSON.parse(localStorage.getItem(STORE)) || {};
  } catch (e) {
    return {};
  }
}

/**
 * The manual's one visualizer: a floating card over the page, on pages with previews that drive
 * the rig. Docked small in the bottom right corner; while such a preview runs, it floats next to
 * it and follows it as the page scrolls. The reader can move it (it then stays put until sent
 * back), resize it, and reduce it to a title (the 3D view is released until it is shown again).
 * @displayName FloatingVisualizer
 */
export default {
  name: 'FloatingVisualizer',
  data() {
    const saved = readStore();
    return {
      state: stage,
      collapsed: Boolean(saved.collapsed),
      mode: 'auto',
      dock: { ...SIZES.dock, ...saved.dock },
      attach: { ...SIZES.attach, ...saved.attach },
      free: { x: 0, y: 0 },
      box: {
        x: 0, y: 0, w: SIZES.dock.w, h: SIZES.dock.h,
      },
      narrow: false,
      moving: false,
    };
  },
  computed: {
    /**
     * On pages with a preview that drives the rig
     * @type {Boolean}
     */
    visible() {
      return this.state.count > 0;
    },
    /**
     * Next to the running stage preview
     * @type {Boolean}
     */
    attached() {
      return this.mode === 'auto' && Boolean(this.state.frame);
    },
    /**
     * Where the resize grip sits: away from the corner the card is anchored to
     * @type {String}
     */
    gripCorner() {
      return this.mode === 'auto' && !this.attached ? 'top_left' : 'bottom_right';
    },
    /**
     * Position and size, as a transform (the card glides as it follows)
     * @type {Object}
     */
    cardStyle() {
      if (this.collapsed) return {};
      const {
        x, y, w, h,
      } = this.box;
      return {
        width: `${w}px`,
        height: `${h}px`,
        transform: `translate3d(${Math.round(x)}px, ${Math.round(y)}px, 0)`,
      };
    },
  },
  watch: {
    visible: 'syncView',
    collapsed: 'syncView',
    'state.frame': function onFrame() {
      this.observeFrame();
      this.place();
    },
    mode() {
      this.place();
    },
  },
  mounted() {
    this.onWindow = () => this.schedule();
    window.addEventListener('scroll', this.onWindow, { passive: true });
    window.addEventListener('resize', this.onWindow);
    this.place();
    this.syncView();
  },
  beforeUnmount() {
    window.removeEventListener('scroll', this.onWindow);
    window.removeEventListener('resize', this.onWindow);
    if (this.frameObserver) this.frameObserver.disconnect();
    this.unmountView();
  },
  methods: {
    /**
     * Mounts the 3D view while the card is shown and open; releases it otherwise
     */
    async syncView() {
      const want = this.visible && !this.collapsed;
      if (!want) {
        this.unmountView();
        return;
      }
      await this.$nextTick();
      this.place();
      if (this.app || this.mounting || !this.$refs.view) return;
      this.mounting = true;
      try {
        const host = await import('../previews/host');
        await host.loadShow(window.location.pathname);
        if (this.visible && !this.collapsed && this.$refs.view && !this.app) {
          this.app = await host.mountVisualizer(this.$refs.view);
        }
      } catch (err) {
        console.error('[FloatingVisualizer]', err); // eslint-disable-line no-console
      } finally {
        this.mounting = false;
      }
    },
    /**
     * Unmounts the 3D view (its WebGL context is released)
     */
    unmountView() {
      if (this.app) {
        this.app.unmount();
        this.app = null;
      }
    },
    /**
     * Reduces the card to its title, or opens it again
     * @param {Boolean} state collapsed
     */
    setCollapsed(state) {
      this.collapsed = state;
      this.save();
    },
    /**
     * Keeps the reader's conveniences (collapsed, sizes) in this browser
     */
    save() {
      try {
        localStorage.setItem(STORE, JSON.stringify({
          collapsed: this.collapsed, dock: this.dock, attach: this.attach,
        }));
      } catch (e) {
        // Storage off (private window): the card still works, it just won't remember
      }
    },
    /**
     * Re-places the card on the next frame (scroll, resize)
     */
    schedule() {
      if (this.scheduled) return;
      this.scheduled = true;
      requestAnimationFrame(() => {
        this.scheduled = false;
        this.place();
      });
    },
    /**
     * Follows the running preview's size too (a demo's popup, a panel growing)
     */
    observeFrame() {
      if (this.frameObserver) this.frameObserver.disconnect();
      if (!this.state.frame) return;
      this.frameObserver = new ResizeObserver(() => this.schedule());
      this.frameObserver.observe(this.state.frame);
    },
    /**
     * Where the card goes: a bottom sheet on phones; else where the reader put it, next to the
     * running stage preview (the side with more room, else above or below it), or docked in the
     * bottom right corner
     */
    place() {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      this.narrow = vw < NARROW;
      if (this.narrow) {
        const h = this.state.frame ? Math.min(280, vh * 0.4) : 180;
        this.box = {
          x: 12, y: vh - h - 12, w: vw - 24, h,
        };
        return;
      }
      if (this.mode === 'free') {
        const { w, h } = this.attach;
        this.box = {
          x: clamp(this.free.x, 0, vw - w), y: clamp(this.free.y, TOP, vh - h), w, h,
        };
        return;
      }
      if (!this.attached) {
        const { w, h } = this.dock;
        this.box = {
          x: vw - w - GAP, y: vh - h - GAP, w, h,
        };
        return;
      }
      const r = this.state.frame.getBoundingClientRect();
      const ratio = this.attach.h / this.attach.w;
      const right = vw - r.right - 2 * GAP;
      const left = r.left - 2 * GAP;
      const room = Math.max(right, left);
      let { w } = this.attach;
      let x;
      let y;
      if (room >= SIZES.min.w) {
        // Beside the preview, shrunk to the margin if needed, aligned with its top
        // The right margin first (over the page's outline, not its navigation)
        const side = right >= SIZES.min.w ? 'right' : 'left';
        w = Math.min(w, side === 'right' ? right : left);
        x = side === 'right' ? r.right + GAP : r.left - GAP - w;
        const h = w * ratio;
        y = clamp(r.top, TOP + GAP, vh - h - GAP);
        this.box = {
          x, y, w, h,
        };
        return;
      }
      // No margin wide enough: under the preview if it fits on screen, else above, else in the
      // corner (the preview scrolls past it)
      const { h } = this.attach;
      x = clamp(r.right - w, GAP, vw - w - GAP);
      if (r.bottom + GAP + h <= vh - GAP) y = r.bottom + GAP;
      else if (r.top - GAP - h >= TOP + GAP) y = r.top - GAP - h;
      else y = vh - h - GAP;
      this.box = {
        x, y, w, h,
      };
    },
    /**
     * Moves the card by its header; once moved, it stays where the reader put it
     * @param {PointerEvent} e pointer event
     */
    startDrag(e) {
      if (this.narrow || e.button !== 0) return;
      const start = { x: e.clientX, y: e.clientY };
      const origin = { x: this.box.x, y: this.box.y };
      let dragging = false;
      const move = (ev) => {
        const dx = ev.clientX - start.x;
        const dy = ev.clientY - start.y;
        if (!dragging && Math.hypot(dx, dy) < 4) return;
        if (!dragging) {
          dragging = true;
          this.moving = true;
          this.attach = { w: this.box.w, h: this.box.h };
          this.mode = 'free';
        }
        this.free = { x: origin.x + dx, y: origin.y + dy };
        this.place();
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        this.moving = false;
        if (dragging) this.save();
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    },
    /**
     * Resizes the card from its grip, within limits
     * @param {PointerEvent} e pointer event
     */
    startResize(e) {
      if (e.button !== 0) return;
      const start = { x: e.clientX, y: e.clientY };
      const origin = { ...this.box };
      const docked = this.gripCorner === 'top_left';
      this.moving = true;
      const move = (ev) => {
        const sign = docked ? -1 : 1;
        const w = clamp(origin.w + sign * (ev.clientX - start.x), SIZES.min.w, SIZES.max.w);
        const h = clamp(origin.h + sign * (ev.clientY - start.y), SIZES.min.h, SIZES.max.h);
        if (docked) {
          this.dock = { w, h };
        } else {
          this.attach = { w, h };
          if (this.mode === 'free') this.free = { x: origin.x, y: origin.y };
        }
        this.place();
      };
      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        this.moving = false;
        this.save();
      };
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    },
  },
};
</script>

<style scoped>
.floating_visualizer {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 40;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--primary-lighter);
  border-radius: 8px;
  background: var(--primary-dark);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
  transition: transform 0.28s cubic-bezier(0.22, 1, 0.36, 1), width 0.28s ease, height 0.28s ease;
}

.floating_visualizer.moving {
  transition: none;
}

/* Collapsed: a pill in the corner */
.floating_visualizer.collapsed {
  top: auto;
  right: 16px;
  bottom: 16px;
  left: auto;
  border-radius: 999px;
  transform: none;
}

.floating_visualizer_pill {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: none;
  background: transparent;
  color: inherit;
  font: inherit;
  cursor: pointer;
}

.floating_visualizer_pill:hover .floating_visualizer_cta {
  color: var(--secondary-lighter);
}

.floating_visualizer_header {
  display: flex;
  flex: none;
  align-items: center;
  gap: 8px;
  height: 32px;
  padding: 0 6px 0 12px;
  border-bottom: 1px solid var(--primary-lighter);
  background: var(--primary-light);
  cursor: grab;
  user-select: none;
  touch-action: none;
}

.floating_visualizer.moving .floating_visualizer_header {
  cursor: grabbing;
}

.floating_visualizer_dot {
  flex: none;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent-sea-green);
}

.floating_visualizer_title {
  font-family: Roboto-Bold, sans-serif;
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--secondary-lighter);
}

.floating_visualizer_follow,
.floating_visualizer_cta {
  overflow: hidden;
  font-family: Roboto-Medium, sans-serif;
  font-size: 11px;
  white-space: nowrap;
  text-overflow: ellipsis;
  color: var(--secondary-light);
}

.floating_visualizer_spacer {
  flex: 1;
}

.floating_visualizer_button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 4px;
  background: transparent;
  cursor: pointer;
}

.floating_visualizer_button:hover {
  background: var(--primary-lighter);
}

.floating_visualizer_button svg {
  width: 14px;
  height: 14px;
  fill: none;
  stroke: var(--secondary-lighter);
  stroke-width: 1.6;
  stroke-linecap: round;
}

.floating_visualizer_view {
  flex: 1;
  min-height: 0;
}

.floating_visualizer_grip {
  position: absolute;
  width: 16px;
  height: 16px;
  touch-action: none;
}

.floating_visualizer_grip::after {
  content: '';
  position: absolute;
  inset: 4px;
  border-color: var(--secondary-light);
  border-style: solid;
  border-width: 0;
  opacity: 0.6;
}

.floating_visualizer_grip.bottom_right {
  right: 0;
  bottom: 0;
  cursor: nwse-resize;
}

.floating_visualizer_grip.bottom_right::after {
  border-right-width: 2px;
  border-bottom-width: 2px;
}

.floating_visualizer_grip.top_left {
  top: 32px;
  left: 0;
  cursor: nwse-resize;
}

.floating_visualizer_grip.top_left::after {
  border-top-width: 2px;
  border-left-width: 2px;
}

/* Phones: a sheet along the bottom, no moving or resizing */
.floating_visualizer.narrow .floating_visualizer_header {
  cursor: default;
}

@media (prefers-reduced-motion: reduce) {
  .floating_visualizer {
    transition: none;
  }
}
</style>
