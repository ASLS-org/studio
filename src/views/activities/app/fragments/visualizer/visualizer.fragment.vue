<template>
  <uk-flex
    col
    class="visualizer"
    :class="{ hidden }"
  >
    <uk-flex
      class="header"
    >
      <h3>Visualizer</h3>
      <span style="flex: 1" />
      <uk-button
        v-show="!hidden"
        icon="hide"
        style="margin-right: 8px"
        label="Hide"
        @click="toggleVisibility"
      />
      <uk-icon
        v-show="hidden"
        name="hide"
        style="fill: var(--secondary-lighter); cursor: pointer"
        @click="toggleVisibility"
      />
    </uk-flex>
    <canvas
      v-show="!hidden"
      id="visualizer"
      ref="visualizer"
      class="visualizer"
    />
  </uk-flex>
</template>

<script>
import Visualizer from '@/plugins/visualizer/visualizer';
import EventBus from '@/plugins/eventbus';

export default {
  name: 'VisualizerFragment',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  data() {
    return {
      /**
       * handle to visualizer instance
       */
      visualizerHandle: null,
      /**
       * handle to popup window
       */
      popupHandle: null,
      /**
       * Visibility state
       */
      hidden: false,
    };
  },
  async mounted() {
    this.$show.visualizerHandle = new Visualizer(this.$refs.visualizer);
    await this.$show.visualizerHandle.init();
    new ResizeObserver(
      this.$show.visualizerHandle.resize.bind(this.$show.visualizerHandle),
    ).observe(this.$refs.visualizer);
    EventBus.emit('visualizer_loaded', true);
  },
  methods: {
    /**
     * Opens visualizer in a popup window
     *
     * @public
     */
    popout() {
      this.hide();
      this.popupHandle = window.open('/visualizer', 'visualizerWindow', 'popup');
      this.popupHandle.$show = this.$show;
      this.popupHandle.onbeforeunload = this.show;
    },
    /**
     * Toggles visualizer's visibility state on/off
     *
     * @public
     */
    toggleVisibility() {
      if (this.hidden) {
        this.show();
      } else {
        this.hide();
      }
      // Dirty trick but it should do for now.
      EventBus.emit('visualizer_visibility', !this.hidden);
    },
    /**
     * Toggles visualizer's visibility state off
     *
     * @public
     */
    hide() {
      this.hidden = true;
      this.$show.visualizerHandle.stopRender();
    },
    /**
     * Toggles visualizer's visibility state on
     *
     * @public
     */
    show() {
      this.hidden = false;
      if (this.popupHandle) {
        this.popupHandle.close();
        this.popupHandle = null;
      }
      this.$show.visualizerHandle.startRender();
      this.$nextTick(() => {
        this.$show.visualizerHandle.resize();
      });
    },
  },
};
</script>

<style scoped>
#visualizer{
  cursor: grab;
}
.visualizer {
  display: flex;
  height: 100% !important;
  width: 100% !important;
  outline: none;
  border-left: var(--primary-dark);
}
.visualizer.hidden {
  width: unset !important;
}
.visualizer.hidden h3 {
  writing-mode: vertical-lr;
  text-orientation: mixed;
  transform: scale(-1);
}
.header {
  display: flex;
  flex-direction: row;
  min-height: 40px;
  width: 100%;
  padding: 0 8px;
  align-items: center;
  border-bottom: 1px solid var(--primary-dark);
  background: var(--primary-light);
}
.visualizer.hidden .header {
  height: 100%;
  width: 40px;
  text-align: left;
  flex-direction: column-reverse;
  padding: 10px 0px;
}
</style>
