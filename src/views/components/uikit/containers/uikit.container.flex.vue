<template>
  <div
    class="uikit_container_flex"
    :style="getStyle()"
    :class="{
      row: row && !reverse,
      column: col && !reverse,
      'row-reverse': row && reverse,
      'column-reverse': col && reverse
    }"
    @click="(e)=>$emit('click',e)"
  >
    <slot />
  </div>
</template>

<script>
/**
 * Spacing steps of the design scale (tokens.css), by pixel value
 *
 * @constant {Object} SPACE_STEPS
 */
const SPACE_STEPS = {
  2: 'var(--space-1)',
  4: 'var(--space-2)',
  6: 'var(--space-3)',
  8: 'var(--space-4)',
  10: 'var(--space-5)',
  12: 'var(--space-6)',
  16: 'var(--space-7)',
  20: 'var(--space-8)',
  24: 'var(--space-9)',
  32: 'var(--space-10)',
};

export default {
  name: 'UkFlex',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  props: {
    /**
     * Sets the flex container direction as row.
     * Defaults to true.
     * Property can only be set if col is not provided.
     */
    row: {
      type: Boolean,
      default: false,
    },
    /**
     * Sets the flex container direction as column.
     * Defaults to true.
     * Property can only be set if row is not provided.
     */
    col: {
      type: Boolean,
      default: false,
    },
    /**
     * Whether container items should be horizontally centered or not.
     * Defaults to false.
     */
    centerH: {
      type: Boolean,
      default: false,
    },
    /**
     * Whether container items should be vertically centered or not.
     * Defaults to false.
     */
    centerV: {
      type: Boolean,
      default: false,
    },
    /**
     * Whether container items should be both horizontally and vertically centered or not.
     * Defaults to false.
     */
    centerBoth: {
      type: Boolean,
      default: false,
    },
    /**
     * Reverse flex container direction ?
     */
    reverse: {
      type: Boolean,
      default: false,
    },
    /**
     * Gap between items: pixels on the spacing scale (2, 4, 6, 8, 10, 12, 16, 20, 24, 32) use
     * its step; any other number is in pixels; a non-numeric string is used as is (e.g.
     * 'var(--space-4)')
     */
    gap: {
      type: [Number, String],
      default: 0,
    },
  },
  emits: ['click'],
  methods: {
    /**
     * Computes and returns container style based on provided direction and centering properties
     *
       * @returns {Object} The computed styling object
     */
    getStyle() {
      const px = Number(this.gap);
      const gap = Number.isNaN(px) ? this.gap : (SPACE_STEPS[px] || `${px}px`);
      const style = { gap };
      const justify = { justifyContent: 'center' };
      const align = { alignItems: 'center' };
      if (this.centerH) {
        Object.assign(style, this.row ? justify : align);
      } else if (this.centerV) {
        Object.assign(style, this.row ? align : justify);
      } else if (this.centerBoth) {
        Object.assign(justify, align);
        Object.assign(style, justify);
      }
      return style;
    },
  },
};
</script>

<style  scoped>
.uikit_container_flex {
  display: flex;
}
.row {
  flex-direction: row;
}
.column {
  flex-direction: column;
}
.row-reverse{
  flex-direction: row-reverse;
}
.column-reverse{
  flex-direction: column-reverse;
}
</style>
