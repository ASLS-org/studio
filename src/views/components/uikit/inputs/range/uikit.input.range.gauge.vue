<template>
  <div class="uikit_gauge">
    <!-- <div
      v-if="label != null"
      class="label"
      style="margin-bottom: 10px"
    >
      {{ label }}
    </div> -->
    <div class="uikit_gauge_wrapper">
      <input
        ref="track"
        v-model="content"
        class="uikit_gauge_slider"
        type="range"
        :min="min"
        :max="max"
        :disabled="disabled"
        @input="updateValue(true)"
      >
    </div>
  </div>
  <h3
    v-if="label != null"
    :style="{ marginBottom: '8px' }"
    class="uikit_gauge_label"
    :class="{ disabled: disabled }"
  >
    {{ label }}
  </h3>
</template>

<script>
/**
 * @component Gauge slider/gauge which can be used in order to select values within a given range.
 * @namespace uikit/inputs/range
 * @story Default {"min": 0, "max": 100, "default": 0, "value": 50}
 * @story Disabled {"disabled":true}
 */
export default {
  name: 'UkGauge',
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  props: {
    /**
     * The gauge's text label value
     */
    label: {
      type: String,
      default: null,
    },
    /**
     * The gauge's minimum value
     */
    min: {
      type: Number,
      default: 0,
    },
    /**
     * The gauge's maximum value
     */
    max: {
      type: Number,
      default: 100,
    },
    /**
     * Gauge's track color
     */
    background: {
      type: String,
      default: 'var(--accent-maroon)',
    },
    /**
     * Whether the gauge is disabled or not
     */
    disabled: Boolean,
    /**
     * Actual gauge value
     */
    modelValue: {
      type: Number,
      default: 0,
    },
  },
  emits: ['update:modelValue', 'input'],
  data() {
    return {
      /**
       * The gauge's value (reactive)
       */
      content: this.modelValue,
    };
  },
  watch: {
    modelValue(value) {
      this.content = parseInt(value, 10);
      this.updateValue(false);
    },
    background(newVal) {
      this.$refs.track.style.background = newVal;
    },
  },
  mounted() {
    this.$refs.track.style.background = this.background;
  },
  methods: {
    /**
     * Updates the gauge's value
     *
       * @todo => implement the {Boolean}. It's been a while since I digged into this file.
     * doEmit wheter or not we want to emit changes to parent element.
     */
    updateValue(doEmit = true) {
      /**
       * Gauge's value changed
       *
       * @property {Number} content the gauge's actual value
       */
      if (doEmit) {
        this.$emit('update:modelValue', parseInt(this.content, 10));
        this.$emit('input', parseInt(this.content, 10));
      }
    },
  },
};
</script>

<style scoped>

.uikit_gauge {
  display: flex;
  flex-direction: column;
  user-select: none;
  align-items: center;
  justify-content: center;
  width: 70px;
  height: 100%;
}
.uikit_gauge_wrapper {
  display: flex;
  flex-direction: row;
  align-items: center;
  height: 100%;
  pointer-events: none;
}
.uikit_gauge_slider {
  -webkit-appearance: none;
  height: 10px;
  width: 110px;
  padding: 0;
  margin: 0;
  transform: rotate(-90deg);
  border-radius: 5px;
  background: linear-gradient(-90deg, var(--secondary-lighter) 0, var(--primary-light) 100%);
  box-shadow: inset 0px 4px 4px rgba(0, 0, 0, 0.25);
  cursor: pointer;
  pointer-events: auto;
}

.uikit_gauge_slider:disabled {
  -webkit-appearance: none;
  background: var(--secondary-darker);
  box-shadow: none;
}

/** Chrome Specific Range Styling */

.uikit_gauge_slider::-webkit-slider-runnable-track {
  -webkit-appearance: none;
  background: transparent;
  pointer-events: auto;
}

.uikit_gauge_slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  border: none;
  border-radius: 0;
  height: 8px;
  width: 20px;
  background: var(--secondary-lighter);
  clip-path: polygon(30% 50%, 70% 50%, 100% 0, 100% 100%, 70% 50%, 30% 50%, 0 100%, 0 0);
  transform: rotate(90deg);
  pointer-events: auto;
}
.uikit_gauge_slider:disabled::-webkit-slider-thumb {
  -webkit-appearance: none;
  background: var(--secondary-darker);
  pointer-events: auto;
}

/** Firefox Specific Range Styling */

.uikit_gauge_slider::-moz-range-track {
  -webkit-appearance: none;
  background: transparent;
  width: 0px;
  pointer-events: auto;
}
.uikit_gauge_slider::-moz-range-thumb {
  border: none;
  border-radius: 0;
  height: 8px;
  width: 26px;
  background: var(--secondary-lighter);
  clip-path: polygon(30% 50%, 70% 50%, 100% 0, 100% 100%, 70% 50%, 30% 50%, 0 100%, 0 0);
  transform: rotate(90deg);
  pointer-events: auto;
}
.uikit_gauge_slider:disabled::-moz-range-thumb {
  -webkit-appearance: none;
  background: var(--secondary-darker);
  pointer-events: auto;
}
.uikit_gauge_label {
  display: flex;
  justify-content: center;
}

</style>
