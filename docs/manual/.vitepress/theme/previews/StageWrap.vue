<template>
  <div class="stage_wrap">
    <div
      class="stage_wrap_component"
      :style="componentStyle"
    >
      <component
        :is="inner"
        v-bind="innerProps"
      />
    </div>
    <div
      class="stage_wrap_view"
      :style="{ width: `${viewWidth}px` }"
    >
      <visualizer-preview />
    </div>
  </div>
</template>

<script>
import VisualizerPreview from './VisualizerPreview.vue';

/**
 * A Studio component next to the visualizer, so the reader sees what it does to the rig: move a
 * fader, play a cue, start a chase, and the lights answer. The component keeps its size in Studio;
 * the visualizer fills the rest of the stage's height.
 * @displayName StageWrap
 */
export default {
  name: 'StageWrap',
  compatConfig: { MODE: 3 },
  components: { VisualizerPreview },
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
     * The visualizer's width (px)
     */
    viewWidth: {
      type: Number,
      default: 480,
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
};
</script>

<style scoped>
.stage_wrap {
  display: flex;
  gap: 16px;
  height: 100%;
  align-items: flex-start;
}

.stage_wrap_component {
  display: flex;
  flex: none;
  overflow: hidden;
}

.stage_wrap_component > :deep(*) {
  height: 100%;
}

.stage_wrap_view {
  flex: none;
  height: 100%;
  overflow: hidden;
  border-radius: 4px;
}
</style>
