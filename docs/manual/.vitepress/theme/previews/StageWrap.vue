<template>
  <div
    ref="box"
    class="stage_wrap_component"
    :style="componentStyle"
  >
    <component
      :is="inner"
      v-bind="innerProps"
    />
  </div>
</template>

<script>

/**
 * A Studio component that drives the rig, at its size in Studio. The page's floating visualizer
 * card comes next to it while it runs (see FloatingVisualizer.vue), so the reader sees what it
 * does to the rig: move a fader, play a cue, start a chase, and the lights answer.
 * @displayName StageWrap
 */
export default {
  name: 'StageWrap',
  compatConfig: { MODE: 3 },
  /**
   * Studio's popups mount into the injected `popupHost`: it must exist before the component
   * mounts, so it is created here and placed in the box once mounted
   * @returns {Object} provided values
   */
  provide() {
    if (!this.popupInBox) return {};
    this.boxHost = document.createElement('div');
    this.boxHost.className = 'stage_wrap_popups';
    return { popupHost: this.boxHost };
  },
  props: {
    /**
     * The Studio component (or the router view, for panels)
     */
    inner: {
      type: [Object, Function],
      required: true,
    },
    /**
     * Its props
     */
    innerProps: {
      type: Object,
      default: () => ({}),
    },
    /**
     * Its width (px; 0: its own)
     */
    innerWidth: {
      type: Number,
      default: 0,
    },
    /**
     * Its height (px)
     */
    innerHeight: {
      type: Number,
      default: 239,
    },
    /**
     * Popups open in the component's box (beside the visualizer) instead of over the whole
     * preview: for a component that is a popup, such as the visualizer settings
     */
    popupInBox: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    /**
     * The component's box: Studio's size
     * @type {Object}
     */
    componentStyle() {
      return {
        width: this.innerWidth ? `${this.innerWidth}px` : 'max-content',
        height: `${this.innerHeight}px`,
      };
    },
  },
  mounted() {
    if (this.boxHost) this.$refs.box.appendChild(this.boxHost);
  },
};
</script>

<style scoped>
.stage_wrap_component {
  position: relative;
  display: flex;
  flex: none;
  overflow: hidden;
}

/* Popups placed in the box: they center on it, as Studio's do on the window */
.stage_wrap_component :deep(.stage_wrap_popups) {
  position: absolute;
  inset: 0;
  transform: translateZ(0);
}

.stage_wrap_component > :deep(*) {
  height: 100%;
}

</style>
