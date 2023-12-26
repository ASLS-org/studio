<template>
  <div class="uikit_gauge">
    <div class="label" style="margin-bottom: 10px" v-if="label != null">
      {{ label }}
    </div>
    <div class="uikit_gauge_wrapper">
      <input
        class="uikit_gauge_slider"
        @mousedown="propagateMD()"
        @mouseup="propagateMU()"
        ref="track"
        v-model="content"
        type="range"
        :min="min"
        :max="max"
        v-on:input="updateValue"
        :disabled="disabled"
      />
    </div>
  </div>
</template>

<script>
/**
 * @component Gauge  A virtual slider/gauge component which can be used in order to select values within a given range.
 * @namespace uikit/inputs/range
 * @story Default {"min": 0, "max": 100, "default": 0, "value": 50}
 * @story Disabled {"disabled":true}
 */
export default {
  name: "ukGauge",
  compatConfig: {
    // or, for full vue 3 compat in this component:
    MODE: 3,
  },
  emits:['update:modelValue','input'],
  props: {
    /**
     * The gauge's text label value
     */
    label: String,
    /**
     * The gauge's minimum value
     */
    min: Number,
    /**
     * The gauge's maximum value
     */
    max: Number,
    /**
     * Gauge's track color
     */
    background: String,
    /**
     * Whether the gauge is disabled or not
     */
    disabled: Boolean,
    /**
     * Actual gauge value
     */
    modelValue: Number,
  },
  data() {
    return {
      /**
       * The gauge's value (reactive)
       */
      content: this.modelValue,
    };
  },
  methods: {
    /**
     * Propagates mousedown event to parent element
     * TODO: Rmove this ? is it used elsewhere ? Why did I implement that ?
     *
       */
    propagateMD() {
      this.$emit("mousedown", null);
    },
    /**
    /**
     * Propagates mousedown event to parent element
     * TODO: Rmove this ? is it used elsewhere ? Why did I implement that ?
     *
       */
    propagateMU() {
      this.$emit("mouseup", null);
    },
    /**
     * Updates the gauge's value
     *
       * @todo => implement the {Boolean}. It's been a while since I digged into this file.
     * doEmit wheter or not we want to emit changes to parent element.
     */
    updateValue() {
      /**
       * Gauge's value changed
       *
       * @property {Number} content the gauge's actual value
       */
      this.$emit("update:modelValue", parseInt(this.content));
      this.$emit("input", parseInt(this.content));
    },
  },
  mounted() {
    this.$refs.track.style.background = this.background;
  },
  watch: {
    modelValue: function (newValue) {
      this.content = newValue;
    },
    background: function (newVal) {
      this.$refs.track.style.background = newVal;
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
  width: 40px;
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
  width: 140px;
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
</style>
