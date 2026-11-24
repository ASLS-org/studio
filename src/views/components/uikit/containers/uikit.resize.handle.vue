<template>
  <div
    class="uikit_resize_handle"
    :class="[axis, { dragging }]"
    @pointerdown="start"
  />
</template>

<script>
/**
 * @component ResizeHandle A border that resizes a neighbouring element: drag it anywhere along its
 *   length. Place it right after the element it resizes (on its right edge with `axis="x"`, below
 *   it with `axis="y"`). The element's own min/max width or height still apply.
 * @namespace uikit/containers
 * @story Horizontal {"axis":"x"}
 */
export default {
  name: 'UkResizeHandle',
  compatConfig: {
    MODE: 3,
  },
  props: {
    /**
     * 'x' resizes the element's width (a vertical border), 'y' its height (a horizontal border)
     */
    axis: {
      type: String,
      default: 'x',
      validator: (value) => ['x', 'y'].includes(value),
    },
    /**
     * The element to resize, or a function returning it (default: the previous sibling)
     */
    target: {
      type: [Object, Function],
      default: null,
    },
  },
  emits: ['resize'],
  data() {
    return {
      /**
       * Whether a drag is in progress
       */
      dragging: false,
    };
  },
  beforeUnmount() {
    this.stop();
  },
  methods: {
    /**
     * The element this handle resizes
     *
     * @returns {?HTMLElement}
     */
    element() {
      if (typeof this.target === 'function') return this.target();
      return this.target || this.$el.previousElementSibling;
    },
    /**
     * Starts resizing from the pointer's position
     *
     * @param {PointerEvent} e pointerdown event
     */
    start(e) {
      const el = this.element();
      if (!el || e.button !== 0) return;
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      this.drag = {
        el,
        from: this.axis === 'x' ? e.clientX : e.clientY,
        size: this.axis === 'x' ? rect.width : rect.height,
      };
      this.dragging = true;
      // Keep the resize cursor while the pointer runs ahead of the border
      document.documentElement.dataset.resizing = this.axis;
      this.$el.setPointerCapture(e.pointerId);
      this.$el.addEventListener('pointermove', this.move);
      this.$el.addEventListener('pointerup', this.stop);
      this.$el.addEventListener('pointercancel', this.stop);
    },
    /**
     * Follows the pointer: the element's size changes by as much as the pointer moved
     *
     * @param {PointerEvent} e pointermove event
     */
    move(e) {
      if (!this.drag) return;
      const { el, from, size } = this.drag;
      const delta = (this.axis === 'x' ? e.clientX : e.clientY) - from;
      el.style[this.axis === 'x' ? 'width' : 'height'] = `${Math.max(0, size + delta)}px`;
      /**
       * The element was resized
       *
       * @property {Number} size its new width or height (px), within its min and max
       */
      this.$emit('resize', this.axis === 'x' ? el.offsetWidth : el.offsetHeight);
    },
    /**
     * Ends the drag
     */
    stop() {
      if (this.drag) delete document.documentElement.dataset.resizing;
      this.drag = null;
      this.dragging = false;
      if (!this.$el) return;
      this.$el.removeEventListener('pointermove', this.move);
      this.$el.removeEventListener('pointerup', this.stop);
      this.$el.removeEventListener('pointercancel', this.stop);
    },
  },
};
</script>

<style scoped>
/* The handle takes no room: an 8px grab area straddles the border, and a discreet 2px line in its
   middle lights up on hover and while dragging */
.uikit_resize_handle {
  position: relative;
  flex: 0 0 0;
  z-index: 30;
  touch-action: none;
}
.uikit_resize_handle::before,
.uikit_resize_handle::after {
  content: '';
  position: absolute;
}
.uikit_resize_handle::after {
  transition: background-color 0.1s;
}
.uikit_resize_handle.x {
  width: 0;
  align-self: stretch;
  cursor: col-resize;
}
.uikit_resize_handle.x::before {
  top: 0;
  bottom: 0;
  left: calc(var(--space-2) * -1);
  width: var(--space-4);
}
.uikit_resize_handle.x::after {
  top: 0;
  bottom: 0;
  left: calc(var(--space-1) / -2);
  width: var(--space-1);
}
.uikit_resize_handle.y {
  height: 0;
  width: 100%;
  cursor: row-resize;
}
.uikit_resize_handle.y::before {
  left: 0;
  right: 0;
  top: calc(var(--space-2) * -1);
  height: var(--space-4);
}
.uikit_resize_handle.y::after {
  left: 0;
  right: 0;
  top: calc(var(--space-1) / -2);
  height: var(--space-1);
}
.uikit_resize_handle:hover::after,
.uikit_resize_handle.dragging::after {
  background: var(--secondary-light);
}
</style>

<style>
/* While dragging, the resize cursor wins over every element the pointer crosses */
html[data-resizing="x"],
html[data-resizing="x"] * {
  cursor: col-resize !important;
  user-select: none !important;
}
html[data-resizing="y"],
html[data-resizing="y"] * {
  cursor: row-resize !important;
  user-select: none !important;
}
</style>
