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
        center-h
      >
        <h3>Fogging</h3>
      </uk-flex>
      <p class="subtitle">
        Global scene fogging settings.
      </p>
      <uk-flex center-h>
        <div>
          <h4>State:</h4>
          <p class="subtitle">
            Turn global scene fogging on/off
          </p>
        </div>
        <uk-spacer />
        <uk-select-input
          v-model="$show.visualizerHandle.globalFoggingState"
          :min="0"
          :max="100"
          style="width: 100px"
          :options="['disabled', 'enabled']"
        />
      </uk-flex>
      <uk-flex center-h>
        <div>
          <h4>Density:</h4>
          <p class="subtitle">
            Sets the global scene fog density amount.
          </p>
        </div>
        <uk-spacer />
        <uk-num-input
          v-model="$show.visualizerHandle.globalFoggingDensity"
          :min="0"
          :max="100"
          style="width: 70px"
        />
      </uk-flex>
      <uk-flex center-h>
        <div>
          <h4>Turbulence:</h4>
          <p class="subtitle">
            Sets fog turbulence behavior over time.
          </p>
        </div>
        <uk-spacer />
        <uk-num-input
          v-model="$show.visualizerHandle.globalFoggingTurbulences"
          :min="0"
          :max="100"
          style="width: 70px"
        />
      </uk-flex>
      <div class="separator" />
      <uk-flex
        :gap="8"
        center-h
      >
        <h3>Lighting</h3>
      </uk-flex>
      <p class="subtitle">
        Lighting emulation settings.
      </p>
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
          style="width: 70px"
        />
      </uk-flex>
      <uk-flex center-h>
        <div>
          <h4>Volumetrics:</h4>
          <p class="subtitle">
            Volumetrics emulation mode
          </p>
        </div>
        <uk-spacer />
        <uk-select-input
          style="width: 100px"
          :options="['high', 'medium', 'low', 'disabled']"
        />
      </uk-flex>
      <uk-flex center-h>
        <div>
          <h4>Light Sources:</h4>
          <p class="subtitle">
            Light sources emulation settings
          </p>
        </div>
        <uk-spacer />
        <uk-select-input
          style="width: 100px"
          :options="['enabled', 'disabled']"
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
    };
  },
  watch: {
    state(state) {
      if (state && !this.initialValues && this.$show.visualizerHandle) {
        this.initialValues = this.$show.visualizerHandle.showData;
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
      this.$show.visualizerHandle.globalFoggingState = this.initialValues.globalFoggingState;
      this.$show.visualizerHandle.globalFoggingDensity = this.initialValues.globalFoggingDensity;
      // eslint-disable-next-line max-len
      this.$show.visualizerHandle.globalFoggingTurbulences = this.initialValues.globalFoggingTurbulences;
      this.$show.visualizerHandle.globalBrightness = this.initialValues.globalBrightness;
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
  margin: 8px 0;
  width: 100%;
  height: 1px;
  border-bottom: 1px solid var(--primary-dark);
}
.subtitle {
  font-family: Roboto-Regular;
  margin-bottom: 8px;
  color: var(--secondary-lighter-alt);
}
.title_icon {
  fill: var(--secondary-lighter);
}
h4 {
  margin-bottom: 4px;
}
</style>
