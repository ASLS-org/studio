<template>
  <uk-flex
    col
    class="visualizer"
    :class="{ hidden }"
  >
    <uk-flex
      class="header"
      gap="12"
    >
      <h3>Visualizer</h3>
      <uk-spacer />
      <uk-button
        v-show="!hidden"
        v-model="recording"
        square
        :label="`record 00:${timer.toString().padStart(2, 0)}`"
        :value="false"
        toggleable
        color="var(--accent-maroon)"
        @click="handleRecording"
      />
      <uk-button
        v-show="!hidden"
        v-model="autoRotate"
        square
        label="auto-rotate"
        :value="false"
        toggleable
        icon="goborotation"
        color="var(--accent-violet)"
        @click="toggleAutoRotation"
      />
      <uk-button
        v-show="!hidden"
        v-model="autoFocus"
        square
        label="auto-focus"
        :value="false"
        toggleable
        icon="focus"
        color="var(--accent-blue)"
        @click="toggleAutoFocus"
      />
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

const MAX_RECORDING_TIME_S = 15;

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
      /**
       * Media recorder handle
       */
      mediaRecorder: null,
      /**
       * videoStream handle
       */
      videoStream: null,
      /**
       * Video chunks
       */
      chunks: [],
      /**
       * Recording state
       */
      recording: false,
      /**
       * Recording timer
       */
      timer: 0,
      /**
       * timer timer handle
       */
      timerHandle: null,
      /**
       * Autofocus state
       */
      autoFocus: false,
      /**
       * Auto rotation state
       */
      autoRotate: false,
    };
  },

  async mounted() {
    this.$show.visualizerHandle = new Visualizer(this.$refs.visualizer);
    await this.$show.visualizerHandle.init();
    new ResizeObserver(
      this.$show.visualizerHandle.resize.bind(this.$show.visualizerHandle),
    ).observe(this.$refs.visualizer);
    EventBus.emit('visualizer_loaded', true);
    this.autoFocus = this.$show.visualizerHandle.autoFocus;
    this.autoRotate = this.$show.visualizerHandle.autoRotate;
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
    /**
     * Toggle camera auto-rotation
     *
     * @param {Boolean} value
     * @public
     */
    toggleAutoRotation(value) {
      this.$show.visualizerHandle.autoRotate = value;
      if (!value) this.$show.visualizerHandle.recenter();
    },
    /**
     * Toggle highlighted item autofocus
     *
     * @param {Boolean} value
     * @public
     */
    toggleAutoFocus(value) {
      this.$show.visualizerHandle.autoFocus = value;
    },
    /**
     * Start canvas recording process
     *
     * @public
     */
    startRecording() {
      if (!this.recording) {
        this.videoStream = this.$refs.visualizer.captureStream(5);
        this.mediaRecorder = new MediaRecorder(this.videoStream, {
          audioBitsPerSecond: 0,
          videoBitsPerSecond: 600 * 1024 * 1024,
          mimeType: 'video/webm',
        });
        this.mediaRecorder.start();
        this.recording = true;
        setTimeout(() => {
          this.stopRecording();
        }, (MAX_RECORDING_TIME_S * 1000));
        this.timerHandle = setInterval(() => {
          this.timer++;
        }, (1000));
        this.mediaRecorder.ondataavailable = (e) => {
          this.chunks.push(e.data);
        };
        this.mediaRecorder.onstop = () => {
          const blob = new Blob(this.chunks, { type: 'video/mp4' });
          this.chunks = [];
          const uri = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `studio_${this.$show.name.toLowerCase()}_rec`;
          link.href = uri;
          link.click();
          document.body.removeChild(link);
        };
      }
    },
    /**
     * Stops canvas recording process
     *
     * @public
     */
    stopRecording() {
      if (this.recording) {
        this.mediaRecorder.stop();
        this.recording = false;
        clearInterval(this.timerHandle);
        this.timer = 0;
      }
    },
    /**
     * Handles scene recording
     *
     * @public
     */
    handleRecording(state) {
      if (state) {
        this.startRecording();
      } else {
        this.stopRecording();
      }
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
