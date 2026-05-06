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
     * Gap value in pixels between items
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
      const style = { gap: `${this.gap}px` };
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
