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
import { markRaw } from 'vue';
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
  computed: {
    /**
     * What the view highlights, as a comparable key (selection of the panel in view)
     *
     * @type {String}
     */
    highlightKey() {
      const highlight = this.$view?.highlight;
      return highlight ? `${highlight.ids.join(',')}|${highlight.gizmo}` : '';
    },
  },
  watch: {
    highlightKey() {
      this.applySelection();
    },
  },

  async mounted() {
    this.$show.visualizerHandle = markRaw(new Visualizer(this.$refs.visualizer));
    await this.$show.visualizerHandle.init();
    new ResizeObserver(
      this.$show.visualizerHandle.resize.bind(this.$show.visualizerHandle),
    ).observe(this.$refs.visualizer);
    EventBus.emit('visualizer_loaded', true);
    this.autoFocus = this.$show.visualizerHandle.autoFocus;
    this.autoRotate = this.$show.visualizerHandle.autoRotate;
    this.patchFrame = null;
    EventBus.on('patch_changed', this.schedulePatchUpdate);
    EventBus.on('fixture_pose', this.handleFixturePose);
    EventBus.on('fixture_transformed', this.handleFixtureTransformed);
    this.$show.visualizerHandle.fixtureRenderer.setPatch(this.$show.patchSnapshot);
    this.warmed = this.$show.visualizerHandle.warmUp();
    this.applySelection();
  },
  beforeUnmount() {
    EventBus.off('patch_changed', this.schedulePatchUpdate);
    EventBus.off('fixture_pose', this.handleFixturePose);
    EventBus.off('fixture_transformed', this.handleFixtureTransformed);
    cancelAnimationFrame(this.patchFrame);
  },
  methods: {
    /**
     * Shows the view's selection in the 3D view (highlight and gizmo)
     *
     * @public
     */
    applySelection() {
      const renderer = this.$show.visualizerHandle?.fixtureRenderer;
      const highlight = this.$view?.highlight;
      if (!renderer || !highlight) return;
      if (this.patchFrame) this.flushPatchUpdate();
      renderer.setSelection(highlight.ids, highlight.gizmo);
    },
    /**
     * Rebuilds the rendered patch once per animation frame, however many patch changes happen
     * (loading a show patches every fixture)
     *
     * @public
     */
    schedulePatchUpdate() {
      if (this.patchFrame) return;
      this.patchFrame = requestAnimationFrame(this.flushPatchUpdate);
    },
    /**
     * Applies a pending patch rebuild now (before a pose or highlight that may target a fixture
     * patched in the same frame)
     *
     * @public
     */
    flushPatchUpdate() {
      if (this.patchFrame) {
        cancelAnimationFrame(this.patchFrame);
      }
      this.patchFrame = null;
      this.$show.visualizerHandle.fixtureRenderer.setPatch(this.$show.patchSnapshot);
      // Once fixtures are patched, compile what a selection draws (see Visualizer.warmUp)
      if (!this.warmed) this.warmed = this.$show.visualizerHandle.warmUp();
    },
    /**
     * Makes sure the renderer knows a fixture before an event targets it: flushes a pending
     * patch rebuild when the fixture isn't rendered yet. Ignores fixtures without an id yet
     * (still being built).
     *
     * @public
     * @param {Number} id Fixture id
     * @returns {Boolean} Whether the event should be forwarded
     */
    resolvePendingPatch(id) {
      if (!Number.isInteger(id)) return false;
      if (this.patchFrame && !this.$show.visualizerHandle.fixtureRenderer.instances.has(id)) {
        this.flushPatchUpdate();
      }
      return true;
    },
    /**
     * Forwards a fixture's position/rotation change to the renderer
     *
     * @public
     * @param {Object} pose fixture_pose event payload
     */
    handleFixturePose(pose) {
      if (this.resolvePendingPatch(pose.id)) {
        this.$show.visualizerHandle.fixtureRenderer.setPose(pose);
      }
    },
    /**
     * Applies a gizmo move or rotation to the fixture (the model stays the source of truth)
     *
     * @public
     * @param {Object} transform fixture_transformed event payload
     */
    handleFixtureTransformed({ id, position, rotation }) {
      if (!this.$show.fixturePool.checkIfExists(id)) return;
      const fixture = this.$show.fixturePool.getFromId(id);
      if (position) fixture.position = position;
      if (rotation) fixture.rotation = rotation;
    },
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
        // TODO: set this as a visualizer parameter
        this.videoStream = this.$refs.visualizer.captureStream(24);
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
