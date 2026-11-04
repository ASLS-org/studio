<template>
  <uk-popup
    v-model="state"
    :on-cancel="resetInitialValues"
    :header="headerData"
    @submit="close"
    @input="update()"
  >
    <uk-flex
      v-if="$show.visualizerHandle"
      class="body"
      :gap="8"
      col
    >
      <uk-flex
        :gap="8"
        col
        class="title"
      >
        <h3>Quality</h3>
        <p class="subtitle">
          Rendering quality on this device. Not saved in the show.
        </p>
      </uk-flex>
      <uk-flex center-h>
        <div>
          <h4>Quality:</h4>
          <p class="subtitle">
            Auto adapts to this device's frame rate.
          </p>
        </div>
        <uk-spacer />
        <uk-select-input
          v-model="$show.visualizerHandle.quality"
          style="width: 100px"
          :options="qualityOptions"
        />
      </uk-flex>
      <uk-flex center-h>
        <div>
          <h4>Resolution:</h4>
          <p class="subtitle">
            Resolution of the stage lighting (when quality isn't Auto).
          </p>
        </div>
        <uk-spacer />
        <uk-select-input
          v-model="$show.visualizerHandle.resolutionScale"
          style="width: 100px"
          :options="scaleOptions"
        />
      </uk-flex>
      <uk-flex center-h>
        <div>
          <h4>Beam guides:</h4>
          <p class="subtitle">
            Lines showing each beam's path and footprint. Auto shows them at Guides quality.
          </p>
        </div>
        <uk-spacer />
        <uk-select-input
          v-model="$show.visualizerHandle.beamGuides"
          style="width: 100px"
          :options="guideOptions"
        />
      </uk-flex>
      <div class="separator" />
      <uk-flex
        :gap="8"
        col
        class="title"
      >
        <h3>Haze</h3>
        <p class="subtitle">
          Haze the beams shine through. Saved in the show.
        </p>
      </uk-flex>
      <uk-flex center-h>
        <div>
          <h4>Density:</h4>
          <p class="subtitle">
            How bright beams look in the air. 0 hides them.
          </p>
        </div>
        <uk-spacer />
        <uk-num-input
          v-model="$show.visualizerHandle.hazeDensity"
          :min="0"
          :max="100"
          style="width: 100px"
        />
      </uk-flex>
      <div class="separator" />
      <uk-flex
        :gap="8"
        col
        class="title"
      >
        <h3>Lighting</h3>
        <p class="subtitle">
          Lighting emulation settings.
        </p>
      </uk-flex>
      <uk-flex center-h>
        <div>
          <h4>Global Brightness:</h4>
          <p class="subtitle">
            Global scene brightness.
          </p>
        </div>
        <uk-spacer />
        <uk-num-input
          v-model="$show.visualizerHandle.globalBrightness"
          :min="25"
          :max="100"
          style="width: 100px"
        />
      </uk-flex>
      <uk-flex center-h>
        <div>
          <h4>Exposure:</h4>
          <p class="subtitle">
            Brightness of the beams and their light, in %. 100 is physically accurate.
          </p>
        </div>
        <uk-spacer />
        <uk-num-input
          v-model="$show.visualizerHandle.exposure"
          :min="25"
          :max="400"
          style="width: 100px"
        />
      </uk-flex>
    </uk-flex>
  </uk-popup>
</template>

<script>
import PopupMixin from '@/views/mixins/popup.mixin';

export default {
  name: 'VisualizerPopup',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  mixins: [PopupMixin],
  data() {
    return {
      /**
       * Popup header data
       */
      headerData: { title: 'Visualizer settings' },
      /**
       * Quality setting labels, in Visualizer.QUALITY_OPTIONS order
       */
      qualityOptions: ['auto', 'guides', 'low', 'medium', 'high'],
      /**
       * Resolution scale labels, in RESOLUTION_SCALES order
       */
      scaleOptions: ['100%', '75%', '50%', '35%'],
      /**
       * Beam guides setting labels, in Visualizer.GUIDE_OPTIONS order
       */
      guideOptions: ['auto', 'on', 'off'],
    };
  },
  watch: {
    state(state) {
      if (state && !this.initialValues && this.$show.visualizerHandle) {
        this.initialValues = this.$show.visualizerHandle.showData;
      }
      if (state && this.$show.visualizerHandle) {
        const { quality, resolutionScale, beamGuides } = this.$show.visualizerHandle;
        this.initialQuality = { quality, resolutionScale, beamGuides };
      }
    },
  },
  mounted() {
    if (!this.initialValues && this.$show.visualizerHandle) {
      this.initialValues = this.$show.visualizerHandle.showData;
    }
  },
  methods: {
    /**
     * resets visualizer settings to initial values, prior to modifications
     *
       * @public
     */
    resetInitialValues() {
      this.$show.visualizerHandle.hazeDensity = this.initialValues.hazeDensity;
      this.$show.visualizerHandle.globalBrightness = this.initialValues.globalBrightness;
      this.$show.visualizerHandle.exposure = this.initialValues.exposure;
      if (this.initialQuality) {
        this.$show.visualizerHandle.quality = this.initialQuality.quality;
        this.$show.visualizerHandle.resolutionScale = this.initialQuality.resolutionScale;
        this.$show.visualizerHandle.beamGuides = this.initialQuality.beamGuides;
      }
      this.close();
    },
  },
};
</script>

<style scoped>
.body {
  padding: 10px;
  min-width: 400px;
  max-width: 400px;
  max-height: 40vh;
  overflow: auto;
}

.function_button {
  margin-top: 8px;
  margin-left: 8px;
}
.separator {
  margin: 4px 0;
  width: 100%;
}
.subtitle {
  font-family: Roboto-Regular;
  margin-bottom: 8px;
  color: var(--secondary-lighter-alt);
}
.title{
  border-bottom: 1px solid var(--primary-dark);
}
.title_icon {
  fill: var(--secondary-lighter);
}
h4 {
  margin-bottom: 4px;
}
</style>
