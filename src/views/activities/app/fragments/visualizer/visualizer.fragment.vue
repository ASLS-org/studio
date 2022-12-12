<template>
  <uk-flex col class="visualizer" :class="{ hidden }">
    <uk-flex class="header" v-if="$route.name != 'Visualizer'">
      <h3>Visualizer</h3>
      <span style="flex: 1" />
      <!-- <uk-button v-show="!hidden" @click.native="popout" icon="popout" style="margin-right: 8px" label="Popout" /> -->
      <uk-button v-show="!hidden" @click.native="toggleVisibility" icon="hide" style="margin-right: 8px" label="Hide" />
      <uk-icon v-show="hidden" @click.native="toggleVisibility" name="hide" style="fill: var(--secondary-lighter); cursor: pointer" />
    </uk-flex>
    <canvas v-show="!hidden" class="visualizer" id="visualizer" ref="visualizer" />
  </uk-flex>
</template>

<script>
import Visualizer from "@/plugins/visualizer/visualizer.js";
import EventBus from "@/plugins/eventbus";

export default {
  name: "VisualizerFragment",
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
  methods: {
    /**
     * Opens visualizer in a popup window
     * 
       * @public
     */
    popout() {
      this.hide();
      this.popupHandle = window.open("/visualizer", "visualizerWindow", "popup");
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
  async mounted() {
    try {
      this.$show.visualizerHandle = new Visualizer(this.$refs.visualizer);
      await this.$show.visualizerHandle.init();
      window.addEventListener("resize", () => {
        this.$show.visualizerHandle.resize();
      });
      this.$show.visualizerHandle.resize();
      setTimeout(() => {
        this.$show.visualizerHandle.resize();
      }, 500);
      EventBus.$emit("visualizer_loaded", true);
    } catch (err) {
      console.log(err);
    }
  },
};
</script>

<style scoped>
.visualizer {
  display: flex;
  height: 100% !important;
  width: 100% !important;
  outline: none;
  border-left: var(--primary-dark);
  cursor: grab!important;
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
  /* background: repeating-linear-gradient(45deg, #161913, #161913 10px, #0c0e0a 10px, #0c0e0a 20px); */
  text-align: left;
  flex-direction: column-reverse;
  padding: 10px 0px;
}
</style>
